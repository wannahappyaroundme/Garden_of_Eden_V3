/**
 * Structured Logging Service (v3.6.0 P3)
 *
 * Provides structured JSON logging with tracing for better observability.
 *
 * Features:
 * - JSON formatted logs for log aggregation tools
 * - Span-based tracing for performance monitoring
 * - File rotation with tracing-appender
 * - Environment-based log level filtering
 * - Compatibility with existing log facade
 *
 * Log Levels:
 * - ERROR: Critical failures requiring immediate attention
 * - WARN: Potential issues that don't stop execution
 * - INFO: Important events (startup, requests, completions)
 * - DEBUG: Detailed debugging information
 * - TRACE: Very detailed trace information
 *
 * Usage:
 * ```rust
 * use tracing::{info, warn, error, instrument, span, Level};
 *
 * #[instrument(skip(self), fields(query = %query))]
 * async fn search(&self, query: &str) -> Result<Vec<Item>> {
 *     info!(results = items.len(), "Search completed");
 *     Ok(items)
 * }
 * ```
 */

use std::path::PathBuf;
use tracing::Level;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{
    fmt::{self, format::FmtSpan},
    layer::SubscriberExt,
    util::SubscriberInitExt,
    EnvFilter,
};

/// Logging configuration
#[derive(Debug, Clone)]
pub struct LoggingConfig {
    /// Log level (trace, debug, info, warn, error)
    pub level: String,
    /// Enable JSON formatted output
    pub json_format: bool,
    /// Enable file logging
    pub file_logging: bool,
    /// Log directory path
    pub log_dir: Option<PathBuf>,
    /// Enable span events (enter/exit)
    pub span_events: bool,
    /// Enable ANSI colors in console output
    pub ansi_colors: bool,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: "info".to_string(),
            json_format: false, // Human-readable by default for development
            file_logging: false,
            log_dir: None,
            span_events: false,
            ansi_colors: true,
        }
    }
}

impl LoggingConfig {
    /// Create production config with JSON logging
    pub fn production() -> Self {
        Self {
            level: "info".to_string(),
            json_format: true,
            file_logging: true,
            log_dir: dirs::data_dir().map(|d| d.join("garden-of-eden-v3").join("logs")),
            span_events: true,
            ansi_colors: false,
        }
    }

    /// Create development config with pretty printing
    pub fn development() -> Self {
        Self {
            level: "debug".to_string(),
            json_format: false,
            file_logging: false,
            log_dir: None,
            span_events: false,
            ansi_colors: true,
        }
    }
}

/// Initialize structured logging with the given configuration
///
/// This sets up a global tracing subscriber with:
/// - Environment-based filtering (RUST_LOG env var)
/// - Console output (pretty or JSON)
/// - Optional file output with rotation
///
/// # Example
/// ```rust
/// use crate::services::structured_logging::{init_logging, LoggingConfig};
///
/// // Development mode
/// init_logging(LoggingConfig::development()).expect("Failed to init logging");
///
/// // Production mode
/// init_logging(LoggingConfig::production()).expect("Failed to init logging");
/// ```
pub fn init_logging(config: LoggingConfig) -> anyhow::Result<()> {
    // Build environment filter from config or RUST_LOG env var
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            // Default filter based on config level
            EnvFilter::new(format!(
                "garden_of_eden_v3={},tauri={},reqwest=warn",
                config.level, config.level
            ))
        });

    // Determine span events to capture
    let span_events = if config.span_events {
        FmtSpan::NEW | FmtSpan::CLOSE
    } else {
        FmtSpan::NONE
    };

    if config.json_format {
        // JSON formatted logging for production/log aggregation
        let subscriber = tracing_subscriber::registry()
            .with(env_filter)
            .with(
                fmt::layer()
                    .json()
                    .with_span_events(span_events)
                    .with_current_span(true)
                    .with_thread_ids(true)
                    .with_file(true)
                    .with_line_number(true)
            );

        // Add file logging if enabled
        if config.file_logging {
            if let Some(log_dir) = &config.log_dir {
                std::fs::create_dir_all(log_dir)?;
                let file_appender = RollingFileAppender::new(
                    Rotation::DAILY,
                    log_dir,
                    "garden-of-eden.log",
                );
                let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

                // Note: We need to keep the guard alive for the duration of the program
                // In production, you'd store this in AppState
                std::mem::forget(_guard);

                let file_layer = fmt::layer()
                    .json()
                    .with_writer(non_blocking)
                    .with_ansi(false);

                subscriber.with(file_layer).try_init()?;
            } else {
                subscriber.try_init()?;
            }
        } else {
            subscriber.try_init()?;
        }
    } else {
        // Human-readable format for development
        let subscriber = tracing_subscriber::registry()
            .with(env_filter)
            .with(
                fmt::layer()
                    .with_span_events(span_events)
                    .with_target(true)
                    .with_thread_ids(false)
                    .with_file(false)
                    .with_line_number(false)
                    .with_ansi(config.ansi_colors)
                    .pretty()
            );

        subscriber.try_init()?;
    }

    // Log initialization
    tracing::info!(
        level = %config.level,
        json = config.json_format,
        file_logging = config.file_logging,
        "Structured logging initialized"
    );

    Ok(())
}

/// Initialize logging with auto-detection of environment
///
/// Uses production config if built in release mode, development otherwise.
pub fn init_logging_auto() -> anyhow::Result<()> {
    let config = if cfg!(debug_assertions) {
        LoggingConfig::development()
    } else {
        LoggingConfig::production()
    };
    init_logging(config)
}

// ============================================================================
// LOGGING MACROS AND HELPERS
// ============================================================================

/// Performance timing helper
///
/// Usage:
/// ```rust
/// let _timer = PerfTimer::new("database_query");
/// // ... do work ...
/// // Timer automatically logs duration when dropped
/// ```
pub struct PerfTimer {
    name: String,
    start: std::time::Instant,
}

impl PerfTimer {
    pub fn new(name: impl Into<String>) -> Self {
        let name = name.into();
        tracing::debug!(operation = %name, "Starting operation");
        Self {
            name,
            start: std::time::Instant::now(),
        }
    }
}

impl Drop for PerfTimer {
    fn drop(&mut self) {
        let duration = self.start.elapsed();
        tracing::info!(
            operation = %self.name,
            duration_ms = duration.as_millis() as u64,
            "Operation completed"
        );
    }
}

/// Log a structured event with custom fields
///
/// Example:
/// ```rust
/// log_event!("chat_message", user_id = "123", message_len = 100, "User sent message");
/// ```
#[macro_export]
macro_rules! log_event {
    ($event:expr, $($field:tt)*) => {
        tracing::info!(event = $event, $($field)*);
    };
}

/// Log an error with context
#[macro_export]
macro_rules! log_error {
    ($err:expr, $($field:tt)*) => {
        tracing::error!(error = %$err, $($field)*);
    };
}

// ============================================================================
// SPAN HELPERS FOR COMMON OPERATIONS
// ============================================================================

/// Create a span for database operations
pub fn db_span(operation: &str) -> tracing::Span {
    tracing::span!(Level::INFO, "database", operation = operation)
}

/// Create a span for AI/LLM operations
pub fn ai_span(model: &str, operation: &str) -> tracing::Span {
    tracing::span!(Level::INFO, "ai", model = model, operation = operation)
}

/// Create a span for RAG operations
pub fn rag_span(query_len: usize, top_k: usize) -> tracing::Span {
    tracing::span!(Level::INFO, "rag", query_len = query_len, top_k = top_k)
}

/// Create a span for tool execution
pub fn tool_span(tool_name: &str) -> tracing::Span {
    tracing::span!(Level::INFO, "tool", name = tool_name)
}

/// Create a span for embedding operations
pub fn embedding_span(text_len: usize) -> tracing::Span {
    tracing::span!(Level::DEBUG, "embedding", text_len = text_len)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = LoggingConfig::default();
        assert_eq!(config.level, "info");
        assert!(!config.json_format);
        assert!(!config.file_logging);
    }

    #[test]
    fn test_production_config() {
        let config = LoggingConfig::production();
        assert!(config.json_format);
        assert!(config.file_logging);
        assert!(config.log_dir.is_some());
    }

    #[test]
    fn test_development_config() {
        let config = LoggingConfig::development();
        assert_eq!(config.level, "debug");
        assert!(!config.json_format);
        assert!(config.ansi_colors);
    }

    #[test]
    fn test_perf_timer() {
        let timer = PerfTimer::new("test_operation");
        std::thread::sleep(std::time::Duration::from_millis(10));
        drop(timer);
        // Timer logs on drop - we just verify it doesn't panic
    }
}

/**
 * Crash Reporting Service (v3.4.0 - Enhanced)
 *
 * Privacy-first error reporting with user opt-in
 * - Captures panics and errors with backtrace
 * - Local crash log storage (always enabled)
 * - Optional Sentry reporting (opt-in only)
 * - Provides user control over crash reporting
 * - Sanitizes sensitive data before sending
 */

use anyhow::{anyhow, Result};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::fs;
use std::panic;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Crash report data (sanitized)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrashReport {
    pub timestamp: i64,
    pub error_message: String,
    pub error_type: String,
    pub stack_trace: Option<String>,
    pub app_version: String,
    pub os_version: String,
    pub context: Option<String>,
}

/// Crash reporting settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrashReportingSettings {
    pub enabled: bool,
    pub send_diagnostics: bool,
    pub send_performance_data: bool,
}

impl Default for CrashReportingSettings {
    fn default() -> Self {
        Self {
            enabled: false, // Privacy-first: opt-in by default
            send_diagnostics: false,
            send_performance_data: false,
        }
    }
}

/// Crash Reporter Service
pub struct CrashReporterService {
    settings: Mutex<CrashReportingSettings>,
    sentry_dsn: Option<String>,
    crash_log_dir: PathBuf,
    initialized: bool,
}

impl CrashReporterService {
    /// Create new crash reporter service
    pub fn new(crash_log_dir: PathBuf) -> Self {
        // Create crash log directory if it doesn't exist
        if let Err(e) = fs::create_dir_all(&crash_log_dir) {
            error!("Failed to create crash log directory: {}", e);
        }

        Self {
            settings: Mutex::new(CrashReportingSettings::default()),
            sentry_dsn: None,
            crash_log_dir,
            initialized: false,
        }
    }

    /// Setup panic handler to capture crashes (v3.4.0)
    ///
    /// This should be called early in the application startup
    pub fn setup_panic_handler(service: Arc<Mutex<Self>>) {
        let default_hook = panic::take_hook();

        panic::set_hook(Box::new(move |panic_info| {
            // Call the default hook first (prints to stderr)
            default_hook(panic_info);

            // Extract panic information
            let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
                s.to_string()
            } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
                s.clone()
            } else {
                "Unknown panic".to_string()
            };

            let location = if let Some(loc) = panic_info.location() {
                format!("{}:{}:{}", loc.file(), loc.line(), loc.column())
            } else {
                "Unknown location".to_string()
            };

            // Get backtrace (requires RUST_BACKTRACE=1)
            let backtrace = std::backtrace::Backtrace::force_capture();
            let backtrace_str = format!("{:?}", backtrace);

            error!("🔥 PANIC DETECTED: {} at {}", message, location);
            error!("Backtrace:\n{}", backtrace_str);

            // Save crash report to local file
            if let Ok(service_lock) = service.lock() {
                let crash_report = Self::create_crash_report(
                    &message,
                    "Panic",
                    Some(backtrace_str.clone()),
                    Some(location.clone()),
                );

                // Save to local file (always, regardless of user settings)
                if let Err(e) = service_lock.save_crash_report_to_file(&crash_report) {
                    error!("Failed to save crash report: {}", e);
                }

                // Send to Sentry if enabled (opt-in)
                if service_lock.is_enabled() {
                    if let Err(e) = service_lock.report_error(&message, Some(&location)) {
                        error!("Failed to send crash report to Sentry: {}", e);
                    }
                }
            }

            // Note: The application will still terminate after this hook
            // Tauri will attempt to restart the app if configured to do so
        }));

        info!("✓ Panic handler installed successfully");
    }

    /// Initialize Sentry (only if user opted in)
    pub fn initialize(&mut self, dsn: Option<String>) -> Result<()> {
        if self.initialized {
            warn!("Crash reporter already initialized");
            return Ok(());
        }

        let settings = self.settings.lock().unwrap();
        if !settings.enabled {
            info!("Crash reporting disabled by user");
            return Ok(());
        }

        if let Some(dsn_value) = dsn.clone() {
            info!("Initializing Sentry crash reporting...");

            // In production, initialize Sentry here:
            // let _guard = sentry::init((
            //     dsn_value.as_str(),
            //     sentry::ClientOptions {
            //         release: Some(env!("CARGO_PKG_VERSION").into()),
            //         ..Default::default()
            //     },
            // ));

            self.sentry_dsn = Some(dsn_value);
            self.initialized = true;

            info!("Sentry crash reporting initialized");
        } else {
            warn!("No Sentry DSN provided, crash reporting disabled");
        }

        Ok(())
    }

    /// Check if crash reporting is enabled
    pub fn is_enabled(&self) -> bool {
        let settings = self.settings.lock().unwrap();
        settings.enabled && self.initialized
    }

    /// Enable crash reporting (user opt-in)
    pub fn enable(&self) -> Result<()> {
        let mut settings = self.settings.lock().unwrap();
        settings.enabled = true;
        info!("Crash reporting enabled by user");
        Ok(())
    }

    /// Disable crash reporting (user opt-out)
    pub fn disable(&self) -> Result<()> {
        let mut settings = self.settings.lock().unwrap();
        settings.enabled = false;
        info!("Crash reporting disabled by user");
        Ok(())
    }

    /// Get current settings
    pub fn get_settings(&self) -> CrashReportingSettings {
        self.settings.lock().unwrap().clone()
    }

    /// Update settings
    pub fn update_settings(&self, new_settings: CrashReportingSettings) -> Result<()> {
        let mut settings = self.settings.lock().unwrap();
        *settings = new_settings;
        info!("Crash reporting settings updated");
        Ok(())
    }

    /// Report an error (manual capture)
    pub fn report_error(&self, error_message: &str, context: Option<&str>) -> Result<()> {
        if !self.is_enabled() {
            return Ok(()); // Silently skip if disabled
        }

        info!("Reporting error: {}", error_message);

        // In production, use sentry::capture_message or sentry::capture_error
        // sentry::capture_message(error_message, sentry::Level::Error);

        // For now, just log locally
        error!("Error captured: {} (context: {:?})", error_message, context);

        Ok(())
    }

    /// Sanitize error message (remove sensitive data)
    pub fn sanitize_error_message(message: &str) -> String {
        // Remove potential file paths, API keys, tokens, etc.
        let sanitized = message
            .replace(std::env::var("HOME").unwrap_or_default().as_str(), "$HOME")
            .replace(std::env::var("USER").unwrap_or_default().as_str(), "$USER");

        // Remove patterns that look like API keys or tokens
        let re = regex::Regex::new(r"[a-fA-F0-9]{32,}").unwrap();
        re.replace_all(&sanitized, "[REDACTED]").to_string()
    }

    /// Create crash report object
    pub fn create_crash_report(
        error_message: &str,
        error_type: &str,
        stack_trace: Option<String>,
        context: Option<String>,
    ) -> CrashReport {
        let sanitized_message = Self::sanitize_error_message(error_message);
        let sanitized_trace = stack_trace.map(|t| Self::sanitize_error_message(&t));
        let sanitized_context = context.map(|c| Self::sanitize_error_message(&c));

        CrashReport {
            timestamp: chrono::Utc::now().timestamp(),
            error_message: sanitized_message,
            error_type: error_type.to_string(),
            stack_trace: sanitized_trace,
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            os_version: Self::get_os_version(),
            context: sanitized_context,
        }
    }

    /// Get OS version
    fn get_os_version() -> String {
        std::env::consts::OS.to_string()
    }

    /// Save crash report to local file (v3.4.0)
    ///
    /// Always saves locally, regardless of user opt-in settings
    pub fn save_crash_report_to_file(&self, report: &CrashReport) -> Result<()> {
        // Create filename with timestamp
        let filename = format!("crash_{}_{}.json", report.timestamp, report.error_type);
        let file_path = self.crash_log_dir.join(filename);

        // Serialize to JSON
        let json = serde_json::to_string_pretty(report)?;

        // Write to file
        fs::write(&file_path, json)?;

        info!("Crash report saved to: {:?}", file_path);
        Ok(())
    }

    /// Get list of all local crash reports (v3.4.0)
    pub fn get_local_crash_reports(&self) -> Result<Vec<CrashReport>> {
        let mut reports = Vec::new();

        // Read all JSON files from crash log directory
        if let Ok(entries) = fs::read_dir(&self.crash_log_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(report) = serde_json::from_str::<CrashReport>(&content) {
                            reports.push(report);
                        }
                    }
                }
            }
        }

        // Sort by timestamp (newest first)
        reports.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        Ok(reports)
    }

    /// Delete old crash reports (older than retention_days) (v3.4.0)
    pub fn cleanup_old_crash_reports(&self, retention_days: i64) -> Result<usize> {
        let cutoff_timestamp = chrono::Utc::now().timestamp() - (retention_days * 86400);
        let mut deleted_count = 0;

        if let Ok(entries) = fs::read_dir(&self.crash_log_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(report) = serde_json::from_str::<CrashReport>(&content) {
                            if report.timestamp < cutoff_timestamp {
                                if fs::remove_file(&path).is_ok() {
                                    deleted_count += 1;
                                    info!("Deleted old crash report: {:?}", path);
                                }
                            }
                        }
                    }
                }
            }
        }

        info!("Cleaned up {} old crash reports", deleted_count);
        Ok(deleted_count)
    }

    /// Test crash reporting (for debugging)
    pub fn test_crash_report(&self) -> Result<()> {
        if !self.is_enabled() {
            return Err(anyhow!("Crash reporting is disabled"));
        }

        self.report_error("Test crash report", Some("test_context"))?;
        Ok(())
    }
}

impl Default for CrashReporterService {
    fn default() -> Self {
        // Use a default crash log directory (~/Library/Logs/garden-of-eden-v3/crashes or similar)
        let crash_log_dir = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("garden-of-eden-v3")
            .join("crashes");
        Self::new(crash_log_dir)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_service() {
        let service = CrashReporterService::new();
        assert!(!service.is_enabled());
    }

    #[test]
    fn test_default_settings() {
        let settings = CrashReportingSettings::default();
        assert!(!settings.enabled);
        assert!(!settings.send_diagnostics);
        assert!(!settings.send_performance_data);
    }

    #[test]
    fn test_enable_disable() {
        let service = CrashReporterService::new();
        assert!(!service.is_enabled());

        service.enable().unwrap();
        let settings = service.get_settings();
        assert!(settings.enabled);

        service.disable().unwrap();
        let settings = service.get_settings();
        assert!(!settings.enabled);
    }

    #[test]
    fn test_sanitize_error_message() {
        // Use current user's HOME to test replacement
        let home = std::env::var("HOME").unwrap_or("/Users/testuser".to_string());
        let message = format!("Error at {}/secret/api_key_123456789abcdef0123456789abcdef0", home);
        let sanitized = CrashReporterService::sanitize_error_message(&message);

        // Should replace HOME path
        assert!(!sanitized.contains(&home));
        assert!(sanitized.contains("$HOME"));
        // Should redact API key-like patterns
        assert!(sanitized.contains("[REDACTED]"));
    }

    #[test]
    fn test_create_crash_report() {
        let report = CrashReporterService::create_crash_report(
            "Test error",
            "RuntimeError",
            Some("Stack trace here".to_string()),
            Some("Test context".to_string()),
        );

        assert_eq!(report.error_message, "Test error");
        assert_eq!(report.error_type, "RuntimeError");
        assert!(report.stack_trace.is_some());
        assert!(report.context.is_some());
        assert!(!report.app_version.is_empty());
    }

    #[test]
    fn test_get_os_version() {
        let os = CrashReporterService::get_os_version();
        assert!(!os.is_empty());
    }

    #[test]
    fn test_update_settings() {
        let service = CrashReporterService::new();

        let new_settings = CrashReportingSettings {
            enabled: true,
            send_diagnostics: true,
            send_performance_data: false,
        };

        service.update_settings(new_settings.clone()).unwrap();
        let settings = service.get_settings();

        assert_eq!(settings.enabled, new_settings.enabled);
        assert_eq!(settings.send_diagnostics, new_settings.send_diagnostics);
        assert_eq!(settings.send_performance_data, new_settings.send_performance_data);
    }
}

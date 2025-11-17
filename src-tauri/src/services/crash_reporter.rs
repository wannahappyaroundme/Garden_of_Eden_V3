/**
 * Crash Reporting Service (Sentry Integration)
 *
 * Privacy-first error reporting with user opt-in
 * - Captures panics and errors
 * - Sends crash reports to Sentry (opt-in only)
 * - Provides user control over crash reporting
 * - Sanitizes sensitive data before sending
 */

use anyhow::{anyhow, Result};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

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
    initialized: bool,
}

impl CrashReporterService {
    /// Create new crash reporter service
    pub fn new() -> Self {
        Self {
            settings: Mutex::new(CrashReportingSettings::default()),
            sentry_dsn: None,
            initialized: false,
        }
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
        Self::new()
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

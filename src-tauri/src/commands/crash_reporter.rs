/**
 * Crash Reporter Commands for Tauri (v3.4.0 - Enhanced)
 *
 * Exposes crash reporting controls to the frontend
 */

use crate::services::crash_reporter::{CrashReport, CrashReporterService, CrashReportingSettings};
use log::{error, info};
use std::sync::{Arc, Mutex};
use tauri::State;

/// Global crash reporter service state (v3.4.0 - Updated with Arc)
pub struct CrashReporterState {
    pub service: Arc<Mutex<CrashReporterService>>,
}

/// Check if crash reporting is enabled
#[tauri::command]
pub async fn crash_reporter_is_enabled(
    state: State<'_, CrashReporterState>,
) -> Result<bool, String> {
    info!("Command: crash_reporter_is_enabled");

    let service = state.service.lock().unwrap();
    Ok(service.is_enabled())
}

/// Enable crash reporting (user opt-in)
#[tauri::command]
pub async fn crash_reporter_enable(
    state: State<'_, CrashReporterState>,
) -> Result<(), String> {
    info!("Command: crash_reporter_enable");

    let service = state.service.lock().unwrap();
    service.enable().map_err(|e| {
        error!("Failed to enable crash reporting: {}", e);
        format!("Failed to enable crash reporting: {}", e)
    })
}

/// Disable crash reporting (user opt-out)
#[tauri::command]
pub async fn crash_reporter_disable(
    state: State<'_, CrashReporterState>,
) -> Result<(), String> {
    info!("Command: crash_reporter_disable");

    let service = state.service.lock().unwrap();
    service.disable().map_err(|e| {
        error!("Failed to disable crash reporting: {}", e);
        format!("Failed to disable crash reporting: {}", e)
    })
}

/// Get current crash reporting settings
#[tauri::command]
pub async fn crash_reporter_get_settings(
    state: State<'_, CrashReporterState>,
) -> Result<CrashReportingSettings, String> {
    info!("Command: crash_reporter_get_settings");

    let service = state.service.lock().unwrap();
    Ok(service.get_settings())
}

/// Update crash reporting settings
#[tauri::command]
pub async fn crash_reporter_update_settings(
    state: State<'_, CrashReporterState>,
    settings: CrashReportingSettings,
) -> Result<(), String> {
    info!("Command: crash_reporter_update_settings");

    let service = state.service.lock().unwrap();
    service.update_settings(settings).map_err(|e| {
        error!("Failed to update crash reporting settings: {}", e);
        format!("Failed to update settings: {}", e)
    })
}

/// Report an error manually
#[tauri::command]
pub async fn crash_reporter_report_error(
    state: State<'_, CrashReporterState>,
    error_message: String,
    context: Option<String>,
) -> Result<(), String> {
    info!("Command: crash_reporter_report_error");

    let service = state.service.lock().unwrap();
    service
        .report_error(&error_message, context.as_deref())
        .map_err(|e| {
            error!("Failed to report error: {}", e);
            format!("Failed to report error: {}", e)
        })
}

/// Test crash reporting (for debugging)
#[tauri::command]
pub async fn crash_reporter_test(
    state: State<'_, CrashReporterState>,
) -> Result<(), String> {
    info!("Command: crash_reporter_test");

    let service = state.service.lock().unwrap();
    service.test_crash_report().map_err(|e| {
        error!("Failed to test crash reporting: {}", e);
        format!("Failed to test crash reporting: {}", e)
    })
}

/// Get all local crash reports (v3.4.0)
#[tauri::command]
pub async fn crash_reporter_get_local_reports(
    state: State<'_, CrashReporterState>,
) -> Result<Vec<CrashReport>, String> {
    info!("Command: crash_reporter_get_local_reports");

    let service = state.service.lock().unwrap();
    service.get_local_crash_reports().map_err(|e| {
        error!("Failed to get local crash reports: {}", e);
        format!("Failed to get crash reports: {}", e)
    })
}

/// Cleanup old crash reports (v3.4.0)
#[tauri::command]
pub async fn crash_reporter_cleanup_old_reports(
    state: State<'_, CrashReporterState>,
    retention_days: i64,
) -> Result<usize, String> {
    info!("Command: crash_reporter_cleanup_old_reports - retention: {} days", retention_days);

    let service = state.service.lock().unwrap();
    service.cleanup_old_crash_reports(retention_days).map_err(|e| {
        error!("Failed to cleanup old crash reports: {}", e);
        format!("Failed to cleanup crash reports: {}", e)
    })
}

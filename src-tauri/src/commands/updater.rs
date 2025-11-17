/**
 * Auto-Updater Commands for Tauri
 *
 * Exposes update checking and installation to the frontend
 */

use crate::services::updater::{UpdateCheckResult, UpdaterService};
use log::{error, info};

/// Get current application version
#[tauri::command]
pub async fn updater_get_version() -> Result<String, String> {
    info!("Command: updater_get_version");
    Ok(UpdaterService::get_current_version())
}

/// Check for available updates
#[tauri::command]
pub async fn updater_check_for_updates() -> Result<UpdateCheckResult, String> {
    info!("Command: updater_check_for_updates");

    // In a real implementation, this would use tauri-plugin-updater
    // For now, return a placeholder result
    let current_version = UpdaterService::get_current_version();

    Ok(UpdateCheckResult {
        available: false,
        current_version,
        latest_version: None,
        release_notes: None,
        download_url: None,
    })
}

/// Install available update
#[tauri::command]
pub async fn updater_install_update() -> Result<(), String> {
    info!("Command: updater_install_update");

    // In a real implementation, this would trigger the update installation
    // using tauri-plugin-updater's install_update() method

    Err("Update installation not yet implemented".to_string())
}

/// Set auto-update check interval (in hours)
#[tauri::command]
pub async fn updater_set_check_interval(hours: u64) -> Result<(), String> {
    info!("Command: updater_set_check_interval - {} hours", hours);

    // This would update the service's check interval
    // For now, just validate the input
    if hours == 0 || hours > 168 {
        // Max 1 week
        return Err("Invalid interval: must be between 1 and 168 hours".to_string());
    }

    Ok(())
}

/// Get update endpoint URL
#[tauri::command]
pub async fn updater_get_endpoint() -> Result<String, String> {
    info!("Command: updater_get_endpoint");
    Ok(UpdaterService::get_update_endpoint())
}

/// Compare two versions
#[tauri::command]
pub async fn updater_is_newer_version(current: String, latest: String) -> Result<bool, String> {
    info!("Command: updater_is_newer_version - {} vs {}", current, latest);

    UpdaterService::is_newer_version(&current, &latest)
        .map_err(|e| {
            error!("Failed to compare versions: {}", e);
            format!("Failed to compare versions: {}", e)
        })
}

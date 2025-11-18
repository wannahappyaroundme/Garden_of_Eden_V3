/**
 * Auto-Updater Commands for Tauri (v3.4.0)
 *
 * Exposes update checking and installation to the frontend using tauri-plugin-updater
 */

use crate::services::updater::{UpdateCheckResult, UpdaterService};
use log::{error, info, warn};
use tauri::{AppHandle, Manager};
use tauri_plugin_updater::UpdaterExt;

/// Get current application version
#[tauri::command]
pub async fn updater_get_version() -> Result<String, String> {
    info!("Command: updater_get_version");
    Ok(UpdaterService::get_current_version())
}

/// Check for available updates (v3.4.0 - Full Implementation)
#[tauri::command]
pub async fn updater_check_for_updates(app: AppHandle) -> Result<UpdateCheckResult, String> {
    info!("Command: updater_check_for_updates");

    let current_version = UpdaterService::get_current_version();

    // Use tauri-plugin-updater to check for updates
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    info!("Update available: {} -> {}", current_version, update.version);
                    Ok(UpdateCheckResult {
                        available: true,
                        current_version: current_version.clone(),
                        latest_version: Some(update.version.clone()),
                        release_notes: update.body.clone(),
                        download_url: Some(update.download_url.clone()),
                    })
                }
                Ok(None) => {
                    info!("No update available (current: {})", current_version);
                    Ok(UpdateCheckResult {
                        available: false,
                        current_version,
                        latest_version: None,
                        release_notes: None,
                        download_url: None,
                    })
                }
                Err(e) => {
                    error!("Failed to check for updates: {}", e);
                    Err(format!("Failed to check for updates: {}", e))
                }
            }
        }
        Err(e) => {
            error!("Failed to initialize updater: {}", e);
            Err(format!("Updater not available: {}", e))
        }
    }
}

/// Install available update (v3.4.0 - Full Implementation)
#[tauri::command]
pub async fn updater_install_update(app: AppHandle) -> Result<(), String> {
    info!("Command: updater_install_update");

    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    info!("Downloading and installing update: {}", update.version);

                    // Download and install the update
                    match update.download_and_install(
                        |chunk_length, content_length| {
                            // Emit download progress event
                            if let Some(total) = content_length {
                                let progress = (chunk_length as f64 / total as f64) * 100.0;
                                info!("Download progress: {:.2}%", progress);
                                let _ = app.emit("updater://download-progress", progress);
                            }
                        },
                        || {
                            // Called when download is complete
                            info!("Update download complete, installing...");
                            let _ = app.emit("updater://installing", ());
                        }
                    ).await {
                        Ok(_) => {
                            info!("Update installed successfully, app will restart");
                            Ok(())
                        }
                        Err(e) => {
                            error!("Failed to download/install update: {}", e);
                            Err(format!("Failed to install update: {}", e))
                        }
                    }
                }
                Ok(None) => {
                    warn!("No update available to install");
                    Err("No update available".to_string())
                }
                Err(e) => {
                    error!("Failed to check for updates before install: {}", e);
                    Err(format!("Failed to check for updates: {}", e))
                }
            }
        }
        Err(e) => {
            error!("Failed to initialize updater: {}", e);
            Err(format!("Updater not available: {}", e))
        }
    }
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

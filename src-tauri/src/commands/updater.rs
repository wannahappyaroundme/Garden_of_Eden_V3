/**
 * Auto-Updater Commands for Tauri (v3.4.0)
 *
 * Exposes update checking and installation to the frontend using tauri-plugin-updater
 */

use crate::services::updater::{UpdateChannel, UpdateCheckResult, UpdaterService};
use crate::AppState;
use log::{error, info, warn};
use tauri::{AppHandle, Emitter, Manager, State};
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
                        download_url: Some(update.download_url.to_string()),
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

/// Get current update channel (v3.5.0)
#[tauri::command]
pub async fn updater_get_channel(state: State<'_, AppState>) -> Result<String, String> {
    info!("Command: updater_get_channel");

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Get channel from database (default to 'stable' if not found)
    let channel: String = conn
        .query_row(
            "SELECT channel FROM update_settings WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| {
            // Initialize default settings if not exists
            let _ = conn.execute(
                "INSERT OR IGNORE INTO update_settings (id, channel) VALUES (1, 'stable')",
                [],
            );
            "stable".to_string()
        });

    info!("Current update channel: {}", channel);
    Ok(channel)
}

/// Set update channel (v3.5.0)
#[tauri::command]
pub async fn updater_set_channel(state: State<'_, AppState>, channel: String) -> Result<(), String> {
    info!("Command: updater_set_channel - {}", channel);

    // Validate channel
    let update_channel = UpdateChannel::from_str(&channel)
        .map_err(|e| {
            error!("Invalid channel: {}", e);
            format!("Invalid channel: {}", e)
        })?;

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Initialize settings row if not exists
    conn.execute(
        "INSERT OR IGNORE INTO update_settings (id, channel) VALUES (1, 'stable')",
        [],
    )
    .map_err(|e| {
        error!("Failed to initialize update settings: {}", e);
        format!("Database error: {}", e)
    })?;

    // Update channel
    conn.execute(
        "UPDATE update_settings SET channel = ?1 WHERE id = 1",
        [update_channel.as_str()],
    )
    .map_err(|e| {
        error!("Failed to update channel: {}", e);
        format!("Failed to set update channel: {}", e)
    })?;

    info!("Update channel set to: {}", update_channel.as_str());
    Ok(())
}

/// Get update scheduling settings (v3.5.0)
#[tauri::command]
pub async fn updater_get_schedule_settings(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: updater_get_schedule_settings");

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Get settings from database
    let settings = conn
        .query_row(
            "SELECT auto_check, check_interval, download_in_background, bandwidth_limit, last_check
             FROM update_settings WHERE id = 1",
            [],
            |row| {
                Ok(serde_json::json!({
                    "auto_check": row.get::<_, bool>(0)?,
                    "check_interval": row.get::<_, i64>(1)?,
                    "download_in_background": row.get::<_, bool>(2)?,
                    "bandwidth_limit": row.get::<_, Option<i64>>(3)?,
                    "last_check": row.get::<_, Option<i64>>(4)?
                }))
            },
        )
        .unwrap_or_else(|_| {
            // Return defaults if not found
            serde_json::json!({
                "auto_check": true,
                "check_interval": 3600,
                "download_in_background": false,
                "bandwidth_limit": null,
                "last_check": null
            })
        });

    info!("Update schedule settings retrieved");
    Ok(settings)
}

/// Update scheduling settings (v3.5.0)
#[tauri::command]
pub async fn updater_update_schedule_settings(
    state: State<'_, AppState>,
    auto_check: Option<bool>,
    check_interval: Option<i64>,
    download_in_background: Option<bool>,
    bandwidth_limit: Option<i64>,
) -> Result<(), String> {
    info!("Command: updater_update_schedule_settings");

    // Validate check_interval if provided
    if let Some(interval) = check_interval {
        if interval < 60 || interval > 604800 {
            // Min 1 minute, Max 1 week
            return Err("Invalid interval: must be between 60 and 604800 seconds".to_string());
        }
    }

    // Validate bandwidth_limit if provided
    if let Some(limit) = bandwidth_limit {
        if limit < 0 {
            return Err("Bandwidth limit must be non-negative".to_string());
        }
    }

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Initialize settings row if not exists
    conn.execute(
        "INSERT OR IGNORE INTO update_settings (id, channel) VALUES (1, 'stable')",
        [],
    )
    .map_err(|e| {
        error!("Failed to initialize update settings: {}", e);
        format!("Database error: {}", e)
    })?;

    // Update each field if provided
    if let Some(enabled) = auto_check {
        conn.execute(
            "UPDATE update_settings SET auto_check = ?1 WHERE id = 1",
            [enabled],
        )
        .map_err(|e| format!("Failed to update auto_check: {}", e))?;
        info!("Auto-check set to: {}", enabled);
    }

    if let Some(interval) = check_interval {
        conn.execute(
            "UPDATE update_settings SET check_interval = ?1 WHERE id = 1",
            [interval],
        )
        .map_err(|e| format!("Failed to update check_interval: {}", e))?;
        info!("Check interval set to: {} seconds", interval);
    }

    if let Some(background) = download_in_background {
        conn.execute(
            "UPDATE update_settings SET download_in_background = ?1 WHERE id = 1",
            [background],
        )
        .map_err(|e| format!("Failed to update download_in_background: {}", e))?;
        info!("Download in background set to: {}", background);
    }

    if let Some(limit) = bandwidth_limit {
        conn.execute(
            "UPDATE update_settings SET bandwidth_limit = ?1 WHERE id = 1",
            [limit],
        )
        .map_err(|e| format!("Failed to update bandwidth_limit: {}", e))?;
        info!("Bandwidth limit set to: {} KB/s", limit);
    }

    info!("Update schedule settings updated successfully");
    Ok(())
}

/// Mark last update check timestamp (v3.5.0)
#[tauri::command]
pub async fn updater_mark_last_check(state: State<'_, AppState>) -> Result<(), String> {
    info!("Command: updater_mark_last_check");

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "INSERT OR IGNORE INTO update_settings (id, channel) VALUES (1, 'stable')",
        [],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    conn.execute(
        "UPDATE update_settings SET last_check = ?1 WHERE id = 1",
        [now],
    )
    .map_err(|e| format!("Failed to update last_check: {}", e))?;

    info!("Last check timestamp updated to: {}", now);
    Ok(())
}

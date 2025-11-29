/**
 * Proactive Mode Commands (v3.6.0)
 *
 * Tauri commands for AI-Led proactive monitoring:
 * - Start/stop background screen monitoring
 * - Configure trigger thresholds and intervals
 * - Get proactive suggestions
 */

use crate::AppState;
use crate::services::proactive_manager::{ProactiveConfig, ProactiveSuggestion};
use log::info;
use tauri::{command, State, AppHandle, Emitter};

/// Start proactive monitoring
#[command]
pub async fn proactive_start(
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<bool, String> {
    info!("Command: proactive_start");

    let manager = state.proactive_manager.lock().await;

    // Set app_handle for event emission
    manager.set_app_handle(app_handle).await;

    manager.start().await
        .map(|_| true)
        .map_err(|e| e.to_string())
}

/// Stop proactive monitoring
#[command]
pub async fn proactive_stop(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    info!("Command: proactive_stop");

    let manager = state.proactive_manager.lock().await;
    manager.stop()
        .map(|_| false)
        .map_err(|e| e.to_string())
}

/// Toggle proactive monitoring
#[command]
pub async fn proactive_toggle(
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<bool, String> {
    info!("Command: proactive_toggle");

    let manager = state.proactive_manager.lock().await;

    // Set app_handle for event emission
    manager.set_app_handle(app_handle).await;

    manager.toggle().await
        .map_err(|e| e.to_string())
}

/// Get proactive monitoring status
#[command]
pub async fn proactive_status(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    info!("Command: proactive_status");

    let manager = state.proactive_manager.lock().await;
    let is_active = manager.is_active();
    let config = manager.get_config();

    Ok(serde_json::json!({
        "is_active": is_active,
        "config": config,
    }))
}

/// Update proactive configuration
#[command]
pub async fn proactive_update_config(
    state: State<'_, AppState>,
    config: ProactiveConfig,
) -> Result<bool, String> {
    info!("Command: proactive_update_config");

    let manager = state.proactive_manager.lock().await;
    manager.update_config(config)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

/// Get current proactive configuration
#[command]
pub async fn proactive_get_config(
    state: State<'_, AppState>,
) -> Result<ProactiveConfig, String> {
    info!("Command: proactive_get_config");

    let manager = state.proactive_manager.lock().await;
    Ok(manager.get_config())
}

/// Dismiss a proactive suggestion
#[command]
pub async fn proactive_dismiss_suggestion(
    _state: State<'_, AppState>,
    suggestion_id: String,
) -> Result<bool, String> {
    info!("Command: proactive_dismiss_suggestion - {}", suggestion_id);

    // For now, just acknowledge the dismissal
    // In the future, this could update analytics or learn from user preferences
    Ok(true)
}

/// Accept a proactive suggestion (user wants to act on it)
#[command]
pub async fn proactive_accept_suggestion(
    _state: State<'_, AppState>,
    suggestion_id: String,
) -> Result<serde_json::Value, String> {
    info!("Command: proactive_accept_suggestion - {}", suggestion_id);

    // Return the suggestion details for the frontend to handle
    // The frontend will then initiate the appropriate action
    Ok(serde_json::json!({
        "accepted": true,
        "suggestion_id": suggestion_id,
        "action": "open_chat",  // Default action is to open chat with the suggestion
    }))
}

/// Emit a proactive suggestion event to the frontend
/// This is called internally by the ProactiveManager
#[allow(dead_code)]
pub fn emit_proactive_suggestion(
    app_handle: &AppHandle,
    suggestion: &ProactiveSuggestion,
) -> Result<(), String> {
    app_handle.emit("proactive-suggestion", suggestion)
        .map_err(|e| format!("Failed to emit proactive suggestion: {}", e))
}

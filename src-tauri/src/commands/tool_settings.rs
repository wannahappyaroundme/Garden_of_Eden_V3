/// Tool Settings IPC Commands (v3.3.0)
///
/// Provides Tauri commands for frontend to interact with the ToolSettingsService.
/// Enables the Tool Settings UI panel to read and modify tool configurations.

use tauri::State;
use serde_json::Value;
use std::collections::HashMap;
use crate::services::tool_settings::{ToolSettingsService, ToolSettings};
use crate::AppState;

/// Get all tool settings
///
/// # Returns
/// * `HashMap<String, ToolSettings>` - Map of tool names to their settings
#[tauri::command]
pub async fn get_all_tool_settings(
    state: State<'_, AppState>,
) -> Result<HashMap<String, ToolSettings>, String> {
    let service = state.tool_settings_service.lock().await;
    service.get_all_settings()
        .map_err(|e| format!("Failed to get all tool settings: {}", e))
}

/// Get settings for a specific tool
///
/// # Arguments
/// * `tool_name` - Name of the tool (e.g., "web_search", "read_file")
///
/// # Returns
/// * `ToolSettings` - Settings for the requested tool
#[tauri::command]
pub async fn get_tool_setting(
    state: State<'_, AppState>,
    tool_name: String,
) -> Result<ToolSettings, String> {
    let service = state.tool_settings_service.lock().await;
    service.get_settings(&tool_name)
        .map_err(|e| format!("Failed to get settings for '{}': {}", tool_name, e))
}

/// Update settings for a specific tool
///
/// # Arguments
/// * `tool_name` - Name of the tool to update
/// * `enabled` - Whether the tool is enabled
/// * `config` - JSON configuration object for the tool
///
/// # Returns
/// * `()` - Success (throws error on failure)
#[tauri::command]
pub async fn update_tool_setting(
    state: State<'_, AppState>,
    tool_name: String,
    enabled: bool,
    config: Value,
) -> Result<(), String> {
    let service = state.tool_settings_service.lock().await;
    service.update_settings(&tool_name, enabled, config)
        .map_err(|e| format!("Failed to update settings for '{}': {}", tool_name, e))
}

/// Bulk update settings for multiple tools
///
/// # Arguments
/// * `settings_map` - Map of tool names to their new settings
///
/// # Returns
/// * `()` - Success (throws error on failure)
#[tauri::command]
pub async fn update_all_tool_settings(
    state: State<'_, AppState>,
    settings_map: HashMap<String, ToolSettings>,
) -> Result<(), String> {
    let service = state.tool_settings_service.lock().await;

    // Update each tool setting
    for (tool_name, settings) in settings_map {
        service.update_settings(&tool_name, settings.enabled, settings.config)
            .map_err(|e| format!("Failed to update settings for '{}': {}", tool_name, e))?;
    }

    Ok(())
}

/// Enable a specific tool
///
/// # Arguments
/// * `tool_name` - Name of the tool to enable
///
/// # Returns
/// * `()` - Success (throws error on failure)
#[tauri::command]
pub async fn enable_tool(
    state: State<'_, AppState>,
    tool_name: String,
) -> Result<(), String> {
    let service = state.tool_settings_service.lock().await;
    service.enable_tool(&tool_name)
        .map_err(|e| format!("Failed to enable tool '{}': {}", tool_name, e))
}

/// Disable a specific tool
///
/// # Arguments
/// * `tool_name` - Name of the tool to disable
///
/// # Returns
/// * `()` - Success (throws error on failure)
#[tauri::command]
pub async fn disable_tool(
    state: State<'_, AppState>,
    tool_name: String,
) -> Result<(), String> {
    let service = state.tool_settings_service.lock().await;
    service.disable_tool(&tool_name)
        .map_err(|e| format!("Failed to disable tool '{}': {}", tool_name, e))
}

/// Reset all tool settings to defaults
///
/// # Returns
/// * `()` - Success (throws error on failure)
#[tauri::command]
pub async fn reset_tool_settings(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let service = state.tool_settings_service.lock().await;
    service.reset_all_to_defaults()
        .map_err(|e| format!("Failed to reset tool settings: {}", e))
}

/// Get default configuration for a specific tool
///
/// # Arguments
/// * `tool_name` - Name of the tool
///
/// # Returns
/// * `Value` - Default JSON configuration for the tool
#[tauri::command]
pub async fn get_tool_default_config(
    state: State<'_, AppState>,
    tool_name: String,
) -> Result<Value, String> {
    let service = state.tool_settings_service.lock().await;
    service.get_default_config(&tool_name)
        .map_err(|e| format!("Failed to get default config for '{}': {}", tool_name, e))
}

/**
 * Plugin System Commands (v3.6.0)
 *
 * Tauri commands for plugin management:
 * - Discover, install, and uninstall plugins
 * - Load, unload, enable, and disable plugins
 * - Execute plugin functions
 * - Manage plugin permissions
 */

use crate::services::plugin::{PluginManifest, PluginService, PluginResult, Permission};
use log::info;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use tauri::{command, State};

/// Plugin system state
pub struct PluginState {
    pub service: Arc<Mutex<PluginService>>,
}

/// Discover all plugins in the plugins directory
#[command]
pub async fn plugin_discover(
    state: State<'_, PluginState>,
) -> Result<Vec<PluginManifest>, String> {
    info!("Command: plugin_discover");

    let mut service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    service.discover_plugins()
        .map_err(|e| format!("Failed to discover plugins: {}", e))
}

/// List loaded plugins
#[command]
pub async fn plugin_list(
    state: State<'_, PluginState>,
) -> Result<Vec<PluginManifest>, String> {
    info!("Command: plugin_list");

    let service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    Ok(service.list_plugins())
}

/// Load a plugin by ID
#[command]
pub async fn plugin_load(
    state: State<'_, PluginState>,
    plugin_id: String,
) -> Result<bool, String> {
    info!("Command: plugin_load - {}", plugin_id);

    let mut service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    service.load_plugin(&plugin_id)
        .map(|_| true)
        .map_err(|e| format!("Failed to load plugin: {}", e))
}

/// Unload a plugin by ID
#[command]
pub async fn plugin_unload(
    state: State<'_, PluginState>,
    plugin_id: String,
) -> Result<bool, String> {
    info!("Command: plugin_unload - {}", plugin_id);

    let mut service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    service.unload_plugin(&plugin_id)
        .map(|_| true)
        .map_err(|e| format!("Failed to unload plugin: {}", e))
}

/// Enable a plugin
#[command]
pub async fn plugin_enable(
    state: State<'_, PluginState>,
    plugin_id: String,
) -> Result<bool, String> {
    info!("Command: plugin_enable - {}", plugin_id);

    let mut service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    service.enable_plugin(&plugin_id)
        .map(|_| true)
        .map_err(|e| format!("Failed to enable plugin: {}", e))
}

/// Disable a plugin
#[command]
pub async fn plugin_disable(
    state: State<'_, PluginState>,
    plugin_id: String,
) -> Result<bool, String> {
    info!("Command: plugin_disable - {}", plugin_id);

    let mut service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    service.disable_plugin(&plugin_id)
        .map(|_| true)
        .map_err(|e| format!("Failed to disable plugin: {}", e))
}

/// Execute a plugin function
#[command]
pub async fn plugin_execute(
    state: State<'_, PluginState>,
    plugin_id: String,
    function_name: String,
    args: Vec<serde_json::Value>,
) -> Result<PluginResult, String> {
    info!("Command: plugin_execute - {}:{}", plugin_id, function_name);

    let mut service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    service.execute_plugin(&plugin_id, &function_name, args)
        .map_err(|e| format!("Failed to execute plugin function: {}", e))
}

/// Install a plugin from a path
#[command]
pub async fn plugin_install(
    state: State<'_, PluginState>,
    source_path: String,
) -> Result<String, String> {
    info!("Command: plugin_install - {}", source_path);

    let mut service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    let path = PathBuf::from(&source_path);
    service.install_plugin(&path)
        .map_err(|e| format!("Failed to install plugin: {}", e))
}

/// Uninstall a plugin
#[command]
pub async fn plugin_uninstall(
    state: State<'_, PluginState>,
    plugin_id: String,
) -> Result<bool, String> {
    info!("Command: plugin_uninstall - {}", plugin_id);

    let mut service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    service.uninstall_plugin(&plugin_id)
        .map(|_| true)
        .map_err(|e| format!("Failed to uninstall plugin: {}", e))
}

/// Check if a plugin has a specific permission
#[command]
pub async fn plugin_has_permission(
    state: State<'_, PluginState>,
    plugin_id: String,
    permission: String,
) -> Result<bool, String> {
    info!("Command: plugin_has_permission - {}:{}", plugin_id, permission);

    let service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    let perm = match permission.as_str() {
        "fileread" => Permission::FileRead,
        "filewrite" => Permission::FileWrite,
        "network" => Permission::Network,
        "system" => Permission::System,
        "notification" => Permission::Notification,
        "clipboard" => Permission::Clipboard,
        "shell" => Permission::Shell,
        _ => return Err(format!("Unknown permission: {}", permission)),
    };

    Ok(service.has_permission(&plugin_id, &perm))
}

/// Get plugins directory path
#[command]
pub async fn plugin_get_directory(
    state: State<'_, PluginState>,
) -> Result<String, String> {
    info!("Command: plugin_get_directory");

    let service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    Ok(service.get_plugins_dir().to_string_lossy().to_string())
}

/// Get plugin statistics
#[command]
pub async fn plugin_get_stats(
    state: State<'_, PluginState>,
) -> Result<serde_json::Value, String> {
    info!("Command: plugin_get_stats");

    let mut service = state.service.lock()
        .map_err(|e| format!("Failed to lock plugin service: {}", e))?;

    let discovered = service.discover_plugins()
        .map(|v| v.len())
        .unwrap_or(0);

    let loaded = service.list_plugins();
    let enabled_count = loaded.iter().count(); // All loaded plugins are enabled by default

    Ok(serde_json::json!({
        "discovered_plugins": discovered,
        "loaded_plugins": loaded.len(),
        "enabled_plugins": enabled_count,
    }))
}

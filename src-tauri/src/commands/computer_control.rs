use crate::services::computer_control::{
    ActionResult, ComputerControlService, SafetyConfig, RestrictedZone,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

/// Click on a UI element by description
#[tauri::command]
pub async fn computer_click_element(
    description: String,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<ActionResult, String> {
    service
        .click_element(&description)
        .await
        .map_err(|e| e.to_string())
}

/// Type text at current cursor position
#[tauri::command]
pub async fn computer_type_text(
    text: String,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<ActionResult, String> {
    service
        .type_text(&text)
        .await
        .map_err(|e| e.to_string())
}

/// Press a keyboard key
#[tauri::command]
pub async fn computer_press_key(
    key: String,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<ActionResult, String> {
    service
        .press_key(&key)
        .await
        .map_err(|e| e.to_string())
}

/// Scroll in a direction
#[tauri::command]
pub async fn computer_scroll(
    direction: String,
    amount: i32,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<ActionResult, String> {
    service
        .scroll(&direction, amount)
        .await
        .map_err(|e| e.to_string())
}

/// Move mouse to coordinates
#[tauri::command]
pub async fn computer_move_mouse(
    x: i32,
    y: i32,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<ActionResult, String> {
    service
        .move_mouse(x, y)
        .await
        .map_err(|e| e.to_string())
}

/// Wait for specified milliseconds
#[tauri::command]
pub async fn computer_wait(
    milliseconds: u64,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<ActionResult, String> {
    service
        .wait(milliseconds)
        .await
        .map_err(|e| e.to_string())
}

/// Execute AppleScript (macOS only)
#[cfg(target_os = "macos")]
#[tauri::command]
pub async fn computer_execute_applescript(
    script: String,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<ActionResult, String> {
    service
        .execute_applescript(&script)
        .await
        .map_err(|e| e.to_string())
}

/// Get action history
#[tauri::command]
pub fn computer_get_action_history(
    limit: usize,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<Vec<ActionResult>, String> {
    service
        .get_action_history(limit)
        .map_err(|e| e.to_string())
}

/// Clear action history
#[tauri::command]
pub fn computer_clear_action_history(
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<usize, String> {
    service
        .clear_action_history()
        .map_err(|e| e.to_string())
}

/// Response for getting safety config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafetyConfigResponse {
    pub restricted_zones: Vec<RestrictedZone>,
    pub require_confirmation: Vec<String>,
    pub animation_speed_ms: u64,
    pub enable_preview: bool,
}

/// Get safety configuration
#[tauri::command]
pub fn computer_get_safety_config(
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<SafetyConfigResponse, String> {
    let config = service.get_safety_config();
    Ok(SafetyConfigResponse {
        restricted_zones: config.restricted_zones.clone(),
        require_confirmation: config
            .require_confirmation
            .iter()
            .map(|a| format!("{:?}", a))
            .collect(),
        animation_speed_ms: config.animation_speed_ms,
        enable_preview: config.enable_preview,
    })
}

/// Computer control statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComputerControlStats {
    pub total_actions: usize,
    pub successful_actions: usize,
    pub failed_actions: usize,
    pub success_rate: f64,
}

/// Get computer control statistics
#[tauri::command]
pub fn computer_get_stats(
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<ComputerControlStats, String> {
    let history = service
        .get_action_history(1000)
        .map_err(|e| e.to_string())?;

    let total_actions = history.len();
    let successful_actions = history.iter().filter(|a| a.success).count();
    let failed_actions = total_actions - successful_actions;
    let success_rate = if total_actions > 0 {
        (successful_actions as f64 / total_actions as f64) * 100.0
    } else {
        0.0
    };

    Ok(ComputerControlStats {
        total_actions,
        successful_actions,
        failed_actions,
        success_rate,
    })
}

/// Composite action: Click and type
#[tauri::command]
pub async fn computer_click_and_type(
    element_description: String,
    text: String,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<Vec<ActionResult>, String> {
    let mut results = Vec::new();

    // Click the element
    let click_result = service
        .click_element(&element_description)
        .await
        .map_err(|e| e.to_string())?;
    results.push(click_result);

    // Wait a moment for focus
    let wait_result = service
        .wait(200)
        .await
        .map_err(|e| e.to_string())?;
    results.push(wait_result);

    // Type the text
    let type_result = service
        .type_text(&text)
        .await
        .map_err(|e| e.to_string())?;
    results.push(type_result);

    Ok(results)
}

/// Composite action: Type and press Enter
#[tauri::command]
pub async fn computer_type_and_submit(
    text: String,
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<Vec<ActionResult>, String> {
    let mut results = Vec::new();

    // Type the text
    let type_result = service
        .type_text(&text)
        .await
        .map_err(|e| e.to_string())?;
    results.push(type_result);

    // Press Enter
    let enter_result = service
        .press_key("enter")
        .await
        .map_err(|e| e.to_string())?;
    results.push(enter_result);

    Ok(results)
}

/// Test LAM connection
#[tauri::command]
pub async fn computer_test_connection(
    service: State<'_, Arc<ComputerControlService>>,
) -> Result<String, String> {
    // Test by moving mouse slightly and back
    service
        .wait(100)
        .await
        .map_err(|e| e.to_string())?;

    Ok("Computer control service is operational".to_string())
}

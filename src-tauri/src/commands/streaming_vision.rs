/**
 * Phase 2: Streaming Vision Commands (v3.8.0)
 *
 * Tauri commands for continuous screen monitoring with proactive alerts
 */

use crate::services::streaming_vision::{
    StreamingVisionService, StreamingVisionConfig, StreamingVisionState,
    VisionAnalysisResult,
};
use std::sync::Arc;
use tauri::State;

/// Start streaming vision monitoring
#[tauri::command]
pub async fn streaming_vision_start(
    service: State<'_, Arc<StreamingVisionService>>,
) -> Result<(), String> {
    service.start().await.map_err(|e| e.to_string())
}

/// Stop streaming vision monitoring
#[tauri::command]
pub async fn streaming_vision_stop(
    service: State<'_, Arc<StreamingVisionService>>,
) -> Result<(), String> {
    service.stop().map_err(|e| e.to_string())
}

/// Get streaming vision state
#[tauri::command]
pub async fn streaming_vision_get_state(
    service: State<'_, Arc<StreamingVisionService>>,
) -> Result<StreamingVisionState, String> {
    Ok(service.get_state())
}

/// Get streaming vision config
#[tauri::command]
pub async fn streaming_vision_get_config(
    service: State<'_, Arc<StreamingVisionService>>,
) -> Result<StreamingVisionConfig, String> {
    Ok(service.get_config())
}

/// Update streaming vision config
#[tauri::command]
pub async fn streaming_vision_update_config(
    config: StreamingVisionConfig,
    service: State<'_, Arc<StreamingVisionService>>,
) -> Result<(), String> {
    service.update_config(config).map_err(|e| e.to_string())
}

/// Get analysis history
#[tauri::command]
pub async fn streaming_vision_get_history(
    limit: usize,
    service: State<'_, Arc<StreamingVisionService>>,
) -> Result<Vec<VisionAnalysisResult>, String> {
    service.get_analysis_history(limit).map_err(|e| e.to_string())
}

/// Clear analysis history
#[tauri::command]
pub async fn streaming_vision_clear_history(
    service: State<'_, Arc<StreamingVisionService>>,
) -> Result<usize, String> {
    service.clear_history().map_err(|e| e.to_string())
}

/// Get statistics
#[tauri::command]
pub async fn streaming_vision_get_stats(
    service: State<'_, Arc<StreamingVisionService>>,
) -> Result<serde_json::Value, String> {
    service.get_stats().map_err(|e| e.to_string())
}

/// Test connection (verify service is working)
#[tauri::command]
pub async fn streaming_vision_test_connection(
    service: State<'_, Arc<StreamingVisionService>>,
) -> Result<String, String> {
    let state = service.get_state();
    Ok(format!(
        "Streaming Vision Service OK - Active: {}, Captures: {}, Analyses: {}, Alerts: {}",
        state.is_active,
        state.capture_count,
        state.analysis_count,
        state.alert_count
    ))
}

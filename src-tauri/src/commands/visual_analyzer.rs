/**
 * Phase 5: Visual Analyzer Commands (v3.9.0)
 *
 * Tauri commands for image understanding and visual analysis.
 */

use crate::services::visual_analyzer::{
    VisualAnalysis, VisualAnalyzerConfig, VisualAnalyzerService,
};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex as TokioMutex;

/// Analyze an image file
#[tauri::command]
pub async fn visual_analyze_image(
    image_path: String,
    user_question: Option<String>,
    service: State<'_, Arc<TokioMutex<VisualAnalyzerService>>>,
) -> Result<VisualAnalysis, String> {
    log::info!("Visual analysis request for image: {}", &image_path);

    let service_guard = service.lock().await;
    service_guard
        .analyze(&image_path, user_question.as_deref())
        .await
        .map_err(|e| format!("Failed to analyze image: {}", e))
}

/// Analyze current screen capture
#[tauri::command]
pub async fn visual_analyze_screen(
    user_question: Option<String>,
    service: State<'_, Arc<TokioMutex<VisualAnalyzerService>>>,
) -> Result<VisualAnalysis, String> {
    log::info!("Visual analysis request for current screen");

    let service_guard = service.lock().await;
    service_guard
        .analyze_current_screen(user_question.as_deref())
        .await
        .map_err(|e| format!("Failed to analyze screen: {}", e))
}

/// Update visual analyzer configuration
#[tauri::command]
pub async fn visual_update_config(
    config: VisualAnalyzerConfig,
    service: State<'_, Arc<TokioMutex<VisualAnalyzerService>>>,
) -> Result<(), String> {
    let service_guard = service.lock().await;
    service_guard.update_config(config);
    Ok(())
}

/// Get current configuration
#[tauri::command]
pub async fn visual_get_config(
    service: State<'_, Arc<TokioMutex<VisualAnalyzerService>>>,
) -> Result<VisualAnalyzerConfig, String> {
    let service_guard = service.lock().await;
    Ok(service_guard.get_config())
}

/// Check if LLaVA is currently loaded
#[tauri::command]
pub async fn visual_is_loaded(
    service: State<'_, Arc<TokioMutex<VisualAnalyzerService>>>,
) -> Result<bool, String> {
    let service_guard = service.lock().await;
    Ok(service_guard.is_loaded())
}

/// Get recent visual analyses
#[tauri::command]
pub async fn visual_get_recent(
    limit: usize,
    service: State<'_, Arc<TokioMutex<VisualAnalyzerService>>>,
) -> Result<Vec<VisualAnalysis>, String> {
    let service_guard = service.lock().await;
    service_guard
        .get_recent(limit)
        .map_err(|e| format!("Failed to get recent analyses: {}", e))
}

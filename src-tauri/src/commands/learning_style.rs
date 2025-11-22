/**
 * Phase 5 Stage 4: Learning Style Adapter Commands (v3.9.0)
 */

use crate::services::learning_style_adapter::{
    AdaptationResult, ComplexityLevel, ExplanationStyle, InteractionData, LearningModality,
    LearningStyleAdapterService, LearningStyleProfile,
};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn learning_style_get_profile(
    user_id: String,
    service: State<'_, Arc<LearningStyleAdapterService>>,
) -> Result<LearningStyleProfile, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_profile(&user_id)
            .map_err(|e| format!("Failed to get learning style profile: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn learning_style_record_interaction(
    user_id: String,
    data: InteractionData,
    service: State<'_, Arc<LearningStyleAdapterService>>,
) -> Result<(), String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .record_interaction(&user_id, data)
            .map_err(|e| format!("Failed to record interaction: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn learning_style_update_profile(
    user_id: String,
    service: State<'_, Arc<LearningStyleAdapterService>>,
) -> Result<LearningStyleProfile, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            service_clone
                .update_profile_from_interactions(&user_id)
                .await
                .map_err(|e| format!("Failed to update learning style profile: {}", e))
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn learning_style_adapt_response(
    user_id: String,
    original_response: String,
    service: State<'_, Arc<LearningStyleAdapterService>>,
) -> Result<AdaptationResult, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            service_clone
                .adapt_response(&user_id, &original_response)
                .await
                .map_err(|e| format!("Failed to adapt response: {}", e))
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn learning_style_update_manual(
    user_id: String,
    primary_modality: Option<LearningModality>,
    complexity_level: Option<ComplexityLevel>,
    explanation_style: Option<ExplanationStyle>,
    service: State<'_, Arc<LearningStyleAdapterService>>,
) -> Result<(), String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .update_profile_manually(&user_id, primary_modality, complexity_level, explanation_style)
            .map_err(|e| format!("Failed to update profile manually: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

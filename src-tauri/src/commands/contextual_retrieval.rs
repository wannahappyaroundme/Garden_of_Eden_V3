/**
 * Phase 4: Contextual Retrieval Commands (v3.8.0)
 *
 * Tauri commands for topic-based retention boosting.
 */

use crate::services::contextual_retrieval::{
    ContextualBoost, ContextualRetrievalConfig, ContextualRetrievalService, BoostStats,
};
use std::sync::Arc;
use tauri::State;

/// Boost retention for contextually relevant memories
#[tauri::command]
pub async fn contextual_boost_memories(
    conversation_text: String,
    service: State<'_, Arc<ContextualRetrievalService>>,
) -> Result<Vec<ContextualBoost>, String> {
    log::info!(
        "Boosting contextual memories for conversation (length: {})",
        conversation_text.len()
    );

    service
        .boost_contextual_memories(&conversation_text)
        .await
        .map_err(|e| format!("Failed to boost contextual memories: {}", e))
}

/// Decay old boosts (called by decay worker)
#[tauri::command]
pub async fn contextual_decay_old_boosts(
    service: State<'_, Arc<ContextualRetrievalService>>,
) -> Result<usize, String> {
    service
        .decay_old_boosts()
        .map_err(|e| format!("Failed to decay old boosts: {}", e))
}

/// Get boost statistics
#[tauri::command]
pub async fn contextual_get_boost_stats(
    service: State<'_, Arc<ContextualRetrievalService>>,
) -> Result<BoostStats, String> {
    service
        .get_boost_stats()
        .map_err(|e| format!("Failed to get boost stats: {}", e))
}

/// Update contextual retrieval configuration
#[tauri::command]
pub async fn contextual_update_config(
    config: ContextualRetrievalConfig,
    service: State<'_, Arc<ContextualRetrievalService>>,
) -> Result<(), String> {
    service
        .update_config(config)
        .map_err(|e| format!("Failed to update config: {}", e))
}

/// Get contextual retrieval configuration
#[tauri::command]
pub async fn contextual_get_config(
    service: State<'_, Arc<ContextualRetrievalService>>,
) -> Result<ContextualRetrievalConfig, String> {
    Ok(service.get_config())
}

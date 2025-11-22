/**
 * Phase 5: Chain-of-Thought Commands (v3.9.0)
 *
 * Tauri commands for step-by-step reasoning.
 */

use crate::services::chain_of_thought::{
    CacheStats, ChainOfThoughtEngine, CoTConfig, Reasoning,
};
use std::sync::Arc;
use tauri::State;

/// Perform chain-of-thought reasoning
#[tauri::command]
pub async fn cot_reason(
    query: String,
    context: Option<String>,
    service: State<'_, Arc<ChainOfThoughtEngine>>,
) -> Result<Reasoning, String> {
    log::info!("CoT reasoning request for query: {}", &query[..query.len().min(50)]);

    service
        .reason(&query, context.as_deref())
        .await
        .map_err(|e| format!("Failed to perform reasoning: {}", e))
}

/// Update CoT configuration
#[tauri::command]
pub async fn cot_update_config(
    config: CoTConfig,
    service: State<'_, Arc<ChainOfThoughtEngine>>,
) -> Result<(), String> {
    service.update_config(config);
    Ok(())
}

/// Get CoT configuration
#[tauri::command]
pub async fn cot_get_config(
    service: State<'_, Arc<ChainOfThoughtEngine>>,
) -> Result<CoTConfig, String> {
    Ok(service.get_config())
}

/// Clear CoT cache
#[tauri::command]
pub async fn cot_clear_cache(
    service: State<'_, Arc<ChainOfThoughtEngine>>,
) -> Result<(), String> {
    service.clear_cache();
    Ok(())
}

/// Get cache statistics
#[tauri::command]
pub async fn cot_get_cache_stats(
    service: State<'_, Arc<ChainOfThoughtEngine>>,
) -> Result<CacheStats, String> {
    Ok(service.get_cache_stats())
}

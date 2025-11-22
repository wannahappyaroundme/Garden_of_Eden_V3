/**
 * Phase 4: Memory Consolidation Commands (v3.8.0)
 *
 * Tauri commands for intelligent memory merging.
 */

use crate::services::memory_consolidation::{
    ConsolidationConfig, ConsolidationResult, ConsolidationStats,
    MemoryConsolidationService,
};
use std::sync::Arc;
use tauri::State;

/// Run memory consolidation process
#[tauri::command]
pub async fn consolidation_run(
    service: State<'_, Arc<MemoryConsolidationService>>,
) -> Result<Vec<ConsolidationResult>, String> {
    log::info!("Running memory consolidation...");

    service
        .consolidate_memories()
        .await
        .map_err(|e| format!("Failed to consolidate memories: {}", e))
}

/// Get consolidation statistics
#[tauri::command]
pub async fn consolidation_get_stats(
    service: State<'_, Arc<MemoryConsolidationService>>,
) -> Result<ConsolidationStats, String> {
    service
        .get_stats()
        .map_err(|e| format!("Failed to get consolidation stats: {}", e))
}

/// Update consolidation configuration
#[tauri::command]
pub async fn consolidation_update_config(
    config: ConsolidationConfig,
    service: State<'_, Arc<MemoryConsolidationService>>,
) -> Result<(), String> {
    service
        .update_config(config)
        .map_err(|e| format!("Failed to update config: {}", e))
}

/// Get consolidation configuration
#[tauri::command]
pub async fn consolidation_get_config(
    service: State<'_, Arc<MemoryConsolidationService>>,
) -> Result<ConsolidationConfig, String> {
    Ok(service.get_config())
}

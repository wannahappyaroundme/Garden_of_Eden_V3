/**
 * Phase 3: Temporal Memory Commands (v3.8.0)
 *
 * Tauri commands for memory retention management and decay control.
 */

use crate::services::temporal_memory::{TemporalMemoryService, DecayConfig, RetentionStats};
use std::sync::Arc;
use tauri::State;

/// Pin a memory (mark as important, prevents decay)
#[tauri::command]
pub async fn temporal_pin_memory(
    memory_id: String,
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<(), String> {
    service.pin_memory(&memory_id).map_err(|e| e.to_string())
}

/// Unpin a memory (resume normal decay)
#[tauri::command]
pub async fn temporal_unpin_memory(
    memory_id: String,
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<(), String> {
    service.unpin_memory(&memory_id).map_err(|e| e.to_string())
}

/// Get retention statistics
#[tauri::command]
pub async fn temporal_get_retention_stats(
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<RetentionStats, String> {
    service.get_retention_stats().map_err(|e| e.to_string())
}

/// Manually trigger decay update (for testing or admin)
#[tauri::command]
pub async fn temporal_trigger_decay_update(
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<usize, String> {
    service.update_all_retention_scores().map_err(|e| e.to_string())
}

/// Get current decay configuration
#[tauri::command]
pub async fn temporal_get_config(
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<DecayConfig, String> {
    Ok(service.get_config())
}

/// Update decay configuration
#[tauri::command]
pub async fn temporal_update_config(
    config: DecayConfig,
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<(), String> {
    service.update_config(config).map_err(|e| e.to_string())
}

/// Prune low retention memories below threshold
#[tauri::command]
pub async fn temporal_prune_memories(
    threshold: f64,
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<usize, String> {
    service.prune_low_retention_memories(threshold).map_err(|e| e.to_string())
}

/// Calculate retention score for given parameters (for preview/testing)
#[tauri::command]
pub async fn temporal_calculate_retention(
    days_elapsed: f64,
    decay_strength: f64,
    access_count: i32,
    is_pinned: bool,
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<f64, String> {
    Ok(service.calculate_retention(days_elapsed, decay_strength, access_count, is_pinned))
}

/// Set memory type (adaptive decay)
#[tauri::command]
pub async fn temporal_set_memory_type(
    memory_id: String,
    memory_type: String,
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<(), String> {
    use crate::services::temporal_memory::MemoryType;

    let mem_type = MemoryType::from_str(&memory_type);
    service.set_memory_type(&memory_id, mem_type).map_err(|e| e.to_string())
}

/// Get memory type
#[tauri::command]
pub async fn temporal_get_memory_type(
    memory_id: String,
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<String, String> {
    let mem_type = service.get_memory_type(&memory_id).map_err(|e| e.to_string())?;
    Ok(mem_type.as_str().to_string())
}

/// Classify and set memory type (called on memory creation)
#[tauri::command]
pub async fn temporal_classify_memory(
    memory_id: String,
    user_message: String,
    ai_response: String,
    service: State<'_, Arc<TemporalMemoryService>>,
) -> Result<String, String> {
    let mem_type = service
        .classify_and_set_memory_type(&memory_id, &user_message, &ai_response)
        .map_err(|e| e.to_string())?;
    Ok(mem_type.as_str().to_string())
}

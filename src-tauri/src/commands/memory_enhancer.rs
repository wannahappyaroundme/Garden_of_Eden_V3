/**
 * Phase 5: Memory Enhancer Commands (v3.9.0 - Stage 2)
 *
 * Tauri commands for memory enhancement functionality.
 */

use crate::services::memory_enhancer::{
    EnhancedMemory, EnhancementStats, MemoryEnhancerConfig, MemoryEnhancerService, QualityMetrics,
};
use std::sync::Arc;
use tauri::State;

/// Analyze memory quality
#[tauri::command]
pub async fn memory_analyze_quality(
    memory_content: String,
    service: State<'_, Arc<MemoryEnhancerService>>,
) -> Result<QualityMetrics, String> {
    service
        .analyze_quality(&memory_content)
        .await
        .map_err(|e| format!("Failed to analyze memory quality: {}", e))
}

/// Enhance a single memory
#[tauri::command]
pub async fn memory_enhance(
    memory_content: String,
    quality_metrics: QualityMetrics,
    service: State<'_, Arc<MemoryEnhancerService>>,
) -> Result<String, String> {
    service
        .enhance_memory(&memory_content, &quality_metrics)
        .await
        .map_err(|e| format!("Failed to enhance memory: {}", e))
}

/// Process a memory (analyze + enhance if needed)
#[tauri::command]
pub async fn memory_process(
    memory_id: String,
    memory_content: String,
    service: State<'_, Arc<MemoryEnhancerService>>,
) -> Result<EnhancedMemory, String> {
    service
        .process_memory(&memory_id, &memory_content)
        .await
        .map_err(|e| format!("Failed to process memory: {}", e))
}

/// Batch enhance multiple memories
#[tauri::command]
pub async fn memory_batch_enhance(
    memory_ids: Vec<String>,
    service: State<'_, Arc<MemoryEnhancerService>>,
) -> Result<Vec<EnhancedMemory>, String> {
    service
        .batch_enhance(memory_ids)
        .await
        .map_err(|e| format!("Failed to batch enhance memories: {}", e))
}

/// Get enhancement statistics
#[tauri::command]
pub async fn memory_get_enhancement_stats(
    service: State<'_, Arc<MemoryEnhancerService>>,
) -> Result<EnhancementStats, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_stats()
            .map_err(|e| format!("Failed to get enhancement stats: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

/// Get enhanced memory by ID
#[tauri::command]
pub async fn memory_get_enhancement(
    memory_id: String,
    service: State<'_, Arc<MemoryEnhancerService>>,
) -> Result<Option<EnhancedMemory>, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_enhancement(&memory_id)
            .map_err(|e| format!("Failed to get enhancement: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

/// Update memory enhancer configuration
#[tauri::command]
pub async fn memory_update_config(
    config: MemoryEnhancerConfig,
    service: State<'_, Arc<MemoryEnhancerService>>,
) -> Result<(), String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone.update_config(config);
        Ok(())
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

/// Get current configuration
#[tauri::command]
pub async fn memory_get_config(
    service: State<'_, Arc<MemoryEnhancerService>>,
) -> Result<MemoryEnhancerConfig, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || Ok(service_clone.get_config()))
        .await
        .map_err(|e| format!("Task join error: {}", e))?
}

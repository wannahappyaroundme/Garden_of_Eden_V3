/**
 * RAFT (Retrieval Augmented Fine-Tuning) Commands (v3.4.0 Phase 7)
 *
 * Tauri commands for RAFT hallucination reduction system
 */

use tauri::State;
use serde::{Serialize, Deserialize};
use crate::AppState;
use crate::services::raft::RaftConfig;

/// RAFT configuration DTO for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RaftConfigDto {
    pub relevance_threshold: f32,
    pub num_distractors: usize,
    pub confidence_threshold: f32,
    pub use_chain_of_thought: bool,
}

impl From<RaftConfig> for RaftConfigDto {
    fn from(config: RaftConfig) -> Self {
        Self {
            relevance_threshold: config.relevance_threshold,
            num_distractors: config.num_distractors,
            confidence_threshold: config.confidence_threshold,
            use_chain_of_thought: config.use_chain_of_thought,
        }
    }
}

impl From<RaftConfigDto> for RaftConfig {
    fn from(dto: RaftConfigDto) -> Self {
        Self {
            relevance_threshold: dto.relevance_threshold,
            num_distractors: dto.num_distractors,
            confidence_threshold: dto.confidence_threshold,
            use_chain_of_thought: dto.use_chain_of_thought,
        }
    }
}

/// Get current RAFT configuration
#[tauri::command]
pub async fn get_raft_config(state: State<'_, AppState>) -> Result<RaftConfigDto, String> {
    let rag_service = &state.rag;

    let config = rag_service
        .get_raft_config()
        .map_err(|e| format!("Failed to get RAFT config: {}", e))?;

    Ok(config.into())
}

/// Update RAFT configuration
#[tauri::command]
pub async fn update_raft_config(
    state: State<'_, AppState>,
    config: RaftConfigDto,
) -> Result<(), String> {
    let rag_service = &state.rag;

    // Validate configuration
    if config.relevance_threshold < 0.0 || config.relevance_threshold > 1.0 {
        return Err("Relevance threshold must be between 0.0 and 1.0".to_string());
    }
    if config.confidence_threshold < 0.0 || config.confidence_threshold > 1.0 {
        return Err("Confidence threshold must be between 0.0 and 1.0".to_string());
    }
    if config.num_distractors > 10 {
        return Err("Number of distractors must be <= 10".to_string());
    }

    rag_service
        .update_raft_config(config.into())
        .map_err(|e| format!("Failed to update RAFT config: {}", e))?;

    log::info!("✓ RAFT configuration updated successfully");
    Ok(())
}

/// Reset RAFT configuration to defaults
#[tauri::command]
pub async fn reset_raft_config(state: State<'_, AppState>) -> Result<RaftConfigDto, String> {
    let rag_service = &state.rag;

    let default_config = RaftConfig {
        relevance_threshold: 0.5,
        num_distractors: 2,
        confidence_threshold: 0.6,
        use_chain_of_thought: true,
    };

    rag_service
        .update_raft_config(default_config.clone())
        .map_err(|e| format!("Failed to reset RAFT config: {}", e))?;

    log::info!("✓ RAFT configuration reset to defaults");
    Ok(default_config.into())
}

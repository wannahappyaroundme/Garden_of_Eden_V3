/**
 * Phase 4: Advanced Pattern Detection Commands (v3.8.0)
 *
 * Tauri commands for ML-based trait analysis.
 */

use crate::services::pattern_detector::{LlmPatternDetector, TraitAnalysis};
use std::sync::Arc;
use tauri::State;

/// Analyze traits in a text using LLM
#[tauri::command]
pub async fn pattern_analyze_traits(
    text: String,
    service: State<'_, Arc<LlmPatternDetector>>,
) -> Result<TraitAnalysis, String> {
    service
        .analyze_traits(&text)
        .await
        .map_err(|e| e.to_string())
}

/// Analyze single trait
#[tauri::command]
pub async fn pattern_analyze_single_trait(
    text: String,
    trait_name: String,
    service: State<'_, Arc<LlmPatternDetector>>,
) -> Result<f32, String> {
    service
        .analyze_single_trait(&text, &trait_name)
        .await
        .map_err(|e| e.to_string())
}

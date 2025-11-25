/**
 * Phase 5: Context Enricher Commands (v3.9.0 - Stage 1)
 *
 * Tauri commands for context enrichment.
 *
 * NOTE: This module is only compiled when Phase 5 features are enabled.
 * To enable: cargo build --features phase5
 */

#![cfg(feature = "phase5")]

use crate::services::context_enricher::{
    ContextEnricherConfig, ContextEnricherService, EnrichedContext,
};
use std::sync::Arc;
use tauri::State;

/// Enrich a query with context
#[tauri::command]
pub async fn context_enrich(
    query: String,
    conversation_id: Option<String>,
    service: State<'_, Arc<ContextEnricherService>>,
) -> Result<EnrichedContext, String> {
    log::info!("Context enrichment request for query: {}", &query[..query.len().min(50)]);

    service
        .enrich(&query, conversation_id.as_deref())
        .await
        .map_err(|e| format!("Failed to enrich context: {}", e))
}

/// Update context enricher configuration
#[tauri::command]
pub async fn context_update_config(
    config: ContextEnricherConfig,
    service: State<'_, Arc<ContextEnricherService>>,
) -> Result<(), String> {
    service.update_config(config);
    Ok(())
}

/// Get current configuration
#[tauri::command]
pub async fn context_get_config(
    service: State<'_, Arc<ContextEnricherService>>,
) -> Result<ContextEnricherConfig, String> {
    Ok(service.get_config())
}

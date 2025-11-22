/**
 * Phase 5: Semantic Wiki Commands (v3.9.0 - Stage 2)
 *
 * Tauri commands for semantic knowledge base.
 */

use crate::services::semantic_wiki::{
    Fact, FactCategory, SemanticWikiConfig, SemanticWikiService, WikiStats,
};
use std::sync::Arc;
use tauri::State;

/// Extract facts from a conversation turn
#[tauri::command]
pub async fn wiki_extract_facts(
    user_message: String,
    ai_response: String,
    conversation_id: String,
    message_id: Option<String>,
    service: State<'_, Arc<SemanticWikiService>>,
) -> Result<Vec<Fact>, String> {
    log::info!("Wiki fact extraction request");

    service
        .extract_facts(
            &user_message,
            &ai_response,
            &conversation_id,
            message_id.as_deref(),
        )
        .await
        .map_err(|e| format!("Failed to extract facts: {}", e))
}

/// Store facts in the wiki
#[tauri::command]
pub async fn wiki_store_facts(
    facts: Vec<Fact>,
    service: State<'_, Arc<SemanticWikiService>>,
) -> Result<usize, String> {
    service
        .store_facts(facts)
        .await
        .map_err(|e| format!("Failed to store facts: {}", e))
}

/// Search for facts
#[tauri::command]
pub async fn wiki_search(
    query: String,
    limit: usize,
    category_filter: Option<FactCategory>,
    service: State<'_, Arc<SemanticWikiService>>,
) -> Result<Vec<(Fact, f32)>, String> {
    service
        .search(&query, limit, category_filter)
        .await
        .map_err(|e| format!("Failed to search wiki: {}", e))
}

/// Get facts by entity
#[tauri::command]
pub async fn wiki_get_by_entity(
    entity: String,
    limit: usize,
    service: State<'_, Arc<SemanticWikiService>>,
) -> Result<Vec<Fact>, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_facts_by_entity(&entity, limit)
            .map_err(|e| format!("Failed to get facts by entity: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

/// Get wiki statistics
#[tauri::command]
pub async fn wiki_get_stats(
    service: State<'_, Arc<SemanticWikiService>>,
) -> Result<WikiStats, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_stats()
            .map_err(|e| format!("Failed to get wiki stats: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

/// Update wiki configuration
#[tauri::command]
pub async fn wiki_update_config(
    config: SemanticWikiConfig,
    service: State<'_, Arc<SemanticWikiService>>,
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
pub async fn wiki_get_config(
    service: State<'_, Arc<SemanticWikiService>>,
) -> Result<SemanticWikiConfig, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        Ok(service_clone.get_config())
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

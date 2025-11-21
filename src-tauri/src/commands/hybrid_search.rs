/**
 * Hybrid Search Commands (v3.6.0)
 *
 * Commands for hybrid search combining BM25 + BGE-M3 semantic search
 */

use crate::services::hybrid_search::{FusionWeights, HybridSearchEngine};
use crate::AppState;
use log::{error, info};
use std::sync::Arc;
use tauri::State;

/// Initialize hybrid search engine and build BM25 index
#[tauri::command]
pub async fn hybrid_search_init(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: hybrid_search_init");

    // Get or create hybrid search engine
    let mut hybrid_search = state.hybrid_search.lock().await;

    // Build BM25 index - acquire DB lock only when needed
    let result = {
        let db = state.db.lock().map_err(|e| {
            error!("Failed to lock database: {}", e);
            format!("Database lock error: {}", e)
        })?;
        let conn = db.conn();
        hybrid_search.build_index(conn)
    }; // DB lock is dropped here

    result?;

    // Get statistics
    let stats = hybrid_search.stats();

    info!(
        "Hybrid search initialized: {} BM25 docs, {} terms",
        stats.bm25_documents, stats.bm25_terms
    );

    Ok(serde_json::json!({
        "bm25_documents": stats.bm25_documents,
        "bm25_terms": stats.bm25_terms,
        "fusion_weights": {
            "bm25_weight": stats.fusion_weights.bm25_weight,
            "semantic_weight": stats.fusion_weights.semantic_weight,
        },
        "rrf_k": stats.rrf_k,
        "reranking_enabled": stats.reranking_enabled,
    }))
}

/// Rebuild BM25 index (after new episodes are added)
#[tauri::command]
pub async fn hybrid_search_rebuild_index(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    info!("Command: hybrid_search_rebuild_index");

    let mut hybrid_search = state.hybrid_search.lock().await;

    // Rebuild index - acquire DB lock only when needed
    let result = {
        let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
        let conn = db.conn();
        hybrid_search.rebuild_index(conn)
    }; // DB lock is dropped here

    result?;

    let stats = hybrid_search.stats();

    info!("BM25 index rebuilt: {} documents", stats.bm25_documents);

    Ok(serde_json::json!({
        "bm25_documents": stats.bm25_documents,
        "bm25_terms": stats.bm25_terms,
    }))
}

/// Perform hybrid search
#[tauri::command]
pub async fn hybrid_search_query(
    state: State<'_, AppState>,
    query: String,
    top_k: Option<usize>,
) -> Result<serde_json::Value, String> {
    info!("Command: hybrid_search_query - '{}' (top_k: {:?})", query, top_k);

    let k = top_k.unwrap_or(5);

    let hybrid_search = state.hybrid_search.lock().await;
    let results = hybrid_search.search(&query, k).await?;

    info!("Hybrid search returned {} results", results.len());

    let json_results: Vec<serde_json::Value> = results
        .into_iter()
        .map(|r| {
            serde_json::json!({
                "episode_id": r.episode_id,
                "content": r.content,
                "hybrid_score": r.hybrid_score,
                "bm25_score": r.bm25_score,
                "semantic_score": r.semantic_score,
                "bm25_rank": r.bm25_rank,
                "semantic_rank": r.semantic_rank,
                "rerank_score": r.rerank_score,
            })
        })
        .collect();

    Ok(serde_json::json!({
        "query": query,
        "top_k": k,
        "results": json_results,
    }))
}

/// Update fusion weights
#[tauri::command]
pub async fn hybrid_search_set_weights(
    state: State<'_, AppState>,
    bm25_weight: f32,
    semantic_weight: f32,
) -> Result<(), String> {
    info!(
        "Command: hybrid_search_set_weights - BM25: {}, Semantic: {}",
        bm25_weight, semantic_weight
    );

    // Validate weights
    if bm25_weight < 0.0 || bm25_weight > 1.0 {
        return Err("bm25_weight must be between 0.0 and 1.0".to_string());
    }
    if semantic_weight < 0.0 || semantic_weight > 1.0 {
        return Err("semantic_weight must be between 0.0 and 1.0".to_string());
    }

    let mut hybrid_search = state.hybrid_search.lock().await;

    hybrid_search.set_fusion_weights(FusionWeights {
        bm25_weight,
        semantic_weight,
    });

    info!("Fusion weights updated successfully");
    Ok(())
}

/// Update RRF constant
#[tauri::command]
pub async fn hybrid_search_set_rrf_k(
    state: State<'_, AppState>,
    k: f32,
) -> Result<(), String> {
    info!("Command: hybrid_search_set_rrf_k - k: {}", k);

    if k <= 0.0 {
        return Err("RRF constant k must be positive".to_string());
    }

    let mut hybrid_search = state.hybrid_search.lock().await;

    hybrid_search.set_rrf_k(k);

    info!("RRF constant updated successfully");
    Ok(())
}

/// Get hybrid search statistics
#[tauri::command]
pub async fn hybrid_search_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: hybrid_search_stats");

    let hybrid_search = state.hybrid_search.lock().await;

    let stats = hybrid_search.stats();

    Ok(serde_json::json!({
        "bm25_documents": stats.bm25_documents,
        "bm25_terms": stats.bm25_terms,
        "fusion_weights": {
            "bm25_weight": stats.fusion_weights.bm25_weight,
            "semantic_weight": stats.fusion_weights.semantic_weight,
        },
        "rrf_k": stats.rrf_k,
        "reranking_enabled": stats.reranking_enabled,
    }))
}

/// Compare hybrid search vs pure semantic search
#[tauri::command]
pub async fn hybrid_search_compare(
    state: State<'_, AppState>,
    query: String,
    top_k: Option<usize>,
) -> Result<serde_json::Value, String> {
    info!("Command: hybrid_search_compare - '{}'", query);

    let k = top_k.unwrap_or(5);

    let hybrid_search = state.hybrid_search.lock().await;

    // Get hybrid search results
    let hybrid_results = hybrid_search.search(&query, k).await?;

    // Get pure semantic results (via RAG service)
    let semantic_episodes = state.rag.search_memory(&query, k).await
        .map_err(|e| format!("Semantic search failed: {}", e))?;

    info!(
        "Comparison complete: {} hybrid, {} semantic",
        hybrid_results.len(),
        semantic_episodes.len()
    );

    Ok(serde_json::json!({
        "query": query,
        "top_k": k,
        "hybrid_results": hybrid_results.into_iter().map(|r| {
            serde_json::json!({
                "episode_id": r.episode_id,
                "hybrid_score": r.hybrid_score,
                "bm25_score": r.bm25_score,
                "semantic_score": r.semantic_score,
            })
        }).collect::<Vec<_>>(),
        "semantic_results": semantic_episodes.into_iter().map(|e| {
            serde_json::json!({
                "id": e.id,
                "user_message": e.user_message,
                "ai_response": e.ai_response,
                "importance": e.importance,
            })
        }).collect::<Vec<_>>(),
    }))
}

/// Toggle re-ranking on/off
#[tauri::command]
pub async fn hybrid_search_toggle_reranking(
    state: State<'_, AppState>,
    enabled: bool,
) -> Result<(), String> {
    info!("Command: hybrid_search_toggle_reranking - enabled: {}", enabled);

    let mut hybrid_search = state.hybrid_search.lock().await;

    hybrid_search.set_reranking_enabled(enabled);

    info!("Re-ranking toggled successfully");
    Ok(())
}

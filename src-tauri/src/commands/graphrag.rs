use crate::AppState;
use log::info;
use tauri::{command, State};

/// Extract entities and relationships from text
#[command]
pub async fn graphrag_extract_entities(
    state: State<'_, AppState>,
    text: String,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_extract_entities");

    let extractor = &*state.entity_extractor;
    let result = extractor.extract(&text).await?;

    Ok(serde_json::json!({
        "entities": result.entities.iter().map(|e| {
            serde_json::json!({
                "name": e.name,
                "type": e.entity_type.as_str(),
                "confidence": e.confidence,
                "properties": e.properties,
            })
        }).collect::<Vec<_>>(),
        "relationships": result.relationships.iter().map(|r| {
            serde_json::json!({
                "source": r.source_entity,
                "target": r.target_entity,
                "type": r.relationship_type.as_str(),
                "confidence": r.confidence,
                "properties": r.properties,
            })
        }).collect::<Vec<_>>(),
    }))
}

/// Build knowledge graph from text
#[command]
pub async fn graphrag_build_graph(
    state: State<'_, AppState>,
    text: String,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_build_graph");

    let mut builder = state.graph_builder.lock().await;
    builder.build_from_text(&text).await?;

    let stats = builder.stats();

    Ok(serde_json::json!({
        "node_count": stats.node_count,
        "edge_count": stats.edge_count,
        "community_count": stats.community_count,
        "avg_degree": stats.avg_degree,
    }))
}

/// Save knowledge graph to database
#[command]
pub async fn graphrag_save_graph(state: State<'_, AppState>) -> Result<String, String> {
    info!("Command: graphrag_save_graph");

    let builder = state.graph_builder.lock().await;
    let storage = &*state.graph_storage;

    storage.save_graph(builder.graph())?;

    Ok("Graph saved successfully".to_string())
}

/// Load entity from database
#[command]
pub fn graphrag_load_entity(
    state: State<'_, AppState>,
    entity_id: String,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_load_entity ({})", entity_id);

    let storage = &*state.graph_storage;
    let entity = storage.load_entity(&entity_id)?;

    if let Some(node) = entity {
        Ok(serde_json::json!({
            "entity_id": node.entity_id,
            "name": node.name,
            "type": node.entity_type,
            "properties": node.properties,
            "community_id": node.community_id,
            "degree": node.degree,
        }))
    } else {
        Err(format!("Entity not found: {}", entity_id))
    }
}

/// Search entities by name
#[command]
pub fn graphrag_search_entities(
    state: State<'_, AppState>,
    query: String,
    limit: Option<usize>,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_search_entities ({})", query);

    let storage = &*state.graph_storage;
    let entities = storage.search_entities(&query, limit.unwrap_or(10))?;

    Ok(serde_json::json!({
        "entities": entities.iter().map(|e| {
            serde_json::json!({
                "entity_id": e.entity_id,
                "name": e.name,
                "type": e.entity_type,
                "degree": e.degree,
                "community_id": e.community_id,
            })
        }).collect::<Vec<_>>(),
    }))
}

/// Get neighbors of an entity
#[command]
pub fn graphrag_get_neighbors(
    state: State<'_, AppState>,
    entity_id: String,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_get_neighbors ({})", entity_id);

    let storage = &*state.graph_storage;
    let neighbors = storage.get_neighbors(&entity_id)?;

    Ok(serde_json::json!({
        "neighbors": neighbors.iter().map(|e| {
            serde_json::json!({
                "entity_id": e.entity_id,
                "name": e.name,
                "type": e.entity_type,
                "degree": e.degree,
            })
        }).collect::<Vec<_>>(),
    }))
}

/// Get entities in a community
#[command]
pub fn graphrag_get_community(
    state: State<'_, AppState>,
    community_id: i32,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_get_community ({})", community_id);

    let storage = &*state.graph_storage;
    let entities = storage.get_community_entities(community_id)?;

    Ok(serde_json::json!({
        "community_id": community_id,
        "members": entities.iter().map(|e| {
            serde_json::json!({
                "entity_id": e.entity_id,
                "name": e.name,
                "type": e.entity_type,
                "degree": e.degree,
            })
        }).collect::<Vec<_>>(),
    }))
}

/// Retrieve entities using graph-based retrieval
#[command]
pub fn graphrag_retrieve(
    state: State<'_, AppState>,
    query: String,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_retrieve ({})", query);

    let engine = &*state.graph_retrieval;
    let results = engine.retrieve(&query)?;

    Ok(serde_json::json!({
        "results": results.iter().map(|r| {
            serde_json::json!({
                "entity": {
                    "entity_id": r.entity.entity_id,
                    "name": r.entity.name,
                    "type": r.entity.entity_type,
                    "degree": r.entity.degree,
                },
                "relevance_score": r.relevance_score,
                "retrieval_path": r.retrieval_path,
                "context": r.context,
            })
        }).collect::<Vec<_>>(),
    }))
}

/// Find path between two entities
#[command]
pub fn graphrag_find_path(
    state: State<'_, AppState>,
    source_id: String,
    target_id: String,
    max_depth: Option<usize>,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_find_path ({} -> {})", source_id, target_id);

    let engine = &*state.graph_retrieval;
    let path = engine.find_path(&source_id, &target_id, max_depth.unwrap_or(3))?;

    Ok(serde_json::json!({
        "path": path,
        "found": path.is_some(),
    }))
}

/// Get graph statistics
#[command]
pub fn graphrag_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_stats");

    let storage = &*state.graph_storage;
    let stats = storage.get_stats()?;

    Ok(serde_json::json!({
        "entity_count": stats.entity_count,
        "relationship_count": stats.relationship_count,
        "community_count": stats.community_count,
    }))
}

/// Delete entity from graph
#[command]
pub fn graphrag_delete_entity(
    state: State<'_, AppState>,
    entity_id: String,
) -> Result<String, String> {
    info!("Command: graphrag_delete_entity ({})", entity_id);

    let storage = &*state.graph_storage;
    storage.delete_entity(&entity_id)?;

    Ok(format!("Entity {} deleted successfully", entity_id))
}

/// Clear all graph data
#[command]
pub fn graphrag_clear_all(state: State<'_, AppState>) -> Result<String, String> {
    info!("Command: graphrag_clear_all");

    let storage = &*state.graph_storage;
    storage.clear_all()?;

    Ok("All graph data cleared successfully".to_string())
}

/// Get entity extractor configuration
#[command]
pub fn graphrag_get_extractor_config(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_get_extractor_config");

    let extractor = &*state.entity_extractor;
    let config = extractor.config();

    Ok(serde_json::json!({
        "min_confidence": config.min_confidence,
        "max_entities_per_text": config.max_entities_per_text,
        "enable_coreference_resolution": config.enable_coreference_resolution,
    }))
}

/// Get graph retrieval configuration
#[command]
pub fn graphrag_get_retrieval_config(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    info!("Command: graphrag_get_retrieval_config");

    let engine = &*state.graph_retrieval;
    let config = engine.config();

    Ok(serde_json::json!({
        "max_hops": config.max_hops,
        "max_results": config.max_results,
        "min_relevance_score": config.min_relevance_score,
        "enable_community_expansion": config.enable_community_expansion,
    }))
}

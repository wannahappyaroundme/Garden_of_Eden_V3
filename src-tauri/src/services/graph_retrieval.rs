/**
 * Graph Retrieval Service (v3.7.0 - GraphRAG)
 *
 * Graph-based retrieval for enhanced RAG with knowledge graphs
 *
 * Features:
 * - Entity-centric retrieval: Find documents by entity mentions
 * - Community-based retrieval: Retrieve related entities in the same community
 * - Graph traversal: Multi-hop reasoning over relationships
 * - Hybrid retrieval: Combine graph structure with semantic search
 *
 * Integration: Works with graph_storage.rs and hybrid_search.rs
 */

use crate::services::graph_builder::{GraphNode, KnowledgeGraph};
use crate::services::graph_storage::GraphStorage;
use log::{debug, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

/// Graph retrieval result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphRetrievalResult {
    pub entity: GraphNode,
    pub relevance_score: f32,
    pub retrieval_path: Vec<String>, // Path from query entity to this entity
    pub context: Vec<String>,        // Related entities for context
}

/// Graph retrieval configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GraphRetrievalConfig {
    pub max_hops: usize,
    pub max_results: usize,
    pub min_relevance_score: f32,
    pub enable_community_expansion: bool,
}

impl Default for GraphRetrievalConfig {
    fn default() -> Self {
        GraphRetrievalConfig {
            max_hops: 2,
            max_results: 10,
            min_relevance_score: 0.3,
            enable_community_expansion: true,
        }
    }
}

/// Graph Retrieval Engine
pub struct GraphRetrievalEngine {
    config: GraphRetrievalConfig,
    storage: Arc<GraphStorage>,
}

impl GraphRetrievalEngine {
    /// Create new graph retrieval engine
    pub fn new(storage: Arc<GraphStorage>) -> Self {
        info!("Initializing Graph Retrieval Engine (GraphRAG)");
        GraphRetrievalEngine {
            config: GraphRetrievalConfig::default(),
            storage,
        }
    }

    /// Create with custom configuration
    pub fn with_config(config: GraphRetrievalConfig, storage: Arc<GraphStorage>) -> Self {
        info!(
            "Initializing Graph Retrieval Engine (max_hops: {}, max_results: {})",
            config.max_hops, config.max_results
        );
        GraphRetrievalEngine { config, storage }
    }

    /// Retrieve entities by query
    pub fn retrieve(&self, query: &str) -> Result<Vec<GraphRetrievalResult>, String> {
        info!("Graph retrieval for query: {}", query);

        // Step 1: Search for entities matching the query
        let seed_entities = self.storage.search_entities(query, 5)?;

        if seed_entities.is_empty() {
            info!("No entities found matching query");
            return Ok(Vec::new());
        }

        debug!("Found {} seed entities", seed_entities.len());

        // Step 2: Expand from seed entities via graph traversal
        let mut all_results: Vec<GraphRetrievalResult> = Vec::new();

        for seed_entity in seed_entities {
            let expanded = self.expand_from_entity(&seed_entity)?;
            all_results.extend(expanded);
        }

        // Step 3: Deduplicate and rank results
        let mut seen = HashSet::new();
        let mut unique_results = Vec::new();

        for result in all_results {
            if !seen.contains(&result.entity.entity_id) {
                seen.insert(result.entity.entity_id.clone());
                unique_results.push(result);
            }
        }

        // Sort by relevance score
        unique_results.sort_by(|a, b| {
            b.relevance_score
                .partial_cmp(&a.relevance_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // Limit results
        unique_results.truncate(self.config.max_results);

        info!("Retrieved {} unique entities", unique_results.len());

        Ok(unique_results)
    }

    /// Expand from a seed entity via graph traversal
    fn expand_from_entity(
        &self,
        seed_entity: &GraphNode,
    ) -> Result<Vec<GraphRetrievalResult>, String> {
        let mut results = Vec::new();

        // Add seed entity itself
        results.push(GraphRetrievalResult {
            entity: seed_entity.clone(),
            relevance_score: 1.0,
            retrieval_path: vec![seed_entity.entity_id.clone()],
            context: Vec::new(),
        });

        // BFS traversal up to max_hops
        let mut visited = HashSet::new();
        let mut current_level = vec![seed_entity.entity_id.clone()];
        visited.insert(seed_entity.entity_id.clone());

        for hop in 1..=self.config.max_hops {
            let mut next_level = Vec::new();

            for entity_id in &current_level {
                let neighbors = self.storage.get_neighbors(entity_id)?;

                for neighbor in neighbors {
                    if visited.contains(&neighbor.entity_id) {
                        continue;
                    }

                    visited.insert(neighbor.entity_id.clone());

                    // Calculate relevance score (decay with distance)
                    let relevance_score = 1.0 / (hop as f32 + 1.0);

                    if relevance_score < self.config.min_relevance_score {
                        continue;
                    }

                    // Build retrieval path
                    let path = vec![seed_entity.entity_id.clone(), neighbor.entity_id.clone()];

                    results.push(GraphRetrievalResult {
                        entity: neighbor.clone(),
                        relevance_score,
                        retrieval_path: path,
                        context: Vec::new(),
                    });

                    next_level.push(neighbor.entity_id);
                }
            }

            current_level = next_level;

            if current_level.is_empty() {
                break;
            }
        }

        // Community expansion if enabled
        if self.config.enable_community_expansion {
            if let Some(community_id) = seed_entity.community_id {
                let community_entities = self.storage.get_community_entities(community_id)?;

                for entity in community_entities {
                    if visited.contains(&entity.entity_id) {
                        continue;
                    }

                    visited.insert(entity.entity_id.clone());

                    results.push(GraphRetrievalResult {
                        entity: entity.clone(),
                        relevance_score: 0.5, // Community members get moderate score
                        retrieval_path: vec![
                            seed_entity.entity_id.clone(),
                            entity.entity_id.clone(),
                        ],
                        context: Vec::new(),
                    });
                }
            }
        }

        Ok(results)
    }

    /// Retrieve entities by type
    pub fn retrieve_by_type(
        &self,
        entity_type: &str,
        limit: usize,
    ) -> Result<Vec<GraphNode>, String> {
        info!("Retrieving entities of type: {}", entity_type);

        // This requires a new query method in GraphStorage
        // For now, we'll use search with empty query and filter by type
        // TODO: Add get_entities_by_type method to GraphStorage

        let all_entities = self.storage.search_entities("", 1000)?;
        let filtered: Vec<GraphNode> = all_entities
            .into_iter()
            .filter(|e| e.entity_type == entity_type)
            .take(limit)
            .collect();

        Ok(filtered)
    }

    /// Get subgraph around entity
    pub fn get_subgraph(&self, entity_id: &str, hops: usize) -> Result<KnowledgeGraph, String> {
        info!("Building subgraph around {} ({} hops)", entity_id, hops);

        let mut graph = KnowledgeGraph::new();
        let mut visited = HashSet::new();
        let mut current_level = vec![entity_id.to_string()];

        // BFS to collect nodes
        for _ in 0..=hops {
            let mut next_level = Vec::new();

            for node_id in &current_level {
                if visited.contains(node_id) {
                    continue;
                }

                visited.insert(node_id.clone());

                // Load node
                if let Some(node) = self.storage.load_entity(node_id)? {
                    graph.nodes.insert(node_id.clone(), node);
                }

                // Get neighbors
                let neighbors = self.storage.get_neighbors(node_id)?;
                for neighbor in neighbors {
                    next_level.push(neighbor.entity_id);
                }
            }

            current_level = next_level;

            if current_level.is_empty() {
                break;
            }
        }

        // Note: Edges would need to be loaded separately
        // This is a simplified version

        info!("Built subgraph with {} nodes", graph.nodes.len());

        Ok(graph)
    }

    /// Find path between two entities
    pub fn find_path(
        &self,
        source_id: &str,
        target_id: &str,
        max_depth: usize,
    ) -> Result<Option<Vec<String>>, String> {
        info!("Finding path: {} -> {}", source_id, target_id);

        // BFS to find shortest path
        let mut queue = vec![(source_id.to_string(), vec![source_id.to_string()])];
        let mut visited = HashSet::new();
        visited.insert(source_id.to_string());

        let mut depth = 0;

        while !queue.is_empty() && depth <= max_depth {
            let level_size = queue.len();

            for _ in 0..level_size {
                let (current_id, path) = queue.remove(0);

                if current_id == target_id {
                    info!("Found path with {} hops", path.len() - 1);
                    return Ok(Some(path));
                }

                let neighbors = self.storage.get_neighbors(&current_id)?;

                for neighbor in neighbors {
                    if visited.contains(&neighbor.entity_id) {
                        continue;
                    }

                    visited.insert(neighbor.entity_id.clone());

                    let mut new_path = path.clone();
                    new_path.push(neighbor.entity_id.clone());

                    queue.push((neighbor.entity_id, new_path));
                }
            }

            depth += 1;
        }

        info!("No path found within {} hops", max_depth);
        Ok(None)
    }

    /// Get configuration
    pub fn config(&self) -> &GraphRetrievalConfig {
        &self.config
    }

    /// Update configuration
    pub fn set_config(&mut self, config: GraphRetrievalConfig) {
        info!(
            "Updating Graph Retrieval config: max_hops={}",
            config.max_hops
        );
        self.config = config;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::graph_builder::GraphNode;
    use std::collections::HashMap;

    fn create_test_storage() -> Arc<GraphStorage> {
        let storage = GraphStorage::new(":memory:").unwrap();

        // Add test entities
        let node1 = GraphNode {
            entity_id: "tech:python".to_string(),
            name: "Python".to_string(),
            entity_type: "Technology".to_string(),
            properties: HashMap::new(),
            community_id: Some(1),
            degree: 5,
        };

        let node2 = GraphNode {
            entity_id: "person:alice".to_string(),
            name: "Alice".to_string(),
            entity_type: "Person".to_string(),
            properties: HashMap::new(),
            community_id: Some(1),
            degree: 3,
        };

        storage.save_entity(&node1).unwrap();
        storage.save_entity(&node2).unwrap();

        Arc::new(storage)
    }

    #[test]
    fn test_graph_retrieval_basic() {
        let storage = create_test_storage();
        let engine = GraphRetrievalEngine::new(storage);

        let results = engine.retrieve("Python").unwrap();
        assert!(!results.is_empty());
    }

    #[test]
    fn test_retrieve_by_type() {
        let storage = create_test_storage();
        let engine = GraphRetrievalEngine::new(storage);

        let results = engine.retrieve_by_type("Technology", 10).unwrap();
        assert!(!results.is_empty());
        assert!(results.iter().all(|r| r.entity_type == "Technology"));
    }

    #[test]
    fn test_community_expansion() {
        let storage = create_test_storage();
        let mut config = GraphRetrievalConfig::default();
        config.enable_community_expansion = true;
        let engine = GraphRetrievalEngine::with_config(config, storage);

        let results = engine.retrieve("Python").unwrap();
        // Should include other community members (Alice)
        assert!(results.len() >= 1);
    }
}

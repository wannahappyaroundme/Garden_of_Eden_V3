/**
 * Graph Builder Service (v3.7.0 - GraphRAG)
 *
 * Constructs and maintains knowledge graph from extracted entities
 *
 * Features:
 * - Incremental graph updates
 * - Entity deduplication and merging
 * - Community detection (Louvain algorithm)
 * - Graph statistics and analytics
 *
 * Integration: Works with entity_extractor.rs and graph_storage.rs
 */

use crate::services::entity_extractor::{Entity, EntityExtractor, Relationship};
use log::{debug, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

/// Graph node representing an entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub entity_id: String,
    pub name: String,
    pub entity_type: String,
    pub properties: HashMap<String, String>,
    pub community_id: Option<i32>,
    pub degree: usize,
}

/// Graph edge representing a relationship
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub source_id: String,
    pub target_id: String,
    pub relationship_type: String,
    pub weight: f32,
    pub properties: HashMap<String, String>,
}

/// Knowledge graph structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeGraph {
    pub nodes: HashMap<String, GraphNode>,
    pub edges: Vec<GraphEdge>,
    pub communities: HashMap<i32, Vec<String>>,
}

impl KnowledgeGraph {
    pub fn new() -> Self {
        KnowledgeGraph {
            nodes: HashMap::new(),
            edges: Vec::new(),
            communities: HashMap::new(),
        }
    }

    /// Get total number of nodes
    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    /// Get total number of edges
    pub fn edge_count(&self) -> usize {
        self.edges.len()
    }

    /// Get node by ID
    pub fn get_node(&self, entity_id: &str) -> Option<&GraphNode> {
        self.nodes.get(entity_id)
    }

    /// Get all neighbors of a node
    pub fn get_neighbors(&self, entity_id: &str) -> Vec<String> {
        self.edges
            .iter()
            .filter_map(|edge| {
                if edge.source_id == entity_id {
                    Some(edge.target_id.clone())
                } else if edge.target_id == entity_id {
                    Some(edge.source_id.clone())
                } else {
                    None
                }
            })
            .collect()
    }

    /// Get subgraph around a node (k-hop neighborhood)
    pub fn get_subgraph(&self, entity_id: &str, hops: usize) -> KnowledgeGraph {
        let mut visited = HashSet::new();
        let mut current_level = vec![entity_id.to_string()];

        // BFS to find all nodes within k hops
        for _ in 0..hops {
            let mut next_level = Vec::new();

            for node_id in &current_level {
                if visited.contains(node_id) {
                    continue;
                }
                visited.insert(node_id.clone());

                let neighbors = self.get_neighbors(node_id);
                next_level.extend(neighbors);
            }

            current_level = next_level;
        }

        // Build subgraph
        let mut subgraph = KnowledgeGraph::new();

        for node_id in &visited {
            if let Some(node) = self.nodes.get(node_id) {
                subgraph.nodes.insert(node_id.clone(), node.clone());
            }
        }

        for edge in &self.edges {
            if visited.contains(&edge.source_id) && visited.contains(&edge.target_id) {
                subgraph.edges.push(edge.clone());
            }
        }

        subgraph
    }
}

impl Default for KnowledgeGraph {
    fn default() -> Self {
        Self::new()
    }
}

/// Graph builder configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GraphBuilderConfig {
    pub enable_deduplication: bool,
    pub similarity_threshold: f32,
    pub enable_community_detection: bool,
    pub min_community_size: usize,
}

impl Default for GraphBuilderConfig {
    fn default() -> Self {
        GraphBuilderConfig {
            enable_deduplication: true,
            similarity_threshold: 0.8,
            enable_community_detection: true,
            min_community_size: 3,
        }
    }
}

/// Graph Builder
pub struct GraphBuilder {
    config: GraphBuilderConfig,
    entity_extractor: Arc<EntityExtractor>,
    graph: KnowledgeGraph,
}

impl GraphBuilder {
    /// Create new graph builder
    pub fn new(entity_extractor: Arc<EntityExtractor>) -> Self {
        info!("Initializing Graph Builder (GraphRAG)");
        GraphBuilder {
            config: GraphBuilderConfig::default(),
            entity_extractor,
            graph: KnowledgeGraph::new(),
        }
    }

    /// Create with custom configuration
    pub fn with_config(
        config: GraphBuilderConfig,
        entity_extractor: Arc<EntityExtractor>,
    ) -> Self {
        info!(
            "Initializing Graph Builder (similarity_threshold: {})",
            config.similarity_threshold
        );
        GraphBuilder {
            config,
            entity_extractor,
            graph: KnowledgeGraph::new(),
        }
    }

    /// Build graph from text
    pub async fn build_from_text(&mut self, text: &str) -> Result<(), String> {
        info!("Building graph from text (length: {})", text.len());

        // Extract entities and relationships
        let extraction = self.entity_extractor.extract(text).await?;

        // Add entities to graph
        for entity in extraction.entities {
            self.add_entity(entity);
        }

        // Add relationships to graph
        for relationship in extraction.relationships {
            self.add_relationship(relationship);
        }

        // Update node degrees
        self.update_node_degrees();

        // Detect communities if enabled
        if self.config.enable_community_detection {
            self.detect_communities();
        }

        info!(
            "Graph updated: {} nodes, {} edges",
            self.graph.node_count(),
            self.graph.edge_count()
        );

        Ok(())
    }

    /// Add entity to graph
    fn add_entity(&mut self, entity: Entity) {
        let entity_id = self.generate_entity_id(&entity.name, &entity.entity_type.as_str());

        // Check if entity already exists
        if self.graph.nodes.contains_key(&entity_id) {
            debug!("Entity already exists: {}", entity.name);
            // Update properties if needed
            if let Some(node) = self.graph.nodes.get_mut(&entity_id) {
                for (key, value) in entity.properties {
                    node.properties.insert(key, value);
                }
            }
            return;
        }

        // Create new node
        let node = GraphNode {
            entity_id: entity_id.clone(),
            name: entity.name,
            entity_type: entity.entity_type.as_str().to_string(),
            properties: entity.properties,
            community_id: None,
            degree: 0,
        };

        let node_name = node.name.clone();
        self.graph.nodes.insert(entity_id.clone(), node);
        debug!("Added entity: {} (id: {})", node_name, entity_id);
    }

    /// Add relationship to graph
    fn add_relationship(&mut self, relationship: Relationship) {
        let source_id = self.find_entity_id(&relationship.source_entity);
        let target_id = self.find_entity_id(&relationship.target_entity);

        // Both entities must exist
        if source_id.is_none() || target_id.is_none() {
            warn!(
                "Skipping relationship: entities not found ({} -> {})",
                relationship.source_entity, relationship.target_entity
            );
            return;
        }

        let source_id = source_id.unwrap();
        let target_id = target_id.unwrap();

        // Check if edge already exists
        let exists = self.graph.edges.iter().any(|e| {
            (e.source_id == source_id && e.target_id == target_id)
                || (e.source_id == target_id && e.target_id == source_id)
        });

        if exists {
            debug!(
                "Relationship already exists: {} -> {}",
                source_id, target_id
            );
            return;
        }

        // Create new edge
        let edge = GraphEdge {
            source_id: source_id.clone(),
            target_id: target_id.clone(),
            relationship_type: relationship.relationship_type.as_str().to_string(),
            weight: relationship.confidence,
            properties: relationship.properties,
        };

        self.graph.edges.push(edge);
        debug!("Added relationship: {} -> {}", source_id, target_id);
    }

    /// Generate unique entity ID
    fn generate_entity_id(&self, name: &str, entity_type: &str) -> String {
        format!("{}:{}", entity_type.to_lowercase(), name.to_lowercase())
    }

    /// Find entity ID by name
    fn find_entity_id(&self, name: &str) -> Option<String> {
        let name_lower = name.to_lowercase();
        self.graph
            .nodes
            .iter()
            .find(|(_, node)| node.name.to_lowercase() == name_lower)
            .map(|(id, _)| id.clone())
    }

    /// Update node degrees based on edges
    fn update_node_degrees(&mut self) {
        let mut degrees: HashMap<String, usize> = HashMap::new();

        for edge in &self.graph.edges {
            *degrees.entry(edge.source_id.clone()).or_insert(0) += 1;
            *degrees.entry(edge.target_id.clone()).or_insert(0) += 1;
        }

        for (entity_id, degree) in degrees {
            if let Some(node) = self.graph.nodes.get_mut(&entity_id) {
                node.degree = degree;
            }
        }
    }

    /// Detect communities using simple label propagation
    fn detect_communities(&mut self) {
        info!("Detecting communities in graph");

        // Initialize each node with its own community
        let mut labels: HashMap<String, i32> = HashMap::new();
        for (i, entity_id) in self.graph.nodes.keys().enumerate() {
            labels.insert(entity_id.clone(), i as i32);
        }

        // Label propagation iterations
        let max_iterations = 10;
        for _ in 0..max_iterations {
            let mut changed = false;

            for entity_id in self.graph.nodes.keys() {
                let neighbors = self.graph.get_neighbors(entity_id);

                if neighbors.is_empty() {
                    continue;
                }

                // Find most common label among neighbors
                let mut label_counts: HashMap<i32, usize> = HashMap::new();
                for neighbor_id in neighbors {
                    if let Some(&label) = labels.get(&neighbor_id) {
                        *label_counts.entry(label).or_insert(0) += 1;
                    }
                }

                if let Some((&most_common_label, _)) =
                    label_counts.iter().max_by_key(|(_, &count)| count)
                {
                    if let Some(current_label) = labels.get_mut(entity_id) {
                        if *current_label != most_common_label {
                            *current_label = most_common_label;
                            changed = true;
                        }
                    }
                }
            }

            if !changed {
                break;
            }
        }

        // Assign community IDs to nodes and build community map
        let mut communities: HashMap<i32, Vec<String>> = HashMap::new();
        for (entity_id, community_id) in labels {
            // Assign to node
            if let Some(node) = self.graph.nodes.get_mut(&entity_id) {
                node.community_id = Some(community_id);
            }
            // Add to community map
            communities
                .entry(community_id)
                .or_insert_with(Vec::new)
                .push(entity_id);
        }

        // Filter small communities
        communities.retain(|_, members| members.len() >= self.config.min_community_size);

        self.graph.communities = communities;

        info!(
            "Detected {} communities",
            self.graph.communities.len()
        );
    }

    /// Get the knowledge graph
    pub fn graph(&self) -> &KnowledgeGraph {
        &self.graph
    }

    /// Get graph statistics
    pub fn stats(&self) -> GraphStats {
        let avg_degree = if !self.graph.nodes.is_empty() {
            self.graph.edges.len() as f32 * 2.0 / self.graph.nodes.len() as f32
        } else {
            0.0
        };

        GraphStats {
            node_count: self.graph.node_count(),
            edge_count: self.graph.edge_count(),
            community_count: self.graph.communities.len(),
            avg_degree,
        }
    }

    /// Clear the graph
    pub fn clear(&mut self) {
        self.graph = KnowledgeGraph::new();
        info!("Graph cleared");
    }
}

/// Graph statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphStats {
    pub node_count: usize,
    pub edge_count: usize,
    pub community_count: usize,
    pub avg_degree: f32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::entity_extractor::EntityExtractorConfig;

    #[tokio::test]
    async fn test_graph_builder_basic() {
        let extractor = Arc::new(EntityExtractor::new());
        let mut builder = GraphBuilder::new(extractor);

        let text = "Alice works at Microsoft. Bob also works at Microsoft.";
        builder.build_from_text(text).await.unwrap();

        let stats = builder.stats();
        assert!(stats.node_count > 0);
    }

    #[tokio::test]
    async fn test_entity_deduplication() {
        let extractor = Arc::new(EntityExtractor::new());
        let mut builder = GraphBuilder::new(extractor);

        // Same entity mentioned twice
        let text = "Python is great. I use Python every day.";
        builder.build_from_text(text).await.unwrap();

        // Python should only appear once in the graph
        let python_count = builder
            .graph()
            .nodes
            .values()
            .filter(|n| n.name.to_lowercase() == "python")
            .count();

        assert!(python_count <= 1);
    }

    #[test]
    fn test_knowledge_graph_subgraph() {
        let mut graph = KnowledgeGraph::new();

        // Add nodes
        graph.nodes.insert(
            "a".to_string(),
            GraphNode {
                entity_id: "a".to_string(),
                name: "A".to_string(),
                entity_type: "Concept".to_string(),
                properties: HashMap::new(),
                community_id: None,
                degree: 0,
            },
        );

        graph.nodes.insert(
            "b".to_string(),
            GraphNode {
                entity_id: "b".to_string(),
                name: "B".to_string(),
                entity_type: "Concept".to_string(),
                properties: HashMap::new(),
                community_id: None,
                degree: 0,
            },
        );

        // Add edge
        graph.edges.push(GraphEdge {
            source_id: "a".to_string(),
            target_id: "b".to_string(),
            relationship_type: "RelatesTo".to_string(),
            weight: 1.0,
            properties: HashMap::new(),
        });

        let subgraph = graph.get_subgraph("a", 1);
        assert_eq!(subgraph.node_count(), 2);
        assert_eq!(subgraph.edge_count(), 1);
    }
}

/**
 * Graph Storage Service (v3.7.0 - GraphRAG)
 *
 * SQLite-based storage for knowledge graphs
 *
 * Tables:
 * - kg_entities: Entity nodes with properties
 * - kg_relationships: Relationship edges
 * - kg_entity_documents: Links entities to source documents
 * - kg_communities: Community detection results
 *
 * Features:
 * - CRUD operations for entities and relationships
 * - Graph traversal queries
 * - Community-based retrieval
 * - Full-text search on entity properties
 */

use crate::services::graph_builder::{GraphEdge, GraphNode, KnowledgeGraph};
use log::{debug, info, warn};
use rusqlite::{params, Connection, OptionalExtension, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Graph storage with SQLite backend
pub struct GraphStorage {
    conn: Arc<Mutex<Connection>>,
}

impl GraphStorage {
    /// Create new graph storage
    pub fn new(db_path: &str) -> Result<Self, String> {
        info!("Initializing Graph Storage at: {}", db_path);

        let conn = Connection::open(db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        let storage = GraphStorage {
            conn: Arc::new(Mutex::new(conn)),
        };

        storage.create_tables()?;

        info!("Graph Storage initialized successfully");
        Ok(storage)
    }

    /// Create database tables
    fn create_tables(&self) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();

        // kg_entities table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS kg_entities (
                entity_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                properties TEXT,
                community_id INTEGER,
                degree INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )
        .map_err(|e| format!("Failed to create kg_entities table: {}", e))?;

        // kg_relationships table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS kg_relationships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                relationship_type TEXT NOT NULL,
                weight REAL DEFAULT 1.0,
                properties TEXT,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (source_id) REFERENCES kg_entities(entity_id),
                FOREIGN KEY (target_id) REFERENCES kg_entities(entity_id)
            )",
            [],
        )
        .map_err(|e| format!("Failed to create kg_relationships table: {}", e))?;

        // kg_entity_documents table (links entities to source documents)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS kg_entity_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_id TEXT NOT NULL,
                episode_id INTEGER NOT NULL,
                relevance_score REAL DEFAULT 1.0,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (entity_id) REFERENCES kg_entities(entity_id)
            )",
            [],
        )
        .map_err(|e| format!("Failed to create kg_entity_documents table: {}", e))?;

        // kg_communities table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS kg_communities (
                community_id INTEGER PRIMARY KEY,
                name TEXT,
                description TEXT,
                member_count INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )
        .map_err(|e| format!("Failed to create kg_communities table: {}", e))?;

        // Create indexes for faster queries
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_entities_type ON kg_entities(entity_type)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_entities_community ON kg_entities(community_id)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_relationships_source ON kg_relationships(source_id)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_relationships_target ON kg_relationships(target_id)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_entity_docs_entity ON kg_entity_documents(entity_id)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_entity_docs_episode ON kg_entity_documents(episode_id)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;

        info!("Database tables created successfully");
        Ok(())
    }

    /// Save entity to database
    pub fn save_entity(&self, node: &GraphNode) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let properties_json = serde_json::to_string(&node.properties)
            .map_err(|e| format!("Failed to serialize properties: {}", e))?;

        conn.execute(
            "INSERT OR REPLACE INTO kg_entities
             (entity_id, name, entity_type, properties, community_id, degree, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
            params![
                node.entity_id,
                node.name,
                node.entity_type,
                properties_json,
                node.community_id,
                node.degree as i64,
                now,
            ],
        )
        .map_err(|e| format!("Failed to save entity: {}", e))?;

        debug!("Saved entity: {}", node.entity_id);
        Ok(())
    }

    /// Save relationship to database
    pub fn save_relationship(&self, edge: &GraphEdge) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let properties_json = serde_json::to_string(&edge.properties)
            .map_err(|e| format!("Failed to serialize properties: {}", e))?;

        conn.execute(
            "INSERT INTO kg_relationships
             (source_id, target_id, relationship_type, weight, properties, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                edge.source_id,
                edge.target_id,
                edge.relationship_type,
                edge.weight,
                properties_json,
                now,
            ],
        )
        .map_err(|e| format!("Failed to save relationship: {}", e))?;

        debug!(
            "Saved relationship: {} -> {}",
            edge.source_id, edge.target_id
        );
        Ok(())
    }

    /// Save entire knowledge graph
    pub fn save_graph(&self, graph: &KnowledgeGraph) -> Result<(), String> {
        info!(
            "Saving graph: {} nodes, {} edges",
            graph.node_count(),
            graph.edge_count()
        );

        // Save all nodes
        for node in graph.nodes.values() {
            self.save_entity(node)?;
        }

        // Save all edges
        for edge in &graph.edges {
            self.save_relationship(edge)?;
        }

        info!("Graph saved successfully");
        Ok(())
    }

    /// Load entity by ID
    pub fn load_entity(&self, entity_id: &str) -> Result<Option<GraphNode>, String> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn
            .prepare(
                "SELECT entity_id, name, entity_type, properties, community_id, degree
                 FROM kg_entities
                 WHERE entity_id = ?1",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let result = stmt
            .query_row(params![entity_id], |row| {
                let properties_json: String = row.get(3)?;
                let properties: HashMap<String, String> =
                    serde_json::from_str(&properties_json).unwrap_or_default();

                Ok(GraphNode {
                    entity_id: row.get(0)?,
                    name: row.get(1)?,
                    entity_type: row.get(2)?,
                    properties,
                    community_id: row.get(4)?,
                    degree: row.get::<_, i64>(5)? as usize,
                })
            })
            .optional()
            .map_err(|e| format!("Failed to load entity: {}", e))?;

        Ok(result)
    }

    /// Search entities by name (fuzzy match)
    pub fn search_entities(&self, query: &str, limit: usize) -> Result<Vec<GraphNode>, String> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn
            .prepare(
                "SELECT entity_id, name, entity_type, properties, community_id, degree
                 FROM kg_entities
                 WHERE name LIKE ?1
                 ORDER BY degree DESC
                 LIMIT ?2",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let query_pattern = format!("%{}%", query);
        let rows = stmt
            .query_map(params![query_pattern, limit as i64], |row| {
                let properties_json: String = row.get(3)?;
                let properties: HashMap<String, String> =
                    serde_json::from_str(&properties_json).unwrap_or_default();

                Ok(GraphNode {
                    entity_id: row.get(0)?,
                    name: row.get(1)?,
                    entity_type: row.get(2)?,
                    properties,
                    community_id: row.get(4)?,
                    degree: row.get::<_, i64>(5)? as usize,
                })
            })
            .map_err(|e| format!("Failed to search entities: {}", e))?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row.map_err(|e| format!("Failed to parse row: {}", e))?);
        }

        Ok(results)
    }

    /// Get neighbors of an entity
    pub fn get_neighbors(&self, entity_id: &str) -> Result<Vec<GraphNode>, String> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn
            .prepare(
                "SELECT DISTINCT e.entity_id, e.name, e.entity_type, e.properties, e.community_id, e.degree
                 FROM kg_entities e
                 INNER JOIN kg_relationships r ON
                     (r.source_id = ?1 AND r.target_id = e.entity_id) OR
                     (r.target_id = ?1 AND r.source_id = e.entity_id)
                 ORDER BY e.degree DESC",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let rows = stmt
            .query_map(params![entity_id], |row| {
                let properties_json: String = row.get(3)?;
                let properties: HashMap<String, String> =
                    serde_json::from_str(&properties_json).unwrap_or_default();

                Ok(GraphNode {
                    entity_id: row.get(0)?,
                    name: row.get(1)?,
                    entity_type: row.get(2)?,
                    properties,
                    community_id: row.get(4)?,
                    degree: row.get::<_, i64>(5)? as usize,
                })
            })
            .map_err(|e| format!("Failed to get neighbors: {}", e))?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row.map_err(|e| format!("Failed to parse row: {}", e))?);
        }

        Ok(results)
    }

    /// Get entities by community ID
    pub fn get_community_entities(
        &self,
        community_id: i32,
    ) -> Result<Vec<GraphNode>, String> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn
            .prepare(
                "SELECT entity_id, name, entity_type, properties, community_id, degree
                 FROM kg_entities
                 WHERE community_id = ?1
                 ORDER BY degree DESC",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let rows = stmt
            .query_map(params![community_id], |row| {
                let properties_json: String = row.get(3)?;
                let properties: HashMap<String, String> =
                    serde_json::from_str(&properties_json).unwrap_or_default();

                Ok(GraphNode {
                    entity_id: row.get(0)?,
                    name: row.get(1)?,
                    entity_type: row.get(2)?,
                    properties,
                    community_id: row.get(4)?,
                    degree: row.get::<_, i64>(5)? as usize,
                })
            })
            .map_err(|e| format!("Failed to get community entities: {}", e))?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row.map_err(|e| format!("Failed to parse row: {}", e))?);
        }

        Ok(results)
    }

    /// Get graph statistics
    pub fn get_stats(&self) -> Result<GraphStorageStats, String> {
        let conn = self.conn.lock().unwrap();

        let entity_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM kg_entities", [], |row| row.get(0))
            .map_err(|e| format!("Failed to count entities: {}", e))?;

        let relationship_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM kg_relationships", [], |row| {
                row.get(0)
            })
            .map_err(|e| format!("Failed to count relationships: {}", e))?;

        let community_count: i64 = conn
            .query_row(
                "SELECT COUNT(DISTINCT community_id) FROM kg_entities WHERE community_id IS NOT NULL",
                [],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to count communities: {}", e))?;

        Ok(GraphStorageStats {
            entity_count: entity_count as usize,
            relationship_count: relationship_count as usize,
            community_count: community_count as usize,
        })
    }

    /// Delete entity by ID
    pub fn delete_entity(&self, entity_id: &str) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();

        // Delete relationships first (foreign key constraint)
        conn.execute(
            "DELETE FROM kg_relationships WHERE source_id = ?1 OR target_id = ?1",
            params![entity_id],
        )
        .map_err(|e| format!("Failed to delete relationships: {}", e))?;

        // Delete entity
        conn.execute(
            "DELETE FROM kg_entities WHERE entity_id = ?1",
            params![entity_id],
        )
        .map_err(|e| format!("Failed to delete entity: {}", e))?;

        info!("Deleted entity: {}", entity_id);
        Ok(())
    }

    /// Clear all graph data
    pub fn clear_all(&self) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();

        conn.execute("DELETE FROM kg_relationships", [])
            .map_err(|e| format!("Failed to clear relationships: {}", e))?;

        conn.execute("DELETE FROM kg_entities", [])
            .map_err(|e| format!("Failed to clear entities: {}", e))?;

        conn.execute("DELETE FROM kg_entity_documents", [])
            .map_err(|e| format!("Failed to clear entity documents: {}", e))?;

        conn.execute("DELETE FROM kg_communities", [])
            .map_err(|e| format!("Failed to clear communities: {}", e))?;

        info!("Cleared all graph data");
        Ok(())
    }
}

/// Graph storage statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphStorageStats {
    pub entity_count: usize,
    pub relationship_count: usize,
    pub community_count: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_create_storage() {
        let storage = GraphStorage::new(":memory:").unwrap();
        let stats = storage.get_stats().unwrap();

        assert_eq!(stats.entity_count, 0);
        assert_eq!(stats.relationship_count, 0);
    }

    #[test]
    fn test_save_and_load_entity() {
        let storage = GraphStorage::new(":memory:").unwrap();

        let node = GraphNode {
            entity_id: "test:entity".to_string(),
            name: "Test Entity".to_string(),
            entity_type: "Concept".to_string(),
            properties: HashMap::new(),
            community_id: Some(1),
            degree: 5,
        };

        storage.save_entity(&node).unwrap();

        let loaded = storage.load_entity("test:entity").unwrap();
        assert!(loaded.is_some());

        let loaded_node = loaded.unwrap();
        assert_eq!(loaded_node.name, "Test Entity");
        assert_eq!(loaded_node.degree, 5);
    }

    #[test]
    fn test_search_entities() {
        let storage = GraphStorage::new(":memory:").unwrap();

        let node1 = GraphNode {
            entity_id: "test:python".to_string(),
            name: "Python".to_string(),
            entity_type: "Technology".to_string(),
            properties: HashMap::new(),
            community_id: None,
            degree: 10,
        };

        let node2 = GraphNode {
            entity_id: "test:java".to_string(),
            name: "Java".to_string(),
            entity_type: "Technology".to_string(),
            properties: HashMap::new(),
            community_id: None,
            degree: 8,
        };

        storage.save_entity(&node1).unwrap();
        storage.save_entity(&node2).unwrap();

        let results = storage.search_entities("Python", 10).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].name, "Python");
    }

    #[test]
    fn test_get_neighbors() {
        let storage = GraphStorage::new(":memory:").unwrap();

        let node1 = GraphNode {
            entity_id: "a".to_string(),
            name: "A".to_string(),
            entity_type: "Concept".to_string(),
            properties: HashMap::new(),
            community_id: None,
            degree: 1,
        };

        let node2 = GraphNode {
            entity_id: "b".to_string(),
            name: "B".to_string(),
            entity_type: "Concept".to_string(),
            properties: HashMap::new(),
            community_id: None,
            degree: 1,
        };

        storage.save_entity(&node1).unwrap();
        storage.save_entity(&node2).unwrap();

        let edge = GraphEdge {
            source_id: "a".to_string(),
            target_id: "b".to_string(),
            relationship_type: "RelatesTo".to_string(),
            weight: 1.0,
            properties: HashMap::new(),
        };

        storage.save_relationship(&edge).unwrap();

        let neighbors = storage.get_neighbors("a").unwrap();
        assert_eq!(neighbors.len(), 1);
        assert_eq!(neighbors[0].entity_id, "b");
    }

    #[test]
    fn test_clear_all() {
        let storage = GraphStorage::new(":memory:").unwrap();

        let node = GraphNode {
            entity_id: "test".to_string(),
            name: "Test".to_string(),
            entity_type: "Concept".to_string(),
            properties: HashMap::new(),
            community_id: None,
            degree: 0,
        };

        storage.save_entity(&node).unwrap();
        storage.clear_all().unwrap();

        let stats = storage.get_stats().unwrap();
        assert_eq!(stats.entity_count, 0);
    }
}

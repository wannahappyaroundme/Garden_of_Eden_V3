use anyhow::{anyhow, Result};
use crate::database::Database;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use super::embedding::EmbeddingService;

/// Episodic memory entry
#[derive(Debug, Clone)]
pub struct Episode {
    pub id: String,
    pub user_message: String,
    pub ai_response: String,
    pub satisfaction: f32,
    pub created_at: i64,
    pub access_count: i32,
    pub importance: f32,
    pub embedding_id: Option<String>,
}

/// RAG Service for episodic memory retrieval
/// Stores and retrieves past conversations using semantic search
pub struct RagService {
    db: Arc<Mutex<Database>>,
    embedding_service: Arc<EmbeddingService>,
    _lance_db_path: PathBuf,
}

impl RagService {
    /// Create new RAG service
    pub fn new(
        db: Arc<Mutex<Database>>,
        embedding_service: Arc<EmbeddingService>,
        lance_db_path: PathBuf,
    ) -> Result<Self> {
        log::info!("Initializing RAG service with SQLite embeddings at {:?}", lance_db_path);

        // Create embeddings directory if not exists
        std::fs::create_dir_all(&lance_db_path)?;

        Ok(Self {
            db,
            embedding_service,
            _lance_db_path: lance_db_path,
        })
    }

    /// Store a conversation episode with embedding
    pub async fn store_episode(
        &self,
        user_message: &str,
        ai_response: &str,
        satisfaction: f32,
    ) -> Result<String> {
        log::info!("Storing episode: user_message length = {}", user_message.len());

        // Generate embedding for the conversation
        let combined_text = format!("{}\n{}", user_message, ai_response);
        let embedding = self.embedding_service.embed(&combined_text)?;

        // Generate unique ID
        let id = uuid::Uuid::new_v4().to_string();
        let created_at = chrono::Utc::now().timestamp();

        // Store embedding as JSON in SQLite
        let embedding_json = serde_json::to_string(&embedding)?;

        // Store metadata and embedding in SQLite
        let db_guard = self.db.lock().unwrap();
        let db = db_guard.conn();
        db.execute(
            "INSERT INTO episodic_memory (
                id, user_message, ai_response, satisfaction, created_at,
                access_count, importance, embedding_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                id,
                user_message,
                ai_response,
                satisfaction,
                created_at,
                0, // initial access_count
                satisfaction, // initial importance = satisfaction
                embedding_json,  // Store embedding as JSON
            ],
        )?;

        log::info!("Stored episode with ID: {}", id);
        Ok(id)
    }

    /// Retrieve relevant episodes for a query
    pub async fn retrieve_relevant(&self, query: &str, top_k: usize) -> Result<Vec<Episode>> {
        log::info!("Retrieving {} relevant episodes for query", top_k);

        // Generate query embedding
        let query_embedding = self.embedding_service.embed(query)?;

        // Get all episodes with embeddings from SQLite
        let episodes = self.get_all_episodes_with_embeddings()?;

        // Compute cosine similarity for each episode
        let mut scored_episodes: Vec<(Episode, f32)> = episodes
            .into_iter()
            .filter_map(|(episode, embedding_json)| {
                // Parse embedding
                if let Ok(embedding) = serde_json::from_str::<Vec<f32>>(&embedding_json) {
                    let similarity = EmbeddingService::cosine_similarity(&query_embedding, &embedding);
                    Some((episode, similarity))
                } else {
                    None
                }
            })
            .collect();

        // Sort by similarity (highest first)
        scored_episodes.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Take top K
        let top_episodes: Vec<Episode> = scored_episodes
            .into_iter()
            .take(top_k)
            .map(|(episode, _score)| episode)
            .collect();

        // Update access counts
        let ids: Vec<String> = top_episodes.iter().map(|e| e.id.clone()).collect();
        self.increment_access_counts(&ids)?;

        log::info!("Retrieved {} relevant episodes", top_episodes.len());
        Ok(top_episodes)
    }

    /// Search memory semantically
    pub async fn search_memory(&self, query: &str, limit: usize) -> Result<Vec<Episode>> {
        self.retrieve_relevant(query, limit).await
    }

    /// Get recent episodes (fallback when embeddings fail)
    pub fn get_recent_episodes(&self, limit: usize) -> Result<Vec<Episode>> {
        let db_guard = self.db.lock().unwrap();
        let db = db_guard.conn();

        let mut stmt = db.prepare(
            "SELECT id, user_message, ai_response, satisfaction, created_at,
                    access_count, importance, embedding_id
             FROM episodic_memory
             ORDER BY created_at DESC
             LIMIT ?1"
        )?;

        let episodes = stmt
            .query_map([limit], |row| {
                Ok(Episode {
                    id: row.get(0)?,
                    user_message: row.get(1)?,
                    ai_response: row.get(2)?,
                    satisfaction: row.get(3)?,
                    created_at: row.get(4)?,
                    access_count: row.get(5)?,
                    importance: row.get(6)?,
                    embedding_id: row.get(7)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(episodes)
    }

    /// Clean up old memories (>30 days with low access count)
    pub fn cleanup_old_memories(&self) -> Result<usize> {
        let threshold_timestamp = chrono::Utc::now().timestamp() - (30 * 24 * 60 * 60); // 30 days

        let db_guard = self.db.lock().unwrap();
        let db = db_guard.conn();
        let deleted = db.execute(
            "DELETE FROM episodic_memory
             WHERE created_at < ?1 AND access_count < 3 AND satisfaction < 0.5",
            [threshold_timestamp],
        )?;

        log::info!("Cleaned up {} old memories", deleted);
        Ok(deleted)
    }

    /// Get memory statistics
    pub fn get_statistics(&self) -> Result<MemoryStats> {
        let db_guard = self.db.lock().unwrap();
        let db = db_guard.conn();

        let total_memories: i64 = db.query_row(
            "SELECT COUNT(*) FROM episodic_memory",
            [],
            |row| row.get(0),
        )?;

        let avg_satisfaction: f32 = db
            .query_row(
                "SELECT AVG(satisfaction) FROM episodic_memory",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let most_accessed: Option<String> = db
            .query_row(
                "SELECT user_message FROM episodic_memory
                 ORDER BY access_count DESC LIMIT 1",
                [],
                |row| row.get(0),
            )
            .ok();

        Ok(MemoryStats {
            total_memories: total_memories as usize,
            average_satisfaction: avg_satisfaction,
            most_accessed_topic: most_accessed,
        })
    }

    // === Private helper methods ===

    /// Get all episodes with their embeddings
    fn get_all_episodes_with_embeddings(&self) -> Result<Vec<(Episode, String)>> {
        let db_guard = self.db.lock().unwrap();
        let db = db_guard.conn();

        let mut stmt = db.prepare(
            "SELECT id, user_message, ai_response, satisfaction, created_at,
                    access_count, importance, embedding_id
             FROM episodic_memory
             WHERE embedding_id IS NOT NULL"
        )?;

        let episodes = stmt
            .query_map([], |row| {
                let episode = Episode {
                    id: row.get(0)?,
                    user_message: row.get(1)?,
                    ai_response: row.get(2)?,
                    satisfaction: row.get(3)?,
                    created_at: row.get(4)?,
                    access_count: row.get(5)?,
                    importance: row.get(6)?,
                    embedding_id: row.get::<_, Option<String>>(7)?,
                };
                let embedding_json: String = row.get(7)?;
                Ok((episode, embedding_json))
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(episodes)
    }

    /// Increment access counts for episodes
    fn increment_access_counts(&self, ids: &[String]) -> Result<()> {
        if ids.is_empty() {
            return Ok(());
        }

        let db_guard = self.db.lock().unwrap();
        let db = db_guard.conn();

        for id in ids {
            db.execute(
                "UPDATE episodic_memory SET access_count = access_count + 1 WHERE id = ?1",
                [id],
            )?;
        }

        Ok(())
    }
}

/// Memory statistics
#[derive(Debug, Clone)]
pub struct MemoryStats {
    pub total_memories: usize,
    pub average_satisfaction: f32,
    pub most_accessed_topic: Option<String>,
}

/// Format episodes for context (helper function for AI prompts)
pub fn format_episodes_for_context(episodes: &[Episode]) -> String {
    if episodes.is_empty() {
        return String::from("No relevant past conversations found.");
    }

    let mut context = String::from("Relevant past conversations:\n\n");

    for (i, episode) in episodes.iter().enumerate() {
        context.push_str(&format!(
            "{}. User: {}\n   AI: {}\n   (Satisfaction: {:.2})\n\n",
            i + 1,
            episode.user_message,
            episode.ai_response,
            episode.satisfaction
        ));
    }

    context
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use rusqlite::Connection;

    fn create_test_db() -> Arc<Mutex<Connection>> {
        let conn = Connection::open_in_memory().unwrap();

        // Create episodic_memory table
        conn.execute(
            "CREATE TABLE episodic_memory (
                id TEXT PRIMARY KEY,
                user_message TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                satisfaction REAL NOT NULL,
                created_at INTEGER NOT NULL,
                access_count INTEGER NOT NULL DEFAULT 0,
                importance REAL NOT NULL,
                embedding_id TEXT
            )",
            [],
        ).unwrap();

        Arc::new(Mutex::new(conn))
    }

    fn create_test_embedding_service() -> Arc<EmbeddingService> {
        // For tests, we'll use a mock - just return zeros for now
        // In production, this would be the real BGE-M3 service
        Arc::new(EmbeddingService::new().unwrap_or_else(|_| {
            // If model download fails in test, skip
            panic!("Embedding service not available - run with #[ignore] or download model");
        }))
    }

    #[test]
    fn test_format_episodes_for_context_empty() {
        let episodes: Vec<Episode> = vec![];
        let context = format_episodes_for_context(&episodes);
        assert_eq!(context, "No relevant past conversations found.");
    }

    #[test]
    fn test_format_episodes_for_context_single() {
        let episode = Episode {
            id: "test1".to_string(),
            user_message: "Hello AI".to_string(),
            ai_response: "Hello! How can I help?".to_string(),
            satisfaction: 0.8,
            created_at: 1234567890,
            access_count: 0,
            importance: 0.8,
            embedding_id: None,
        };

        let context = format_episodes_for_context(&[episode]);
        assert!(context.contains("Relevant past conversations:"));
        assert!(context.contains("Hello AI"));
        assert!(context.contains("Hello! How can I help?"));
        assert!(context.contains("0.80"));
    }

    #[test]
    fn test_format_episodes_for_context_multiple() {
        let episodes = vec![
            Episode {
                id: "test1".to_string(),
                user_message: "What is Rust?".to_string(),
                ai_response: "Rust is a systems programming language".to_string(),
                satisfaction: 0.9,
                created_at: 1234567890,
                access_count: 2,
                importance: 0.9,
                embedding_id: None,
            },
            Episode {
                id: "test2".to_string(),
                user_message: "Tell me about AI".to_string(),
                ai_response: "AI is artificial intelligence".to_string(),
                satisfaction: 0.7,
                created_at: 1234567891,
                access_count: 1,
                importance: 0.7,
                embedding_id: None,
            },
        ];

        let context = format_episodes_for_context(&episodes);
        assert!(context.contains("1. User: What is Rust?"));
        assert!(context.contains("2. User: Tell me about AI"));
        assert!(context.contains("Satisfaction: 0.90"));
        assert!(context.contains("Satisfaction: 0.70"));
    }

    #[test]
    #[ignore] // Requires BGE-M3 model download
    fn test_memory_stats_empty() {
        let db = create_test_db();
        let embedding_service = Arc::new(EmbeddingService::new().unwrap());

        let lance_db_path = std::env::temp_dir().join("test_lancedb_stats_empty");
        let rag = RagService::new(db.clone(), embedding_service, lance_db_path).unwrap();

        let stats = rag.get_statistics().unwrap();
        assert_eq!(stats.total_memories, 0);
        assert_eq!(stats.average_satisfaction, 0.0);
        assert_eq!(stats.most_accessed_topic, None);
    }

    #[test]
    #[ignore] // Requires BGE-M3 model download
    fn test_get_recent_episodes_empty() {
        let db = create_test_db();
        let embedding_service = Arc::new(EmbeddingService::new().unwrap());

        let lance_db_path = std::env::temp_dir().join("test_lancedb");
        let rag = RagService::new(db.clone(), embedding_service, lance_db_path).unwrap();

        let episodes = rag.get_recent_episodes(10).unwrap();
        assert_eq!(episodes.len(), 0);
    }

    #[test]
    #[ignore] // Requires BGE-M3 model download
    fn test_store_and_retrieve_episode() {
        let db = create_test_db();
        let embedding_service = Arc::new(EmbeddingService::new().unwrap());

        let lance_db_path = std::env::temp_dir().join("test_lancedb_store");
        let rag = RagService::new(db.clone(), embedding_service, lance_db_path).unwrap();

        // Store an episode
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let episode_id = runtime.block_on(async {
            rag.store_episode(
                "What is the capital of France?",
                "The capital of France is Paris.",
                0.9
            ).await.unwrap()
        });

        assert!(!episode_id.is_empty());

        // Retrieve recent episodes
        let recent = rag.get_recent_episodes(10).unwrap();
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].user_message, "What is the capital of France?");
        assert_eq!(recent[0].satisfaction, 0.9);
    }

    #[test]
    #[ignore] // Requires BGE-M3 model download
    fn test_semantic_search() {
        let db = create_test_db();
        let embedding_service = Arc::new(EmbeddingService::new().unwrap());

        let lance_db_path = std::env::temp_dir().join("test_lancedb_search");
        let rag = RagService::new(db.clone(), embedding_service, lance_db_path).unwrap();

        let runtime = tokio::runtime::Runtime::new().unwrap();
        runtime.block_on(async {
            // Store multiple episodes
            rag.store_episode(
                "What is Rust programming language?",
                "Rust is a systems programming language focused on safety.",
                0.8
            ).await.unwrap();

            rag.store_episode(
                "How do I make pizza?",
                "To make pizza, start with dough and add toppings.",
                0.7
            ).await.unwrap();

            rag.store_episode(
                "Tell me about Rust ownership",
                "Rust uses ownership to manage memory safely.",
                0.9
            ).await.unwrap();

            // Search for Rust-related content
            let results = rag.retrieve_relevant("programming in Rust", 2).await.unwrap();

            // Should find 2 Rust-related episodes
            assert!(results.len() >= 1);
            assert!(
                results[0].user_message.contains("Rust") ||
                results[0].ai_response.contains("Rust")
            );
        });
    }

    #[test]
    #[ignore] // Requires BGE-M3 model download
    fn test_cleanup_old_memories() {
        let db = create_test_db();
        let embedding_service = Arc::new(EmbeddingService::new().unwrap());

        let lance_db_path = std::env::temp_dir().join("test_lancedb_cleanup");
        let rag = RagService::new(db.clone(), embedding_service, lance_db_path).unwrap();

        let runtime = tokio::runtime::Runtime::new().unwrap();
        runtime.block_on(async {
            // Store old episode with low satisfaction
            let old_timestamp = chrono::Utc::now().timestamp() - (35 * 24 * 60 * 60); // 35 days ago

            let db_lock = db.lock().unwrap();
            db_lock.execute(
                "INSERT INTO episodic_memory (id, user_message, ai_response, satisfaction, created_at, access_count, importance, embedding_id)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                rusqlite::params![
                    "old_episode",
                    "Old message",
                    "Old response",
                    0.3, // Low satisfaction
                    old_timestamp,
                    1, // Low access count
                    0.3,
                    "[]"
                ],
            ).unwrap();
            drop(db_lock);

            // Clean up
            let deleted = rag.cleanup_old_memories().unwrap();
            assert_eq!(deleted, 1);
        });
    }

    #[test]
    #[ignore] // Requires BGE-M3 model download
    fn test_memory_statistics() {
        let db = create_test_db();
        let embedding_service = Arc::new(EmbeddingService::new().unwrap());

        let lance_db_path = std::env::temp_dir().join("test_lancedb_stats");
        let rag = RagService::new(db.clone(), embedding_service, lance_db_path).unwrap();

        let runtime = tokio::runtime::Runtime::new().unwrap();
        runtime.block_on(async {
            // Store episodes
            rag.store_episode("Question 1", "Answer 1", 0.8).await.unwrap();
            rag.store_episode("Question 2", "Answer 2", 0.6).await.unwrap();
            rag.store_episode("Question 3", "Answer 3", 0.9).await.unwrap();

            let stats = rag.get_statistics().unwrap();
            assert_eq!(stats.total_memories, 3);
            assert!((stats.average_satisfaction - 0.766).abs() < 0.01); // (0.8 + 0.6 + 0.9) / 3
        });
    }
}

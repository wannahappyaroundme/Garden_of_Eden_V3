use anyhow::{anyhow, Context, Result};
use rusqlite::Connection;
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
    db: Arc<Mutex<Connection>>,
    embedding_service: Arc<EmbeddingService>,
    _lance_db_path: PathBuf,
}

impl RagService {
    /// Create new RAG service
    pub fn new(
        db: Arc<Mutex<Connection>>,
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
        let db = self.db.lock().unwrap();
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
        let db = self.db.lock().unwrap();

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

        let db = self.db.lock().unwrap();
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
        let db = self.db.lock().unwrap();

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
        let db = self.db.lock().unwrap();

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

        let db = self.db.lock().unwrap();

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

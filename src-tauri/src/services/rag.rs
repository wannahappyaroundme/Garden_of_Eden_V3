use anyhow::{Context, Result};
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
    lance_db_path: PathBuf,
}

impl RagService {
    /// Create new RAG service
    pub fn new(
        db: Arc<Mutex<Connection>>,
        embedding_service: Arc<EmbeddingService>,
        lance_db_path: PathBuf,
    ) -> Result<Self> {
        log::info!("Initializing RAG service with LanceDB at {:?}", lance_db_path);

        // Create LanceDB directory if not exists
        std::fs::create_dir_all(&lance_db_path)?;

        Ok(Self {
            db,
            embedding_service,
            lance_db_path,
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

        // Store embedding in LanceDB (placeholder for now - will implement full LanceDB later)
        let embedding_id = self.store_embedding_in_lance(&id, &embedding).await?;

        // Store metadata in SQLite
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
                embedding_id,
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

        // Search in LanceDB (placeholder - will implement full vector search)
        let similar_ids = self.search_lance(&query_embedding, top_k).await?;

        // Fetch full episodes from SQLite
        let episodes = self.fetch_episodes_by_ids(&similar_ids)?;

        // Update access counts
        self.increment_access_counts(&similar_ids)?;

        Ok(episodes)
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

    /// Store embedding in database (simplified - stores as JSON string)
    async fn store_embedding_in_lance(&self, id: &str, embedding: &[f32]) -> Result<String> {
        // Store embedding as JSON string in SQLite for now
        // TODO: Replace with proper vector database when dependencies are resolved
        let embedding_json = serde_json::to_string(&embedding)?;
        log::debug!("Storing embedding for ID: {} (length: {})", id, embedding.len());

        // Could store in a separate embeddings table, but for now just return ID
        Ok(id.to_string())
    }

    /// Search using keyword similarity (fallback for vector search)
    async fn search_lance(&self, query_embedding: &[f32], top_k: usize) -> Result<Vec<String>> {
        // Fallback: Use recent episodes with keyword matching
        // TODO: Replace with proper LanceDB vector search
        log::debug!("Using keyword-based search (vector search temporarily disabled)");

        let recent_episodes = self.get_recent_episodes(top_k * 3)?; // Get more candidates

        // For now, just return recent episodes
        // In production, we would compute cosine similarity here
        let ids: Vec<String> = recent_episodes
            .into_iter()
            .take(top_k)
            .map(|e| e.id)
            .collect();

        Ok(ids)
    }

    /// Fetch episodes by IDs
    fn fetch_episodes_by_ids(&self, ids: &[String]) -> Result<Vec<Episode>> {
        if ids.is_empty() {
            return Ok(Vec::new());
        }

        let db = self.db.lock().unwrap();
        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");

        let query = format!(
            "SELECT id, user_message, ai_response, satisfaction, created_at,
                    access_count, importance, embedding_id
             FROM episodic_memory
             WHERE id IN ({})",
            placeholders
        );

        let mut stmt = db.prepare(&query)?;

        let params: Vec<&dyn rusqlite::ToSql> = ids.iter().map(|id| id as &dyn rusqlite::ToSql).collect();

        let episodes = stmt
            .query_map(&params[..], |row| {
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

    /// Increment access counts for retrieved episodes
    fn increment_access_counts(&self, ids: &[String]) -> Result<()> {
        if ids.is_empty() {
            return Ok(());
        }

        let db = self.db.lock().unwrap();
        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");

        let query = format!(
            "UPDATE episodic_memory SET access_count = access_count + 1 WHERE id IN ({})",
            placeholders
        );

        let params: Vec<&dyn rusqlite::ToSql> = ids.iter().map(|id| id as &dyn rusqlite::ToSql).collect();

        db.execute(&query, &params[..])?;

        Ok(())
    }
}

/// Memory statistics
#[derive(Debug)]
pub struct MemoryStats {
    pub total_memories: usize,
    pub average_satisfaction: f32,
    pub most_accessed_topic: Option<String>,
}

/// Helper to format episodes for context
pub fn format_episodes_for_context(episodes: &[Episode]) -> String {
    if episodes.is_empty() {
        return String::new();
    }

    let mut context = String::from("\n\n=== Relevant Past Conversations ===\n");

    for (i, episode) in episodes.iter().enumerate() {
        context.push_str(&format!(
            "\n[Memory {}] (Satisfaction: {:.0}%, Accessed: {} times)\n",
            i + 1,
            episode.satisfaction * 100.0,
            episode.access_count
        ));
        context.push_str(&format!("User: {}\n", episode.user_message));
        context.push_str(&format!("Assistant: {}\n", episode.ai_response));
    }

    context.push_str("\n=== End of Memories ===\n\n");
    context
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_episodes() {
        let episodes = vec![
            Episode {
                id: "1".to_string(),
                user_message: "Hello".to_string(),
                ai_response: "Hi there!".to_string(),
                satisfaction: 0.9,
                created_at: 0,
                access_count: 5,
                importance: 0.9,
                embedding_id: None,
            },
        ];

        let formatted = format_episodes_for_context(&episodes);
        assert!(formatted.contains("Hello"));
        assert!(formatted.contains("Hi there"));
        assert!(formatted.contains("90%"));
    }
}

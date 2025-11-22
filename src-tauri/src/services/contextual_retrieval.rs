/**
 * Phase 4: Contextual Retrieval (v3.8.0)
 *
 * Topic-based retention boosting that prevents premature decay of
 * contextually relevant memories during active conversations.
 *
 * Algorithm:
 * 1. Extract conversation topics using BGE-M3 embeddings
 * 2. Find semantically similar memories (cosine similarity)
 * 3. Boost retention scores for relevant memories
 * 4. Adaptive boosting based on recency and relevance
 *
 * Integration:
 * - Called during conversation processing
 * - Runs before memory retrieval to keep context alive
 * - Prevents important memories from decaying mid-conversation
 */

use crate::database::Database;
use crate::services::embedding::EmbeddingService;
use crate::services::rag_v2::RagServiceV2;  // v3.4.0: LanceDB migration
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

/// Configuration for contextual retrieval
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextualRetrievalConfig {
    /// Minimum similarity score to consider a memory relevant (0.0-1.0)
    pub similarity_threshold: f32,

    /// Maximum number of memories to boost per query
    pub max_boost_count: usize,

    /// Retention boost amount (added to current retention)
    pub retention_boost: f32,

    /// Decay rate for boost over time (days)
    /// Boost decays as: boost * e^(-days_since_boost / decay_rate)
    pub boost_decay_days: f32,
}

impl Default for ContextualRetrievalConfig {
    fn default() -> Self {
        Self {
            similarity_threshold: 0.7,    // High threshold for relevance
            max_boost_count: 20,           // Boost top 20 relevant memories
            retention_boost: 0.2,          // Add 20% retention
            boost_decay_days: 7.0,         // Boost decays over 7 days
        }
    }
}

/// Contextual boost metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextualBoost {
    pub memory_id: String,
    pub similarity_score: f32,
    pub boost_amount: f32,
    pub boosted_at: i64,
}

/// Contextual Retrieval Service
pub struct ContextualRetrievalService {
    db: Arc<Mutex<Database>>,
    rag_service: Arc<RagServiceV2>,  // v3.4.0: LanceDB
    config: Arc<Mutex<ContextualRetrievalConfig>>,
}

impl ContextualRetrievalService {
    /// Create new contextual retrieval service
    pub fn new(
        db: Arc<Mutex<Database>>,
        rag_service: Arc<RagServiceV2>,  // v3.4.0: LanceDB
    ) -> Result<Self> {
        let service = Self {
            db,
            rag_service,
            config: Arc::new(Mutex::new(ContextualRetrievalConfig::default())),
        };

        service.init_database()?;

        Ok(service)
    }

    /// Initialize database tables
    fn init_database(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        // Add contextual boost columns to episodic_memory table
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN last_boost_at INTEGER DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN boost_count INTEGER DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN total_boost_amount REAL DEFAULT 0.0",
            [],
        );

        // Create index for boost tracking
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_episodic_last_boost
             ON episodic_memory(last_boost_at)",
            [],
        );

        log::info!("Contextual retrieval database initialized");

        Ok(())
    }

    /// Boost retention for memories relevant to current conversation
    ///
    /// # Arguments
    /// * `conversation_text` - Recent conversation messages to extract topics from
    ///
    /// # Returns
    /// List of boosted memories with similarity scores
    pub async fn boost_contextual_memories(
        &self,
        conversation_text: &str,
    ) -> Result<Vec<ContextualBoost>> {
        log::info!(
            "Boosting contextual memories for conversation (length: {})",
            conversation_text.len()
        );

        // Find semantically similar memories using RAG service
        let similar_memories = self.find_similar_memories(conversation_text).await?;

        if similar_memories.is_empty() {
            log::info!("No similar memories found above threshold");
            return Ok(Vec::new());
        }

        // Apply retention boost
        let boosts = self.apply_retention_boosts(&similar_memories).await?;

        log::info!("Boosted {} contextually relevant memories", boosts.len());

        Ok(boosts)
    }

    /// Find memories similar to query text using RAG service
    async fn find_similar_memories(
        &self,
        query_text: &str,
    ) -> Result<Vec<(String, f32)>> {
        let config = self.config.lock().unwrap().clone();

        // Use RAG service to find similar episodic memories with scores
        // RAG service handles embedding generation and similarity search
        let results = self.rag_service
            .search_with_scores(query_text, config.max_boost_count)
            .await
            .context("Failed to search episodic memories")?;

        // Filter by similarity threshold and convert to (id, similarity) pairs
        let similarities: Vec<(String, f32)> = results
            .into_iter()
            .filter(|(_, similarity)| *similarity >= config.similarity_threshold)
            .map(|(episode, similarity)| (episode.id, similarity))
            .collect();

        Ok(similarities)
    }

    /// Apply retention boosts to similar memories
    async fn apply_retention_boosts(
        &self,
        similar_memories: &[(String, f32)],
    ) -> Result<Vec<ContextualBoost>> {
        let config = self.config.lock().unwrap().clone();
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        let mut boosts = Vec::new();

        for (memory_id, similarity) in similar_memories {
            // Calculate adaptive boost based on similarity
            // Higher similarity = larger boost
            let boost_amount = config.retention_boost * similarity;

            // Get current retention score
            let current_retention: f32 = conn
                .query_row(
                    "SELECT COALESCE(retention_score, 1.0)
                     FROM episodic_memory
                     WHERE id = ?1",
                    rusqlite::params![memory_id],
                    |row| row.get(0),
                )
                .unwrap_or(1.0);

            // Apply boost (clamped to [0.0, 1.0])
            let new_retention = (current_retention + boost_amount).min(1.0);

            // Update database
            conn.execute(
                "UPDATE episodic_memory
                 SET retention_score = ?1,
                     last_boost_at = ?2,
                     boost_count = COALESCE(boost_count, 0) + 1,
                     total_boost_amount = COALESCE(total_boost_amount, 0.0) + ?3
                 WHERE id = ?4",
                rusqlite::params![new_retention, now, boost_amount, memory_id],
            )?;

            log::debug!(
                "Boosted memory {} (similarity={:.3}, boost={:.3}, new_retention={:.3})",
                memory_id,
                similarity,
                boost_amount,
                new_retention
            );

            boosts.push(ContextualBoost {
                memory_id: memory_id.clone(),
                similarity_score: *similarity,
                boost_amount,
                boosted_at: now,
            });
        }

        Ok(boosts)
    }

    /// Decay old boosts (called periodically by decay worker)
    ///
    /// Gradually reduces retention for memories that were boosted long ago
    /// but are no longer contextually relevant
    pub fn decay_old_boosts(&self) -> Result<usize> {
        let config = self.config.lock().unwrap().clone();
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        // Find memories with old boosts
        let mut stmt = conn.prepare(
            "SELECT id, last_boost_at, retention_score, total_boost_amount
             FROM episodic_memory
             WHERE last_boost_at > 0"
        )?;

        let memories: Vec<(String, i64, f32, f32)> = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, f32>(2).unwrap_or(1.0),
                    row.get::<_, f32>(3).unwrap_or(0.0),
                ))
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        drop(stmt);

        let mut decay_count = 0;

        for (id, last_boost_at, current_retention, total_boost) in memories {
            let days_since_boost = (now - last_boost_at) as f32 / 86400.0;

            // Calculate boost decay using exponential decay
            let boost_decay_factor = (-days_since_boost / config.boost_decay_days).exp();

            // Calculate how much boost should remain
            let remaining_boost = total_boost * boost_decay_factor;

            // If significant decay has occurred, reduce retention
            if boost_decay_factor < 0.9 {
                // Subtract decayed portion
                let boost_reduction = total_boost - remaining_boost;
                let new_retention = (current_retention - boost_reduction).max(0.1);

                conn.execute(
                    "UPDATE episodic_memory
                     SET retention_score = ?1,
                         total_boost_amount = ?2
                     WHERE id = ?3",
                    rusqlite::params![new_retention, remaining_boost, id],
                )?;

                decay_count += 1;
            }
        }

        log::info!("Decayed {} old contextual boosts", decay_count);

        Ok(decay_count)
    }

    /// Get boost statistics
    pub fn get_boost_stats(&self) -> Result<BoostStats> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let total_boosted: usize = conn
            .query_row(
                "SELECT COUNT(*) FROM episodic_memory WHERE boost_count > 0",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let average_boost_count: f32 = conn
            .query_row(
                "SELECT AVG(boost_count) FROM episodic_memory WHERE boost_count > 0",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let total_boost_amount: f32 = conn
            .query_row(
                "SELECT SUM(total_boost_amount) FROM episodic_memory",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        let recently_boosted: usize = {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)?
                .as_secs() as i64;
            let seven_days_ago = now - (7 * 86400);

            conn.query_row(
                "SELECT COUNT(*) FROM episodic_memory WHERE last_boost_at > ?1",
                rusqlite::params![seven_days_ago],
                |row| row.get(0),
            )
            .unwrap_or(0)
        };

        Ok(BoostStats {
            total_boosted_memories: total_boosted,
            average_boost_count,
            total_boost_amount,
            recently_boosted_7d: recently_boosted,
        })
    }

    /// Update configuration
    pub fn update_config(&self, new_config: ContextualRetrievalConfig) -> Result<()> {
        *self.config.lock().unwrap() = new_config;
        log::info!("Contextual retrieval config updated");
        Ok(())
    }

    /// Get current configuration
    pub fn get_config(&self) -> ContextualRetrievalConfig {
        self.config.lock().unwrap().clone()
    }
}

/// Boost statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoostStats {
    pub total_boosted_memories: usize,
    pub average_boost_count: f32,
    pub total_boost_amount: f32,
    pub recently_boosted_7d: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_defaults() {
        let config = ContextualRetrievalConfig::default();
        assert_eq!(config.similarity_threshold, 0.7);
        assert_eq!(config.max_boost_count, 20);
        assert_eq!(config.retention_boost, 0.2);
        assert_eq!(config.boost_decay_days, 7.0);
    }

    #[test]
    fn test_boost_decay() {
        let config = ContextualRetrievalConfig::default();
        let days = 7.0;
        let decay_factor = (-days / config.boost_decay_days).exp();

        // After 7 days, boost should decay to ~36.8% (1/e)
        assert!((decay_factor - 0.368).abs() < 0.01);
    }
}

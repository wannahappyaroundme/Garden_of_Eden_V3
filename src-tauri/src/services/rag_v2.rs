//! RAG Service v2 with LanceDB Integration (v3.4.0 Phase 6)
//!
//! Refactored RAG service using LanceDB for 10-100x faster vector search
//! - Stores metadata in SQLite
//! - Stores embeddings in LanceDB vector store
//! - Maintains backward compatibility with existing API
//! - v3.4.0 Phase 7: RAFT integration for hallucination reduction
//!
//! NOTE: This module is only compiled when the `lancedb-support` feature is enabled.
//! To enable: cargo build --features lancedb-support

#![cfg(feature = "lancedb-support")]

use anyhow::Result;
use crate::database::Database;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use super::embedding::UnifiedEmbeddingService;
use super::vector_store::{VectorStoreService, VectorRecord};
use super::raft::{RaftService, RaftConfig};

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

/// RAG Service v2 for episodic memory retrieval using LanceDB
pub struct RagServiceV2 {
    db: Arc<Mutex<Database>>,
    embedding_service: Arc<UnifiedEmbeddingService>,
    vector_store: Arc<VectorStoreService>,
    raft_service: Arc<Mutex<RaftService>>,
}

impl RagServiceV2 {
    /// Create new RAG service with LanceDB
    pub async fn new(
        db: Arc<Mutex<Database>>,
        embedding_service: Arc<UnifiedEmbeddingService>,
        lance_db_path: PathBuf,
    ) -> Result<Self> {
        log::info!("Initializing RAG v2 service with LanceDB at {:?}", lance_db_path);

        // Initialize LanceDB vector store
        let vector_store = Arc::new(
            VectorStoreService::new(lance_db_path, "episodic_memory").await?
        );

        // Initialize RAFT service with default configuration
        let raft_service = Arc::new(Mutex::new(RaftService::with_defaults()));
        log::info!("✓ RAFT hallucination reduction initialized (relevance: 0.5, confidence: 0.6)");

        Ok(Self {
            db,
            embedding_service,
            vector_store,
            raft_service,
        })
    }

    /// Store a conversation episode with embedding in LanceDB
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

        // Store metadata in SQLite (without embedding JSON)
        {
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
                    id, // embedding_id references the LanceDB record
                ],
            )?;
        }

        // Store embedding in LanceDB
        let metadata = serde_json::json!({
            "satisfaction": satisfaction,
            "created_at": created_at,
            "importance": satisfaction,
        }).to_string();

        let vector_record = VectorRecord {
            id: id.clone(),
            text: combined_text,
            embedding,
            metadata,
        };

        self.vector_store.insert(vec![vector_record]).await?;

        log::info!("Stored episode with ID: {} in LanceDB", id);
        Ok(id)
    }

    /// Retrieve relevant episodes for a query using LanceDB vector search
    pub async fn retrieve_relevant(&self, query: &str, top_k: usize) -> Result<Vec<Episode>> {
        log::info!("Retrieving {} relevant episodes for query using LanceDB", top_k);

        // Generate query embedding
        let query_embedding = self.embedding_service.embed(query)?;

        // Search LanceDB for similar vectors
        let search_results = self.vector_store.search(&query_embedding, top_k).await?;

        // Fetch metadata from SQLite for the found IDs
        let ids: Vec<String> = search_results.iter().map(|r| r.id.clone()).collect();
        let episodes = self.get_episodes_by_ids(&ids)?;

        // Update access counts
        self.increment_access_counts(&ids)?;

        log::info!("Retrieved {} relevant episodes using LanceDB", episodes.len());
        Ok(episodes)
    }

    /// Retrieve relevant episodes with temporal decay ranking (v3.8.0 Phase 3)
    /// Combines LanceDB semantic similarity with temporal retention scores
    pub async fn retrieve_relevant_with_temporal(
        &self,
        query: &str,
        top_k: usize,
    ) -> Result<Vec<Episode>> {
        log::info!("Retrieving {} relevant episodes with temporal ranking", top_k);

        // Generate query embedding
        let query_embedding = self.embedding_service.embed(query)?;

        // Search LanceDB (get more results for re-ranking)
        let candidate_count = top_k * 3; // Get 3x candidates for temporal re-ranking
        let search_results = self.vector_store.search(&query_embedding, candidate_count).await?;

        // Fetch episodes with retention scores from SQLite
        let ids: Vec<String> = search_results.iter().map(|r| r.id.clone()).collect();
        let episodes_with_retention = self.get_episodes_with_retention(&ids)?;

        // Combine semantic similarity from LanceDB with temporal retention
        let mut scored_episodes: Vec<(Episode, f32)> = search_results
            .iter()
            .filter_map(|result| {
                episodes_with_retention.iter()
                    .find(|(ep, _)| ep.id == result.id)
                    .map(|(episode, retention_score)| {
                        // Weighted combination: 70% semantic, 30% temporal
                        let combined_score = (result.score * 0.7) + (retention_score * 0.3);
                        (episode.clone(), combined_score)
                    })
            })
            .collect();

        // Sort by combined score (highest first)
        scored_episodes.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Take top K
        let top_episodes: Vec<Episode> = scored_episodes
            .into_iter()
            .take(top_k)
            .map(|(episode, _score)| episode)
            .collect();

        // Update access counts
        let top_ids: Vec<String> = top_episodes.iter().map(|e| e.id.clone()).collect();
        self.increment_access_counts(&top_ids)?;

        log::info!("Retrieved {} temporally-ranked episodes", top_episodes.len());
        Ok(top_episodes)
    }

    /// Search memory semantically using LanceDB
    pub async fn search_memory(&self, query: &str, limit: usize) -> Result<Vec<Episode>> {
        self.retrieve_relevant(query, limit).await
    }

    /// Search memory with temporal ranking (v3.8.0 Phase 3)
    pub async fn search_memory_temporal(&self, query: &str, limit: usize) -> Result<Vec<Episode>> {
        self.retrieve_relevant_with_temporal(query, limit).await
    }

    /// Search episodes with similarity scores (v3.8.0 Phase 4 - for contextual retrieval)
    /// Returns episodes paired with their LanceDB similarity scores
    pub async fn search_with_scores(&self, query: &str, top_k: usize) -> Result<Vec<(Episode, f32)>> {
        log::info!("Searching {} episodes with similarity scores", top_k);

        // Generate query embedding
        let query_embedding = self.embedding_service.embed(query)?;

        // Search LanceDB
        let search_results = self.vector_store.search(&query_embedding, top_k).await?;

        // Fetch episodes from SQLite
        let ids: Vec<String> = search_results.iter().map(|r| r.id.clone()).collect();
        let episodes = self.get_episodes_by_ids(&ids)?;

        // Pair episodes with their similarity scores
        let scored_episodes: Vec<(Episode, f32)> = search_results
            .iter()
            .filter_map(|result| {
                episodes.iter()
                    .find(|ep| ep.id == result.id)
                    .map(|episode| (episode.clone(), result.score))
            })
            .collect();

        // Note: Intentionally NOT updating access counts here
        log::info!("Found {} scored episodes", scored_episodes.len());
        Ok(scored_episodes)
    }

    /// Retrieve relevant episodes with RAFT hallucination reduction (v3.4.0 Phase 7)
    /// Returns: (episodes, has_high_confidence, raft_prompt)
    pub async fn retrieve_relevant_with_raft(
        &self,
        query: &str,
        top_k: usize,
    ) -> Result<(Vec<Episode>, bool, String)> {
        log::info!("Retrieving {} relevant episodes with RAFT filtering", top_k);

        // Generate query embedding
        let query_embedding = self.embedding_service.embed(query)?;

        // Search LanceDB for candidates (get 3x for RAFT filtering)
        let candidate_count = top_k * 3;
        let search_results = self.vector_store.search(&query_embedding, candidate_count).await?;

        // Fetch episodes from SQLite
        let ids: Vec<String> = search_results.iter().map(|r| r.id.clone()).collect();
        let episodes = self.get_episodes_by_ids(&ids)?;

        // Pair episodes with similarity scores for RAFT
        let scored_episodes: Vec<(Episode, f32)> = search_results
            .iter()
            .filter_map(|result| {
                episodes.iter()
                    .find(|ep| ep.id == result.id)
                    .map(|episode| (episode.clone(), result.score))
            })
            .collect();

        // Get all episodes for distractor injection
        let all_episodes = self.get_recent_episodes(100)?;

        // Apply RAFT filtering and ranking
        let raft_guard = self.raft_service.lock().unwrap();
        let (raft_episodes, has_high_confidence) =
            raft_guard.filter_and_rank(scored_episodes, all_episodes);

        // Format RAFT-enhanced prompt
        let raft_prompt = raft_guard.format_for_prompt(&raft_episodes, has_high_confidence);

        // Extract Episode objects (without RAFT metadata)
        let final_episodes: Vec<Episode> = raft_episodes
            .iter()
            .map(|raft_ep| raft_ep.episode.clone())
            .collect();

        // Update access counts for relevant episodes only (not distractors)
        let relevant_ids: Vec<String> = raft_episodes
            .iter()
            .filter(|raft_ep| !raft_ep.is_distractor)
            .map(|raft_ep| raft_ep.episode.id.clone())
            .collect();
        self.increment_access_counts(&relevant_ids)?;

        log::info!(
            "RAFT filtered to {} episodes (confidence: {}, relevant: {})",
            final_episodes.len(),
            if has_high_confidence { "HIGH" } else { "LOW" },
            relevant_ids.len()
        );

        Ok((final_episodes, has_high_confidence, raft_prompt))
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
    /// Also removes vectors from LanceDB
    pub async fn cleanup_old_memories(&self) -> Result<usize> {
        let threshold_timestamp = chrono::Utc::now().timestamp() - (30 * 24 * 60 * 60); // 30 days

        // Get IDs of memories to delete
        let ids_to_delete: Vec<String> = {
            let db_guard = self.db.lock().unwrap();
            let db = db_guard.conn();

            let mut stmt = db.prepare(
                "SELECT id FROM episodic_memory
                 WHERE created_at < ?1 AND access_count < 3 AND satisfaction < 0.5"
            )?;

            let ids: rusqlite::Result<Vec<String>> = stmt
                .query_map([threshold_timestamp], |row| row.get(0))?
                .collect();

            ids?
        };

        let count = ids_to_delete.len();

        if count > 0 {
            // Delete from LanceDB
            self.vector_store.delete(&ids_to_delete).await?;

            // Delete from SQLite
            let db_guard = self.db.lock().unwrap();
            let db = db_guard.conn();
            db.execute(
                "DELETE FROM episodic_memory
                 WHERE created_at < ?1 AND access_count < 3 AND satisfaction < 0.5",
                [threshold_timestamp],
            )?;
        }

        log::info!("Cleaned up {} old memories", count);
        Ok(count)
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

    /// Get vector count from LanceDB
    pub async fn get_vector_count(&self) -> Result<usize> {
        self.vector_store.count().await
    }

    /// Optimize LanceDB storage (compact and rebuild indexes)
    pub async fn optimize_vector_store(&self) -> Result<()> {
        log::info!("Optimizing LanceDB vector store");
        self.vector_store.compact().await?;
        log::info!("Vector store optimization complete");
        Ok(())
    }

    /// Create optimized index for large datasets (>10,000 vectors)
    /// Call this after storing a large number of episodes
    pub async fn create_search_index(&self) -> Result<()> {
        let count = self.vector_store.count().await?;
        if count < 10_000 {
            log::info!("Skipping index creation: only {} vectors (need 10,000+)", count);
            return Ok(());
        }

        let num_partitions = (count as f64).sqrt() as usize;
        let num_sub_vectors = 1024 / 16; // BGE-M3 dimension / 16

        log::info!("Creating IVF-PQ index for {} vectors", count);
        self.vector_store.create_index(num_partitions, num_sub_vectors).await?;
        log::info!("Search index created successfully");
        Ok(())
    }

    // === Private helper methods ===

    /// Get episodes by their IDs from SQLite
    fn get_episodes_by_ids(&self, ids: &[String]) -> Result<Vec<Episode>> {
        if ids.is_empty() {
            return Ok(vec![]);
        }

        let db_guard = self.db.lock().unwrap();
        let db = db_guard.conn();

        // Build placeholders for IN clause
        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!(
            "SELECT id, user_message, ai_response, satisfaction, created_at,
                    access_count, importance, embedding_id
             FROM episodic_memory
             WHERE id IN ({})",
            placeholders
        );

        let mut stmt = db.prepare(&query)?;
        let episodes = stmt
            .query_map(rusqlite::params_from_iter(ids), |row| {
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

    /// Get episodes with retention scores by IDs (v3.8.0 Phase 3)
    fn get_episodes_with_retention(&self, ids: &[String]) -> Result<Vec<(Episode, f32)>> {
        if ids.is_empty() {
            return Ok(vec![]);
        }

        let db_guard = self.db.lock().unwrap();
        let db = db_guard.conn();

        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!(
            "SELECT id, user_message, ai_response, satisfaction, created_at,
                    access_count, importance, embedding_id,
                    COALESCE(retention_score, 1.0) as retention_score
             FROM episodic_memory
             WHERE id IN ({})",
            placeholders
        );

        let mut stmt = db.prepare(&query)?;
        let episodes = stmt
            .query_map(rusqlite::params_from_iter(ids), |row| {
                let episode = Episode {
                    id: row.get(0)?,
                    user_message: row.get(1)?,
                    ai_response: row.get(2)?,
                    satisfaction: row.get(3)?,
                    created_at: row.get(4)?,
                    access_count: row.get(5)?,
                    importance: row.get(6)?,
                    embedding_id: row.get(7)?,
                };
                let retention_score: f32 = row.get::<_, f64>(8)? as f32;
                Ok((episode, retention_score))
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

    // === RAFT Configuration Methods (v3.4.0 Phase 7) ===

    /// Get current RAFT configuration
    pub fn get_raft_config(&self) -> Result<RaftConfig> {
        let raft_guard = self.raft_service.lock().unwrap();
        Ok(raft_guard.get_config().clone())
    }

    /// Update RAFT configuration
    pub fn update_raft_config(&self, config: RaftConfig) -> Result<()> {
        let mut raft_guard = self.raft_service.lock().unwrap();
        *raft_guard = RaftService::new(config);
        log::info!("✓ RAFT configuration updated");
        Ok(())
    }

    /// Detect hallucination in AI response using RAFT heuristics
    pub fn detect_hallucination(&self, response: &str, context_episodes: &[Episode]) -> Result<bool> {
        let raft_guard = self.raft_service.lock().unwrap();
        Ok(raft_guard.detect_hallucination(response, context_episodes))
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

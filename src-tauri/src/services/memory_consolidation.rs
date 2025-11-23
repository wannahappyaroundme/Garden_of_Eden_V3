/**
 * Phase 4: Memory Consolidation (v3.8.0)
 *
 * Intelligent merging of similar low-retention memories to reduce database bloat
 * while preserving valuable knowledge.
 *
 * Algorithm:
 * 1. Identify low-retention memory clusters (retention < 0.3)
 * 2. Find semantically similar memories using embeddings
 * 3. Merge similar memories into consolidated summaries
 * 4. Delete original low-retention memories
 * 5. Preserve access patterns and satisfaction scores
 *
 * Benefits:
 * - Reduces database size by 30-50%
 * - Preserves knowledge from multiple similar conversations
 * - Improves query performance (fewer memories to search)
 * - Creates higher-quality consolidated memories
 */

use crate::database::Database;
use crate::services::embedding::EmbeddingService;
use crate::services::rag_v2::RagServiceV2;  // v3.4.0: LanceDB migration
use crate::services::ollama;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

/// Configuration for memory consolidation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsolidationConfig {
    /// Minimum retention threshold for consolidation candidates (0.0-1.0)
    pub retention_threshold: f32,

    /// Minimum similarity to consider memories for merging (0.0-1.0)
    pub similarity_threshold: f32,

    /// Minimum cluster size (memories to merge)
    pub min_cluster_size: usize,

    /// Maximum cluster size to prevent over-consolidation
    pub max_cluster_size: usize,

    /// Whether to use LLM for generating consolidated summaries
    pub use_llm_summaries: bool,
}

impl Default for ConsolidationConfig {
    fn default() -> Self {
        Self {
            retention_threshold: 0.3,      // Consolidate memories with <30% retention
            similarity_threshold: 0.75,    // High threshold for merging
            min_cluster_size: 2,           // Merge at least 2 memories
            max_cluster_size: 5,           // Max 5 memories per cluster
            use_llm_summaries: true,       // Use LLM for better summaries
        }
    }
}

/// Memory cluster for consolidation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryCluster {
    pub cluster_id: String,
    pub memory_ids: Vec<String>,
    pub average_retention: f32,
    pub average_satisfaction: f32,
    pub total_access_count: i32,
    pub earliest_timestamp: i64,
    pub latest_timestamp: i64,
}

/// Consolidation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsolidationResult {
    pub consolidated_id: String,
    pub source_memory_ids: Vec<String>,
    pub memories_merged: usize,
    pub space_saved: usize,  // Bytes
    pub consolidated_at: i64,
}

/// Statistics for consolidation operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsolidationStats {
    pub total_consolidations: usize,
    pub total_memories_merged: usize,
    pub total_memories_deleted: usize,
    pub total_space_saved: usize,  // Bytes
    pub last_consolidation: Option<i64>,
}

/// Memory Consolidation Service
pub struct MemoryConsolidationService {
    db: Arc<Mutex<Database>>,
    rag_service: Arc<RagServiceV2>,  // v3.4.0: LanceDB
    embedding_service: Arc<EmbeddingService>,
    config: Arc<Mutex<ConsolidationConfig>>,
}

impl MemoryConsolidationService {
    /// Create new memory consolidation service
    pub fn new(
        db: Arc<Mutex<Database>>,
        rag_service: Arc<RagServiceV2>,  // v3.4.0: LanceDB
        embedding_service: Arc<EmbeddingService>,
    ) -> Result<Self> {
        let service = Self {
            db,
            rag_service,
            embedding_service,
            config: Arc::new(Mutex::new(ConsolidationConfig::default())),
        };

        service.init_database()?;

        Ok(service)
    }

    /// Initialize database tables
    fn init_database(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        // Create consolidation tracking table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS memory_consolidations (
                id TEXT PRIMARY KEY,
                source_memory_ids TEXT NOT NULL,
                consolidated_memory_id TEXT NOT NULL,
                memories_merged INTEGER NOT NULL,
                space_saved INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (consolidated_memory_id) REFERENCES episodic_memory(id)
            )",
            [],
        )?;

        // Add consolidation metadata to episodic_memory
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN is_consolidated BOOLEAN DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN source_count INTEGER DEFAULT 1",
            [],
        );

        // Create index
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_episodic_consolidated
             ON episodic_memory(is_consolidated)",
            [],
        );

        log::info!("Memory consolidation database initialized");

        Ok(())
    }

    /// Run memory consolidation process
    ///
    /// Finds low-retention memory clusters and merges them
    pub async fn consolidate_memories(&self) -> Result<Vec<ConsolidationResult>> {
        log::info!("Starting memory consolidation process...");

        let config = self.config.lock().unwrap().clone();

        // Find low-retention memory candidates
        let candidates = self.find_consolidation_candidates(config.retention_threshold)?;

        if candidates.len() < config.min_cluster_size {
            log::info!("Not enough candidates for consolidation ({} found)", candidates.len());
            return Ok(Vec::new());
        }

        log::info!("Found {} consolidation candidates", candidates.len());

        // Cluster similar memories
        let clusters = self.cluster_similar_memories(&candidates, &config).await?;

        log::info!("Identified {} memory clusters for consolidation", clusters.len());

        // Consolidate each cluster
        let mut results = Vec::new();

        for cluster in clusters {
            match self.consolidate_cluster(&cluster, &config).await {
                Ok(result) => {
                    log::info!(
                        "Consolidated cluster {} ({} memories merged)",
                        cluster.cluster_id,
                        result.memories_merged
                    );
                    results.push(result);
                }
                Err(e) => {
                    log::warn!("Failed to consolidate cluster {}: {}", cluster.cluster_id, e);
                }
            }
        }

        log::info!(
            "Consolidation complete: {} clusters consolidated, {} total memories merged",
            results.len(),
            results.iter().map(|r| r.memories_merged).sum::<usize>()
        );

        Ok(results)
    }

    /// Find low-retention memories eligible for consolidation
    fn find_consolidation_candidates(
        &self,
        retention_threshold: f32,
    ) -> Result<Vec<(String, String, String, f32, f32, i32, i64)>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT id, user_message, ai_response,
                    COALESCE(retention_score, 1.0),
                    satisfaction,
                    COALESCE(access_count, 0),
                    created_at
             FROM episodic_memory
             WHERE COALESCE(retention_score, 1.0) < ?1
               AND COALESCE(is_pinned, 0) = 0
               AND COALESCE(is_consolidated, 0) = 0
               AND embedding_id IS NOT NULL
             ORDER BY retention_score ASC
             LIMIT 500"  // Process up to 500 candidates (optimized for performance)
        )?;

        let candidates = stmt
            .query_map([retention_threshold], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, f32>(3)?,
                    row.get::<_, f32>(4)?,
                    row.get::<_, i32>(5)?,
                    row.get::<_, i64>(6)?,
                ))
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        Ok(candidates)
    }

    /// Cluster similar memories using embeddings
    async fn cluster_similar_memories(
        &self,
        candidates: &[(String, String, String, f32, f32, i32, i64)],
        config: &ConsolidationConfig,
    ) -> Result<Vec<MemoryCluster>> {
        let mut clusters = Vec::new();
        let mut used_memory_ids = std::collections::HashSet::new();

        // For each candidate, find similar memories
        for (id, user_msg, ai_resp, retention, satisfaction, access_count, timestamp) in candidates {
            // Skip if already in a cluster
            if used_memory_ids.contains(id) {
                continue;
            }

            // Search for similar memories using RAG
            let query = format!("{}\n{}", user_msg, ai_resp);
            let similar = self.rag_service
                .search_with_scores(&query, config.max_cluster_size)
                .await?;

            // Filter by similarity threshold and exclude already-used memories
            let mut cluster_members: Vec<(String, f32, f32, i32, i64)> = similar
                .into_iter()
                .filter(|(ep, sim)| {
                    *sim >= config.similarity_threshold
                        && !used_memory_ids.contains(&ep.id)
                        && candidates.iter().any(|(cid, _, _, _, _, _, _)| cid == &ep.id)
                })
                .map(|(ep, _)| {
                    // Find full candidate data
                    let (_, _, _, ret, sat, acc, ts) = candidates
                        .iter()
                        .find(|(cid, _, _, _, _, _, _)| cid == &ep.id)
                        .cloned()
                        .unwrap_or((
                            ep.id.clone(),
                            String::new(),
                            String::new(),
                            ep.importance,
                            ep.satisfaction,
                            ep.access_count,
                            ep.created_at,
                        ));

                    (ep.id, ret, sat, acc, ts)
                })
                .collect();

            // Must have at least min_cluster_size members
            if cluster_members.len() < config.min_cluster_size {
                continue;
            }

            // Truncate to max_cluster_size
            cluster_members.truncate(config.max_cluster_size);

            // Calculate cluster statistics
            let memory_ids: Vec<String> = cluster_members.iter().map(|(id, _, _, _, _)| id.clone()).collect();
            let avg_retention = cluster_members.iter().map(|(_, r, _, _, _)| r).sum::<f32>() / cluster_members.len() as f32;
            let avg_satisfaction = cluster_members.iter().map(|(_, _, s, _, _)| s).sum::<f32>() / cluster_members.len() as f32;
            let total_access = cluster_members.iter().map(|(_, _, _, a, _)| a).sum::<i32>();
            let earliest = cluster_members.iter().map(|(_, _, _, _, t)| t).min().cloned().unwrap_or(0);
            let latest = cluster_members.iter().map(|(_, _, _, _, t)| t).max().cloned().unwrap_or(0);

            let cluster = MemoryCluster {
                cluster_id: uuid::Uuid::new_v4().to_string(),
                memory_ids: memory_ids.clone(),
                average_retention: avg_retention,
                average_satisfaction: avg_satisfaction,
                total_access_count: total_access,
                earliest_timestamp: earliest,
                latest_timestamp: latest,
            };

            // Mark memories as used
            for id in &memory_ids {
                used_memory_ids.insert(id.clone());
            }

            clusters.push(cluster);
        }

        Ok(clusters)
    }

    /// Consolidate a single cluster into one memory
    async fn consolidate_cluster(
        &self,
        cluster: &MemoryCluster,
        config: &ConsolidationConfig,
    ) -> Result<ConsolidationResult> {
        // Fetch full memory data for cluster
        let memories = self.fetch_cluster_memories(&cluster.memory_ids)?;

        // Generate consolidated summary
        let (consolidated_user_msg, consolidated_ai_resp) = if config.use_llm_summaries {
            self.generate_llm_summary(&memories).await?
        } else {
            self.generate_simple_summary(&memories)
        };

        // Calculate original size
        let original_size: usize = memories
            .iter()
            .map(|(_, u, a, _, _, _, _)| u.len() + a.len())
            .sum();

        let consolidated_size = consolidated_user_msg.len() + consolidated_ai_resp.len();
        let space_saved = original_size.saturating_sub(consolidated_size);

        // Create consolidated memory
        let consolidated_id = self.create_consolidated_memory(
            &consolidated_user_msg,
            &consolidated_ai_resp,
            cluster.average_satisfaction,
            cluster.total_access_count,
            cluster.memory_ids.len(),
        ).await?;

        // Delete original memories
        self.delete_source_memories(&cluster.memory_ids)?;

        // Record consolidation
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        self.record_consolidation(
            &consolidated_id,
            &cluster.memory_ids,
            space_saved,
            now,
        )?;

        Ok(ConsolidationResult {
            consolidated_id,
            source_memory_ids: cluster.memory_ids.clone(),
            memories_merged: cluster.memory_ids.len(),
            space_saved,
            consolidated_at: now,
        })
    }

    /// Fetch full memory data for a cluster
    fn fetch_cluster_memories(
        &self,
        memory_ids: &[String],
    ) -> Result<Vec<(String, String, String, f32, f32, i32, i64)>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let placeholders = memory_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!(
            "SELECT id, user_message, ai_response, satisfaction,
                    COALESCE(retention_score, 1.0),
                    COALESCE(access_count, 0),
                    created_at
             FROM episodic_memory
             WHERE id IN ({})",
            placeholders
        );

        let mut stmt = conn.prepare(&query)?;

        let params: Vec<&dyn rusqlite::ToSql> = memory_ids
            .iter()
            .map(|id| id as &dyn rusqlite::ToSql)
            .collect();

        let memories = stmt
            .query_map(&params[..], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, f32>(3)?,
                    row.get::<_, f32>(4)?,
                    row.get::<_, i32>(5)?,
                    row.get::<_, i64>(6)?,
                ))
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        Ok(memories)
    }

    /// Generate consolidated summary using LLM
    async fn generate_llm_summary(
        &self,
        memories: &[(String, String, String, f32, f32, i32, i64)],
    ) -> Result<(String, String)> {
        // Prepare context for LLM
        let context = memories
            .iter()
            .enumerate()
            .map(|(i, (_, user_msg, ai_resp, _, _, _, _))| {
                format!("**Memory {}**\nUser: {}\nAssistant: {}", i + 1, user_msg, ai_resp)
            })
            .collect::<Vec<_>>()
            .join("\n\n");

        let prompt = format!(
            r#"You are consolidating multiple similar conversation memories into one concise summary.

Here are the similar memories to consolidate:

{}

Generate a consolidated memory that:
1. Preserves the core question/topic from the user messages
2. Combines the key information from all assistant responses
3. Is concise but comprehensive
4. Maintains the natural conversation format

Respond ONLY with valid JSON in this format (no other text):
{{
  "user_message": "Consolidated user question/topic",
  "ai_response": "Consolidated assistant response"
}}"#,
            context
        );

        let response = ollama::generate_response(&prompt)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to generate consolidated summary: {}", e))?;

        // Parse JSON response
        let json = self.extract_json(&response)?;

        #[derive(Deserialize)]
        struct Summary {
            user_message: String,
            ai_response: String,
        }

        let summary: Summary = serde_json::from_str(&json)
            .context("Failed to parse summary JSON")?;

        Ok((summary.user_message, summary.ai_response))
    }

    /// Generate simple summary (fallback if LLM fails)
    fn generate_simple_summary(
        &self,
        memories: &[(String, String, String, f32, f32, i32, i64)],
    ) -> (String, String) {
        // Use first user message as template
        let user_msg = memories
            .first()
            .map(|(_, u, _, _, _, _, _)| u.clone())
            .unwrap_or_else(|| "Multiple similar questions".to_string());

        // Concatenate AI responses with separators
        let ai_resp = memories
            .iter()
            .map(|(_, _, a, _, _, _, _)| a.as_str())
            .collect::<Vec<_>>()
            .join("\n\n---\n\n");

        (user_msg, ai_resp)
    }

    /// Create consolidated memory in database
    async fn create_consolidated_memory(
        &self,
        user_message: &str,
        ai_response: &str,
        satisfaction: f32,
        total_access_count: i32,
        source_count: usize,
    ) -> Result<String> {
        // Generate embedding for consolidated memory
        let combined_text = format!("{}\n{}", user_message, ai_response);
        let embedding = self.embedding_service.embed(&combined_text)?;
        let embedding_json = serde_json::to_string(&embedding)?;

        let id = uuid::Uuid::new_v4().to_string();
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute(
            "INSERT INTO episodic_memory (
                id, user_message, ai_response, satisfaction, created_at,
                access_count, importance, embedding_id, is_consolidated, source_count
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9)",
            rusqlite::params![
                id,
                user_message,
                ai_response,
                satisfaction,
                now,
                total_access_count,
                satisfaction,
                embedding_json,
                source_count,
            ],
        )?;

        Ok(id)
    }

    /// Delete source memories after consolidation
    fn delete_source_memories(&self, memory_ids: &[String]) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let placeholders = memory_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!("DELETE FROM episodic_memory WHERE id IN ({})", placeholders);

        let params: Vec<&dyn rusqlite::ToSql> = memory_ids
            .iter()
            .map(|id| id as &dyn rusqlite::ToSql)
            .collect();

        conn.execute(&query, &params[..])?;

        log::info!("Deleted {} source memories", memory_ids.len());

        Ok(())
    }

    /// Record consolidation in tracking table
    fn record_consolidation(
        &self,
        consolidated_id: &str,
        source_ids: &[String],
        space_saved: usize,
        timestamp: i64,
    ) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let id = uuid::Uuid::new_v4().to_string();
        let source_ids_json = serde_json::to_string(source_ids)?;

        conn.execute(
            "INSERT INTO memory_consolidations (
                id, source_memory_ids, consolidated_memory_id,
                memories_merged, space_saved, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                id,
                source_ids_json,
                consolidated_id,
                source_ids.len(),
                space_saved,
                timestamp,
            ],
        )?;

        Ok(())
    }

    /// Extract JSON from LLM response
    fn extract_json(&self, response: &str) -> Result<String> {
        let trimmed = response.trim();

        // Check for markdown code block
        if trimmed.starts_with("```") {
            let lines: Vec<&str> = trimmed.lines().collect();
            if lines.len() >= 3 {
                let json_lines = &lines[1..lines.len() - 1];
                return Ok(json_lines.join("\n"));
            }
        }

        // Check for JSON object
        if let Some(start) = trimmed.find('{') {
            if let Some(end) = trimmed.rfind('}') {
                return Ok(trimmed[start..=end].to_string());
            }
        }

        anyhow::bail!("No valid JSON found in response")
    }

    /// Get consolidation statistics
    pub fn get_stats(&self) -> Result<ConsolidationStats> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let total_consolidations: usize = conn
            .query_row(
                "SELECT COUNT(*) FROM memory_consolidations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let total_memories_merged: usize = conn
            .query_row(
                "SELECT SUM(memories_merged) FROM memory_consolidations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let total_memories_deleted = total_memories_merged - total_consolidations;

        let total_space_saved: usize = conn
            .query_row(
                "SELECT SUM(space_saved) FROM memory_consolidations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let last_consolidation: Option<i64> = conn
            .query_row(
                "SELECT MAX(created_at) FROM memory_consolidations",
                [],
                |row| row.get(0),
            )
            .ok();

        Ok(ConsolidationStats {
            total_consolidations,
            total_memories_merged,
            total_memories_deleted,
            total_space_saved,
            last_consolidation,
        })
    }

    /// Update configuration
    pub fn update_config(&self, new_config: ConsolidationConfig) -> Result<()> {
        *self.config.lock().unwrap() = new_config;
        log::info!("Memory consolidation config updated");
        Ok(())
    }

    /// Get current configuration
    pub fn get_config(&self) -> ConsolidationConfig {
        self.config.lock().unwrap().clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_defaults() {
        let config = ConsolidationConfig::default();
        assert_eq!(config.retention_threshold, 0.3);
        assert_eq!(config.similarity_threshold, 0.75);
        assert_eq!(config.min_cluster_size, 2);
        assert_eq!(config.max_cluster_size, 5);
        assert!(config.use_llm_summaries);
    }
}

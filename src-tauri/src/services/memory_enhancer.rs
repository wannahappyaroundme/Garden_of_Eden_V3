/**
 * Phase 5: Memory Enhancer (v3.9.0 - Stage 2)
 *
 * Enhances existing memories with additional context and quality scoring.
 *
 * Features:
 * 1. Memory quality scoring (0.0-1.0)
 * 2. Context injection for low-quality memories
 * 3. Automatic enhancement using LLM
 * 4. Batch processing capabilities
 * 5. Integration with RAG service
 *
 * Quality Criteria:
 * - Clarity: Is the memory clear and understandable?
 * - Completeness: Does it contain sufficient context?
 * - Relevance: Is the information useful?
 * - Specificity: Is it specific rather than vague?
 */

use crate::database::Database;
use crate::services::ollama;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Enhanced memory with quality metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedMemory {
    /// Original memory ID
    pub memory_id: String,

    /// Enhanced content
    pub enhanced_content: String,

    /// Quality score (0.0-1.0)
    pub quality_score: f32,

    /// Quality breakdown
    pub quality_metrics: QualityMetrics,

    /// Enhancement timestamp
    pub enhanced_at: i64,

    /// Whether enhancement was applied
    pub was_enhanced: bool,
}

/// Quality metrics for a memory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityMetrics {
    /// Clarity score (0.0-1.0)
    pub clarity: f32,

    /// Completeness score (0.0-1.0)
    pub completeness: f32,

    /// Relevance score (0.0-1.0)
    pub relevance: f32,

    /// Specificity score (0.0-1.0)
    pub specificity: f32,
}

impl QualityMetrics {
    /// Calculate overall quality score
    pub fn overall_score(&self) -> f32 {
        (self.clarity + self.completeness + self.relevance + self.specificity) / 4.0
    }
}

/// Configuration for memory enhancer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEnhancerConfig {
    /// Minimum quality threshold for enhancement
    pub enhancement_threshold: f32,

    /// Enable automatic enhancement
    pub auto_enhance: bool,

    /// Maximum memories to enhance per batch
    pub batch_size: usize,

    /// Enable quality caching
    pub cache_quality_scores: bool,
}

impl Default for MemoryEnhancerConfig {
    fn default() -> Self {
        Self {
            enhancement_threshold: 0.6,
            auto_enhance: true,
            batch_size: 10,
            cache_quality_scores: true,
        }
    }
}

/// Statistics about memory enhancement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancementStats {
    /// Total memories analyzed
    pub total_analyzed: usize,

    /// Memories enhanced
    pub total_enhanced: usize,

    /// Average quality before enhancement
    pub avg_quality_before: f32,

    /// Average quality after enhancement
    pub avg_quality_after: f32,

    /// Enhancement rate (%)
    pub enhancement_rate: f32,
}

/// Memory Enhancer Service
pub struct MemoryEnhancerService {
    db: Arc<Mutex<Database>>,
    config: Arc<Mutex<MemoryEnhancerConfig>>,
}

impl MemoryEnhancerService {
    /// Create new memory enhancer
    pub fn new(db: Arc<Mutex<Database>>) -> Result<Self> {
        // Create enhancement tracking table
        {
            let db_guard = db.lock().unwrap();
            let conn = db_guard.conn();

            conn.execute(
                "CREATE TABLE IF NOT EXISTS memory_enhancements (
                    id TEXT PRIMARY KEY,
                    memory_id TEXT NOT NULL,
                    original_content TEXT NOT NULL,
                    enhanced_content TEXT NOT NULL,
                    quality_score REAL NOT NULL,
                    clarity REAL NOT NULL,
                    completeness REAL NOT NULL,
                    relevance REAL NOT NULL,
                    specificity REAL NOT NULL,
                    was_enhanced INTEGER NOT NULL,
                    enhanced_at INTEGER NOT NULL,
                    FOREIGN KEY (memory_id) REFERENCES episodic_memories(id)
                )",
                [],
            )?;

            // Index for quick lookups
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_enhancements_memory_id
                 ON memory_enhancements(memory_id)",
                [],
            )?;

            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_enhancements_quality
                 ON memory_enhancements(quality_score)",
                [],
            )?;
        }

        log::info!("✓ Memory Enhancer initialized");

        Ok(Self {
            db,
            config: Arc::new(Mutex::new(MemoryEnhancerConfig::default())),
        })
    }

    /// Analyze memory quality
    ///
    /// # Arguments
    /// * `memory_content` - The memory content to analyze
    ///
    /// # Returns
    /// Quality metrics for the memory
    pub async fn analyze_quality(&self, memory_content: &str) -> Result<QualityMetrics> {
        log::debug!("Analyzing memory quality: {}", &memory_content[..memory_content.len().min(100)]);

        let prompt = format!(
            r#"Analyze the quality of this memory entry and rate it on 4 criteria (0.0-1.0):

Memory: "{}"

Rate each criterion:
1. Clarity: Is it clear and understandable?
2. Completeness: Does it have sufficient context?
3. Relevance: Is the information useful?
4. Specificity: Is it specific rather than vague?

Respond ONLY with valid JSON:
{{
    "clarity": 0.0-1.0,
    "completeness": 0.0-1.0,
    "relevance": 0.0-1.0,
    "specificity": 0.0-1.0
}}"#,
            memory_content
        );

        let response = ollama::generate_response(&prompt).await
            .map_err(|e| anyhow::anyhow!("Failed to analyze memory quality: {}", e))?;

        // Parse JSON response
        let metrics: QualityMetrics = serde_json::from_str(&response.trim())
            .context("Failed to parse quality metrics JSON")?;

        log::debug!(
            "Quality analysis: clarity={:.2}, completeness={:.2}, relevance={:.2}, specificity={:.2}",
            metrics.clarity,
            metrics.completeness,
            metrics.relevance,
            metrics.specificity
        );

        Ok(metrics)
    }

    /// Enhance a low-quality memory
    ///
    /// # Arguments
    /// * `memory_content` - The memory content to enhance
    /// * `quality_metrics` - Current quality metrics
    ///
    /// # Returns
    /// Enhanced memory content
    pub async fn enhance_memory(
        &self,
        memory_content: &str,
        quality_metrics: &QualityMetrics,
    ) -> Result<String> {
        log::info!("Enhancing memory (quality: {:.2})", quality_metrics.overall_score());

        // Identify weak areas
        let mut weak_areas = Vec::new();
        if quality_metrics.clarity < 0.7 {
            weak_areas.push("clarity");
        }
        if quality_metrics.completeness < 0.7 {
            weak_areas.push("completeness");
        }
        if quality_metrics.relevance < 0.7 {
            weak_areas.push("relevance");
        }
        if quality_metrics.specificity < 0.7 {
            weak_areas.push("specificity");
        }

        let prompt = format!(
            r#"Enhance this memory entry to improve: {}.

Original memory: "{}"

Instructions:
- Add missing context to make it more complete
- Clarify ambiguous parts
- Make it more specific and actionable
- Preserve the original meaning and facts
- Keep it concise (1-3 sentences)

Respond with ONLY the enhanced memory text, no explanation."#,
            weak_areas.join(", "),
            memory_content
        );

        let enhanced = ollama::generate_response(&prompt).await
            .map_err(|e| anyhow::anyhow!("Failed to enhance memory: {}", e))?;

        let enhanced = enhanced.trim().to_string();

        log::info!("Memory enhanced: {} -> {}",
            &memory_content[..memory_content.len().min(50)],
            &enhanced[..enhanced.len().min(50)]
        );

        Ok(enhanced)
    }

    /// Process and enhance a memory
    ///
    /// # Arguments
    /// * `memory_id` - ID of the memory to enhance
    /// * `memory_content` - Content of the memory
    ///
    /// # Returns
    /// Enhanced memory with quality metrics
    pub async fn process_memory(
        &self,
        memory_id: &str,
        memory_content: &str,
    ) -> Result<EnhancedMemory> {
        let config = self.config.lock().unwrap().clone();

        // Analyze quality
        let quality_metrics = self.analyze_quality(memory_content).await?;
        let quality_score = quality_metrics.overall_score();

        // Determine if enhancement is needed
        let needs_enhancement = quality_score < config.enhancement_threshold;
        let mut enhanced_content = memory_content.to_string();
        let mut was_enhanced = false;

        if needs_enhancement && config.auto_enhance {
            enhanced_content = self.enhance_memory(memory_content, &quality_metrics).await?;
            was_enhanced = true;
        }

        let enhanced_memory = EnhancedMemory {
            memory_id: memory_id.to_string(),
            enhanced_content: enhanced_content.clone(),
            quality_score,
            quality_metrics: quality_metrics.clone(),
            enhanced_at: chrono::Utc::now().timestamp(),
            was_enhanced,
        };

        // Store enhancement
        if config.cache_quality_scores {
            self.store_enhancement(&enhanced_memory, memory_content).await?;
        }

        Ok(enhanced_memory)
    }

    /// Batch enhance multiple memories
    ///
    /// # Arguments
    /// * `memory_ids` - List of memory IDs to enhance
    ///
    /// # Returns
    /// List of enhanced memories
    pub async fn batch_enhance(&self, memory_ids: Vec<String>) -> Result<Vec<EnhancedMemory>> {
        let config = self.config.lock().unwrap().clone();
        let batch_size = config.batch_size.min(memory_ids.len());

        log::info!("Batch enhancing {} memories", batch_size);

        let mut enhanced_memories = Vec::new();

        for memory_id in memory_ids.iter().take(batch_size) {
            // Fetch memory content from database
            let memory_content = self.get_memory_content(memory_id)?;

            match self.process_memory(memory_id, &memory_content).await {
                Ok(enhanced) => enhanced_memories.push(enhanced),
                Err(e) => {
                    log::warn!("Failed to enhance memory {}: {}", memory_id, e);
                    continue;
                }
            }
        }

        log::info!("Batch enhancement complete: {}/{} succeeded",
            enhanced_memories.len(), batch_size);

        Ok(enhanced_memories)
    }

    /// Get enhancement statistics
    pub fn get_stats(&self) -> Result<EnhancementStats> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let total_analyzed: usize = conn.query_row(
            "SELECT COUNT(*) FROM memory_enhancements",
            [],
            |row| row.get(0),
        )?;

        let total_enhanced: usize = conn.query_row(
            "SELECT COUNT(*) FROM memory_enhancements WHERE was_enhanced = 1",
            [],
            |row| row.get(0),
        )?;

        let avg_quality_before: f32 = conn.query_row(
            "SELECT AVG(quality_score) FROM memory_enhancements WHERE was_enhanced = 1",
            [],
            |row| row.get(0),
        ).unwrap_or(0.0);

        let avg_quality_after: f32 = conn.query_row(
            "SELECT AVG(quality_score) FROM memory_enhancements WHERE was_enhanced = 0",
            [],
            |row| row.get(0),
        ).unwrap_or(0.0);

        let enhancement_rate = if total_analyzed > 0 {
            (total_enhanced as f32 / total_analyzed as f32) * 100.0
        } else {
            0.0
        };

        Ok(EnhancementStats {
            total_analyzed,
            total_enhanced,
            avg_quality_before,
            avg_quality_after,
            enhancement_rate,
        })
    }

    /// Get memory content from database
    fn get_memory_content(&self, memory_id: &str) -> Result<String> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let content: String = conn.query_row(
            "SELECT user_message || ' ' || ai_response FROM episodic_memories WHERE id = ?1",
            [memory_id],
            |row| row.get(0),
        )?;

        Ok(content)
    }

    /// Store enhancement in database
    async fn store_enhancement(
        &self,
        enhanced: &EnhancedMemory,
        original_content: &str,
    ) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let enhancement_id = uuid::Uuid::new_v4().to_string();

        conn.execute(
            "INSERT OR REPLACE INTO memory_enhancements
             (id, memory_id, original_content, enhanced_content, quality_score,
              clarity, completeness, relevance, specificity, was_enhanced, enhanced_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            rusqlite::params![
                enhancement_id,
                enhanced.memory_id,
                original_content,
                enhanced.enhanced_content,
                enhanced.quality_score,
                enhanced.quality_metrics.clarity,
                enhanced.quality_metrics.completeness,
                enhanced.quality_metrics.relevance,
                enhanced.quality_metrics.specificity,
                if enhanced.was_enhanced { 1 } else { 0 },
                enhanced.enhanced_at,
            ],
        )?;

        Ok(())
    }

    /// Update configuration
    pub fn update_config(&self, new_config: MemoryEnhancerConfig) {
        *self.config.lock().unwrap() = new_config;
        log::info!("Memory enhancer config updated");
    }

    /// Get current configuration
    pub fn get_config(&self) -> MemoryEnhancerConfig {
        self.config.lock().unwrap().clone()
    }

    /// Get enhanced memory by ID
    pub fn get_enhancement(&self, memory_id: &str) -> Result<Option<EnhancedMemory>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT memory_id, enhanced_content, quality_score, clarity, completeness,
                    relevance, specificity, was_enhanced, enhanced_at
             FROM memory_enhancements
             WHERE memory_id = ?1
             ORDER BY enhanced_at DESC
             LIMIT 1"
        )?;

        let result = stmt.query_row([memory_id], |row| {
            Ok(EnhancedMemory {
                memory_id: row.get(0)?,
                enhanced_content: row.get(1)?,
                quality_score: row.get(2)?,
                quality_metrics: QualityMetrics {
                    clarity: row.get(3)?,
                    completeness: row.get(4)?,
                    relevance: row.get(5)?,
                    specificity: row.get(6)?,
                },
                was_enhanced: row.get::<_, i32>(7)? == 1,
                enhanced_at: row.get(8)?,
            })
        });

        match result {
            Ok(enhanced) => Ok(Some(enhanced)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quality_metrics_overall_score() {
        let metrics = QualityMetrics {
            clarity: 0.8,
            completeness: 0.6,
            relevance: 0.9,
            specificity: 0.7,
        };

        let overall = metrics.overall_score();
        assert!((overall - 0.75).abs() < 0.01);
    }

    #[test]
    fn test_config_defaults() {
        let config = MemoryEnhancerConfig::default();
        assert_eq!(config.enhancement_threshold, 0.6);
        assert!(config.auto_enhance);
        assert_eq!(config.batch_size, 10);
        assert!(config.cache_quality_scores);
    }
}

/**
 * Phase 3: Temporal Memory (v3.8.0)
 *
 * Ebbinghaus Forgetting Curve implementation with gradual decay:
 * - R(t) = max(min_retention, e^(-t/S))
 * - S = 20.0 (gradual decay per user requirement)
 * - 24h: ~100% retention
 * - 30d: ~22-50% retention (with access boost)
 * - 90d: ≥10% minimum retention
 *
 * Features:
 * - Memory pinning (important events never decay)
 * - Access-based retention boost
 * - Automated decay updates every 24 hours
 * - Configurable decay strength per memory
 */

use crate::database::Database;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

/// Memory type classification for adaptive decay
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MemoryType {
    /// Factual knowledge: code, definitions, technical terms (S=40.0)
    Factual,
    /// Procedural: instructions, workflows, how-to (S=30.0)
    Procedural,
    /// Conversational: casual chat, preferences (S=20.0)
    Conversational,
    /// Ephemeral: temporary context, quick Q&A (S=10.0)
    Ephemeral,
}

impl MemoryType {
    /// Classify memory type based on content
    pub fn classify(user_message: &str, ai_response: &str) -> Self {
        let ai_lower = ai_response.to_lowercase();
        let user_lower = user_message.to_lowercase();

        // Factual: Contains code blocks, definitions, or technical documentation
        if ai_response.contains("```") ||
           ai_response.contains("fn ") ||
           ai_response.contains("impl ") ||
           ai_response.contains("struct ") ||
           ai_lower.contains("define") ||
           ai_lower.contains(" means ") ||
           ai_lower.contains("definition") ||
           ai_response.len() > 500 && ai_response.contains("//") {
            return MemoryType::Factual;
        }

        // Procedural: Instructions, steps, how-to guides
        if ai_lower.contains("step") ||
           ai_lower.contains("first,") ||
           ai_lower.contains("second,") ||
           ai_response.contains("1.") ||
           ai_response.contains("2.") ||
           ai_lower.contains("how to") ||
           ai_lower.contains("to do this") ||
           user_lower.contains("how do i") ||
           user_lower.contains("how can i") {
            return MemoryType::Procedural;
        }

        // Ephemeral: Very short responses, confirmations, quick answers
        if ai_response.len() < 100 &&
           !ai_response.contains("```") &&
           (ai_lower.starts_with("yes") ||
            ai_lower.starts_with("no") ||
            ai_lower.starts_with("ok") ||
            ai_lower.starts_with("sure") ||
            ai_lower.contains("got it") ||
            ai_lower.contains("understood")) {
            return MemoryType::Ephemeral;
        }

        // Default: Conversational
        MemoryType::Conversational
    }

    /// Get decay strength (S parameter) for this memory type
    pub fn decay_strength(&self) -> f64 {
        match self {
            MemoryType::Factual => 40.0,       // Very slow decay
            MemoryType::Procedural => 30.0,    // Slow decay
            MemoryType::Conversational => 20.0, // Moderate decay (default)
            MemoryType::Ephemeral => 10.0,     // Fast decay
        }
    }

    /// Convert to string for database storage
    pub fn as_str(&self) -> &'static str {
        match self {
            MemoryType::Factual => "factual",
            MemoryType::Procedural => "procedural",
            MemoryType::Conversational => "conversational",
            MemoryType::Ephemeral => "ephemeral",
        }
    }

    /// Parse from database string
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "factual" => MemoryType::Factual,
            "procedural" => MemoryType::Procedural,
            "ephemeral" => MemoryType::Ephemeral,
            _ => MemoryType::Conversational,
        }
    }
}

/// Temporal memory configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecayConfig {
    /// Base decay strength (S parameter in Ebbinghaus formula)
    /// Higher = slower forgetting. Default: 20.0 for gradual decay
    pub base_strength: f64,

    /// Minimum retention score (floor to prevent complete forgetting)
    pub min_retention: f64,

    /// Maximum retention score (ceiling)
    pub max_retention: f64,

    /// Decay worker interval in hours
    pub decay_worker_interval_hours: u64,

    /// Last time decay worker ran (Unix timestamp)
    pub last_decay_run: Option<i64>,
}

impl Default for DecayConfig {
    fn default() -> Self {
        Self {
            base_strength: 20.0,  // Gradual decay per user requirement
            min_retention: 0.10,  // 10% minimum
            max_retention: 1.0,   // 100% maximum
            decay_worker_interval_hours: 24,
            last_decay_run: None,
        }
    }
}

/// Memory retention statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionStats {
    pub total_memories: usize,
    pub pinned_memories: usize,
    pub high_retention: usize,  // >0.7
    pub medium_retention: usize,  // 0.3-0.7
    pub low_retention: usize,  // <0.3
    pub average_retention: f64,
    pub oldest_memory_days: f64,
    pub newest_memory_days: f64,
}

/// Retention forecast for a memory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionForecast {
    pub memory_id: String,
    pub current_retention: f64,
    pub current_age_days: f64,
    pub days_until_critical: Option<f64>,    // Days until < 0.3
    pub days_until_pruning: Option<f64>,     // Days until < 0.05
    pub predicted_trajectory: Vec<TrajectoryPoint>,
}

/// Point in retention trajectory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrajectoryPoint {
    pub timestamp: i64,
    pub days_from_now: f64,
    pub retention: f64,
}

/// Temporal Memory Service
pub struct TemporalMemoryService {
    db: Arc<Mutex<Database>>,
    config: Arc<Mutex<DecayConfig>>,
}

impl TemporalMemoryService {
    /// Create new temporal memory service
    pub fn new(db: Arc<Mutex<Database>>) -> Result<Self> {
        let service = Self {
            db,
            config: Arc::new(Mutex::new(DecayConfig::default())),
        };

        service.init_database()?;

        Ok(service)
    }

    /// Initialize database tables and columns for temporal memory
    fn init_database(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        // Add new columns to episodic_memory table
        // Note: SQLite doesn't support ALTER TABLE if column exists, so we ignore errors
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN retention_score REAL DEFAULT 1.0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN last_decay_update INTEGER DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN is_pinned BOOLEAN DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN decay_strength REAL DEFAULT 20.0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE episodic_memory ADD COLUMN memory_type TEXT DEFAULT 'conversational'",
            [],
        );

        // Create indexes for performance
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_episodic_retention
             ON episodic_memory(retention_score)",
            [],
        );
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_episodic_decay_update
             ON episodic_memory(last_decay_update)",
            [],
        );
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_episodic_pinned
             ON episodic_memory(is_pinned)",
            [],
        );
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_episodic_memory_type
             ON episodic_memory(memory_type)",
            [],
        );

        // Create config table (singleton)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS memory_decay_config (
                id INTEGER PRIMARY KEY CHECK(id = 1),
                base_strength REAL NOT NULL DEFAULT 20.0,
                min_retention REAL NOT NULL DEFAULT 0.10,
                max_retention REAL NOT NULL DEFAULT 1.0,
                decay_worker_interval_hours INTEGER NOT NULL DEFAULT 24,
                last_decay_run INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        ).context("Failed to create memory_decay_config table")?;

        // Insert default config if not exists
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM memory_decay_config WHERE id = 1",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        if count == 0 {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)?
                .as_secs() as i64;

            conn.execute(
                "INSERT INTO memory_decay_config
                 (id, base_strength, min_retention, max_retention,
                  decay_worker_interval_hours, created_at, updated_at)
                 VALUES (1, 20.0, 0.10, 1.0, 24, ?1, ?2)",
                rusqlite::params![now, now],
            )?;
        }

        Ok(())
    }

    /// Calculate retention using Ebbinghaus curve: R(t) = max(min, e^(-t/S))
    pub fn calculate_retention(
        &self,
        days_elapsed: f64,
        decay_strength: f64,
        access_count: i32,
        is_pinned: bool,
    ) -> f64 {
        if is_pinned {
            return 1.0; // Pinned memories never decay
        }

        let config = self.config.lock().unwrap();

        // Base retention from Ebbinghaus curve
        let base_retention = (-days_elapsed / decay_strength).exp();

        // Boost retention based on access frequency
        // Each access adds 5% boost, capped at 50%
        let access_boost = 1.0 + (access_count as f64 * 0.05).min(0.5);

        // Apply boost and clamp to [min_retention, max_retention]
        let retention = (base_retention * access_boost)
            .max(config.min_retention)
            .min(config.max_retention);

        retention
    }

    /// Update all memory retention scores (called by decay worker)
    pub fn update_all_retention_scores(&self) -> Result<usize> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        // Get all memories with their current data
        let mut stmt = conn.prepare(
            "SELECT id, created_at, access_count, is_pinned, decay_strength
             FROM episodic_memory"
        )?;

        let memories: Vec<(String, i64, i32, bool, f64)> = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, i32>(2).unwrap_or(0),
                    row.get::<_, bool>(3).unwrap_or(false),
                    row.get::<_, f64>(4).unwrap_or(20.0),
                ))
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        let mut update_count = 0;

        // Update each memory's retention score
        for (id, created_at, access_count, is_pinned, decay_strength) in memories {
            let days_elapsed = (now - created_at) as f64 / 86400.0; // seconds to days

            let retention = self.calculate_retention(
                days_elapsed,
                decay_strength,
                access_count,
                is_pinned,
            );

            conn.execute(
                "UPDATE episodic_memory
                 SET retention_score = ?1, last_decay_update = ?2
                 WHERE id = ?3",
                rusqlite::params![retention, now, id],
            )?;

            update_count += 1;
        }

        // Update last_decay_run in config
        conn.execute(
            "UPDATE memory_decay_config SET last_decay_run = ?1, updated_at = ?2 WHERE id = 1",
            rusqlite::params![now, now],
        )?;

        log::info!("Updated {} memory retention scores", update_count);

        Ok(update_count)
    }

    /// Pin a memory (mark as important, prevents decay)
    pub fn pin_memory(&self, memory_id: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute(
            "UPDATE episodic_memory SET is_pinned = 1, retention_score = 1.0 WHERE id = ?1",
            rusqlite::params![memory_id],
        )?;

        log::info!("Pinned memory: {}", memory_id);
        Ok(())
    }

    /// Unpin a memory (resume normal decay)
    pub fn unpin_memory(&self, memory_id: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute(
            "UPDATE episodic_memory SET is_pinned = 0 WHERE id = ?1",
            rusqlite::params![memory_id],
        )?;

        log::info!("Unpinned memory: {}", memory_id);

        // Recalculate retention score for this memory
        let (created_at, access_count, decay_strength): (i64, i32, f64) = conn.query_row(
            "SELECT created_at, access_count, decay_strength FROM episodic_memory WHERE id = ?1",
            rusqlite::params![memory_id],
            |row| Ok((row.get(0)?, row.get(1).unwrap_or(0), row.get(2).unwrap_or(20.0))),
        )?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        let days_elapsed = (now - created_at) as f64 / 86400.0;
        let retention = self.calculate_retention(days_elapsed, decay_strength, access_count, false);

        conn.execute(
            "UPDATE episodic_memory SET retention_score = ?1 WHERE id = ?2",
            rusqlite::params![retention, memory_id],
        )?;

        Ok(())
    }

    /// Prune memories below retention threshold
    pub fn prune_low_retention_memories(&self, threshold: f64) -> Result<usize> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let count = conn.execute(
            "DELETE FROM episodic_memory WHERE retention_score < ?1 AND is_pinned = 0",
            rusqlite::params![threshold],
        )?;

        log::info!("Pruned {} low-retention memories (threshold: {})", count, threshold);

        Ok(count)
    }

    /// Get retention statistics
    pub fn get_retention_stats(&self) -> Result<RetentionStats> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let total_memories: usize = conn.query_row(
            "SELECT COUNT(*) FROM episodic_memory",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let pinned_memories: usize = conn.query_row(
            "SELECT COUNT(*) FROM episodic_memory WHERE is_pinned = 1",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let high_retention: usize = conn.query_row(
            "SELECT COUNT(*) FROM episodic_memory WHERE retention_score > 0.7",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let medium_retention: usize = conn.query_row(
            "SELECT COUNT(*) FROM episodic_memory WHERE retention_score BETWEEN 0.3 AND 0.7",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let low_retention: usize = conn.query_row(
            "SELECT COUNT(*) FROM episodic_memory WHERE retention_score < 0.3",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let average_retention: f64 = conn.query_row(
            "SELECT AVG(retention_score) FROM episodic_memory",
            [],
            |row| row.get(0),
        ).unwrap_or(0.0);

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        let oldest_memory_days: f64 = conn.query_row(
            "SELECT MIN(created_at) FROM episodic_memory",
            [],
            |row| {
                let created: Option<i64> = row.get(0).ok();
                Ok(created.map(|c| (now - c) as f64 / 86400.0).unwrap_or(0.0))
            },
        ).unwrap_or(0.0);

        let newest_memory_days: f64 = conn.query_row(
            "SELECT MAX(created_at) FROM episodic_memory",
            [],
            |row| {
                let created: Option<i64> = row.get(0).ok();
                Ok(created.map(|c| (now - c) as f64 / 86400.0).unwrap_or(0.0))
            },
        ).unwrap_or(0.0);

        Ok(RetentionStats {
            total_memories,
            pinned_memories,
            high_retention,
            medium_retention,
            low_retention,
            average_retention,
            oldest_memory_days,
            newest_memory_days,
        })
    }

    /// Get current decay configuration
    pub fn get_config(&self) -> DecayConfig {
        self.config.lock().unwrap().clone()
    }

    /// Update decay configuration
    pub fn update_config(&self, new_config: DecayConfig) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        conn.execute(
            "UPDATE memory_decay_config
             SET base_strength = ?1, min_retention = ?2, max_retention = ?3,
                 decay_worker_interval_hours = ?4, updated_at = ?5
             WHERE id = 1",
            rusqlite::params![
                new_config.base_strength,
                new_config.min_retention,
                new_config.max_retention,
                new_config.decay_worker_interval_hours,
                now,
            ],
        )?;

        *self.config.lock().unwrap() = new_config;

        Ok(())
    }

    /// Calculate importance score for memory ranking
    /// Combines retention, satisfaction, and access count
    pub fn calculate_importance(
        &self,
        retention: f64,
        satisfaction: f64,
        access_count: i32,
    ) -> f64 {
        // Weighted combination:
        // - 50% retention (temporal relevance)
        // - 30% satisfaction (conversation quality)
        // - 20% access frequency (usage patterns)
        let base = (retention * 0.5) + (satisfaction * 0.3);
        let access_factor = ((access_count as f64) * 0.05).min(0.2);

        base + access_factor
    }

    /// Set memory type and update decay strength
    pub fn set_memory_type(&self, memory_id: &str, memory_type: MemoryType) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let decay_strength = memory_type.decay_strength();
        let memory_type_str = memory_type.as_str();

        conn.execute(
            "UPDATE episodic_memory
             SET memory_type = ?1, decay_strength = ?2
             WHERE id = ?3",
            rusqlite::params![memory_type_str, decay_strength, memory_id],
        )?;

        log::info!(
            "Set memory {} to type '{}' (S={})",
            memory_id,
            memory_type_str,
            decay_strength
        );

        // Recalculate retention score with new decay strength
        let (created_at, access_count, is_pinned): (i64, i32, bool) = conn.query_row(
            "SELECT created_at,
                    COALESCE(access_count, 0),
                    COALESCE(is_pinned, 0)
             FROM episodic_memory
             WHERE id = ?1",
            rusqlite::params![memory_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        let days_elapsed = (now - created_at) as f64 / 86400.0;
        let retention = self.calculate_retention(
            days_elapsed,
            decay_strength,
            access_count,
            is_pinned,
        );

        conn.execute(
            "UPDATE episodic_memory
             SET retention_score = ?1
             WHERE id = ?2",
            rusqlite::params![retention, memory_id],
        )?;

        Ok(())
    }

    /// Get memory type for a specific memory
    pub fn get_memory_type(&self, memory_id: &str) -> Result<MemoryType> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let memory_type_str: String = conn.query_row(
            "SELECT COALESCE(memory_type, 'conversational')
             FROM episodic_memory
             WHERE id = ?1",
            rusqlite::params![memory_id],
            |row| row.get(0),
        )?;

        Ok(MemoryType::from_str(&memory_type_str))
    }

    /// Classify and set memory type on creation
    /// Called by episodic memory service when creating new memories
    pub fn classify_and_set_memory_type(
        &self,
        memory_id: &str,
        user_message: &str,
        ai_response: &str,
    ) -> Result<MemoryType> {
        let memory_type = MemoryType::classify(user_message, ai_response);
        self.set_memory_type(memory_id, memory_type)?;
        Ok(memory_type)
    }

    /// Forecast retention for a specific memory
    pub fn forecast_retention(
        &self,
        memory_id: &str,
        days_ahead: f64,
    ) -> Result<RetentionForecast> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        // Get memory data
        let (created_at, access_count, is_pinned, decay_strength): (i64, i32, bool, f64) =
            conn.query_row(
                "SELECT created_at,
                        COALESCE(access_count, 0),
                        COALESCE(is_pinned, 0),
                        COALESCE(decay_strength, 20.0)
                 FROM episodic_memory
                 WHERE id = ?1",
                rusqlite::params![memory_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
            )?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        let current_age_days = (now - created_at) as f64 / 86400.0;
        let current_retention = self.calculate_retention(
            current_age_days,
            decay_strength,
            access_count,
            is_pinned,
        );

        // Calculate days until thresholds
        let days_until_critical = if is_pinned {
            None // Pinned memories never decay
        } else {
            self.calculate_days_until_threshold(
                current_age_days,
                decay_strength,
                access_count,
                0.3, // Critical threshold
            )
        };

        let days_until_pruning = if is_pinned {
            None
        } else {
            self.calculate_days_until_threshold(
                current_age_days,
                decay_strength,
                access_count,
                0.05, // Pruning threshold
            )
        };

        // Generate trajectory
        let trajectory = self.generate_trajectory(
            current_age_days,
            decay_strength,
            access_count,
            is_pinned,
            days_ahead,
            now,
        );

        Ok(RetentionForecast {
            memory_id: memory_id.to_string(),
            current_retention,
            current_age_days,
            days_until_critical,
            days_until_pruning,
            predicted_trajectory: trajectory,
        })
    }

    /// Calculate days until retention drops below threshold
    /// Using formula: t = -S * ln(R_target / boost)
    fn calculate_days_until_threshold(
        &self,
        current_age_days: f64,
        decay_strength: f64,
        access_count: i32,
        threshold: f64,
    ) -> Option<f64> {
        let config = self.config.lock().unwrap();
        let access_boost = 1.0 + (access_count as f64 * 0.05).min(0.5);

        // Adjust threshold for access boost
        let effective_threshold = threshold / access_boost;

        // Ensure threshold is above minimum retention
        if effective_threshold < config.min_retention {
            return None; // Will never drop below due to min_retention floor
        }

        // Solve: effective_threshold = e^(-t_total/S)
        // t_total = -S * ln(effective_threshold)
        let total_age_at_threshold = -decay_strength * effective_threshold.ln();

        // Days from now = total_age - current_age
        let days_from_now = total_age_at_threshold - current_age_days;

        if days_from_now <= 0.0 {
            Some(0.0) // Already below threshold
        } else {
            Some(days_from_now)
        }
    }

    /// Generate retention trajectory for the next N days
    fn generate_trajectory(
        &self,
        current_age_days: f64,
        decay_strength: f64,
        access_count: i32,
        is_pinned: bool,
        days_ahead: f64,
        current_timestamp: i64,
    ) -> Vec<TrajectoryPoint> {
        let mut trajectory = Vec::new();
        let step_size = if days_ahead <= 30.0 {
            1.0 // Daily for short term
        } else if days_ahead <= 90.0 {
            3.0 // Every 3 days for medium term
        } else {
            7.0 // Weekly for long term
        };

        let mut days_from_now = 0.0;
        while days_from_now <= days_ahead {
            let future_age = current_age_days + days_from_now;
            let retention = self.calculate_retention(
                future_age,
                decay_strength,
                access_count,
                is_pinned,
            );

            let timestamp = current_timestamp + (days_from_now * 86400.0) as i64;

            trajectory.push(TrajectoryPoint {
                timestamp,
                days_from_now,
                retention,
            });

            days_from_now += step_size;
        }

        trajectory
    }

    /// Find memories at risk of dropping below threshold within days_ahead
    pub fn find_at_risk_memories(
        &self,
        days_ahead: f64,
        threshold: f64,
    ) -> Result<Vec<RetentionForecast>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        // Get all non-pinned memories
        let mut stmt = conn.prepare(
            "SELECT id, created_at,
                    COALESCE(access_count, 0),
                    COALESCE(decay_strength, 20.0),
                    COALESCE(retention_score, 1.0)
             FROM episodic_memory
             WHERE COALESCE(is_pinned, 0) = 0"
        )?;

        let memories: Vec<(String, i64, i32, f64, f64)> = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, i32>(2)?,
                    row.get::<_, f64>(3)?,
                    row.get::<_, f64>(4)?,
                ))
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        drop(stmt);
        drop(db);

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        let mut at_risk = Vec::new();

        for (id, created_at, access_count, decay_strength, _current_retention) in memories {
            let current_age_days = (now - created_at) as f64 / 86400.0;

            // Check if will drop below threshold
            if let Some(days_until) = self.calculate_days_until_threshold(
                current_age_days,
                decay_strength,
                access_count,
                threshold,
            ) {
                if days_until <= days_ahead {
                    // Generate forecast
                    let forecast = self.forecast_retention(&id, days_ahead)?;
                    at_risk.push(forecast);
                }
            }
        }

        // Sort by days_until_critical (soonest first)
        at_risk.sort_by(|a, b| {
            let a_days = a.days_until_critical.unwrap_or(f64::MAX);
            let b_days = b.days_until_critical.unwrap_or(f64::MAX);
            a_days.partial_cmp(&b_days).unwrap_or(std::cmp::Ordering::Equal)
        });

        Ok(at_risk)
    }
}

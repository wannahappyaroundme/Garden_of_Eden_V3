pub mod models;
pub mod schema;

#[cfg(test)]
mod tests;

use rusqlite::Connection;
use std::path::PathBuf;
use anyhow::{Context, Result as AnyhowResult};

pub struct Database {
    conn: Connection,
}

impl Database {
    /// Create a new database connection
    pub fn new() -> AnyhowResult<Self> {
        let db_path = Self::get_db_path()?;
        log::info!("Database path: {:?}", db_path);

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .context("Failed to create database directory")?;
        }

        let conn = Connection::open(&db_path)
            .context("Failed to open database connection")?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])
            .context("Failed to enable foreign keys")?;

        let mut db = Self { conn };
        db.initialize()?;

        Ok(db)
    }

    /// Create an in-memory database for testing
    #[cfg(test)]
    pub fn new_test_db() -> AnyhowResult<Self> {
        let conn = Connection::open_in_memory()
            .context("Failed to create in-memory database")?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;

        let mut db = Self { conn };
        db.initialize()?;

        Ok(db)
    }

    /// Get database file path
    fn get_db_path() -> AnyhowResult<PathBuf> {
        // Use dirs crate for cross-platform data directory
        let app_dir = dirs::data_dir()
            .context("Failed to get app data directory")?;

        Ok(app_dir.join("garden-of-eden-v3").join("data.db"))
    }

    /// Initialize database schema
    fn initialize(&mut self) -> AnyhowResult<()> {
        log::info!("Initializing database schema...");

        // Execute schema creation
        schema::create_tables(&self.conn)?;
        schema::create_indexes(&self.conn)?;

        // Migrate persona settings to v3.8.0 (10 parameters)
        schema::migrate_persona_settings(&self.conn)?;

        // Insert default persona settings if none exist
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM persona_settings",
            [],
            |row| row.get(0),
        )?;

        if count == 0 {
            self.create_default_persona()?;
        }

        log::info!("Database initialized successfully");
        Ok(())
    }

    /// Create default persona settings (v3.8.0: 10 core parameters)
    pub fn create_default_persona(&self) -> AnyhowResult<()> {
        let now = chrono::Utc::now().timestamp_millis();

        self.conn.execute(
            "INSERT INTO persona_settings (
                formality, verbosity, humor, emoji_usage,
                empathy, creativity, proactiveness,
                technical_depth, code_examples, questioning,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            rusqlite::params![
                50,  // formality: Balanced
                50,  // verbosity: Balanced
                30,  // humor: Light humor
                20,  // emoji_usage: Minimal emojis
                60,  // empathy: Moderately supportive
                50,  // creativity: Balanced
                40,  // proactiveness: Moderately proactive
                50,  // technical_depth: Balanced technical level
                70,  // code_examples: Frequently include code
                40,  // questioning: Occasional clarifying questions
                now, // created_at
                now, // updated_at
            ],
        )?;

        log::info!("Created default persona with 10 standardized parameters");
        Ok(())
    }

    /// Get database connection reference
    pub fn conn(&self) -> &Connection {
        &self.conn
    }

    /// Load current persona parameters from database
    pub fn load_persona(&self) -> AnyhowResult<models::PersonaParameters> {
        let row = self.conn.query_row(
            "SELECT formality, verbosity, humor, emoji_usage, empathy, creativity, proactiveness, technical_depth, code_examples, questioning
             FROM persona_settings
             ORDER BY id DESC
             LIMIT 1",
            [],
            |row| {
                Ok(models::PersonaParameters {
                    formality: row.get::<_, i32>(0)?,
                    verbosity: row.get::<_, i32>(1)?,
                    humor: row.get::<_, i32>(2)?,
                    emoji_usage: row.get::<_, i32>(3)?,
                    empathy: row.get::<_, i32>(4)?,
                    creativity: row.get::<_, i32>(5)?,
                    proactiveness: row.get::<_, i32>(6)?,
                    technical_depth: row.get::<_, i32>(7)?,
                    code_examples: row.get::<_, i32>(8)?,
                    questioning: row.get::<_, i32>(9)?,
                })
            },
        )?;

        Ok(row)
    }

    /// Update persona parameters and track changes (v3.8.0)
    pub fn update_persona(&self, new_params: &models::PersonaParameters, reason: &str) -> AnyhowResult<()> {
        let now = chrono::Utc::now().timestamp_millis();

        // Load current persona
        let current_params = self.load_persona()?;

        // Calculate change magnitude and identify changed parameters
        let (change_magnitude, changed_params) = self.calculate_persona_change(&current_params, new_params);

        // Update persona_settings
        self.conn.execute(
            "UPDATE persona_settings SET
                formality = ?1, verbosity = ?2, humor = ?3, emoji_usage = ?4,
                empathy = ?5, creativity = ?6, proactiveness = ?7,
                technical_depth = ?8, code_examples = ?9, questioning = ?10,
                updated_at = ?11
             WHERE id = (SELECT id FROM persona_settings ORDER BY id DESC LIMIT 1)",
            rusqlite::params![
                new_params.formality,
                new_params.verbosity,
                new_params.humor,
                new_params.emoji_usage,
                new_params.empathy,
                new_params.creativity,
                new_params.proactiveness,
                new_params.technical_depth,
                new_params.code_examples,
                new_params.questioning,
                now,
            ],
        )?;

        // Record change in persona_changes table
        if change_magnitude > 0.0 {
            let previous_json = serde_json::to_string(&current_params)?;
            let new_json = serde_json::to_string(new_params)?;
            let changed_json = serde_json::to_string(&changed_params)?;

            self.conn.execute(
                "INSERT INTO persona_changes (id, previous_params, new_params, changed_parameters, change_magnitude, timestamp, reason)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                rusqlite::params![
                    uuid::Uuid::new_v4().to_string(),
                    previous_json,
                    new_json,
                    changed_json,
                    change_magnitude,
                    now,
                    reason,
                ],
            )?;

            log::info!("Persona updated: {} parameters changed, magnitude = {:.2}, reason = {}",
                       changed_params.len(), change_magnitude, reason);
        }

        Ok(())
    }

    /// Calculate persona change magnitude and identify changed parameters
    fn calculate_persona_change(
        &self,
        old: &models::PersonaParameters,
        new: &models::PersonaParameters,
    ) -> (f32, Vec<String>) {
        let mut total_change = 0.0;
        let mut changed_params = Vec::new();

        let params = vec![
            ("formality", old.formality, new.formality),
            ("verbosity", old.verbosity, new.verbosity),
            ("humor", old.humor, new.humor),
            ("emoji_usage", old.emoji_usage, new.emoji_usage),
            ("empathy", old.empathy, new.empathy),
            ("creativity", old.creativity, new.creativity),
            ("proactiveness", old.proactiveness, new.proactiveness),
            ("technical_depth", old.technical_depth, new.technical_depth),
            ("code_examples", old.code_examples, new.code_examples),
            ("questioning", old.questioning, new.questioning),
        ];

        for (name, old_val, new_val) in params {
            let diff = (new_val - old_val).abs() as f32 / 100.0; // Normalize to 0-1
            if diff > 0.01 {
                // Changed by more than 1%
                total_change += diff;
                changed_params.push(name.to_string());
            }
        }

        // Average change magnitude across all 10 parameters
        let magnitude = total_change / 10.0;

        (magnitude, changed_params)
    }

    /// Check if persona needs re-optimization based on recent changes
    pub fn should_reoptimize_persona(&self) -> AnyhowResult<bool> {
        // Check if there have been significant manual changes in the last 7 days
        let seven_days_ago = chrono::Utc::now().timestamp_millis() - (7 * 24 * 60 * 60 * 1000);

        let recent_manual_changes: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM persona_changes
             WHERE reason = 'manual' AND timestamp > ?1 AND change_magnitude > 0.1",
            [seven_days_ago],
            |row| row.get(0),
        ).unwrap_or(0);

        // Re-optimize if there have been 3+ significant manual changes
        Ok(recent_manual_changes >= 3)
    }

    /// Save personality insights to database (v3.8.0 Phase 2.4)
    pub fn save_personality_insights(&self, conversation_id: &str, insights: &crate::services::personality_detector::PersonalityInsights) -> AnyhowResult<()> {
        let now = chrono::Utc::now().timestamp_millis();
        let patterns = &insights.patterns;
        let big_five = &insights.big_five;
        let mbti = &insights.mbti;

        self.conn.execute(
            "INSERT INTO personality_insights (
                id, conversation_id,
                avg_message_length, formality, verbosity, humor, emoji_usage,
                empathy, creativity, proactiveness, technical_depth, code_examples, questioning,
                openness, conscientiousness, extraversion, agreeableness, neuroticism,
                ie_score, sn_score, tf_score, jp_score,
                confidence, sample_size, timestamp
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25)",
            rusqlite::params![
                uuid::Uuid::new_v4().to_string(),
                conversation_id,
                patterns.avg_message_length,
                patterns.formality,
                patterns.verbosity,
                patterns.humor,
                patterns.emoji_usage,
                patterns.empathy,
                patterns.creativity,
                patterns.proactiveness,
                patterns.technical_depth,
                patterns.code_examples,
                patterns.questioning,
                big_five.openness,
                big_five.conscientiousness,
                big_five.extraversion,
                big_five.agreeableness,
                big_five.neuroticism,
                mbti.ie_score,
                mbti.sn_score,
                mbti.tf_score,
                mbti.jp_score,
                insights.confidence,
                insights.sample_size,
                now,
            ],
        )?;

        log::info!("Saved personality insights for conversation {}", conversation_id);
        Ok(())
    }

    /// Get latest personality insights for a conversation (v3.8.0 Phase 2.4)
    pub fn get_latest_personality_insights(&self, conversation_id: &str) -> AnyhowResult<Option<crate::services::personality_detector::PersonalityInsights>> {
        let result = self.conn.query_row(
            "SELECT
                avg_message_length, formality, verbosity, humor, emoji_usage,
                empathy, creativity, proactiveness, technical_depth, code_examples, questioning,
                openness, conscientiousness, extraversion, agreeableness, neuroticism,
                ie_score, sn_score, tf_score, jp_score,
                confidence, sample_size
             FROM personality_insights
             WHERE conversation_id = ?1
             ORDER BY timestamp DESC
             LIMIT 1",
            [conversation_id],
            |row| {
                Ok(crate::services::personality_detector::PersonalityInsights {
                    patterns: crate::services::personality_detector::ConversationPatterns {
                        avg_message_length: row.get(0)?,
                        formality: row.get(1)?,
                        verbosity: row.get(2)?,
                        humor: row.get(3)?,
                        emoji_usage: row.get(4)?,
                        empathy: row.get(5)?,
                        creativity: row.get(6)?,
                        proactiveness: row.get(7)?,
                        technical_depth: row.get(8)?,
                        code_examples: row.get(9)?,
                        questioning: row.get(10)?,
                    },
                    big_five: crate::services::personality_detector::BigFiveTraits {
                        openness: row.get(11)?,
                        conscientiousness: row.get(12)?,
                        extraversion: row.get(13)?,
                        agreeableness: row.get(14)?,
                        neuroticism: row.get(15)?,
                    },
                    mbti: crate::services::personality_detector::MBTIIndicators {
                        ie_score: row.get(16)?,
                        sn_score: row.get(17)?,
                        tf_score: row.get(18)?,
                        jp_score: row.get(19)?,
                    },
                    confidence: row.get(20)?,
                    sample_size: row.get(21)?,
                })
            },
        );

        match result {
            Ok(insights) => Ok(Some(insights)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    /// Get personality insights history for a conversation (v3.8.0 Phase 2.4)
    pub fn get_personality_insights_history(&self, conversation_id: &str, limit: usize) -> AnyhowResult<Vec<crate::services::personality_detector::PersonalityInsights>> {
        let mut stmt = self.conn.prepare(
            "SELECT
                avg_message_length, formality, verbosity, humor, emoji_usage,
                empathy, creativity, proactiveness, technical_depth, code_examples, questioning,
                openness, conscientiousness, extraversion, agreeableness, neuroticism,
                ie_score, sn_score, tf_score, jp_score,
                confidence, sample_size
             FROM personality_insights
             WHERE conversation_id = ?1
             ORDER BY timestamp DESC
             LIMIT ?2"
        )?;

        let insights_iter = stmt.query_map([conversation_id, &limit.to_string()], |row| {
            Ok(crate::services::personality_detector::PersonalityInsights {
                patterns: crate::services::personality_detector::ConversationPatterns {
                    avg_message_length: row.get(0)?,
                    formality: row.get(1)?,
                    verbosity: row.get(2)?,
                    humor: row.get(3)?,
                    emoji_usage: row.get(4)?,
                    empathy: row.get(5)?,
                    creativity: row.get(6)?,
                    proactiveness: row.get(7)?,
                    technical_depth: row.get(8)?,
                    code_examples: row.get(9)?,
                    questioning: row.get(10)?,
                },
                big_five: crate::services::personality_detector::BigFiveTraits {
                    openness: row.get(11)?,
                    conscientiousness: row.get(12)?,
                    extraversion: row.get(13)?,
                    agreeableness: row.get(14)?,
                    neuroticism: row.get(15)?,
                },
                mbti: crate::services::personality_detector::MBTIIndicators {
                    ie_score: row.get(16)?,
                    sn_score: row.get(17)?,
                    tf_score: row.get(18)?,
                    jp_score: row.get(19)?,
                },
                confidence: row.get(20)?,
                sample_size: row.get(21)?,
            })
        })?;

        let insights: Vec<_> = insights_iter.filter_map(|r| r.ok()).collect();
        Ok(insights)
    }
}

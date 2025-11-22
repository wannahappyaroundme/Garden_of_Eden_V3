/**
 * Phase 5 Stage 4: Learning Style Adapter Service (v3.9.0)
 *
 * Adapts AI responses based on user's preferred learning style and comprehension level.
 *
 * Features:
 * - Learning style detection (visual, auditory, kinesthetic, reading/writing)
 * - Complexity level adaptation
 * - Example vs theory preference
 * - Interaction pattern tracking
 * - Automatic style recommendation
 */

use crate::database::Database;
use crate::services::ollama;
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Learning modality (VARK model)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LearningModality {
    Visual,        // Prefers diagrams, charts, images
    Auditory,      // Prefers verbal explanations, discussions
    Kinesthetic,   // Prefers hands-on examples, interactive demos
    ReadingWriting, // Prefers text-based explanations, documentation
}

/// Complexity preference
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ComplexityLevel {
    Beginner,      // Simple explanations, avoid jargon
    Intermediate,  // Balanced technical depth
    Advanced,      // Deep technical details, assume knowledge
    Expert,        // Concise, highly technical
}

/// Explanation style preference
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ExplanationStyle {
    ExampleFirst,  // Start with examples, then theory
    TheoryFirst,   // Start with concepts, then examples
    Balanced,      // Mix of both
    Minimal,       // Brief, to the point
}

/// Learning style profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningStyleProfile {
    pub user_id: String,
    pub primary_modality: LearningModality,
    pub secondary_modality: Option<LearningModality>,
    pub complexity_level: ComplexityLevel,
    pub explanation_style: ExplanationStyle,
    pub confidence_score: f32, // 0.0-1.0, how confident we are in this profile
    pub prefers_code_examples: bool,
    pub prefers_analogies: bool,
    pub prefers_step_by_step: bool,
    pub attention_span_minutes: i32, // Estimated attention span
    pub created_at: i64,
    pub updated_at: i64,
    pub interaction_count: i32, // Number of interactions used to build this profile
}

/// Interaction data for learning style detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionData {
    pub user_message: String,
    pub ai_response: String,
    pub user_satisfaction: Option<f32>, // 0.0-1.0 if available
    pub response_length: usize,
    pub contains_code: bool,
    pub contains_diagrams: bool,
    pub is_question: bool,
    pub is_followup: bool,
}

/// Adaptation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdaptationResult {
    pub adapted_response: String,
    pub applied_adaptations: Vec<String>, // List of adaptations applied
    pub confidence: f32,
}

/// Learning Style Adapter Service
pub struct LearningStyleAdapterService {
    db: Arc<Mutex<Database>>,
}

impl LearningStyleAdapterService {
    /// Create new Learning Style Adapter service
    pub fn new(db: Arc<Mutex<Database>>) -> Result<Self> {
        let service = Self { db };
        service.init_database()?;
        Ok(service)
    }

    /// Initialize database tables
    fn init_database(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS learning_style_profiles (
                user_id TEXT PRIMARY KEY,
                primary_modality TEXT NOT NULL,
                secondary_modality TEXT,
                complexity_level TEXT NOT NULL,
                explanation_style TEXT NOT NULL,
                confidence_score REAL NOT NULL,
                prefers_code_examples BOOLEAN NOT NULL,
                prefers_analogies BOOLEAN NOT NULL,
                prefers_step_by_step BOOLEAN NOT NULL,
                attention_span_minutes INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                interaction_count INTEGER NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS interaction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                user_message TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                user_satisfaction REAL,
                response_length INTEGER NOT NULL,
                contains_code BOOLEAN NOT NULL,
                contains_diagrams BOOLEAN NOT NULL,
                is_question BOOLEAN NOT NULL,
                is_followup BOOLEAN NOT NULL,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_interactions_user ON interaction_history(user_id)",
            [],
        )?;

        log::info!("✓ Learning Style Adapter database initialized");
        Ok(())
    }

    /// Get or create learning style profile
    pub fn get_profile(&self, user_id: &str) -> Result<LearningStyleProfile> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let profile = conn.query_row(
            "SELECT user_id, primary_modality, secondary_modality, complexity_level,
             explanation_style, confidence_score, prefers_code_examples,
             prefers_analogies, prefers_step_by_step, attention_span_minutes,
             created_at, updated_at, interaction_count
             FROM learning_style_profiles WHERE user_id = ?1",
            [user_id],
            |row| {
                let primary_str: String = row.get(1)?;
                let primary_modality = serde_json::from_str(&format!("\"{}\"", primary_str))
                    .unwrap_or(LearningModality::ReadingWriting);

                let secondary_str: Option<String> = row.get(2)?;
                let secondary_modality = secondary_str.and_then(|s| {
                    serde_json::from_str(&format!("\"{}\"", s)).ok()
                });

                let complexity_str: String = row.get(3)?;
                let complexity_level = serde_json::from_str(&format!("\"{}\"", complexity_str))
                    .unwrap_or(ComplexityLevel::Intermediate);

                let style_str: String = row.get(4)?;
                let explanation_style = serde_json::from_str(&format!("\"{}\"", style_str))
                    .unwrap_or(ExplanationStyle::Balanced);

                Ok(LearningStyleProfile {
                    user_id: row.get(0)?,
                    primary_modality,
                    secondary_modality,
                    complexity_level,
                    explanation_style,
                    confidence_score: row.get(5)?,
                    prefers_code_examples: row.get(6)?,
                    prefers_analogies: row.get(7)?,
                    prefers_step_by_step: row.get(8)?,
                    attention_span_minutes: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                    interaction_count: row.get(12)?,
                })
            },
        );

        match profile {
            Ok(p) => Ok(p),
            Err(_) => {
                // Create default profile
                let now = chrono::Utc::now().timestamp();
                let default_profile = LearningStyleProfile {
                    user_id: user_id.to_string(),
                    primary_modality: LearningModality::ReadingWriting,
                    secondary_modality: None,
                    complexity_level: ComplexityLevel::Intermediate,
                    explanation_style: ExplanationStyle::Balanced,
                    confidence_score: 0.3, // Low confidence initially
                    prefers_code_examples: true,
                    prefers_analogies: false,
                    prefers_step_by_step: true,
                    attention_span_minutes: 15,
                    created_at: now,
                    updated_at: now,
                    interaction_count: 0,
                };

                self.save_profile(&default_profile)?;
                Ok(default_profile)
            }
        }
    }

    /// Save learning style profile
    pub fn save_profile(&self, profile: &LearningStyleProfile) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let primary_str = serde_json::to_string(&profile.primary_modality)?.trim_matches('"').to_string();
        let secondary_str = profile.secondary_modality.as_ref()
            .map(|m| serde_json::to_string(m).unwrap().trim_matches('"').to_string());
        let complexity_str = serde_json::to_string(&profile.complexity_level)?.trim_matches('"').to_string();
        let style_str = serde_json::to_string(&profile.explanation_style)?.trim_matches('"').to_string();

        conn.execute(
            "INSERT OR REPLACE INTO learning_style_profiles
             (user_id, primary_modality, secondary_modality, complexity_level,
              explanation_style, confidence_score, prefers_code_examples,
              prefers_analogies, prefers_step_by_step, attention_span_minutes,
              created_at, updated_at, interaction_count)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            rusqlite::params![
                profile.user_id,
                primary_str,
                secondary_str,
                complexity_str,
                style_str,
                profile.confidence_score,
                profile.prefers_code_examples,
                profile.prefers_analogies,
                profile.prefers_step_by_step,
                profile.attention_span_minutes,
                profile.created_at,
                profile.updated_at,
                profile.interaction_count,
            ],
        )?;

        log::info!("✓ Learning style profile saved for user: {}", profile.user_id);
        Ok(())
    }

    /// Record an interaction for learning style detection
    pub fn record_interaction(&self, user_id: &str, data: InteractionData) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let now = chrono::Utc::now().timestamp();

        conn.execute(
            "INSERT INTO interaction_history
             (user_id, user_message, ai_response, user_satisfaction,
              response_length, contains_code, contains_diagrams,
              is_question, is_followup, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                user_id,
                data.user_message,
                data.ai_response,
                data.user_satisfaction,
                data.response_length as i32,
                data.contains_code,
                data.contains_diagrams,
                data.is_question,
                data.is_followup,
                now,
            ],
        )?;

        Ok(())
    }

    /// Analyze interactions and update learning style profile
    pub async fn update_profile_from_interactions(&self, user_id: &str) -> Result<LearningStyleProfile> {
        log::info!("Updating learning style profile for user: {}", user_id);

        // Get recent interactions
        let interactions = self.get_recent_interactions(user_id, 50)?;

        if interactions.is_empty() {
            return self.get_profile(user_id);
        }

        // Analyze patterns using LLM
        let analysis_prompt = self.build_analysis_prompt(&interactions)?;

        let response = ollama::generate_response(&analysis_prompt).await
            .map_err(|e| anyhow!("Failed to analyze learning style: {}", e))?;

        // Parse LLM response
        let analysis: serde_json::Value = serde_json::from_str(response.trim())
            .map_err(|e| anyhow!("Failed to parse learning style analysis: {}", e))?;

        // Update profile
        let mut profile = self.get_profile(user_id)?;

        // Update modalities
        if let Some(primary) = analysis["primary_modality"].as_str() {
            profile.primary_modality = serde_json::from_str(&format!("\"{}\"", primary))
                .unwrap_or(LearningModality::ReadingWriting);
        }

        if let Some(secondary) = analysis["secondary_modality"].as_str() {
            profile.secondary_modality = Some(
                serde_json::from_str(&format!("\"{}\"", secondary))
                    .unwrap_or(LearningModality::Visual)
            );
        }

        // Update complexity
        if let Some(complexity) = analysis["complexity_level"].as_str() {
            profile.complexity_level = serde_json::from_str(&format!("\"{}\"", complexity))
                .unwrap_or(ComplexityLevel::Intermediate);
        }

        // Update explanation style
        if let Some(style) = analysis["explanation_style"].as_str() {
            profile.explanation_style = serde_json::from_str(&format!("\"{}\"", style))
                .unwrap_or(ExplanationStyle::Balanced);
        }

        // Update preferences
        profile.prefers_code_examples = analysis["prefers_code_examples"].as_bool().unwrap_or(true);
        profile.prefers_analogies = analysis["prefers_analogies"].as_bool().unwrap_or(false);
        profile.prefers_step_by_step = analysis["prefers_step_by_step"].as_bool().unwrap_or(true);
        profile.attention_span_minutes = analysis["attention_span_minutes"].as_i64().unwrap_or(15) as i32;

        // Update confidence (increases with more interactions)
        profile.interaction_count = interactions.len() as i32;
        profile.confidence_score = (profile.interaction_count as f32 / 100.0).min(0.95);
        profile.updated_at = chrono::Utc::now().timestamp();

        self.save_profile(&profile)?;

        log::info!("✓ Learning style profile updated (confidence: {:.2})", profile.confidence_score);
        Ok(profile)
    }

    /// Build prompt for LLM to analyze learning style
    fn build_analysis_prompt(&self, interactions: &[InteractionData]) -> Result<String> {
        let mut interaction_summary = String::new();
        for (i, interaction) in interactions.iter().take(20).enumerate() {
            interaction_summary.push_str(&format!(
                "\n{}. User: {} | Response length: {} chars | Has code: {} | Satisfaction: {}",
                i + 1,
                &interaction.user_message[..interaction.user_message.len().min(100)],
                interaction.response_length,
                interaction.contains_code,
                interaction.user_satisfaction.map(|s| format!("{:.1}", s)).unwrap_or_else(|| "N/A".to_string())
            ));
        }

        let prompt = format!(
            r#"You are a learning style analyst. Analyze these user interactions to determine their learning preferences.

Interactions:{}

Analyze patterns and respond ONLY with valid JSON:
{{
  "primary_modality": "visual" | "auditory" | "kinesthetic" | "readingwriting",
  "secondary_modality": "visual" | "auditory" | "kinesthetic" | "readingwriting" | null,
  "complexity_level": "beginner" | "intermediate" | "advanced" | "expert",
  "explanation_style": "examplefirst" | "theoryfirst" | "balanced" | "minimal",
  "prefers_code_examples": true | false,
  "prefers_analogies": true | false,
  "prefers_step_by_step": true | false,
  "attention_span_minutes": 5-30
}}

Guidelines:
- Visual: Prefers diagrams, charts, visual representations
- Auditory: Asks for explanations, discussions
- Kinesthetic: Wants hands-on examples, interactive demos
- Reading/Writing: Prefers text-based documentation

Consider:
- Question patterns
- Response satisfaction
- Code example usage
- Follow-up question frequency"#,
            interaction_summary
        );

        Ok(prompt)
    }

    /// Get recent interactions
    fn get_recent_interactions(&self, user_id: &str, limit: usize) -> Result<Vec<InteractionData>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT user_message, ai_response, user_satisfaction, response_length,
             contains_code, contains_diagrams, is_question, is_followup
             FROM interaction_history
             WHERE user_id = ?1
             ORDER BY created_at DESC
             LIMIT ?2"
        )?;

        let interactions = stmt.query_map(rusqlite::params![user_id, limit as i32], |row| {
            Ok(InteractionData {
                user_message: row.get(0)?,
                ai_response: row.get(1)?,
                user_satisfaction: row.get(2)?,
                response_length: row.get::<_, i32>(3)? as usize,
                contains_code: row.get(4)?,
                contains_diagrams: row.get(5)?,
                is_question: row.get(6)?,
                is_followup: row.get(7)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(interactions)
    }

    /// Adapt a response based on learning style profile
    pub async fn adapt_response(&self, user_id: &str, original_response: &str) -> Result<AdaptationResult> {
        let profile = self.get_profile(user_id)?;

        // If confidence is too low, return original
        if profile.confidence_score < 0.4 {
            return Ok(AdaptationResult {
                adapted_response: original_response.to_string(),
                applied_adaptations: vec!["none (low confidence)".to_string()],
                confidence: profile.confidence_score,
            });
        }

        let mut applied_adaptations = Vec::new();

        // Build adaptation instructions
        let mut instructions = Vec::new();

        // Modality-based adaptations
        match profile.primary_modality {
            LearningModality::Visual => {
                instructions.push("Add visual representations (diagrams, ASCII art, structured layouts)");
                applied_adaptations.push("visual_emphasis".to_string());
            }
            LearningModality::Kinesthetic => {
                instructions.push("Include hands-on examples and interactive demonstrations");
                applied_adaptations.push("hands_on_examples".to_string());
            }
            LearningModality::ReadingWriting => {
                instructions.push("Provide detailed written explanations with references");
                applied_adaptations.push("detailed_text".to_string());
            }
            LearningModality::Auditory => {
                instructions.push("Use conversational tone with explanatory narratives");
                applied_adaptations.push("conversational_tone".to_string());
            }
        }

        // Complexity adaptation
        match profile.complexity_level {
            ComplexityLevel::Beginner => {
                instructions.push("Use simple language, avoid jargon, explain terms");
                applied_adaptations.push("beginner_friendly".to_string());
            }
            ComplexityLevel::Expert => {
                instructions.push("Be concise, use technical terms, skip basics");
                applied_adaptations.push("expert_level".to_string());
            }
            _ => {}
        }

        // Style adaptation
        if profile.prefers_code_examples {
            instructions.push("Include practical code examples");
            applied_adaptations.push("code_examples".to_string());
        }

        if profile.prefers_analogies {
            instructions.push("Use analogies and metaphors");
            applied_adaptations.push("analogies".to_string());
        }

        if profile.prefers_step_by_step {
            instructions.push("Break down into clear step-by-step instructions");
            applied_adaptations.push("step_by_step".to_string());
        }

        let adaptation_prompt = format!(
            r#"Adapt this response to match the user's learning style.

Original response:
{}

Adaptation instructions:
{}

Provide the adapted response. Maintain the core information but adjust the presentation style."#,
            original_response,
            instructions.join("\n- ")
        );

        let adapted = ollama::generate_response(&adaptation_prompt).await
            .map_err(|e| anyhow!("Failed to adapt response: {}", e))?;

        Ok(AdaptationResult {
            adapted_response: adapted.trim().to_string(),
            applied_adaptations,
            confidence: profile.confidence_score,
        })
    }

    /// Manual profile update
    pub fn update_profile_manually(
        &self,
        user_id: &str,
        primary_modality: Option<LearningModality>,
        complexity_level: Option<ComplexityLevel>,
        explanation_style: Option<ExplanationStyle>,
    ) -> Result<()> {
        let mut profile = self.get_profile(user_id)?;

        if let Some(modality) = primary_modality {
            profile.primary_modality = modality;
        }
        if let Some(complexity) = complexity_level {
            profile.complexity_level = complexity;
        }
        if let Some(style) = explanation_style {
            profile.explanation_style = style;
        }

        profile.confidence_score = 1.0; // Manual updates are fully confident
        profile.updated_at = chrono::Utc::now().timestamp();

        self.save_profile(&profile)?;
        Ok(())
    }
}

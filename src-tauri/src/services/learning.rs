use anyhow::Result;
use log::{info, warn};
use rusqlite::Connection;
use std::sync::{Arc, Mutex};
use crate::database::Database;

/// Learning Service for persona optimization based on user feedback
/// Implements the satisfaction feedback loop from the spec
pub struct LearningService {
    db: Arc<Mutex<Database>>,
}

/// Persona parameters that can be adjusted
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PersonaParameters {
    /// Formality level (0.0 = casual, 1.0 = very formal)
    pub formality: f32,

    /// Verbosity (0.0 = concise, 1.0 = detailed)
    pub verbosity: f32,

    /// Humor level (0.0 = serious, 1.0 = very humorous)
    pub humor: f32,

    /// Emoji usage (0.0 = none, 1.0 = frequent)
    pub emoji_usage: f32,

    /// Proactiveness (0.0 = wait for user, 1.0 = very proactive)
    pub proactiveness: f32,

    /// Technical depth (0.0 = simple explanations, 1.0 = technical details)
    pub technical_depth: f32,

    /// Empathy level (0.0 = task-focused, 1.0 = emotionally supportive)
    pub empathy: f32,

    /// Code example frequency (0.0 = rarely, 1.0 = always include examples)
    pub code_examples: f32,

    /// Question asking (0.0 = rarely ask questions, 1.0 = ask clarifying questions)
    pub questioning: f32,

    /// Suggestion frequency (0.0 = wait for requests, 1.0 = offer suggestions)
    pub suggestions: f32,
}

impl Default for PersonaParameters {
    fn default() -> Self {
        Self {
            formality: 0.3,        // Slightly casual by default
            verbosity: 0.5,        // Balanced
            humor: 0.2,            // Light humor
            emoji_usage: 0.1,      // Minimal emojis
            proactiveness: 0.4,    // Moderately proactive
            technical_depth: 0.6,  // Moderately technical
            empathy: 0.5,          // Balanced
            code_examples: 0.7,    // Frequently include examples
            questioning: 0.5,      // Balanced
            suggestions: 0.4,      // Occasional suggestions
        }
    }
}

/// Feedback data from user
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Feedback {
    pub conversation_id: String,
    pub satisfaction: f32, // 0.0-1.0 (0 = thumbs down, 1 = thumbs up, 0.5 = neutral)
    pub timestamp: i64,
    pub persona_snapshot: PersonaParameters,
}

/// Learning statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LearningStats {
    pub total_feedback_count: usize,
    pub average_satisfaction: f32,
    pub positive_feedback_count: usize,
    pub negative_feedback_count: usize,
    pub learning_iterations: usize,
}

impl LearningService {
    pub fn new(db: Arc<Mutex<Database>>) -> Result<Self> {
        info!("Learning service initialized");

        // Create feedback table if not exists
        let db_guard = db.lock().unwrap();
        db_guard.conn().execute(
            "CREATE TABLE IF NOT EXISTS feedback (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                satisfaction REAL NOT NULL,
                timestamp INTEGER NOT NULL,
                persona_snapshot TEXT NOT NULL
            )",
            [],
        )?;

        db_guard.conn().execute(
            "CREATE TABLE IF NOT EXISTS persona_history (
                id TEXT PRIMARY KEY,
                parameters TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                average_satisfaction REAL
            )",
            [],
        )?;

        drop(db_guard);

        Ok(Self { db })
    }

    /// Record user feedback
    pub fn record_feedback(&self, feedback: Feedback) -> Result<()> {
        let db = self.db.lock().unwrap();

        let persona_json = serde_json::to_string(&feedback.persona_snapshot)?;

        db.conn().execute(
            "INSERT INTO feedback (id, conversation_id, satisfaction, timestamp, persona_snapshot)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                uuid::Uuid::new_v4().to_string(),
                feedback.conversation_id,
                feedback.satisfaction,
                feedback.timestamp,
                persona_json,
            ],
        )?;

        info!(
            "Feedback recorded: satisfaction={:.2}, conversation={}",
            feedback.satisfaction, feedback.conversation_id
        );

        Ok(())
    }

    /// Optimize persona parameters based on feedback history
    pub fn optimize_persona(&self, current_persona: PersonaParameters) -> Result<PersonaParameters> {
        let db = self.db.lock().unwrap();

        // Get recent feedback (last 100 interactions)
        let mut stmt = db.conn().prepare(
            "SELECT satisfaction, persona_snapshot
             FROM feedback
             ORDER BY timestamp DESC
             LIMIT 100"
        )?;

        let feedback_rows = stmt.query_map([], |row| {
            let satisfaction: f32 = row.get(0)?;
            let persona_json: String = row.get(1)?;
            Ok((satisfaction, persona_json))
        })?;

        let mut feedback_data: Vec<(f32, PersonaParameters)> = Vec::new();

        for row in feedback_rows {
            if let Ok((satisfaction, persona_json)) = row {
                if let Ok(persona) = serde_json::from_str::<PersonaParameters>(&persona_json) {
                    feedback_data.push((satisfaction, persona));
                }
            }
        }

        if feedback_data.is_empty() {
            info!("No feedback data available, keeping current persona");
            return Ok(current_persona);
        }

        // Calculate average satisfaction for current parameters
        let avg_satisfaction: f32 = feedback_data.iter().map(|(s, _)| s).sum::<f32>() / feedback_data.len() as f32;

        info!("Current average satisfaction: {:.2}", avg_satisfaction);

        // Simple optimization: Adjust parameters based on high/low satisfaction feedback
        let mut optimized = current_persona.clone();

        // Calculate parameter adjustments
        let learning_rate = 0.1; // How much to adjust per iteration

        // For each parameter, calculate correlation with satisfaction
        let mut formality_delta = 0.0;
        let mut verbosity_delta = 0.0;
        let mut humor_delta = 0.0;
        let mut emoji_delta = 0.0;

        for (satisfaction, persona) in &feedback_data {
            let weight = satisfaction - 0.5; // -0.5 to 0.5 range

            formality_delta += (persona.formality - current_persona.formality) * weight;
            verbosity_delta += (persona.verbosity - current_persona.verbosity) * weight;
            humor_delta += (persona.humor - current_persona.humor) * weight;
            emoji_delta += (persona.emoji_usage - current_persona.emoji_usage) * weight;
        }

        // Normalize by feedback count
        let count = feedback_data.len() as f32;
        formality_delta /= count;
        verbosity_delta /= count;
        humor_delta /= count;
        emoji_delta /= count;

        // Apply adjustments with learning rate
        optimized.formality = clamp(optimized.formality + formality_delta * learning_rate, 0.0, 1.0);
        optimized.verbosity = clamp(optimized.verbosity + verbosity_delta * learning_rate, 0.0, 1.0);
        optimized.humor = clamp(optimized.humor + humor_delta * learning_rate, 0.0, 1.0);
        optimized.emoji_usage = clamp(optimized.emoji_usage + emoji_delta * learning_rate, 0.0, 1.0);

        info!(
            "Persona optimized: formality {:.2}->{:.2}, verbosity {:.2}->{:.2}",
            current_persona.formality, optimized.formality,
            current_persona.verbosity, optimized.verbosity
        );

        // Save persona to history
        self.save_persona_to_history(&optimized, avg_satisfaction)?;

        Ok(optimized)
    }

    /// Save persona parameters to history
    fn save_persona_to_history(&self, persona: &PersonaParameters, avg_satisfaction: f32) -> Result<()> {
        let db = self.db.lock().unwrap();
        let persona_json = serde_json::to_string(persona)?;
        let timestamp = chrono::Utc::now().timestamp();

        db.conn().execute(
            "INSERT INTO persona_history (id, parameters, timestamp, average_satisfaction)
             VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![
                uuid::Uuid::new_v4().to_string(),
                persona_json,
                timestamp,
                avg_satisfaction,
            ],
        )?;

        Ok(())
    }

    /// Get learning statistics
    pub fn get_stats(&self) -> Result<LearningStats> {
        let db = self.db.lock().unwrap();

        let total_feedback_count: i64 = db.conn().query_row(
            "SELECT COUNT(*) FROM feedback",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let avg_satisfaction: f32 = db.conn().query_row(
            "SELECT AVG(satisfaction) FROM feedback",
            [],
            |row| row.get(0),
        ).unwrap_or(0.5);

        let positive_count: i64 = db.conn().query_row(
            "SELECT COUNT(*) FROM feedback WHERE satisfaction > 0.6",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let negative_count: i64 = db.conn().query_row(
            "SELECT COUNT(*) FROM feedback WHERE satisfaction < 0.4",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let learning_iterations: i64 = db.conn().query_row(
            "SELECT COUNT(*) FROM persona_history",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        Ok(LearningStats {
            total_feedback_count: total_feedback_count as usize,
            average_satisfaction: avg_satisfaction,
            positive_feedback_count: positive_count as usize,
            negative_feedback_count: negative_count as usize,
            learning_iterations: learning_iterations as usize,
        })
    }

    /// Generate system prompt from persona parameters
    pub fn generate_system_prompt(persona: &PersonaParameters) -> String {
        let mut prompt = String::from("Your name is Adam. You are a helpful AI assistant.\n\n");

        // Formality
        if persona.formality < 0.3 {
            prompt.push_str("Communication style: Very casual and friendly, like talking to a friend.\n");
        } else if persona.formality > 0.7 {
            prompt.push_str("Communication style: Formal and professional.\n");
        } else {
            prompt.push_str("Communication style: Balanced and approachable.\n");
        }

        // Verbosity
        if persona.verbosity < 0.3 {
            prompt.push_str("Response length: Keep responses concise and to the point.\n");
        } else if persona.verbosity > 0.7 {
            prompt.push_str("Response length: Provide detailed, comprehensive explanations.\n");
        } else {
            prompt.push_str("Response length: Balanced, neither too brief nor too lengthy.\n");
        }

        // Humor
        if persona.humor > 0.5 {
            prompt.push_str("Humor: Use occasional light humor and friendly banter.\n");
        } else {
            prompt.push_str("Humor: Stay professional and focused.\n");
        }

        // Emoji usage
        if persona.emoji_usage > 0.5 {
            prompt.push_str("Emojis: Use emojis occasionally to add warmth and expressiveness.\n");
        } else {
            prompt.push_str("Emojis: Avoid using emojis.\n");
        }

        // Technical depth
        if persona.technical_depth > 0.7 {
            prompt.push_str("Technical depth: Provide technical details and deep explanations.\n");
        } else if persona.technical_depth < 0.3 {
            prompt.push_str("Technical depth: Use simple, beginner-friendly explanations.\n");
        } else {
            prompt.push_str("Technical depth: Balanced technical explanations.\n");
        }

        // Code examples
        if persona.code_examples > 0.6 {
            prompt.push_str("Code examples: Always include code examples when relevant.\n");
        }

        // Empathy
        if persona.empathy > 0.6 {
            prompt.push_str("Empathy: Be emotionally supportive and understanding of user frustrations.\n");
        }

        prompt
    }
}

/// Clamp value between min and max
fn clamp(value: f32, min: f32, max: f32) -> f32 {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_persona() {
        let persona = PersonaParameters::default();
        assert!(persona.formality >= 0.0 && persona.formality <= 1.0);
        assert!(persona.verbosity >= 0.0 && persona.verbosity <= 1.0);
    }

    #[test]
    fn test_clamp() {
        assert_eq!(clamp(0.5, 0.0, 1.0), 0.5);
        assert_eq!(clamp(-0.5, 0.0, 1.0), 0.0);
        assert_eq!(clamp(1.5, 0.0, 1.0), 1.0);
    }

    #[test]
    fn test_system_prompt_generation() {
        let persona = PersonaParameters::default();
        let prompt = LearningService::generate_system_prompt(&persona);
        assert!(prompt.contains("Adam"));
        assert!(prompt.contains("Communication style"));
    }
}

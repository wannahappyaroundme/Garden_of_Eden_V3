use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub mode: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub message_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub timestamp: i64,
    pub tokens: Option<i32>,
    pub response_time: Option<i32>,
    pub context_level: Option<i32>,
    pub satisfaction: Option<String>,
}

/// Persona parameters from database (v3.8.0: 10 standardized parameters, 0-100 scale)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonaParameters {
    pub formality: i32,        // 0-100: Communication style
    pub verbosity: i32,        // 0-100: Response length
    pub humor: i32,            // 0-100: Humor level
    pub emoji_usage: i32,      // 0-100: Emoji frequency
    pub empathy: i32,          // 0-100: Emotional support level
    pub creativity: i32,       // 0-100: Creative/analogical thinking
    pub proactiveness: i32,    // 0-100: Proactive suggestions
    pub technical_depth: i32,  // 0-100: Technical language level
    pub code_examples: i32,    // 0-100: Code example frequency
    pub questioning: i32,      // 0-100: Clarifying question frequency
}

impl PersonaParameters {
    /// Convert to 0-1 scale for learning service
    pub fn to_learning_params(&self) -> crate::services::learning::PersonaParameters {
        crate::services::learning::PersonaParameters {
            formality: self.formality as f32 / 100.0,
            verbosity: self.verbosity as f32 / 100.0,
            humor: self.humor as f32 / 100.0,
            emoji_usage: self.emoji_usage as f32 / 100.0,
            empathy: self.empathy as f32 / 100.0,
            creativity: self.creativity as f32 / 100.0,
            proactiveness: self.proactiveness as f32 / 100.0,
            technical_depth: self.technical_depth as f32 / 100.0,
            code_examples: self.code_examples as f32 / 100.0,
            questioning: self.questioning as f32 / 100.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonaSettings {
    pub id: Option<i32>,
    pub formality: i32,
    pub verbosity: i32,
    pub humor: i32,
    pub emoji_usage: i32,
    pub empathy: i32,
    pub creativity: i32,
    pub proactiveness: i32,
    pub technical_depth: i32,
    pub code_examples: i32,
    pub questioning: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: i32,
    pub name: String,
    pub display_name: String,
    pub age_group: Option<String>,
    pub occupation: Option<String>,
    pub interests: Option<String>,
    pub tone_preference: Option<String>,
    pub proactive_frequency: Option<String>,
    pub selected_persona: Option<String>,
    pub onboarding_completed_at: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

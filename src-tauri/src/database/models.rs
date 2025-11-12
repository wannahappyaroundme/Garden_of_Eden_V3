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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonaSettings {
    pub id: Option<i32>,
    pub formality: i32,
    pub humor: i32,
    pub verbosity: i32,
    pub emoji_usage: i32,
    pub enthusiasm: i32,
    pub empathy: i32,
    pub directness: i32,
    pub technicality: i32,
    pub creativity: i32,
    pub proactivity: i32,
    pub language_preference: String,
    pub code_language_preference: String,
    pub patience: i32,
    pub encouragement: i32,
    pub formality_honorifics: i32,
    pub reasoning_depth: i32,
    pub context_awareness: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

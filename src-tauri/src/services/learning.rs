use anyhow::Result;
use log::{info, warn};
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

    /// Creativity level (0.0 = conventional, 1.0 = creative/analogical)
    pub creativity: f32,
}

impl Default for PersonaParameters {
    fn default() -> Self {
        Self {
            formality: 0.5,        // Balanced
            verbosity: 0.5,        // Balanced
            humor: 0.3,            // Light humor
            emoji_usage: 0.2,      // Minimal emojis
            empathy: 0.6,          // Moderately supportive
            creativity: 0.5,       // Balanced
            proactiveness: 0.4,    // Moderately proactive
            technical_depth: 0.5,  // Balanced technical level
            code_examples: 0.7,    // Frequently include examples
            questioning: 0.4,      // Occasional clarifying questions
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

        // Persona history table is now created in database schema (v3.8.0)

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
        let mut empathy_delta = 0.0;
        let mut creativity_delta = 0.0;
        let mut proactiveness_delta = 0.0;
        let mut technical_depth_delta = 0.0;
        let mut code_examples_delta = 0.0;
        let mut questioning_delta = 0.0;

        for (satisfaction, persona) in &feedback_data {
            let weight = satisfaction - 0.5; // -0.5 to 0.5 range

            formality_delta += (persona.formality - current_persona.formality) * weight;
            verbosity_delta += (persona.verbosity - current_persona.verbosity) * weight;
            humor_delta += (persona.humor - current_persona.humor) * weight;
            emoji_delta += (persona.emoji_usage - current_persona.emoji_usage) * weight;
            empathy_delta += (persona.empathy - current_persona.empathy) * weight;
            creativity_delta += (persona.creativity - current_persona.creativity) * weight;
            proactiveness_delta += (persona.proactiveness - current_persona.proactiveness) * weight;
            technical_depth_delta += (persona.technical_depth - current_persona.technical_depth) * weight;
            code_examples_delta += (persona.code_examples - current_persona.code_examples) * weight;
            questioning_delta += (persona.questioning - current_persona.questioning) * weight;
        }

        // Normalize by feedback count
        let count = feedback_data.len() as f32;
        formality_delta /= count;
        verbosity_delta /= count;
        humor_delta /= count;
        emoji_delta /= count;
        empathy_delta /= count;
        creativity_delta /= count;
        proactiveness_delta /= count;
        technical_depth_delta /= count;
        code_examples_delta /= count;
        questioning_delta /= count;

        // Apply adjustments with learning rate
        optimized.formality = clamp(optimized.formality + formality_delta * learning_rate, 0.0, 1.0);
        optimized.verbosity = clamp(optimized.verbosity + verbosity_delta * learning_rate, 0.0, 1.0);
        optimized.humor = clamp(optimized.humor + humor_delta * learning_rate, 0.0, 1.0);
        optimized.emoji_usage = clamp(optimized.emoji_usage + emoji_delta * learning_rate, 0.0, 1.0);
        optimized.empathy = clamp(optimized.empathy + empathy_delta * learning_rate, 0.0, 1.0);
        optimized.creativity = clamp(optimized.creativity + creativity_delta * learning_rate, 0.0, 1.0);
        optimized.proactiveness = clamp(optimized.proactiveness + proactiveness_delta * learning_rate, 0.0, 1.0);
        optimized.technical_depth = clamp(optimized.technical_depth + technical_depth_delta * learning_rate, 0.0, 1.0);
        optimized.code_examples = clamp(optimized.code_examples + code_examples_delta * learning_rate, 0.0, 1.0);
        optimized.questioning = clamp(optimized.questioning + questioning_delta * learning_rate, 0.0, 1.0);

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
            "INSERT INTO persona_history (id, parameters, timestamp, average_satisfaction, source)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                uuid::Uuid::new_v4().to_string(),
                persona_json,
                timestamp,
                avg_satisfaction,
                "optimization", // Source is optimization for auto-learning
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
    /// Uses research-based prompt engineering for nuanced personality control
    pub fn generate_system_prompt(persona: &PersonaParameters) -> String {
        let mut prompt = String::from("Your name is Adam. You are a helpful AI assistant living in the Garden of Eden environment.\n\n");

        prompt.push_str("# Core Personality Profile\n\n");

        // === Communication Style (4 parameters) ===

        // 1. Formality (0.0 = casual friend, 1.0 = formal professional)
        if persona.formality < 0.25 {
            prompt.push_str("**Tone & Formality**: Speak like a close friend - use casual language, contractions (I'm, you're, let's), and conversational phrases. Address the user warmly and personally. Avoid overly structured or business-like language.\n");
        } else if persona.formality < 0.5 {
            prompt.push_str("**Tone & Formality**: Use friendly but respectful language. Mix casual and professional elements naturally. Contractions are fine, but maintain clarity and helpfulness.\n");
        } else if persona.formality < 0.75 {
            prompt.push_str("**Tone & Formality**: Maintain professional but approachable language. Use complete sentences and proper grammar, but remain warm and accessible. Limited use of contractions.\n");
        } else {
            prompt.push_str("**Tone & Formality**: Use formal, professional language with precise terminology. Avoid contractions, slang, or casual expressions. Maintain dignified, business-appropriate communication at all times.\n");
        }

        // 2. Verbosity (0.0 = concise/terse, 1.0 = detailed/comprehensive)
        if persona.verbosity < 0.25 {
            prompt.push_str("**Response Length**: Be extremely concise. Give direct answers in 1-2 sentences when possible. Avoid explanations unless explicitly asked. Use bullet points for lists. No filler words or redundancy.\n");
        } else if persona.verbosity < 0.5 {
            prompt.push_str("**Response Length**: Keep responses brief but sufficient. Provide necessary context in 2-4 sentences. Include key details but avoid lengthy elaboration. Balance efficiency with completeness.\n");
        } else if persona.verbosity < 0.75 {
            prompt.push_str("**Response Length**: Provide moderately detailed responses. Explain reasoning and context in 4-6 sentences. Include relevant background information and helpful elaboration. Balance thoroughness with readability.\n");
        } else {
            prompt.push_str("**Response Length**: Provide comprehensive, detailed explanations. Include background context, reasoning steps, alternative approaches, and thorough examples. Use 6-10+ sentences to fully explore topics. Prioritize depth over brevity.\n");
        }

        // 3. Humor (0.0 = serious/professional, 1.0 = playful/witty)
        if persona.humor < 0.25 {
            prompt.push_str("**Humor & Tone**: Remain serious, professional, and focused. Avoid jokes, puns, or playful language. Keep communication straightforward and task-oriented.\n");
        } else if persona.humor < 0.5 {
            prompt.push_str("**Humor & Tone**: Occasionally use light humor when appropriate, but stay primarily professional. A subtle joke or friendly aside is acceptable in casual contexts.\n");
        } else if persona.humor < 0.75 {
            prompt.push_str("**Humor & Tone**: Use humor regularly to create a warm, friendly atmosphere. Include occasional jokes, wordplay, or amusing observations. Keep it light and appropriate.\n");
        } else {
            prompt.push_str("**Humor & Tone**: Embrace playful, witty communication. Use frequent jokes, puns, pop culture references, and amusing analogies. Make interactions fun and entertaining while remaining helpful.\n");
        }

        // 4. Emoji Usage (0.0 = none, 1.0 = frequent)
        if persona.emoji_usage < 0.25 {
            prompt.push_str("**Emojis**: Never use emojis. Rely solely on text for expression.\n");
        } else if persona.emoji_usage < 0.5 {
            prompt.push_str("**Emojis**: Use emojis sparingly (1-2 per response maximum) for emphasis on key points or to convey tone.\n");
        } else if persona.emoji_usage < 0.75 {
            prompt.push_str("**Emojis**: Use emojis regularly (3-5 per response) to add warmth and expressiveness. Choose contextually appropriate emojis.\n");
        } else {
            prompt.push_str("**Emojis**: Use emojis frequently throughout responses (5+ per response) to create an expressive, warm communication style. Use varied and creative emoji combinations.\n");
        }

        // === Relationship & Emotion (1 parameter) ===

        // 5. Empathy (0.0 = task-focused, 1.0 = emotionally supportive)
        if persona.empathy < 0.25 {
            prompt.push_str("\n**Empathy & Emotional Support**: Focus strictly on tasks and solutions. Avoid emotional language or validation. Provide factual, objective assistance without acknowledging feelings.\n");
        } else if persona.empathy < 0.5 {
            prompt.push_str("\n**Empathy & Emotional Support**: Acknowledge user emotions when explicitly expressed, but maintain primary focus on problem-solving. Brief validation is acceptable.\n");
        } else if persona.empathy < 0.75 {
            prompt.push_str("\n**Empathy & Emotional Support**: Show genuine understanding of user emotions. Validate frustrations, celebrate successes, and offer encouragement. Balance emotional support with practical help.\n");
        } else {
            prompt.push_str("\n**Empathy & Emotional Support**: Prioritize emotional connection and support. Deeply validate feelings, offer comfort during frustration, and celebrate achievements enthusiastically. Create a safe, understanding environment. Check in on user wellbeing.\n");
        }

        // === Thinking & Action (2 parameters) ===

        // 6. Creativity (0.0 = conventional, 1.0 = creative/analogical)
        if persona.creativity < 0.25 {
            prompt.push_str("**Creativity & Thinking Style**: Stick to conventional, proven solutions. Use standard explanations and established methods. Avoid metaphors or creative analogies.\n");
        } else if persona.creativity < 0.5 {
            prompt.push_str("**Creativity & Thinking Style**: Balance conventional approaches with occasional creative insights. Use simple analogies when helpful, but rely primarily on direct explanations.\n");
        } else if persona.creativity < 0.75 {
            prompt.push_str("**Creativity & Thinking Style**: Regularly use creative analogies, metaphors, and novel explanations. Offer innovative perspectives and alternative approaches. Make complex topics accessible through imaginative comparisons.\n");
        } else {
            prompt.push_str("**Creativity & Thinking Style**: Embrace highly creative, analogical thinking. Use vivid metaphors, storytelling, unexpected connections, and imaginative examples. Approach problems from unique angles. Make learning engaging through creative explanations.\n");
        }

        // 7. Proactiveness (0.0 = reactive only, 1.0 = highly proactive)
        if persona.proactiveness < 0.25 {
            prompt.push_str("**Proactiveness**: Only respond to direct questions. Never offer unsolicited suggestions, warnings, or next steps. Wait for user to lead all interactions.\n");
        } else if persona.proactiveness < 0.5 {
            prompt.push_str("**Proactiveness**: Primarily respond to user requests, but occasionally suggest relevant next steps or point out potential issues when directly related to the current task.\n");
        } else if persona.proactiveness < 0.75 {
            prompt.push_str("**Proactiveness**: Actively suggest improvements, warn about potential issues, and recommend best practices. Offer relevant next steps and optimization opportunities. Anticipate user needs.\n");
        } else {
            prompt.push_str("**Proactiveness**: Be highly proactive. Regularly offer suggestions, optimizations, and improvements even before asked. Anticipate problems, recommend best practices, suggest related resources, and guide user toward better workflows. Take initiative in improving user experience.\n");
        }

        // === Expertise & Content (3 parameters) ===

        // 8. Technical Depth (0.0 = simple terms, 1.0 = technical jargon)
        if persona.technical_depth < 0.25 {
            prompt.push_str("\n**Technical Level**: Use simple, beginner-friendly language. Avoid jargon, technical terms, or complex concepts. Explain everything as if to someone with no technical background. Use everyday analogies.\n");
        } else if persona.technical_depth < 0.5 {
            prompt.push_str("\n**Technical Level**: Use moderately technical language. Introduce technical terms but explain them clearly. Assume basic familiarity but don't assume expert knowledge. Balance accessibility with precision.\n");
        } else if persona.technical_depth < 0.75 {
            prompt.push_str("\n**Technical Level**: Use technical terminology freely. Assume solid technical background. Explain advanced concepts but don't over-simplify. Dive into implementation details when relevant.\n");
        } else {
            prompt.push_str("\n**Technical Level**: Use expert-level technical language. Employ precise jargon, reference advanced concepts, discuss implementation details, architecture patterns, and low-level mechanisms. Assume deep technical expertise.\n");
        }

        // 9. Code Examples (0.0 = text only, 1.0 = code-heavy)
        if persona.code_examples < 0.25 {
            prompt.push_str("**Code Examples**: Avoid code examples. Explain concepts through text descriptions only. Use pseudocode sparingly if absolutely necessary.\n");
        } else if persona.code_examples < 0.5 {
            prompt.push_str("**Code Examples**: Include code examples occasionally (1-2 snippets) when they significantly clarify the explanation. Prefer text descriptions as primary teaching method.\n");
        } else if persona.code_examples < 0.75 {
            prompt.push_str("**Code Examples**: Include code examples regularly (2-4 snippets per response) to illustrate concepts. Balance code with explanatory text. Show both 'what' and 'why' through examples.\n");
        } else {
            prompt.push_str("**Code Examples**: Heavily favor code examples. Include multiple comprehensive code snippets (4+ per response) showing various approaches, edge cases, and complete implementations. Code should be the primary teaching tool.\n");
        }

        // 10. Questioning (0.0 = direct answers, 1.0 = ask clarifying questions)
        if persona.questioning < 0.25 {
            prompt.push_str("**Questioning Style**: Provide direct answers immediately. Make reasonable assumptions rather than asking clarifying questions. Prioritize answering over questioning.\n");
        } else if persona.questioning < 0.5 {
            prompt.push_str("**Questioning Style**: Answer directly in most cases, but ask 1-2 clarifying questions when the request is genuinely ambiguous or when user preferences could significantly affect the solution.\n");
        } else if persona.questioning < 0.75 {
            prompt.push_str("**Questioning Style**: Regularly ask 2-3 clarifying questions before providing solutions. Understand user context, preferences, and constraints. Ensure alignment before diving into answers.\n");
        } else {
            prompt.push_str("**Questioning Style**: Ask thorough clarifying questions (3-5+) before answering. Deeply understand user needs, context, goals, constraints, and preferences. Explore edge cases and alternative interpretations. Ensure complete alignment.\n");
        }

        prompt.push_str("\n\n# Important Instructions\n");
        prompt.push_str("- **Language Matching**: If the user writes in Korean, respond ONLY in Korean. If in English, respond in English. Match the user's language choice exactly.\n");
        prompt.push_str("- **Consistency**: Maintain this personality profile consistently across all interactions.\n");
        prompt.push_str("- **Adaptation**: These parameters represent the user's preferences learned from past interactions. Honor them carefully.\n");

        prompt
    }

    /// Evolve persona from high-retention temporal memories (v3.8.0 Phase 3)
    /// Analyzes conversation patterns in memories with retention_score > threshold
    /// and gradually adjusts persona parameters based on successful interactions
    pub fn evolve_persona_from_temporal_memory(
        &self,
        current_persona: PersonaParameters,
        retention_threshold: f32,
        learning_rate: f32,
    ) -> Result<PersonaParameters> {
        info!("Evolving persona from temporal memories (threshold: {}, lr: {})", retention_threshold, learning_rate);

        let db = self.db.lock().unwrap();
        let conn = db.conn();

        // Get high-retention memories with their satisfaction scores
        let mut stmt = conn.prepare(
            "SELECT user_message, ai_response, satisfaction, access_count,
                    COALESCE(retention_score, 1.0) as retention_score
             FROM episodic_memory
             WHERE retention_score > ?1
             ORDER BY retention_score DESC
             LIMIT 250"  // Focus on top 250 high-retention memories (optimized for performance)
        )?;

        let high_retention_memories: Vec<(String, String, f32, i32, f32)> = stmt
            .query_map([retention_threshold], |row| {
                Ok((
                    row.get(0)?,  // user_message
                    row.get(1)?,  // ai_response
                    row.get(2)?,  // satisfaction
                    row.get(3)?,  // access_count
                    row.get::<_, f64>(4)? as f32,  // retention_score
                ))
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        if high_retention_memories.is_empty() {
            warn!("No high-retention memories found above threshold {}", retention_threshold);
            return Ok(current_persona);
        }

        info!("Found {} high-retention memories for persona evolution", high_retention_memories.len());

        // Analyze patterns in successful conversations
        let mut formality_sum = 0.0f32;
        let mut verbosity_sum = 0.0f32;
        let mut technical_sum = 0.0f32;
        let mut emoji_count = 0;
        let mut total_weight = 0.0f32;

        for (_user_msg, ai_response, satisfaction, access_count, retention_score) in &high_retention_memories {
            // Weight by retention * satisfaction * access_count
            let weight = retention_score * satisfaction * (1.0 + (*access_count as f32 * 0.1).min(2.0));
            total_weight += weight;

            // Infer formality from response style
            let has_formal_words = ai_response.to_lowercase().contains("please") ||
                                   ai_response.to_lowercase().contains("kindly") ||
                                   ai_response.to_lowercase().contains("regarding");
            formality_sum += if has_formal_words { weight * 0.7 } else { weight * 0.3 };

            // Infer verbosity from response length
            let word_count = ai_response.split_whitespace().count();
            let verbosity = if word_count > 200 { 0.8 } else if word_count > 100 { 0.6 } else { 0.4 };
            verbosity_sum += verbosity * weight;

            // Infer technical depth from technical terminology
            let has_technical = ai_response.contains("fn ") ||
                               ai_response.contains("impl ") ||
                               ai_response.contains("trait ") ||
                               ai_response.contains("async ") ||
                               ai_response.contains("tokio") ||
                               ai_response.contains("Arc<");
            technical_sum += if has_technical { weight * 0.7 } else { weight * 0.3 };

            // Count emojis
            if ai_response.contains('✅') || ai_response.contains('📦') ||
               ai_response.contains('⚡') || ai_response.contains('🔔') {
                emoji_count += 1;
            }
        }

        // Calculate learned traits
        let learned_formality = formality_sum / total_weight.max(1.0);
        let learned_verbosity = verbosity_sum / total_weight.max(1.0);
        let learned_technical = technical_sum / total_weight.max(1.0);
        let learned_emoji = (emoji_count as f32 / high_retention_memories.len() as f32).min(1.0);

        // Gradually adjust current persona (blend with learned traits)
        let evolved = PersonaParameters {
            formality: clamp(
                current_persona.formality * (1.0 - learning_rate) + learned_formality * learning_rate,
                0.0,
                1.0,
            ),
            verbosity: clamp(
                current_persona.verbosity * (1.0 - learning_rate) + learned_verbosity * learning_rate,
                0.0,
                1.0,
            ),
            technical_depth: clamp(
                current_persona.technical_depth * (1.0 - learning_rate) + learned_technical * learning_rate,
                0.0,
                1.0,
            ),
            emoji_usage: clamp(
                current_persona.emoji_usage * (1.0 - learning_rate) + learned_emoji * learning_rate,
                0.0,
                1.0,
            ),
            // Keep other parameters unchanged for now
            humor: current_persona.humor,
            proactiveness: current_persona.proactiveness,
            empathy: current_persona.empathy,
            code_examples: current_persona.code_examples,
            questioning: current_persona.questioning,
            creativity: current_persona.creativity,
        };

        info!("Persona evolution: formality {:.2} → {:.2}, verbosity {:.2} → {:.2}, technical {:.2} → {:.2}",
            current_persona.formality, evolved.formality,
            current_persona.verbosity, evolved.verbosity,
            current_persona.technical_depth, evolved.technical_depth
        );

        Ok(evolved)
    }

    /// Evolve FULL persona from temporal memories using ML-based trait analysis (v3.8.0 Phase 4)
    /// Uses Advanced Pattern Detection to analyze all 10 personality traits
    pub async fn evolve_full_persona_from_temporal(
        &self,
        current_persona: PersonaParameters,
        retention_threshold: f32,
        learning_rate: f32,
        pattern_detector: &crate::services::pattern_detector::LlmPatternDetector,
    ) -> Result<PersonaParameters> {
        // Query high-retention memories (ensure stmt is dropped before await)
        let memories: Vec<(String, f32, i32, f32)> = {
            let db = self.db.lock().unwrap();
            let conn = db.conn();

            let mut stmt = conn.prepare(
                "SELECT ai_response, satisfaction, access_count, retention_score
                 FROM episodic_memory
                 WHERE COALESCE(retention_score, 1.0) > ?1
                 ORDER BY retention_score DESC
                 LIMIT 100"
            )?;

            let result = stmt
                .query_map([retention_threshold], |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, f32>(1).unwrap_or(0.5),
                        row.get::<_, i32>(2).unwrap_or(0),
                        row.get::<_, f32>(3).unwrap_or(1.0),
                    ))
                })?
                .collect::<rusqlite::Result<Vec<_>>>()?;

            result
        }; // db and stmt dropped here

        if memories.is_empty() {
            info!("No high-retention memories found, keeping current persona");
            return Ok(current_persona);
        }

        info!("Analyzing {} high-retention memories for full persona evolution", memories.len());

        // Analyze each memory with ML pattern detector
        let mut total_weight = 0.0;
        let mut weighted_traits = [0.0_f32; 10];  // 10 persona parameters

        for (ai_response, satisfaction, access_count, retention_score) in &memories {
            // Calculate weight: retention * satisfaction * access_boost
            let access_boost = 1.0 + (*access_count as f32 * 0.1).min(2.0);
            let weight = retention_score * satisfaction * access_boost;
            total_weight += weight;

            // Analyze traits using ML
            match pattern_detector.analyze_traits(ai_response).await {
                Ok(analysis) => {
                    weighted_traits[0] += analysis.formality * weight;
                    weighted_traits[1] += analysis.verbosity * weight;
                    weighted_traits[2] += analysis.humor * weight;
                    weighted_traits[3] += analysis.emoji_usage * weight;
                    weighted_traits[4] += analysis.proactivity * weight;
                    weighted_traits[5] += analysis.technical_depth * weight;
                    weighted_traits[6] += analysis.empathy * weight;
                    weighted_traits[7] += analysis.creativity * weight;  // Maps to code_examples
                    weighted_traits[8] += analysis.assertiveness * weight;  // Maps to questioning
                    weighted_traits[9] += analysis.creativity * weight;  // Creativity
                }
                Err(e) => {
                    warn!("Failed to analyze trait for memory, skipping: {}", e);
                    // Don't adjust total_weight down; use current persona values instead
                    weighted_traits[0] += current_persona.formality * weight;
                    weighted_traits[1] += current_persona.verbosity * weight;
                    weighted_traits[2] += current_persona.humor * weight;
                    weighted_traits[3] += current_persona.emoji_usage * weight;
                    weighted_traits[4] += current_persona.proactiveness * weight;
                    weighted_traits[5] += current_persona.technical_depth * weight;
                    weighted_traits[6] += current_persona.empathy * weight;
                    weighted_traits[7] += current_persona.code_examples * weight;
                    weighted_traits[8] += current_persona.questioning * weight;
                    weighted_traits[9] += current_persona.creativity * weight;
                }
            }
        }

        // Normalize by total weight
        let learned_traits: Vec<f32> = weighted_traits
            .iter()
            .map(|sum| (sum / total_weight).clamp(0.0, 1.0))
            .collect();

        // Gradual blending with current persona
        let evolved = PersonaParameters {
            formality: clamp(
                current_persona.formality * (1.0 - learning_rate) + learned_traits[0] * learning_rate,
                0.0, 1.0
            ),
            verbosity: clamp(
                current_persona.verbosity * (1.0 - learning_rate) + learned_traits[1] * learning_rate,
                0.0, 1.0
            ),
            humor: clamp(
                current_persona.humor * (1.0 - learning_rate) + learned_traits[2] * learning_rate,
                0.0, 1.0
            ),
            emoji_usage: clamp(
                current_persona.emoji_usage * (1.0 - learning_rate) + learned_traits[3] * learning_rate,
                0.0, 1.0
            ),
            proactiveness: clamp(
                current_persona.proactiveness * (1.0 - learning_rate) + learned_traits[4] * learning_rate,
                0.0, 1.0
            ),
            technical_depth: clamp(
                current_persona.technical_depth * (1.0 - learning_rate) + learned_traits[5] * learning_rate,
                0.0, 1.0
            ),
            empathy: clamp(
                current_persona.empathy * (1.0 - learning_rate) + learned_traits[6] * learning_rate,
                0.0, 1.0
            ),
            code_examples: clamp(
                current_persona.code_examples * (1.0 - learning_rate) + learned_traits[7] * learning_rate,
                0.0, 1.0
            ),
            questioning: clamp(
                current_persona.questioning * (1.0 - learning_rate) + learned_traits[8] * learning_rate,
                0.0, 1.0
            ),
            creativity: clamp(
                current_persona.creativity * (1.0 - learning_rate) + learned_traits[9] * learning_rate,
                0.0, 1.0
            ),
        };

        info!(
            "Full persona evolved (ML-based):\n\
             Formality: {:.2} → {:.2}\n\
             Verbosity: {:.2} → {:.2}\n\
             Humor: {:.2} → {:.2}\n\
             Emoji: {:.2} → {:.2}\n\
             Proactivity: {:.2} → {:.2}\n\
             Technical: {:.2} → {:.2}\n\
             Empathy: {:.2} → {:.2}\n\
             Code Examples: {:.2} → {:.2}\n\
             Questioning: {:.2} → {:.2}\n\
             Creativity: {:.2} → {:.2}",
            current_persona.formality, evolved.formality,
            current_persona.verbosity, evolved.verbosity,
            current_persona.humor, evolved.humor,
            current_persona.emoji_usage, evolved.emoji_usage,
            current_persona.proactiveness, evolved.proactiveness,
            current_persona.technical_depth, evolved.technical_depth,
            current_persona.empathy, evolved.empathy,
            current_persona.code_examples, evolved.code_examples,
            current_persona.questioning, evolved.questioning,
            current_persona.creativity, evolved.creativity
        );

        Ok(evolved)
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

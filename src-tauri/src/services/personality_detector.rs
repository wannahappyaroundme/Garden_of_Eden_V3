// Personality Detection Service (v3.8.0 Phase 2.1)
// Analyzes conversation patterns to detect user personality traits
// and automatically adjusts persona parameters
#![allow(dead_code)]

use crate::database::{Database, models::PersonaParameters};
use anyhow::Result;
use regex::Regex;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Conversation pattern analysis results
#[derive(Debug, Clone)]
pub struct ConversationPatterns {
    /// Average message length (words)
    pub avg_message_length: f32,
    /// Formality score (0.0-1.0) - based on grammar, punctuation, honorifics
    pub formality: f32,
    /// Verbosity score (0.0-1.0) - concise vs detailed explanations
    pub verbosity: f32,
    /// Humor usage (0.0-1.0) - jokes, playful language, sarcasm
    pub humor: f32,
    /// Emoji usage (0.0-1.0) - frequency of emojis
    pub emoji_usage: f32,
    /// Empathy/emotional expression (0.0-1.0) - emotional words, feelings
    pub empathy: f32,
    /// Creativity (0.0-1.0) - unique phrasing, metaphors, abstract thinking
    pub creativity: f32,
    /// Proactiveness (0.0-1.0) - asks questions, seeks clarification
    pub proactiveness: f32,
    /// Technical depth (0.0-1.0) - technical jargon, code snippets
    pub technical_depth: f32,
    /// Code examples preference (0.0-1.0) - requests for code examples
    pub code_examples: f32,
    /// Questioning tendency (0.0-1.0) - asks follow-up questions
    pub questioning: f32,
}

/// Big Five personality traits (OCEAN model)
#[derive(Debug, Clone)]
pub struct BigFiveTraits {
    /// Openness to experience (0.0-1.0)
    pub openness: f32,
    /// Conscientiousness (0.0-1.0)
    pub conscientiousness: f32,
    /// Extraversion (0.0-1.0)
    pub extraversion: f32,
    /// Agreeableness (0.0-1.0)
    pub agreeableness: f32,
    /// Neuroticism (0.0-1.0)
    pub neuroticism: f32,
}

/// MBTI-like type detection (simplified 4 dimensions)
#[derive(Debug, Clone)]
pub struct MBTIIndicators {
    /// Introversion (0.0) vs Extraversion (1.0)
    pub ie_score: f32,
    /// Sensing (0.0) vs Intuition (1.0)
    pub sn_score: f32,
    /// Thinking (0.0) vs Feeling (1.0)
    pub tf_score: f32,
    /// Judging (0.0) vs Perceiving (1.0)
    pub jp_score: f32,
}

/// Personality insights combining multiple models
#[derive(Debug, Clone)]
pub struct PersonalityInsights {
    pub patterns: ConversationPatterns,
    pub big_five: BigFiveTraits,
    pub mbti: MBTIIndicators,
    pub confidence: f32, // 0.0-1.0, based on sample size
    pub sample_size: usize,
}

/// Personality detector service
pub struct PersonalityDetectorService {
    db: Arc<Mutex<Database>>,
    // Regex patterns for linguistic analysis
    formality_patterns: HashMap<String, Regex>,
    emotion_patterns: HashMap<String, Regex>,
    technical_patterns: HashMap<String, Regex>,
}

impl PersonalityDetectorService {
    /// Create a new personality detector service
    pub fn new(db: Arc<Mutex<Database>>) -> Result<Self> {
        let mut formality_patterns = HashMap::new();
        let mut emotion_patterns = HashMap::new();
        let mut technical_patterns = HashMap::new();

        // Formality patterns
        formality_patterns.insert(
            "honorifics_korean".to_string(),
            Regex::new(r"(습니다|ㅂ니다|요$|죠|세요|하십시오|님)").unwrap(),
        );
        formality_patterns.insert(
            "informal_korean".to_string(),
            Regex::new(r"(ㅋㅋ|ㄷㄷ|ㅇㅇ|ㄴㄴ|~|야|얘|임마)").unwrap(),
        );
        formality_patterns.insert(
            "formal_english".to_string(),
            Regex::new(r"\b(please|kindly|would you|could you|thank you|sir|madam)\b").unwrap(),
        );
        formality_patterns.insert(
            "contractions".to_string(),
            Regex::new(r"(don't|can't|won't|shouldn't|I'm|you're|it's)").unwrap(),
        );

        // Emotion patterns
        emotion_patterns.insert(
            "positive_emotion".to_string(),
            Regex::new(r"\b(happy|excited|love|wonderful|amazing|great|awesome|fantastic)\b").unwrap(),
        );
        emotion_patterns.insert(
            "negative_emotion".to_string(),
            Regex::new(r"\b(sad|angry|frustrated|worried|anxious|stressed|upset|annoyed)\b").unwrap(),
        );
        emotion_patterns.insert(
            "empathy_words".to_string(),
            Regex::new(r"\b(feel|feeling|understand|care|support|help|comfort)\b").unwrap(),
        );
        emotion_patterns.insert(
            "korean_emotion".to_string(),
            Regex::new(r"(기쁘|슬프|화나|걱정|불안|힘들|좋아|싫어|사랑|미워)").unwrap(),
        );

        // Technical patterns
        technical_patterns.insert(
            "code_request".to_string(),
            Regex::new(r"\b(code|example|snippet|implement|function|class|method|algorithm)\b").unwrap(),
        );
        technical_patterns.insert(
            "technical_jargon".to_string(),
            Regex::new(r"\b(API|database|server|client|backend|frontend|framework|library|SDK|REST|GraphQL|SQL)\b").unwrap(),
        );
        technical_patterns.insert(
            "programming_language".to_string(),
            Regex::new(r"\b(Python|JavaScript|TypeScript|Rust|Java|C\+\+|Go|Ruby|PHP)\b").unwrap(),
        );

        Ok(Self {
            db,
            formality_patterns,
            emotion_patterns,
            technical_patterns,
        })
    }

    /// Analyze conversation patterns from recent messages
    pub fn analyze_patterns(&self, conversation_id: &str, message_limit: usize) -> Result<ConversationPatterns> {
        let db = self.db.lock().unwrap();
        let mut stmt = db.conn().prepare(
            "SELECT content, role FROM messages
             WHERE conversation_id = ?1 AND role = 'user'
             ORDER BY timestamp DESC
             LIMIT ?2",
        )?;

        let messages: Vec<String> = stmt
            .query_map([conversation_id, &message_limit.to_string()], |row| row.get(0))?
            .filter_map(|r| r.ok())
            .collect();

        drop(stmt);
        drop(db);

        if messages.is_empty() {
            // Return default patterns if no messages
            return Ok(ConversationPatterns {
                avg_message_length: 0.0,
                formality: 0.5,
                verbosity: 0.5,
                humor: 0.3,
                emoji_usage: 0.2,
                empathy: 0.5,
                creativity: 0.5,
                proactiveness: 0.4,
                technical_depth: 0.5,
                code_examples: 0.5,
                questioning: 0.4,
            });
        }

        // Calculate patterns
        let formality = self.calculate_formality(&messages);
        let verbosity = self.calculate_verbosity(&messages);
        let humor = self.calculate_humor(&messages);
        let emoji_usage = self.calculate_emoji_usage(&messages);
        let empathy = self.calculate_empathy(&messages);
        let creativity = self.calculate_creativity(&messages);
        let proactiveness = self.calculate_proactiveness(&messages);
        let technical_depth = self.calculate_technical_depth(&messages);
        let code_examples = self.calculate_code_examples(&messages);
        let questioning = self.calculate_questioning(&messages);

        let avg_message_length = messages.iter()
            .map(|msg| msg.split_whitespace().count() as f32)
            .sum::<f32>() / messages.len() as f32;

        Ok(ConversationPatterns {
            avg_message_length,
            formality,
            verbosity,
            humor,
            emoji_usage,
            empathy,
            creativity,
            proactiveness,
            technical_depth,
            code_examples,
            questioning,
        })
    }

    /// Calculate formality score based on linguistic patterns
    pub fn calculate_formality(&self, messages: &[String]) -> f32 {
        let mut formal_count = 0;
        let mut informal_count = 0;

        for msg in messages {
            // Korean honorifics increase formality
            if let Some(pattern) = self.formality_patterns.get("honorifics_korean") {
                formal_count += pattern.find_iter(msg).count();
            }

            // Korean informal speech decreases formality
            if let Some(pattern) = self.formality_patterns.get("informal_korean") {
                informal_count += pattern.find_iter(msg).count();
            }

            // English formal phrases
            if let Some(pattern) = self.formality_patterns.get("formal_english") {
                formal_count += pattern.find_iter(msg).count();
            }

            // Contractions decrease formality
            if let Some(pattern) = self.formality_patterns.get("contractions") {
                informal_count += pattern.find_iter(msg).count();
            }
        }

        let total = (formal_count + informal_count) as f32;
        if total == 0.0 {
            return 0.5; // Default neutral formality
        }

        (formal_count as f32 / total).clamp(0.0, 1.0)
    }

    /// Calculate verbosity score based on message length and detail
    pub fn calculate_verbosity(&self, messages: &[String]) -> f32 {
        let avg_length = messages.iter()
            .map(|msg| msg.split_whitespace().count() as f32)
            .sum::<f32>() / messages.len() as f32;

        // Map average word count to verbosity score
        // Short messages (1-10 words): 0.0-0.3
        // Medium messages (10-30 words): 0.3-0.7
        // Long messages (30+ words): 0.7-1.0
        if avg_length < 10.0 {
            (avg_length / 10.0 * 0.3).clamp(0.0, 0.3)
        } else if avg_length < 30.0 {
            (0.3 + (avg_length - 10.0) / 20.0 * 0.4).clamp(0.3, 0.7)
        } else {
            (0.7 + (avg_length - 30.0) / 70.0 * 0.3).clamp(0.7, 1.0)
        }
    }

    /// Calculate humor score based on playful language
    pub fn calculate_humor(&self, messages: &[String]) -> f32 {
        let mut humor_indicators = 0;

        for msg in messages {
            // Korean laugh expressions (ㅋㅋ, ㅎㅎ, etc.)
            let korean_laugh = Regex::new(r"(ㅋ{2,}|ㅎ{2,}|ㄷㄷ|ㅇㅂㅇ)").unwrap();
            humor_indicators += korean_laugh.find_iter(msg).count();

            // English laugh expressions
            let english_laugh = Regex::new(r"\b(lol|haha|hehe|lmao|rofl)\b").unwrap();
            humor_indicators += english_laugh.find_iter(msg).count();

            // Emojis often indicate humor
            let emoji = Regex::new(r"[😀😁😂🤣😃😄😅😆😊😋😎😍😜😝😛]").unwrap();
            humor_indicators += emoji.find_iter(msg).count();

            // Exclamation marks (multiple)
            let exclamations = Regex::new(r"!{2,}").unwrap();
            humor_indicators += exclamations.find_iter(msg).count();
        }

        // Normalize by message count
        let score = (humor_indicators as f32 / messages.len() as f32) / 3.0; // Average 3 indicators = 1.0
        score.clamp(0.0, 1.0)
    }

    /// Calculate emoji usage score
    pub fn calculate_emoji_usage(&self, messages: &[String]) -> f32 {
        let mut emoji_count = 0;
        let emoji_pattern = Regex::new(r"[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]").unwrap();

        for msg in messages {
            emoji_count += emoji_pattern.find_iter(msg).count();
        }

        // Normalize by message count
        let score = (emoji_count as f32 / messages.len() as f32) / 5.0; // Average 5 emojis per message = 1.0
        score.clamp(0.0, 1.0)
    }

    /// Calculate empathy score based on emotional language
    pub fn calculate_empathy(&self, messages: &[String]) -> f32 {
        let mut empathy_score = 0.0;
        let total_words: usize = messages.iter()
            .map(|msg| msg.split_whitespace().count())
            .sum();

        if total_words == 0 {
            return 0.5;
        }

        for msg in messages {
            // Positive emotions
            if let Some(pattern) = self.emotion_patterns.get("positive_emotion") {
                empathy_score += pattern.find_iter(msg).count() as f32;
            }

            // Negative emotions (expressing feelings)
            if let Some(pattern) = self.emotion_patterns.get("negative_emotion") {
                empathy_score += pattern.find_iter(msg).count() as f32;
            }

            // Empathy words
            if let Some(pattern) = self.emotion_patterns.get("empathy_words") {
                empathy_score += pattern.find_iter(msg).count() as f32 * 1.5; // Weight higher
            }

            // Korean emotion words
            if let Some(pattern) = self.emotion_patterns.get("korean_emotion") {
                empathy_score += pattern.find_iter(msg).count() as f32;
            }
        }

        // Normalize by total words
        (empathy_score / total_words as f32 * 20.0).clamp(0.0, 1.0)
    }

    /// Calculate creativity score based on unique language patterns
    pub fn calculate_creativity(&self, messages: &[String]) -> f32 {
        let mut creativity_score = 0.0;

        for msg in messages {
            // Metaphors and abstract thinking indicators
            let metaphor = Regex::new(r"\b(like|as if|imagine|seems|appears|metaphor|analogy)\b").unwrap();
            creativity_score += metaphor.find_iter(msg).count() as f32;

            // Korean abstract expressions
            let korean_abstract = Regex::new(r"(마치|마음|느낌|분위기|생각|상상|추상)").unwrap();
            creativity_score += korean_abstract.find_iter(msg).count() as f32;

            // Question marks (curiosity)
            creativity_score += msg.matches('?').count() as f32 * 0.5;
        }

        // Normalize by message count
        let score = (creativity_score / messages.len() as f32) / 5.0; // Average 5 indicators = 1.0
        score.clamp(0.0, 1.0)
    }

    /// Calculate proactiveness score
    pub fn calculate_proactiveness(&self, messages: &[String]) -> f32 {
        let mut proactive_count = 0;

        for msg in messages {
            // Questions
            proactive_count += msg.matches('?').count();

            // Clarification requests
            let clarification = Regex::new(r"\b(what|why|how|when|where|who|clarify|explain|mean)\b").unwrap();
            proactive_count += clarification.find_iter(msg).count();

            // Korean question words
            let korean_question = Regex::new(r"(무엇|왜|어떻게|언제|어디|누구|설명|의미)").unwrap();
            proactive_count += korean_question.find_iter(msg).count();
        }

        let score = (proactive_count as f32 / messages.len() as f32) / 3.0; // Average 3 questions per message = 1.0
        score.clamp(0.0, 1.0)
    }

    /// Calculate technical depth preference
    pub fn calculate_technical_depth(&self, messages: &[String]) -> f32 {
        let mut technical_count = 0;
        let total_words: usize = messages.iter()
            .map(|msg| msg.split_whitespace().count())
            .sum();

        if total_words == 0 {
            return 0.5;
        }

        for msg in messages {
            // Technical jargon
            if let Some(pattern) = self.technical_patterns.get("technical_jargon") {
                technical_count += pattern.find_iter(msg).count();
            }

            // Programming languages
            if let Some(pattern) = self.technical_patterns.get("programming_language") {
                technical_count += pattern.find_iter(msg).count();
            }
        }

        // Normalize by total words
        (technical_count as f32 / total_words as f32 * 20.0).clamp(0.0, 1.0)
    }

    /// Calculate code examples preference
    pub fn calculate_code_examples(&self, messages: &[String]) -> f32 {
        let mut code_request_count = 0;

        for msg in messages {
            // Code request patterns
            if let Some(pattern) = self.technical_patterns.get("code_request") {
                code_request_count += pattern.find_iter(msg).count();
            }

            // Code blocks in markdown
            code_request_count += msg.matches("```").count();
        }

        let score = (code_request_count as f32 / messages.len() as f32) / 2.0; // Average 2 code requests per message = 1.0
        score.clamp(0.0, 1.0)
    }

    /// Calculate questioning tendency
    pub fn calculate_questioning(&self, messages: &[String]) -> f32 {
        let question_count: usize = messages.iter()
            .map(|msg| msg.matches('?').count())
            .sum();

        let score = (question_count as f32 / messages.len() as f32) / 2.0; // Average 2 questions per message = 1.0
        score.clamp(0.0, 1.0)
    }

    /// Detect Big Five personality traits from conversation patterns
    pub fn detect_big_five(&self, patterns: &ConversationPatterns) -> BigFiveTraits {
        // Openness: creativity, curiosity, questioning
        let openness = (patterns.creativity * 0.4 + patterns.questioning * 0.3 + patterns.proactiveness * 0.3).clamp(0.0, 1.0);

        // Conscientiousness: formality, verbosity (detailed), low humor
        let conscientiousness = (patterns.formality * 0.4 + patterns.verbosity * 0.3 + (1.0 - patterns.humor) * 0.3).clamp(0.0, 1.0);

        // Extraversion: emoji usage, humor, empathy
        let extraversion = (patterns.emoji_usage * 0.3 + patterns.humor * 0.4 + patterns.empathy * 0.3).clamp(0.0, 1.0);

        // Agreeableness: empathy, low formality (casual), humor
        let agreeableness = (patterns.empathy * 0.5 + (1.0 - patterns.formality * 0.5) * 0.25 + patterns.humor * 0.25).clamp(0.0, 1.0);

        // Neuroticism: harder to detect from text, use empathy (emotional expression) as proxy
        let neuroticism = (patterns.empathy * 0.6 + patterns.verbosity * 0.4).clamp(0.0, 1.0);

        BigFiveTraits {
            openness,
            conscientiousness,
            extraversion,
            agreeableness,
            neuroticism,
        }
    }

    /// Detect MBTI indicators from conversation patterns
    pub fn detect_mbti(&self, patterns: &ConversationPatterns) -> MBTIIndicators {
        // I-E: Introversion (low emoji, low humor) vs Extraversion (high emoji, high humor)
        let ie_score = (patterns.emoji_usage * 0.4 + patterns.humor * 0.3 + patterns.proactiveness * 0.3).clamp(0.0, 1.0);

        // S-N: Sensing (technical, concrete) vs Intuition (creative, abstract)
        let sn_score = (patterns.creativity * 0.5 + (1.0 - patterns.technical_depth) * 0.3 + patterns.questioning * 0.2).clamp(0.0, 1.0);

        // T-F: Thinking (low empathy, technical) vs Feeling (high empathy)
        let tf_score = (patterns.empathy * 0.6 + (1.0 - patterns.technical_depth * 0.5) * 0.4).clamp(0.0, 1.0);

        // J-P: Judging (formal, structured) vs Perceiving (informal, flexible)
        let jp_score = ((1.0 - patterns.formality) * 0.5 + patterns.humor * 0.3 + patterns.creativity * 0.2).clamp(0.0, 1.0);

        MBTIIndicators {
            ie_score,
            sn_score,
            tf_score,
            jp_score,
        }
    }

    /// Generate comprehensive personality insights
    pub fn generate_insights(&self, conversation_id: &str, message_limit: usize) -> Result<PersonalityInsights> {
        let patterns = self.analyze_patterns(conversation_id, message_limit)?;
        let big_five = self.detect_big_five(&patterns);
        let mbti = self.detect_mbti(&patterns);

        // Calculate confidence based on sample size
        let confidence = if message_limit < 10 {
            (message_limit as f32 / 10.0) * 0.5 // Low confidence
        } else if message_limit < 50 {
            0.5 + ((message_limit as f32 - 10.0) / 40.0) * 0.3 // Medium confidence
        } else {
            0.8 + ((message_limit as f32 - 50.0) / 200.0) * 0.2 // High confidence
        }.clamp(0.0, 1.0);

        Ok(PersonalityInsights {
            patterns,
            big_five,
            mbti,
            confidence,
            sample_size: message_limit,
        })
    }

    /// Suggest persona adjustments based on personality insights
    pub fn suggest_persona_adjustments(&self, insights: &PersonalityInsights) -> PersonaParameters {
        let patterns = &insights.patterns;

        // Convert patterns (0.0-1.0) to persona parameters (0-100)
        PersonaParameters {
            formality: (patterns.formality * 100.0) as i32,
            verbosity: (patterns.verbosity * 100.0) as i32,
            humor: (patterns.humor * 100.0) as i32,
            emoji_usage: (patterns.emoji_usage * 100.0) as i32,
            empathy: (patterns.empathy * 100.0) as i32,
            creativity: (patterns.creativity * 100.0) as i32,
            proactiveness: (patterns.proactiveness * 100.0) as i32,
            technical_depth: (patterns.technical_depth * 100.0) as i32,
            code_examples: (patterns.code_examples * 100.0) as i32,
            questioning: (patterns.questioning * 100.0) as i32,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_messages() -> Vec<String> {
        vec![
            "안녕하세요! 오늘 코드 리뷰 부탁드립니다 😊".to_string(),
            "What's the best way to implement async/await in Rust? I need detailed examples.".to_string(),
            "ㅋㅋㅋ 진짜? 대박이네요!! 😂".to_string(),
            "Could you please explain the difference between traits and interfaces?".to_string(),
            "I'm feeling frustrated with this bug. Can you help me understand what's wrong?".to_string(),
        ]
    }

    #[test]
    fn test_formality_calculation() {
        let db = Arc::new(Mutex::new(crate::database::Database::new().unwrap()));
        let detector = PersonalityDetectorService::new(db).unwrap();

        let formal_messages = vec![
            "안녕하세요. 도움을 주시겠습니까?".to_string(),
            "Could you please assist me with this matter?".to_string(),
        ];

        let informal_messages = vec![
            "ㅋㅋ 그래~ 고마워!".to_string(),
            "Hey! That's awesome, can't wait to try it!".to_string(),
        ];

        let formal_score = detector.calculate_formality(&formal_messages);
        let informal_score = detector.calculate_formality(&informal_messages);

        assert!(formal_score > 0.5, "Formal messages should have high formality score");
        assert!(informal_score < 0.5, "Informal messages should have low formality score");
    }

    #[test]
    fn test_emoji_usage_calculation() {
        let db = Arc::new(Mutex::new(crate::database::Database::new().unwrap()));
        let detector = PersonalityDetectorService::new(db).unwrap();

        let emoji_messages = vec![
            "😊😊😊".to_string(),
            "Great! 🎉🎉".to_string(),
        ];

        let no_emoji_messages = vec![
            "This is a test.".to_string(),
            "Another message.".to_string(),
        ];

        let emoji_score = detector.calculate_emoji_usage(&emoji_messages);
        let no_emoji_score = detector.calculate_emoji_usage(&no_emoji_messages);

        assert!(emoji_score > no_emoji_score, "Messages with emojis should have higher emoji usage score");
    }

    #[test]
    fn test_technical_depth_calculation() {
        let db = Arc::new(Mutex::new(crate::database::Database::new().unwrap()));
        let detector = PersonalityDetectorService::new(db).unwrap();

        let technical_messages = vec![
            "I need to configure the REST API endpoint with GraphQL integration.".to_string(),
            "The database query optimization using SQL indexes.".to_string(),
        ];

        let non_technical_messages = vec![
            "How are you today?".to_string(),
            "I like the weather.".to_string(),
        ];

        let technical_score = detector.calculate_technical_depth(&technical_messages);
        let non_technical_score = detector.calculate_technical_depth(&non_technical_messages);

        assert!(technical_score > non_technical_score, "Technical messages should have higher technical depth score");
    }

    #[test]
    fn test_big_five_detection() {
        let db = Arc::new(Mutex::new(crate::database::Database::new().unwrap()));
        let detector = PersonalityDetectorService::new(db).unwrap();

        let patterns = ConversationPatterns {
            avg_message_length: 20.0,
            formality: 0.7,
            verbosity: 0.8,
            humor: 0.2,
            emoji_usage: 0.1,
            empathy: 0.6,
            creativity: 0.7,
            proactiveness: 0.5,
            technical_depth: 0.8,
            code_examples: 0.6,
            questioning: 0.6,
        };

        let big_five = detector.detect_big_five(&patterns);

        // High creativity + questioning should indicate high openness
        assert!(big_five.openness > 0.5, "High creativity should indicate high openness");

        // High formality + verbosity should indicate high conscientiousness
        assert!(big_five.conscientiousness > 0.5, "High formality should indicate high conscientiousness");
    }

    #[test]
    fn test_mbti_detection() {
        let db = Arc::new(Mutex::new(crate::database::Database::new().unwrap()));
        let detector = PersonalityDetectorService::new(db).unwrap();

        let patterns = ConversationPatterns {
            avg_message_length: 20.0,
            formality: 0.3,
            verbosity: 0.5,
            humor: 0.8,
            emoji_usage: 0.7,
            empathy: 0.8,
            creativity: 0.6,
            proactiveness: 0.7,
            technical_depth: 0.3,
            code_examples: 0.4,
            questioning: 0.5,
        };

        let mbti = detector.detect_mbti(&patterns);

        // High emoji + humor should indicate extraversion
        assert!(mbti.ie_score > 0.5, "High emoji and humor should indicate extraversion");

        // High empathy should indicate feeling over thinking
        assert!(mbti.tf_score > 0.5, "High empathy should indicate feeling preference");
    }
}

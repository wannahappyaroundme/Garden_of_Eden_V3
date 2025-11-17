// Comprehensive tests for Phase 2: Personality Detection & Automatic Persona Adjustment
// Target: 30+ tests covering all Phase 2 functionality

#[cfg(test)]
mod personality_detector_tests {
    use crate::database::Database;
    use crate::services::personality_detector::*;
    use std::sync::{Arc, Mutex};

    fn create_test_db() -> Arc<Mutex<Database>> {
        Arc::new(Mutex::new(Database::new().unwrap()))
    }

    fn create_test_conversation(db: &Arc<Mutex<Database>>, conversation_id: &str, messages: Vec<&str>) {
        let db_lock = db.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();

        // Create conversation
        db_lock.conn().execute(
            "INSERT INTO conversations (id, title, mode, created_at, updated_at, message_count)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                conversation_id,
                "Test Conversation",
                "user-led",
                now,
                now,
                messages.len() as i32,
            ],
        ).unwrap();

        // Insert messages
        for (i, msg) in messages.iter().enumerate() {
            db_lock.conn().execute(
                "INSERT INTO messages (id, conversation_id, role, content, timestamp)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![
                    format!("msg-{}", i),
                    conversation_id,
                    "user",
                    msg,
                    now + (i as i64 * 1000),
                ],
            ).unwrap();
        }
    }

    // ========== Formality Detection Tests ==========

    #[test]
    fn test_formality_korean_honorifics() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let formal = vec![
            "안녕하세요. 도움을 주시겠습니까?".to_string(),
            "감사합니다. 잘 부탁드립니다.".to_string(),
        ];

        let score = detector.calculate_formality(&formal);
        assert!(score > 0.6, "Korean honorifics should indicate high formality, got {}", score);
    }

    #[test]
    fn test_formality_korean_informal() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let informal = vec![
            "ㅋㅋㅋ 그래~ 고마워!".to_string(),
            "야 이거 봐봐 ㅋㅋ".to_string(),
        ];

        let score = detector.calculate_formality(&informal);
        assert!(score < 0.4, "Korean informal speech should indicate low formality, got {}", score);
    }

    #[test]
    fn test_formality_english_formal() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let formal = vec![
            "Could you please assist me with this matter?".to_string(),
            "Thank you kindly for your help, sir.".to_string(),
        ];

        let score = detector.calculate_formality(&formal);
        assert!(score > 0.6, "English formal phrases should indicate high formality, got {}", score);
    }

    #[test]
    fn test_formality_english_contractions() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let informal = vec![
            "I don't think it's working, can't figure it out.".to_string(),
            "Won't you help? I'm stuck here.".to_string(),
        ];

        let score = detector.calculate_formality(&informal);
        assert!(score < 0.5, "English contractions should decrease formality, got {}", score);
    }

    #[test]
    fn test_formality_neutral() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let neutral = vec![
            "This is a test message.".to_string(),
            "I am working on the project.".to_string(),
        ];

        let score = detector.calculate_formality(&neutral);
        assert!(score >= 0.4 && score <= 0.6, "Neutral messages should have moderate formality, got {}", score);
    }

    // ========== Verbosity Detection Tests ==========

    #[test]
    fn test_verbosity_short_messages() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let short = vec![
            "Yes.".to_string(),
            "OK.".to_string(),
            "Got it.".to_string(),
        ];

        let score = detector.calculate_verbosity(&short);
        assert!(score < 0.3, "Short messages should indicate low verbosity, got {}", score);
    }

    #[test]
    fn test_verbosity_medium_messages() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let medium = vec![
            "I think this is a good approach for solving the problem.".to_string(),
            "Let me explain what I'm trying to achieve here.".to_string(),
        ];

        let score = detector.calculate_verbosity(&medium);
        assert!(score >= 0.3 && score <= 0.7, "Medium messages should have moderate verbosity, got {}", score);
    }

    #[test]
    fn test_verbosity_long_messages() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let long = vec![
            "I've been working on this project for quite some time now, and I've noticed that there are several areas where we could improve the overall architecture and design patterns to make the codebase more maintainable and scalable for future development efforts.".to_string(),
        ];

        let score = detector.calculate_verbosity(&long);
        assert!(score > 0.7, "Long messages should indicate high verbosity, got {}", score);
    }

    // ========== Humor Detection Tests ==========

    #[test]
    fn test_humor_korean_laugh() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let humorous = vec![
            "ㅋㅋㅋㅋ 진짜 웃기네".to_string(),
            "ㅎㅎㅎ 대박이다".to_string(),
        ];

        let score = detector.calculate_humor(&humorous);
        assert!(score > 0.3, "Korean laugh expressions should indicate humor, got {}", score);
    }

    #[test]
    fn test_humor_english_laugh() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let humorous = vec![
            "haha that's funny lol".to_string(),
            "lmao this is great".to_string(),
        ];

        let score = detector.calculate_humor(&humorous);
        assert!(score > 0.3, "English laugh expressions should indicate humor, got {}", score);
    }

    #[test]
    fn test_humor_emojis() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let humorous = vec![
            "This is amazing! 😂😂😂".to_string(),
            "Love it 😄😊".to_string(),
        ];

        let score = detector.calculate_humor(&humorous);
        assert!(score > 0.2, "Emojis should contribute to humor score, got {}", score);
    }

    #[test]
    fn test_humor_serious_tone() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let serious = vec![
            "This is a critical issue that needs immediate attention.".to_string(),
            "Please review the documentation carefully.".to_string(),
        ];

        let score = detector.calculate_humor(&serious);
        assert!(score < 0.2, "Serious messages should have low humor score, got {}", score);
    }

    // ========== Emoji Usage Tests ==========

    #[test]
    fn test_emoji_usage_heavy() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let emoji_heavy = vec![
            "😊😊😊 Great! 🎉🎉".to_string(),
            "Love it! ❤️❤️❤️".to_string(),
        ];

        let score = detector.calculate_emoji_usage(&emoji_heavy);
        assert!(score > 0.5, "Heavy emoji usage should have high score, got {}", score);
    }

    #[test]
    fn test_emoji_usage_none() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let no_emoji = vec![
            "This is a message without emojis.".to_string(),
            "Just plain text here.".to_string(),
        ];

        let score = detector.calculate_emoji_usage(&no_emoji);
        assert_eq!(score, 0.0, "No emojis should result in zero score");
    }

    // ========== Empathy Detection Tests ==========

    #[test]
    fn test_empathy_positive_emotion() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let empathetic = vec![
            "I'm so happy to help you with this! I love working on exciting projects.".to_string(),
            "This is wonderful news, I'm excited about it!".to_string(),
        ];

        let score = detector.calculate_empathy(&empathetic);
        assert!(score > 0.3, "Positive emotion words should indicate empathy, got {}", score);
    }

    #[test]
    fn test_empathy_negative_emotion() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let empathetic = vec![
            "I'm feeling frustrated and worried about this issue.".to_string(),
            "This is making me anxious and stressed.".to_string(),
        ];

        let score = detector.calculate_empathy(&empathetic);
        assert!(score > 0.3, "Negative emotion words should also indicate empathy, got {}", score);
    }

    #[test]
    fn test_empathy_words() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let empathetic = vec![
            "I understand how you feel, let me help and support you.".to_string(),
            "I care about this and want to comfort you.".to_string(),
        ];

        let score = detector.calculate_empathy(&empathetic);
        assert!(score > 0.5, "Empathy words should have high weight, got {}", score);
    }

    #[test]
    fn test_empathy_korean() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let empathetic = vec![
            "정말 기쁘고 좋아요!".to_string(),
            "조금 슬프고 힘들어요.".to_string(),
        ];

        let score = detector.calculate_empathy(&empathetic);
        assert!(score > 0.2, "Korean emotion words should indicate empathy, got {}", score);
    }

    // ========== Technical Depth Tests ==========

    #[test]
    fn test_technical_depth_jargon() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let technical = vec![
            "I need to configure the REST API with GraphQL integration.".to_string(),
            "The database query needs SQL optimization for better performance.".to_string(),
        ];

        let score = detector.calculate_technical_depth(&technical);
        assert!(score > 0.5, "Technical jargon should indicate high technical depth, got {}", score);
    }

    #[test]
    fn test_technical_depth_programming_languages() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let technical = vec![
            "I'm working with Python and JavaScript for this project.".to_string(),
            "We're using Rust and TypeScript on the backend.".to_string(),
        ];

        let score = detector.calculate_technical_depth(&technical);
        assert!(score > 0.4, "Programming languages should indicate technical depth, got {}", score);
    }

    #[test]
    fn test_technical_depth_non_technical() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let non_technical = vec![
            "How are you today? The weather is nice.".to_string(),
            "I like coffee and reading books.".to_string(),
        ];

        let score = detector.calculate_technical_depth(&non_technical);
        assert!(score < 0.2, "Non-technical messages should have low score, got {}", score);
    }

    // ========== Code Examples Tests ==========

    #[test]
    fn test_code_examples_request() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let code_requests = vec![
            "Can you show me a code example of this function?".to_string(),
            "I need to implement this algorithm, can you provide a snippet?".to_string(),
        ];

        let score = detector.calculate_code_examples(&code_requests);
        assert!(score > 0.3, "Code request keywords should indicate preference, got {}", score);
    }

    #[test]
    fn test_code_examples_markdown() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let code_blocks = vec![
            "Here's my code: ```python\nprint('hello')\n```".to_string(),
        ];

        let score = detector.calculate_code_examples(&code_blocks);
        assert!(score > 0.2, "Code blocks should indicate preference for examples, got {}", score);
    }

    // ========== Questioning Tests ==========

    #[test]
    fn test_questioning_high() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let questions = vec![
            "How does this work? Why did you choose this approach?".to_string(),
            "What are the benefits? Can you explain more?".to_string(),
        ];

        let score = detector.calculate_questioning(&questions);
        assert!(score > 0.5, "Multiple questions should indicate high questioning tendency, got {}", score);
    }

    #[test]
    fn test_questioning_low() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let statements = vec![
            "I understand the concept now.".to_string(),
            "This makes sense to me.".to_string(),
        ];

        let score = detector.calculate_questioning(&statements);
        assert!(score < 0.2, "No questions should indicate low questioning tendency, got {}", score);
    }

    // ========== Big Five Detection Tests ==========

    #[test]
    fn test_big_five_openness_high() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let patterns = ConversationPatterns {
            avg_message_length: 25.0,
            formality: 0.5,
            verbosity: 0.6,
            humor: 0.4,
            emoji_usage: 0.3,
            empathy: 0.5,
            creativity: 0.9,  // High creativity
            proactiveness: 0.7,
            technical_depth: 0.5,
            code_examples: 0.6,
            questioning: 0.8,  // High questioning
        };

        let big_five = detector.detect_big_five(&patterns);
        assert!(big_five.openness > 0.6, "High creativity and questioning should indicate high openness, got {}", big_five.openness);
    }

    #[test]
    fn test_big_five_conscientiousness_high() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let patterns = ConversationPatterns {
            avg_message_length: 30.0,
            formality: 0.9,  // High formality
            verbosity: 0.8,  // High verbosity (detailed)
            humor: 0.1,      // Low humor
            emoji_usage: 0.1,
            empathy: 0.5,
            creativity: 0.4,
            proactiveness: 0.5,
            technical_depth: 0.6,
            code_examples: 0.7,
            questioning: 0.5,
        };

        let big_five = detector.detect_big_five(&patterns);
        assert!(big_five.conscientiousness > 0.6, "High formality and verbosity should indicate high conscientiousness, got {}", big_five.conscientiousness);
    }

    #[test]
    fn test_big_five_extraversion_high() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let patterns = ConversationPatterns {
            avg_message_length: 20.0,
            formality: 0.3,
            verbosity: 0.5,
            humor: 0.9,      // High humor
            emoji_usage: 0.8, // High emoji usage
            empathy: 0.7,    // High empathy
            creativity: 0.6,
            proactiveness: 0.6,
            technical_depth: 0.4,
            code_examples: 0.5,
            questioning: 0.5,
        };

        let big_five = detector.detect_big_five(&patterns);
        assert!(big_five.extraversion > 0.6, "High humor and emoji usage should indicate high extraversion, got {}", big_five.extraversion);
    }

    // ========== MBTI Detection Tests ==========

    #[test]
    fn test_mbti_extraversion() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let patterns = ConversationPatterns {
            avg_message_length: 20.0,
            formality: 0.3,
            verbosity: 0.5,
            humor: 0.8,
            emoji_usage: 0.9,
            empathy: 0.6,
            creativity: 0.5,
            proactiveness: 0.8,
            technical_depth: 0.4,
            code_examples: 0.5,
            questioning: 0.5,
        };

        let mbti = detector.detect_mbti(&patterns);
        assert!(mbti.ie_score > 0.6, "High emoji, humor, proactiveness should indicate E (extraversion), got {}", mbti.ie_score);
    }

    #[test]
    fn test_mbti_intuition() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let patterns = ConversationPatterns {
            avg_message_length: 25.0,
            formality: 0.5,
            verbosity: 0.6,
            humor: 0.5,
            emoji_usage: 0.4,
            empathy: 0.5,
            creativity: 0.9,  // High creativity
            proactiveness: 0.6,
            technical_depth: 0.3,  // Low technical depth (less concrete)
            code_examples: 0.4,
            questioning: 0.7,
        };

        let mbti = detector.detect_mbti(&patterns);
        assert!(mbti.sn_score > 0.5, "High creativity and low technical depth should indicate N (intuition), got {}", mbti.sn_score);
    }

    #[test]
    fn test_mbti_feeling() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let patterns = ConversationPatterns {
            avg_message_length: 22.0,
            formality: 0.4,
            verbosity: 0.5,
            humor: 0.5,
            emoji_usage: 0.5,
            empathy: 0.9,  // High empathy
            creativity: 0.6,
            proactiveness: 0.5,
            technical_depth: 0.2,  // Low technical
            code_examples: 0.3,
            questioning: 0.5,
        };

        let mbti = detector.detect_mbti(&patterns);
        assert!(mbti.tf_score > 0.6, "High empathy should indicate F (feeling), got {}", mbti.tf_score);
    }

    #[test]
    fn test_mbti_perceiving() {
        let db = create_test_db();
        let detector = PersonalityDetectorService::new(db).unwrap();

        let patterns = ConversationPatterns {
            avg_message_length: 18.0,
            formality: 0.2,  // Low formality (informal)
            verbosity: 0.4,
            humor: 0.7,
            emoji_usage: 0.6,
            empathy: 0.5,
            creativity: 0.8,  // High creativity
            proactiveness: 0.6,
            technical_depth: 0.4,
            code_examples: 0.5,
            questioning: 0.5,
        };

        let mbti = detector.detect_mbti(&patterns);
        assert!(mbti.jp_score > 0.5, "Low formality and high creativity should indicate P (perceiving), got {}", mbti.jp_score);
    }

    // ========== Integration Tests ==========

    #[test]
    fn test_full_pattern_analysis() {
        let db = create_test_db();
        let conversation_id = format!("test-full-analysis-{:?}", std::thread::current().id());

        create_test_conversation(&db, &conversation_id, vec![
            "안녕하세요! 😊 도움을 주시겠습니까?",
            "I'm working on a Python project with REST API integration.",
            "ㅋㅋㅋ 재미있네요!",
            "Could you please show me a code example?",
            "What's the best approach? Why did you choose this method?",
        ]);

        let detector = PersonalityDetectorService::new(Arc::clone(&db)).unwrap();
        let patterns = detector.analyze_patterns(&conversation_id, 10).unwrap();

        // Verify all pattern scores are within valid range
        assert!(patterns.formality >= 0.0 && patterns.formality <= 1.0);
        assert!(patterns.verbosity >= 0.0 && patterns.verbosity <= 1.0);
        assert!(patterns.humor >= 0.0 && patterns.humor <= 1.0);
        assert!(patterns.emoji_usage >= 0.0 && patterns.emoji_usage <= 1.0);
        assert!(patterns.empathy >= 0.0 && patterns.empathy <= 1.0);
        assert!(patterns.creativity >= 0.0 && patterns.creativity <= 1.0);
        assert!(patterns.proactiveness >= 0.0 && patterns.proactiveness <= 1.0);
        assert!(patterns.technical_depth >= 0.0 && patterns.technical_depth <= 1.0);
        assert!(patterns.code_examples >= 0.0 && patterns.code_examples <= 1.0);
        assert!(patterns.questioning >= 0.0 && patterns.questioning <= 1.0);
    }

    #[test]
    fn test_generate_insights() {
        let db = create_test_db();
        let conversation_id = format!("test-insights-{:?}", std::thread::current().id());

        create_test_conversation(&db, &conversation_id, vec![
            "Hello! I'm excited to work on this project.",
            "Can you help me understand the architecture?",
            "I need to implement a REST API with database integration.",
            "What are the best practices for this?",
            "Thanks! This is really helpful.",
        ]);

        let detector = PersonalityDetectorService::new(Arc::clone(&db)).unwrap();
        let insights = detector.generate_insights(&conversation_id, 5).unwrap();

        assert_eq!(insights.sample_size, 5);
        assert!(insights.confidence > 0.0);

        // Verify Big Five traits are in range
        assert!(insights.big_five.openness >= 0.0 && insights.big_five.openness <= 1.0);
        assert!(insights.big_five.conscientiousness >= 0.0 && insights.big_five.conscientiousness <= 1.0);
        assert!(insights.big_five.extraversion >= 0.0 && insights.big_five.extraversion <= 1.0);
        assert!(insights.big_five.agreeableness >= 0.0 && insights.big_five.agreeableness <= 1.0);
        assert!(insights.big_five.neuroticism >= 0.0 && insights.big_five.neuroticism <= 1.0);

        // Verify MBTI scores are in range
        assert!(insights.mbti.ie_score >= 0.0 && insights.mbti.ie_score <= 1.0);
        assert!(insights.mbti.sn_score >= 0.0 && insights.mbti.sn_score <= 1.0);
        assert!(insights.mbti.tf_score >= 0.0 && insights.mbti.tf_score <= 1.0);
        assert!(insights.mbti.jp_score >= 0.0 && insights.mbti.jp_score <= 1.0);
    }

    #[test]
    fn test_suggest_persona_adjustments() {
        let db = create_test_db();
        {
            let db_lock = db.lock().unwrap();
            db_lock.create_default_persona().unwrap();
        }

        let detector = PersonalityDetectorService::new(Arc::clone(&db)).unwrap();

        let insights = PersonalityInsights {
            patterns: ConversationPatterns {
                avg_message_length: 30.0,
                formality: 0.8,
                verbosity: 0.7,
                humor: 0.2,
                emoji_usage: 0.1,
                empathy: 0.6,
                creativity: 0.5,
                proactiveness: 0.6,
                technical_depth: 0.9,
                code_examples: 0.8,
                questioning: 0.7,
            },
            big_five: crate::services::personality_detector::BigFiveTraits {
                openness: 0.7,
                conscientiousness: 0.8,
                extraversion: 0.3,
                agreeableness: 0.6,
                neuroticism: 0.4,
            },
            mbti: crate::services::personality_detector::MBTIIndicators {
                ie_score: 0.3,
                sn_score: 0.6,
                tf_score: 0.5,
                jp_score: 0.4,
            },
            confidence: 0.8,
            sample_size: 50,
        };

        let suggested = detector.suggest_persona_adjustments(&insights);

        // Verify suggestions are in valid range (0-100)
        assert!(suggested.formality >= 0 && suggested.formality <= 100);
        assert!(suggested.verbosity >= 0 && suggested.verbosity <= 100);
        assert!(suggested.technical_depth >= 0 && suggested.technical_depth <= 100);

        // Verify high technical depth pattern translates to high parameter
        assert!(suggested.technical_depth > 70, "High technical patterns should suggest high technical_depth");
    }

    #[test]
    fn test_confidence_calculation_low_sample() {
        let db = create_test_db();
        let conversation_id = format!("test-low-sample-{:?}", std::thread::current().id());

        create_test_conversation(&db, &conversation_id, vec![
            "Hello",
            "Thanks",
        ]);

        let detector = PersonalityDetectorService::new(Arc::clone(&db)).unwrap();
        let insights = detector.generate_insights(&conversation_id, 2).unwrap();

        assert!(insights.confidence < 0.5, "Low sample size should result in low confidence, got {}", insights.confidence);
    }

    #[test]
    fn test_confidence_calculation_high_sample() {
        let db = create_test_db();
        let conversation_id = format!("test-high-sample-{:?}", std::thread::current().id());

        let mut messages = Vec::new();
        for i in 0..100 {
            messages.push(format!("Message {}: This is a test message for analysis.", i));
        }
        let message_refs: Vec<&str> = messages.iter().map(|s| s.as_str()).collect();

        create_test_conversation(&db, &conversation_id, message_refs);

        let detector = PersonalityDetectorService::new(Arc::clone(&db)).unwrap();
        let insights = detector.generate_insights(&conversation_id, 100).unwrap();

        assert!(insights.confidence > 0.8, "High sample size should result in high confidence, got {}", insights.confidence);
    }

    #[test]
    fn test_save_and_retrieve_insights() {
        let db = create_test_db();
        let conversation_id = format!("test-save-retrieve-{:?}", std::thread::current().id());

        create_test_conversation(&db, &conversation_id, vec![
            "Test message 1",
            "Test message 2",
        ]);

        let detector = PersonalityDetectorService::new(Arc::clone(&db)).unwrap();
        let insights = detector.generate_insights(&conversation_id, 2).unwrap();

        // Save insights
        {
            let db_lock = db.lock().unwrap();
            db_lock.save_personality_insights(&conversation_id, &insights).unwrap();
        }

        // Retrieve insights
        let retrieved = {
            let db_lock = db.lock().unwrap();
            db_lock.get_latest_personality_insights(&conversation_id).unwrap()
        };

        assert!(retrieved.is_some());
        let retrieved_insights = retrieved.unwrap();

        // Verify data integrity
        assert_eq!(retrieved_insights.sample_size, insights.sample_size);
        assert!((retrieved_insights.confidence - insights.confidence).abs() < 0.01);
        assert!((retrieved_insights.patterns.formality - insights.patterns.formality).abs() < 0.01);
    }
}

#[cfg(test)]
mod persona_adjuster_tests {
    use crate::database::{Database, models::PersonaParameters};
    use crate::services::persona_adjuster::*;
    use crate::services::personality_detector::*;
    use std::sync::{Arc, Mutex};

    fn create_test_db() -> Arc<Mutex<Database>> {
        let db = Arc::new(Mutex::new(Database::new().unwrap()));
        {
            let db_lock = db.lock().unwrap();
            db_lock.create_default_persona().unwrap();
        }
        db
    }

    // ========== Configuration Tests ==========

    #[test]
    fn test_default_config() {
        let config = AdjustmentConfig::default();

        assert_eq!(config.strategy, AdjustmentStrategy::Moderate);
        assert_eq!(config.min_confidence, 0.5);
        assert_eq!(config.min_sample_size, 20);
        assert_eq!(config.auto_apply, false);
        assert_eq!(config.learning_rate, 0.3);
    }

    #[test]
    fn test_custom_config() {
        let config = AdjustmentConfig {
            strategy: AdjustmentStrategy::Aggressive,
            min_confidence: 0.7,
            min_sample_size: 50,
            auto_apply: true,
            learning_rate: 0.5,
        };

        assert_eq!(config.strategy, AdjustmentStrategy::Aggressive);
        assert_eq!(config.min_confidence, 0.7);
        assert_eq!(config.min_sample_size, 50);
        assert_eq!(config.auto_apply, true);
        assert_eq!(config.learning_rate, 0.5);
    }

    // ========== Parameter Blending Tests ==========

    #[test]
    fn test_blend_conservative() {
        let db = create_test_db();
        let config = AdjustmentConfig {
            strategy: AdjustmentStrategy::Conservative,
            learning_rate: 1.0,  // Full learning rate
            ..Default::default()
        };

        let adjuster = PersonaAdjusterService::new(db, config).unwrap();

        let old = PersonaParameters {
            formality: 50, verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let new = PersonaParameters {
            formality: 100,  // Wants +50
            verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let blended = adjuster.blend_parameters(&old, &new, 1.0);

        // Conservative max is 20%, so max change is 20 points
        assert_eq!(blended.formality, 70, "Conservative should limit to +20");
    }

    #[test]
    fn test_blend_moderate() {
        let db = create_test_db();
        let config = AdjustmentConfig {
            strategy: AdjustmentStrategy::Moderate,
            learning_rate: 1.0,
            ..Default::default()
        };

        let adjuster = PersonaAdjusterService::new(db, config).unwrap();

        let old = PersonaParameters {
            formality: 50, verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let new = PersonaParameters {
            formality: 100,  // Wants +50
            verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let blended = adjuster.blend_parameters(&old, &new, 1.0);

        // Moderate max is 40%, so max change is 40 points
        assert_eq!(blended.formality, 90, "Moderate should limit to +40");
    }

    #[test]
    fn test_blend_aggressive() {
        let db = create_test_db();
        let config = AdjustmentConfig {
            strategy: AdjustmentStrategy::Aggressive,
            learning_rate: 1.0,
            ..Default::default()
        };

        let adjuster = PersonaAdjusterService::new(db, config).unwrap();

        let old = PersonaParameters {
            formality: 50, verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let new = PersonaParameters {
            formality: 100,  // Wants +50
            verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let blended = adjuster.blend_parameters(&old, &new, 1.0);

        // Aggressive max is 60%, but we want +50 which is less
        assert_eq!(blended.formality, 100, "Aggressive should allow +50");
    }

    #[test]
    fn test_blend_learning_rate() {
        let db = create_test_db();
        let config = AdjustmentConfig {
            strategy: AdjustmentStrategy::Aggressive,
            learning_rate: 0.5,  // 50% learning rate
            ..Default::default()
        };

        let adjuster = PersonaAdjusterService::new(db, config).unwrap();

        let old = PersonaParameters {
            formality: 50, verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let new = PersonaParameters {
            formality: 90,  // Wants +40
            verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let blended = adjuster.blend_parameters(&old, &new, 0.5);

        // Learning rate 0.5 means: (90-50) * 0.5 = 20
        // Result: 50 + 20 = 70
        assert_eq!(blended.formality, 70, "Learning rate 0.5 should give +20");
    }

    #[test]
    fn test_blend_clamping_to_100() {
        let db = create_test_db();
        let config = AdjustmentConfig {
            strategy: AdjustmentStrategy::Aggressive,
            learning_rate: 1.0,
            ..Default::default()
        };

        let adjuster = PersonaAdjusterService::new(db, config).unwrap();

        let old = PersonaParameters {
            formality: 90, verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let new = PersonaParameters {
            formality: 150,  // Invalid, but should clamp
            verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let blended = adjuster.blend_parameters(&old, &new, 1.0);

        assert_eq!(blended.formality, 100, "Should clamp to max 100");
    }

    #[test]
    fn test_blend_clamping_to_0() {
        let db = create_test_db();
        let config = AdjustmentConfig {
            strategy: AdjustmentStrategy::Aggressive,
            learning_rate: 1.0,
            ..Default::default()
        };

        let adjuster = PersonaAdjusterService::new(db, config).unwrap();

        let old = PersonaParameters {
            formality: 10, verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let new = PersonaParameters {
            formality: 0,  // Wants to go to 0
            verbosity: 50, humor: 30, emoji_usage: 20,
            empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
            code_examples: 70, questioning: 40,
        };

        let blended = adjuster.blend_parameters(&old, &new, 1.0);

        assert_eq!(blended.formality, 0, "Should clamp to min 0");
    }

    // ========== Adjustment Application Tests ==========

    #[test]
    fn test_apply_adjustment() {
        let db = create_test_db();
        let adjuster = PersonaAdjusterService::new_with_defaults(Arc::clone(&db)).unwrap();

        let new_params = PersonaParameters {
            formality: 80, verbosity: 60, humor: 50, emoji_usage: 40,
            empathy: 70, creativity: 65, proactiveness: 55, technical_depth: 75,
            code_examples: 80, questioning: 60,
        };

        adjuster.apply_adjustment(&new_params).unwrap();

        // Verify it was saved
        let loaded = {
            let db_lock = db.lock().unwrap();
            db_lock.load_persona().unwrap()
        };

        assert_eq!(loaded.formality, 80);
        assert_eq!(loaded.technical_depth, 75);
    }

    #[test]
    fn test_adjustment_history() {
        let db = create_test_db();
        let adjuster = PersonaAdjusterService::new_with_defaults(Arc::clone(&db)).unwrap();

        // Make several adjustments
        for i in 0..3 {
            let params = PersonaParameters {
                formality: 50 + (i * 10), verbosity: 50, humor: 30, emoji_usage: 20,
                empathy: 60, creativity: 50, proactiveness: 40, technical_depth: 50,
                code_examples: 70, questioning: 40,
            };
            adjuster.apply_adjustment(&params).unwrap();
        }

        // Verify changes were recorded in persona_changes table
        let db_lock = db.lock().unwrap();
        let change_count: i64 = db_lock.conn().query_row(
            "SELECT COUNT(*) FROM persona_changes WHERE reason = 'optimization'",
            [],
            |row| row.get(0),
        ).unwrap();

        assert!(change_count >= 3, "Should have recorded {} changes, got {}", 3, change_count);
    }

    #[test]
    fn test_adjustment_stats() {
        let db = create_test_db();
        let adjuster = PersonaAdjusterService::new_with_defaults(Arc::clone(&db)).unwrap();

        let stats = adjuster.get_adjustment_stats().unwrap();
        assert!(stats.total_adjustments >= 0);
        assert!(stats.average_satisfaction >= 0.0 && stats.average_satisfaction <= 1.0);
    }
}

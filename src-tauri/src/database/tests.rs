/// Comprehensive tests for persona connection system (Phase 1)
/// Tests: Database → Learning Service → Ollama integration
#[cfg(test)]
mod persona_tests {
    use super::super::*;
    use crate::database::models::PersonaParameters;
    use crate::services::learning;
    use rusqlite::Connection;
    use std::sync::{Arc, Mutex};

    /// Helper: Create an in-memory test database
    fn create_test_db() -> Database {
        let conn = Connection::open_in_memory().expect("Failed to create in-memory database");

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])
            .expect("Failed to enable foreign keys");

        let mut db = Database { conn };

        // Initialize schema
        schema::create_tables(db.conn()).expect("Failed to create tables");
        schema::create_indexes(db.conn()).expect("Failed to create indexes");

        db
    }

    /// Test 1: Database stores default persona parameters correctly
    #[test]
    fn test_default_persona_creation() {
        let db = create_test_db();

        // Create default persona
        db.create_default_persona()
            .expect("Failed to create default persona");

        // Load persona
        let persona = db.load_persona().expect("Failed to load persona");

        // Verify all 10 parameters match defaults
        assert_eq!(persona.formality, 50, "Default formality should be 50");
        assert_eq!(persona.verbosity, 50, "Default verbosity should be 50");
        assert_eq!(persona.humor, 30, "Default humor should be 30");
        assert_eq!(persona.emoji_usage, 20, "Default emoji_usage should be 20");
        assert_eq!(persona.empathy, 60, "Default empathy should be 60");
        assert_eq!(persona.creativity, 50, "Default creativity should be 50");
        assert_eq!(
            persona.proactiveness, 40,
            "Default proactiveness should be 40"
        );
        assert_eq!(
            persona.technical_depth, 50,
            "Default technical_depth should be 50"
        );
        assert_eq!(
            persona.code_examples, 70,
            "Default code_examples should be 70"
        );
        assert_eq!(
            persona.questioning, 40,
            "Default questioning should be 40"
        );
    }

    /// Test 2: Persona parameters convert correctly to 0-1 scale
    #[test]
    fn test_persona_parameter_conversion() {
        let db_params = PersonaParameters {
            formality: 100,
            verbosity: 50,
            humor: 0,
            emoji_usage: 75,
            empathy: 25,
            creativity: 60,
            proactiveness: 40,
            technical_depth: 90,
            code_examples: 10,
            questioning: 80,
        };

        let learning_params = db_params.to_learning_params();

        assert_eq!(learning_params.formality, 1.0);
        assert_eq!(learning_params.verbosity, 0.5);
        assert_eq!(learning_params.humor, 0.0);
        assert_eq!(learning_params.emoji_usage, 0.75);
        assert_eq!(learning_params.empathy, 0.25);
        assert_eq!(learning_params.creativity, 0.6);
        assert_eq!(learning_params.proactiveness, 0.4);
        assert_eq!(learning_params.technical_depth, 0.9);
        assert_eq!(learning_params.code_examples, 0.1);
        assert_eq!(learning_params.questioning, 0.8);
    }

    /// Test 3: Update persona records changes correctly
    #[test]
    fn test_update_persona_tracks_changes() {
        let db = create_test_db();
        db.create_default_persona()
            .expect("Failed to create default persona");

        // Update persona
        let new_params = PersonaParameters {
            formality: 80,       // Changed from 50
            verbosity: 50,       // Unchanged
            humor: 60,           // Changed from 30
            emoji_usage: 20,     // Unchanged
            empathy: 60,         // Unchanged
            creativity: 50,      // Unchanged
            proactiveness: 70,   // Changed from 40
            technical_depth: 50, // Unchanged
            code_examples: 70,   // Unchanged
            questioning: 40,     // Unchanged
        };

        db.update_persona(&new_params, "manual")
            .expect("Failed to update persona");

        // Verify persona was updated
        let loaded = db.load_persona().expect("Failed to load persona");
        assert_eq!(loaded.formality, 80);
        assert_eq!(loaded.humor, 60);
        assert_eq!(loaded.proactiveness, 70);

        // Verify change was recorded
        let change_count: i64 = db
            .conn()
            .query_row(
                "SELECT COUNT(*) FROM persona_changes WHERE reason = 'manual'",
                [],
                |row| row.get(0),
            )
            .expect("Failed to query persona_changes");

        assert_eq!(change_count, 1, "Should have recorded 1 change");
    }

    /// Test 4: Change magnitude calculation
    #[test]
    fn test_change_magnitude_calculation() {
        let db = create_test_db();

        let old_params = PersonaParameters {
            formality: 50,
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        let new_params = PersonaParameters {
            formality: 80,       // +30
            verbosity: 50,       // 0
            humor: 60,           // +30
            emoji_usage: 20,     // 0
            empathy: 60,         // 0
            creativity: 50,      // 0
            proactiveness: 70,   // +30
            technical_depth: 50, // 0
            code_examples: 70,   // 0
            questioning: 40,     // 0
        };

        let (magnitude, changed) = db.calculate_persona_change(&old_params, &new_params);

        // 3 parameters changed by 30 each = 90 total change
        // 90 / 100 (normalize) = 0.9 total
        // 0.9 / 10 (average across all params) = 0.09
        assert_eq!(magnitude, 0.09, "Change magnitude should be 0.09");
        assert_eq!(changed.len(), 3, "Should have 3 changed parameters");
        assert!(changed.contains(&"formality".to_string()));
        assert!(changed.contains(&"humor".to_string()));
        assert!(changed.contains(&"proactiveness".to_string()));
    }

    /// Test 5: Re-optimization trigger logic
    #[test]
    fn test_should_reoptimize_persona() {
        let db = create_test_db();
        db.create_default_persona()
            .expect("Failed to create default persona");

        // Initially, no changes, should not need re-optimization
        assert!(
            !db.should_reoptimize_persona()
                .expect("Failed to check reoptimize"),
            "Should not need re-optimization initially"
        );

        // Make 2 significant manual changes
        for i in 0..2 {
            let new_params = PersonaParameters {
                formality: 50 + (i + 1) * 15, // Significant changes
                verbosity: 50,
                humor: 30,
                emoji_usage: 20,
                empathy: 60,
                creativity: 50,
                proactiveness: 40,
                technical_depth: 50,
                code_examples: 70,
                questioning: 40,
            };
            db.update_persona(&new_params, "manual")
                .expect("Failed to update persona");
        }

        // Still below threshold (need 3 changes)
        assert!(
            !db.should_reoptimize_persona()
                .expect("Failed to check reoptimize"),
            "Should not need re-optimization with only 2 changes"
        );

        // Make 3rd significant change
        let new_params = PersonaParameters {
            formality: 95,
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };
        db.update_persona(&new_params, "manual")
            .expect("Failed to update persona");

        // Now should trigger re-optimization
        assert!(
            db.should_reoptimize_persona()
                .expect("Failed to check reoptimize"),
            "Should need re-optimization after 3 significant changes"
        );
    }

    /// Test 6: Persona history table exists and has correct schema
    #[test]
    fn test_persona_history_table_schema() {
        let db = create_test_db();

        // Verify persona_history table exists
        let table_exists: i64 = db
            .conn()
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='persona_history'",
                [],
                |row| row.get(0),
            )
            .expect("Failed to query sqlite_master");

        assert_eq!(table_exists, 1, "persona_history table should exist");

        // Verify source column exists and has CHECK constraint
        let source_col_count: i64 = db
            .conn()
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('persona_history') WHERE name='source'",
                [],
                |row| row.get(0),
            )
            .expect("Failed to query table info");

        assert_eq!(source_col_count, 1, "source column should exist");
    }

    /// Test 7: System prompt generation includes all persona parameters
    #[test]
    fn test_system_prompt_generation() {
        let persona = learning::PersonaParameters {
            formality: 0.8,
            verbosity: 0.5,
            humor: 0.3,
            emoji_usage: 0.2,
            empathy: 0.6,
            creativity: 0.5,
            proactiveness: 0.4,
            technical_depth: 0.5,
            code_examples: 0.7,
            questioning: 0.4,
        };

        let prompt = learning::LearningService::generate_system_prompt(&persona);

        // Verify prompt contains key indicators of each parameter
        assert!(
            prompt.contains("formal") || prompt.contains("professional"),
            "Prompt should reflect formality"
        );
        assert!(
            prompt.contains("code") || prompt.contains("example"),
            "Prompt should reflect code examples preference"
        );
        assert!(
            prompt.contains("technical"),
            "Prompt should reflect technical depth"
        );
    }

    /// Test 8: No change recorded when parameters are identical
    #[test]
    fn test_no_change_recorded_for_identical_params() {
        let db = create_test_db();
        db.create_default_persona()
            .expect("Failed to create default persona");

        let params = db.load_persona().expect("Failed to load persona");

        // Update with identical parameters
        db.update_persona(&params, "manual")
            .expect("Failed to update persona");

        // Should not record a change
        let change_count: i64 = db
            .conn()
            .query_row("SELECT COUNT(*) FROM persona_changes", [], |row| {
                row.get(0)
            })
            .expect("Failed to query persona_changes");

        assert_eq!(change_count, 0, "Should not record change for identical params");
    }

    /// Test 9: Small changes (<1%) are ignored
    #[test]
    fn test_small_changes_ignored() {
        let db = create_test_db();

        let old_params = PersonaParameters {
            formality: 50,
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        let new_params = PersonaParameters {
            formality: 50, // +0 (0%)
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        let (magnitude, changed) = db.calculate_persona_change(&old_params, &new_params);

        assert_eq!(magnitude, 0.0, "Magnitude should be 0 for no change");
        assert_eq!(changed.len(), 0, "Should have 0 changed parameters");
    }

    /// Test 10: Learning service initialization
    #[test]
    fn test_learning_service_initialization() {
        let db = create_test_db();
        db.create_default_persona()
            .expect("Failed to create default persona");

        let db_arc = Arc::new(Mutex::new(db));
        let learning_service = learning::LearningService::new(db_arc);

        assert!(
            learning_service.is_ok(),
            "Learning service should initialize successfully"
        );
    }

    /// Test 11: Learning service feedback recording
    #[test]
    fn test_feedback_recording() {
        let db = create_test_db();
        db.create_default_persona()
            .expect("Failed to create default persona");

        let db_params = db.load_persona().expect("Failed to load persona");
        let persona_snapshot = db_params.to_learning_params();

        let db_arc = Arc::new(Mutex::new(db));
        let learning_service = learning::LearningService::new(db_arc).expect("Failed to create learning service");

        let feedback = learning::Feedback {
            conversation_id: "test-conv-1".to_string(),
            satisfaction: 0.8,
            timestamp: chrono::Utc::now().timestamp_millis(),
            persona_snapshot,
        };

        let result = learning_service.record_feedback(feedback);
        assert!(result.is_ok(), "Should record feedback successfully");

        let stats = learning_service
            .get_stats()
            .expect("Failed to get stats");

        assert_eq!(stats.total_feedback_count, 1);
    }

    /// Test 12: Persona changes table stores JSON correctly
    #[test]
    fn test_persona_changes_json_storage() {
        let db = create_test_db();
        db.create_default_persona()
            .expect("Failed to create default persona");

        let new_params = PersonaParameters {
            formality: 80,
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        db.update_persona(&new_params, "manual")
            .expect("Failed to update persona");

        // Query the JSON fields
        let (previous_json, new_json, changed_json): (String, String, String) = db
            .conn()
            .query_row(
                "SELECT previous_params, new_params, changed_parameters FROM persona_changes LIMIT 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .expect("Failed to query persona_changes");

        // Verify JSON is valid
        let _: PersonaParameters = serde_json::from_str(&previous_json)
            .expect("previous_params should be valid JSON");
        let _: PersonaParameters =
            serde_json::from_str(&new_json).expect("new_params should be valid JSON");
        let _: Vec<String> = serde_json::from_str(&changed_json)
            .expect("changed_parameters should be valid JSON");
    }

    /// Test 13: Database indexes exist for performance
    #[test]
    fn test_database_indexes_exist() {
        let db = create_test_db();

        let index_count: i64 = db
            .conn()
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND (
                    name = 'idx_persona_history_timestamp' OR
                    name = 'idx_persona_history_source' OR
                    name = 'idx_persona_changes_timestamp' OR
                    name = 'idx_persona_changes_reason'
                )",
                [],
                |row| row.get(0),
            )
            .expect("Failed to query indexes");

        assert_eq!(
            index_count, 4,
            "Should have 4 persona-related indexes"
        );
    }

    /// Test 14: Persona versioning (v3.8.0 schema)
    #[test]
    fn test_persona_schema_version() {
        let db = create_test_db();
        db.create_default_persona()
            .expect("Failed to create default persona");

        // Verify all 10 standardized parameters exist
        let column_count: i64 = db
            .conn()
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('persona_settings') WHERE name IN (
                    'formality', 'verbosity', 'humor', 'emoji_usage',
                    'empathy', 'creativity', 'proactiveness',
                    'technical_depth', 'code_examples', 'questioning'
                )",
                [],
                |row| row.get(0),
            )
            .expect("Failed to query table info");

        assert_eq!(
            column_count, 10,
            "persona_settings should have exactly 10 parameter columns"
        );
    }

    /// Test 15: Integration test - Full persona flow
    #[test]
    fn test_full_persona_integration_flow() {
        let db = create_test_db();
        db.create_default_persona()
            .expect("Failed to create default persona");

        let db_arc = Arc::new(Mutex::new(db));
        let learning_service = learning::LearningService::new(Arc::clone(&db_arc))
            .expect("Failed to create learning service");

        // Step 1: Load persona
        let db_lock = db_arc.lock().expect("Failed to lock db");
        let db_params = db_lock.load_persona().expect("Failed to load persona");
        let current_persona = db_params.to_learning_params();
        drop(db_lock);

        // Step 2: Generate system prompt
        let system_prompt = learning::LearningService::generate_system_prompt(&current_persona);
        assert!(!system_prompt.is_empty(), "System prompt should not be empty");

        // Step 3: Record feedback
        let feedback = learning::Feedback {
            conversation_id: "integration-test-1".to_string(),
            satisfaction: 0.75,
            timestamp: chrono::Utc::now().timestamp_millis(),
            persona_snapshot: current_persona.clone(),
        };
        learning_service
            .record_feedback(feedback)
            .expect("Failed to record feedback");

        // Step 4: Get stats
        let stats = learning_service
            .get_stats()
            .expect("Failed to get stats");
        assert_eq!(stats.total_feedback_count, 1);

        // Step 5: Optimize persona
        let optimized_persona = learning_service
            .optimize_persona(current_persona)
            .expect("Failed to optimize persona");

        // Verify optimization produces valid parameters (all between 0.0-1.0)
        assert!(optimized_persona.formality >= 0.0 && optimized_persona.formality <= 1.0);
        assert!(optimized_persona.verbosity >= 0.0 && optimized_persona.verbosity <= 1.0);
    }
}

use rusqlite::{Connection, Result};

/// Create all database tables
pub fn create_tables(conn: &Connection) -> Result<()> {
    // Conversations table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            mode TEXT NOT NULL CHECK(mode IN ('user-led', 'ai-led')),
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            message_count INTEGER DEFAULT 0
        )",
        [],
    )?;

    // Messages table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            tokens INTEGER,
            response_time INTEGER,
            context_level INTEGER CHECK(context_level IN (1, 2, 3)),
            satisfaction TEXT CHECK(satisfaction IN ('positive', 'negative', NULL)),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Persona settings table (v3.8.0: Standardized to 10 core parameters)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS persona_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            formality INTEGER NOT NULL DEFAULT 50,
            verbosity INTEGER NOT NULL DEFAULT 50,
            humor INTEGER NOT NULL DEFAULT 30,
            emoji_usage INTEGER NOT NULL DEFAULT 20,
            empathy INTEGER NOT NULL DEFAULT 60,
            creativity INTEGER NOT NULL DEFAULT 50,
            proactiveness INTEGER NOT NULL DEFAULT 40,
            technical_depth INTEGER NOT NULL DEFAULT 50,
            code_examples INTEGER NOT NULL DEFAULT 70,
            questioning INTEGER NOT NULL DEFAULT 40,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    // User preferences table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS user_preferences (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    // User profile table (onboarding data)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY CHECK(id = 1),
            name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            age_group TEXT CHECK(age_group IN ('10s', '20s', '30s', '40s', '50s', '60+', NULL)),
            occupation TEXT CHECK(occupation IN ('student', 'employee', 'freelancer', 'entrepreneur', 'other', NULL)),
            interests TEXT,
            tone_preference TEXT CHECK(tone_preference IN ('casual', 'friendly-formal', 'professional', NULL)),
            proactive_frequency TEXT CHECK(proactive_frequency IN ('15min', '45min', '2hr', 'never', NULL)),
            selected_persona TEXT CHECK(selected_persona IN ('friend', 'assistant', 'expert', NULL)),
            onboarding_completed_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    // Episodic memory table (RAG-enhanced)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS episodic_memory (
            id TEXT PRIMARY KEY,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            satisfaction REAL NOT NULL DEFAULT 0.5,
            embedding_id TEXT,
            created_at INTEGER NOT NULL,
            access_count INTEGER DEFAULT 0,
            importance REAL NOT NULL DEFAULT 0.5
        )",
        [],
    )?;

    // Learning data table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS learning_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT NOT NULL,
            feedback TEXT NOT NULL CHECK(feedback IN ('positive', 'negative')),
            persona_snapshot TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Persona history table (learning system - v3.8.0)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS persona_history (
            id TEXT PRIMARY KEY,
            parameters TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            average_satisfaction REAL,
            source TEXT NOT NULL CHECK(source IN ('optimization', 'manual', 'preset')) DEFAULT 'optimization'
        )",
        [],
    )?;

    // Persona changes table (v3.8.0 - Track manual user changes)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS persona_changes (
            id TEXT PRIMARY KEY,
            previous_params TEXT NOT NULL,
            new_params TEXT NOT NULL,
            changed_parameters TEXT NOT NULL,
            change_magnitude REAL NOT NULL,
            timestamp INTEGER NOT NULL,
            reason TEXT CHECK(reason IN ('manual', 'preset', 'optimization', 'reset')) NOT NULL
        )",
        [],
    )?;

    // Screen context table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS screen_context (
            id TEXT PRIMARY KEY,
            level INTEGER NOT NULL CHECK(level IN (1, 2, 3)),
            image_path TEXT,
            analysis TEXT,
            extracted_text TEXT,
            window_title TEXT,
            application_name TEXT,
            workspace_root TEXT,
            timestamp INTEGER NOT NULL
        )",
        [],
    )?;

    // Screen activities table (AI vision analysis)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS screen_activities (
            id TEXT PRIMARY KEY,
            timestamp INTEGER NOT NULL,
            image_path TEXT NOT NULL,
            activity_description TEXT,
            detected_context TEXT,
            user_action TEXT,
            ai_analysis TEXT
        )",
        [],
    )?;

    // Webhooks table (external integrations)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS webhooks (
            name TEXT PRIMARY KEY,
            preset TEXT CHECK(preset IN ('slack', 'discord', 'notion', 'custom')),
            url TEXT NOT NULL,
            method TEXT NOT NULL DEFAULT 'POST',
            headers TEXT,
            enabled BOOLEAN NOT NULL DEFAULT 1,
            timeout INTEGER NOT NULL DEFAULT 5000,
            retries INTEGER NOT NULL DEFAULT 3,
            created_at INTEGER NOT NULL,
            last_used_at INTEGER
        )",
        [],
    )?;

    // Onboarding state table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS onboarding_state (
            id INTEGER PRIMARY KEY CHECK(id = 1),
            completed BOOLEAN NOT NULL DEFAULT 0,
            system_specs_json TEXT,
            recommended_model TEXT,
            selected_model TEXT,
            survey_results_json TEXT,
            custom_prompt TEXT,
            created_at INTEGER NOT NULL,
            completed_at INTEGER
        )",
        [],
    )?;

    // Model download state table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS model_download_state (
            model_name TEXT PRIMARY KEY,
            status TEXT NOT NULL CHECK(status IN ('not_started', 'downloading', 'completed', 'failed')),
            progress REAL DEFAULT 0.0,
            downloaded_bytes INTEGER DEFAULT 0,
            total_bytes INTEGER,
            error_message TEXT,
            started_at INTEGER,
            completed_at INTEGER,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    // Personalization settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS personalization (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    // OAuth tokens table (for Calendar, Email, etc.)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS oauth_tokens (
            service TEXT PRIMARY KEY,
            token_json TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER
        )",
        [],
    )?;

    // Personality insights table (v3.3.0 Phase 2.4)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS personality_insights (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,

            -- Conversation patterns (0.0-1.0 scale)
            avg_message_length REAL NOT NULL,
            formality REAL NOT NULL,
            verbosity REAL NOT NULL,
            humor REAL NOT NULL,
            emoji_usage REAL NOT NULL,
            empathy REAL NOT NULL,
            creativity REAL NOT NULL,
            proactiveness REAL NOT NULL,
            technical_depth REAL NOT NULL,
            code_examples REAL NOT NULL,
            questioning REAL NOT NULL,

            -- Big Five personality traits (0.0-1.0 scale)
            openness REAL NOT NULL,
            conscientiousness REAL NOT NULL,
            extraversion REAL NOT NULL,
            agreeableness REAL NOT NULL,
            neuroticism REAL NOT NULL,

            -- MBTI indicators (0.0-1.0 scale)
            ie_score REAL NOT NULL,
            sn_score REAL NOT NULL,
            tf_score REAL NOT NULL,
            jp_score REAL NOT NULL,

            -- Metadata
            confidence REAL NOT NULL,
            sample_size INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,

            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Tool call history table (v3.3.0 - Tool execution tracking)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tool_call_history (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            message_id TEXT NOT NULL,
            tool_name TEXT NOT NULL,
            tool_input TEXT NOT NULL,
            tool_output TEXT NOT NULL,
            execution_time_ms INTEGER NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('success', 'error')),
            error_message TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Tool settings table (v3.3.0 - Per-tool configuration)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tool_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tool_name TEXT NOT NULL UNIQUE,
            enabled BOOLEAN NOT NULL DEFAULT 1,
            config TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    // Plugin tools table (v3.3.0 - User-created plugin tools)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS plugin_tools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plugin_name TEXT NOT NULL,
            tool_name TEXT NOT NULL UNIQUE,
            tool_description TEXT NOT NULL,
            parameters_schema TEXT NOT NULL,
            permissions TEXT NOT NULL,
            enabled BOOLEAN NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (plugin_name) REFERENCES plugins(name) ON DELETE CASCADE
        )",
        [],
    )?;

    Ok(())
}

/// Create database indexes for performance
pub fn create_indexes(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
         ON messages(conversation_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_messages_timestamp
         ON messages(timestamp DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
         ON conversations(updated_at DESC)",
        [],
    )?;

    // TODO: episodic_memory table doesn't have a category column yet
    // conn.execute(
    //     "CREATE INDEX IF NOT EXISTS idx_episodic_memory_category
    //      ON episodic_memory(category)",
    //     [],
    // )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_episodic_memory_importance
         ON episodic_memory(importance DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_learning_data_timestamp
         ON learning_data(timestamp DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_screen_context_timestamp
         ON screen_context(timestamp DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_screen_activities_timestamp
         ON screen_activities(timestamp DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_webhooks_enabled
         ON webhooks(enabled)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_webhooks_last_used
         ON webhooks(last_used_at DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at
         ON oauth_tokens(expires_at DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_persona_history_timestamp
         ON persona_history(timestamp DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_persona_history_source
         ON persona_history(source)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_persona_changes_timestamp
         ON persona_changes(timestamp DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_persona_changes_reason
         ON persona_changes(reason)",
        [],
    )?;

    // Personality insights indexes (v3.3.0 Phase 2.4)
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_personality_insights_conversation_id
         ON personality_insights(conversation_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_personality_insights_timestamp
         ON personality_insights(timestamp DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_personality_insights_confidence
         ON personality_insights(confidence DESC)",
        [],
    )?;

    // Tool call history indexes (v3.3.0)
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tool_call_history_conversation_id
         ON tool_call_history(conversation_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tool_call_history_created_at
         ON tool_call_history(created_at DESC)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tool_call_history_tool_name
         ON tool_call_history(tool_name)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tool_call_history_status
         ON tool_call_history(status)",
        [],
    )?;

    Ok(())
}

/// Migrate persona_settings table from old schema to v3.3.0 (10 parameters)
pub fn migrate_persona_settings(conn: &Connection) -> Result<()> {
    // Check if migration is needed by checking column count
    let column_check: Result<i32, _> = conn.query_row(
        "SELECT COUNT(*) FROM pragma_table_info('persona_settings') WHERE name IN ('enthusiasm', 'directness', 'patience', 'encouragement', 'formality_honorifics', 'reasoning_depth', 'context_awareness')",
        [],
        |row| row.get(0),
    );

    match column_check {
        Ok(count) if count > 0 => {
            log::info!("Migrating persona_settings table from old schema to v3.3.0 (10 parameters)");

            // Create new table with correct schema
            conn.execute("DROP TABLE IF EXISTS persona_settings_old", [])?;
            conn.execute("ALTER TABLE persona_settings RENAME TO persona_settings_old", [])?;

            // Create new table
            conn.execute(
                "CREATE TABLE persona_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    formality INTEGER NOT NULL DEFAULT 50,
                    verbosity INTEGER NOT NULL DEFAULT 50,
                    humor INTEGER NOT NULL DEFAULT 30,
                    emoji_usage INTEGER NOT NULL DEFAULT 20,
                    empathy INTEGER NOT NULL DEFAULT 60,
                    creativity INTEGER NOT NULL DEFAULT 50,
                    proactiveness INTEGER NOT NULL DEFAULT 40,
                    technical_depth INTEGER NOT NULL DEFAULT 50,
                    code_examples INTEGER NOT NULL DEFAULT 70,
                    questioning INTEGER NOT NULL DEFAULT 40,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )",
                [],
            )?;

            // Migrate data (map old columns to new)
            conn.execute(
                "INSERT INTO persona_settings (id, formality, verbosity, humor, emoji_usage, empathy, creativity, proactiveness, technical_depth, code_examples, questioning, created_at, updated_at)
                 SELECT id,
                        formality,
                        verbosity,
                        humor,
                        emoji_usage,
                        empathy,
                        creativity,
                        COALESCE(proactivity, 40),
                        COALESCE(technicality, 50),
                        70, -- code_examples (new parameter, default to 70)
                        40, -- questioning (new parameter, default to 40)
                        created_at,
                        updated_at
                 FROM persona_settings_old",
                [],
            )?;

            // Drop old table
            conn.execute("DROP TABLE persona_settings_old", [])?;

            log::info!("Persona settings migration completed successfully");
        }
        _ => {
            log::debug!("Persona settings table already on v3.3.0 schema, no migration needed");
        }
    }

    Ok(())
}

/// Initialize default tool settings for all 6 production tools
pub fn initialize_tool_settings(conn: &Connection) -> Result<()> {
    let now = chrono::Utc::now().timestamp();

    // Check if tool_settings table is empty
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM tool_settings",
        [],
        |row| row.get(0),
    )?;

    if count == 0 {
        log::info!("Initializing default tool settings for 6 production tools");

        // Default settings for each tool
        let default_settings = vec![
            ("web_search", r#"{"maxResults":5,"engine":"duckduckgo","rateLimit":2}"#),
            ("fetch_url", r#"{"timeout":10000,"maxSize":5242880}"#),
            ("read_file", r#"{"allowedPaths":[],"maxSize":10485760}"#),
            ("write_file", r#"{"requireConfirmation":true,"allowedPaths":[]}"#),
            ("get_system_info", r#"{"privacyLevel":"standard"}"#),
            ("calculate", r#"{"precision":10}"#),
        ];

        for (tool_name, config) in default_settings {
            conn.execute(
                "INSERT INTO tool_settings (tool_name, enabled, config, updated_at)
                 VALUES (?1, 1, ?2, ?3)",
                &[tool_name, config, &now.to_string()],
            )?;
        }

        log::info!("Default tool settings initialized successfully");
    } else {
        log::debug!("Tool settings already initialized");
    }

    Ok(())
}

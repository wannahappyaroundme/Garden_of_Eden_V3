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

    // Persona settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS persona_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            formality INTEGER NOT NULL DEFAULT 50,
            humor INTEGER NOT NULL DEFAULT 40,
            verbosity INTEGER NOT NULL DEFAULT 50,
            emoji_usage INTEGER NOT NULL DEFAULT 30,
            enthusiasm INTEGER NOT NULL DEFAULT 60,
            empathy INTEGER NOT NULL DEFAULT 70,
            directness INTEGER NOT NULL DEFAULT 60,
            technicality INTEGER NOT NULL DEFAULT 50,
            creativity INTEGER NOT NULL DEFAULT 50,
            proactivity INTEGER NOT NULL DEFAULT 40,
            language_preference TEXT NOT NULL DEFAULT 'auto',
            code_language_preference TEXT NOT NULL DEFAULT '[\"typescript\",\"javascript\",\"python\"]',
            patience INTEGER NOT NULL DEFAULT 80,
            encouragement INTEGER NOT NULL DEFAULT 70,
            formality_honorifics INTEGER NOT NULL DEFAULT 1,
            reasoning_depth INTEGER NOT NULL DEFAULT 60,
            context_awareness INTEGER NOT NULL DEFAULT 70,
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

    // Episodic memory table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS episodic_memory (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            importance REAL NOT NULL DEFAULT 0.5,
            embedding_id TEXT,
            created_at INTEGER NOT NULL,
            last_accessed INTEGER NOT NULL,
            access_count INTEGER DEFAULT 0
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

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_episodic_memory_category
         ON episodic_memory(category)",
        [],
    )?;

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

    Ok(())
}

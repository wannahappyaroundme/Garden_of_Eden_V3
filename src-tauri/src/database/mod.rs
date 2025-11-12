pub mod models;
pub mod schema;

use rusqlite::Connection;
use std::path::PathBuf;
use anyhow::{Context, Result as AnyhowResult};

pub struct Database {
    conn: Connection,
}

impl Database {
    /// Create a new database connection
    pub fn new() -> AnyhowResult<Self> {
        let db_path = Self::get_db_path()?;
        log::info!("Database path: {:?}", db_path);

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .context("Failed to create database directory")?;
        }

        let conn = Connection::open(&db_path)
            .context("Failed to open database connection")?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])
            .context("Failed to enable foreign keys")?;

        let mut db = Self { conn };
        db.initialize()?;

        Ok(db)
    }

    /// Get database file path
    fn get_db_path() -> AnyhowResult<PathBuf> {
        // Use dirs crate for cross-platform data directory
        let app_dir = dirs::data_dir()
            .context("Failed to get app data directory")?;

        Ok(app_dir.join("garden-of-eden-v3").join("data.db"))
    }

    /// Initialize database schema
    fn initialize(&mut self) -> AnyhowResult<()> {
        log::info!("Initializing database schema...");

        // Execute schema creation
        schema::create_tables(&self.conn)?;
        schema::create_indexes(&self.conn)?;

        // Insert default persona settings if none exist
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM persona_settings",
            [],
            |row| row.get(0),
        )?;

        if count == 0 {
            self.create_default_persona()?;
        }

        log::info!("Database initialized successfully");
        Ok(())
    }

    /// Create default persona settings
    fn create_default_persona(&self) -> AnyhowResult<()> {
        let now = chrono::Utc::now().timestamp_millis();

        self.conn.execute(
            "INSERT INTO persona_settings (
                formality, humor, verbosity, emoji_usage, enthusiasm,
                empathy, directness, technicality, creativity, proactivity,
                language_preference, code_language_preference,
                patience, encouragement, formality_honorifics,
                reasoning_depth, context_awareness,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            rusqlite::params![
                50, 40, 50, 30, 60,  // formality, humor, verbosity, emoji_usage, enthusiasm
                70, 60, 50, 50, 40,  // empathy, directness, technicality, creativity, proactivity
                "auto", "[\"typescript\",\"javascript\",\"python\"]",  // language_preference, code_language_preference
                80, 70, 1,  // patience, encouragement, formality_honorifics
                60, 70,  // reasoning_depth, context_awareness
                now, now,  // created_at, updated_at
            ],
        )?;

        Ok(())
    }

    /// Get database connection reference
    pub fn conn(&self) -> &Connection {
        &self.conn
    }
}

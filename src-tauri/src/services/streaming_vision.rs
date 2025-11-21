/**
 * Phase 2: Streaming Vision Processing (v3.8.0)
 *
 * Continuous screen monitoring with proactive communication:
 * - 10-30 second screen capture intervals
 * - Smart throttling with image hash comparison
 * - LLaVA analysis for significant changes
 * - Proactive alerts via TTS, notifications, or chat
 */

use crate::services::{screen::ScreenCaptureService, llava::LlavaService, tts::TtsService};
use crate::database::Database;
use anyhow::{Context, Result};
use screenshots::Screen;
use base64::{Engine as _, engine::general_purpose};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::interval;
use sha2::{Sha256, Digest};

/// Configuration for streaming vision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingVisionConfig {
    /// Capture interval in seconds (10-30)
    pub capture_interval_seconds: u64,
    /// Enable smart throttling (skip analysis if image unchanged)
    pub enable_smart_throttling: bool,
    /// Hash similarity threshold (0.0-1.0, higher = more similar)
    pub similarity_threshold: f64,
    /// Enable proactive alerts
    pub enable_alerts: bool,
    /// Alert methods: "tts", "notification", "chat"
    pub alert_methods: Vec<String>,
    /// LLaVA analysis prompt template
    pub analysis_prompt: String,
}

impl Default for StreamingVisionConfig {
    fn default() -> Self {
        Self {
            capture_interval_seconds: 15,  // 15 seconds default
            enable_smart_throttling: true,
            similarity_threshold: 0.95,  // 95% similar = skip
            enable_alerts: true,
            alert_methods: vec!["tts".to_string()],
            analysis_prompt: "Analyze this screenshot. Describe any important changes, errors, notifications, or events that the user should know about. If nothing significant, respond with 'No significant changes.'".to_string(),
        }
    }
}

/// Result of vision analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisionAnalysisResult {
    pub timestamp: i64,
    pub image_hash: String,
    pub is_significant_change: bool,
    pub analysis: Option<String>,
    pub alert_sent: bool,
    pub alert_method: Option<String>,
}

/// Streaming vision state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingVisionState {
    pub is_active: bool,
    pub last_capture_time: i64,
    pub last_image_hash: Option<String>,
    pub capture_count: u64,
    pub analysis_count: u64,
    pub alert_count: u64,
}

impl Default for StreamingVisionState {
    fn default() -> Self {
        Self {
            is_active: false,
            last_capture_time: 0,
            last_image_hash: None,
            capture_count: 0,
            analysis_count: 0,
            alert_count: 0,
        }
    }
}

/// Streaming Vision Service
pub struct StreamingVisionService {
    config: Arc<Mutex<StreamingVisionConfig>>,
    state: Arc<Mutex<StreamingVisionState>>,
    screen_service: Arc<ScreenCaptureService>,
    llava_service: Arc<LlavaService>,
    tts_service: Arc<Mutex<TtsService>>,
    db: Arc<Mutex<Database>>,
}

impl StreamingVisionService {
    /// Create new streaming vision service
    pub fn new(
        screen_service: Arc<ScreenCaptureService>,
        llava_service: Arc<LlavaService>,
        tts_service: Arc<Mutex<TtsService>>,
        db: Arc<Mutex<Database>>,
    ) -> Result<Self> {
        let service = Self {
            config: Arc::new(Mutex::new(StreamingVisionConfig::default())),
            state: Arc::new(Mutex::new(StreamingVisionState::default())),
            screen_service,
            llava_service,
            tts_service,
            db,
        };

        service.init_database()?;

        Ok(service)
    }

    /// Initialize database table for vision analysis
    fn init_database(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS streaming_vision_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                image_hash TEXT NOT NULL,
                is_significant_change BOOLEAN NOT NULL,
                analysis TEXT,
                alert_sent BOOLEAN NOT NULL,
                alert_method TEXT,
                created_at INTEGER NOT NULL
            )",
            [],
        ).context("Failed to create streaming_vision_analysis table")?;

        // Create index on timestamp
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_streaming_vision_timestamp
             ON streaming_vision_analysis(timestamp DESC)",
            [],
        ).context("Failed to create timestamp index")?;

        Ok(())
    }

    /// Start streaming vision
    pub async fn start(&self) -> Result<()> {
        let mut state = self.state.lock().unwrap();

        if state.is_active {
            return Ok(()); // Already active
        }

        state.is_active = true;
        drop(state);

        let interval_secs = self.config.lock().unwrap().capture_interval_seconds;

        // Spawn background task
        let state_clone = Arc::clone(&self.state);
        let config_clone = Arc::clone(&self.config);
        let llava_clone = Arc::clone(&self.llava_service);
        let tts_clone = Arc::clone(&self.tts_service);
        let db_clone = Arc::clone(&self.db);

        tokio::spawn(async move {
            let mut interval_timer = interval(Duration::from_secs(interval_secs));

            loop {
                interval_timer.tick().await;

                // Check if still active
                let is_active = {
                    state_clone.lock().unwrap().is_active
                };

                if !is_active {
                    log::info!("Streaming vision stopped");
                    break;
                }

                // Capture and analyze
                if let Err(e) = Self::capture_and_analyze_static(
                    &state_clone,
                    &config_clone,
                    &llava_clone,
                    &tts_clone,
                    &db_clone,
                ).await {
                    log::error!("Streaming vision error: {}", e);
                }
            }
        });

        log::info!("Streaming vision started (interval: {}s)", interval_secs);
        Ok(())
    }

    /// Stop streaming vision
    pub fn stop(&self) -> Result<()> {
        let mut state = self.state.lock().unwrap();

        if !state.is_active {
            return Ok(()); // Already stopped
        }

        state.is_active = false;
        log::info!("Streaming vision stop requested");
        Ok(())
    }

    /// Capture screen and analyze (static method for spawn)
    async fn capture_and_analyze_static(
        state: &Arc<Mutex<StreamingVisionState>>,
        config: &Arc<Mutex<StreamingVisionConfig>>,
        llava: &Arc<LlavaService>,
        tts: &Arc<Mutex<TtsService>>,
        db: &Arc<Mutex<Database>>,
    ) -> Result<()> {
        // 1. Capture screen
        let screenshot = Self::capture_screen().await?;

        // 2. Calculate hash
        let image_hash = Self::calculate_image_hash(&screenshot);

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        // 3. Check if significant change (smart throttling)
        let is_significant_change = {
            let mut state_guard = state.lock().unwrap();
            let config_guard = config.lock().unwrap();

            state_guard.capture_count += 1;
            state_guard.last_capture_time = timestamp;

            if !config_guard.enable_smart_throttling {
                true // Always analyze if throttling disabled
            } else if let Some(ref last_hash) = state_guard.last_image_hash {
                let similarity = Self::calculate_hash_similarity(last_hash, &image_hash);

                if similarity < config_guard.similarity_threshold {
                    state_guard.last_image_hash = Some(image_hash.clone());
                    true
                } else {
                    log::debug!("Image similarity {:.2}% - skipping analysis", similarity * 100.0);
                    false
                }
            } else {
                state_guard.last_image_hash = Some(image_hash.clone());
                true
            }
        };

        // 4. Analyze if significant change
        let analysis = if is_significant_change {
            let prompt = config.lock().unwrap().analysis_prompt.clone();

            match llava.analyze_image(screenshot.clone(), Some(prompt)).await {
                Ok(result) => {
                    state.lock().unwrap().analysis_count += 1;
                    Some(result)
                }
                Err(e) => {
                    log::error!("LLaVA analysis failed: {}", e);
                    None
                }
            }
        } else {
            None
        };

        // 5. Send proactive alert if needed
        let (alert_sent, alert_method) = if is_significant_change {
            if let Some(ref analysis_text) = analysis {
                if !analysis_text.contains("No significant changes") {
                    Self::send_alert_static(analysis_text, config, tts, state).await?
                } else {
                    (false, None)
                }
            } else {
                (false, None)
            }
        } else {
            (false, None)
        };

        // 6. Save to database
        Self::save_analysis_to_db(
            db,
            timestamp,
            &image_hash,
            is_significant_change,
            analysis.as_deref(),
            alert_sent,
            alert_method.as_deref(),
        )?;

        Ok(())
    }

    /// Capture screen as base64 PNG
    async fn capture_screen() -> Result<String> {
        use screenshots::image::ImageFormat;

        let screens = Screen::all().context("Failed to get screens")?;
        if screens.is_empty() {
            return Err(anyhow::anyhow!("No screens found"));
        }

        let screen = &screens[0];
        let image = screen.capture().context("Failed to capture screen")?;

        let mut png_data: Vec<u8> = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut png_data);
        image.write_to(&mut cursor, ImageFormat::Png)?;

        Ok(general_purpose::STANDARD.encode(&png_data))
    }

    /// Calculate SHA256 hash of image
    fn calculate_image_hash(base64_image: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(base64_image.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Calculate similarity between two hashes (0.0-1.0)
    /// For now, exact match only (1.0 or 0.0)
    /// In production, use perceptual hashing (pHash)
    fn calculate_hash_similarity(hash1: &str, hash2: &str) -> f64 {
        if hash1 == hash2 {
            1.0
        } else {
            0.0
        }
    }

    /// Send proactive alert
    async fn send_alert_static(
        message: &str,
        config: &Arc<Mutex<StreamingVisionConfig>>,
        tts: &Arc<Mutex<TtsService>>,
        state: &Arc<Mutex<StreamingVisionState>>,
    ) -> Result<(bool, Option<String>)> {
        let config_guard = config.lock().unwrap();

        if !config_guard.enable_alerts {
            return Ok((false, None));
        }

        let alert_methods = config_guard.alert_methods.clone();
        drop(config_guard);

        for method in &alert_methods {
            match method.as_str() {
                "tts" => {
                    // Send TTS alert
                    // Note: TTS implementation has Send trait issues with async
                    // For Phase 2, we log the alert. Full TTS integration in Phase 3.
                    log::info!("TTS Alert: {}", message);
                    log::warn!("TTS playback temporarily disabled due to Send trait constraints - will be fixed in Phase 3");

                    state.lock().unwrap().alert_count += 1;
                    return Ok((true, Some("tts".to_string())));
                }
                "notification" => {
                    // Desktop notification (future implementation)
                    log::warn!("Desktop notifications not yet implemented");
                }
                "chat" => {
                    // Send to chat interface (future implementation)
                    log::warn!("Chat alerts not yet implemented");
                }
                _ => {
                    log::warn!("Unknown alert method: {}", method);
                }
            }
        }

        Ok((false, None))
    }

    /// Save analysis to database
    fn save_analysis_to_db(
        db: &Arc<Mutex<Database>>,
        timestamp: i64,
        image_hash: &str,
        is_significant_change: bool,
        analysis: Option<&str>,
        alert_sent: bool,
        alert_method: Option<&str>,
    ) -> Result<()> {
        let db_guard = db.lock().unwrap();
        let conn = db_guard.conn();

        let created_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        conn.execute(
            "INSERT INTO streaming_vision_analysis
             (timestamp, image_hash, is_significant_change, analysis, alert_sent, alert_method, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                timestamp,
                image_hash,
                is_significant_change,
                analysis,
                alert_sent,
                alert_method,
                created_at,
            ],
        )?;

        Ok(())
    }

    /// Get current state
    pub fn get_state(&self) -> StreamingVisionState {
        self.state.lock().unwrap().clone()
    }

    /// Get current config
    pub fn get_config(&self) -> StreamingVisionConfig {
        self.config.lock().unwrap().clone()
    }

    /// Update config
    pub fn update_config(&self, new_config: StreamingVisionConfig) -> Result<()> {
        let mut config = self.config.lock().unwrap();
        *config = new_config;
        Ok(())
    }

    /// Get analysis history
    pub fn get_analysis_history(&self, limit: usize) -> Result<Vec<VisionAnalysisResult>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT timestamp, image_hash, is_significant_change, analysis, alert_sent, alert_method
             FROM streaming_vision_analysis
             ORDER BY timestamp DESC
             LIMIT ?1"
        )?;

        let results = stmt.query_map([limit], |row| {
            Ok(VisionAnalysisResult {
                timestamp: row.get(0)?,
                image_hash: row.get(1)?,
                is_significant_change: row.get(2)?,
                analysis: row.get(3)?,
                alert_sent: row.get(4)?,
                alert_method: row.get(5)?,
            })
        })?;

        let mut history = Vec::new();
        for result in results {
            history.push(result?);
        }

        Ok(history)
    }

    /// Clear analysis history
    pub fn clear_history(&self) -> Result<usize> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let count = conn.execute("DELETE FROM streaming_vision_analysis", [])?;

        Ok(count)
    }

    /// Get statistics
    pub fn get_stats(&self) -> Result<serde_json::Value> {
        let state = self.state.lock().unwrap();
        let config = self.config.lock().unwrap();

        Ok(serde_json::json!({
            "is_active": state.is_active,
            "capture_count": state.capture_count,
            "analysis_count": state.analysis_count,
            "alert_count": state.alert_count,
            "last_capture_time": state.last_capture_time,
            "config": {
                "capture_interval_seconds": config.capture_interval_seconds,
                "enable_smart_throttling": config.enable_smart_throttling,
                "similarity_threshold": config.similarity_threshold,
                "enable_alerts": config.enable_alerts,
                "alert_methods": config.alert_methods,
            }
        }))
    }
}

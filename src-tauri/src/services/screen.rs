use screenshots::Screen;
use base64::{Engine as _, engine::general_purpose};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::interval;
use crate::database::Database;
use super::active_window::{ActiveWindowService, ActiveWindow};
use super::llava::{LlavaService, ScreenAnalysis};

/// Screen capture tracking state
#[derive(Debug, Clone)]
pub struct ScreenTrackingState {
    pub is_tracking: bool,
    pub last_capture_time: u64,
    pub capture_count: u64,
    pub capture_interval: u64, // in seconds
}

impl Default for ScreenTrackingState {
    fn default() -> Self {
        Self {
            is_tracking: false,
            last_capture_time: 0,
            capture_count: 0,
            capture_interval: 60, // Default: 60 seconds (optimized for performance)
        }
    }
}

/// Screen capture service with vision analysis
pub struct ScreenCaptureService {
    state: Arc<Mutex<ScreenTrackingState>>,
    db: Arc<Mutex<Database>>,
    active_window_service: ActiveWindowService,
    llava_service: Option<Arc<LlavaService>>,
}

impl ScreenCaptureService {
    pub fn new(db: Arc<Mutex<Database>>) -> Self {
        let active_window_service = ActiveWindowService::new()
            .unwrap_or_else(|e| {
                log::warn!("Failed to initialize active window service: {}", e);
                ActiveWindowService::new().unwrap()
            });

        let llava_service = match LlavaService::new() {
            Ok(service) => Some(Arc::new(service)),
            Err(e) => {
                log::warn!("LLaVA vision service not available: {}", e);
                None
            }
        };

        Self {
            state: Arc::new(Mutex::new(ScreenTrackingState::default())),
            db,
            active_window_service,
            llava_service,
        }
    }

    /// Get current tracking status
    pub fn get_status(&self) -> Result<ScreenTrackingState, String> {
        self.state
            .lock()
            .map(|state| state.clone())
            .map_err(|e| format!("Failed to get status: {}", e))
    }

    /// Start screen tracking
    pub async fn start_tracking(&self, interval_seconds: u64) -> Result<(), String> {
        let mut state = self.state.lock().map_err(|e| e.to_string())?;

        if state.is_tracking {
            return Ok(()); // Already tracking
        }

        state.is_tracking = true;
        state.capture_interval = interval_seconds;
        drop(state); // Release lock before spawning task

        // Spawn background task for periodic captures
        let state_clone = Arc::clone(&self.state);
        let db_clone = Arc::clone(&self.db);
        let active_window_service = self.active_window_service.clone();

        tokio::spawn(async move {
            let mut interval_timer = interval(Duration::from_secs(interval_seconds));

            loop {
                interval_timer.tick().await;

                // Check if still tracking
                let is_tracking = {
                    state_clone.lock().map(|s| s.is_tracking).unwrap_or(false)
                };

                if !is_tracking {
                    break; // Stop the loop if tracking is disabled
                }

                // Capture screen with active window info
                if let Err(e) = Self::capture_and_save(&state_clone, &db_clone, &active_window_service).await {
                    log::error!("Screen capture failed: {}", e);
                }
            }

            log::info!("Screen tracking loop ended");
        });

        log::info!("Screen tracking started with {}s interval", interval_seconds);
        Ok(())
    }

    /// Stop screen tracking
    pub fn stop_tracking(&self) -> Result<(), String> {
        let mut state = self.state.lock().map_err(|e| e.to_string())?;

        if !state.is_tracking {
            return Ok(()); // Already stopped
        }

        state.is_tracking = false;
        log::info!("Screen tracking stopped");
        Ok(())
    }

    /// Toggle screen tracking (start if stopped, stop if started)
    pub async fn toggle_tracking(&self, interval_seconds: Option<u64>) -> Result<bool, String> {
        let is_tracking = {
            self.state.lock().map_err(|e| e.to_string())?.is_tracking
        };

        if is_tracking {
            self.stop_tracking()?;
            Ok(false)
        } else {
            let interval = interval_seconds.unwrap_or(10);
            self.start_tracking(interval).await?;
            Ok(true)
        }
    }

    /// Capture screen and save to database with active window info
    async fn capture_and_save(
        state: &Arc<Mutex<ScreenTrackingState>>,
        db: &Arc<Mutex<Database>>,
        active_window_service: &ActiveWindowService,
    ) -> Result<(), String> {
        // Capture all screens
        let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;

        if screens.is_empty() {
            return Err("No screens found".to_string());
        }

        // Capture primary screen (index 0)
        let screen = &screens[0];
        let image = screen
            .capture()
            .map_err(|e| format!("Failed to capture screen: {}", e))?;

        // Convert image buffer to PNG bytes
        // The screenshots crate returns a screenshots::image::RgbaImage
        // We need to save it as PNG
        let mut png_data: Vec<u8> = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut png_data);

        use screenshots::image::ImageFormat;
        image
            .write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;

        let base64_image = general_purpose::STANDARD.encode(&png_data);

        // Get current timestamp
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("Failed to get timestamp: {}", e))?
            .as_millis() as i64;

        // Get active window information (v3.6.0)
        let active_window: Option<ActiveWindow> = match active_window_service.get_active_window() {
            Ok(window) => {
                log::debug!("Active window: {} ({})", window.title, window.app_name);
                Some(window)
            },
            Err(e) => {
                log::warn!("Failed to get active window: {}", e);
                None
            }
        };

        let window_title = active_window.as_ref().map(|w| w.title.clone());
        let app_name = active_window.as_ref().map(|w| w.app_name.clone());

        // Save to database
        let db_guard = db.lock().map_err(|e| format!("Failed to lock database: {}", e))?;
        let conn = db_guard.conn();

        // Store base64 image in image_path for now (will be refactored to save as file later)
        conn.execute(
            "INSERT INTO screen_context (id, level, image_path, extracted_text, window_title, application_name, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                format!("screen_{}", timestamp),
                1, // Level 1: Current screen only
                base64_image, // Storing base64 in image_path temporarily
                Option::<String>::None, // OCR: Use LLaVA vision for text extraction instead
                window_title,
                app_name,
                timestamp,
            ],
        )
        .map_err(|e| format!("Failed to save screen capture: {}", e))?;

        // Update state
        let mut state_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
        state_guard.last_capture_time = timestamp as u64;
        state_guard.capture_count += 1;

        log::info!(
            "Screen captured (count: {}, size: {} KB, window: {:?})",
            state_guard.capture_count,
            png_data.len() / 1024,
            window_title.as_deref().unwrap_or("unknown")
        );

        Ok(())
    }

    /// Get recent screen captures from database
    pub fn get_recent_captures(&self, limit: usize) -> Result<Vec<ScreenCapture>, String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;
        let conn = db.conn();

        let mut stmt = conn
            .prepare(
                "SELECT id, screenshot_base64, ocr_text, active_window, timestamp, analyzed
                 FROM screen_context
                 ORDER BY timestamp DESC
                 LIMIT ?1",
            )
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        let captures = stmt
            .query_map([limit], |row| {
                Ok(ScreenCapture {
                    id: row.get(0)?,
                    screenshot_base64: row.get(1)?,
                    ocr_text: row.get(2)?,
                    active_window: row.get(3)?,
                    timestamp: row.get(4)?,
                    analyzed: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to query captures: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to collect captures: {}", e))?;

        Ok(captures)
    }

    /// Clear all screen captures (for privacy)
    pub fn clear_all_captures(&self) -> Result<usize, String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;
        let conn = db.conn();

        let deleted = conn
            .execute("DELETE FROM screen_context", [])
            .map_err(|e| format!("Failed to clear captures: {}", e))?;

        log::info!("Cleared {} screen captures", deleted);
        Ok(deleted)
    }

    /// Capture screen with active window detection and vision analysis
    pub async fn capture_with_context(&self, context_level: u8) -> Result<EnhancedScreenCapture, String> {
        // Capture screen
        let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;
        if screens.is_empty() {
            return Err("No screens found".to_string());
        }

        let screen = &screens[0];
        let image = screen
            .capture()
            .map_err(|e| format!("Failed to capture screen: {}", e))?;

        // Convert to PNG and base64
        let mut png_data: Vec<u8> = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut png_data);
        use screenshots::image::ImageFormat;
        image
            .write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;

        let base64_image = general_purpose::STANDARD.encode(&png_data);

        // Get active window
        let active_window = self.active_window_service.get_active_window().ok();

        // Analyze with LLaVA if available
        let vision_analysis = if let Some(llava) = &self.llava_service {
            match llava.analyze_screen_context(base64_image.clone(), context_level).await {
                Ok(analysis) => Some(analysis),
                Err(e) => {
                    log::warn!("Vision analysis failed: {}", e);
                    None
                }
            }
        } else {
            None
        };

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("Failed to get timestamp: {}", e))?
            .as_millis() as i64;

        Ok(EnhancedScreenCapture {
            screenshot_base64: base64_image,
            active_window,
            vision_analysis,
            timestamp,
            context_level,
        })
    }

    /// Get active window information
    pub fn get_active_window(&self) -> Result<ActiveWindow, String> {
        self.active_window_service.get_active_window()
            .map_err(|e| format!("Failed to get active window: {}", e))
    }

    /// Analyze current screen with LLaVA
    pub async fn analyze_current_screen(&self, context_level: u8) -> Result<ScreenAnalysis, String> {
        let capture = self.capture_with_context(context_level).await?;

        capture.vision_analysis.ok_or_else(||
            "Vision analysis not available (LLaVA service not initialized)".to_string()
        )
    }
}

/// Screen capture data model
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ScreenCapture {
    pub id: String,
    pub screenshot_base64: String,
    pub ocr_text: Option<String>,
    pub active_window: Option<String>,
    pub timestamp: i64,
    pub analyzed: i32,
}

/// Enhanced screen capture with active window and vision analysis
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EnhancedScreenCapture {
    pub screenshot_base64: String,
    pub active_window: Option<ActiveWindow>,
    pub vision_analysis: Option<ScreenAnalysis>,
    pub timestamp: i64,
    pub context_level: u8,
}

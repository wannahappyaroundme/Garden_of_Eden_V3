use crate::services::{screen::ScreenCaptureService, llava::LlavaService};
use anyhow::{Context, Result, anyhow};
use enigo::{Enigo, Mouse, Keyboard, Button as EnigoButton, Coordinate, Direction};
use rdev::{simulate, EventType, Key as RdevKey};
use screenshots::Screen;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::time::sleep;

/// Types of computer actions the LAM can perform
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ActionType {
    Click,
    DoubleClick,
    RightClick,
    Type,
    KeyPress,
    Scroll,
    MoveMouse,
    Drag,
    AppleScript,
    Wait,
}

/// Bounding box for UI element location
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

/// Configuration for restricted zones and safety rules
#[derive(Debug, Clone)]
pub struct SafetyConfig {
    /// Areas where clicks are restricted
    pub restricted_zones: Vec<RestrictedZone>,
    /// Actions that require confirmation
    pub require_confirmation: Vec<ActionType>,
    /// Mouse animation speed in milliseconds
    pub animation_speed_ms: u64,
    /// Enable preview before execution
    pub enable_preview: bool,
}

/// A restricted zone where actions require approval
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestrictedZone {
    pub name: String,
    pub bounds: Option<BoundingBox>,
    pub app_bundle_id: Option<String>,
    pub requires_approval: bool,
}

/// Result of a computer action execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResult {
    pub success: bool,
    pub action_type: ActionType,
    pub target_description: Option<String>,
    pub coordinates: Option<(i32, i32)>,
    pub execution_time_ms: u64,
    pub error: Option<String>,
    pub screenshot_before: Option<String>,
    pub screenshot_after: Option<String>,
}

impl Default for SafetyConfig {
    fn default() -> Self {
        Self {
            restricted_zones: vec![
                RestrictedZone {
                    name: "System Preferences".to_string(),
                    bounds: None,
                    app_bundle_id: Some("com.apple.systempreferences".to_string()),
                    requires_approval: true,
                },
                RestrictedZone {
                    name: "Terminal".to_string(),
                    bounds: None,
                    app_bundle_id: Some("com.apple.Terminal".to_string()),
                    requires_approval: true,
                },
                RestrictedZone {
                    name: "Trash".to_string(),
                    bounds: None,
                    app_bundle_id: Some("com.apple.finder".to_string()),
                    requires_approval: true,
                },
            ],
            require_confirmation: vec![
                ActionType::AppleScript,
            ],
            animation_speed_ms: 200,
            enable_preview: true,
        }
    }
}

/// Main Computer Control Service for LAM
/// Note: Enigo is not Send on macOS, so we recreate it for each operation
pub struct ComputerControlService {
    screen_service: Arc<ScreenCaptureService>,
    llava_service: Arc<LlavaService>,
    safety_config: SafetyConfig,
    pub db: Arc<Mutex<Connection>>,  // Public for testing
}

impl ComputerControlService {
    /// Create a new ComputerControlService
    pub fn new(
        screen_service: Arc<ScreenCaptureService>,
        llava_service: Arc<LlavaService>,
        db: Arc<Mutex<Connection>>,
    ) -> Result<Self> {
        let service = Self {
            screen_service,
            llava_service,
            safety_config: SafetyConfig::default(),
            db,
        };

        service.init_database()?;

        Ok(service)
    }

    /// Create an Enigo instance (not cached due to Send trait issues on macOS)
    pub fn create_enigo(&self) -> Result<Enigo> {
        Enigo::new(&enigo::Settings::default())
            .context("Failed to create Enigo instance")
    }

    /// Simple screen capture helper that returns base64 PNG
    async fn capture_screen_simple(&self) -> Result<String> {
        use base64::{Engine as _, engine::general_purpose};
        use screenshots::image::ImageFormat;

        let screens = Screen::all().context("Failed to get screens")?;
        if screens.is_empty() {
            return Err(anyhow!("No screens found"));
        }

        let screen = &screens[0];
        let image = screen.capture().context("Failed to capture screen")?;

        // Convert to PNG and base64
        let mut png_data: Vec<u8> = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut png_data);
        image.write_to(&mut cursor, ImageFormat::Png)
            .context("Failed to encode PNG")?;

        Ok(general_purpose::STANDARD.encode(&png_data))
    }

    /// Initialize database tables for computer actions
    fn init_database(&self) -> Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS computer_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_type TEXT NOT NULL,
                target_description TEXT,
                coordinates TEXT,
                input_data TEXT,
                screenshot_before TEXT,
                screenshot_after TEXT,
                success BOOLEAN NOT NULL,
                error TEXT,
                execution_time_ms INTEGER NOT NULL,
                timestamp INTEGER NOT NULL
            )",
            [],
        )?;
        Ok(())
    }

    /// Click on a UI element by description using vision guidance
    pub async fn click_element(&self, description: &str) -> Result<ActionResult> {
        let start = Instant::now();

        // 1. Capture screen
        let screenshot_before = self.capture_screen_simple().await
            .context("Failed to capture screen")?;

        // 2. Use LLaVA to locate element
        let prompt = format!(
            "Locate the UI element: '{}'. Return ONLY a JSON object with the bounding box: {{\"x\": number, \"y\": number, \"width\": number, \"height\": number}}. If not found, return {{\"error\": \"not found\"}}.",
            description
        );

        let analysis = self.llava_service.analyze_image(screenshot_before.clone(), Some(prompt)).await
            .context("Failed to analyze image with LLaVA")?;

        // 3. Parse bounding box
        let bbox: BoundingBox = serde_json::from_str(&analysis)
            .map_err(|e| anyhow!("Failed to parse bounding box from LLaVA response: {}. Response: {}", e, analysis))?;

        // 4. Calculate center point
        let x = bbox.x + bbox.width / 2;
        let y = bbox.y + bbox.height / 2;

        // 5. Check safety restrictions
        self.check_safety_restrictions(x, y, &ActionType::Click)?;

        // 6. Animate mouse movement
        self.animate_mouse_to(x, y).await?;

        // 7. Perform click
        {
            let mut enigo = self.create_enigo()?;
            enigo.button(EnigoButton::Left, Direction::Click)
                .context("Failed to perform mouse click")?;
        }

        // 8. Capture screen after action
        sleep(Duration::from_millis(500)).await;
        let screenshot_after = self.capture_screen_simple().await.ok();

        let execution_time = start.elapsed().as_millis() as u64;

        // 9. Log action
        let result = ActionResult {
            success: true,
            action_type: ActionType::Click,
            target_description: Some(description.to_string()),
            coordinates: Some((x, y)),
            execution_time_ms: execution_time,
            error: None,
            screenshot_before: Some(screenshot_before),
            screenshot_after,
        };

        self.log_action(&result)?;

        Ok(result)
    }

    /// Type text at current cursor position
    pub async fn type_text(&self, text: &str) -> Result<ActionResult> {
        let start = Instant::now();

        let screenshot_before = self.capture_screen_simple().await.ok();

        // Type text character by character
        {
            let mut enigo = self.create_enigo()?;
            enigo.text(text)
                .context("Failed to type text")?;
        }

        sleep(Duration::from_millis(100)).await;
        let screenshot_after = self.capture_screen_simple().await.ok();

        let execution_time = start.elapsed().as_millis() as u64;

        let result = ActionResult {
            success: true,
            action_type: ActionType::Type,
            target_description: Some(format!("Type: {}", text)),
            coordinates: None,
            execution_time_ms: execution_time,
            error: None,
            screenshot_before,
            screenshot_after,
        };

        self.log_action(&result)?;

        Ok(result)
    }

    /// Press a keyboard key
    pub async fn press_key(&self, key: &str) -> Result<ActionResult> {
        let start = Instant::now();

        let screenshot_before = self.capture_screen_simple().await.ok();

        // Map string to rdev Key
        let rdev_key = self.map_key_string_to_rdev(key)?;

        // Send key press and release
        simulate(&EventType::KeyPress(rdev_key))
            .context("Failed to simulate key press")?;
        sleep(Duration::from_millis(50)).await;
        simulate(&EventType::KeyRelease(rdev_key))
            .context("Failed to simulate key release")?;

        sleep(Duration::from_millis(100)).await;
        let screenshot_after = self.capture_screen_simple().await.ok();

        let execution_time = start.elapsed().as_millis() as u64;

        let result = ActionResult {
            success: true,
            action_type: ActionType::KeyPress,
            target_description: Some(format!("Press key: {}", key)),
            coordinates: None,
            execution_time_ms: execution_time,
            error: None,
            screenshot_before,
            screenshot_after,
        };

        self.log_action(&result)?;

        Ok(result)
    }

    /// Scroll in a direction
    pub async fn scroll(&self, direction: &str, amount: i32) -> Result<ActionResult> {
        let start = Instant::now();

        let screenshot_before = self.capture_screen_simple().await.ok();

        {
            let mut enigo = self.create_enigo()?;

            match direction.to_lowercase().as_str() {
                "up" => {
                    enigo.scroll(amount, enigo::Axis::Vertical)
                        .context("Failed to scroll up")?;
                }
                "down" => {
                    enigo.scroll(-amount, enigo::Axis::Vertical)
                        .context("Failed to scroll down")?;
                }
                "left" => {
                    enigo.scroll(amount, enigo::Axis::Horizontal)
                        .context("Failed to scroll left")?;
                }
                "right" => {
                    enigo.scroll(-amount, enigo::Axis::Horizontal)
                        .context("Failed to scroll right")?;
                }
                _ => return Err(anyhow!("Invalid scroll direction: {}", direction)),
            }
        }

        sleep(Duration::from_millis(200)).await;
        let screenshot_after = self.capture_screen_simple().await.ok();

        let execution_time = start.elapsed().as_millis() as u64;

        let result = ActionResult {
            success: true,
            action_type: ActionType::Scroll,
            target_description: Some(format!("Scroll {} by {}", direction, amount)),
            coordinates: None,
            execution_time_ms: execution_time,
            error: None,
            screenshot_before,
            screenshot_after,
        };

        self.log_action(&result)?;

        Ok(result)
    }

    /// Move mouse to coordinates
    pub async fn move_mouse(&self, x: i32, y: i32) -> Result<ActionResult> {
        let start = Instant::now();

        self.check_safety_restrictions(x, y, &ActionType::MoveMouse)?;
        self.animate_mouse_to(x, y).await?;

        let execution_time = start.elapsed().as_millis() as u64;

        let result = ActionResult {
            success: true,
            action_type: ActionType::MoveMouse,
            target_description: Some(format!("Move to ({}, {})", x, y)),
            coordinates: Some((x, y)),
            execution_time_ms: execution_time,
            error: None,
            screenshot_before: None,
            screenshot_after: None,
        };

        self.log_action(&result)?;

        Ok(result)
    }

    /// Wait for specified milliseconds
    pub async fn wait(&self, ms: u64) -> Result<ActionResult> {
        let start = Instant::now();

        sleep(Duration::from_millis(ms)).await;

        let execution_time = start.elapsed().as_millis() as u64;

        let result = ActionResult {
            success: true,
            action_type: ActionType::Wait,
            target_description: Some(format!("Wait {}ms", ms)),
            coordinates: None,
            execution_time_ms: execution_time,
            error: None,
            screenshot_before: None,
            screenshot_after: None,
        };

        self.log_action(&result)?;

        Ok(result)
    }

    /// Execute AppleScript (macOS only)
    #[cfg(target_os = "macos")]
    pub async fn execute_applescript(&self, script: &str) -> Result<ActionResult> {
        let start = Instant::now();

        // Check if AppleScript requires confirmation
        if self.safety_config.require_confirmation.contains(&ActionType::AppleScript) {
            return Err(anyhow!("AppleScript execution requires user confirmation"));
        }

        let output = std::process::Command::new("osascript")
            .arg("-e")
            .arg(script)
            .output()
            .context("Failed to execute AppleScript")?;

        let success = output.status.success();
        let error = if !success {
            Some(String::from_utf8_lossy(&output.stderr).to_string())
        } else {
            None
        };

        let execution_time = start.elapsed().as_millis() as u64;

        let result = ActionResult {
            success,
            action_type: ActionType::AppleScript,
            target_description: Some(format!("AppleScript: {}", script)),
            coordinates: None,
            execution_time_ms: execution_time,
            error,
            screenshot_before: None,
            screenshot_after: None,
        };

        self.log_action(&result)?;

        Ok(result)
    }

    /// Animate mouse movement to target coordinates
    async fn animate_mouse_to(&self, target_x: i32, target_y: i32) -> Result<()> {
        if self.safety_config.animation_speed_ms == 0 {
            // Instant movement
            let mut enigo = self.create_enigo()?;
            enigo.move_mouse(target_x, target_y, Coordinate::Abs)
                .context("Failed to move mouse")?;
            return Ok(());
        }

        // Get current mouse position
        let (start_x, start_y) = self.get_mouse_position()?;

        // Calculate steps for smooth animation
        let steps = (self.safety_config.animation_speed_ms / 10).max(1);
        let dx = (target_x - start_x) as f64 / steps as f64;
        let dy = (target_y - start_y) as f64 / steps as f64;

        for i in 1..=steps {
            let x = start_x + (dx * i as f64) as i32;
            let y = start_y + (dy * i as f64) as i32;

            {
                let mut enigo = self.create_enigo()?;
                enigo.move_mouse(x, y, Coordinate::Abs)
                    .context("Failed to move mouse during animation")?;
            }

            sleep(Duration::from_millis(10)).await;
        }

        Ok(())
    }

    /// Get current mouse position
    fn get_mouse_position(&self) -> Result<(i32, i32)> {
        // Note: enigo doesn't provide mouse position getter
        // For now, we'll return (0, 0) as a placeholder
        // In a production system, you'd use platform-specific APIs
        Ok((0, 0))
    }

    /// Check if coordinates are in restricted zones
    pub fn check_safety_restrictions(&self, x: i32, y: i32, action: &ActionType) -> Result<()> {
        // Check if action requires confirmation
        if self.safety_config.require_confirmation.contains(action) {
            return Err(anyhow!("{:?} requires user confirmation", action));
        }

        // Check restricted zones
        for zone in &self.safety_config.restricted_zones {
            if zone.requires_approval {
                if let Some(bounds) = &zone.bounds {
                    if x >= bounds.x
                        && x <= bounds.x + bounds.width
                        && y >= bounds.y
                        && y <= bounds.y + bounds.height
                    {
                        return Err(anyhow!(
                            "Action in restricted zone '{}' requires approval",
                            zone.name
                        ));
                    }
                }
            }
        }

        Ok(())
    }

    /// Map key string to rdev Key enum
    pub fn map_key_string_to_rdev(&self, key: &str) -> Result<RdevKey> {
        Ok(match key.to_lowercase().as_str() {
            "enter" | "return" => RdevKey::Return,
            "escape" | "esc" => RdevKey::Escape,
            "tab" => RdevKey::Tab,
            "space" => RdevKey::Space,
            "backspace" => RdevKey::Backspace,
            "delete" => RdevKey::Delete,
            "up" => RdevKey::UpArrow,
            "down" => RdevKey::DownArrow,
            "left" => RdevKey::LeftArrow,
            "right" => RdevKey::RightArrow,
            "command" | "cmd" | "meta" => RdevKey::MetaLeft,
            "control" | "ctrl" => RdevKey::ControlLeft,
            "alt" | "option" => RdevKey::Alt,
            "shift" => RdevKey::ShiftLeft,
            "f1" => RdevKey::F1,
            "f2" => RdevKey::F2,
            "f3" => RdevKey::F3,
            "f4" => RdevKey::F4,
            "f5" => RdevKey::F5,
            "f6" => RdevKey::F6,
            "f7" => RdevKey::F7,
            "f8" => RdevKey::F8,
            "f9" => RdevKey::F9,
            "f10" => RdevKey::F10,
            "f11" => RdevKey::F11,
            "f12" => RdevKey::F12,
            _ => {
                // Try single character
                if key.len() == 1 {
                    let ch = key.chars().next().unwrap();
                    match ch {
                        'a' => RdevKey::KeyA,
                        'b' => RdevKey::KeyB,
                        'c' => RdevKey::KeyC,
                        'd' => RdevKey::KeyD,
                        'e' => RdevKey::KeyE,
                        'f' => RdevKey::KeyF,
                        'g' => RdevKey::KeyG,
                        'h' => RdevKey::KeyH,
                        'i' => RdevKey::KeyI,
                        'j' => RdevKey::KeyJ,
                        'k' => RdevKey::KeyK,
                        'l' => RdevKey::KeyL,
                        'm' => RdevKey::KeyM,
                        'n' => RdevKey::KeyN,
                        'o' => RdevKey::KeyO,
                        'p' => RdevKey::KeyP,
                        'q' => RdevKey::KeyQ,
                        'r' => RdevKey::KeyR,
                        's' => RdevKey::KeyS,
                        't' => RdevKey::KeyT,
                        'u' => RdevKey::KeyU,
                        'v' => RdevKey::KeyV,
                        'w' => RdevKey::KeyW,
                        'x' => RdevKey::KeyX,
                        'y' => RdevKey::KeyY,
                        'z' => RdevKey::KeyZ,
                        '0' => RdevKey::Num0,
                        '1' => RdevKey::Num1,
                        '2' => RdevKey::Num2,
                        '3' => RdevKey::Num3,
                        '4' => RdevKey::Num4,
                        '5' => RdevKey::Num5,
                        '6' => RdevKey::Num6,
                        '7' => RdevKey::Num7,
                        '8' => RdevKey::Num8,
                        '9' => RdevKey::Num9,
                        _ => return Err(anyhow!("Unsupported key: {}", key)),
                    }
                } else {
                    return Err(anyhow!("Unsupported key: {}", key));
                }
            }
        })
    }

    /// Log action to database
    fn log_action(&self, result: &ActionResult) -> Result<()> {
        let conn = self.db.lock().unwrap();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as i64;

        conn.execute(
            "INSERT INTO computer_actions
            (action_type, target_description, coordinates, input_data,
             screenshot_before, screenshot_after, success, error,
             execution_time_ms, timestamp)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                format!("{:?}", result.action_type),
                result.target_description,
                result.coordinates.map(|(x, y)| format!("{},{}", x, y)),
                None::<String>, // input_data
                result.screenshot_before,
                result.screenshot_after,
                result.success,
                result.error,
                result.execution_time_ms as i64,
                timestamp,
            ],
        )?;

        Ok(())
    }

    /// Get action history
    pub fn get_action_history(&self, limit: usize) -> Result<Vec<ActionResult>> {
        let conn = self.db.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT action_type, target_description, coordinates,
                    screenshot_before, screenshot_after, success, error,
                    execution_time_ms
             FROM computer_actions
             ORDER BY timestamp DESC
             LIMIT ?1",
        )?;

        let results = stmt
            .query_map(params![limit], |row| {
                let action_type_str: String = row.get(0)?;
                let coords_str: Option<String> = row.get(2)?;
                let coordinates = coords_str.and_then(|s| {
                    let parts: Vec<&str> = s.split(',').collect();
                    if parts.len() == 2 {
                        Some((parts[0].parse().ok()?, parts[1].parse().ok()?))
                    } else {
                        None
                    }
                });

                Ok(ActionResult {
                    success: row.get(5)?,
                    action_type: serde_json::from_str(&format!("\"{}\"", action_type_str))
                        .unwrap_or(ActionType::Click),
                    target_description: row.get(1)?,
                    coordinates,
                    execution_time_ms: row.get::<_, i64>(7)? as u64,
                    error: row.get(6)?,
                    screenshot_before: row.get(3)?,
                    screenshot_after: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(results)
    }

    /// Clear action history
    pub fn clear_action_history(&self) -> Result<usize> {
        let conn = self.db.lock().unwrap();
        let count = conn.execute("DELETE FROM computer_actions", [])?;
        Ok(count)
    }

    /// Update safety configuration
    pub fn update_safety_config(&mut self, config: SafetyConfig) {
        self.safety_config = config;
    }

    /// Get current safety configuration
    pub fn get_safety_config(&self) -> &SafetyConfig {
        &self.safety_config
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_safety_config_default() {
        let config = SafetyConfig::default();
        assert_eq!(config.restricted_zones.len(), 3);
        assert_eq!(config.animation_speed_ms, 200);
        assert!(config.enable_preview);
    }

    #[test]
    fn test_action_type_serialization() {
        let action = ActionType::Click;
        let json = serde_json::to_string(&action).unwrap();
        assert_eq!(json, "\"click\"");
    }
}

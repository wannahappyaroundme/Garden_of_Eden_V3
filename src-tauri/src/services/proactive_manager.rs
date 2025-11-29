// Phase 4: Proactive Mode - Not yet integrated into main app
#![allow(dead_code)]

use anyhow::Result;
use log::{info, warn};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::interval;
use super::llava::{LlavaService, ProactiveTrigger};
use super::screen::ScreenCaptureService;
use super::active_window::{ActiveWindowService, ActiveWindow};

/// Proactive AI manager for background monitoring and intelligent interruptions
/// This implements the "AI-Led" mode from the spec
pub struct ProactiveManager {
    is_active: Arc<Mutex<bool>>,
    config: Arc<Mutex<ProactiveConfig>>,
    llava_service: Option<Arc<LlavaService>>,
    screen_service: Arc<ScreenCaptureService>,
    active_window_service: ActiveWindowService,
    last_trigger_time: Arc<Mutex<SystemTime>>,
}

/// Proactive mode configuration
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProactiveConfig {
    /// Enable/disable proactive mode
    pub enabled: bool,

    /// How often to check screen for triggers (in seconds)
    pub check_interval: u64,

    /// Minimum time between proactive interruptions (in seconds)
    pub min_interrupt_interval: u64,

    /// Priority threshold for interruptions (0.0-1.0)
    /// Higher = only interrupt for high-priority triggers
    pub interrupt_threshold: f32,

    /// Monitor for errors
    pub monitor_errors: bool,

    /// Monitor for long-running processes
    pub monitor_long_processes: bool,

    /// Monitor for TODO comments
    pub monitor_todos: bool,

    /// Monitor for warnings
    pub monitor_warnings: bool,
}

impl Default for ProactiveConfig {
    fn default() -> Self {
        Self {
            enabled: false, // Off by default, user must opt-in
            check_interval: 30, // Check every 30 seconds
            min_interrupt_interval: 300, // At least 5 minutes between interruptions
            interrupt_threshold: 0.7, // Only high-priority triggers
            monitor_errors: true,
            monitor_long_processes: true,
            monitor_todos: false, // Off by default to avoid spam
            monitor_warnings: false, // Off by default
        }
    }
}

/// Proactive suggestion from the AI
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProactiveSuggestion {
    pub id: String,
    pub trigger_type: String,
    pub description: String,
    pub priority: f32, // 0.0-1.0
    pub suggestion: String,
    pub timestamp: i64,
    pub active_window: Option<ActiveWindow>,
}

impl ProactiveManager {
    pub fn new(
        llava_service: Option<Arc<LlavaService>>,
        screen_service: Arc<ScreenCaptureService>,
    ) -> Result<Self> {
        let active_window_service = ActiveWindowService::new()
            .unwrap_or_else(|e| {
                warn!("Failed to initialize active window service: {}", e);
                ActiveWindowService::new().unwrap()
            });

        Ok(Self {
            is_active: Arc::new(Mutex::new(false)),
            config: Arc::new(Mutex::new(ProactiveConfig::default())),
            llava_service,
            screen_service,
            active_window_service,
            last_trigger_time: Arc::new(Mutex::new(UNIX_EPOCH)),
        })
    }

    /// Start proactive monitoring
    pub async fn start(&self) -> Result<()> {
        let mut is_active = self.is_active.lock().unwrap();

        if *is_active {
            return Ok(()); // Already running
        }

        if self.llava_service.is_none() {
            return Err(anyhow::anyhow!(
                "LLaVA vision service not available. Proactive mode requires vision analysis."
            ));
        }

        *is_active = true;
        drop(is_active);

        info!("Starting proactive AI monitoring");

        // Spawn background monitoring task
        let is_active_clone = Arc::clone(&self.is_active);
        let config_clone = Arc::clone(&self.config);
        let llava_clone = self.llava_service.as_ref().unwrap().clone();
        let screen_clone = Arc::clone(&self.screen_service);
        let active_window_clone = self.active_window_service.clone();
        let last_trigger_clone = Arc::clone(&self.last_trigger_time);

        tokio::spawn(async move {
            Self::monitoring_loop(
                is_active_clone,
                config_clone,
                llava_clone,
                screen_clone,
                active_window_clone,
                last_trigger_clone,
            )
            .await;
        });

        Ok(())
    }

    /// Stop proactive monitoring
    pub fn stop(&self) -> Result<()> {
        let mut is_active = self.is_active.lock().unwrap();

        if !*is_active {
            return Ok(()); // Already stopped
        }

        *is_active = false;
        info!("Stopped proactive AI monitoring");
        Ok(())
    }

    /// Toggle proactive monitoring
    pub async fn toggle(&self) -> Result<bool> {
        let is_active = *self.is_active.lock().unwrap();

        if is_active {
            self.stop()?;
            Ok(false)
        } else {
            self.start().await?;
            Ok(true)
        }
    }

    /// Update configuration
    pub fn update_config(&self, config: ProactiveConfig) -> Result<()> {
        let mut current_config = self.config.lock().unwrap();
        *current_config = config;
        info!("Proactive config updated: {:?}", *current_config);
        Ok(())
    }

    /// Get current configuration
    pub fn get_config(&self) -> ProactiveConfig {
        self.config.lock().unwrap().clone()
    }

    /// Get monitoring status
    pub fn is_active(&self) -> bool {
        *self.is_active.lock().unwrap()
    }

    /// Main monitoring loop
    async fn monitoring_loop(
        is_active: Arc<Mutex<bool>>,
        config: Arc<Mutex<ProactiveConfig>>,
        llava: Arc<LlavaService>,
        screen: Arc<ScreenCaptureService>,
        active_window: ActiveWindowService,
        last_trigger: Arc<Mutex<SystemTime>>,
    ) {
        let mut interval_timer = interval(Duration::from_secs(30)); // Will be updated from config

        loop {
            interval_timer.tick().await;

            // Check if still active
            let still_active = *is_active.lock().unwrap();
            if !still_active {
                info!("Proactive monitoring loop ended");
                break;
            }

            // Get current config
            let current_config = config.lock().unwrap().clone();

            if !current_config.enabled {
                continue; // Skip if disabled
            }

            // Update interval if changed
            interval_timer = interval(Duration::from_secs(current_config.check_interval));

            // Check if enough time has passed since last trigger
            let time_since_last = SystemTime::now()
                .duration_since(*last_trigger.lock().unwrap())
                .unwrap_or(Duration::from_secs(0));

            if time_since_last.as_secs() < current_config.min_interrupt_interval {
                continue; // Too soon to interrupt again
            }

            // Capture screen and detect triggers
            match Self::check_for_triggers(&screen, &llava, &active_window, &current_config).await {
                Ok(Some(suggestion)) => {
                    if suggestion.priority >= current_config.interrupt_threshold {
                        info!("Proactive trigger detected: {:?}", suggestion);

                        // Update last trigger time
                        *last_trigger.lock().unwrap() = SystemTime::now();

                        // TODO: Send suggestion to frontend via Tauri events
                        // This will be handled by emitting a Tauri event that the frontend listens to
                    }
                }
                Ok(None) => {
                    // No triggers detected, continue monitoring
                }
                Err(e) => {
                    warn!("Failed to check for triggers: {}", e);
                }
            }
        }
    }

    /// Check screen for proactive triggers
    async fn check_for_triggers(
        screen: &Arc<ScreenCaptureService>,
        llava: &Arc<LlavaService>,
        active_window: &ActiveWindowService,
        config: &ProactiveConfig,
    ) -> Result<Option<ProactiveSuggestion>> {
        // Capture current screen
        let capture = screen.capture_with_context(1).await
            .map_err(|e| anyhow::anyhow!("Failed to capture screen: {}", e))?; // Level 1: Quick analysis

        // Get active window
        let window = active_window.get_active_window().ok();

        // Analyze screen for triggers
        let triggers = llava.detect_proactive_triggers(capture.screenshot_base64).await?;

        // Filter triggers based on config
        let filtered_triggers: Vec<&ProactiveTrigger> = triggers
            .iter()
            .filter(|trigger| match trigger {
                ProactiveTrigger::ErrorDetected { .. } => config.monitor_errors,
                ProactiveTrigger::WarningDetected { .. } => config.monitor_warnings,
                ProactiveTrigger::TodoDetected { .. } => config.monitor_todos,
                ProactiveTrigger::LongRunningProcess { .. } => config.monitor_long_processes,
            })
            .collect();

        if filtered_triggers.is_empty() {
            return Ok(None);
        }

        // Pick highest priority trigger
        let trigger = filtered_triggers[0]; // For now, just take the first one

        let (trigger_type, description, priority) = match trigger {
            ProactiveTrigger::ErrorDetected { description } => {
                ("error", description.as_str(), 0.9)
            }
            ProactiveTrigger::WarningDetected { description } => {
                ("warning", description.as_str(), 0.6)
            }
            ProactiveTrigger::TodoDetected { description } => {
                ("todo", description.as_str(), 0.4)
            }
            ProactiveTrigger::LongRunningProcess { description } => {
                ("long_process", description.as_str(), 0.5)
            }
        };

        let suggestion_text = Self::generate_suggestion(trigger_type, description);

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::from_secs(0))
            .as_millis() as i64;

        Ok(Some(ProactiveSuggestion {
            id: uuid::Uuid::new_v4().to_string(),
            trigger_type: trigger_type.to_string(),
            description: description.to_string(),
            priority,
            suggestion: suggestion_text,
            timestamp,
            active_window: window,
        }))
    }

    /// Generate helpful suggestion based on trigger
    fn generate_suggestion(trigger_type: &str, description: &str) -> String {
        match trigger_type {
            "error" => format!(
                "I noticed an error on your screen: \"{}\". Would you like help debugging this?",
                description
            ),
            "warning" => format!(
                "There's a warning that might need attention: \"{}\". Should I look into this?",
                description
            ),
            "todo" => format!(
                "I see a TODO comment: \"{}\". Would you like me to help complete this task?",
                description
            ),
            "long_process" => format!(
                "A long-running process is active: \"{}\". I can monitor it and notify you when it completes.",
                description
            ),
            _ => format!("I noticed something that might need attention: \"{}\"", description),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = ProactiveConfig::default();
        assert!(!config.enabled); // Disabled by default
        assert_eq!(config.check_interval, 30);
        assert!(config.monitor_errors);
    }

    #[test]
    fn test_suggestion_generation() {
        let suggestion = ProactiveManager::generate_suggestion(
            "error",
            "Failed to compile: missing semicolon"
        );
        assert!(suggestion.contains("error"));
        assert!(suggestion.contains("debugging"));
    }
}

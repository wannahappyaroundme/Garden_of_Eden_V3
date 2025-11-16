/**
 * Webhook Trigger Manager
 * Automatically triggers webhooks based on AI events
 */

use crate::database::Database;
use crate::services::webhook::{WebhookConfig, WebhookPayload, WebhookService};
use log::{error, info};
use std::sync::{Arc, Mutex};

/// Events that can trigger webhooks
#[derive(Debug, Clone)]
pub enum WebhookTriggerEvent {
    ConversationStarted { conversation_id: String, mode: String },
    MessageSent { conversation_id: String, user_message: String },
    MessageReceived { conversation_id: String, ai_response: String, tokens: i32 },
    ErrorOccurred { error_type: String, error_message: String },
    ModelSwitched { old_model: String, new_model: String },
    FeedbackReceived { message_id: String, satisfaction: String },
    ScreenCaptured { context_level: i32, analysis: Option<String> },
}

impl WebhookTriggerEvent {
    /// Convert event to webhook payload
    pub fn to_payload(&self) -> WebhookPayload {
        let (event_name, data) = match self {
            WebhookTriggerEvent::ConversationStarted { conversation_id, mode } => (
                "conversation_started".to_string(),
                serde_json::json!({
                    "conversation_id": conversation_id,
                    "mode": mode,
                }),
            ),
            WebhookTriggerEvent::MessageSent { conversation_id, user_message } => (
                "message_sent".to_string(),
                serde_json::json!({
                    "conversation_id": conversation_id,
                    "message": user_message,
                }),
            ),
            WebhookTriggerEvent::MessageReceived { conversation_id, ai_response, tokens } => (
                "message_received".to_string(),
                serde_json::json!({
                    "conversation_id": conversation_id,
                    "response": ai_response,
                    "tokens": tokens,
                }),
            ),
            WebhookTriggerEvent::ErrorOccurred { error_type, error_message } => (
                "error_occurred".to_string(),
                serde_json::json!({
                    "error_type": error_type,
                    "error_message": error_message,
                }),
            ),
            WebhookTriggerEvent::ModelSwitched { old_model, new_model } => (
                "model_switched".to_string(),
                serde_json::json!({
                    "old_model": old_model,
                    "new_model": new_model,
                }),
            ),
            WebhookTriggerEvent::FeedbackReceived { message_id, satisfaction } => (
                "feedback_received".to_string(),
                serde_json::json!({
                    "message_id": message_id,
                    "satisfaction": satisfaction,
                }),
            ),
            WebhookTriggerEvent::ScreenCaptured { context_level, analysis } => (
                "screen_captured".to_string(),
                serde_json::json!({
                    "context_level": context_level,
                    "analysis": analysis,
                }),
            ),
        };

        WebhookPayload {
            event: event_name,
            data,
            timestamp: chrono::Utc::now().timestamp(),
        }
    }

    /// Get event category for filtering
    pub fn category(&self) -> &str {
        match self {
            WebhookTriggerEvent::ConversationStarted { .. } => "conversation",
            WebhookTriggerEvent::MessageSent { .. } => "conversation",
            WebhookTriggerEvent::MessageReceived { .. } => "conversation",
            WebhookTriggerEvent::ErrorOccurred { .. } => "error",
            WebhookTriggerEvent::ModelSwitched { .. } => "system",
            WebhookTriggerEvent::FeedbackReceived { .. } => "feedback",
            WebhookTriggerEvent::ScreenCaptured { .. } => "screen",
        }
    }
}

/// Webhook trigger manager
pub struct WebhookTriggerManager {
    db: Arc<Mutex<Database>>,
    webhook_service: WebhookService,
}

impl WebhookTriggerManager {
    /// Create a new webhook trigger manager
    pub fn new(db: Arc<Mutex<Database>>) -> Self {
        Self {
            db,
            webhook_service: WebhookService::new(),
        }
    }

    /// Trigger all enabled webhooks for an event
    pub async fn trigger_event(&self, event: WebhookTriggerEvent) {
        info!("Triggering webhooks for event: {:?}", event.category());

        // Get all enabled webhooks from database
        let webhooks = match self.get_enabled_webhooks() {
            Ok(hooks) => hooks,
            Err(e) => {
                error!("Failed to get enabled webhooks: {}", e);
                return;
            }
        };

        if webhooks.is_empty() {
            return;
        }

        // Convert event to payload
        let payload = event.to_payload();

        // Trigger each webhook (in parallel for performance)
        let mut handles = vec![];
        for webhook in webhooks {
            let service = self.webhook_service.clone();
            let payload_clone = payload.clone();
            let webhook_clone = webhook.clone();

            let handle = tokio::spawn(async move {
                match service.trigger(&webhook_clone, payload_clone).await {
                    Ok(_) => {
                        info!("Webhook '{}' triggered successfully", webhook_clone.name);
                    }
                    Err(e) => {
                        error!("Webhook '{}' failed: {}", webhook_clone.name, e);
                    }
                }
            });

            handles.push(handle);
        }

        // Wait for all webhooks to complete
        for handle in handles {
            let _ = handle.await;
        }

        // Update last_used_at for all triggered webhooks
        self.update_webhook_timestamps();
    }

    /// Get all enabled webhooks from database
    fn get_enabled_webhooks(&self) -> Result<Vec<WebhookConfig>, String> {
        let db = self.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
        let conn = db.conn();

        let mut stmt = conn
            .prepare("SELECT name, preset, url, method, headers, timeout, retries FROM webhooks WHERE enabled = 1")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let webhooks = stmt
            .query_map([], |row| {
                let name: String = row.get(0)?;
                let preset: Option<String> = row.get(1)?;
                let url: String = row.get(2)?;
                let method: String = row.get(3)?;
                let headers_str: Option<String> = row.get(4)?;
                let timeout: i64 = row.get(5)?;
                let retries: i64 = row.get(6)?;

                // Parse headers
                let headers = if let Some(h) = headers_str {
                    serde_json::from_str(&h).unwrap_or_default()
                } else {
                    std::collections::HashMap::new()
                };

                // Parse preset
                let preset_enum = preset.and_then(|p| match p.as_str() {
                    "slack" => Some(crate::services::webhook::WebhookPreset::Slack),
                    "discord" => Some(crate::services::webhook::WebhookPreset::Discord),
                    "notion" => Some(crate::services::webhook::WebhookPreset::Notion),
                    _ => Some(crate::services::webhook::WebhookPreset::Custom),
                });

                Ok(WebhookConfig {
                    name,
                    preset: preset_enum,
                    url,
                    method,
                    headers,
                    enabled: true,
                    timeout: timeout as u64,
                    retries: retries as u32,
                })
            })
            .map_err(|e| format!("Failed to query webhooks: {}", e))?;

        webhooks.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to collect webhooks: {}", e))
    }

    /// Update last_used_at timestamp for all webhooks
    fn update_webhook_timestamps(&self) {
        let db = match self.db.lock() {
            Ok(db) => db,
            Err(e) => {
                error!("Failed to lock database: {}", e);
                return;
            }
        };

        let conn = db.conn();
        let now = chrono::Utc::now().timestamp();

        if let Err(e) = conn.execute(
            "UPDATE webhooks SET last_used_at = ?1 WHERE enabled = 1",
            rusqlite::params![now],
        ) {
            error!("Failed to update webhook timestamps: {}", e);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_payload_conversion() {
        let event = WebhookTriggerEvent::MessageReceived {
            conversation_id: "test-123".to_string(),
            ai_response: "Hello!".to_string(),
            tokens: 42,
        };

        let payload = event.to_payload();
        assert_eq!(payload.event, "message_received");
        assert_eq!(payload.data["conversation_id"], "test-123");
        assert_eq!(payload.data["response"], "Hello!");
        assert_eq!(payload.data["tokens"], 42);
    }

    #[test]
    fn test_event_categories() {
        let conv_event = WebhookTriggerEvent::ConversationStarted {
            conversation_id: "test".to_string(),
            mode: "user-led".to_string(),
        };
        assert_eq!(conv_event.category(), "conversation");

        let error_event = WebhookTriggerEvent::ErrorOccurred {
            error_type: "network".to_string(),
            error_message: "timeout".to_string(),
        };
        assert_eq!(error_event.category(), "error");
    }
}

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookConfig {
    pub name: String,
    pub preset: Option<WebhookPreset>,
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub enabled: bool,
    pub timeout: u64,
    pub retries: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WebhookPreset {
    Slack,
    Discord,
    Notion,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookPayload {
    pub event: String,
    pub data: serde_json::Value,
    pub timestamp: i64,
}

#[derive(Debug, Clone)]
pub struct WebhookService {
    client: Client,
}

impl WebhookService {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap();

        Self { client }
    }

    /// Trigger a webhook with payload
    pub async fn trigger(
        &self,
        config: &WebhookConfig,
        payload: WebhookPayload,
    ) -> Result<(), String> {
        if !config.enabled {
            return Err("Webhook is disabled".to_string());
        }

        log::info!("Triggering webhook: {}", config.name);

        // Format payload based on preset
        let body = match &config.preset {
            Some(WebhookPreset::Slack) => self.format_slack_payload(&payload),
            Some(WebhookPreset::Discord) => self.format_discord_payload(&payload),
            Some(WebhookPreset::Notion) => payload.data.clone(),
            _ => serde_json::to_value(&payload).unwrap(),
        };

        // Send request with retries
        self.send_with_retries(config, body).await
    }

    /// Send HTTP request with retry logic
    async fn send_with_retries(
        &self,
        config: &WebhookConfig,
        body: serde_json::Value,
    ) -> Result<(), String> {
        let mut last_error = String::new();

        for attempt in 0..config.retries {
            if attempt > 0 {
                log::warn!("Retrying webhook {} (attempt {})", config.name, attempt + 1);
                tokio::time::sleep(Duration::from_secs(2_u64.pow(attempt))).await;
            }

            match self.send_request(config, &body).await {
                Ok(_) => {
                    log::info!("Webhook {} succeeded", config.name);
                    return Ok(());
                }
                Err(e) => {
                    last_error = e;
                    log::warn!("Webhook {} failed: {}", config.name, last_error);
                }
            }
        }

        Err(format!(
            "Webhook failed after {} retries: {}",
            config.retries, last_error
        ))
    }

    /// Send single HTTP request
    async fn send_request(
        &self,
        config: &WebhookConfig,
        body: &serde_json::Value,
    ) -> Result<(), String> {
        let timeout = Duration::from_millis(config.timeout);

        let mut request = match config.method.to_uppercase().as_str() {
            "GET" => self.client.get(&config.url),
            "POST" => self.client.post(&config.url),
            "PUT" => self.client.put(&config.url),
            "PATCH" => self.client.patch(&config.url),
            _ => return Err(format!("Unsupported HTTP method: {}", config.method)),
        };

        // Add headers
        for (key, value) in &config.headers {
            request = request.header(key, value);
        }

        // Add default Content-Type if not specified
        if !config.headers.contains_key("Content-Type") {
            request = request.header("Content-Type", "application/json");
        }

        // Send request
        let response = request
            .json(body)
            .timeout(timeout)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        // Check response status
        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!(
                "HTTP {} - {}",
                response.status(),
                response.text().await.unwrap_or_default()
            ))
        }
    }

    /// Format payload for Slack Incoming Webhook
    fn format_slack_payload(&self, payload: &WebhookPayload) -> serde_json::Value {
        let text = payload
            .data
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("Event triggered");

        let color = match payload.event.as_str() {
            "error" => "#ff0000",
            "warning" => "#ffaa00",
            "success" => "#00ff00",
            _ => "#0099ff",
        };

        serde_json::json!({
            "text": format!("🌳 Garden of Eden V3 - {}", payload.event),
            "attachments": [{
                "color": color,
                "text": text,
                "footer": "Garden of Eden V3",
                "ts": payload.timestamp
            }]
        })
    }

    /// Format payload for Discord Webhook
    fn format_discord_payload(&self, payload: &WebhookPayload) -> serde_json::Value {
        let description = payload
            .data
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("Event triggered");

        let color = match payload.event.as_str() {
            "error" => 16711680,      // Red
            "warning" => 16755200,    // Orange
            "success" => 65280,       // Green
            _ => 39423,               // Blue
        };

        serde_json::json!({
            "embeds": [{
                "title": format!("🌳 Garden of Eden V3 - {}", payload.event),
                "description": description,
                "color": color,
                "footer": {
                    "text": "Garden of Eden V3"
                },
                "timestamp": chrono::DateTime::from_timestamp(payload.timestamp, 0)
                    .unwrap()
                    .to_rfc3339()
            }]
        })
    }

    /// Test webhook connection
    pub async fn test(&self, config: &WebhookConfig) -> Result<String, String> {
        let test_payload = WebhookPayload {
            event: "test".to_string(),
            data: serde_json::json!({
                "message": "Test message from Garden of Eden V3"
            }),
            timestamp: chrono::Utc::now().timestamp(),
        };

        self.trigger(config, test_payload).await?;

        Ok("Webhook test successful".to_string())
    }
}

impl Default for WebhookService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_webhook_config_creation() {
        let config = WebhookConfig {
            name: "test".to_string(),
            preset: Some(WebhookPreset::Slack),
            url: "https://hooks.slack.com/services/test".to_string(),
            method: "POST".to_string(),
            headers: HashMap::new(),
            enabled: true,
            timeout: 5000,
            retries: 3,
        };

        assert_eq!(config.name, "test");
        assert_eq!(config.preset, Some(WebhookPreset::Slack));
    }

    #[test]
    fn test_slack_payload_formatting() {
        let service = WebhookService::new();
        let payload = WebhookPayload {
            event: "error".to_string(),
            data: serde_json::json!({
                "message": "Test error message"
            }),
            timestamp: 1234567890,
        };

        let formatted = service.format_slack_payload(&payload);
        assert!(formatted.get("text").is_some());
        assert!(formatted.get("attachments").is_some());
    }

    #[test]
    fn test_discord_payload_formatting() {
        let service = WebhookService::new();
        let payload = WebhookPayload {
            event: "success".to_string(),
            data: serde_json::json!({
                "message": "Test success message"
            }),
            timestamp: 1234567890,
        };

        let formatted = service.format_discord_payload(&payload);
        assert!(formatted.get("embeds").is_some());
    }
}

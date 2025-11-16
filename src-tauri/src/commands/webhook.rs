use crate::services::webhook::{WebhookConfig, WebhookPayload, WebhookPreset, WebhookService};
use crate::AppState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookRecord {
    pub name: String,
    pub preset: Option<String>,
    pub url: String,
    pub method: String,
    pub headers: String, // JSON string
    pub enabled: bool,
    pub timeout: i64,
    pub retries: i64,
    pub created_at: i64,
    pub last_used_at: Option<i64>,
}

impl WebhookRecord {
    fn to_config(&self) -> Result<WebhookConfig, String> {
        let preset = self.preset.as_ref().and_then(|p| match p.as_str() {
            "slack" => Some(WebhookPreset::Slack),
            "discord" => Some(WebhookPreset::Discord),
            "notion" => Some(WebhookPreset::Notion),
            "custom" => Some(WebhookPreset::Custom),
            _ => None,
        });

        let headers: HashMap<String, String> =
            serde_json::from_str(&self.headers).unwrap_or_default();

        Ok(WebhookConfig {
            name: self.name.clone(),
            preset,
            url: self.url.clone(),
            method: self.method.clone(),
            headers,
            enabled: self.enabled,
            timeout: self.timeout as u64,
            retries: self.retries as u32,
        })
    }
}

/// Register or update a webhook
#[tauri::command]
pub async fn register_webhook(
    state: State<'_, AppState>,
    name: String,
    preset: Option<String>,
    url: String,
    method: Option<String>,
    headers: Option<String>,
    enabled: Option<bool>,
    timeout: Option<i64>,
    retries: Option<i64>,
) -> Result<(), String> {
    log::info!("Registering webhook: {}", name);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();
    let now = chrono::Utc::now().timestamp();

    let method = method.unwrap_or_else(|| "POST".to_string());
    let headers = headers.unwrap_or_else(|| "{}".to_string());
    let enabled = enabled.unwrap_or(true);
    let timeout = timeout.unwrap_or(5000);
    let retries = retries.unwrap_or(3);

    // Validate preset if provided
    if let Some(ref p) = preset {
        if !matches!(p.as_str(), "slack" | "discord" | "notion" | "custom") {
            return Err(format!("Invalid preset: {}", p));
        }
    }

    conn.execute(
        "INSERT OR REPLACE INTO webhooks
         (name, preset, url, method, headers, enabled, timeout, retries, created_at, last_used_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            name,
            preset,
            url,
            method,
            headers,
            enabled,
            timeout,
            retries,
            now,
            None::<i64>,
        ],
    )
    .map_err(|e| format!("Failed to register webhook: {}", e))?;

    log::info!("Webhook {} registered successfully", name);
    Ok(())
}

/// List all webhooks
#[tauri::command]
pub async fn list_webhooks(state: State<'_, AppState>) -> Result<Vec<WebhookRecord>, String> {
    log::info!("Listing all webhooks");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut stmt = conn
        .prepare(
            "SELECT name, preset, url, method, headers, enabled, timeout, retries, created_at, last_used_at
             FROM webhooks
             ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let webhooks = stmt
        .query_map([], |row| {
            Ok(WebhookRecord {
                name: row.get(0)?,
                preset: row.get(1)?,
                url: row.get(2)?,
                method: row.get(3)?,
                headers: row.get(4)?,
                enabled: row.get(5)?,
                timeout: row.get(6)?,
                retries: row.get(7)?,
                created_at: row.get(8)?,
                last_used_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    log::info!("Found {} webhooks", webhooks.len());
    Ok(webhooks)
}

/// Get a specific webhook by name
#[tauri::command]
pub async fn get_webhook(
    state: State<'_, AppState>,
    name: String,
) -> Result<WebhookRecord, String> {
    log::info!("Getting webhook: {}", name);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let webhook = conn
        .query_row(
            "SELECT name, preset, url, method, headers, enabled, timeout, retries, created_at, last_used_at
             FROM webhooks
             WHERE name = ?1",
            [&name],
            |row| {
                Ok(WebhookRecord {
                    name: row.get(0)?,
                    preset: row.get(1)?,
                    url: row.get(2)?,
                    method: row.get(3)?,
                    headers: row.get(4)?,
                    enabled: row.get(5)?,
                    timeout: row.get(6)?,
                    retries: row.get(7)?,
                    created_at: row.get(8)?,
                    last_used_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| format!("Webhook not found: {}", e))?;

    Ok(webhook)
}

/// Delete a webhook
#[tauri::command]
pub async fn delete_webhook(state: State<'_, AppState>, name: String) -> Result<(), String> {
    log::info!("Deleting webhook: {}", name);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let deleted = conn
        .execute("DELETE FROM webhooks WHERE name = ?1", [&name])
        .map_err(|e| e.to_string())?;

    if deleted == 0 {
        return Err(format!("Webhook not found: {}", name));
    }

    log::info!("Webhook {} deleted", name);
    Ok(())
}

/// Toggle webhook enabled status
#[tauri::command]
pub async fn toggle_webhook(
    state: State<'_, AppState>,
    name: String,
    enabled: bool,
) -> Result<(), String> {
    log::info!("Toggling webhook {}: {}", name, enabled);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    conn.execute(
        "UPDATE webhooks SET enabled = ?1 WHERE name = ?2",
        rusqlite::params![enabled, name],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Trigger a webhook manually
#[tauri::command]
pub async fn trigger_webhook(
    state: State<'_, AppState>,
    name: String,
    event: String,
    data: serde_json::Value,
) -> Result<(), String> {
    log::info!("Triggering webhook: {} for event: {}", name, event);

    // Get webhook config from database
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let record = conn
        .query_row(
            "SELECT name, preset, url, method, headers, enabled, timeout, retries, created_at, last_used_at
             FROM webhooks
             WHERE name = ?1",
            [&name],
            |row| {
                Ok(WebhookRecord {
                    name: row.get(0)?,
                    preset: row.get(1)?,
                    url: row.get(2)?,
                    method: row.get(3)?,
                    headers: row.get(4)?,
                    enabled: row.get(5)?,
                    timeout: row.get(6)?,
                    retries: row.get(7)?,
                    created_at: row.get(8)?,
                    last_used_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| format!("Webhook not found: {}", e))?;

    drop(conn);
    drop(db);

    let config = record.to_config()?;

    // Create payload
    let payload = WebhookPayload {
        event,
        data,
        timestamp: chrono::Utc::now().timestamp(),
    };

    // Trigger webhook
    let webhook_service = WebhookService::new();
    webhook_service.trigger(&config, payload).await?;

    // Update last_used_at
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();
    let now = chrono::Utc::now().timestamp();

    conn.execute(
        "UPDATE webhooks SET last_used_at = ?1 WHERE name = ?2",
        rusqlite::params![now, name],
    )
    .map_err(|e| e.to_string())?;

    log::info!("Webhook {} triggered successfully", name);
    Ok(())
}

/// Test webhook connection
#[tauri::command]
pub async fn test_webhook(state: State<'_, AppState>, name: String) -> Result<String, String> {
    log::info!("Testing webhook: {}", name);

    // Get webhook config
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let record = conn
        .query_row(
            "SELECT name, preset, url, method, headers, enabled, timeout, retries, created_at, last_used_at
             FROM webhooks
             WHERE name = ?1",
            [&name],
            |row| {
                Ok(WebhookRecord {
                    name: row.get(0)?,
                    preset: row.get(1)?,
                    url: row.get(2)?,
                    method: row.get(3)?,
                    headers: row.get(4)?,
                    enabled: row.get(5)?,
                    timeout: row.get(6)?,
                    retries: row.get(7)?,
                    created_at: row.get(8)?,
                    last_used_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| format!("Webhook not found: {}", e))?;

    drop(conn);
    drop(db);

    let config = record.to_config()?;

    // Test webhook
    let webhook_service = WebhookService::new();
    webhook_service.test(&config).await
}

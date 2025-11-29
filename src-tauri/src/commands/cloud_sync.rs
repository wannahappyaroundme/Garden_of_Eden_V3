//! Cloud Sync IPC Commands
//!
//! Provides Tauri commands for Google Drive backup and restore functionality.

use crate::services::cloud_sync::{
    BackupData, BackupMetadata, CloudSyncService, CloudToken, MemoriesBackup, PersonaBackup,
    SettingsBackup, SyncStatus,
};
use chrono::Utc;
use log::{error, info};
use oauth2::{CsrfToken, PkceCodeVerifier};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

/// OAuth state storage for cloud sync
pub struct CloudSyncOAuthState {
    pub csrf_token: Option<CsrfToken>,
    pub pkce_verifier: Option<PkceCodeVerifier>,
}

/// Cloud sync service wrapper for AppState
pub struct CloudSyncServiceWrapper {
    pub service: Arc<Mutex<Option<CloudSyncService>>>,
    pub oauth_state: Arc<Mutex<CloudSyncOAuthState>>,
}

impl CloudSyncServiceWrapper {
    pub fn new() -> Self {
        Self {
            service: Arc::new(Mutex::new(None)),
            oauth_state: Arc::new(Mutex::new(CloudSyncOAuthState {
                csrf_token: None,
                pkce_verifier: None,
            })),
        }
    }
}

impl Default for CloudSyncServiceWrapper {
    fn default() -> Self {
        Self::new()
    }
}

/// Backup request from frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupRequest {
    pub persona_name: String,
    pub traits: Vec<String>,
    pub communication_style: String,
    pub knowledge_domains: Vec<String>,
    pub custom_instructions: Option<String>,
    pub theme: String,
    pub language: String,
    pub llm_settings: serde_json::Value,
    pub tool_settings: serde_json::Value,
    pub include_memories: bool,
}

/// Initialize cloud sync service with OAuth credentials
#[tauri::command]
pub async fn cloud_sync_initialize(
    state: State<'_, crate::AppState>,
    client_id: String,
    client_secret: String,
) -> Result<(), String> {
    info!("Initializing cloud sync service");

    let service = CloudSyncService::with_credentials(client_id, client_secret)
        .map_err(|e| format!("Failed to initialize cloud sync service: {}", e))?;

    *state
        .cloud_sync_service
        .service
        .lock()
        .map_err(|e| format!("Lock error: {}", e))? = Some(service);

    info!("Cloud sync service initialized successfully");
    Ok(())
}

/// Start OAuth flow for Google Drive access
#[tauri::command]
pub async fn cloud_sync_start_oauth(state: State<'_, crate::AppState>) -> Result<String, String> {
    info!("Starting cloud sync OAuth flow");

    let service = {
        let service_guard = state
            .cloud_sync_service
            .service
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        service_guard
            .clone()
            .ok_or("Cloud sync service not initialized")?
    };

    let (auth_url, csrf_token, pkce_verifier) = service
        .start_oauth_flow()
        .map_err(|e| format!("Failed to start OAuth flow: {}", e))?;

    // Store OAuth state
    let mut oauth_state = state
        .cloud_sync_service
        .oauth_state
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    oauth_state.csrf_token = Some(csrf_token);
    oauth_state.pkce_verifier = Some(pkce_verifier);

    info!("Cloud sync OAuth flow started");
    Ok(auth_url)
}

/// Complete OAuth flow with authorization code
#[tauri::command]
pub async fn cloud_sync_complete_oauth(
    state: State<'_, crate::AppState>,
    code: String,
    received_state: String,
) -> Result<CloudToken, String> {
    info!("Completing cloud sync OAuth flow");

    // Verify CSRF token and get PKCE verifier
    let pkce_verifier = {
        let mut oauth_state = state
            .cloud_sync_service
            .oauth_state
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        let csrf_token = oauth_state
            .csrf_token
            .take()
            .ok_or("No OAuth flow in progress")?;

        if csrf_token.secret() != &received_state {
            error!("CSRF token mismatch");
            return Err("CSRF token mismatch, possible security issue".to_string());
        }

        oauth_state
            .pkce_verifier
            .take()
            .ok_or("No PKCE verifier found")?
    };

    let service = {
        let service_guard = state
            .cloud_sync_service
            .service
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        service_guard
            .clone()
            .ok_or("Cloud sync service not initialized")?
    };

    let token = service
        .complete_oauth_flow(code, pkce_verifier.secret().to_string())
        .await
        .map_err(|e| format!("Failed to complete OAuth: {}", e))?;

    info!("Cloud sync OAuth completed successfully");
    Ok(token)
}

/// Check if authenticated with Google Drive
#[tauri::command]
pub async fn cloud_sync_is_authenticated(state: State<'_, crate::AppState>) -> Result<bool, String> {
    let service_guard = state
        .cloud_sync_service
        .service
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    Ok(service_guard
        .as_ref()
        .map(|s| s.is_authenticated())
        .unwrap_or(false))
}

/// Sign out from Google Drive
#[tauri::command]
pub async fn cloud_sync_sign_out(state: State<'_, crate::AppState>) -> Result<(), String> {
    info!("Signing out from cloud sync");

    let service_guard = state
        .cloud_sync_service
        .service
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if let Some(service) = service_guard.as_ref() {
        service
            .sign_out()
            .map_err(|e| format!("Sign out failed: {}", e))?;
    }

    info!("Signed out from cloud sync");
    Ok(())
}

/// Get sync status
#[tauri::command]
pub async fn cloud_sync_get_status(state: State<'_, crate::AppState>) -> Result<SyncStatus, String> {
    let service_guard = state
        .cloud_sync_service
        .service
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    Ok(service_guard
        .as_ref()
        .map(|s| s.get_sync_status())
        .unwrap_or(SyncStatus {
            is_authenticated: false,
            last_backup: None,
            last_restore: None,
            auto_backup_enabled: false,
            backup_count: 0,
        }))
}

/// Upload backup to Google Drive
#[tauri::command]
pub async fn cloud_sync_upload_backup(
    state: State<'_, crate::AppState>,
    request: BackupRequest,
) -> Result<BackupMetadata, String> {
    info!("Uploading backup to cloud");

    let service = {
        let service_guard = state
            .cloud_sync_service
            .service
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        service_guard
            .clone()
            .ok_or("Cloud sync service not initialized")?
    };

    let backup = BackupData {
        version: env!("CARGO_PKG_VERSION").to_string(),
        created_at: Utc::now(),
        persona: PersonaBackup {
            name: request.persona_name,
            traits: request.traits,
            communication_style: request.communication_style,
            knowledge_domains: request.knowledge_domains,
            custom_instructions: request.custom_instructions,
        },
        settings: SettingsBackup {
            theme: request.theme,
            language: request.language,
            llm_settings: request.llm_settings,
            tool_settings: request.tool_settings,
        },
        memories: if request.include_memories {
            // TODO: Implement memory export from database
            Some(MemoriesBackup {
                conversation_summaries: vec![],
                episodic_memories: vec![],
                knowledge_graph: None,
            })
        } else {
            None
        },
    };

    let metadata = service
        .upload_backup(&backup)
        .await
        .map_err(|e| format!("Backup upload failed: {}", e))?;

    info!("Backup uploaded successfully: {}", metadata.id);
    Ok(metadata)
}

/// List all backups from Google Drive
#[tauri::command]
pub async fn cloud_sync_list_backups(
    state: State<'_, crate::AppState>,
) -> Result<Vec<BackupMetadata>, String> {
    info!("Listing cloud backups");

    let service = {
        let service_guard = state
            .cloud_sync_service
            .service
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        service_guard
            .clone()
            .ok_or("Cloud sync service not initialized")?
    };

    let backups = service
        .list_backups()
        .await
        .map_err(|e| format!("Failed to list backups: {}", e))?;

    info!("Found {} backups", backups.len());
    Ok(backups)
}

/// Download and restore backup from Google Drive
#[tauri::command]
pub async fn cloud_sync_download_backup(
    state: State<'_, crate::AppState>,
    file_id: String,
) -> Result<BackupData, String> {
    info!("Downloading backup: {}", file_id);

    let service = {
        let service_guard = state
            .cloud_sync_service
            .service
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        service_guard
            .clone()
            .ok_or("Cloud sync service not initialized")?
    };

    let backup = service
        .download_backup(&file_id)
        .await
        .map_err(|e| format!("Failed to download backup: {}", e))?;

    info!("Backup downloaded successfully");
    Ok(backup)
}

/// Delete backup from Google Drive
#[tauri::command]
pub async fn cloud_sync_delete_backup(
    state: State<'_, crate::AppState>,
    file_id: String,
) -> Result<(), String> {
    info!("Deleting backup: {}", file_id);

    let service = {
        let service_guard = state
            .cloud_sync_service
            .service
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        service_guard
            .clone()
            .ok_or("Cloud sync service not initialized")?
    };

    service
        .delete_backup(&file_id)
        .await
        .map_err(|e| format!("Failed to delete backup: {}", e))?;

    info!("Backup deleted successfully");
    Ok(())
}

/// Refresh OAuth token
#[tauri::command]
pub async fn cloud_sync_refresh_token(
    state: State<'_, crate::AppState>,
) -> Result<CloudToken, String> {
    info!("Refreshing cloud sync token");

    let service = {
        let service_guard = state
            .cloud_sync_service
            .service
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        service_guard
            .clone()
            .ok_or("Cloud sync service not initialized")?
    };

    let token = service
        .refresh_token()
        .await
        .map_err(|e| format!("Token refresh failed: {}", e))?;

    info!("Token refreshed successfully");
    Ok(token)
}

/// Set token manually (for restoring saved tokens)
#[tauri::command]
pub async fn cloud_sync_set_token(
    state: State<'_, crate::AppState>,
    token: CloudToken,
) -> Result<(), String> {
    info!("Setting cloud sync token manually");

    let service = {
        let service_guard = state
            .cloud_sync_service
            .service
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        service_guard
            .clone()
            .ok_or("Cloud sync service not initialized")?
    };

    service
        .set_token(token)
        .map_err(|e| format!("Failed to set token: {}", e))?;

    info!("Token set successfully");
    Ok(())
}

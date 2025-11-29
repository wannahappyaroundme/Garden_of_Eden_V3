//! Google Drive Cloud Sync Service
//!
//! Provides OAuth 2.0 authentication and backup/restore functionality
//! for persona settings and app data synchronization.

#![allow(dead_code)] // Phase 6: Cloud sync (requires user OAuth setup)

use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use log::{error, info, warn};
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, RefreshToken,
    Scope, TokenResponse, TokenUrl,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Google Drive OAuth configuration
const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_API: &str = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_API: &str = "https://www.googleapis.com/upload/drive/v3";
const REDIRECT_URI: &str = "http://localhost:8765/callback";

/// App folder name in Google Drive
const APP_FOLDER_NAME: &str = "Garden of Eden V3";

/// OAuth token storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudToken {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: i64,
    pub token_type: String,
}

/// Backup metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupMetadata {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub size: i64,
    pub version: String,
}

/// Backup data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupData {
    pub version: String,
    pub created_at: DateTime<Utc>,
    pub persona: PersonaBackup,
    pub settings: SettingsBackup,
    pub memories: Option<MemoriesBackup>,
}

/// Persona backup data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonaBackup {
    pub name: String,
    pub traits: Vec<String>,
    pub communication_style: String,
    pub knowledge_domains: Vec<String>,
    pub custom_instructions: Option<String>,
}

/// Settings backup data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingsBackup {
    pub theme: String,
    pub language: String,
    pub llm_settings: serde_json::Value,
    pub tool_settings: serde_json::Value,
}

/// Memories backup data (optional, can be large)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoriesBackup {
    pub conversation_summaries: Vec<serde_json::Value>,
    pub episodic_memories: Vec<serde_json::Value>,
    pub knowledge_graph: Option<serde_json::Value>,
}

/// Google Drive file metadata response
#[derive(Debug, Deserialize)]
struct DriveFile {
    id: String,
    name: String,
    #[serde(rename = "createdTime")]
    created_time: Option<String>,
    #[serde(rename = "modifiedTime")]
    modified_time: Option<String>,
    size: Option<String>,
    #[serde(rename = "mimeType")]
    mime_type: Option<String>,
}

/// Google Drive files list response
#[derive(Debug, Deserialize)]
struct DriveFileList {
    files: Option<Vec<DriveFile>>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
}

/// Sync status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub is_authenticated: bool,
    pub last_backup: Option<DateTime<Utc>>,
    pub last_restore: Option<DateTime<Utc>>,
    pub auto_backup_enabled: bool,
    pub backup_count: i32,
}

/// Google Drive Cloud Sync service
#[derive(Clone)]
pub struct CloudSyncService {
    client: Client,
    token: Arc<Mutex<Option<CloudToken>>>,
    oauth_client: Option<BasicClient>,
    app_folder_id: Arc<Mutex<Option<String>>>,
    last_backup: Arc<Mutex<Option<DateTime<Utc>>>>,
    last_restore: Arc<Mutex<Option<DateTime<Utc>>>>,
}

impl CloudSyncService {
    /// Create a new cloud sync service without OAuth credentials
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            token: Arc::new(Mutex::new(None)),
            oauth_client: None,
            app_folder_id: Arc::new(Mutex::new(None)),
            last_backup: Arc::new(Mutex::new(None)),
            last_restore: Arc::new(Mutex::new(None)),
        }
    }

    /// Initialize with OAuth credentials
    pub fn with_credentials(client_id: String, client_secret: String) -> Result<Self> {
        let oauth_client = BasicClient::new(
            ClientId::new(client_id),
            Some(ClientSecret::new(client_secret)),
            AuthUrl::new(GOOGLE_AUTH_URL.to_string())?,
            Some(TokenUrl::new(GOOGLE_TOKEN_URL.to_string())?),
        )
        .set_redirect_uri(RedirectUrl::new(REDIRECT_URI.to_string())?);

        Ok(Self {
            client: Client::new(),
            token: Arc::new(Mutex::new(None)),
            oauth_client: Some(oauth_client),
            app_folder_id: Arc::new(Mutex::new(None)),
            last_backup: Arc::new(Mutex::new(None)),
            last_restore: Arc::new(Mutex::new(None)),
        })
    }

    /// Start OAuth flow and return authorization URL
    pub fn start_oauth_flow(&self) -> Result<(String, CsrfToken, PkceCodeVerifier)> {
        let oauth_client = self
            .oauth_client
            .as_ref()
            .ok_or_else(|| anyhow!("OAuth client not initialized"))?;

        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

        let (auth_url, csrf_token) = oauth_client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new(
                "https://www.googleapis.com/auth/drive.file".to_string(),
            ))
            .add_scope(Scope::new(
                "https://www.googleapis.com/auth/drive.appdata".to_string(),
            ))
            .set_pkce_challenge(pkce_challenge)
            .url();

        info!("Cloud sync OAuth authorization URL generated");
        Ok((auth_url.to_string(), csrf_token, pkce_verifier))
    }

    /// Complete OAuth flow with authorization code
    pub async fn complete_oauth_flow(
        &self,
        code: String,
        pkce_verifier: String,
    ) -> Result<CloudToken> {
        let oauth_client = self
            .oauth_client
            .as_ref()
            .ok_or_else(|| anyhow!("OAuth client not initialized"))?;

        info!("Exchanging authorization code for cloud sync tokens");

        let token_result = oauth_client
            .exchange_code(AuthorizationCode::new(code))
            .set_pkce_verifier(oauth2::PkceCodeVerifier::new(pkce_verifier))
            .request_async(async_http_client)
            .await
            .map_err(|e| anyhow!("Token exchange failed: {}", e))?;

        let expires_at = Utc::now().timestamp()
            + token_result
                .expires_in()
                .map(|d| d.as_secs() as i64)
                .unwrap_or(3600);

        let token = CloudToken {
            access_token: token_result.access_token().secret().to_string(),
            refresh_token: token_result
                .refresh_token()
                .map(|t| t.secret().to_string()),
            expires_at,
            token_type: "Bearer".to_string(),
        };

        // Store token
        *self
            .token
            .lock()
            .map_err(|e| anyhow!("Token lock failed: {}", e))? = Some(token.clone());
        info!("Cloud sync OAuth tokens obtained and stored");

        Ok(token)
    }

    /// Refresh access token
    pub async fn refresh_token(&self) -> Result<CloudToken> {
        let oauth_client = self
            .oauth_client
            .as_ref()
            .ok_or_else(|| anyhow!("OAuth client not initialized"))?;

        let current_token = self
            .token
            .lock()
            .map_err(|e| anyhow!("Token lock failed: {}", e))?
            .clone()
            .ok_or_else(|| anyhow!("No token to refresh"))?;

        let refresh_token = current_token
            .refresh_token
            .ok_or_else(|| anyhow!("No refresh token available"))?;

        info!("Refreshing cloud sync access token");

        let token_result = oauth_client
            .exchange_refresh_token(&RefreshToken::new(refresh_token.clone()))
            .request_async(async_http_client)
            .await
            .map_err(|e| anyhow!("Token refresh failed: {}", e))?;

        let expires_at = Utc::now().timestamp()
            + token_result
                .expires_in()
                .map(|d| d.as_secs() as i64)
                .unwrap_or(3600);

        let new_token = CloudToken {
            access_token: token_result.access_token().secret().to_string(),
            refresh_token: token_result
                .refresh_token()
                .map(|t| t.secret().to_string())
                .or(Some(refresh_token)),
            expires_at,
            token_type: "Bearer".to_string(),
        };

        *self
            .token
            .lock()
            .map_err(|e| anyhow!("Token lock failed: {}", e))? = Some(new_token.clone());
        info!("Cloud sync access token refreshed");

        Ok(new_token)
    }

    /// Set access token manually
    pub fn set_token(&self, token: CloudToken) -> Result<()> {
        *self
            .token
            .lock()
            .map_err(|e| anyhow!("Token lock failed: {}", e))? = Some(token);
        info!("Cloud sync access token set manually");
        Ok(())
    }

    /// Check if authenticated
    pub fn is_authenticated(&self) -> bool {
        self.token
            .lock()
            .ok()
            .and_then(|guard| guard.as_ref().map(|t| t.expires_at > Utc::now().timestamp()))
            .unwrap_or(false)
    }

    /// Get current access token
    fn get_access_token(&self) -> Result<String> {
        let token_guard = self
            .token
            .lock()
            .map_err(|e| anyhow!("Token lock failed: {}", e))?;

        match &*token_guard {
            Some(token) => {
                if token.expires_at <= Utc::now().timestamp() {
                    warn!("Cloud sync access token expired");
                    return Err(anyhow!("Access token expired, please re-authenticate"));
                }
                Ok(token.access_token.clone())
            }
            None => Err(anyhow!("Not authenticated, please sign in first")),
        }
    }

    /// Get or create app folder in Google Drive
    async fn get_or_create_app_folder(&self) -> Result<String> {
        // Check cache first
        if let Some(folder_id) = self
            .app_folder_id
            .lock()
            .map_err(|e| anyhow!("Folder ID lock failed: {}", e))?
            .clone()
        {
            return Ok(folder_id);
        }

        let access_token = self.get_access_token()?;

        // Search for existing folder
        let query = format!(
            "name='{}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            APP_FOLDER_NAME
        );
        let url = format!("{}?q={}", GOOGLE_DRIVE_API, urlencoding::encode(&query));

        let response = self
            .client
            .get(&url)
            .bearer_auth(&access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Folder search failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to search for app folder: {}", status));
        }

        let file_list: DriveFileList = response.json().await?;

        let folder_id = if let Some(files) = file_list.files {
            if let Some(folder) = files.first() {
                info!("Found existing app folder: {}", folder.id);
                folder.id.clone()
            } else {
                // Create new folder
                self.create_app_folder().await?
            }
        } else {
            // Create new folder
            self.create_app_folder().await?
        };

        // Cache the folder ID
        *self
            .app_folder_id
            .lock()
            .map_err(|e| anyhow!("Folder ID lock failed: {}", e))? = Some(folder_id.clone());

        Ok(folder_id)
    }

    /// Create app folder in Google Drive
    async fn create_app_folder(&self) -> Result<String> {
        let access_token = self.get_access_token()?;

        let metadata = serde_json::json!({
            "name": APP_FOLDER_NAME,
            "mimeType": "application/vnd.google-apps.folder"
        });

        let url = format!("{}/files", GOOGLE_DRIVE_API);
        let response = self
            .client
            .post(&url)
            .bearer_auth(&access_token)
            .json(&metadata)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Folder creation failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to create app folder: {}", status));
        }

        let file: DriveFile = response.json().await?;
        info!("Created app folder: {}", file.id);
        Ok(file.id)
    }

    /// Upload backup to Google Drive
    pub async fn upload_backup(&self, backup: &BackupData) -> Result<BackupMetadata> {
        let access_token = self.get_access_token()?;
        let folder_id = self.get_or_create_app_folder().await?;

        let backup_name = format!("backup_{}.json", Utc::now().format("%Y%m%d_%H%M%S"));
        let backup_json = serde_json::to_string_pretty(backup)?;

        info!("Uploading backup: {} ({} bytes)", backup_name, backup_json.len());

        // Multipart upload
        let metadata = serde_json::json!({
            "name": backup_name,
            "parents": [folder_id],
            "mimeType": "application/json"
        });

        let form = reqwest::multipart::Form::new()
            .text("metadata", serde_json::to_string(&metadata)?)
            .text("file", backup_json.clone());

        let url = format!(
            "{}/files?uploadType=multipart",
            GOOGLE_DRIVE_UPLOAD_API
        );

        let response = self
            .client
            .post(&url)
            .bearer_auth(&access_token)
            .multipart(form)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Backup upload failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to upload backup: {}", status));
        }

        let file: DriveFile = response.json().await?;
        info!("Backup uploaded successfully: {}", file.id);

        // Update last backup time
        *self
            .last_backup
            .lock()
            .map_err(|e| anyhow!("Last backup lock failed: {}", e))? = Some(Utc::now());

        Ok(BackupMetadata {
            id: file.id,
            name: backup_name,
            created_at: backup.created_at,
            modified_at: Utc::now(),
            size: backup_json.len() as i64,
            version: backup.version.clone(),
        })
    }

    /// List all backups
    pub async fn list_backups(&self) -> Result<Vec<BackupMetadata>> {
        let access_token = self.get_access_token()?;
        let folder_id = self.get_or_create_app_folder().await?;

        let query = format!(
            "'{}' in parents and mimeType='application/json' and trashed=false",
            folder_id
        );
        let url = format!(
            "{}/files?q={}&orderBy=modifiedTime desc&fields=files(id,name,createdTime,modifiedTime,size)",
            GOOGLE_DRIVE_API,
            urlencoding::encode(&query)
        );

        let response = self
            .client
            .get(&url)
            .bearer_auth(&access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Backup list failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to list backups: {}", status));
        }

        let file_list: DriveFileList = response.json().await?;
        let backups = file_list
            .files
            .unwrap_or_default()
            .into_iter()
            .filter_map(|f| {
                Some(BackupMetadata {
                    id: f.id,
                    name: f.name,
                    created_at: f
                        .created_time
                        .as_ref()
                        .and_then(|t| DateTime::parse_from_rfc3339(t).ok())
                        .map(|t| t.with_timezone(&Utc))
                        .unwrap_or_else(Utc::now),
                    modified_at: f
                        .modified_time
                        .as_ref()
                        .and_then(|t| DateTime::parse_from_rfc3339(t).ok())
                        .map(|t| t.with_timezone(&Utc))
                        .unwrap_or_else(Utc::now),
                    size: f.size.as_ref().and_then(|s| s.parse().ok()).unwrap_or(0),
                    version: "unknown".to_string(),
                })
            })
            .collect();

        Ok(backups)
    }

    /// Download backup by ID
    pub async fn download_backup(&self, file_id: &str) -> Result<BackupData> {
        let access_token = self.get_access_token()?;

        let url = format!("{}/files/{}?alt=media", GOOGLE_DRIVE_API, file_id);
        let response = self
            .client
            .get(&url)
            .bearer_auth(&access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Backup download failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to download backup: {}", status));
        }

        let backup_json = response.text().await?;
        let backup: BackupData = serde_json::from_str(&backup_json)?;

        // Update last restore time
        *self
            .last_restore
            .lock()
            .map_err(|e| anyhow!("Last restore lock failed: {}", e))? = Some(Utc::now());

        info!("Backup downloaded successfully");
        Ok(backup)
    }

    /// Delete backup by ID
    pub async fn delete_backup(&self, file_id: &str) -> Result<()> {
        let access_token = self.get_access_token()?;

        let url = format!("{}/files/{}", GOOGLE_DRIVE_API, file_id);
        let response = self
            .client
            .delete(&url)
            .bearer_auth(&access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Backup delete failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to delete backup: {}", status));
        }

        info!("Backup deleted: {}", file_id);
        Ok(())
    }

    /// Get sync status
    pub fn get_sync_status(&self) -> SyncStatus {
        SyncStatus {
            is_authenticated: self.is_authenticated(),
            last_backup: self.last_backup.lock().ok().and_then(|g| *g),
            last_restore: self.last_restore.lock().ok().and_then(|g| *g),
            auto_backup_enabled: false, // TODO: implement auto-backup setting
            backup_count: 0,            // Will be populated by list_backups
        }
    }

    /// Sign out and clear tokens
    pub fn sign_out(&self) -> Result<()> {
        *self
            .token
            .lock()
            .map_err(|e| anyhow!("Token lock failed: {}", e))? = None;
        *self
            .app_folder_id
            .lock()
            .map_err(|e| anyhow!("Folder ID lock failed: {}", e))? = None;
        info!("Signed out from cloud sync");
        Ok(())
    }
}

impl Default for CloudSyncService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cloud_sync_service_creation() {
        let service = CloudSyncService::new();
        assert!(!service.is_authenticated());
    }

    #[test]
    fn test_backup_data_serialization() {
        let backup = BackupData {
            version: "3.6.0".to_string(),
            created_at: Utc::now(),
            persona: PersonaBackup {
                name: "Eden".to_string(),
                traits: vec!["friendly".to_string(), "helpful".to_string()],
                communication_style: "casual".to_string(),
                knowledge_domains: vec!["technology".to_string()],
                custom_instructions: None,
            },
            settings: SettingsBackup {
                theme: "dark".to_string(),
                language: "en".to_string(),
                llm_settings: serde_json::json!({}),
                tool_settings: serde_json::json!({}),
            },
            memories: None,
        };

        let json = serde_json::to_string(&backup).unwrap();
        let parsed: BackupData = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.version, "3.6.0");
        assert_eq!(parsed.persona.name, "Eden");
    }
}

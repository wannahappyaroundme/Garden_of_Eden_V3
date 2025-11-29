//! Auto-Updater Service
//!
//! Manages application updates using Tauri's built-in updater
//! - Check for updates on GitHub releases
//! - Download and install updates
//! - User notification and confirmation

#![allow(dead_code)]  // Phase 8: Auto-updater (scheduled for completion)

use anyhow::{anyhow, Result};
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::time::SystemTime;

/// Update check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCheckResult {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub release_notes: Option<String>,
    pub download_url: Option<String>,
}

/// Update status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateStatus {
    CheckingForUpdates,
    UpdateAvailable {
        version: String,
        release_notes: String,
    },
    NoUpdateAvailable,
    Downloading {
        progress: f64,
    },
    Installing,
    UpdateReady,
    Error {
        message: String,
    },
}

/// Update channel (v3.5.0)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UpdateChannel {
    Stable,
    Beta,
}

impl Default for UpdateChannel {
    fn default() -> Self {
        Self::Stable
    }
}

impl UpdateChannel {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Stable => "stable",
            Self::Beta => "beta",
        }
    }

    pub fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "stable" => Ok(Self::Stable),
            "beta" => Ok(Self::Beta),
            _ => Err(anyhow!("Invalid update channel: {}", s)),
        }
    }
}

/// Auto-Updater Service
pub struct UpdaterService {
    last_check: Option<SystemTime>,
    check_interval_hours: u64,
    channel: UpdateChannel,
}

impl UpdaterService {
    /// Create new updater service
    pub fn new() -> Self {
        Self {
            last_check: None,
            check_interval_hours: 24, // Check once per day by default
            channel: UpdateChannel::Stable,
        }
    }

    /// Get current update channel (v3.5.0)
    pub fn get_channel(&self) -> UpdateChannel {
        self.channel
    }

    /// Set update channel (v3.5.0)
    pub fn set_channel(&mut self, channel: UpdateChannel) {
        info!("Updating channel from {:?} to {:?}", self.channel, channel);
        self.channel = channel;
    }

    /// Get current app version
    pub fn get_current_version() -> String {
        env!("CARGO_PKG_VERSION").to_string()
    }

    /// Check if we should check for updates (based on interval)
    pub fn should_check_for_updates(&self) -> bool {
        match self.last_check {
            None => true,
            Some(last) => {
                let now = SystemTime::now();
                let elapsed = now.duration_since(last).unwrap_or_default();
                let hours_elapsed = elapsed.as_secs() / 3600;
                hours_elapsed >= self.check_interval_hours
            }
        }
    }

    /// Update last check timestamp
    pub fn update_last_check(&mut self) {
        self.last_check = Some(SystemTime::now());
    }

    /// Set check interval in hours
    pub fn set_check_interval(&mut self, hours: u64) {
        self.check_interval_hours = hours;
    }

    /// Parse version string to comparable tuple
    fn parse_version(version: &str) -> Result<(u32, u32, u32)> {
        let parts: Vec<&str> = version.trim_start_matches('v').split('.').collect();
        if parts.len() != 3 {
            return Err(anyhow!("Invalid version format: {}", version));
        }

        let major = parts[0].parse::<u32>()?;
        let minor = parts[1].parse::<u32>()?;
        let patch = parts[2].parse::<u32>()?;

        Ok((major, minor, patch))
    }

    /// Compare two version strings
    pub fn is_newer_version(current: &str, latest: &str) -> Result<bool> {
        let current_ver = Self::parse_version(current)?;
        let latest_ver = Self::parse_version(latest)?;

        Ok(latest_ver > current_ver)
    }

    /// Get update endpoint URL (GitHub releases)
    pub fn get_update_endpoint() -> String {
        // This should be configured based on your GitHub releases
        // For now, return placeholder
        "https://api.github.com/repos/yourusername/garden-of-eden-v3/releases/latest".to_string()
    }

    /// Validate update using SHA256 checksum (v3.7.0)
    ///
    /// Tauri's built-in updater handles Ed25519 signature verification.
    /// This function provides additional checksum verification for extra security.
    ///
    /// # Arguments
    /// * `update_data` - The update file bytes
    /// * `expected_checksum` - Expected SHA256 hash (hex string)
    ///
    /// # Returns
    /// * `Ok(true)` if checksum matches
    /// * `Ok(false)` if checksum doesn't match
    /// * `Err` if checksum format is invalid
    pub fn validate_update_checksum(update_data: &[u8], expected_checksum: &str) -> Result<bool> {
        use sha2::{Sha256, Digest};

        // Compute SHA256 hash
        let mut hasher = Sha256::new();
        hasher.update(update_data);
        let computed_hash = hasher.finalize();
        let computed_hex = format!("{:x}", computed_hash);

        // Compare with expected checksum (case-insensitive)
        let expected_clean = expected_checksum.trim().to_lowercase();
        let matches = computed_hex == expected_clean;

        if matches {
            info!("Update checksum verified: {}", &computed_hex[..16]);
        } else {
            warn!(
                "Update checksum mismatch! Expected: {}, Got: {}",
                &expected_clean[..16.min(expected_clean.len())],
                &computed_hex[..16]
            );
        }

        Ok(matches)
    }

    /// Legacy signature validation (deprecated, use validate_update_checksum)
    #[deprecated(since = "3.7.0", note = "Use validate_update_checksum instead. Tauri handles Ed25519 signatures.")]
    pub fn validate_update_signature(_update_data: &[u8], _signature: &str) -> Result<bool> {
        warn!("validate_update_signature is deprecated. Tauri's updater handles Ed25519 signatures automatically.");
        Ok(true)
    }
}

impl Default for UpdaterService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_current_version() {
        let version = UpdaterService::get_current_version();
        assert!(!version.is_empty());
        assert!(version.contains('.'));
    }

    #[test]
    fn test_parse_version() {
        assert_eq!(UpdaterService::parse_version("1.2.3").unwrap(), (1, 2, 3));
        assert_eq!(UpdaterService::parse_version("v1.2.3").unwrap(), (1, 2, 3));
        assert_eq!(UpdaterService::parse_version("10.20.30").unwrap(), (10, 20, 30));

        assert!(UpdaterService::parse_version("1.2").is_err());
        assert!(UpdaterService::parse_version("invalid").is_err());
    }

    #[test]
    fn test_is_newer_version() {
        assert!(UpdaterService::is_newer_version("1.0.0", "1.0.1").unwrap());
        assert!(UpdaterService::is_newer_version("1.0.0", "1.1.0").unwrap());
        assert!(UpdaterService::is_newer_version("1.0.0", "2.0.0").unwrap());

        assert!(!UpdaterService::is_newer_version("1.0.1", "1.0.0").unwrap());
        assert!(!UpdaterService::is_newer_version("2.0.0", "1.9.9").unwrap());
        assert!(!UpdaterService::is_newer_version("1.0.0", "1.0.0").unwrap());
    }

    #[test]
    fn test_should_check_for_updates() {
        let mut updater = UpdaterService::new();

        // Should check on first run
        assert!(updater.should_check_for_updates());

        // After updating last check, should not check immediately
        updater.update_last_check();
        assert!(!updater.should_check_for_updates());
    }

    #[test]
    fn test_set_check_interval() {
        let mut updater = UpdaterService::new();
        assert_eq!(updater.check_interval_hours, 24);

        updater.set_check_interval(12);
        assert_eq!(updater.check_interval_hours, 12);
    }

    #[test]
    fn test_get_update_endpoint() {
        let endpoint = UpdaterService::get_update_endpoint();
        assert!(endpoint.starts_with("https://"));
        assert!(endpoint.contains("github.com"));
    }
}

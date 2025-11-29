/// Tool Settings Service (v3.3.0)
///
/// Manages configuration and enable/disable state for all tools in the system.
/// Provides CRUD operations, validation, and defaults management.
///
/// Features:
/// - Per-tool enable/disable toggles
/// - JSON-based configuration storage
/// - Configuration validation
/// - Default settings management
/// - Bulk operations
/// - Reset to defaults
///
/// Database Schema:
/// - tool_settings (id, tool_name, enabled, config, updated_at)

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Tool configuration settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolSettings {
    pub tool_name: String,
    pub enabled: bool,
    pub config: Value,
    pub updated_at: i64,
}

/// Web search tool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSearchConfig {
    pub max_results: usize,
    pub engine: String, // "duckduckgo" or "searx"
    pub rate_limit: u64, // seconds between searches
}

impl Default for WebSearchConfig {
    fn default() -> Self {
        Self {
            max_results: 5,
            engine: "duckduckgo".to_string(),
            rate_limit: 2,
        }
    }
}

/// URL fetch tool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UrlFetchConfig {
    pub timeout: u64, // milliseconds
    pub max_size: usize, // bytes
}

impl Default for UrlFetchConfig {
    fn default() -> Self {
        Self {
            timeout: 10000,
            max_size: 5 * 1024 * 1024, // 5MB
        }
    }
}

/// File read tool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadFileConfig {
    pub allowed_paths: Vec<String>,
    pub max_size: usize, // bytes
}

impl Default for ReadFileConfig {
    fn default() -> Self {
        Self {
            allowed_paths: vec![],
            max_size: 10 * 1024 * 1024, // 10MB
        }
    }
}

/// File write tool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WriteFileConfig {
    pub require_confirmation: bool,
    pub allowed_paths: Vec<String>,
}

impl Default for WriteFileConfig {
    fn default() -> Self {
        Self {
            require_confirmation: true,
            allowed_paths: vec![],
        }
    }
}

/// System info tool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfoConfig {
    pub privacy_level: String, // "minimal", "standard", "full"
}

impl Default for SystemInfoConfig {
    fn default() -> Self {
        Self {
            privacy_level: "standard".to_string(),
        }
    }
}

/// Calculator tool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalculatorConfig {
    pub precision: usize,
}

impl Default for CalculatorConfig {
    fn default() -> Self {
        Self { precision: 10 }
    }
}

/// Tool settings service
pub struct ToolSettingsService {
    db: Arc<Mutex<crate::database::Database>>,
}

impl ToolSettingsService {
    /// Create a new tool settings service
    pub fn new(db: Arc<Mutex<crate::database::Database>>) -> Self {
        Self { db }
    }

    /// Get settings for a specific tool
    pub fn get_settings(&self, tool_name: &str) -> Result<ToolSettings> {
        let db = self.db.lock()
            .map_err(|e| anyhow::anyhow!("Database lock failed: {}", e))?;
        let conn = db.conn();

        let mut stmt = conn
            .prepare("SELECT tool_name, enabled, config, updated_at FROM tool_settings WHERE tool_name = ?1")
            .context("Failed to prepare statement")?;

        let settings = stmt
            .query_row([tool_name], |row| {
                Ok(ToolSettings {
                    tool_name: row.get(0)?,
                    enabled: row.get(1)?,
                    config: serde_json::from_str(&row.get::<_, String>(2)?).unwrap_or(Value::Object(Default::default())),
                    updated_at: row.get(3)?,
                })
            })
            .context(format!("Tool '{}' not found in settings", tool_name))?;

        Ok(settings)
    }

    /// Get all tool settings
    pub fn get_all_settings(&self) -> Result<HashMap<String, ToolSettings>> {
        let db = self.db.lock()
            .map_err(|e| anyhow::anyhow!("Database lock failed: {}", e))?;
        let conn = db.conn();

        let mut stmt = conn
            .prepare("SELECT tool_name, enabled, config, updated_at FROM tool_settings ORDER BY tool_name")
            .context("Failed to prepare statement")?;

        let settings_iter = stmt
            .query_map([], |row| {
                Ok(ToolSettings {
                    tool_name: row.get(0)?,
                    enabled: row.get(1)?,
                    config: serde_json::from_str(&row.get::<_, String>(2)?).unwrap_or(Value::Object(Default::default())),
                    updated_at: row.get(3)?,
                })
            })
            .context("Failed to query all settings")?;

        let mut result = HashMap::new();
        for settings in settings_iter {
            let settings = settings?;
            result.insert(settings.tool_name.clone(), settings);
        }

        Ok(result)
    }

    /// Update settings for a specific tool
    pub fn update_settings(&self, tool_name: &str, enabled: bool, config: Value) -> Result<()> {
        // Validate configuration
        self.validate_config(tool_name, &config)?;

        let db = self.db.lock()
            .map_err(|e| anyhow::anyhow!("Database lock failed: {}", e))?;
        let conn = db.conn();
        let now = chrono::Utc::now().timestamp();

        let config_str = serde_json::to_string(&config)
            .context("Failed to serialize config")?;

        conn.execute(
            "UPDATE tool_settings SET enabled = ?1, config = ?2, updated_at = ?3 WHERE tool_name = ?4",
            rusqlite::params![enabled, config_str, now, tool_name],
        )
        .context("Failed to update tool settings")?;

        Ok(())
    }

    /// Enable a specific tool
    pub fn enable_tool(&self, tool_name: &str) -> Result<()> {
        let current = self.get_settings(tool_name)?;
        self.update_settings(tool_name, true, current.config)
    }

    /// Disable a specific tool
    pub fn disable_tool(&self, tool_name: &str) -> Result<()> {
        let current = self.get_settings(tool_name)?;
        self.update_settings(tool_name, false, current.config)
    }

    /// Check if a tool is enabled
    pub fn is_tool_enabled(&self, tool_name: &str) -> Result<bool> {
        let settings = self.get_settings(tool_name)?;
        Ok(settings.enabled)
    }

    /// Reset a tool to default settings
    pub fn reset_to_defaults(&self, tool_name: &str) -> Result<()> {
        let default_config = self.get_default_config(tool_name)?;
        self.update_settings(tool_name, true, default_config)
    }

    /// Reset all tools to default settings
    pub fn reset_all_to_defaults(&self) -> Result<()> {
        let tool_names = vec!["web_search", "fetch_url", "read_file", "write_file", "get_system_info", "calculate"];

        for tool_name in tool_names {
            self.reset_to_defaults(tool_name)?;
        }

        Ok(())
    }

    /// Get default configuration for a tool
    pub fn get_default_config(&self, tool_name: &str) -> Result<Value> {
        let config = match tool_name {
            "web_search" => serde_json::to_value(WebSearchConfig::default())?,
            "fetch_url" => serde_json::to_value(UrlFetchConfig::default())?,
            "read_file" => serde_json::to_value(ReadFileConfig::default())?,
            "write_file" => serde_json::to_value(WriteFileConfig::default())?,
            "get_system_info" => serde_json::to_value(SystemInfoConfig::default())?,
            "calculate" => serde_json::to_value(CalculatorConfig::default())?,
            _ => anyhow::bail!("Unknown tool: {}", tool_name),
        };

        Ok(config)
    }

    /// Validate tool configuration
    fn validate_config(&self, tool_name: &str, config: &Value) -> Result<()> {
        match tool_name {
            "web_search" => {
                let cfg: WebSearchConfig = serde_json::from_value(config.clone())
                    .context("Invalid web_search config")?;

                if cfg.max_results == 0 || cfg.max_results > 20 {
                    anyhow::bail!("max_results must be between 1 and 20");
                }

                if cfg.engine != "duckduckgo" && cfg.engine != "searx" {
                    anyhow::bail!("engine must be 'duckduckgo' or 'searx'");
                }
            }
            "fetch_url" => {
                let cfg: UrlFetchConfig = serde_json::from_value(config.clone())
                    .context("Invalid fetch_url config")?;

                if cfg.timeout == 0 || cfg.timeout > 60000 {
                    anyhow::bail!("timeout must be between 1 and 60000 ms");
                }

                if cfg.max_size == 0 || cfg.max_size > 50 * 1024 * 1024 {
                    anyhow::bail!("max_size must be between 1 and 50MB");
                }
            }
            "read_file" => {
                let cfg: ReadFileConfig = serde_json::from_value(config.clone())
                    .context("Invalid read_file config")?;

                if cfg.max_size == 0 || cfg.max_size > 100 * 1024 * 1024 {
                    anyhow::bail!("max_size must be between 1 and 100MB");
                }
            }
            "write_file" => {
                let _cfg: WriteFileConfig = serde_json::from_value(config.clone())
                    .context("Invalid write_file config")?;
            }
            "get_system_info" => {
                let cfg: SystemInfoConfig = serde_json::from_value(config.clone())
                    .context("Invalid get_system_info config")?;

                if cfg.privacy_level != "minimal" && cfg.privacy_level != "standard" && cfg.privacy_level != "full" {
                    anyhow::bail!("privacy_level must be 'minimal', 'standard', or 'full'");
                }
            }
            "calculate" => {
                let cfg: CalculatorConfig = serde_json::from_value(config.clone())
                    .context("Invalid calculate config")?;

                if cfg.precision == 0 || cfg.precision > 20 {
                    anyhow::bail!("precision must be between 1 and 20");
                }
            }
            _ => anyhow::bail!("Unknown tool: {}", tool_name),
        }

        Ok(())
    }

    /// Get list of all available tool names
    pub fn get_available_tools(&self) -> Vec<String> {
        vec![
            "web_search".to_string(),
            "fetch_url".to_string(),
            "read_file".to_string(),
            "write_file".to_string(),
            "get_system_info".to_string(),
            "calculate".to_string(),
        ]
    }

    /// Get enabled tools only
    pub fn get_enabled_tools(&self) -> Result<Vec<String>> {
        let all_settings = self.get_all_settings()?;
        let enabled: Vec<String> = all_settings
            .into_iter()
            .filter(|(_, settings)| settings.enabled)
            .map(|(name, _)| name)
            .collect();

        Ok(enabled)
    }

    /// Bulk enable/disable tools
    pub fn bulk_set_enabled(&self, tool_names: &[String], enabled: bool) -> Result<()> {
        for tool_name in tool_names {
            if enabled {
                self.enable_tool(tool_name)?;
            } else {
                self.disable_tool(tool_name)?;
            }
        }
        Ok(())
    }

    /// Export all settings as JSON
    pub fn export_settings(&self) -> Result<String> {
        let all_settings = self.get_all_settings()?;
        let json = serde_json::to_string_pretty(&all_settings)
            .context("Failed to serialize settings")?;
        Ok(json)
    }

    /// Import settings from JSON
    pub fn import_settings(&self, json: &str) -> Result<()> {
        let settings: HashMap<String, ToolSettings> = serde_json::from_str(json)
            .context("Failed to parse settings JSON")?;

        for (tool_name, tool_settings) in settings {
            // Validate before importing
            self.validate_config(&tool_name, &tool_settings.config)?;
            self.update_settings(&tool_name, tool_settings.enabled, tool_settings.config)?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;

    fn create_test_service() -> ToolSettingsService {
        let db = Database::new_test_db().unwrap();
        ToolSettingsService::new(Arc::new(Mutex::new(db)))
    }

    #[test]
    fn test_get_settings() {
        let service = create_test_service();

        let settings = service.get_settings("web_search").unwrap();
        assert_eq!(settings.tool_name, "web_search");
        assert!(settings.enabled);
    }

    #[test]
    fn test_get_all_settings() {
        let service = create_test_service();

        let all_settings = service.get_all_settings().unwrap();
        assert_eq!(all_settings.len(), 6);
        assert!(all_settings.contains_key("web_search"));
        assert!(all_settings.contains_key("calculate"));
    }

    #[test]
    fn test_update_settings() {
        let service = create_test_service();

        let new_config = serde_json::json!({
            "max_results": 10,
            "engine": "searx",
            "rate_limit": 5
        });

        service.update_settings("web_search", true, new_config.clone()).unwrap();

        let updated = service.get_settings("web_search").unwrap();
        assert_eq!(updated.config["max_results"], 10);
        assert_eq!(updated.config["engine"], "searx");
    }

    #[test]
    fn test_enable_disable_tool() {
        let service = create_test_service();

        service.disable_tool("web_search").unwrap();
        assert!(!service.is_tool_enabled("web_search").unwrap());

        service.enable_tool("web_search").unwrap();
        assert!(service.is_tool_enabled("web_search").unwrap());
    }

    #[test]
    fn test_validation_rejects_invalid_config() {
        let service = create_test_service();

        // Invalid max_results (too high)
        let invalid_config = serde_json::json!({
            "max_results": 100,
            "engine": "duckduckgo",
            "rate_limit": 2
        });

        let result = service.update_settings("web_search", true, invalid_config);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("max_results"));
    }

    #[test]
    fn test_validation_rejects_invalid_engine() {
        let service = create_test_service();

        let invalid_config = serde_json::json!({
            "max_results": 5,
            "engine": "google",
            "rate_limit": 2
        });

        let result = service.update_settings("web_search", true, invalid_config);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("engine"));
    }

    #[test]
    fn test_reset_to_defaults() {
        let service = create_test_service();

        // Modify settings
        let custom_config = serde_json::json!({
            "max_results": 15,
            "engine": "searx",
            "rate_limit": 10
        });
        service.update_settings("web_search", false, custom_config).unwrap();

        // Reset to defaults
        service.reset_to_defaults("web_search").unwrap();

        let settings = service.get_settings("web_search").unwrap();
        assert!(settings.enabled);
        assert_eq!(settings.config["max_results"], 5);
        assert_eq!(settings.config["engine"], "duckduckgo");
    }

    #[test]
    fn test_get_enabled_tools() {
        let service = create_test_service();

        // Disable some tools
        service.disable_tool("web_search").unwrap();
        service.disable_tool("calculate").unwrap();

        let enabled = service.get_enabled_tools().unwrap();
        assert_eq!(enabled.len(), 4);
        assert!(!enabled.contains(&"web_search".to_string()));
        assert!(!enabled.contains(&"calculate".to_string()));
    }

    #[test]
    fn test_bulk_set_enabled() {
        let service = create_test_service();

        let tools = vec![
            "web_search".to_string(),
            "fetch_url".to_string(),
            "calculate".to_string(),
        ];

        service.bulk_set_enabled(&tools, false).unwrap();

        for tool in &tools {
            assert!(!service.is_tool_enabled(tool).unwrap());
        }
    }

    #[test]
    fn test_export_import_settings() {
        let service = create_test_service();

        // Modify some settings
        service.disable_tool("web_search").unwrap();
        let custom_config = serde_json::json!({
            "precision": 15
        });
        service.update_settings("calculate", true, custom_config).unwrap();

        // Export
        let exported = service.export_settings().unwrap();

        // Reset all
        service.reset_all_to_defaults().unwrap();

        // Import
        service.import_settings(&exported).unwrap();

        // Verify
        assert!(!service.is_tool_enabled("web_search").unwrap());
        let calc_settings = service.get_settings("calculate").unwrap();
        assert_eq!(calc_settings.config["precision"], 15);
    }

    #[test]
    fn test_privacy_level_validation() {
        let service = create_test_service();

        let valid_config = serde_json::json!({
            "privacy_level": "minimal"
        });
        service.update_settings("get_system_info", true, valid_config).unwrap();

        let invalid_config = serde_json::json!({
            "privacy_level": "ultra"
        });
        let result = service.update_settings("get_system_info", true, invalid_config);
        assert!(result.is_err());
    }

    #[test]
    fn test_calculator_precision_validation() {
        let service = create_test_service();

        let invalid_config = serde_json::json!({
            "precision": 25
        });
        let result = service.update_settings("calculate", true, invalid_config);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("precision"));
    }
}

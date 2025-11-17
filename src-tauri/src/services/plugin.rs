/**
 * Plugin System (v3.4.0)
 *
 * User-extensible plugin architecture:
 * - JavaScript/TypeScript plugin support
 * - Sandboxed execution for security
 * - Permission-based access control
 * - Plugin discovery and installation
 * - Hot-reload support
 */

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use super::plugin_runtime::PluginRuntimeManager;

/// Plugin metadata (from manifest.json)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub main: String,  // Entry point file (e.g., "index.js")
    pub permissions: Vec<Permission>,
    #[serde(default)]
    pub dependencies: HashMap<String, String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub homepage: Option<String>,
}

/// Plugin permissions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Permission {
    FileRead,      // Read files from user's system
    FileWrite,     // Write files to user's system
    Network,       // Make HTTP requests
    System,        // Access system info (OS, CPU, etc.)
    Notification,  // Show notifications
    Clipboard,     // Access clipboard
    Shell,         // Execute shell commands
}

/// Loaded plugin instance
#[derive(Debug)]
pub struct Plugin {
    pub manifest: PluginManifest,
    pub path: PathBuf,
    pub enabled: bool,
    pub code: String,  // JavaScript code
}

/// Plugin execution result
#[derive(Debug, Serialize, Deserialize)]
pub struct PluginResult {
    pub success: bool,
    pub data: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Plugin system service
pub struct PluginService {
    plugins_dir: PathBuf,
    loaded_plugins: HashMap<String, Plugin>,
    runtime_manager: PluginRuntimeManager,
}

impl PluginService {
    /// Create new plugin service
    pub fn new(plugins_dir: PathBuf) -> Result<Self> {
        // Create plugins directory if not exists
        fs::create_dir_all(&plugins_dir)?;

        log::info!("Plugin service initialized at: {:?}", plugins_dir);

        Ok(Self {
            plugins_dir,
            loaded_plugins: HashMap::new(),
            runtime_manager: PluginRuntimeManager::new(),
        })
    }

    /// Discover all plugins in plugins directory
    pub fn discover_plugins(&mut self) -> Result<Vec<PluginManifest>> {
        let mut manifests = Vec::new();

        if !self.plugins_dir.exists() {
            return Ok(manifests);
        }

        for entry in fs::read_dir(&self.plugins_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                if let Ok(manifest) = self.load_manifest(&path) {
                    manifests.push(manifest);
                }
            }
        }

        log::info!("Discovered {} plugins", manifests.len());
        Ok(manifests)
    }

    /// Load a plugin
    pub fn load_plugin(&mut self, plugin_id: &str) -> Result<()> {
        let plugin_path = self.plugins_dir.join(plugin_id);

        if !plugin_path.exists() {
            return Err(anyhow!("Plugin not found: {}", plugin_id));
        }

        // Load manifest
        let manifest = self.load_manifest(&plugin_path)?;

        // Validate plugin ID matches directory name
        if manifest.id != plugin_id {
            return Err(anyhow!(
                "Plugin ID mismatch: expected {}, got {}",
                plugin_id,
                manifest.id
            ));
        }

        // Load main JavaScript file
        let main_file = plugin_path.join(&manifest.main);
        if !main_file.exists() {
            return Err(anyhow!("Main file not found: {}", manifest.main));
        }

        let code = fs::read_to_string(&main_file)?;

        // Initialize V8 runtime for this plugin
        self.runtime_manager
            .initialize_plugin(plugin_id, manifest.clone(), &code)?;

        // Create plugin instance
        let plugin = Plugin {
            manifest: manifest.clone(),
            path: plugin_path,
            enabled: true,
            code,
        };

        self.loaded_plugins.insert(plugin_id.to_string(), plugin);

        log::info!("Loaded plugin: {} v{}", manifest.name, manifest.version);
        Ok(())
    }

    /// Unload a plugin
    pub fn unload_plugin(&mut self, plugin_id: &str) -> Result<()> {
        if self.loaded_plugins.remove(plugin_id).is_some() {
            // Unload V8 runtime
            self.runtime_manager.unload_plugin(plugin_id)?;
            log::info!("Unloaded plugin: {}", plugin_id);
            Ok(())
        } else {
            Err(anyhow!("Plugin not loaded: {}", plugin_id))
        }
    }

    /// Execute a plugin function
    pub fn execute_plugin(
        &mut self,
        plugin_id: &str,
        function_name: &str,
        args: Vec<serde_json::Value>,
    ) -> Result<PluginResult> {
        let plugin = self.loaded_plugins
            .get(plugin_id)
            .ok_or_else(|| anyhow!("Plugin not loaded: {}", plugin_id))?;

        if !plugin.enabled {
            return Err(anyhow!("Plugin is disabled: {}", plugin_id));
        }

        log::info!("Executing {}:{} with args: {:?}", plugin_id, function_name, args);

        // Execute via V8 runtime
        let result = self.runtime_manager
            .execute_function(plugin_id, function_name, args)?;

        Ok(PluginResult {
            success: result.success,
            data: result.value,
            error: result.error,
        })
    }

    /// Enable a plugin
    pub fn enable_plugin(&mut self, plugin_id: &str) -> Result<()> {
        if let Some(plugin) = self.loaded_plugins.get_mut(plugin_id) {
            plugin.enabled = true;
            log::info!("Enabled plugin: {}", plugin_id);
            Ok(())
        } else {
            Err(anyhow!("Plugin not loaded: {}", plugin_id))
        }
    }

    /// Disable a plugin
    pub fn disable_plugin(&mut self, plugin_id: &str) -> Result<()> {
        if let Some(plugin) = self.loaded_plugins.get_mut(plugin_id) {
            plugin.enabled = false;
            log::info!("Disabled plugin: {}", plugin_id);
            Ok(())
        } else {
            Err(anyhow!("Plugin not loaded: {}", plugin_id))
        }
    }

    /// Get list of loaded plugins
    pub fn list_plugins(&self) -> Vec<PluginManifest> {
        self.loaded_plugins
            .values()
            .map(|p| p.manifest.clone())
            .collect()
    }

    /// Check if a plugin has a specific permission
    pub fn has_permission(&self, plugin_id: &str, permission: &Permission) -> bool {
        if let Some(plugin) = self.loaded_plugins.get(plugin_id) {
            plugin.manifest.permissions.contains(permission)
        } else {
            false
        }
    }

    /// Install a plugin from a directory
    pub fn install_plugin(&mut self, source_path: &Path) -> Result<String> {
        // Load manifest from source
        let manifest = self.load_manifest(source_path)?;

        // Check if plugin already exists
        let target_path = self.plugins_dir.join(&manifest.id);
        if target_path.exists() {
            return Err(anyhow!("Plugin already installed: {}", manifest.id));
        }

        // Copy plugin directory
        self.copy_dir_recursive(source_path, &target_path)?;

        log::info!("Installed plugin: {} v{}", manifest.name, manifest.version);
        Ok(manifest.id)
    }

    /// Uninstall a plugin
    pub fn uninstall_plugin(&mut self, plugin_id: &str) -> Result<()> {
        // Unload if loaded
        let _ = self.unload_plugin(plugin_id);

        // Remove plugin directory
        let plugin_path = self.plugins_dir.join(plugin_id);
        if plugin_path.exists() {
            fs::remove_dir_all(&plugin_path)?;
            log::info!("Uninstalled plugin: {}", plugin_id);
            Ok(())
        } else {
            Err(anyhow!("Plugin not found: {}", plugin_id))
        }
    }

    // === Private helper methods ===

    /// Load plugin manifest from directory
    fn load_manifest(&self, plugin_path: &Path) -> Result<PluginManifest> {
        let manifest_path = plugin_path.join("manifest.json");

        if !manifest_path.exists() {
            return Err(anyhow!("manifest.json not found in {:?}", plugin_path));
        }

        let manifest_content = fs::read_to_string(&manifest_path)?;
        let manifest: PluginManifest = serde_json::from_str(&manifest_content)?;

        Ok(manifest)
    }

    /// Recursively copy directory
    fn copy_dir_recursive(&self, src: &Path, dst: &Path) -> Result<()> {
        fs::create_dir_all(dst)?;

        for entry in fs::read_dir(src)? {
            let entry = entry?;
            let file_type = entry.file_type()?;
            let src_path = entry.path();
            let dst_path = dst.join(entry.file_name());

            if file_type.is_dir() {
                self.copy_dir_recursive(&src_path, &dst_path)?;
            } else {
                fs::copy(&src_path, &dst_path)?;
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn create_test_manifest() -> PluginManifest {
        PluginManifest {
            id: "test-plugin".to_string(),
            name: "Test Plugin".to_string(),
            version: "1.0.0".to_string(),
            description: "A test plugin".to_string(),
            author: "Test Author".to_string(),
            main: "index.js".to_string(),
            permissions: vec![Permission::Network, Permission::Notification],
            dependencies: HashMap::new(),
            icon: None,
            homepage: None,
        }
    }

    #[test]
    fn test_plugin_service_creation() {
        let temp_dir = env::temp_dir().join("test_plugins");
        let service = PluginService::new(temp_dir).unwrap();
        assert!(service.loaded_plugins.is_empty());
    }

    #[test]
    fn test_permission_check() {
        let temp_dir = env::temp_dir().join("test_plugins_perms");
        let mut service = PluginService::new(temp_dir).unwrap();

        let manifest = create_test_manifest();
        let plugin = Plugin {
            manifest: manifest.clone(),
            path: PathBuf::from("/tmp/test"),
            enabled: true,
            code: "console.log('test');".to_string(),
        };

        service.loaded_plugins.insert("test-plugin".to_string(), plugin);

        assert!(service.has_permission("test-plugin", &Permission::Network));
        assert!(service.has_permission("test-plugin", &Permission::Notification));
        assert!(!service.has_permission("test-plugin", &Permission::FileWrite));
        assert!(!service.has_permission("nonexistent", &Permission::Network));
    }

    #[test]
    fn test_enable_disable_plugin() {
        let temp_dir = env::temp_dir().join("test_plugins_enable");
        let mut service = PluginService::new(temp_dir).unwrap();

        let manifest = create_test_manifest();
        let plugin = Plugin {
            manifest,
            path: PathBuf::from("/tmp/test"),
            enabled: true,
            code: "console.log('test');".to_string(),
        };

        service.loaded_plugins.insert("test-plugin".to_string(), plugin);

        service.disable_plugin("test-plugin").unwrap();
        assert!(!service.loaded_plugins.get("test-plugin").unwrap().enabled);

        service.enable_plugin("test-plugin").unwrap();
        assert!(service.loaded_plugins.get("test-plugin").unwrap().enabled);
    }

    #[test]
    fn test_list_plugins() {
        let temp_dir = env::temp_dir().join("test_plugins_list");
        let mut service = PluginService::new(temp_dir).unwrap();

        let manifest = create_test_manifest();
        let plugin = Plugin {
            manifest: manifest.clone(),
            path: PathBuf::from("/tmp/test"),
            enabled: true,
            code: "console.log('test');".to_string(),
        };

        service.loaded_plugins.insert("test-plugin".to_string(), plugin);

        let plugins = service.list_plugins();
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].id, "test-plugin");
    }
}

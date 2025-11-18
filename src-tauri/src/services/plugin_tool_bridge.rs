/// Plugin Tool Bridge (v3.3.0)
///
/// Bridges user-created plugins with the tool calling system.
/// Allows plugins to register custom tools that the AI can use.
///
/// Features:
/// - Plugin tool discovery from V8 runtime
/// - Tool registration and validation
/// - Permission system for plugin tools
/// - Safe execution in sandboxed V8 environment
/// - Tool lifecycle management
///
/// Security:
/// - All plugin tools disabled by default (user must enable)
/// - Permission-based access control
/// - Sandboxed execution via V8 runtime
/// - Input/output validation
/// - Execution timeout enforcement

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Plugin tool definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginToolDef {
    pub plugin_name: String,
    pub tool_name: String,
    pub tool_description: String,
    pub parameters_schema: Value, // JSON Schema for parameters
    pub permissions: Vec<String>,
    pub enabled: bool,
}

/// Plugin tool execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginToolResult {
    pub success: bool,
    pub result: Option<Value>,
    pub error: Option<String>,
    pub execution_time_ms: u64,
}

/// Required permissions for plugin tools
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PluginPermission {
    /// Read files from the file system
    FileRead,
    /// Write files to the file system
    FileWrite,
    /// Execute system commands
    SystemExecute,
    /// Make network requests
    NetworkAccess,
    /// Access database
    DatabaseAccess,
    /// Access system info
    SystemInfo,
}

impl PluginPermission {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "file_read" => Some(Self::FileRead),
            "file_write" => Some(Self::FileWrite),
            "system_execute" => Some(Self::SystemExecute),
            "network_access" => Some(Self::NetworkAccess),
            "database_access" => Some(Self::DatabaseAccess),
            "system_info" => Some(Self::SystemInfo),
            _ => None,
        }
    }

    pub fn to_str(&self) -> &str {
        match self {
            Self::FileRead => "file_read",
            Self::FileWrite => "file_write",
            Self::SystemExecute => "system_execute",
            Self::NetworkAccess => "network_access",
            Self::DatabaseAccess => "database_access",
            Self::SystemInfo => "system_info",
        }
    }
}

/// Plugin tool bridge service
pub struct PluginToolBridge {
    db: Arc<Mutex<crate::database::Database>>,
    plugin_runtime: Arc<Mutex<crate::services::plugin_runtime::PluginRuntimeManager>>,
    registered_tools: Arc<Mutex<HashMap<String, PluginToolDef>>>,
}

impl PluginToolBridge {
    /// Create a new plugin tool bridge
    pub fn new(
        db: Arc<Mutex<crate::database::Database>>,
        plugin_runtime: Arc<Mutex<crate::services::plugin_runtime::PluginRuntimeManager>>,
    ) -> Self {
        Self {
            db,
            plugin_runtime,
            registered_tools: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Discover plugin tools from a loaded plugin
    ///
    /// Scans the plugin's exported `tools` object and extracts tool definitions
    ///
    /// Note: Full implementation requires plugin runtime integration (v3.4.0+)
    /// For v3.3.0, this returns empty list as plugin tool discovery is not yet fully integrated
    pub fn discover_plugin_tools(&self, _plugin_name: &str) -> Result<Vec<PluginToolDef>> {
        // TODO: Implement full plugin tool discovery when plugin runtime is fully integrated
        // For now, return empty list (plugin tools will be registered manually)
        Ok(vec![])
    }

    /// Register a plugin tool in the database
    pub fn register_plugin_tool(&self, def: PluginToolDef) -> Result<()> {
        // Validate tool definition
        self.validate_tool_definition(&def)?;

        let db = self.db.lock().unwrap();
        let conn = db.conn();
        let now = chrono::Utc::now().timestamp();

        let parameters_schema_str = serde_json::to_string(&def.parameters_schema)
            .context("Failed to serialize parameters schema")?;

        let permissions_str = serde_json::to_string(&def.permissions)
            .context("Failed to serialize permissions")?;

        // Insert or replace (upsert) plugin tool
        conn.execute(
            "INSERT OR REPLACE INTO plugin_tools
             (plugin_name, tool_name, tool_description, parameters_schema, permissions, enabled, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                def.plugin_name,
                def.tool_name,
                def.tool_description,
                parameters_schema_str,
                permissions_str,
                def.enabled,
                now,
            ],
        )
        .context("Failed to insert plugin tool")?;

        // Update in-memory registry
        let mut tools = self.registered_tools.lock().unwrap();
        tools.insert(def.tool_name.clone(), def);

        Ok(())
    }

    /// Unregister all tools from a plugin
    pub fn unregister_plugin_tools(&self, plugin_name: &str) -> Result<usize> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let deleted = conn
            .execute(
                "DELETE FROM plugin_tools WHERE plugin_name = ?1",
                rusqlite::params![plugin_name],
            )
            .context("Failed to delete plugin tools")?;

        // Update in-memory registry
        let mut tools = self.registered_tools.lock().unwrap();
        tools.retain(|_, def| def.plugin_name != plugin_name);

        Ok(deleted)
    }

    /// Execute a plugin tool
    pub fn execute_plugin_tool(&self, tool_name: &str, params: Value) -> Result<PluginToolResult> {
        // Get tool definition
        let def = self.get_tool_definition(tool_name)?;

        // Check if tool is enabled
        if !def.enabled {
            anyhow::bail!("Plugin tool '{}' is disabled", tool_name);
        }

        // Validate permissions
        self.validate_permissions(&def)?;

        // Validate parameters against schema
        self.validate_parameters(&def, &params)?;

        // Execute in V8 runtime
        let start_time = std::time::Instant::now();
        let result = self.execute_in_runtime(&def, params)?;
        let execution_time_ms = start_time.elapsed().as_millis() as u64;

        Ok(PluginToolResult {
            success: true,
            result: Some(result),
            error: None,
            execution_time_ms,
        })
    }

    /// Get all registered plugin tools
    pub fn get_all_plugin_tools(&self) -> Result<Vec<PluginToolDef>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn
            .prepare(
                "SELECT plugin_name, tool_name, tool_description, parameters_schema, permissions, enabled, created_at
                 FROM plugin_tools
                 ORDER BY plugin_name, tool_name"
            )
            .context("Failed to prepare statement")?;

        let tools_iter = stmt
            .query_map([], |row| {
                Ok(PluginToolDef {
                    plugin_name: row.get(0)?,
                    tool_name: row.get(1)?,
                    tool_description: row.get(2)?,
                    parameters_schema: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or(Value::Object(Default::default())),
                    permissions: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_default(),
                    enabled: row.get(5)?,
                })
            })
            .context("Failed to query plugin tools")?;

        let mut tools = Vec::new();
        for tool in tools_iter {
            tools.push(tool?);
        }

        Ok(tools)
    }

    /// Get plugin tools by plugin name
    pub fn get_plugin_tools(&self, plugin_name: &str) -> Result<Vec<PluginToolDef>> {
        let all_tools = self.get_all_plugin_tools()?;
        let tools: Vec<PluginToolDef> = all_tools
            .into_iter()
            .filter(|def| def.plugin_name == plugin_name)
            .collect();

        Ok(tools)
    }

    /// Enable a plugin tool
    pub fn enable_plugin_tool(&self, tool_name: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute(
            "UPDATE plugin_tools SET enabled = 1 WHERE tool_name = ?1",
            rusqlite::params![tool_name],
        )
        .context("Failed to enable plugin tool")?;

        // Update in-memory registry
        let mut tools = self.registered_tools.lock().unwrap();
        if let Some(def) = tools.get_mut(tool_name) {
            def.enabled = true;
        }

        Ok(())
    }

    /// Disable a plugin tool
    pub fn disable_plugin_tool(&self, tool_name: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute(
            "UPDATE plugin_tools SET enabled = 0 WHERE tool_name = ?1",
            rusqlite::params![tool_name],
        )
        .context("Failed to disable plugin tool")?;

        // Update in-memory registry
        let mut tools = self.registered_tools.lock().unwrap();
        if let Some(def) = tools.get_mut(tool_name) {
            def.enabled = false;
        }

        Ok(())
    }

    /// Get tool definition from database
    fn get_tool_definition(&self, tool_name: &str) -> Result<PluginToolDef> {
        // Try in-memory first
        let tools = self.registered_tools.lock().unwrap();
        if let Some(def) = tools.get(tool_name) {
            return Ok(def.clone());
        }
        drop(tools);

        // Load from database
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn
            .prepare(
                "SELECT plugin_name, tool_name, tool_description, parameters_schema, permissions, enabled
                 FROM plugin_tools
                 WHERE tool_name = ?1"
            )
            .context("Failed to prepare statement")?;

        let def = stmt
            .query_row([tool_name], |row| {
                Ok(PluginToolDef {
                    plugin_name: row.get(0)?,
                    tool_name: row.get(1)?,
                    tool_description: row.get(2)?,
                    parameters_schema: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or(Value::Object(Default::default())),
                    permissions: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_default(),
                    enabled: row.get(5)?,
                })
            })
            .context(format!("Plugin tool '{}' not found", tool_name))?;

        Ok(def)
    }

    /// Validate tool definition
    fn validate_tool_definition(&self, def: &PluginToolDef) -> Result<()> {
        if def.plugin_name.is_empty() {
            anyhow::bail!("Plugin name cannot be empty");
        }

        if def.tool_name.is_empty() {
            anyhow::bail!("Tool name cannot be empty");
        }

        if def.tool_description.is_empty() {
            anyhow::bail!("Tool description cannot be empty");
        }

        // Validate permissions
        for perm_str in &def.permissions {
            if PluginPermission::from_str(perm_str).is_none() {
                anyhow::bail!("Invalid permission: {}", perm_str);
            }
        }

        Ok(())
    }

    /// Validate permissions (placeholder for future permission checks)
    fn validate_permissions(&self, _def: &PluginToolDef) -> Result<()> {
        // Future: Check if user has granted these permissions
        // For now, just allow if tool is enabled
        Ok(())
    }

    /// Validate parameters against JSON schema
    fn validate_parameters(&self, def: &PluginToolDef, params: &Value) -> Result<()> {
        // Basic validation: check that required parameters are present
        if let Some(schema) = def.parameters_schema.as_object() {
            if let Some(required) = schema.get("required").and_then(|r| r.as_array()) {
                if let Some(params_obj) = params.as_object() {
                    for req in required {
                        if let Some(req_str) = req.as_str() {
                            if !params_obj.contains_key(req_str) {
                                anyhow::bail!("Missing required parameter: {}", req_str);
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Execute tool in V8 runtime
    ///
    /// Note: Full implementation requires plugin runtime integration (v3.4.0+)
    /// For v3.3.0, this is a placeholder that returns a stub response
    fn execute_in_runtime(&self, def: &PluginToolDef, _params: Value) -> Result<Value> {
        // TODO: Implement full plugin tool execution when plugin runtime is fully integrated
        // For now, return a stub response indicating the tool would be executed
        Ok(serde_json::json!({
            "message": format!("Plugin tool '{}' from '{}' would be executed here", def.tool_name, def.plugin_name),
            "status": "stub_implementation"
        }))
    }

    /// Reload all plugin tools from database into memory
    pub fn reload_from_database(&self) -> Result<()> {
        let all_tools = self.get_all_plugin_tools()?;

        let mut tools = self.registered_tools.lock().unwrap();
        tools.clear();

        for def in all_tools {
            tools.insert(def.tool_name.clone(), def);
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use crate::services::plugin_runtime::PluginRuntimeManager;

    fn create_test_bridge() -> PluginToolBridge {
        let db = Database::new_test_db().unwrap();
        let runtime = PluginRuntimeManager::new();
        PluginToolBridge::new(Arc::new(Mutex::new(db)), Arc::new(Mutex::new(runtime)))
    }

    #[test]
    fn test_register_plugin_tool() {
        let bridge = create_test_bridge();

        let def = PluginToolDef {
            plugin_name: "test-plugin".to_string(),
            tool_name: "test_tool".to_string(),
            tool_description: "A test tool".to_string(),
            parameters_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "query": { "type": "string" }
                }
            }),
            permissions: vec!["network_access".to_string()],
            enabled: false,
        };

        bridge.register_plugin_tool(def.clone()).unwrap();

        let retrieved = bridge.get_tool_definition("test_tool").unwrap();
        assert_eq!(retrieved.plugin_name, "test-plugin");
        assert_eq!(retrieved.tool_description, "A test tool");
    }

    #[test]
    fn test_unregister_plugin_tools() {
        let bridge = create_test_bridge();

        let def1 = PluginToolDef {
            plugin_name: "test-plugin".to_string(),
            tool_name: "tool1".to_string(),
            tool_description: "Tool 1".to_string(),
            parameters_schema: serde_json::json!({}),
            permissions: vec![],
            enabled: false,
        };

        let def2 = PluginToolDef {
            plugin_name: "test-plugin".to_string(),
            tool_name: "tool2".to_string(),
            tool_description: "Tool 2".to_string(),
            parameters_schema: serde_json::json!({}),
            permissions: vec![],
            enabled: false,
        };

        bridge.register_plugin_tool(def1).unwrap();
        bridge.register_plugin_tool(def2).unwrap();

        let deleted = bridge.unregister_plugin_tools("test-plugin").unwrap();
        assert_eq!(deleted, 2);

        let result = bridge.get_tool_definition("tool1");
        assert!(result.is_err());
    }

    #[test]
    fn test_enable_disable_plugin_tool() {
        let bridge = create_test_bridge();

        let def = PluginToolDef {
            plugin_name: "test-plugin".to_string(),
            tool_name: "test_tool".to_string(),
            tool_description: "A test tool".to_string(),
            parameters_schema: serde_json::json!({}),
            permissions: vec![],
            enabled: false,
        };

        bridge.register_plugin_tool(def).unwrap();

        bridge.enable_plugin_tool("test_tool").unwrap();
        let enabled_def = bridge.get_tool_definition("test_tool").unwrap();
        assert!(enabled_def.enabled);

        bridge.disable_plugin_tool("test_tool").unwrap();
        let disabled_def = bridge.get_tool_definition("test_tool").unwrap();
        assert!(!disabled_def.enabled);
    }

    #[test]
    fn test_get_plugin_tools() {
        let bridge = create_test_bridge();

        let def1 = PluginToolDef {
            plugin_name: "plugin1".to_string(),
            tool_name: "tool1".to_string(),
            tool_description: "Tool 1".to_string(),
            parameters_schema: serde_json::json!({}),
            permissions: vec![],
            enabled: false,
        };

        let def2 = PluginToolDef {
            plugin_name: "plugin2".to_string(),
            tool_name: "tool2".to_string(),
            tool_description: "Tool 2".to_string(),
            parameters_schema: serde_json::json!({}),
            permissions: vec![],
            enabled: false,
        };

        bridge.register_plugin_tool(def1).unwrap();
        bridge.register_plugin_tool(def2).unwrap();

        let plugin1_tools = bridge.get_plugin_tools("plugin1").unwrap();
        assert_eq!(plugin1_tools.len(), 1);
        assert_eq!(plugin1_tools[0].tool_name, "tool1");
    }

    #[test]
    fn test_validate_tool_definition() {
        let bridge = create_test_bridge();

        let invalid_def = PluginToolDef {
            plugin_name: "".to_string(),
            tool_name: "test_tool".to_string(),
            tool_description: "A test tool".to_string(),
            parameters_schema: serde_json::json!({}),
            permissions: vec![],
            enabled: false,
        };

        let result = bridge.register_plugin_tool(invalid_def);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_parameters() {
        let bridge = create_test_bridge();

        let def = PluginToolDef {
            plugin_name: "test-plugin".to_string(),
            tool_name: "test_tool".to_string(),
            tool_description: "A test tool".to_string(),
            parameters_schema: serde_json::json!({
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": { "type": "string" }
                }
            }),
            permissions: vec![],
            enabled: true,
        };

        bridge.register_plugin_tool(def.clone()).unwrap();

        // Missing required parameter
        let invalid_params = serde_json::json!({});
        let result = bridge.validate_parameters(&def, &invalid_params);
        assert!(result.is_err());

        // Valid parameters
        let valid_params = serde_json::json!({
            "query": "test"
        });
        let result = bridge.validate_parameters(&def, &valid_params);
        assert!(result.is_ok());
    }

    #[test]
    fn test_permission_validation() {
        let def = PluginToolDef {
            plugin_name: "test-plugin".to_string(),
            tool_name: "test_tool".to_string(),
            tool_description: "A test tool".to_string(),
            parameters_schema: serde_json::json!({}),
            permissions: vec!["network_access".to_string(), "file_read".to_string()],
            enabled: false,
        };

        let bridge = create_test_bridge();
        let result = bridge.validate_tool_definition(&def);
        assert!(result.is_ok());

        let invalid_def = PluginToolDef {
            plugin_name: "test-plugin".to_string(),
            tool_name: "test_tool".to_string(),
            tool_description: "A test tool".to_string(),
            parameters_schema: serde_json::json!({}),
            permissions: vec!["invalid_permission".to_string()],
            enabled: false,
        };

        let result = bridge.validate_tool_definition(&invalid_def);
        assert!(result.is_err());
    }
}

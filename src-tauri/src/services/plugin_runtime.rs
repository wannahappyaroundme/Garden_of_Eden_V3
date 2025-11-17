/**
 * Plugin JavaScript Runtime (v3.4.1)
 *
 * V8-based JavaScript execution engine for plugins:
 * - Isolated V8 runtime per plugin
 * - Sandboxed execution environment
 * - Permission-based API access
 * - Async/await support
 * - Console API for debugging
 */

use anyhow::{anyhow, Result};
use deno_core::{JsRuntime, RuntimeOptions};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::rc::Rc;

use super::plugin::{Permission, PluginManifest};

/// Result from plugin function execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginExecutionResult {
    pub success: bool,
    pub value: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Plugin runtime manager
pub struct PluginRuntimeManager {
    runtimes: HashMap<String, PluginRuntimeInstance>,
}

/// Individual plugin runtime instance
struct PluginRuntimeInstance {
    runtime: JsRuntime,
    manifest: PluginManifest,
}

impl PluginRuntimeManager {
    /// Create new plugin runtime manager
    pub fn new() -> Self {
        Self {
            runtimes: HashMap::new(),
        }
    }

    /// Initialize runtime for a plugin
    pub fn initialize_plugin(
        &mut self,
        plugin_id: &str,
        manifest: PluginManifest,
        code: &str,
    ) -> Result<()> {
        log::info!("Initializing runtime for plugin: {}", plugin_id);

        // Create V8 runtime with custom options
        let mut runtime = JsRuntime::new(RuntimeOptions {
            ..Default::default()
        });

        // Inject console API
        self.inject_console_api(&mut runtime)?;

        // Inject plugin API based on permissions
        self.inject_plugin_api(&mut runtime, &manifest)?;

        // Execute plugin code (loads module.exports)
        runtime
            .execute_script("<plugin:init>", deno_core::FastString::from(code.to_string()))
            .map_err(|e| anyhow!("Failed to execute plugin code: {}", e))?;

        // Store runtime instance
        let instance = PluginRuntimeInstance { runtime, manifest };
        self.runtimes.insert(plugin_id.to_string(), instance);

        log::info!("Runtime initialized for plugin: {}", plugin_id);
        Ok(())
    }

    /// Execute a plugin function
    pub fn execute_function(
        &mut self,
        plugin_id: &str,
        function_name: &str,
        args: Vec<serde_json::Value>,
    ) -> Result<PluginExecutionResult> {
        let instance = self
            .runtimes
            .get_mut(plugin_id)
            .ok_or_else(|| anyhow!("Plugin runtime not initialized: {}", plugin_id))?;

        log::debug!(
            "Executing function '{}' in plugin '{}'",
            function_name,
            plugin_id
        );

        // Build JavaScript code to call the function
        let args_json = serde_json::to_string(&args)?;
        let script = format!(
            r#"
            (function() {{
                try {{
                    const exports = module.exports || {{}};
                    const func = exports["{}"];
                    if (typeof func !== 'function') {{
                        return {{ success: false, error: "Function '{}' not found in plugin" }};
                    }}
                    const args = {};
                    const result = func(...args);

                    // Handle promises
                    if (result && typeof result.then === 'function') {{
                        return result.then(
                            value => ({{ success: true, value: value }}),
                            error => ({{ success: false, error: String(error) }})
                        );
                    }}

                    return {{ success: true, value: result }};
                }} catch (error) {{
                    return {{ success: false, error: String(error) }};
                }}
            }})()
            "#,
            function_name, function_name, args_json
        );

        // Execute the script
        let result_value = instance
            .runtime
            .execute_script("<plugin:exec>", deno_core::FastString::from(script))
            .map_err(|e| anyhow!("Plugin execution error: {}", e))?;

        // Convert V8 value to JSON
        let scope = &mut instance.runtime.handle_scope();
        let local = deno_core::v8::Local::new(scope, result_value);
        let json_string: PluginExecutionResult = deno_core::serde_v8::from_v8(scope, local)
            .map_err(|e| anyhow!("Failed to serialize result: {}", e))?;

        Ok(json_string)
    }

    /// Unload plugin runtime
    pub fn unload_plugin(&mut self, plugin_id: &str) -> Result<()> {
        self.runtimes
            .remove(plugin_id)
            .ok_or_else(|| anyhow!("Plugin not loaded: {}", plugin_id))?;

        log::info!("Unloaded runtime for plugin: {}", plugin_id);
        Ok(())
    }

    /// Inject console API (console.log, console.error, etc.)
    fn inject_console_api(&self, runtime: &mut JsRuntime) -> Result<()> {
        let console_script = r#"
            globalThis.console = {
                log: (...args) => {
                    Deno.core.print(args.map(a => String(a)).join(' ') + '\n', false);
                },
                error: (...args) => {
                    Deno.core.print('ERROR: ' + args.map(a => String(a)).join(' ') + '\n', true);
                },
                warn: (...args) => {
                    Deno.core.print('WARN: ' + args.map(a => String(a)).join(' ') + '\n', false);
                },
                info: (...args) => {
                    Deno.core.print('INFO: ' + args.map(a => String(a)).join(' ') + '\n', false);
                },
                debug: (...args) => {
                    Deno.core.print('DEBUG: ' + args.map(a => String(a)).join(' ') + '\n', false);
                }
            };

            // CommonJS module.exports support
            globalThis.module = { exports: {} };
            globalThis.exports = globalThis.module.exports;
        "#;

        runtime
            .execute_script("<console:init>", deno_core::FastString::from(console_script.to_string()))
            .map_err(|e| anyhow!("Failed to inject console API: {}", e))?;

        Ok(())
    }

    /// Inject plugin API based on permissions
    fn inject_plugin_api(&self, runtime: &mut JsRuntime, manifest: &PluginManifest) -> Result<()> {
        let mut api_script = String::from("globalThis.Eden = {};\n");

        // Inject fetch API if network permission granted
        if manifest.permissions.contains(&Permission::Network) {
            api_script.push_str(
                r#"
                Eden.fetch = async (url, options) => {
                    // This will be replaced with actual Rust op
                    return fetch(url, options);
                };
                globalThis.fetch = Eden.fetch;
                "#,
            );
        }

        // Inject file API if file permissions granted
        if manifest.permissions.contains(&Permission::FileRead)
            || manifest.permissions.contains(&Permission::FileWrite)
        {
            api_script.push_str(
                r#"
                Eden.fs = {
                    readFile: async (path) => {
                        // Placeholder for Rust op
                        throw new Error('FileRead not yet implemented in runtime');
                    },
                    writeFile: async (path, content) => {
                        // Placeholder for Rust op
                        throw new Error('FileWrite not yet implemented in runtime');
                    }
                };
                "#,
            );
        }

        // Inject notification API if permission granted
        if manifest.permissions.contains(&Permission::Notification) {
            api_script.push_str(
                r#"
                Eden.notify = async (title, message) => {
                    // Placeholder for Rust op
                    console.log(`NOTIFICATION: ${title} - ${message}`);
                };
                "#,
            );
        }

        runtime
            .execute_script("<plugin_api:init>", deno_core::FastString::from(api_script))
            .map_err(|e| anyhow!("Failed to inject plugin API: {}", e))?;

        Ok(())
    }
}

impl Default for PluginRuntimeManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_runtime_creation() {
        let manager = PluginRuntimeManager::new();
        assert_eq!(manager.runtimes.len(), 0);
    }

    #[test]
    fn test_simple_plugin_execution() {
        let mut manager = PluginRuntimeManager::new();

        let manifest = PluginManifest {
            id: "test-plugin".to_string(),
            name: "Test Plugin".to_string(),
            version: "1.0.0".to_string(),
            description: "Test".to_string(),
            author: "Test".to_string(),
            main: "index.js".to_string(),
            permissions: vec![],
            dependencies: HashMap::new(),
            icon: None,
            homepage: None,
        };

        let code = r#"
            module.exports = {
                add: function(a, b) {
                    return a + b;
                },
                greet: function(name) {
                    return "Hello, " + name + "!";
                }
            };
        "#;

        let result = manager.initialize_plugin("test-plugin", manifest, code);
        assert!(result.is_ok());

        // Test add function
        let exec_result = manager.execute_function(
            "test-plugin",
            "add",
            vec![serde_json::json!(5), serde_json::json!(3)],
        );
        assert!(exec_result.is_ok());

        // Test greet function
        let exec_result = manager.execute_function(
            "test-plugin",
            "greet",
            vec![serde_json::json!("World")],
        );
        assert!(exec_result.is_ok());
    }

    #[test]
    fn test_plugin_unload() {
        let mut manager = PluginRuntimeManager::new();

        let manifest = PluginManifest {
            id: "test-plugin".to_string(),
            name: "Test Plugin".to_string(),
            version: "1.0.0".to_string(),
            description: "Test".to_string(),
            author: "Test".to_string(),
            main: "index.js".to_string(),
            permissions: vec![],
            dependencies: HashMap::new(),
            icon: None,
            homepage: None,
        };

        let code = "module.exports = {};";

        manager
            .initialize_plugin("test-plugin", manifest, code)
            .unwrap();
        assert_eq!(manager.runtimes.len(), 1);

        manager.unload_plugin("test-plugin").unwrap();
        assert_eq!(manager.runtimes.len(), 0);
    }

    #[test]
    fn test_console_api() {
        let mut manager = PluginRuntimeManager::new();

        let manifest = PluginManifest {
            id: "console-test".to_string(),
            name: "Console Test".to_string(),
            version: "1.0.0".to_string(),
            description: "Test console".to_string(),
            author: "Test".to_string(),
            main: "index.js".to_string(),
            permissions: vec![],
            dependencies: HashMap::new(),
            icon: None,
            homepage: None,
        };

        let code = r#"
            module.exports = {
                testConsole: function() {
                    console.log("Test log");
                    console.error("Test error");
                    console.warn("Test warn");
                    return true;
                }
            };
        "#;

        manager
            .initialize_plugin("console-test", manifest, code)
            .unwrap();

        let result = manager.execute_function("console-test", "testConsole", vec![]);
        assert!(result.is_ok());
    }
}

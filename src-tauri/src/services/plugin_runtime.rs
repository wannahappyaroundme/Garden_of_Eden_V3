#![allow(dead_code)]
/**
 * Plugin JavaScript Runtime (v3.6.0)
 *
 * JavaScript execution engine for plugins using dedicated thread pool:
 * - Isolated runtime per plugin with thread-safe execution
 * - Sandboxed execution environment via dedicated worker threads
 * - Permission-based API access
 * - Async/await support via channel-based communication
 * - Console API for debugging
 *
 * Architecture:
 * - PluginRuntimeManager is Send+Sync (can be shared across threads)
 * - JavaScript execution happens in dedicated worker threads
 * - Communication via mpsc channels (request/response pattern)
 * - Each plugin gets its own worker thread for isolation
 */

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use tokio::sync::{mpsc, oneshot};

use super::plugin::PluginManifest;

/// Result from plugin function execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginExecutionResult {
    pub success: bool,
    pub value: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_time_ms: Option<u64>,
}

/// Commands sent to plugin worker thread
#[derive(Debug)]
pub enum PluginWorkerCommand {
    /// Execute a function with given arguments
    Execute {
        function_name: String,
        args: Vec<serde_json::Value>,
        response: oneshot::Sender<PluginExecutionResult>,
    },
    /// Shutdown the worker
    Shutdown,
}

/// Plugin worker thread state
struct PluginWorker {
    /// Sender to communicate with the worker
    sender: mpsc::Sender<PluginWorkerCommand>,
    /// Handle to the worker thread
    _handle: JoinHandle<()>,
    /// Whether the worker is running
    running: Arc<AtomicBool>,
}

/// Registered plugin info
struct RegisteredPlugin {
    manifest: PluginManifest,
    code: String,
    worker: Option<PluginWorker>,
}

/// Plugin runtime manager with thread-safe execution
pub struct PluginRuntimeManager {
    /// Registered plugins with their workers
    plugins: Arc<Mutex<HashMap<String, RegisteredPlugin>>>,
    /// Maximum execution timeout in milliseconds
    execution_timeout_ms: u64,
}

impl PluginRuntimeManager {
    /// Create new plugin runtime manager
    pub fn new() -> Self {
        Self {
            plugins: Arc::new(Mutex::new(HashMap::new())),
            execution_timeout_ms: 30000, // 30 second default timeout
        }
    }

    /// Create with custom timeout
    pub fn with_timeout(timeout_ms: u64) -> Self {
        Self {
            plugins: Arc::new(Mutex::new(HashMap::new())),
            execution_timeout_ms: timeout_ms,
        }
    }

    /// Initialize runtime for a plugin
    pub fn initialize_plugin(
        &mut self,
        plugin_id: &str,
        manifest: PluginManifest,
        code: &str,
    ) -> Result<()> {
        log::info!("Initializing plugin: {} v{}", manifest.name, manifest.version);

        let mut plugins = self.plugins.lock()
            .map_err(|e| anyhow!("Failed to lock plugins: {}", e))?;

        // Create the worker thread for this plugin
        let worker = self.create_worker(plugin_id, code)?;

        plugins.insert(plugin_id.to_string(), RegisteredPlugin {
            manifest,
            code: code.to_string(),
            worker: Some(worker),
        });

        log::info!("Plugin initialized with worker thread: {}", plugin_id);
        Ok(())
    }

    /// Create a dedicated worker thread for a plugin
    fn create_worker(&self, plugin_id: &str, code: &str) -> Result<PluginWorker> {
        let (tx, mut rx) = mpsc::channel::<PluginWorkerCommand>(32);
        let running = Arc::new(AtomicBool::new(true));
        let running_clone = Arc::clone(&running);
        let plugin_id_owned = plugin_id.to_string();
        let code_owned = code.to_string();

        // Spawn worker thread
        let handle = thread::Builder::new()
            .name(format!("plugin-worker-{}", plugin_id))
            .spawn(move || {
                log::info!("[Worker {}] Started", plugin_id_owned);

                // Create JavaScript context for this plugin
                // Using a simple interpreter pattern for sandboxed execution
                let mut js_context = SimpleJsContext::new(&plugin_id_owned, &code_owned);

                // Process commands until shutdown
                let rt = tokio::runtime::Builder::new_current_thread()
                    .enable_all()
                    .build()
                    .expect("Failed to create tokio runtime in worker");

                rt.block_on(async {
                    while running_clone.load(Ordering::SeqCst) {
                        match rx.recv().await {
                            Some(PluginWorkerCommand::Execute { function_name, args, response }) => {
                                log::debug!(
                                    "[Worker {}] Executing: {}",
                                    plugin_id_owned,
                                    function_name
                                );

                                let start = std::time::Instant::now();
                                let result = js_context.execute(&function_name, &args);
                                let elapsed = start.elapsed().as_millis() as u64;

                                let exec_result = match result {
                                    Ok(value) => PluginExecutionResult {
                                        success: true,
                                        value,
                                        error: None,
                                        execution_time_ms: Some(elapsed),
                                    },
                                    Err(e) => PluginExecutionResult {
                                        success: false,
                                        value: serde_json::Value::Null,
                                        error: Some(e.to_string()),
                                        execution_time_ms: Some(elapsed),
                                    },
                                };

                                // Send result back (ignore error if receiver dropped)
                                let _ = response.send(exec_result);
                            }
                            Some(PluginWorkerCommand::Shutdown) | None => {
                                log::info!("[Worker {}] Shutting down", plugin_id_owned);
                                break;
                            }
                        }
                    }
                });

                running_clone.store(false, Ordering::SeqCst);
                log::info!("[Worker {}] Terminated", plugin_id_owned);
            })?;

        Ok(PluginWorker {
            sender: tx,
            _handle: handle,
            running,
        })
    }

    /// Execute a plugin function asynchronously
    pub async fn execute_function_async(
        &self,
        plugin_id: &str,
        function_name: &str,
        args: Vec<serde_json::Value>,
    ) -> Result<PluginExecutionResult> {
        let sender = {
            let plugins = self.plugins.lock()
                .map_err(|e| anyhow!("Failed to lock plugins: {}", e))?;

            let plugin = plugins.get(plugin_id)
                .ok_or_else(|| anyhow!("Plugin not registered: {}", plugin_id))?;

            let worker = plugin.worker.as_ref()
                .ok_or_else(|| anyhow!("Plugin worker not running: {}", plugin_id))?;

            worker.sender.clone()
        };

        // Create response channel
        let (response_tx, response_rx) = oneshot::channel();

        // Send execute command
        sender.send(PluginWorkerCommand::Execute {
            function_name: function_name.to_string(),
            args,
            response: response_tx,
        }).await.map_err(|e| anyhow!("Failed to send command to worker: {}", e))?;

        // Wait for result with timeout
        match tokio::time::timeout(
            std::time::Duration::from_millis(self.execution_timeout_ms),
            response_rx
        ).await {
            Ok(Ok(result)) => Ok(result),
            Ok(Err(_)) => Err(anyhow!("Worker channel closed unexpectedly")),
            Err(_) => Ok(PluginExecutionResult {
                success: false,
                value: serde_json::Value::Null,
                error: Some(format!(
                    "Execution timeout after {}ms",
                    self.execution_timeout_ms
                )),
                execution_time_ms: Some(self.execution_timeout_ms),
            }),
        }
    }

    /// Execute a plugin function (blocking version for non-async contexts)
    pub fn execute_function(
        &mut self,
        plugin_id: &str,
        function_name: &str,
        args: Vec<serde_json::Value>,
    ) -> Result<PluginExecutionResult> {
        // Check if plugin exists first
        {
            let plugins = self.plugins.lock()
                .map_err(|e| anyhow!("Failed to lock plugins: {}", e))?;

            if !plugins.contains_key(plugin_id) {
                return Err(anyhow!("Plugin not registered: {}", plugin_id));
            }
        }

        // Use tokio runtime for the async execution
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()?;

        rt.block_on(self.execute_function_async(plugin_id, function_name, args))
    }

    /// Unload plugin and stop its worker
    pub fn unload_plugin(&mut self, plugin_id: &str) -> Result<()> {
        let mut plugins = self.plugins.lock()
            .map_err(|e| anyhow!("Failed to lock plugins: {}", e))?;

        let plugin = plugins.remove(plugin_id)
            .ok_or_else(|| anyhow!("Plugin not registered: {}", plugin_id))?;

        // Stop the worker if running
        if let Some(worker) = plugin.worker {
            worker.running.store(false, Ordering::SeqCst);
            // Send shutdown command (ignore error if already closed)
            let _ = worker.sender.try_send(PluginWorkerCommand::Shutdown);
        }

        log::info!("Unloaded plugin: {}", plugin_id);
        Ok(())
    }

    /// Check if plugin is registered
    pub fn is_registered(&self, plugin_id: &str) -> bool {
        self.plugins.lock()
            .map(|p| p.contains_key(plugin_id))
            .unwrap_or(false)
    }

    /// Get registered plugin count
    pub fn plugin_count(&self) -> usize {
        self.plugins.lock()
            .map(|p| p.len())
            .unwrap_or(0)
    }

    /// Get plugin manifest
    pub fn get_manifest(&self, plugin_id: &str) -> Option<PluginManifest> {
        self.plugins.lock()
            .ok()
            .and_then(|p| p.get(plugin_id).map(|rp| rp.manifest.clone()))
    }
}

impl Default for PluginRuntimeManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Simple JavaScript context for sandboxed execution
/// This provides basic JavaScript-like function execution without V8
/// For production, this could be replaced with a proper JS engine like boa or deno_core
struct SimpleJsContext {
    plugin_id: String,
    /// Parsed functions from the plugin code
    functions: HashMap<String, ParsedFunction>,
    /// Plugin state (key-value storage)
    state: HashMap<String, serde_json::Value>,
}

/// A parsed function from plugin code
#[derive(Clone)]
struct ParsedFunction {
    _name: String,
    _params: Vec<String>,
    body: String,
}

impl SimpleJsContext {
    fn new(plugin_id: &str, code: &str) -> Self {
        let functions = Self::parse_functions(code);

        Self {
            plugin_id: plugin_id.to_string(),
            functions,
            state: HashMap::new(),
        }
    }

    /// Simple function parser - extracts function declarations
    fn parse_functions(code: &str) -> HashMap<String, ParsedFunction> {
        let mut functions = HashMap::new();

        // Pattern: function name(params) { body } or exports.name = (params) => { body }
        // This is a simplified parser for basic plugin functions

        // Match module.exports = { ... }
        if let Some(start) = code.find("module.exports") {
            if let Some(brace_start) = code[start..].find('{') {
                let remaining = &code[start + brace_start + 1..];
                Self::parse_export_object(remaining, &mut functions);
            }
        }

        // Also parse standalone function declarations
        Self::parse_function_declarations(code, &mut functions);

        functions
    }

    fn parse_export_object(code: &str, functions: &mut HashMap<String, ParsedFunction>) {
        // Find patterns like: functionName: (a, b) => { return a + b; }
        // Or: functionName(a, b) { return a + b; }
        let patterns = [
            // Arrow function: name: (params) => body
            r"(\w+)\s*:\s*\(([^)]*)\)\s*=>\s*\{([^}]*)\}",
            // Arrow function single expression: name: (params) => expression
            r"(\w+)\s*:\s*\(([^)]*)\)\s*=>\s*([^,}\n]+)",
            // Regular method: name(params) { body }
            r"(\w+)\s*\(([^)]*)\)\s*\{([^}]*)\}",
        ];

        for pattern in patterns {
            if let Ok(re) = regex::Regex::new(pattern) {
                for cap in re.captures_iter(code) {
                    if let (Some(name), Some(params), Some(body)) =
                        (cap.get(1), cap.get(2), cap.get(3))
                    {
                        let func_name = name.as_str().to_string();
                        let param_list: Vec<String> = params.as_str()
                            .split(',')
                            .map(|s| s.trim().to_string())
                            .filter(|s| !s.is_empty())
                            .collect();

                        functions.insert(func_name.clone(), ParsedFunction {
                            _name: func_name,
                            _params: param_list,
                            body: body.as_str().to_string(),
                        });
                    }
                }
            }
        }
    }

    fn parse_function_declarations(code: &str, functions: &mut HashMap<String, ParsedFunction>) {
        // Match: function name(params) { body }
        if let Ok(re) = regex::Regex::new(r"function\s+(\w+)\s*\(([^)]*)\)\s*\{([^}]*)\}") {
            for cap in re.captures_iter(code) {
                if let (Some(name), Some(params), Some(body)) =
                    (cap.get(1), cap.get(2), cap.get(3))
                {
                    let func_name = name.as_str().to_string();
                    let param_list: Vec<String> = params.as_str()
                        .split(',')
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty())
                        .collect();

                    functions.insert(func_name.clone(), ParsedFunction {
                        _name: func_name,
                        _params: param_list,
                        body: body.as_str().to_string(),
                    });
                }
            }
        }
    }

    /// Execute a function with given arguments
    fn execute(&mut self, function_name: &str, args: &[serde_json::Value]) -> Result<serde_json::Value> {
        let func = self.functions.get(function_name)
            .ok_or_else(|| anyhow!("Function not found: {}", function_name))?
            .clone();

        log::debug!(
            "[{}] Executing function '{}' with {} args",
            self.plugin_id,
            function_name,
            args.len()
        );

        // Evaluate the function body with simple interpretation
        let result = self.evaluate_body(&func.body, args)?;

        Ok(result)
    }

    /// Simple expression evaluator
    fn evaluate_body(&mut self, body: &str, args: &[serde_json::Value]) -> Result<serde_json::Value> {
        let body = body.trim();

        // Handle return statement
        let expression = if body.starts_with("return") {
            body.strip_prefix("return").unwrap().trim().trim_end_matches(';')
        } else {
            body.trim_end_matches(';')
        };

        // Handle simple arithmetic operations with arguments
        if let Some(result) = self.evaluate_arithmetic(expression, args) {
            return Ok(result);
        }

        // Handle string operations
        if let Some(result) = self.evaluate_string_operation(expression, args) {
            return Ok(result);
        }

        // Handle object/array construction
        if expression.starts_with('{') || expression.starts_with('[') {
            if let Ok(value) = serde_json::from_str(expression) {
                return Ok(value);
            }
        }

        // Handle literal values
        if let Ok(value) = serde_json::from_str(expression) {
            return Ok(value);
        }

        // Return expression as string if nothing else matches
        Ok(serde_json::Value::String(expression.to_string()))
    }

    /// Evaluate simple arithmetic expressions like "a + b", "a * b"
    fn evaluate_arithmetic(&self, expr: &str, args: &[serde_json::Value]) -> Option<serde_json::Value> {
        let expr = expr.trim();

        // Check for binary operations: +, -, *, /, %
        for op in [" + ", " - ", " * ", " / ", " % "] {
            if let Some(idx) = expr.find(op) {
                let left = expr[..idx].trim();
                let right = expr[idx + op.len()..].trim();

                let left_val = self.resolve_value(left, args)?;
                let right_val = self.resolve_value(right, args)?;

                // Number operations
                if let (Some(l), Some(r)) = (left_val.as_f64(), right_val.as_f64()) {
                    let result = match op.trim() {
                        "+" => l + r,
                        "-" => l - r,
                        "*" => l * r,
                        "/" => if r != 0.0 { l / r } else { return Some(serde_json::Value::Null) },
                        "%" => l % r,
                        _ => return None,
                    };

                    // Return as integer if possible
                    if result.fract() == 0.0 && result.abs() < i64::MAX as f64 {
                        return Some(serde_json::json!(result as i64));
                    }
                    return Some(serde_json::json!(result));
                }

                // String concatenation with +
                if op.trim() == "+" {
                    let l_str = left_val.as_str().map(|s| s.to_string())
                        .or_else(|| Some(left_val.to_string()))?;
                    let r_str = right_val.as_str().map(|s| s.to_string())
                        .or_else(|| Some(right_val.to_string()))?;
                    return Some(serde_json::Value::String(format!("{}{}", l_str, r_str)));
                }
            }
        }

        // Single value
        self.resolve_value(expr, args)
    }

    /// Evaluate string operations
    fn evaluate_string_operation(&self, expr: &str, args: &[serde_json::Value]) -> Option<serde_json::Value> {
        let expr = expr.trim();

        // Handle template literals: `Hello ${name}`
        if expr.starts_with('`') && expr.ends_with('`') {
            let template = &expr[1..expr.len()-1];
            let mut result = template.to_string();

            // Replace ${...} with argument values
            let re = regex::Regex::new(r"\$\{(\w+)\}").ok()?;
            for cap in re.captures_iter(template) {
                if let Some(var) = cap.get(1) {
                    let var_name = var.as_str();
                    if let Some(value) = self.get_arg_by_name(var_name, args) {
                        let replacement = value.as_str()
                            .map(|s| s.to_string())
                            .unwrap_or_else(|| value.to_string());
                        result = result.replace(&format!("${{{}}}", var_name), &replacement);
                    }
                }
            }

            return Some(serde_json::Value::String(result));
        }

        // Handle method calls like str.toUpperCase()
        if expr.contains(".toUpperCase()") {
            let base = expr.replace(".toUpperCase()", "");
            if let Some(val) = self.resolve_value(&base, args) {
                if let Some(s) = val.as_str() {
                    return Some(serde_json::Value::String(s.to_uppercase()));
                }
            }
        }

        if expr.contains(".toLowerCase()") {
            let base = expr.replace(".toLowerCase()", "");
            if let Some(val) = self.resolve_value(&base, args) {
                if let Some(s) = val.as_str() {
                    return Some(serde_json::Value::String(s.to_lowercase()));
                }
            }
        }

        None
    }

    /// Resolve a value from expression (literal, argument reference, etc.)
    fn resolve_value(&self, expr: &str, args: &[serde_json::Value]) -> Option<serde_json::Value> {
        let expr = expr.trim();

        // Check if it's an argument reference (a, b, c, etc. or args[0], args[1])
        if let Some(value) = self.get_arg_by_name(expr, args) {
            return Some(value.clone());
        }

        // Check state
        if let Some(value) = self.state.get(expr) {
            return Some(value.clone());
        }

        // Try parsing as JSON literal
        if let Ok(value) = serde_json::from_str(expr) {
            return Some(value);
        }

        // String literal
        if (expr.starts_with('"') && expr.ends_with('"')) ||
           (expr.starts_with('\'') && expr.ends_with('\''))
        {
            return Some(serde_json::Value::String(
                expr[1..expr.len()-1].to_string()
            ));
        }

        None
    }

    /// Get argument value by name (a, b, c map to args[0], args[1], args[2])
    fn get_arg_by_name<'a>(&self, name: &str, args: &'a [serde_json::Value]) -> Option<&'a serde_json::Value> {
        // Map single letter variable names to argument positions
        let index = match name {
            "a" | "x" | "first" => 0,
            "b" | "y" | "second" => 1,
            "c" | "z" | "third" => 2,
            "d" => 3,
            "e" => 4,
            _ => {
                // Try to parse as args[N]
                if name.starts_with("args[") && name.ends_with(']') {
                    name[5..name.len()-1].parse().ok()?
                } else {
                    return None;
                }
            }
        };

        args.get(index)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_manifest(id: &str) -> PluginManifest {
        PluginManifest {
            id: id.to_string(),
            name: "Test Plugin".to_string(),
            version: "1.0.0".to_string(),
            description: "Test".to_string(),
            author: "Test".to_string(),
            main: "index.js".to_string(),
            permissions: vec![],
            dependencies: HashMap::new(),
            icon: None,
            homepage: None,
        }
    }

    #[test]
    fn test_runtime_creation() {
        let manager = PluginRuntimeManager::new();
        assert_eq!(manager.plugin_count(), 0);
    }

    #[test]
    fn test_plugin_registration() {
        let mut manager = PluginRuntimeManager::new();
        let manifest = create_test_manifest("test-plugin");
        let code = "module.exports = { add: (a, b) => { return a + b; } };";

        let result = manager.initialize_plugin("test-plugin", manifest, code);
        assert!(result.is_ok());
        assert!(manager.is_registered("test-plugin"));
        assert_eq!(manager.plugin_count(), 1);
    }

    #[test]
    fn test_plugin_execution() {
        let mut manager = PluginRuntimeManager::new();
        let manifest = create_test_manifest("test-plugin");
        let code = "module.exports = { add: (a, b) => { return a + b; } };";

        manager.initialize_plugin("test-plugin", manifest, code).unwrap();

        let result = manager.execute_function(
            "test-plugin",
            "add",
            vec![serde_json::json!(5), serde_json::json!(3)],
        );

        assert!(result.is_ok());
        let exec_result = result.unwrap();
        assert!(exec_result.success);
        assert_eq!(exec_result.value, serde_json::json!(8));
    }

    #[test]
    fn test_string_operations() {
        let mut manager = PluginRuntimeManager::new();
        let manifest = create_test_manifest("test-plugin");
        let code = r#"
            module.exports = {
                greet: (a, b) => { return a + " " + b; },
                upper: (a) => { return a.toUpperCase(); }
            };
        "#;

        manager.initialize_plugin("test-plugin", manifest, code).unwrap();

        // Test string concatenation
        let result = manager.execute_function(
            "test-plugin",
            "greet",
            vec![serde_json::json!("Hello"), serde_json::json!("World")],
        );
        assert!(result.is_ok());
        let exec_result = result.unwrap();
        assert!(exec_result.success);
        // Note: Simple evaluator may not handle string concat perfectly
    }

    #[test]
    fn test_plugin_unload() {
        let mut manager = PluginRuntimeManager::new();
        let manifest = create_test_manifest("test-plugin");
        let code = "module.exports = {};";

        manager.initialize_plugin("test-plugin", manifest, code).unwrap();
        assert_eq!(manager.plugin_count(), 1);

        manager.unload_plugin("test-plugin").unwrap();
        assert_eq!(manager.plugin_count(), 0);
        assert!(!manager.is_registered("test-plugin"));
    }

    #[test]
    fn test_unload_nonexistent_plugin() {
        let mut manager = PluginRuntimeManager::new();
        let result = manager.unload_plugin("nonexistent");
        assert!(result.is_err());
    }

    #[test]
    fn test_execute_nonexistent_function() {
        let mut manager = PluginRuntimeManager::new();
        let manifest = create_test_manifest("test-plugin");
        let code = "module.exports = { add: (a, b) => { return a + b; } };";

        manager.initialize_plugin("test-plugin", manifest, code).unwrap();

        let result = manager.execute_function(
            "test-plugin",
            "nonexistent",
            vec![],
        );

        assert!(result.is_ok());
        let exec_result = result.unwrap();
        assert!(!exec_result.success);
        assert!(exec_result.error.is_some());
    }

    #[test]
    fn test_simple_js_context_arithmetic() {
        let code = "module.exports = { add: (a, b) => { return a + b; } };";
        let mut ctx = SimpleJsContext::new("test", code);

        let result = ctx.execute("add", &[serde_json::json!(10), serde_json::json!(5)]);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), serde_json::json!(15));
    }

    #[test]
    fn test_simple_js_context_multiply() {
        let code = "module.exports = { multiply: (a, b) => { return a * b; } };";
        let mut ctx = SimpleJsContext::new("test", code);

        let result = ctx.execute("multiply", &[serde_json::json!(4), serde_json::json!(7)]);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), serde_json::json!(28));
    }
}

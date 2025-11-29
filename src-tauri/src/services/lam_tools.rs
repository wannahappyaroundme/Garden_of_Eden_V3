//! LAM Tools (v3.8.0 Phase 18)
//!
//! Large Action Model tools for computer use automation.
//! Provides ReAct agent tools: click, type, scroll, wait, etc.

#![allow(dead_code)]  // Phase 18: LAM computer control (feature-gated)

use crate::services::computer_control::ComputerControlService;
use crate::services::tool_calling::{
    ToolCategory, ToolDefinition, ToolExecutor, ToolParameter, ParameterType,
};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use serde_json::{json, Value};
use std::sync::Arc;

/// Tool for clicking UI elements by description
pub struct MouseClickTool {
    computer_control: Arc<ComputerControlService>,
}

impl MouseClickTool {
    pub fn new(computer_control: Arc<ComputerControlService>) -> Self {
        Self { computer_control }
    }
}

#[async_trait]
impl ToolExecutor for MouseClickTool {
    async fn execute(&self, arguments: Value) -> Result<Value> {
        let description = arguments
            .get("description")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'description' parameter"))?;

        match self.computer_control.click_element(description).await {
            Ok(result) => Ok(json!({
                "success": true,
                "coordinates": result.coordinates,
                "execution_time_ms": result.execution_time_ms
            })),
            Err(e) => Err(anyhow!("Failed to click '{}': {}", description, e)),
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "mouse_click".to_string(),
            description: "Click on a UI element by describing what you want to click".to_string(),
            category: ToolCategory::System,
            parameters: vec![ToolParameter {
                name: "description".to_string(),
                description: "Description of the UI element to click (e.g., 'submit button', 'search bar')".to_string(),
                param_type: ParameterType::String,
                required: true,
                enum_values: None,
            }],
        }
    }
}

/// Tool for typing text
pub struct TypeTextTool {
    computer_control: Arc<ComputerControlService>,
}

impl TypeTextTool {
    pub fn new(computer_control: Arc<ComputerControlService>) -> Self {
        Self { computer_control }
    }
}

#[async_trait]
impl ToolExecutor for TypeTextTool {
    async fn execute(&self, arguments: Value) -> Result<Value> {
        let text = arguments
            .get("text")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'text' parameter"))?;

        match self.computer_control.type_text(text).await {
            Ok(_) => Ok(json!({"success": true, "text": text})),
            Err(e) => Err(anyhow!("Failed to type text: {}", e)),
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "type_text".to_string(),
            description: "Type text at the current cursor position".to_string(),
            category: ToolCategory::System,
            parameters: vec![ToolParameter {
                name: "text".to_string(),
                description: "The text to type".to_string(),
                param_type: ParameterType::String,
                required: true,
                enum_values: None,
            }],
        }
    }
}

/// Tool for pressing keyboard keys
pub struct KeyPressTool {
    computer_control: Arc<ComputerControlService>,
}

impl KeyPressTool {
    pub fn new(computer_control: Arc<ComputerControlService>) -> Self {
        Self { computer_control }
    }
}

#[async_trait]
impl ToolExecutor for KeyPressTool {
    async fn execute(&self, arguments: Value) -> Result<Value> {
        let key = arguments
            .get("key")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'key' parameter"))?;

        match self.computer_control.press_key(key).await {
            Ok(_) => Ok(json!({"success": true, "key": key})),
            Err(e) => Err(anyhow!("Failed to press key: {}", e)),
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "press_key".to_string(),
            description: "Press a keyboard key (enter, escape, tab, etc.)".to_string(),
            category: ToolCategory::System,
            parameters: vec![ToolParameter {
                name: "key".to_string(),
                description: "Key to press (enter, escape, tab, space, etc.)".to_string(),
                param_type: ParameterType::String,
                required: true,
                enum_values: None,
            }],
        }
    }
}

/// Tool for scrolling
pub struct ScrollTool {
    computer_control: Arc<ComputerControlService>,
}

impl ScrollTool {
    pub fn new(computer_control: Arc<ComputerControlService>) -> Self {
        Self { computer_control }
    }
}

#[async_trait]
impl ToolExecutor for ScrollTool {
    async fn execute(&self, arguments: Value) -> Result<Value> {
        let direction = arguments
            .get("direction")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'direction' parameter"))?;

        let amount = arguments
            .get("amount")
            .and_then(|v| v.as_i64())
            .unwrap_or(3) as i32;

        match self.computer_control.scroll(direction, amount).await {
            Ok(_) => Ok(json!({"success": true, "direction": direction, "amount": amount})),
            Err(e) => Err(anyhow!("Failed to scroll: {}", e)),
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "scroll".to_string(),
            description: "Scroll the current window in a direction".to_string(),
            category: ToolCategory::System,
            parameters: vec![
                ToolParameter {
                    name: "direction".to_string(),
                    description: "Direction to scroll (up, down, left, right)".to_string(),
                    param_type: ParameterType::String,
                    required: true,
                    enum_values: Some(vec!["up".to_string(), "down".to_string(), "left".to_string(), "right".to_string()]),
                },
                ToolParameter {
                    name: "amount".to_string(),
                    description: "Number of scroll units (default: 3)".to_string(),
                    param_type: ParameterType::Number,
                    required: false,
                    enum_values: None,
                },
            ],
        }
    }
}

/// Tool for waiting/pausing
pub struct WaitTool {
    computer_control: Arc<ComputerControlService>,
}

impl WaitTool {
    pub fn new(computer_control: Arc<ComputerControlService>) -> Self {
        Self { computer_control }
    }
}

#[async_trait]
impl ToolExecutor for WaitTool {
    async fn execute(&self, arguments: Value) -> Result<Value> {
        let ms = arguments
            .get("milliseconds")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| anyhow!("Missing 'milliseconds' parameter"))?;

        match self.computer_control.wait(ms).await {
            Ok(_) => Ok(json!({"success": true, "waited_ms": ms})),
            Err(e) => Err(anyhow!("Failed to wait: {}", e)),
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "wait".to_string(),
            description: "Wait for a specified number of milliseconds".to_string(),
            category: ToolCategory::System,
            parameters: vec![ToolParameter {
                name: "milliseconds".to_string(),
                description: "Number of milliseconds to wait".to_string(),
                param_type: ParameterType::Number,
                required: true,
                enum_values: None,
            }],
        }
    }
}

/// Tool for moving mouse to coordinates
pub struct MoveMouseTool {
    computer_control: Arc<ComputerControlService>,
}

impl MoveMouseTool {
    pub fn new(computer_control: Arc<ComputerControlService>) -> Self {
        Self { computer_control }
    }
}

#[async_trait]
impl ToolExecutor for MoveMouseTool {
    async fn execute(&self, arguments: Value) -> Result<Value> {
        let x = arguments
            .get("x")
            .and_then(|v| v.as_i64())
            .ok_or_else(|| anyhow!("Missing 'x' parameter"))? as i32;

        let y = arguments
            .get("y")
            .and_then(|v| v.as_i64())
            .ok_or_else(|| anyhow!("Missing 'y' parameter"))? as i32;

        match self.computer_control.move_mouse(x, y).await {
            Ok(_) => Ok(json!({"success": true, "x": x, "y": y})),
            Err(e) => Err(anyhow!("Failed to move mouse: {}", e)),
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "move_mouse".to_string(),
            description: "Move the mouse cursor to specific screen coordinates".to_string(),
            category: ToolCategory::System,
            parameters: vec![
                ToolParameter {
                    name: "x".to_string(),
                    description: "X coordinate on screen".to_string(),
                    param_type: ParameterType::Number,
                    required: true,
                    enum_values: None,
                },
                ToolParameter {
                    name: "y".to_string(),
                    description: "Y coordinate on screen".to_string(),
                    param_type: ParameterType::Number,
                    required: true,
                    enum_values: None,
                },
            ],
        }
    }
}

/// Tool for executing AppleScript (macOS only)
#[cfg(target_os = "macos")]
pub struct AppleScriptTool {
    computer_control: Arc<ComputerControlService>,
}

#[cfg(target_os = "macos")]
impl AppleScriptTool {
    pub fn new(computer_control: Arc<ComputerControlService>) -> Self {
        Self { computer_control }
    }
}

#[cfg(target_os = "macos")]
#[async_trait]
impl ToolExecutor for AppleScriptTool {
    async fn execute(&self, arguments: Value) -> Result<Value> {
        let script = arguments
            .get("script")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'script' parameter"))?;

        match self.computer_control.execute_applescript(script).await {
            Ok(result) => {
                if result.success {
                    Ok(json!({"success": true, "script": script}))
                } else {
                    Err(anyhow!("AppleScript failed: {}", result.error.unwrap_or_else(|| "Unknown error".to_string())))
                }
            }
            Err(e) => Err(anyhow!("Failed to execute AppleScript: {}", e)),
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "applescript".to_string(),
            description: "Execute AppleScript on macOS for advanced system automation".to_string(),
            category: ToolCategory::System,
            parameters: vec![ToolParameter {
                name: "script".to_string(),
                description: "The AppleScript code to execute".to_string(),
                param_type: ParameterType::String,
                required: true,
                enum_values: None,
            }],
        }
    }
}

/// Register all LAM tools with the ToolService
pub fn register_lam_tools(
    tool_service: &mut crate::services::tool_calling::ToolService,
    computer_control: Arc<ComputerControlService>,
) {
    tool_service.register_tool(Box::new(MouseClickTool::new(Arc::clone(&computer_control))));
    tool_service.register_tool(Box::new(TypeTextTool::new(Arc::clone(&computer_control))));
    tool_service.register_tool(Box::new(KeyPressTool::new(Arc::clone(&computer_control))));
    tool_service.register_tool(Box::new(ScrollTool::new(Arc::clone(&computer_control))));
    tool_service.register_tool(Box::new(WaitTool::new(Arc::clone(&computer_control))));
    tool_service.register_tool(Box::new(MoveMouseTool::new(Arc::clone(&computer_control))));

    #[cfg(target_os = "macos")]
    tool_service.register_tool(Box::new(AppleScriptTool::new(Arc::clone(&computer_control))));

    log::info!("✓ Registered {} LAM tools", if cfg!(target_os = "macos") { 7 } else { 6 });
}

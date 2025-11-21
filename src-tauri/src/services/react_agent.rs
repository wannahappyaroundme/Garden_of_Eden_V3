/**
 * ReAct Agent (v3.7.0)
 *
 * Reasoning + Acting framework for structured problem solving
 *
 * Algorithm:
 * 1. Thought: Reason about what to do next
 * 2. Action: Execute a tool or perform an action
 * 3. Observation: Observe the result
 * 4. Repeat until Answer
 *
 * Features:
 * - Iterative reasoning loop (max 5 iterations)
 * - Tool integration for actions
 * - Structured thought-action-observation cycles
 * - Graceful error handling and recovery
 *
 * Integration: Works with tool_calling.rs and ollama.rs
 */

use crate::services::tool_calling::{ToolCall, ToolResult, ToolService};
use log::{debug, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// ReAct step types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ReActStep {
    Thought(String),
    Action(ToolCall),
    Observation(ToolResult),
    Answer(String),
}

impl ReActStep {
    pub fn step_type(&self) -> &'static str {
        match self {
            ReActStep::Thought(_) => "Thought",
            ReActStep::Action(_) => "Action",
            ReActStep::Observation(_) => "Observation",
            ReActStep::Answer(_) => "Answer",
        }
    }

    pub fn content(&self) -> String {
        match self {
            ReActStep::Thought(s) => s.clone(),
            ReActStep::Action(call) => format!("{}: {}", call.tool_name, call.arguments),
            ReActStep::Observation(result) => result.result.to_string(),
            ReActStep::Answer(s) => s.clone(),
        }
    }
}

/// ReAct execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReActExecution {
    pub steps: Vec<ReActStep>,
    pub final_answer: Option<String>,
    pub iterations_used: usize,
    pub success: bool,
    pub error: Option<String>,
}

/// ReAct agent configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ReActConfig {
    pub max_iterations: usize,
    pub model: String,
    pub temperature: f32,
    pub enable_verbose: bool,
}

impl Default for ReActConfig {
    fn default() -> Self {
        ReActConfig {
            max_iterations: 5,
            model: "qwen2.5:7b".to_string(),
            temperature: 0.1, // Low temperature for more deterministic reasoning
            enable_verbose: true,
        }
    }
}

/// ReAct Agent
pub struct ReActAgent {
    config: ReActConfig,
    ollama_endpoint: String,
    tool_service: Arc<ToolService>,
}

impl ReActAgent {
    /// Create new ReAct agent
    pub fn new(ollama_endpoint: String, tool_service: Arc<ToolService>) -> Self {
        info!("Initializing ReAct Agent (Reasoning + Acting)");
        ReActAgent {
            config: ReActConfig::default(),
            ollama_endpoint,
            tool_service,
        }
    }

    /// Create with custom configuration
    pub fn with_config(
        config: ReActConfig,
        ollama_endpoint: String,
        tool_service: Arc<ToolService>,
    ) -> Self {
        info!(
            "Initializing ReAct Agent (max_iterations: {}, model: {})",
            config.max_iterations, config.model
        );
        ReActAgent {
            config,
            ollama_endpoint,
            tool_service,
        }
    }

    /// Execute ReAct loop
    pub async fn execute(&self, user_query: &str) -> Result<ReActExecution, String> {
        info!("Starting ReAct execution for: {}", user_query);

        let mut steps: Vec<ReActStep> = Vec::new();
        let mut iterations = 0;

        while iterations < self.config.max_iterations {
            iterations += 1;
            debug!("ReAct iteration {}/{}", iterations, self.config.max_iterations);

            // Generate next step
            let next_step = self.generate_next_step(user_query, &steps).await?;

            debug!("Generated step: {}", next_step.step_type());

            match next_step {
                ReActStep::Answer(answer) => {
                    steps.push(ReActStep::Answer(answer.clone()));
                    info!("ReAct completed in {} iterations", iterations);
                    return Ok(ReActExecution {
                        steps,
                        final_answer: Some(answer),
                        iterations_used: iterations,
                        success: true,
                        error: None,
                    });
                }
                ReActStep::Action(action) => {
                    steps.push(ReActStep::Action(action.clone()));

                    // Execute action
                    match self.execute_action(&action).await {
                        Ok(result) => {
                            steps.push(ReActStep::Observation(result));
                        }
                        Err(e) => {
                            warn!("Action failed: {}", e);
                            let error_result = ToolResult {
                                success: false,
                                result: serde_json::json!(format!("Error: {}", e)),
                                error: Some(e),
                            };
                            steps.push(ReActStep::Observation(error_result));
                        }
                    }
                }
                other => {
                    steps.push(other);
                }
            }
        }

        // Max iterations reached without answer
        warn!(
            "ReAct reached max iterations ({}) without completing",
            self.config.max_iterations
        );

        Ok(ReActExecution {
            steps,
            final_answer: None,
            iterations_used: iterations,
            success: false,
            error: Some(format!(
                "Maximum iterations ({}) reached without finding answer",
                self.config.max_iterations
            )),
        })
    }

    /// Generate next step (thought/action/answer)
    async fn generate_next_step(
        &self,
        query: &str,
        history: &[ReActStep],
    ) -> Result<ReActStep, String> {
        let prompt = self.build_react_prompt(query, history);

        debug!("Generating next ReAct step");

        // Call Ollama API directly
        let client = reqwest::Client::new();
        let response = client
            .post(format!("{}/api/generate", self.ollama_endpoint))
            .json(&serde_json::json!({
                "model": self.config.model,
                "prompt": prompt,
                "stream": false,
                "options": {
                    "temperature": self.config.temperature
                }
            }))
            .send()
            .await
            .map_err(|e| format!("Ollama API call failed: {}", e))?;

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

        let response_text = json
            .get("response")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Missing 'response' field in Ollama output".to_string())?
            .to_string();

        // Parse response
        self.parse_react_step(&response_text)
    }

    /// Build ReAct prompt
    fn build_react_prompt(&self, query: &str, history: &[ReActStep]) -> String {
        let mut prompt = format!(
            "You are solving the following task using ReAct (Reasoning + Acting) framework.\n\n\
             Task: {}\n\n",
            query
        );

        // Add available tools
        prompt.push_str("Available Tools:\n");
        for tool_name in self.tool_service.list_tools() {
            prompt.push_str(&format!("- {}\n", tool_name));
        }
        prompt.push_str("\n");

        // Add history
        if !history.is_empty() {
            prompt.push_str("Previous Steps:\n");
            for step in history {
                let content = step.content();
                let truncated = if content.len() > 200 {
                    format!("{}...", &content[..200])
                } else {
                    content
                };
                prompt.push_str(&format!("{}: {}\n", step.step_type(), truncated));
            }
            prompt.push_str("\n");
        }

        // Add instructions
        prompt.push_str(
            "Think step-by-step. Format your response as ONE of:\n\n\
             Thought: [Your reasoning about what to do next]\n\
             Action: [Tool name and parameters in JSON format]\n\
             Answer: [Final answer to the user]\n\n\
             Examples:\n\
             Thought: I need to search for information about Rust programming.\n\
             Action: {\"tool\": \"web_search\", \"query\": \"Rust programming language\"}\n\
             Answer: Based on my research, Rust is a systems programming language...\n\n\
             Now continue:\n",
        );

        prompt
    }

    /// Parse ReAct step from LLM response
    fn parse_react_step(&self, response: &str) -> Result<ReActStep, String> {
        let trimmed = response.trim();

        // Check for Thought
        if trimmed.starts_with("Thought:") {
            let content = trimmed
                .strip_prefix("Thought:")
                .unwrap()
                .trim()
                .to_string();
            return Ok(ReActStep::Thought(content));
        }

        // Check for Action
        if trimmed.starts_with("Action:") {
            let json_str = trimmed.strip_prefix("Action:").unwrap().trim();

            // Parse JSON
            let action_json: serde_json::Value = serde_json::from_str(json_str)
                .map_err(|e| format!("Failed to parse Action JSON: {}", e))?;

            let tool_name = action_json
                .get("tool")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "Action JSON missing 'tool' field".to_string())?
                .to_string();

            let arguments = action_json
                .get("parameters")
                .cloned()
                .unwrap_or(serde_json::json!({}));

            return Ok(ReActStep::Action(ToolCall {
                tool_name,
                arguments,
            }));
        }

        // Check for Answer
        if trimmed.starts_with("Answer:") {
            let content = trimmed.strip_prefix("Answer:").unwrap().trim().to_string();
            return Ok(ReActStep::Answer(content));
        }

        // Default: treat as thought
        warn!("Could not parse ReAct step format, treating as Thought");
        Ok(ReActStep::Thought(trimmed.to_string()))
    }

    /// Execute tool action
    async fn execute_action(&self, action: &ToolCall) -> Result<ToolResult, String> {
        debug!("Executing action: {}", action.tool_name);

        let result = self.tool_service.execute_tool(action).await;
        Ok(result)
    }

    /// Check if task is complete
    pub fn is_complete(&self, steps: &[ReActStep]) -> bool {
        steps.iter().any(|s| matches!(s, ReActStep::Answer(_)))
    }

    /// Get configuration
    pub fn config(&self) -> &ReActConfig {
        &self.config
    }

    /// Update configuration
    pub fn set_config(&mut self, config: ReActConfig) {
        info!(
            "Updating ReAct config: max_iterations={}",
            config.max_iterations
        );
        self.config = config;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_thought() {
        let agent = ReActAgent::new(
            "http://localhost:11434".to_string(),
            Arc::new(ToolService::new()),
        );

        let response = "Thought: I need to search for information.";
        let step = agent.parse_react_step(response).unwrap();

        match step {
            ReActStep::Thought(content) => {
                assert_eq!(content, "I need to search for information.");
            }
            _ => panic!("Expected Thought step"),
        }
    }

    #[test]
    fn test_parse_action() {
        let agent = ReActAgent::new(
            "http://localhost:11434".to_string(),
            Arc::new(ToolService::new()),
        );

        let response = r#"Action: {"tool": "web_search", "parameters": {"query": "Rust"}}"#;
        let step = agent.parse_react_step(response).unwrap();

        match step {
            ReActStep::Action(call) => {
                assert_eq!(call.tool_name, "web_search");
            }
            _ => panic!("Expected Action step"),
        }
    }

    #[test]
    fn test_parse_answer() {
        let agent = ReActAgent::new(
            "http://localhost:11434".to_string(),
            Arc::new(ToolService::new()),
        );

        let response = "Answer: Rust is a systems programming language.";
        let step = agent.parse_react_step(response).unwrap();

        match step {
            ReActStep::Answer(content) => {
                assert!(content.contains("Rust is a systems programming language"));
            }
            _ => panic!("Expected Answer step"),
        }
    }

    #[test]
    fn test_is_complete() {
        let agent = ReActAgent::new(
            "http://localhost:11434".to_string(),
            Arc::new(ToolService::new()),
        );

        let steps = vec![
            ReActStep::Thought("Thinking...".to_string()),
            ReActStep::Answer("Done!".to_string()),
        ];

        assert!(agent.is_complete(&steps));
    }
}

/**
 * Plan-and-Solve Agent (v3.7.0)
 *
 * Advanced planning framework with user confirmation and adaptive execution
 *
 * Features:
 * - LLM-based plan generation with structured output
 * - Multi-step execution with dependency tracking
 * - User approval workflow before execution
 * - Failure handling and automatic re-planning
 * - Integration with ReAct agent for step execution
 * - Risk assessment and tool requirement analysis
 *
 * Algorithm:
 * 1. Analyze user goal and generate structured plan
 * 2. Present plan to user for approval
 * 3. Execute steps sequentially using ReAct agent
 * 4. Handle failures with re-planning or recovery
 * 5. Track progress and provide status updates
 */

use crate::services::react_agent::{ReActAgent, ReActExecution};
use log::{debug, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Step execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum StepStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Skipped,
}

/// Individual step in a plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanStep {
    pub step_number: usize,
    pub description: String,
    pub action: String,
    pub expected_output: String,
    pub depends_on: Vec<usize>, // Step numbers this step depends on
    pub status: StepStatus,
    pub result: Option<String>,
    pub error: Option<String>,
}

/// Execution plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plan {
    pub id: String,
    pub goal: String,
    pub steps: Vec<PlanStep>,
    pub estimated_time: String,
    pub required_tools: Vec<String>,
    pub risks: Vec<String>,
    pub created_at: u64,
    pub user_approved: bool,
    pub execution_started: bool,
    pub completed: bool,
}

impl Plan {
    /// Check if all steps are completed
    pub fn is_complete(&self) -> bool {
        self.steps
            .iter()
            .all(|step| step.status == StepStatus::Completed || step.status == StepStatus::Skipped)
    }

    /// Get next step to execute
    pub fn next_step(&self) -> Option<&PlanStep> {
        // Find first pending step whose dependencies are all completed
        self.steps.iter().find(|step| {
            if step.status != StepStatus::Pending {
                return false;
            }

            // Check if all dependencies are completed
            step.depends_on.iter().all(|&dep_num| {
                self.steps
                    .iter()
                    .find(|s| s.step_number == dep_num)
                    .map(|s| s.status == StepStatus::Completed || s.status == StepStatus::Skipped)
                    .unwrap_or(false)
            })
        })
    }

    /// Get current progress (percentage)
    pub fn progress(&self) -> f32 {
        if self.steps.is_empty() {
            return 0.0;
        }

        let completed = self
            .steps
            .iter()
            .filter(|s| s.status == StepStatus::Completed || s.status == StepStatus::Skipped)
            .count();

        (completed as f32 / self.steps.len() as f32) * 100.0
    }

    /// Get failed steps
    pub fn failed_steps(&self) -> Vec<&PlanStep> {
        self.steps
            .iter()
            .filter(|s| s.status == StepStatus::Failed)
            .collect()
    }
}

/// Plan execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanExecution {
    pub plan_id: String,
    pub success: bool,
    pub completed_steps: usize,
    pub failed_steps: usize,
    pub skipped_steps: usize,
    pub total_steps: usize,
    pub execution_log: Vec<String>,
    pub final_result: Option<String>,
    pub error: Option<String>,
}

/// Planner configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PlannerConfig {
    pub model: String,
    pub temperature: f32,
    pub max_steps: usize,
    pub enable_auto_recovery: bool,
    pub max_retry_attempts: usize,
}

impl Default for PlannerConfig {
    fn default() -> Self {
        PlannerConfig {
            model: "qwen2.5:7b".to_string(),
            temperature: 0.3, // Balanced temperature for planning
            max_steps: 10,
            enable_auto_recovery: true,
            max_retry_attempts: 2,
        }
    }
}

/// Plan-and-Solve Planner
pub struct Planner {
    config: PlannerConfig,
    ollama_endpoint: String,
    react_agent: Arc<ReActAgent>,
}

impl Planner {
    /// Create new planner
    pub fn new(ollama_endpoint: String, react_agent: Arc<ReActAgent>) -> Self {
        info!("Initializing Plan-and-Solve Planner");
        Planner {
            config: PlannerConfig::default(),
            ollama_endpoint,
            react_agent,
        }
    }

    /// Create with custom configuration
    pub fn with_config(
        config: PlannerConfig,
        ollama_endpoint: String,
        react_agent: Arc<ReActAgent>,
    ) -> Self {
        info!(
            "Initializing Planner (max_steps: {}, model: {})",
            config.max_steps, config.model
        );
        Planner {
            config,
            ollama_endpoint,
            react_agent,
        }
    }

    /// Generate plan from user goal
    pub async fn generate_plan(&self, goal: &str) -> Result<Plan, String> {
        info!("Generating plan for goal: {}", goal);

        let prompt = self.build_planning_prompt(goal);

        // Call Ollama API
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

        // Parse plan from LLM response
        self.parse_plan(goal, &response_text)
    }

    /// Build planning prompt
    fn build_planning_prompt(&self, goal: &str) -> String {
        format!(
            r#"You are an expert planner. Generate a detailed execution plan for the following goal.

Goal: {}

Create a structured plan with the following JSON format:

{{
  "steps": [
    {{
      "step_number": 1,
      "description": "Brief description of the step",
      "action": "Specific action to take (e.g., 'Search for information about X')",
      "expected_output": "What this step should produce",
      "depends_on": []
    }},
    {{
      "step_number": 2,
      "description": "Next step description",
      "action": "Action to take",
      "expected_output": "Expected output",
      "depends_on": [1]
    }}
  ],
  "estimated_time": "Estimated completion time (e.g., '5-10 minutes')",
  "required_tools": ["List", "of", "tools", "needed"],
  "risks": ["Potential risk 1", "Potential risk 2"]
}}

Guidelines:
- Break down the goal into 3-{} concrete steps
- Each step should be actionable and specific
- Use depends_on to specify dependencies (array of step numbers)
- Consider what tools might be needed (web_search, file_read, calculator, etc.)
- Identify potential risks or challenges
- Steps should build on each other logically

Return ONLY the JSON, no additional text.
"#,
            goal, self.config.max_steps
        )
    }

    /// Parse plan from LLM response
    fn parse_plan(&self, goal: &str, response: &str) -> Result<Plan, String> {
        debug!("Parsing plan from LLM response");

        // Extract JSON from response (it might have markdown code blocks)
        let json_str = if response.trim().starts_with("```") {
            // Extract from code block
            let lines: Vec<&str> = response.lines().collect();
            let json_lines: Vec<&str> = lines
                .iter()
                .skip_while(|line| line.starts_with("```"))
                .take_while(|line| !line.starts_with("```"))
                .copied()
                .collect();
            json_lines.join("\n")
        } else {
            response.to_string()
        };

        // Parse JSON
        let plan_json: serde_json::Value = serde_json::from_str(&json_str)
            .map_err(|e| format!("Failed to parse plan JSON: {}", e))?;

        // Extract steps
        let steps_array = plan_json
            .get("steps")
            .and_then(|v| v.as_array())
            .ok_or_else(|| "Plan JSON missing 'steps' array".to_string())?;

        let mut steps = Vec::new();
        for step_json in steps_array {
            let step = PlanStep {
                step_number: step_json
                    .get("step_number")
                    .and_then(|v| v.as_u64())
                    .ok_or_else(|| "Step missing 'step_number'".to_string())?
                    as usize,
                description: step_json
                    .get("description")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| "Step missing 'description'".to_string())?
                    .to_string(),
                action: step_json
                    .get("action")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| "Step missing 'action'".to_string())?
                    .to_string(),
                expected_output: step_json
                    .get("expected_output")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| "Step missing 'expected_output'".to_string())?
                    .to_string(),
                depends_on: step_json
                    .get("depends_on")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_u64())
                            .map(|n| n as usize)
                            .collect()
                    })
                    .unwrap_or_default(),
                status: StepStatus::Pending,
                result: None,
                error: None,
            };
            steps.push(step);
        }

        // Extract other fields
        let estimated_time = plan_json
            .get("estimated_time")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown")
            .to_string();

        let required_tools = plan_json
            .get("required_tools")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect()
            })
            .unwrap_or_default();

        let risks = plan_json
            .get("risks")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect()
            })
            .unwrap_or_default();

        // Generate plan ID
        let plan_id = format!("plan_{}", chrono::Utc::now().timestamp());

        let plan = Plan {
            id: plan_id,
            goal: goal.to_string(),
            steps,
            estimated_time,
            required_tools,
            risks,
            created_at: chrono::Utc::now().timestamp() as u64,
            user_approved: false,
            execution_started: false,
            completed: false,
        };

        info!("Generated plan with {} steps", plan.steps.len());
        Ok(plan)
    }

    /// Execute plan (requires user approval first)
    pub async fn execute_plan(&self, plan: &mut Plan) -> Result<PlanExecution, String> {
        if !plan.user_approved {
            return Err("Plan must be approved by user before execution".to_string());
        }

        info!("Starting plan execution: {}", plan.id);
        plan.execution_started = true;

        let mut execution_log = Vec::new();
        let mut completed_steps = 0;
        let mut failed_steps = 0;

        // Execute steps sequentially based on dependencies
        while let Some(next_step_ref) = plan.next_step() {
            let step_number = next_step_ref.step_number;
            let step_action = next_step_ref.action.clone();
            let step_description = next_step_ref.description.clone();

            // Update step status to InProgress
            if let Some(step) = plan.steps.iter_mut().find(|s| s.step_number == step_number) {
                step.status = StepStatus::InProgress;
                execution_log.push(format!(
                    "Step {}: {} - IN PROGRESS",
                    step.step_number, step.description
                ));
            }

            // Create a temporary step for execution
            let temp_step = PlanStep {
                step_number,
                description: step_description.clone(),
                action: step_action,
                expected_output: String::new(),
                depends_on: vec![],
                status: StepStatus::InProgress,
                result: None,
                error: None,
            };

            // Execute step using ReAct agent
            match self.execute_step(&temp_step).await {
                Ok(result) => {
                    // Update step with result
                    if let Some(step) = plan.steps.iter_mut().find(|s| s.step_number == step_number) {
                        step.status = StepStatus::Completed;
                        step.result = Some(result.clone());
                    }
                    completed_steps += 1;
                    execution_log.push(format!(
                        "Step {}: {} - COMPLETED",
                        step_number, step_description
                    ));
                }
                Err(e) => {
                    warn!("Step {} failed: {}", step_number, e);

                    // Update step with error
                    if let Some(step) = plan.steps.iter_mut().find(|s| s.step_number == step_number) {
                        step.status = StepStatus::Failed;
                        step.error = Some(e.clone());
                    }

                    failed_steps += 1;
                    execution_log.push(format!(
                        "Step {}: {} - FAILED: {}",
                        step_number, step_description, e
                    ));

                    // Handle failure
                    if self.config.enable_auto_recovery {
                        match self.handle_step_failure(plan, step_number).await {
                            Ok(_) => {
                                execution_log.push(format!(
                                    "Step {}: Recovery attempt initiated",
                                    step_number
                                ));
                            }
                            Err(recovery_err) => {
                                execution_log.push(format!(
                                    "Step {}: Recovery failed: {}",
                                    step_number, recovery_err
                                ));
                                // Continue to next step or abort based on dependencies
                            }
                        }
                    }
                }
            }
        }

        // Mark plan as completed
        plan.completed = plan.is_complete();

        let total_steps = plan.steps.len();
        let success = failed_steps == 0;
        let skipped_steps = plan.steps.iter().filter(|s| s.status == StepStatus::Skipped).count();

        info!(
            "Plan execution finished: {}/{} steps completed",
            completed_steps, total_steps
        );

        Ok(PlanExecution {
            plan_id: plan.id.clone(),
            success,
            completed_steps,
            failed_steps,
            skipped_steps,
            total_steps,
            execution_log,
            final_result: if success {
                Some("Plan executed successfully".to_string())
            } else {
                None
            },
            error: if !success {
                Some(format!("{} steps failed", failed_steps))
            } else {
                None
            },
        })
    }

    /// Execute individual step using ReAct agent
    async fn execute_step(&self, step: &PlanStep) -> Result<String, String> {
        debug!("Executing step {}: {}", step.step_number, step.action);

        // Use ReAct agent to execute the action
        let execution = self.react_agent.execute(&step.action).await?;

        if execution.success {
            execution
                .final_answer
                .ok_or_else(|| "No answer from ReAct agent".to_string())
        } else {
            Err(execution
                .error
                .unwrap_or_else(|| "Unknown error".to_string()))
        }
    }

    /// Handle step failure with recovery or re-planning
    async fn handle_step_failure(&self, plan: &mut Plan, failed_step: usize) -> Result<(), String> {
        warn!("Handling failure for step {}", failed_step);

        // Find the failed step
        let step = plan
            .steps
            .iter()
            .find(|s| s.step_number == failed_step)
            .ok_or_else(|| format!("Step {} not found", failed_step))?;

        let error_msg = step.error.clone().unwrap_or_default();

        // Generate recovery plan
        let recovery_prompt = format!(
            "The following step failed:\n\
             Step {}: {}\n\
             Action: {}\n\
             Error: {}\n\n\
             Suggest an alternative approach or recovery strategy.",
            step.step_number, step.description, step.action, error_msg
        );

        // Call LLM for recovery suggestion
        let client = reqwest::Client::new();
        let response = client
            .post(format!("{}/api/generate", self.ollama_endpoint))
            .json(&serde_json::json!({
                "model": self.config.model,
                "prompt": recovery_prompt,
                "stream": false,
                "options": {
                    "temperature": self.config.temperature
                }
            }))
            .send()
            .await
            .map_err(|e| format!("Recovery LLM call failed: {}", e))?;

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse recovery response: {}", e))?;

        let recovery_suggestion = json
            .get("response")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Missing recovery suggestion".to_string())?;

        debug!("Recovery suggestion: {}", recovery_suggestion);

        // For now, just log the suggestion
        // In a full implementation, we would modify the plan or retry with different approach
        Ok(())
    }

    /// Get configuration
    pub fn config(&self) -> &PlannerConfig {
        &self.config
    }

    /// Update configuration
    pub fn set_config(&mut self, config: PlannerConfig) {
        info!("Updating Planner config: max_steps={}", config.max_steps);
        self.config = config;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plan_progress() {
        let plan = Plan {
            id: "test".to_string(),
            goal: "Test goal".to_string(),
            steps: vec![
                PlanStep {
                    step_number: 1,
                    description: "Step 1".to_string(),
                    action: "Do something".to_string(),
                    expected_output: "Output".to_string(),
                    depends_on: vec![],
                    status: StepStatus::Completed,
                    result: None,
                    error: None,
                },
                PlanStep {
                    step_number: 2,
                    description: "Step 2".to_string(),
                    action: "Do more".to_string(),
                    expected_output: "More output".to_string(),
                    depends_on: vec![1],
                    status: StepStatus::Pending,
                    result: None,
                    error: None,
                },
            ],
            estimated_time: "5 minutes".to_string(),
            required_tools: vec![],
            risks: vec![],
            created_at: 0,
            user_approved: false,
            execution_started: false,
            completed: false,
        };

        assert_eq!(plan.progress(), 50.0);
    }

    #[test]
    fn test_next_step_dependencies() {
        let plan = Plan {
            id: "test".to_string(),
            goal: "Test goal".to_string(),
            steps: vec![
                PlanStep {
                    step_number: 1,
                    description: "Step 1".to_string(),
                    action: "First".to_string(),
                    expected_output: "Output 1".to_string(),
                    depends_on: vec![],
                    status: StepStatus::Completed,
                    result: None,
                    error: None,
                },
                PlanStep {
                    step_number: 2,
                    description: "Step 2".to_string(),
                    action: "Second".to_string(),
                    expected_output: "Output 2".to_string(),
                    depends_on: vec![1],
                    status: StepStatus::Pending,
                    result: None,
                    error: None,
                },
                PlanStep {
                    step_number: 3,
                    description: "Step 3".to_string(),
                    action: "Third".to_string(),
                    expected_output: "Output 3".to_string(),
                    depends_on: vec![2],
                    status: StepStatus::Pending,
                    result: None,
                    error: None,
                },
            ],
            estimated_time: "10 minutes".to_string(),
            required_tools: vec![],
            risks: vec![],
            created_at: 0,
            user_approved: true,
            execution_started: false,
            completed: false,
        };

        let next = plan.next_step();
        assert!(next.is_some());
        assert_eq!(next.unwrap().step_number, 2);
    }

    #[test]
    fn test_is_complete() {
        let mut plan = Plan {
            id: "test".to_string(),
            goal: "Test goal".to_string(),
            steps: vec![
                PlanStep {
                    step_number: 1,
                    description: "Step 1".to_string(),
                    action: "Action".to_string(),
                    expected_output: "Output".to_string(),
                    depends_on: vec![],
                    status: StepStatus::Completed,
                    result: None,
                    error: None,
                },
            ],
            estimated_time: "1 minute".to_string(),
            required_tools: vec![],
            risks: vec![],
            created_at: 0,
            user_approved: true,
            execution_started: false,
            completed: false,
        };

        assert!(plan.is_complete());

        plan.steps[0].status = StepStatus::Pending;
        assert!(!plan.is_complete());
    }
}

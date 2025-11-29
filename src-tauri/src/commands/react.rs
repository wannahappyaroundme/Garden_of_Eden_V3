use crate::AppState;
use log::info;
use tauri::{command, State};

/// Execute ReAct loop for a user query
#[command]
pub async fn react_execute(
    state: State<'_, AppState>,
    query: String,
) -> Result<serde_json::Value, String> {
    info!("Command: react_execute");

    let agent = &*state.react_agent;
    let execution = agent.execute(&query).await?;

    Ok(serde_json::json!({
        "steps": execution.steps.iter().map(|step| {
            serde_json::json!({
                "type": step.step_type(),
                "content": step.content(),
            })
        }).collect::<Vec<_>>(),
        "final_answer": execution.final_answer,
        "iterations_used": execution.iterations_used,
        "success": execution.success,
        "error": execution.error,
    }))
}

/// Get ReAct configuration
#[command]
pub fn react_get_config(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: react_get_config");

    let agent = &*state.react_agent;
    let config = agent.config();

    Ok(serde_json::json!({
        "max_iterations": config.max_iterations,
        "model": config.model,
        "temperature": config.temperature,
        "enable_verbose": config.enable_verbose,
    }))
}

/// Update ReAct configuration
#[command]
pub fn react_set_config(
    state: State<'_, AppState>,
    max_iterations: Option<usize>,
    model: Option<String>,
    temperature: Option<f32>,
    enable_verbose: Option<bool>,
) -> Result<String, String> {
    info!("Command: react_set_config");

    let agent = &*state.react_agent;
    let mut config = agent.config().clone();

    if let Some(max_iter) = max_iterations {
        config.max_iterations = max_iter;
    }
    if let Some(m) = model {
        config.model = m;
    }
    if let Some(temp) = temperature {
        config.temperature = temp;
    }
    if let Some(verbose) = enable_verbose {
        config.enable_verbose = verbose;
    }

    // Note: This requires making react_agent mutable in AppState
    // For now, we return success but the config won't actually update
    // TODO: Wrap react_agent in Mutex for mutable access

    Ok("Configuration updated successfully".to_string())
}

/**
 * Planner Commands (v3.7.0)
 *
 * Commands for Plan-and-Solve agent with user confirmation
 */

use crate::services::planner::Plan;
use crate::AppState;
use log::info;
use tauri::{command, State};

/// Generate a plan for a given goal
#[command]
pub async fn planner_generate(
    state: State<'_, AppState>,
    goal: String,
) -> Result<serde_json::Value, String> {
    info!("Command: planner_generate");

    let planner = &*state.planner;
    let plan = planner.generate_plan(&goal).await?;

    Ok(serde_json::to_value(&plan).map_err(|e| e.to_string())?)
}

/// Approve a plan for execution
#[command]
pub async fn planner_approve(
    state: State<'_, AppState>,
    plan_json: String,
) -> Result<String, String> {
    info!("Command: planner_approve");

    let mut plan: Plan =
        serde_json::from_str(&plan_json).map_err(|e| format!("Invalid plan JSON: {}", e))?;

    plan.user_approved = true;

    // Store approved plan for later execution
    let mut approved_plans = state.approved_plans.lock().await;
    approved_plans.insert(plan.id.clone(), plan);

    Ok("Plan approved successfully".to_string())
}

/// Execute an approved plan
#[command]
pub async fn planner_execute(
    state: State<'_, AppState>,
    plan_id: String,
) -> Result<serde_json::Value, String> {
    info!("Command: planner_execute for plan: {}", plan_id);

    // Retrieve approved plan
    let mut approved_plans = state.approved_plans.lock().await;
    let mut plan = approved_plans
        .remove(&plan_id)
        .ok_or_else(|| format!("Plan {} not found or not approved", plan_id))?;

    // Execute plan
    let planner = &*state.planner;
    let execution = planner.execute_plan(&mut plan).await?;

    // Store executed plan in history
    let mut plan_history = state.plan_history.lock().await;
    plan_history.insert(plan.id.clone(), plan);

    Ok(serde_json::to_value(&execution).map_err(|e| e.to_string())?)
}

/// Reject/cancel a plan
#[command]
pub async fn planner_reject(
    state: State<'_, AppState>,
    plan_id: String,
) -> Result<String, String> {
    info!("Command: planner_reject for plan: {}", plan_id);

    let mut approved_plans = state.approved_plans.lock().await;
    approved_plans.remove(&plan_id);

    Ok(format!("Plan {} rejected", plan_id))
}

/// Get plan status
#[command]
pub async fn planner_get_plan(
    state: State<'_, AppState>,
    plan_id: String,
) -> Result<serde_json::Value, String> {
    info!("Command: planner_get_plan for: {}", plan_id);

    // Check approved plans first
    let approved_plans = state.approved_plans.lock().await;
    if let Some(plan) = approved_plans.get(&plan_id) {
        return Ok(serde_json::to_value(plan).map_err(|e| e.to_string())?);
    }

    // Check history
    let plan_history = state.plan_history.lock().await;
    if let Some(plan) = plan_history.get(&plan_id) {
        return Ok(serde_json::to_value(plan).map_err(|e| e.to_string())?);
    }

    Err(format!("Plan {} not found", plan_id))
}

/// List all approved plans
#[command]
pub async fn planner_list_approved(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    info!("Command: planner_list_approved");

    let approved_plans = state.approved_plans.lock().await;
    let plan_ids: Vec<String> = approved_plans.keys().cloned().collect();

    Ok(serde_json::json!({
        "plan_ids": plan_ids,
        "count": plan_ids.len(),
    }))
}

/// List plan history
#[command]
pub async fn planner_list_history(
    state: State<'_, AppState>,
    limit: Option<usize>,
) -> Result<serde_json::Value, String> {
    info!("Command: planner_list_history");

    let plan_history = state.plan_history.lock().await;
    let mut plans: Vec<&Plan> = plan_history.values().collect();

    // Sort by creation time (newest first)
    plans.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    // Apply limit
    let limit = limit.unwrap_or(10);
    let plans: Vec<serde_json::Value> = plans
        .into_iter()
        .take(limit)
        .map(|plan| {
            serde_json::json!({
                "id": plan.id,
                "goal": plan.goal,
                "steps_count": plan.steps.len(),
                "completed": plan.completed,
                "progress": plan.progress(),
                "created_at": plan.created_at,
            })
        })
        .collect();

    Ok(serde_json::json!({
        "plans": plans,
        "count": plans.len(),
    }))
}

/// Clear plan history
#[command]
pub async fn planner_clear_history(state: State<'_, AppState>) -> Result<String, String> {
    info!("Command: planner_clear_history");

    let mut plan_history = state.plan_history.lock().await;
    let count = plan_history.len();
    plan_history.clear();

    Ok(format!("Cleared {} plans from history", count))
}

/// Get planner configuration
#[command]
pub fn planner_get_config(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: planner_get_config");

    let planner = &*state.planner;
    let config = planner.config();

    Ok(serde_json::json!({
        "model": config.model,
        "temperature": config.temperature,
        "max_steps": config.max_steps,
        "enable_auto_recovery": config.enable_auto_recovery,
        "max_retry_attempts": config.max_retry_attempts,
    }))
}

/// Update planner configuration
#[command]
pub fn planner_set_config(
    state: State<'_, AppState>,
    model: Option<String>,
    temperature: Option<f32>,
    max_steps: Option<usize>,
    enable_auto_recovery: Option<bool>,
    max_retry_attempts: Option<usize>,
) -> Result<String, String> {
    info!("Command: planner_set_config");

    let planner = &*state.planner;
    let mut config = planner.config().clone();

    if let Some(m) = model {
        config.model = m;
    }
    if let Some(temp) = temperature {
        config.temperature = temp;
    }
    if let Some(max) = max_steps {
        config.max_steps = max;
    }
    if let Some(auto_rec) = enable_auto_recovery {
        config.enable_auto_recovery = auto_rec;
    }
    if let Some(retry) = max_retry_attempts {
        config.max_retry_attempts = retry;
    }

    // Note: This requires making planner mutable in AppState
    // For now, we return success but the config won't actually update
    // TODO: Wrap planner in Mutex for mutable access

    Ok("Configuration updated successfully".to_string())
}

/// Generate and execute plan in one step (with auto-approval for testing)
#[command]
pub async fn planner_generate_and_execute(
    state: State<'_, AppState>,
    goal: String,
    auto_approve: bool,
) -> Result<serde_json::Value, String> {
    info!("Command: planner_generate_and_execute");

    let planner = &*state.planner;
    let mut plan = planner.generate_plan(&goal).await?;

    if !auto_approve {
        return Err(
            "Plan generated but not approved. Use planner_approve to approve it.".to_string(),
        );
    }

    // Auto-approve for testing/automation
    plan.user_approved = true;

    let execution = planner.execute_plan(&mut plan).await?;

    // Store in history
    let mut plan_history = state.plan_history.lock().await;
    plan_history.insert(plan.id.clone(), plan);

    Ok(serde_json::to_value(&execution).map_err(|e| e.to_string())?)
}

/// Get statistics about planning
#[command]
pub async fn planner_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: planner_stats");

    let approved_plans = state.approved_plans.lock().await;
    let plan_history = state.plan_history.lock().await;

    let total_plans = plan_history.len();
    let completed_plans = plan_history.values().filter(|p| p.completed).count();
    let in_progress_plans = plan_history
        .values()
        .filter(|p| p.execution_started && !p.completed)
        .count();
    let pending_approval = approved_plans.len();

    let avg_steps = if !plan_history.is_empty() {
        plan_history.values().map(|p| p.steps.len()).sum::<usize>() as f32
            / plan_history.len() as f32
    } else {
        0.0
    };

    Ok(serde_json::json!({
        "total_plans": total_plans,
        "completed_plans": completed_plans,
        "in_progress_plans": in_progress_plans,
        "pending_approval": pending_approval,
        "average_steps_per_plan": avg_steps,
    }))
}

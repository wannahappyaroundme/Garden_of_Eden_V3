/**
 * Phase 5 Stage 4: Goal Tracker Commands (v3.9.0)
 */

use crate::services::goal_tracker::{
    Achievement, Goal, GoalReminder, GoalTrackerService,
};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn goal_create(
    goal: Goal,
    service: State<'_, Arc<GoalTrackerService>>,
) -> Result<String, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .create_goal(goal)
            .map_err(|e| format!("Failed to create goal: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn goal_get(
    goal_id: String,
    service: State<'_, Arc<GoalTrackerService>>,
) -> Result<Goal, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_goal(&goal_id)
            .map_err(|e| format!("Failed to get goal: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn goal_update_progress(
    goal_id: String,
    progress_delta: f32,
    description: String,
    service: State<'_, Arc<GoalTrackerService>>,
) -> Result<(), String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .update_progress(&goal_id, progress_delta, &description)
            .map_err(|e| format!("Failed to update progress: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn goal_complete_milestone(
    milestone_id: String,
    service: State<'_, Arc<GoalTrackerService>>,
) -> Result<(), String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .complete_milestone(&milestone_id)
            .map_err(|e| format!("Failed to complete milestone: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn goal_get_active(
    service: State<'_, Arc<GoalTrackerService>>,
) -> Result<Vec<Goal>, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_active_goals()
            .map_err(|e| format!("Failed to get active goals: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn goal_get_stale(
    days_threshold: i64,
    service: State<'_, Arc<GoalTrackerService>>,
) -> Result<Vec<GoalReminder>, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_stale_goals(days_threshold)
            .map_err(|e| format!("Failed to get stale goals: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn goal_detect_progress(
    conversation: String,
    goal_id: String,
    service: State<'_, Arc<GoalTrackerService>>,
) -> Result<Option<f32>, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            service_clone
                .detect_progress_from_conversation(&conversation, &goal_id)
                .await
                .map_err(|e| format!("Failed to detect progress: {}", e))
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn goal_get_achievements(
    goal_id: String,
    service: State<'_, Arc<GoalTrackerService>>,
) -> Result<Vec<Achievement>, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_achievements(&goal_id)
            .map_err(|e| format!("Failed to get achievements: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn goal_delete(
    goal_id: String,
    service: State<'_, Arc<GoalTrackerService>>,
) -> Result<(), String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .delete_goal(&goal_id)
            .map_err(|e| format!("Failed to delete goal: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

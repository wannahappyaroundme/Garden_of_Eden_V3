/**
 * Phase 5 Stage 4: Task Planner Commands (v3.9.0)
 */

use crate::services::task_planner::{
    ExecutionPlan, Task, TaskBreakdown, TaskPlannerService, TaskStatus,
};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn task_decompose(
    description: String,
    context: Option<String>,
    service: State<'_, Arc<TaskPlannerService>>,
) -> Result<TaskBreakdown, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            service_clone
                .decompose_task(&description, context.as_deref())
                .await
                .map_err(|e| format!("Failed to decompose task: {}", e))
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn task_create(
    task: Task,
    service: State<'_, Arc<TaskPlannerService>>,
) -> Result<String, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .create_task(task)
            .map_err(|e| format!("Failed to create task: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn task_get(
    task_id: String,
    service: State<'_, Arc<TaskPlannerService>>,
) -> Result<Task, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_task(&task_id)
            .map_err(|e| format!("Failed to get task: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn task_update_status(
    task_id: String,
    status: TaskStatus,
    service: State<'_, Arc<TaskPlannerService>>,
) -> Result<(), String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .update_task_status(&task_id, status)
            .map_err(|e| format!("Failed to update task status: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn task_update_progress(
    task_id: String,
    progress: f32,
    service: State<'_, Arc<TaskPlannerService>>,
) -> Result<(), String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .update_task_progress(&task_id, progress)
            .map_err(|e| format!("Failed to update task progress: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn task_generate_execution_plan(
    root_task_id: String,
    service: State<'_, Arc<TaskPlannerService>>,
) -> Result<ExecutionPlan, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .generate_execution_plan(&root_task_id)
            .map_err(|e| format!("Failed to generate execution plan: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn task_get_subtasks(
    parent_id: String,
    service: State<'_, Arc<TaskPlannerService>>,
) -> Result<Vec<Task>, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_subtasks(&parent_id)
            .map_err(|e| format!("Failed to get subtasks: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn task_get_all(
    status_filter: Option<TaskStatus>,
    service: State<'_, Arc<TaskPlannerService>>,
) -> Result<Vec<Task>, String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .get_all_tasks(status_filter)
            .map_err(|e| format!("Failed to get tasks: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn task_delete(
    task_id: String,
    service: State<'_, Arc<TaskPlannerService>>,
) -> Result<(), String> {
    let service_clone = Arc::clone(&service.inner());
    tokio::task::spawn_blocking(move || {
        service_clone
            .delete_task(&task_id)
            .map_err(|e| format!("Failed to delete task: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

/// Tool History IPC Commands (v3.3.0)
///
/// Provides Tauri commands for frontend to interact with the ToolHistoryService.
/// Enables the Tool History UI panel to fetch, filter, export, and manage tool execution history.

use tauri::State;
use crate::services::tool_history::{
    ToolCallRecord, ToolHistoryFilters, ToolUsageStats,
};
use crate::AppState;

/// Get tool call history with optional filters
///
/// # Arguments
/// * `filters` - Optional filters for conversation, tool name, status, time range, pagination
///
/// # Returns
/// * `Vec<ToolCallRecord>` - List of tool execution records matching the filters
#[tauri::command]
pub async fn get_tool_history(
    state: State<'_, AppState>,
    filters: Option<ToolHistoryFilters>,
) -> Result<Vec<ToolCallRecord>, String> {
    let service = state.tool_history_service.lock().await;
    service.get_history(filters.unwrap_or_default())
        .map_err(|e| format!("Failed to get tool history: {}", e))
}

/// Get tool usage statistics
///
/// # Returns
/// * `ToolUsageStats` - Aggregated statistics including total calls, success rate, per-tool breakdown
#[tauri::command]
pub async fn get_tool_statistics(
    state: State<'_, AppState>,
) -> Result<ToolUsageStats, String> {
    let service = state.tool_history_service.lock().await;
    service.get_statistics()
        .map_err(|e| format!("Failed to get tool statistics: {}", e))
}

/// Export tool history to JSON or CSV string
///
/// # Arguments
/// * `format` - Export format: "json" or "csv"
/// * `filters` - Optional filters to apply before export
///
/// # Returns
/// * `String` - Formatted export data (JSON string or CSV text)
#[tauri::command]
pub async fn export_tool_history(
    state: State<'_, AppState>,
    format: String,
    filters: Option<ToolHistoryFilters>,
) -> Result<String, String> {
    let service = state.tool_history_service.lock().await;

    // Get records with filters
    let records = service.get_history(filters.unwrap_or_default())
        .map_err(|e| format!("Failed to get tool history for export: {}", e))?;

    // Convert to string based on format
    match format.to_lowercase().as_str() {
        "json" => {
            serde_json::to_string_pretty(&records)
                .map_err(|e| format!("Failed to serialize to JSON: {}", e))
        }
        "csv" => {
            let mut csv_content = String::from("id,conversation_id,message_id,tool_name,execution_time_ms,status,created_at,error_message\n");

            for record in &records {
                csv_content.push_str(&format!(
                    "{},{},{},{},{},{},{},{}\n",
                    record.id,
                    record.conversation_id,
                    record.message_id,
                    record.tool_name,
                    record.execution_time_ms,
                    record.status.to_string(),
                    record.created_at,
                    record.error_message.as_deref().unwrap_or(""),
                ));
            }

            Ok(csv_content)
        }
        _ => Err(format!("Unsupported export format: {}. Use 'json' or 'csv'", format))
    }
}

/// Delete old tool history records
///
/// # Arguments
/// * `before_timestamp` - Delete records older than this timestamp (milliseconds since epoch)
///
/// # Returns
/// * `usize` - Number of records deleted
#[tauri::command]
pub async fn delete_tool_history(
    state: State<'_, AppState>,
    before_timestamp: i64,
) -> Result<usize, String> {
    let service = state.tool_history_service.lock().await;
    service.delete_history_before(before_timestamp)
        .map_err(|e| format!("Failed to delete tool history: {}", e))
}

/// Get the most recently used tools
///
/// # Arguments
/// * `limit` - Maximum number of tools to return
///
/// # Returns
/// * `Vec<String>` - List of recently used tool names
#[tauri::command]
pub async fn get_recent_tools(
    state: State<'_, AppState>,
    limit: usize,
) -> Result<Vec<String>, String> {
    let service = state.tool_history_service.lock().await;
    service.get_recent_tools(limit)
        .map_err(|e| format!("Failed to get recent tools: {}", e))
}

/// Get error rate for a specific tool
///
/// # Arguments
/// * `tool_name` - Name of the tool
///
/// # Returns
/// * `f32` - Error rate (0.0 to 1.0)
#[tauri::command]
pub async fn get_tool_error_rate(
    state: State<'_, AppState>,
    tool_name: String,
) -> Result<f32, String> {
    let service = state.tool_history_service.lock().await;
    service.get_tool_error_rate(&tool_name)
        .map_err(|e| format!("Failed to get error rate for '{}': {}", tool_name, e))
}

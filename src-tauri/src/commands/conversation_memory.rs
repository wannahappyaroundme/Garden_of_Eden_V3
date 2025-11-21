/**
 * Conversation Memory Commands (v3.5.0)
 *
 * Commands for managing conversation summaries and context
 */

use crate::AppState;
use log::{error, info};
use tauri::State;

/// Get conversation context (summary + recent messages)
#[tauri::command]
pub async fn memory_get_context(
    state: State<'_, AppState>,
    conversation_id: String,
) -> Result<serde_json::Value, String> {
    info!("Command: memory_get_context - {}", conversation_id);

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Get total message count
    let total_messages: usize = conn
        .query_row(
            "SELECT COUNT(*) FROM messages WHERE conversation_id = ?1",
            [&conversation_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get recent messages (last 10)
    let mut stmt = conn.prepare(
        "SELECT id, role, content, created_at
         FROM messages
         WHERE conversation_id = ?1
         ORDER BY created_at DESC
         LIMIT 10"
    ).map_err(|e| format!("Database error: {}", e))?;

    let recent_messages: Vec<serde_json::Value> = stmt
        .query_map([&conversation_id], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i64>(0)?,
                "role": row.get::<_, String>(1)?,
                "content": row.get::<_, String>(2)?,
                "created_at": row.get::<_, i64>(3)?,
            }))
        })
        .map_err(|e| format!("Database error: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Database error: {}", e))?
        .into_iter()
        .rev()
        .collect();

    // Get summary if exists
    let summary: Option<String> = conn
        .query_row(
            "SELECT summary_text FROM conversation_summaries
             WHERE conversation_id = ?1
             ORDER BY last_updated DESC
             LIMIT 1",
            [&conversation_id],
            |row| row.get(0),
        )
        .ok();

    Ok(serde_json::json!({
        "summary": summary,
        "recent_messages": recent_messages,
        "total_messages": total_messages,
    }))
}

/// Check if conversation needs summarization
#[tauri::command]
pub async fn memory_needs_summarization(
    state: State<'_, AppState>,
    conversation_id: String,
) -> Result<bool, String> {
    info!("Command: memory_needs_summarization - {}", conversation_id);

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let conn = db.conn();

    let message_count: usize = conn
        .query_row(
            "SELECT COUNT(*) FROM messages WHERE conversation_id = ?1",
            [&conversation_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Needs summarization if more than 20 messages
    Ok(message_count >= 20)
}

/// Create or update conversation summary
#[tauri::command]
pub async fn memory_create_summary(
    state: State<'_, AppState>,
    conversation_id: String,
    summary_text: String,
    messages_summarized: i64,
) -> Result<(), String> {
    info!(
        "Command: memory_create_summary - {} ({} messages)",
        conversation_id, messages_summarized
    );

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let conn = db.conn();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // Check if summary exists
    let existing_summary: Option<i64> = conn
        .query_row(
            "SELECT id FROM conversation_summaries
             WHERE conversation_id = ?1
             ORDER BY last_updated DESC
             LIMIT 1",
            [&conversation_id],
            |row| row.get(0),
        )
        .ok();

    match existing_summary {
        Some(summary_id) => {
            // Update existing summary
            conn.execute(
                "UPDATE conversation_summaries
                 SET summary_text = ?1, messages_summarized = ?2, last_updated = ?3
                 WHERE id = ?4",
                (&summary_text, messages_summarized, now, summary_id),
            )
            .map_err(|e| format!("Failed to update summary: {}", e))?;
            info!("Updated existing summary {}", summary_id);
        }
        None => {
            // Create new summary
            conn.execute(
                "INSERT INTO conversation_summaries
                 (conversation_id, summary_text, messages_summarized, last_updated)
                 VALUES (?1, ?2, ?3, ?4)",
                (&conversation_id, &summary_text, messages_summarized, now),
            )
            .map_err(|e| format!("Failed to create summary: {}", e))?;
            info!("Created new summary for conversation {}", conversation_id);
        }
    }

    Ok(())
}

/// Get messages that need to be summarized (all except recent 10)
#[tauri::command]
pub async fn memory_get_messages_for_summary(
    state: State<'_, AppState>,
    conversation_id: String,
) -> Result<serde_json::Value, String> {
    info!("Command: memory_get_messages_for_summary - {}", conversation_id);

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let conn = db.conn();

    // Get all messages ordered by time
    let mut stmt = conn.prepare(
        "SELECT id, role, content, created_at
         FROM messages
         WHERE conversation_id = ?1
         ORDER BY created_at ASC"
    ).map_err(|e| format!("Database error: {}", e))?;

    let all_messages: Vec<serde_json::Value> = stmt
        .query_map([&conversation_id], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i64>(0)?,
                "role": row.get::<_, String>(1)?,
                "content": row.get::<_, String>(2)?,
                "created_at": row.get::<_, i64>(3)?,
            }))
        })
        .map_err(|e| format!("Database error: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Database error: {}", e))?;

    // Return all except recent 10 messages
    let messages_to_summarize = if all_messages.len() > 10 {
        &all_messages[..all_messages.len() - 10]
    } else {
        &[]
    };

    Ok(serde_json::json!(messages_to_summarize))
}

/// Get summary for a conversation
#[tauri::command]
pub async fn memory_get_summary(
    state: State<'_, AppState>,
    conversation_id: String,
) -> Result<serde_json::Value, String> {
    info!("Command: memory_get_summary - {}", conversation_id);

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let conn = db.conn();

    let summary = conn
        .query_row(
            "SELECT id, conversation_id, summary_text, messages_summarized, last_updated
             FROM conversation_summaries
             WHERE conversation_id = ?1
             ORDER BY last_updated DESC
             LIMIT 1",
            [&conversation_id],
            |row| {
                Ok(serde_json::json!({
                    "id": row.get::<_, i64>(0)?,
                    "conversation_id": row.get::<_, String>(1)?,
                    "summary_text": row.get::<_, String>(2)?,
                    "messages_summarized": row.get::<_, i64>(3)?,
                    "last_updated": row.get::<_, i64>(4)?,
                }))
            },
        )
        .ok();

    Ok(serde_json::json!(summary))
}

/// Delete summary for a conversation
#[tauri::command]
pub async fn memory_delete_summary(
    state: State<'_, AppState>,
    conversation_id: String,
) -> Result<(), String> {
    info!("Command: memory_delete_summary - {}", conversation_id);

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let conn = db.conn();

    conn.execute(
        "DELETE FROM conversation_summaries WHERE conversation_id = ?1",
        [&conversation_id],
    )
    .map_err(|e| format!("Failed to delete summary: {}", e))?;

    info!("Deleted summary for conversation {}", conversation_id);
    Ok(())
}

/// Format context for LLM prompt
#[tauri::command]
pub async fn memory_format_context(
    state: State<'_, AppState>,
    conversation_id: String,
) -> Result<String, String> {
    info!("Command: memory_format_context - {}", conversation_id);

    let db = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let conn = db.conn();

    let mut formatted = String::new();

    // Get summary if exists
    let summary: Option<String> = conn
        .query_row(
            "SELECT summary_text FROM conversation_summaries
             WHERE conversation_id = ?1
             ORDER BY last_updated DESC
             LIMIT 1",
            [&conversation_id],
            |row| row.get(0),
        )
        .ok();

    // Add summary
    if let Some(summary_text) = summary {
        formatted.push_str("**Previous conversation summary:**\n");
        formatted.push_str(&summary_text);
        formatted.push_str("\n\n");
    }

    // Get recent messages
    let mut stmt = conn.prepare(
        "SELECT role, content
         FROM messages
         WHERE conversation_id = ?1
         ORDER BY created_at DESC
         LIMIT 10"
    ).map_err(|e| format!("Database error: {}", e))?;

    let recent_messages: Vec<(String, String)> = stmt
        .query_map([&conversation_id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })
        .map_err(|e| format!("Database error: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Database error: {}", e))?;

    // Add recent messages (reverse to chronological order)
    if !recent_messages.is_empty() {
        formatted.push_str("**Recent messages:**\n");
        for (role, content) in recent_messages.into_iter().rev() {
            formatted.push_str(&format!("{}: {}\n", role, content));
        }
    }

    Ok(formatted)
}

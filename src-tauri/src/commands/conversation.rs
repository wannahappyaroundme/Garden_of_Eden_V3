use crate::AppState;
use crate::database::models::Message;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct ConversationSummary {
    pub id: String,
    pub title: String,
    pub mode: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub message_count: i32,
    pub last_message_preview: Option<String>,
}

/// Get all conversations ordered by most recent
///
/// Performance optimized: Uses a single query with LEFT JOIN instead of N+1 subqueries.
/// The ROW_NUMBER() window function finds the most recent message per conversation efficiently.
#[tauri::command]
pub async fn get_conversations(state: State<'_, AppState>) -> Result<Vec<ConversationSummary>, String> {
    log::info!("Getting all conversations");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // Optimized query: Single pass using window function instead of N+1 subqueries
    // ROW_NUMBER() ranks messages per conversation by timestamp DESC
    // We then filter to get only the most recent message (rn = 1)
    let mut stmt = conn
        .prepare(
            "WITH ranked_messages AS (
                SELECT
                    conversation_id,
                    content,
                    ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY timestamp DESC) as rn
                FROM messages
            )
            SELECT
                c.id,
                c.title,
                c.mode,
                c.created_at,
                c.updated_at,
                c.message_count,
                rm.content as last_message
            FROM conversations c
            LEFT JOIN ranked_messages rm ON c.id = rm.conversation_id AND rm.rn = 1
            ORDER BY c.updated_at DESC
            LIMIT 100",
        )
        .map_err(|e| e.to_string())?;

    let conversations: Vec<ConversationSummary> = stmt
        .query_map([], |row| {
            Ok(ConversationSummary {
                id: row.get(0)?,
                title: row.get(1)?,
                mode: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                message_count: row.get(5)?,
                last_message_preview: row.get(6).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    log::info!("Found {} conversations", conversations.len());
    Ok(conversations)
}

/// Get messages for a specific conversation
#[tauri::command]
pub async fn get_conversation_messages(
    state: State<'_, AppState>,
    conversation_id: String,
) -> Result<Vec<Message>, String> {
    log::info!("Getting messages for conversation: {}", conversation_id);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut stmt = conn
        .prepare(
            "SELECT id, conversation_id, role, content, timestamp, tokens, response_time, context_level, satisfaction
             FROM messages
             WHERE conversation_id = ?1
             ORDER BY timestamp ASC",
        )
        .map_err(|e| e.to_string())?;

    let messages: Vec<Message> = stmt
        .query_map([&conversation_id], |row| {
            Ok(Message {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                timestamp: row.get(4)?,
                tokens: row.get(5).ok(),
                response_time: row.get(6).ok(),
                context_level: row.get(7).ok(),
                satisfaction: row.get(8).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    log::info!("Found {} messages for conversation {}", messages.len(), conversation_id);
    Ok(messages)
}

/// Delete a conversation and all its messages
#[tauri::command]
pub async fn delete_conversation(
    state: State<'_, AppState>,
    conversation_id: String,
) -> Result<(), String> {
    log::info!("Deleting conversation: {}", conversation_id);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // Delete conversation (CASCADE will delete messages)
    conn.execute("DELETE FROM conversations WHERE id = ?1", [&conversation_id])
        .map_err(|e| e.to_string())?;

    log::info!("Successfully deleted conversation: {}", conversation_id);
    Ok(())
}

/// Update conversation title
#[tauri::command]
pub async fn update_conversation_title(
    state: State<'_, AppState>,
    conversation_id: String,
    new_title: String,
) -> Result<(), String> {
    log::info!("Updating conversation {} title to: {}", conversation_id, new_title);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    conn.execute(
        "UPDATE conversations SET title = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![&new_title, chrono::Utc::now().timestamp_millis(), &conversation_id],
    )
    .map_err(|e| e.to_string())?;

    log::info!("Successfully updated conversation title");
    Ok(())
}

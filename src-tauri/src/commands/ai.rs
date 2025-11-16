use crate::AppState;
use crate::services::ollama;
use crate::services::webhook_triggers::WebhookTriggerEvent;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub conversation_id: Option<String>,
    pub context_level: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    pub conversation_id: String,
    pub message_id: String,
    pub response: String,
}

/// Chat command - main AI interaction
#[tauri::command]
pub async fn chat(
    state: State<'_, AppState>,
    request: ChatRequest,
) -> Result<ChatResponse, String> {
    log::info!("Chat command called with message: {}", request.message);

    // Generate IDs
    let conversation_id = request.conversation_id.unwrap_or_else(|| {
        format!("conv_{}", chrono::Utc::now().timestamp_millis())
    });
    let message_id = format!("msg_{}", chrono::Utc::now().timestamp_millis());

    // Block 1: Save user message to database (scoped to release lock)
    let is_new_conversation;
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.conn();

        // Create conversation if it doesn't exist
        let conv_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM conversations WHERE id = ?1)",
                [&conversation_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        is_new_conversation = !conv_exists;

        if !conv_exists {
            let now = chrono::Utc::now().timestamp_millis();
            conn.execute(
                "INSERT INTO conversations (id, title, mode, created_at, updated_at, message_count)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                rusqlite::params![
                    &conversation_id,
                    "New Chat",
                    "user-led",
                    now,
                    now,
                    0
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        // Save user message
        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, timestamp, context_level)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                &message_id,
                &conversation_id,
                "user",
                &request.message,
                now,
                request.context_level.unwrap_or(1)
            ],
        )
        .map_err(|e| e.to_string())?;
    } // db lock is released here

    // Trigger webhooks for conversation start (if new)
    if is_new_conversation {
        let trigger_manager = state.webhook_trigger_manager.clone();
        let conv_id = conversation_id.clone();
        tokio::spawn(async move {
            trigger_manager.trigger_event(WebhookTriggerEvent::ConversationStarted {
                conversation_id: conv_id,
                mode: "user-led".to_string(),
            }).await;
        });
    }

    // Trigger webhook for message sent
    {
        let trigger_manager = state.webhook_trigger_manager.clone();
        let conv_id = conversation_id.clone();
        let user_msg = request.message.clone();
        tokio::spawn(async move {
            trigger_manager.trigger_event(WebhookTriggerEvent::MessageSent {
                conversation_id: conv_id,
                user_message: user_msg,
            }).await;
        });
    }

    // Generate AI response using Ollama (no lock held during async operation)
    let ai_response = ollama::generate_response(&request.message).await?;
    let ai_message_id = format!("msg_{}", chrono::Utc::now().timestamp_millis());

    // Block 2: Save AI response to database
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.conn();

        // Save AI message
        conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                &ai_message_id,
                &conversation_id,
                "assistant",
                &ai_response,
                chrono::Utc::now().timestamp_millis()
            ],
        )
        .map_err(|e| e.to_string())?;

        // Update conversation
        conn.execute(
            "UPDATE conversations SET updated_at = ?1, message_count = message_count + 2 WHERE id = ?2",
            rusqlite::params![chrono::Utc::now().timestamp_millis(), &conversation_id],
        )
        .map_err(|e| e.to_string())?;
    } // db lock is released here

    // Trigger webhook for message received (AI response)
    {
        let trigger_manager = state.webhook_trigger_manager.clone();
        let conv_id = conversation_id.clone();
        let ai_resp = ai_response.clone();
        tokio::spawn(async move {
            trigger_manager.trigger_event(WebhookTriggerEvent::MessageReceived {
                conversation_id: conv_id,
                ai_response: ai_resp,
                tokens: 0, // TODO: Get actual token count from Ollama
            }).await;
        });
    }

    Ok(ChatResponse {
        conversation_id,
        message_id: ai_message_id,
        response: ai_response,
    })
}

/// Voice input start command
#[tauri::command]
pub async fn voice_input_start() -> Result<bool, String> {
    log::info!("Voice input start command called");
    // TODO: Implement Whisper integration
    Ok(true)
}

/// Voice input stop command
#[tauri::command]
pub async fn voice_input_stop() -> Result<String, String> {
    log::info!("Voice input stop command called");
    // TODO: Implement Whisper integration
    Ok("Transcript placeholder".to_string())
}

#[derive(Debug, Clone, Serialize)]
struct StreamChunk {
    chunk: String,
}

/// Streaming chat command - sends chunks via Tauri events
#[tauri::command]
pub async fn chat_stream(
    state: State<'_, AppState>,
    app: AppHandle,
    request: ChatRequest,
) -> Result<ChatResponse, String> {
    log::info!("Streaming chat command called with message: {}", request.message);

    // Generate IDs
    let conversation_id = request.conversation_id.clone().unwrap_or_else(|| {
        format!("conv_{}", chrono::Utc::now().timestamp_millis())
    });
    let message_id = format!("msg_{}", chrono::Utc::now().timestamp_millis());

    // Block 1: Save user message to database
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.conn();

        // Create conversation if it doesn't exist
        let conv_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM conversations WHERE id = ?1)",
                [&conversation_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        if !conv_exists {
            let now = chrono::Utc::now().timestamp_millis();
            conn.execute(
                "INSERT INTO conversations (id, title, mode, created_at, updated_at, message_count)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                rusqlite::params![
                    &conversation_id,
                    "New Chat",
                    "user-led",
                    now,
                    now,
                    0
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        // Save user message
        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, timestamp, context_level)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                &message_id,
                &conversation_id,
                "user",
                &request.message,
                now,
                request.context_level.unwrap_or(1)
            ],
        )
        .map_err(|e| e.to_string())?;
    } // db lock is released here

    // Generate AI response using streaming
    let ai_message_id = format!("msg_{}", chrono::Utc::now().timestamp_millis());
    let app_clone = app.clone();

    let ai_response = ollama::generate_response_stream(&request.message, move |chunk| {
        // Emit chunk to frontend via Tauri event
        app_clone.emit("chat-stream-chunk", StreamChunk { chunk }).map_err(|e| e.to_string())?;
        Ok(())
    }).await?;

    // Emit completion event
    app.emit("chat-stream-complete", ()).map_err(|e| e.to_string())?;

    // Block 2: Save AI response to database
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.conn();

        // Save AI message
        conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                &ai_message_id,
                &conversation_id,
                "assistant",
                &ai_response,
                chrono::Utc::now().timestamp_millis()
            ],
        )
        .map_err(|e| e.to_string())?;

        // Update conversation
        conn.execute(
            "UPDATE conversations SET updated_at = ?1, message_count = message_count + 2 WHERE id = ?2",
            rusqlite::params![chrono::Utc::now().timestamp_millis(), &conversation_id],
        )
        .map_err(|e| e.to_string())?;
    } // db lock is released here

    Ok(ChatResponse {
        conversation_id,
        message_id: ai_message_id,
        response: ai_response,
    })
}

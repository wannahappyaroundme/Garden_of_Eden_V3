use crate::AppState;
use crate::services::ollama;
use crate::services::webhook_triggers::WebhookTriggerEvent;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use std::sync::Arc;

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
    let start_time = std::time::Instant::now();

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
    log::info!("⏱️  [PERF] DB Save (user message): {:?}", start_time.elapsed());

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

    // Generate AI response using Ollama with RAG v2 (LanceDB) and Persona (v3.4.0)
    // Note: Pass database reference without cloning Mutex
    // v3.4.0: RAG v2 with LanceDB for 10-100x faster retrieval (100ms → 30ms)
    let llm_start = std::time::Instant::now();
    let ai_response = ollama::generate_response_with_rag_and_persona_ref(&request.message, Some(state.rag.clone()), Some(&state.db)).await?;
    log::info!("⏱️  [PERF] LLM Response (RAG + Persona + Inference): {:?}", llm_start.elapsed());
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

    let total_time = start_time.elapsed();
    log::info!("⏱️  [PERF] TOTAL Chat Response Time: {:?}", total_time);
    log::info!("📊 [PERF] Performance Breakdown:");
    log::info!("   - LLM (RAG + Persona + Inference): {:?}", llm_start.elapsed());
    log::info!("   - Other (DB + Webhooks): {:?}", total_time - llm_start.elapsed());

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

/// Voice input start command (DEPRECATED - removed to reduce latency)
#[tauri::command]
pub async fn voice_input_start() -> Result<bool, String> {
    Err("Voice input has been removed to reduce latency and improve performance".to_string())
}

/// Voice input stop command (DEPRECATED - removed to reduce latency)
#[tauri::command]
pub async fn voice_input_stop() -> Result<String, String> {
    Err("Voice input has been removed to reduce latency and improve performance".to_string())
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

/// Chat command with tool calling support (v3.6.0)
#[tauri::command]
pub async fn chat_with_tools(
    state: State<'_, AppState>,
    app: AppHandle,
    request: ChatRequest,
) -> Result<ChatResponse, String> {
    log::info!("Chat with tools command called with message: {}", request.message);

    // Generate IDs
    let conversation_id = request.conversation_id.unwrap_or_else(|| {
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
                    "New Chat (Tools)",
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

    // Generate AI response using tool calling (no lock held during async operation)
    let tool_service = Arc::clone(&state.tool_service);
    let ai_message_id = format!("msg_{}", chrono::Utc::now().timestamp_millis());
    let ai_response = ollama::generate_response_with_tools(
        &request.message,
        tool_service,
        None,  // RAG service integration pending
        5,     // Max 5 tool calling iterations
        Some(app),  // v3.7.0: Pass AppHandle for tool events
        Some(ai_message_id.clone()),  // v3.7.0: Pass message ID for events
    ).await?;

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

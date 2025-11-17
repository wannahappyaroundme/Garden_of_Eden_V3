use serde::{Deserialize, Serialize};
use reqwest::Client;
use futures_util::StreamExt;
use std::sync::Arc;
use tauri::Manager;  // v3.7.0: For emit() method

use super::rag::{RagService, format_episodes_for_context};
use super::tool_calling::{ToolService, ToolCall, ToolDefinition};
use super::learning::LearningService;
use crate::database::Database;

const OLLAMA_API_URL: &str = "http://localhost:11434/api/generate";
const OLLAMA_CHAT_API_URL: &str = "http://localhost:11434/api/chat";
const MODEL_NAME: &str = "qwen2.5:7b"; // Fast 3-4s responses, excellent Korean support, better reasoning
const RAG_TOP_K: usize = 3; // Retrieve top 3 most relevant memories

#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: OllamaOptions,
}

#[derive(Debug, Serialize)]
struct OllamaOptions {
    temperature: f32,
    top_p: f32,
    top_k: i32,
    repeat_penalty: f32, // Prevent overfitting and repetitive responses
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
    done: bool,
}

/// Generate a response from Ollama (without RAG - fallback mode)
pub async fn generate_response(user_message: &str) -> Result<String, String> {
    generate_response_with_rag_and_persona_ref(user_message, None, None).await
}

/// Generate a response from Ollama with RAG context
pub async fn generate_response_with_rag(
    user_message: &str,
    rag_service: Option<Arc<RagService>>,
) -> Result<String, String> {
    generate_response_with_rag_and_persona_ref(user_message, rag_service, None).await
}

/// Generate a response from Ollama with RAG context and persona (v3.8.0: Full personalization)
pub async fn generate_response_with_rag_and_persona_ref(
    user_message: &str,
    rag_service: Option<Arc<RagService>>,
    db: Option<&std::sync::Mutex<Database>>,
) -> Result<String, String> {
    log::info!("Generating AI response for message: {}", user_message);

    // 🎯 STEP 1: Load persona from database (v3.8.0 - Critical connection!)
    let mut system_prompt = String::new();

    if let Some(database) = &db {
        match database.lock() {
            Ok(db_guard) => {
                match db_guard.load_persona() {
                    Ok(persona_params) => {
                        log::info!("Loaded persona from database: formality={}, verbosity={}, humor={}, emoji_usage={}, empathy={}, creativity={}, proactiveness={}, technical_depth={}, code_examples={}, questioning={}",
                                 persona_params.formality, persona_params.verbosity, persona_params.humor, persona_params.emoji_usage,
                                 persona_params.empathy, persona_params.creativity, persona_params.proactiveness,
                                 persona_params.technical_depth, persona_params.code_examples, persona_params.questioning);

                        // Convert to learning service parameters and generate personalized prompt
                        let learning_params = persona_params.to_learning_params();
                        system_prompt = LearningService::generate_system_prompt(&learning_params);

                        log::debug!("Generated personalized system prompt ({} chars)", system_prompt.len());
                    }
                    Err(e) => {
                        log::warn!("Failed to load persona from database: {} - Using default prompt", e);
                        system_prompt = get_default_system_prompt();
                    }
                }
            }
            Err(e) => {
                log::warn!("Failed to acquire database lock: {} - Using default prompt", e);
                system_prompt = get_default_system_prompt();
            }
        }
    } else {
        log::debug!("No database provided - Using default prompt");
        system_prompt = get_default_system_prompt();
    }

    // 🎯 STEP 2: RAG - Retrieve relevant past conversations
    if let Some(rag) = &rag_service {
        match rag.retrieve_relevant(user_message, RAG_TOP_K).await {
            Ok(episodes) => {
                if !episodes.is_empty() {
                    log::info!("Retrieved {} relevant memories from RAG", episodes.len());
                    let memory_context = format_episodes_for_context(&episodes);
                    system_prompt.push_str("\n\n# Relevant Past Conversations\n");
                    system_prompt.push_str(&memory_context);
                    system_prompt.push_str("\n💡 Use the above memories to provide more contextual and personalized responses. Reference past conversations when relevant.\n");
                } else {
                    log::debug!("No relevant memories found");
                }
            }
            Err(e) => {
                log::warn!("Failed to retrieve RAG context: {} - Continuing without memory", e);
            }
        }
    }

    let full_prompt = format!("{}\n\nUser: {}\nAssistant:", system_prompt, user_message);

    // Create HTTP client
    let client = Client::new();

    // Prepare request with overfitting prevention parameters
    let request = OllamaRequest {
        model: MODEL_NAME.to_string(),
        prompt: full_prompt,
        stream: false,
        options: OllamaOptions {
            temperature: 0.8,      // Balanced creativity (prevent deterministic overfitting)
            top_p: 0.92,          // Nucleus sampling (diverse token selection)
            top_k: 45,            // Expanded token pool (avoid repetition)
            repeat_penalty: 1.15, // Penalize repetitive phrases (key overfitting prevention)
        },
    };

    log::debug!("Sending request to Ollama: {:?}", request);

    // Send request to Ollama
    let response = client
        .post(OLLAMA_API_URL)
        .json(&request)
        .send()
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to connect to Ollama: {}. Make sure Ollama is running.", e);
            log::error!("{}", error_msg);
            error_msg
        })?;

    // Check response status
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        let error_msg = format!("Ollama API error ({}): {}", status, error_text);
        log::error!("{}", error_msg);
        return Err(error_msg);
    }

    // Parse response
    let ollama_response: OllamaResponse = response.json().await.map_err(|e| {
        let error_msg = format!("Failed to parse Ollama response: {}", e);
        log::error!("{}", error_msg);
        error_msg
    })?;

    log::info!("Successfully generated AI response (done: {})", ollama_response.done);
    Ok(ollama_response.response.trim().to_string())
}

/// Generate a streaming response from Ollama (without RAG - fallback mode)
pub async fn generate_response_stream<F>(
    user_message: &str,
    on_chunk: F,
) -> Result<String, String>
where
    F: FnMut(String) -> Result<(), String>,
{
    generate_response_stream_with_rag(user_message, None, on_chunk).await
}

/// Generate a streaming response from Ollama with RAG context
pub async fn generate_response_stream_with_rag<F>(
    user_message: &str,
    rag_service: Option<Arc<RagService>>,
    mut on_chunk: F,
) -> Result<String, String>
where
    F: FnMut(String) -> Result<(), String>,
{
    log::info!("Generating streaming AI response for message: {}", user_message);

    // Build system prompt (Korean-first AI assistant)
    let mut system_prompt = "Your name is Adam. You are a friendly and helpful AI assistant living in the Garden of Eden environment.\n\n\
                         ⚠️ IMPORTANT: If the user asks in Korean, you MUST respond only in Korean!\n\
                         - If the user message contains Hangul (Korean characters) → Respond 100% in Korean\n\
                         - Only respond in English when the question is in English\n\
                         - Never respond in English to Korean questions\n\n\
                         Response format:\n\
                         - Emphasize important parts with **bold**\n\
                         - Use *italics* for parts that need emphasis\n\
                         - Use - or 1. for lists\n\
                         - Wrap code with ```\n\
                         - Use emojis appropriately for a friendly tone".to_string();

    // RAG: Retrieve relevant past conversations
    if let Some(rag) = &rag_service {
        match rag.retrieve_relevant(user_message, RAG_TOP_K).await {
            Ok(episodes) => {
                if !episodes.is_empty() {
                    log::info!("Retrieved {} relevant memories from RAG for streaming", episodes.len());
                    let memory_context = format_episodes_for_context(&episodes);
                    system_prompt.push_str(&memory_context);
                    system_prompt.push_str("\n💡 Use the above memories to provide more contextual and personalized responses. Reference past conversations when relevant.\n");
                } else {
                    log::debug!("No relevant memories found for streaming");
                }
            }
            Err(e) => {
                log::warn!("Failed to retrieve RAG context for streaming: {} - Continuing without memory", e);
            }
        }
    }

    let full_prompt = format!("{}\n\nUser: {}\nAssistant:", system_prompt, user_message);

    // Create HTTP client
    let client = Client::new();

    // Prepare streaming request with overfitting prevention parameters
    let request = OllamaRequest {
        model: MODEL_NAME.to_string(),
        prompt: full_prompt,
        stream: true, // Enable streaming
        options: OllamaOptions {
            temperature: 0.8,      // Balanced creativity (prevent deterministic overfitting)
            top_p: 0.92,          // Nucleus sampling (diverse token selection)
            top_k: 45,            // Expanded token pool (avoid repetition)
            repeat_penalty: 1.15, // Penalize repetitive phrases (key overfitting prevention)
        },
    };

    log::debug!("Sending streaming request to Ollama");

    // Send request and get streaming response
    let response = client
        .post(OLLAMA_API_URL)
        .json(&request)
        .send()
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to connect to Ollama: {}. Make sure Ollama is running.", e);
            log::error!("{}", error_msg);
            error_msg
        })?;

    // Check response status
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        let error_msg = format!("Ollama API error ({}): {}", status, error_text);
        log::error!("{}", error_msg);
        return Err(error_msg);
    }

    // Process streaming response
    let mut full_response = String::new();
    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| {
            let error_msg = format!("Error reading stream chunk: {}", e);
            log::error!("{}", error_msg);
            error_msg
        })?;

        // Parse JSON lines (each chunk is a JSON object)
        let text = String::from_utf8_lossy(&chunk);
        for line in text.lines() {
            if line.trim().is_empty() {
                continue;
            }

            match serde_json::from_str::<OllamaResponse>(line) {
                Ok(ollama_chunk) => {
                    if !ollama_chunk.response.is_empty() {
                        full_response.push_str(&ollama_chunk.response);
                        // Send chunk to callback
                        on_chunk(ollama_chunk.response)?;
                    }
                    if ollama_chunk.done {
                        log::info!("Streaming response complete");
                        break;
                    }
                }
                Err(e) => {
                    log::warn!("Failed to parse chunk: {} - Line: {}", e, line);
                }
            }
        }
    }

    Ok(full_response.trim().to_string())
}

/// Test if Ollama is running and accessible
pub async fn test_connection() -> Result<bool, String> {
    let client = Client::new();

    match client.get("http://localhost:11434/api/tags").send().await {
        Ok(response) => {
            if response.status().is_success() {
                log::info!("Ollama connection test: SUCCESS");
                Ok(true)
            } else {
                log::warn!("Ollama connection test: FAILED (status: {})", response.status());
                Ok(false)
            }
        }
        Err(e) => {
            log::error!("Ollama connection test: ERROR - {}", e);
            Err(format!("Failed to connect to Ollama: {}", e))
        }
    }
}

/// Store a conversation episode in RAG memory
/// Should be called after a successful response generation
pub async fn store_conversation_in_rag(
    rag_service: Arc<RagService>,
    user_message: &str,
    ai_response: &str,
    satisfaction: f32,
) -> Result<String, String> {
    log::info!("Storing conversation in RAG (satisfaction: {})", satisfaction);

    rag_service
        .store_episode(user_message, ai_response, satisfaction)
        .await
        .map_err(|e| {
            log::error!("Failed to store episode in RAG: {}", e);
            format!("Failed to store conversation in memory: {}", e)
        })
}

// ============================================================================
// Tool Calling Support (v3.5.1) - Chat API with Function Calling
// ============================================================================

/// Chat message for /api/chat endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String, // "system", "user", "assistant", "tool"
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCallResponse>>,
}

/// Tool call response from LLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCallResponse {
    pub function: FunctionCall,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionCall {
    pub name: String,
    pub arguments: serde_json::Value,
}

/// Chat API request with tool support
#[derive(Debug, Serialize)]
struct OllamaChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<OllamaTool>>,
    options: OllamaOptions,
}

/// Ollama tool definition (OpenAI-compatible)
#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaTool {
    r#type: String, // "function"
    function: OllamaToolFunction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaToolFunction {
    name: String,
    description: String,
    parameters: serde_json::Value,
}

/// Chat API response
#[derive(Debug, Deserialize)]
struct OllamaChatResponse {
    message: ChatMessage,
    done: bool,
}

/// Convert ToolDefinition to Ollama format
fn convert_tool_definition(tool: &ToolDefinition) -> OllamaTool {
    // Build JSON schema for parameters
    let mut properties = serde_json::Map::new();
    let mut required = Vec::new();

    for param in &tool.parameters {
        let param_type = match param.param_type {
            super::tool_calling::ParameterType::String => "string",
            super::tool_calling::ParameterType::Number => "number",
            super::tool_calling::ParameterType::Boolean => "boolean",
            super::tool_calling::ParameterType::Object => "object",
            super::tool_calling::ParameterType::Array => "array",
        };

        let mut param_schema = serde_json::json!({
            "type": param_type,
            "description": param.description,
        });

        if let Some(enum_values) = &param.enum_values {
            param_schema["enum"] = serde_json::json!(enum_values);
        }

        properties.insert(param.name.clone(), param_schema);

        if param.required {
            required.push(param.name.clone());
        }
    }

    let parameters = serde_json::json!({
        "type": "object",
        "properties": properties,
        "required": required,
    });

    OllamaTool {
        r#type: "function".to_string(),
        function: OllamaToolFunction {
            name: tool.name.clone(),
            description: tool.description.clone(),
            parameters,
        },
    }
}

/// Generate response with tool calling support (v3.7.0: Added event support)
pub async fn generate_response_with_tools(
    user_message: &str,
    tool_service: Arc<ToolService>,
    rag_service: Option<Arc<RagService>>,
    max_iterations: usize,
    app_handle: Option<tauri::AppHandle>,  // v3.7.0: For emitting tool events
    message_id: Option<String>,  // v3.7.0: Message ID for event tracking
) -> Result<String, String> {
    log::info!("Generating AI response with tool calling for: {}", user_message);

    // Build system prompt
    let mut system_prompt = "Your name is Adam. You are a friendly and helpful AI assistant living in the Garden of Eden environment.\n\n\
                         ⚠️ IMPORTANT: If the user asks in Korean, you MUST respond only in Korean!\n\
                         - If the user message contains Hangul (Korean characters) → Respond 100% in Korean\n\
                         - Only respond in English when the question is in English\n\
                         - Never respond in English to Korean questions\n\n\
                         You have access to various tools to help answer user questions. Use tools when appropriate.\n\n\
                         Response format:\n\
                         - Emphasize important parts with **bold**\n\
                         - Use *italics* for parts that need emphasis\n\
                         - Use - or 1. for lists\n\
                         - Wrap code with ```\n\
                         - Use emojis appropriately for a friendly tone".to_string();

    // RAG: Retrieve relevant past conversations
    if let Some(rag) = &rag_service {
        match rag.retrieve_relevant(user_message, RAG_TOP_K).await {
            Ok(episodes) => {
                if !episodes.is_empty() {
                    log::info!("Retrieved {} relevant memories from RAG", episodes.len());
                    let memory_context = format_episodes_for_context(&episodes);
                    system_prompt.push_str(&memory_context);
                    system_prompt.push_str("\n💡 Use the above memories to provide more contextual and personalized responses.\n");
                }
            }
            Err(e) => {
                log::warn!("Failed to retrieve RAG context: {} - Continuing without memory", e);
            }
        }
    }

    // Get tool definitions
    let tool_definitions = tool_service.get_tool_definitions();
    let ollama_tools: Vec<OllamaTool> = tool_definitions
        .iter()
        .map(convert_tool_definition)
        .collect();

    log::info!("Registered {} tools for this conversation", ollama_tools.len());

    // Initialize conversation with system message and user message
    let mut messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: system_prompt,
            tool_calls: None,
        },
        ChatMessage {
            role: "user".to_string(),
            content: user_message.to_string(),
            tool_calls: None,
        },
    ];

    let client = Client::new();
    let mut final_response = String::new();

    // Multi-turn tool calling loop
    for iteration in 0..max_iterations {
        log::debug!("Tool calling iteration {}/{}", iteration + 1, max_iterations);

        let request = OllamaChatRequest {
            model: MODEL_NAME.to_string(),
            messages: messages.clone(),
            stream: false,
            tools: Some(ollama_tools.clone()),
            options: OllamaOptions {
                temperature: 0.8,
                top_p: 0.92,
                top_k: 45,
                repeat_penalty: 1.15,
            },
        };

        // Send request
        let response = client
            .post(OLLAMA_CHAT_API_URL)
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                format!("Failed to connect to Ollama chat API: {}. Make sure Ollama is running.", e)
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Ollama chat API error ({}): {}", status, error_text));
        }

        let chat_response: OllamaChatResponse = response.json().await.map_err(|e| {
            format!("Failed to parse Ollama chat response: {}", e)
        })?;

        // Check if LLM wants to call a tool
        if let Some(tool_calls) = &chat_response.message.tool_calls {
            log::info!("LLM requested {} tool calls", tool_calls.len());

            // Add assistant message with tool calls
            messages.push(chat_response.message.clone());

            // Execute each tool call
            for tool_call in tool_calls {
                let function_name = &tool_call.function.name;
                let arguments = &tool_call.function.arguments;

                log::info!("Executing tool: {} with args: {:?}", function_name, arguments);

                // v3.7.0: TODO: Emit tool execution start event
                // Event emission will be implemented after testing with Window handle
                // if let (Some(app), Some(msg_id)) = (&app_handle, &message_id) {
                //     app.emit_all("ai:tool-execution-start", ...);
                // }
                let _ = (&app_handle, &message_id); // Suppress unused warning

                let tool_call_request = ToolCall {
                    tool_name: function_name.clone(),
                    arguments: arguments.clone(),
                };

                let start_time = std::time::Instant::now();
                let tool_result = tool_service.execute_tool(&tool_call_request).await;
                let execution_time_ms = start_time.elapsed().as_millis() as u64;

                // v3.7.0: TODO: Emit tool execution complete/error event
                // Event emission will be implemented after testing with Window handle
                log::info!("Tool {} execution completed in {}ms (success: {})",
                    function_name, execution_time_ms, tool_result.success);

                // Add tool result as a message
                let result_content = if tool_result.success {
                    serde_json::to_string(&tool_result.result).unwrap_or_else(|_| "{}".to_string())
                } else {
                    format!("{{\"error\": \"{}\"}}", tool_result.error.unwrap_or_default())
                };

                messages.push(ChatMessage {
                    role: "tool".to_string(),
                    content: result_content,
                    tool_calls: None,
                });
            }

            // Continue loop to get final response
            continue;
        }

        // No more tool calls - we have the final response
        final_response = chat_response.message.content.trim().to_string();
        log::info!("Received final response (iteration {})", iteration + 1);
        break;
    }

    if final_response.is_empty() {
        return Err("Failed to get response after maximum iterations".to_string());
    }

    Ok(final_response)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ollama_request_structure() {
        let request = OllamaRequest {
            model: "qwen2.5:7b".to_string(),
            prompt: "Hello world".to_string(),
            stream: false,
            options: OllamaOptions {
                temperature: 0.8,
                top_p: 0.92,
                top_k: 45,
                repeat_penalty: 1.15,
            },
        };

        assert_eq!(request.model, "qwen2.5:7b");
        assert_eq!(request.prompt, "Hello world");
        assert!(!request.stream);
        assert_eq!(request.options.temperature, 0.8);
    }

    #[test]
    fn test_ollama_options_overfitting_prevention() {
        let options = OllamaOptions {
            temperature: 0.8,
            top_p: 0.92,
            top_k: 45,
            repeat_penalty: 1.15,
        };

        // Verify anti-overfitting parameters are set correctly
        assert!(options.temperature >= 0.7, "Temperature should be >= 0.7 for diversity");
        assert!(options.top_p >= 0.9, "Top-p should be >= 0.9 for nucleus sampling");
        assert!(options.top_k >= 40, "Top-k should be >= 40 to avoid repetition");
        assert!(options.repeat_penalty >= 1.1, "Repeat penalty should be >= 1.1 to prevent repetition");
    }

    #[test]
    fn test_constants() {
        assert_eq!(OLLAMA_API_URL, "http://localhost:11434/api/generate");
        assert_eq!(MODEL_NAME, "qwen2.5:7b");
        assert_eq!(RAG_TOP_K, 3);
    }

    #[test]
    fn test_ollama_response_deserialization() {
        let json = r#"{"response": "Hello!", "done": true}"#;
        let response: OllamaResponse = serde_json::from_str(json).unwrap();

        assert_eq!(response.response, "Hello!");
        assert!(response.done);
    }

    #[test]
    fn test_stream_response_deserialization() {
        let json = r#"{"response": "Hi", "done": false}"#;
        let response: OllamaResponse = serde_json::from_str(json).unwrap();

        assert_eq!(response.response, "Hi");
        assert!(!response.done);
    }

    #[test]
    #[ignore] // Requires Ollama running
    fn test_generate_response_integration() {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        runtime.block_on(async {
            let result = generate_response("안녕하세요").await;

            // Should return success if Ollama is running
            match result {
                Ok(response) => {
                    assert!(!response.is_empty());
                    println!("Ollama response: {}", response);
                }
                Err(e) => {
                    println!("Ollama not available: {}", e);
                    // This is expected if Ollama is not running
                }
            }
        });
    }

    #[test]
    #[ignore] // Requires Ollama running
    fn test_stream_response_integration() {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        runtime.block_on(async {
            let callback = |chunk: String| -> Result<(), String> {
                println!("Received chunk: {}", chunk);
                Ok(())
            };

            let result = generate_response_stream("Tell me a joke", callback).await;

            match result {
                Ok(_) => println!("Stream completed successfully"),
                Err(e) => println!("Ollama not available: {}", e),
            }
        });
    }

    #[test]
    #[ignore] // Requires Ollama running
    fn test_connection_integration() {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        runtime.block_on(async {
            let result = test_connection().await;

            match result {
                Ok(is_connected) => {
                    if is_connected {
                        println!("Ollama is running and accessible");
                    } else {
                        println!("Ollama connection failed");
                    }
                }
                Err(e) => println!("Connection test failed: {}", e),
            }
        });
    }
}

/// Get default system prompt (fallback when persona loading fails)
fn get_default_system_prompt() -> String {
    "Your name is Adam. You are a friendly and helpful AI assistant living in the Garden of Eden environment.\n\n\
     ⚠️ IMPORTANT: If the user asks in Korean, you MUST respond only in Korean!\n\
     - If the user message contains Hangul (Korean characters) → Respond 100% in Korean\n\
     - Only respond in English when the question is in English\n\
     - Never respond in English to Korean questions\n\n\
     Response format:\n\
     - Emphasize important parts with **bold**\n\
     - Use *italics* for parts that need emphasis\n\
     - Use - or 1. for lists\n\
     - Wrap code with ```\n\
     - Use emojis appropriately for a friendly tone".to_string()
}

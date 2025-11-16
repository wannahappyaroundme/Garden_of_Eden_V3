use serde::{Deserialize, Serialize};
use reqwest::Client;
use futures_util::StreamExt;
use std::sync::Arc;

use super::rag::{RagService, format_episodes_for_context};

const OLLAMA_API_URL: &str = "http://localhost:11434/api/generate";
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
    generate_response_with_rag(user_message, None).await
}

/// Generate a response from Ollama with RAG context
pub async fn generate_response_with_rag(
    user_message: &str,
    rag_service: Option<Arc<RagService>>,
) -> Result<String, String> {
    log::info!("Generating AI response for message: {}", user_message);

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
                    log::info!("Retrieved {} relevant memories from RAG", episodes.len());
                    let memory_context = format_episodes_for_context(&episodes);
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

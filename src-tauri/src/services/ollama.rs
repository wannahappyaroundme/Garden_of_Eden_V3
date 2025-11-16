use serde::{Deserialize, Serialize};
use reqwest::Client;
use futures_util::StreamExt;

const OLLAMA_API_URL: &str = "http://localhost:11434/api/generate";
const MODEL_NAME: &str = "qwen2.5:14b";

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
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
    done: bool,
}

/// Generate a response from Ollama using Llama 3.1 8B
pub async fn generate_response(user_message: &str) -> Result<String, String> {
    log::info!("Generating AI response for message: {}", user_message);

    // Build system prompt (Korean-friendly AI assistant)
    let system_prompt = "당신의 이름은 Adam입니다. Garden of Eden이라는 환경 안에 살고 있는 친절하고 도움이 되는 AI 비서입니다. \
                         사용자의 질문에 명확하고 상세하게 답변하세요. \
                         한국어와 영어를 모두 자연스럽게 구사할 수 있습니다.\n\n\
                         중요: 답변 시 반드시 마크다운 형식을 사용하세요:\n\
                         - 중요한 부분은 **볼드**로 강조\n\
                         - 기울임이 필요한 부분은 *이탤릭*으로 표시\n\
                         - 목록은 - 또는 1. 을 사용\n\
                         - 코드는 ```로 감싸기\n\
                         - 이모지를 적절히 활용하여 친근하게 답변";

    let full_prompt = format!("{}\n\nUser: {}\nAssistant:", system_prompt, user_message);

    // Create HTTP client
    let client = Client::new();

    // Prepare request
    let request = OllamaRequest {
        model: MODEL_NAME.to_string(),
        prompt: full_prompt,
        stream: false,
        options: OllamaOptions {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
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

/// Generate a streaming response from Ollama
/// Returns chunks of text as they arrive via a callback function
pub async fn generate_response_stream<F>(
    user_message: &str,
    mut on_chunk: F,
) -> Result<String, String>
where
    F: FnMut(String) -> Result<(), String>,
{
    log::info!("Generating streaming AI response for message: {}", user_message);

    // Build system prompt
    let system_prompt = "당신의 이름은 Adam입니다. Garden of Eden이라는 환경 안에 살고 있는 친절하고 도움이 되는 AI 비서입니다. \
                         사용자의 질문에 명확하고 상세하게 답변하세요. \
                         한국어와 영어를 모두 자연스럽게 구사할 수 있습니다.\n\n\
                         중요: 답변 시 반드시 마크다운 형식을 사용하세요:\n\
                         - 중요한 부분은 **볼드**로 강조\n\
                         - 기울임이 필요한 부분은 *이탤릭*으로 표시\n\
                         - 목록은 - 또는 1. 을 사용\n\
                         - 코드는 ```로 감싸기\n\
                         - 이모지를 적절히 활용하여 친근하게 답변";

    let full_prompt = format!("{}\n\nUser: {}\nAssistant:", system_prompt, user_message);

    // Create HTTP client
    let client = Client::new();

    // Prepare streaming request
    let request = OllamaRequest {
        model: MODEL_NAME.to_string(),
        prompt: full_prompt,
        stream: true, // Enable streaming
        options: OllamaOptions {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
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

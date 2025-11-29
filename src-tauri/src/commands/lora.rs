/**
 * LoRA Training Commands (v3.6.0)
 *
 * Tauri commands for LoRA training data collection and adapter management:
 * - Collect training data from conversations
 * - Export data in various formats (Alpaca, ShareGPT, JSONL)
 * - Manage LoRA adapters for Ollama
 */

use crate::services::lora_data_collector::{
    LoRADataCollectorService, TrainingFormat, DataFilter, DatasetMetadata
};
use crate::services::lora_adapter_manager::{
    LoRAAdapterManager, LoRAAdapter
};
use log::info;
use std::sync::{Arc, Mutex};
use tauri::{command, State};

/// State for LoRA services
pub struct LoRAState {
    pub data_collector: Arc<Mutex<LoRADataCollectorService>>,
    pub adapter_manager: Arc<Mutex<LoRAAdapterManager>>,
}

/// Collect training data from conversations
#[command]
pub async fn lora_collect_data(
    state: State<'_, LoRAState>,
    format: String,
    limit: Option<usize>,
) -> Result<serde_json::Value, String> {
    info!("Command: lora_collect_data (format: {}, limit: {:?})", format, limit);

    let format = match format.as_str() {
        "alpaca" => TrainingFormat::Alpaca,
        "sharegpt" => TrainingFormat::ShareGPT,
        "jsonl" => TrainingFormat::JSONL,
        _ => return Err(format!("Unknown format: {}. Use alpaca, sharegpt, or jsonl", format)),
    };

    let collector = state.data_collector.lock()
        .map_err(|e| format!("Failed to lock data collector: {}", e))?;

    let (examples, metadata) = collector.collect_training_data(format, limit)
        .map_err(|e| format!("Failed to collect training data: {}", e))?;

    Ok(serde_json::json!({
        "success": true,
        "metadata": metadata,
        "examples_count": examples.len(),
        "examples": examples,
    }))
}

/// Get current data filter configuration
#[command]
pub async fn lora_get_filter(
    state: State<'_, LoRAState>,
) -> Result<serde_json::Value, String> {
    info!("Command: lora_get_filter");

    let collector = state.data_collector.lock()
        .map_err(|e| format!("Failed to lock data collector: {}", e))?;

    let filter = collector.get_filter();

    Ok(serde_json::json!({
        "min_satisfaction": filter.min_satisfaction,
        "min_message_length": filter.min_message_length,
        "max_message_length": filter.max_message_length,
        "positive_only": filter.positive_only,
        "exclude_negative": filter.exclude_negative,
        "min_turns": filter.min_turns,
    }))
}

/// Update data filter configuration
#[command]
pub async fn lora_update_filter(
    state: State<'_, LoRAState>,
    min_satisfaction: Option<f32>,
    min_message_length: Option<usize>,
    max_message_length: Option<usize>,
    positive_only: Option<bool>,
    exclude_negative: Option<bool>,
    min_turns: Option<usize>,
) -> Result<bool, String> {
    info!("Command: lora_update_filter");

    let mut collector = state.data_collector.lock()
        .map_err(|e| format!("Failed to lock data collector: {}", e))?;

    let current_filter = collector.get_filter().clone();

    let new_filter = DataFilter {
        min_satisfaction: min_satisfaction.unwrap_or(current_filter.min_satisfaction),
        min_message_length: min_message_length.unwrap_or(current_filter.min_message_length),
        max_message_length: max_message_length.unwrap_or(current_filter.max_message_length),
        positive_only: positive_only.unwrap_or(current_filter.positive_only),
        exclude_negative: exclude_negative.unwrap_or(current_filter.exclude_negative),
        min_turns: min_turns.unwrap_or(current_filter.min_turns),
    };

    collector.set_filter(new_filter);

    Ok(true)
}

/// List all LoRA adapters
#[command]
pub async fn lora_list_adapters(
    state: State<'_, LoRAState>,
) -> Result<Vec<LoRAAdapter>, String> {
    info!("Command: lora_list_adapters");

    let manager = state.adapter_manager.lock()
        .map_err(|e| format!("Failed to lock adapter manager: {}", e))?;

    manager.list_adapters()
        .map_err(|e| format!("Failed to list adapters: {}", e))
}

/// Get a specific LoRA adapter by ID
#[command]
pub async fn lora_get_adapter(
    state: State<'_, LoRAState>,
    adapter_id: String,
) -> Result<Option<LoRAAdapter>, String> {
    info!("Command: lora_get_adapter - {}", adapter_id);

    let manager = state.adapter_manager.lock()
        .map_err(|e| format!("Failed to lock adapter manager: {}", e))?;

    manager.load_adapter(&adapter_id)
        .map_err(|e| format!("Failed to get adapter: {}", e))
}

/// Register a new LoRA adapter
#[command]
pub async fn lora_register_adapter(
    state: State<'_, LoRAState>,
    name: String,
    description: String,
    base_model: String,
    adapter_path: String,
    version: String,
) -> Result<LoRAAdapter, String> {
    info!("Command: lora_register_adapter - {}", name);

    let manager = state.adapter_manager.lock()
        .map_err(|e| format!("Failed to lock adapter manager: {}", e))?;

    manager.register_adapter(name, description, base_model, adapter_path, version, None)
        .map_err(|e| format!("Failed to register adapter: {}", e))
}

/// Delete a LoRA adapter
#[command]
pub async fn lora_delete_adapter(
    state: State<'_, LoRAState>,
    adapter_id: String,
) -> Result<bool, String> {
    info!("Command: lora_delete_adapter - {}", adapter_id);

    let manager = state.adapter_manager.lock()
        .map_err(|e| format!("Failed to lock adapter manager: {}", e))?;

    manager.delete_adapter(&adapter_id)
        .map(|_| true)
        .map_err(|e| format!("Failed to delete adapter: {}", e))
}

/// Activate a LoRA adapter (set as active)
#[command]
pub async fn lora_activate_adapter(
    state: State<'_, LoRAState>,
    adapter_id: String,
) -> Result<bool, String> {
    info!("Command: lora_activate_adapter - {}", adapter_id);

    let manager = state.adapter_manager.lock()
        .map_err(|e| format!("Failed to lock adapter manager: {}", e))?;

    manager.set_active_adapter(&adapter_id)
        .map(|_| true)
        .map_err(|e| format!("Failed to activate adapter: {}", e))
}

/// Get currently active LoRA adapter
#[command]
pub async fn lora_get_active_adapter(
    state: State<'_, LoRAState>,
) -> Result<Option<LoRAAdapter>, String> {
    info!("Command: lora_get_active_adapter");

    let manager = state.adapter_manager.lock()
        .map_err(|e| format!("Failed to lock adapter manager: {}", e))?;

    manager.get_active_adapter()
        .map_err(|e| format!("Failed to get active adapter: {}", e))
}

/// Generate Modelfile for a LoRA adapter
#[command]
pub async fn lora_generate_modelfile(
    state: State<'_, LoRAState>,
    adapter_id: String,
    system_prompt: Option<String>,
) -> Result<String, String> {
    info!("Command: lora_generate_modelfile - {}", adapter_id);

    let manager = state.adapter_manager.lock()
        .map_err(|e| format!("Failed to lock adapter manager: {}", e))?;

    manager.generate_modelfile(&adapter_id, system_prompt)
        .map_err(|e| format!("Failed to generate modelfile: {}", e))
}

/// Export training data to file
#[command]
pub async fn lora_export_data(
    state: State<'_, LoRAState>,
    format: String,
    output_path: String,
    limit: Option<usize>,
) -> Result<serde_json::Value, String> {
    info!("Command: lora_export_data (format: {}, path: {})", format, output_path);

    let format = match format.as_str() {
        "alpaca" => TrainingFormat::Alpaca,
        "sharegpt" => TrainingFormat::ShareGPT,
        "jsonl" => TrainingFormat::JSONL,
        _ => return Err(format!("Unknown format: {}. Use alpaca, sharegpt, or jsonl", format)),
    };

    let collector = state.data_collector.lock()
        .map_err(|e| format!("Failed to lock data collector: {}", e))?;

    let (examples, metadata) = collector.collect_training_data(format, limit)
        .map_err(|e| format!("Failed to collect training data: {}", e))?;

    // Write to file
    let content = serde_json::to_string_pretty(&examples)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;

    std::fs::write(&output_path, content)
        .map_err(|e| format!("Failed to write to file: {}", e))?;

    Ok(serde_json::json!({
        "success": true,
        "output_path": output_path,
        "metadata": metadata,
        "examples_count": examples.len(),
    }))
}

/// Create Ollama model from adapter using Modelfile (v3.6.0)
///
/// This calls Ollama's /api/create endpoint to create a new model
/// based on the adapter's Modelfile configuration.
#[command]
pub async fn lora_create_ollama_model(
    state: State<'_, LoRAState>,
    adapter_id: String,
    model_name: String,
    system_prompt: Option<String>,
) -> Result<serde_json::Value, String> {
    info!("Command: lora_create_ollama_model - adapter: {}, model: {}", adapter_id, model_name);

    // Get the adapter manager (need to clone to avoid holding lock across await)
    let modelfile = {
        let manager = state.adapter_manager.lock()
            .map_err(|e| format!("Failed to lock adapter manager: {}", e))?;

        manager.generate_modelfile(&adapter_id, system_prompt.clone())
            .map_err(|e| format!("Failed to generate modelfile: {}", e))?
    };

    // Call Ollama create API
    let client = reqwest::Client::new();
    let response = client
        .post("http://127.0.0.1:11434/api/create")
        .json(&serde_json::json!({
            "name": model_name,
            "modelfile": modelfile,
            "stream": false
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama create failed: {}", error_text));
    }

    let response_text = response.text().await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    // Check for errors in response
    if response_text.contains("error") && !response_text.contains("\"status\":\"success\"") {
        return Err(format!("Ollama create failed: {}", response_text));
    }

    info!("Successfully created Ollama model: {}", model_name);

    Ok(serde_json::json!({
        "success": true,
        "model_name": model_name,
        "adapter_id": adapter_id,
    }))
}

/// Delete an Ollama model (v3.6.0)
#[command]
pub async fn lora_delete_ollama_model(
    model_name: String,
) -> Result<bool, String> {
    info!("Command: lora_delete_ollama_model - {}", model_name);

    let client = reqwest::Client::new();
    let response = client
        .delete("http://127.0.0.1:11434/api/delete")
        .json(&serde_json::json!({
            "name": model_name
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Failed to delete model: {}", error_text));
    }

    info!("Successfully deleted Ollama model: {}", model_name);
    Ok(true)
}

/// List all Ollama models (v3.6.0)
#[command]
pub async fn lora_list_ollama_models() -> Result<Vec<String>, String> {
    info!("Command: lora_list_ollama_models");

    let client = reqwest::Client::new();
    let response = client
        .get("http://127.0.0.1:11434/api/tags")
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

    if !response.status().is_success() {
        return Err("Failed to list Ollama models".to_string());
    }

    let json: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let models = json.get("models")
        .and_then(|m| m.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|m| m.get("name").and_then(|n| n.as_str()).map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default();

    Ok(models)
}

/// Get training data statistics
#[command]
pub async fn lora_get_stats(
    state: State<'_, LoRAState>,
) -> Result<serde_json::Value, String> {
    info!("Command: lora_get_stats");

    let collector = state.data_collector.lock()
        .map_err(|e| format!("Failed to lock data collector: {}", e))?;

    let manager = state.adapter_manager.lock()
        .map_err(|e| format!("Failed to lock adapter manager: {}", e))?;

    let adapters = manager.list_adapters()
        .map_err(|e| format!("Failed to list adapters: {}", e))?;

    // Collect data to count available training examples
    let (examples, _) = collector.collect_training_data(TrainingFormat::JSONL, Some(10000))
        .unwrap_or_else(|_| (vec![], DatasetMetadata {
            id: String::new(),
            name: String::new(),
            description: String::new(),
            format: TrainingFormat::JSONL,
            total_examples: 0,
            avg_satisfaction: 0.0,
            created_at: 0,
            filter_config: String::new(),
        }));

    let filter = collector.get_filter();

    Ok(serde_json::json!({
        "available_training_examples": examples.len(),
        "registered_adapters": adapters.len(),
        "active_adapters": adapters.iter().filter(|a| a.is_active).count(),
        "current_filter": {
            "min_satisfaction": filter.min_satisfaction,
            "min_turns": filter.min_turns,
        }
    }))
}

use crate::AppState;
use log::info;
use tauri::{command, State};

/// Manage context with attention sink pattern
#[command]
pub fn attention_sink_manage_context(
    state: State<'_, AppState>,
    context: String,
    _sink_size: Option<usize>,   // Reserved for future per-call configuration
    _window_size: Option<usize>, // Reserved for future per-call configuration
) -> Result<serde_json::Value, String> {
    info!("Command: attention_sink_manage_context");

    // Use the global attention sink manager from AppState
    let manager = &*state.attention_sink;
    let managed = manager.manage_context(&context);

    Ok(serde_json::json!({
        "attention_sink": managed.attention_sink,
        "compressed_middle": managed.compressed_middle,
        "recent_window": managed.recent_window,
        "total_original_tokens": managed.total_original_tokens,
        "compressed_tokens": managed.compressed_tokens,
        "compression_ratio_achieved": managed.compression_ratio_achieved,
        "requires_compression": managed.requires_compression,
    }))
}

/// Format managed context for LLM prompt
#[command]
pub fn attention_sink_format_prompt(
    state: State<'_, AppState>,
    attention_sink: String,
    compressed_middle: String,
    recent_window: String,
) -> Result<String, String> {
    info!("Command: attention_sink_format_prompt");

    let manager = &*state.attention_sink;

    let context = crate::services::attention_sink::ManagedContext {
        attention_sink,
        compressed_middle,
        recent_window,
        total_original_tokens: 0,
        compressed_tokens: 0,
        compression_ratio_achieved: 0.0,
        requires_compression: false,
    };

    Ok(manager.format_for_prompt(&context))
}

/// Check if context needs compression
#[command]
pub fn attention_sink_needs_compression(
    state: State<'_, AppState>,
    context: String,
    max_tokens: Option<usize>,
) -> Result<serde_json::Value, String> {
    info!("Command: attention_sink_needs_compression");

    let manager = &*state.attention_sink;
    let estimated_tokens = manager.estimate_tokens(&context);
    let needs_compression = manager.needs_compression(estimated_tokens);
    let max = max_tokens.unwrap_or(manager.config().max_context_tokens);

    Ok(serde_json::json!({
        "needs_compression": needs_compression,
        "estimated_tokens": estimated_tokens,
        "max_tokens": max,
        "utilization_percent": (estimated_tokens as f32 / max as f32) * 100.0,
    }))
}

/// Estimate token count for text
#[command]
pub fn attention_sink_estimate_tokens(state: State<'_, AppState>, text: String) -> Result<usize, String> {
    let manager = &*state.attention_sink;
    Ok(manager.estimate_tokens(&text))
}

/// Get Attention Sink configuration
#[command]
pub fn attention_sink_get_config(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: attention_sink_get_config");

    let manager = &*state.attention_sink;
    let stats = manager.stats();

    Ok(serde_json::json!({
        "sink_size": stats.sink_size,
        "window_size": stats.window_size,
        "compression_ratio": stats.compression_ratio,
        "chunk_size": stats.chunk_size,
        "max_context_tokens": stats.max_context_tokens,
    }))
}

/// Get Attention Sink statistics
#[command]
pub fn attention_sink_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: attention_sink_stats");

    let manager = &*state.attention_sink;
    let stats = manager.stats();

    Ok(serde_json::json!({
        "sink_size": stats.sink_size,
        "window_size": stats.window_size,
        "compression_ratio": stats.compression_ratio,
        "chunk_size": stats.chunk_size,
        "max_context_tokens": stats.max_context_tokens,
    }))
}

/**
 * LLM Management Commands (v3.5.0)
 *
 * VRAM-based model selection and reasoning mode management
 */

use crate::AppState;
use log::{error, info};
use tauri::State;

/// Get VRAM information and recommended models (v3.5.0)
#[tauri::command]
pub async fn llm_get_vram_info(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: llm_get_vram_info");

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Get VRAM from database (stored during system detection)
    let vram_gb: Option<i64> = conn
        .query_row(
            "SELECT vram_capacity FROM llm_settings WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .ok()
        .flatten();

    // Recommend models based on VRAM
    let recommended_models = match vram_gb {
        Some(vram) if vram >= 16 => vec!["qwen2.5:14b", "qwen2.5:32b", "llama3.3:70b"],
        Some(vram) if vram >= 8 => vec!["qwen2.5:7b", "llama3.2:8b", "gemma2:9b"],
        Some(vram) if vram >= 4 => vec!["qwen2.5:3b", "llama3.2:3b", "phi3:3.8b"],
        _ => vec!["qwen2.5:1.5b", "phi3:mini"],
    };

    info!("VRAM: {:?}GB, Recommended models: {:?}", vram_gb, recommended_models);

    Ok(serde_json::json!({
        "vram_gb": vram_gb,
        "recommended_models": recommended_models,
    }))
}

/// Get current LLM settings (v3.5.0)
#[tauri::command]
pub async fn llm_get_settings(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: llm_get_settings");

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    let settings = conn
        .query_row(
            "SELECT selected_model, reasoning_mode, auto_select_model, vram_capacity,
                    context_window_size, max_ram_usage_gb
             FROM llm_settings WHERE id = 1",
            [],
            |row| {
                Ok(serde_json::json!({
                    "selected_model": row.get::<_, String>(0)?,
                    "reasoning_mode": row.get::<_, String>(1)?,
                    "auto_select_model": row.get::<_, bool>(2)?,
                    "vram_capacity": row.get::<_, Option<i64>>(3)?,
                    "context_window_size": row.get::<_, Option<i32>>(4)?,
                    "max_ram_usage_gb": row.get::<_, Option<i32>>(5)?,
                }))
            },
        )
        .unwrap_or_else(|_| {
            // Return defaults if not found
            serde_json::json!({
                "selected_model": "qwen2.5:3b",
                "reasoning_mode": "quick",
                "auto_select_model": true,
                "vram_capacity": null,
                "context_window_size": 8192,
                "max_ram_usage_gb": 8,
            })
        });

    info!("LLM settings retrieved");
    Ok(settings)
}

/// Set selected LLM model (v3.5.0)
#[tauri::command]
pub async fn llm_set_model(
    state: State<'_, AppState>,
    model: String,
) -> Result<(), String> {
    info!("Command: llm_set_model - {}", model);

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Initialize settings if not exists
    conn.execute(
        "INSERT OR IGNORE INTO llm_settings (id, selected_model) VALUES (1, 'qwen2.5:3b')",
        [],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    // Update selected model
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "UPDATE llm_settings SET selected_model = ?1, updated_at = ?2 WHERE id = 1",
        (&model, now),
    )
    .map_err(|e| format!("Failed to update model: {}", e))?;

    info!("Selected model updated to: {}", model);
    Ok(())
}

/// Set reasoning mode (quick/deep) (v3.5.0)
#[tauri::command]
pub async fn llm_set_reasoning_mode(
    state: State<'_, AppState>,
    mode: String,
) -> Result<(), String> {
    info!("Command: llm_set_reasoning_mode - {}", mode);

    // Validate mode
    if mode != "quick" && mode != "deep" {
        return Err("Invalid reasoning mode: must be 'quick' or 'deep'".to_string());
    }

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Initialize settings if not exists
    conn.execute(
        "INSERT OR IGNORE INTO llm_settings (id, selected_model) VALUES (1, 'qwen2.5:3b')",
        [],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    // Update reasoning mode
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "UPDATE llm_settings SET reasoning_mode = ?1, updated_at = ?2 WHERE id = 1",
        (&mode, now),
    )
    .map_err(|e| format!("Failed to update reasoning mode: {}", e))?;

    info!("Reasoning mode updated to: {}", mode);
    Ok(())
}

/// Update VRAM capacity (called during system detection) (v3.5.0)
#[tauri::command]
pub async fn llm_update_vram(
    state: State<'_, AppState>,
    vram_gb: Option<i64>,
) -> Result<(), String> {
    info!("Command: llm_update_vram - {:?}GB", vram_gb);

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Initialize settings if not exists
    conn.execute(
        "INSERT OR IGNORE INTO llm_settings (id, selected_model) VALUES (1, 'qwen2.5:3b')",
        [],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    // Update VRAM capacity
    conn.execute(
        "UPDATE llm_settings SET vram_capacity = ?1 WHERE id = 1",
        [vram_gb],
    )
    .map_err(|e| format!("Failed to update VRAM: {}", e))?;

    info!("VRAM capacity updated");
    Ok(())
}

/// Set context window size (v3.6.0)
#[tauri::command]
pub async fn llm_set_context_window(
    state: State<'_, AppState>,
    size: i32,
) -> Result<(), String> {
    info!("Command: llm_set_context_window - {} tokens", size);

    // Validate size (2K-32K tokens)
    if size < 2048 || size > 32768 {
        return Err("Invalid context window size: must be between 2048 and 32768".to_string());
    }

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Initialize settings if not exists
    conn.execute(
        "INSERT OR IGNORE INTO llm_settings (id, selected_model) VALUES (1, 'qwen2.5:3b')",
        [],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    // Update context window size
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "UPDATE llm_settings SET context_window_size = ?1, updated_at = ?2 WHERE id = 1",
        rusqlite::params![size, now],
    )
    .map_err(|e| format!("Failed to update context window: {}", e))?;

    info!("Context window size updated to: {} tokens", size);
    Ok(())
}

/// Set maximum RAM usage (v3.6.0)
#[tauri::command]
pub async fn llm_set_max_ram(
    state: State<'_, AppState>,
    max_gb: i32,
) -> Result<(), String> {
    info!("Command: llm_set_max_ram - {} GB", max_gb);

    // Validate size (4-32 GB)
    if max_gb < 4 || max_gb > 32 {
        return Err("Invalid max RAM: must be between 4 and 32 GB".to_string());
    }

    let db = state.db.lock().map_err(|e| {
        error!("Failed to lock database: {}", e);
        format!("Database lock error: {}", e)
    })?;
    let conn = db.conn();

    // Initialize settings if not exists
    conn.execute(
        "INSERT OR IGNORE INTO llm_settings (id, selected_model) VALUES (1, 'qwen2.5:3b')",
        [],
    )
    .map_err(|e| format!("Database error: {}", e))?;

    // Update max RAM usage
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "UPDATE llm_settings SET max_ram_usage_gb = ?1, updated_at = ?2 WHERE id = 1",
        rusqlite::params![max_gb, now],
    )
    .map_err(|e| format!("Failed to update max RAM: {}", e))?;

    info!("Max RAM usage updated to: {} GB", max_gb);
    Ok(())
}

use crate::AppState;
use crate::database::models::PersonaSettings;
use crate::services::model_recommender::{ModelOption, ModelInfo, ModelRecommenderService};
use crate::services::system_info::SystemInfoService;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub persona: PersonaSettings,
    pub theme: String,
    pub language: String,
}

/// Get current settings
#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<Settings, String> {
    log::info!("Getting settings");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // Get persona settings (get the latest one)
    let persona: PersonaSettings = conn
        .query_row(
            "SELECT id, formality, humor, verbosity, emoji_usage, enthusiasm,
                    empathy, directness, technicality, creativity, proactivity,
                    language_preference, code_language_preference,
                    patience, encouragement, formality_honorifics,
                    reasoning_depth, context_awareness,
                    created_at, updated_at
             FROM persona_settings
             ORDER BY id DESC
             LIMIT 1",
            [],
            |row| {
                Ok(PersonaSettings {
                    id: Some(row.get(0)?),
                    formality: row.get(1)?,
                    humor: row.get(2)?,
                    verbosity: row.get(3)?,
                    emoji_usage: row.get(4)?,
                    enthusiasm: row.get(5)?,
                    empathy: row.get(6)?,
                    directness: row.get(7)?,
                    technicality: row.get(8)?,
                    creativity: row.get(9)?,
                    proactivity: row.get(10)?,
                    language_preference: row.get(11)?,
                    code_language_preference: row.get(12)?,
                    patience: row.get(13)?,
                    encouragement: row.get(14)?,
                    formality_honorifics: row.get(15)?,
                    reasoning_depth: row.get(16)?,
                    context_awareness: row.get(17)?,
                    created_at: row.get(18)?,
                    updated_at: row.get(19)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    // Get theme preference
    let theme: String = conn
        .query_row(
            "SELECT value FROM user_preferences WHERE key = 'theme'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "system".to_string());

    // Get language preference
    let language: String = conn
        .query_row(
            "SELECT value FROM user_preferences WHERE key = 'language'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "auto".to_string());

    Ok(Settings {
        persona,
        theme,
        language,
    })
}

/// Update settings
#[tauri::command]
pub async fn update_settings(
    state: State<'_, AppState>,
    settings: Settings,
) -> Result<(), String> {
    log::info!("Updating settings");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();
    let now = chrono::Utc::now().timestamp_millis();

    // Update persona settings
    if let Some(id) = settings.persona.id {
        conn.execute(
            "UPDATE persona_settings SET
                formality = ?1, humor = ?2, verbosity = ?3, emoji_usage = ?4, enthusiasm = ?5,
                empathy = ?6, directness = ?7, technicality = ?8, creativity = ?9, proactivity = ?10,
                language_preference = ?11, code_language_preference = ?12,
                patience = ?13, encouragement = ?14, formality_honorifics = ?15,
                reasoning_depth = ?16, context_awareness = ?17, updated_at = ?18
             WHERE id = ?19",
            rusqlite::params![
                settings.persona.formality,
                settings.persona.humor,
                settings.persona.verbosity,
                settings.persona.emoji_usage,
                settings.persona.enthusiasm,
                settings.persona.empathy,
                settings.persona.directness,
                settings.persona.technicality,
                settings.persona.creativity,
                settings.persona.proactivity,
                settings.persona.language_preference,
                settings.persona.code_language_preference,
                settings.persona.patience,
                settings.persona.encouragement,
                settings.persona.formality_honorifics,
                settings.persona.reasoning_depth,
                settings.persona.context_awareness,
                now,
                id,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // Update theme
    conn.execute(
        "INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
         VALUES ('theme', ?1, ?2)",
        rusqlite::params![settings.theme, now],
    )
    .map_err(|e| e.to_string())?;

    // Update language
    conn.execute(
        "INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
         VALUES ('language', ?1, ?2)",
        rusqlite::params![settings.language, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Model Management Commands
// ============================================================================

/// Get available models for user's system specs and language preference
#[tauri::command]
pub fn get_available_models_for_system(
    language_preference: String,
) -> Result<Vec<ModelOption>, String> {
    log::info!("Getting available models for language: {}", language_preference);

    // Detect system specs
    let mut system_info = SystemInfoService::new();
    let specs = system_info.detect_specs()
        .map_err(|e| format!("Failed to detect system specs: {}", e))?;

    // Get available models
    let models = ModelRecommenderService::get_available_models(&specs, &language_preference)
        .map_err(|e| format!("Failed to get available models: {}", e))?;

    Ok(models)
}

/// Get currently active LLM model from Ollama
#[tauri::command]
pub async fn get_current_llm_model() -> Result<String, String> {
    log::info!("Getting current LLM model");

    let model = ModelRecommenderService::get_current_model()
        .await
        .map_err(|e| format!("Failed to get current model: {}", e))?;

    Ok(model)
}

/// Switch to a different LLM model (download if not present)
#[tauri::command]
pub async fn switch_llm_model(
    state: State<'_, AppState>,
    model_name: String,
) -> Result<(), String> {
    log::info!("Switching to model: {}", model_name);

    // Validate model name
    if !ModelRecommenderService::is_valid_model(&model_name) {
        return Err(format!("Invalid model name: {}", model_name));
    }

    // Save selected model to database
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();
    let now = chrono::Utc::now().timestamp_millis();

    conn.execute(
        "INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
         VALUES ('active_llm_model', ?1, ?2)",
        rusqlite::params![model_name, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// List all downloaded Ollama models with sizes
#[tauri::command]
pub async fn list_ollama_models() -> Result<Vec<ModelInfo>, String> {
    log::info!("Listing all downloaded Ollama models");

    let models = ModelRecommenderService::list_downloaded_models()
        .await
        .map_err(|e| format!("Failed to list models: {}", e))?;

    Ok(models)
}

/// Delete an Ollama model
#[tauri::command]
pub async fn delete_ollama_model(model_name: String) -> Result<(), String> {
    log::info!("Deleting model: {}", model_name);

    ModelRecommenderService::delete_model(&model_name)
        .await
        .map_err(|e| format!("Failed to delete model: {}", e))?;

    Ok(())
}

/// Get size of a specific Ollama model
#[tauri::command]
pub async fn get_ollama_model_size(model_name: String) -> Result<f32, String> {
    log::info!("Getting size of model: {}", model_name);

    let models = ModelRecommenderService::list_downloaded_models()
        .await
        .map_err(|e| format!("Failed to list models: {}", e))?;

    let model = models
        .iter()
        .find(|m| m.name == model_name)
        .ok_or_else(|| format!("Model not found: {}", model_name))?;

    Ok(model.size_gb)
}

/// Get user-friendly description of a model
#[tauri::command]
pub fn get_model_description(model_name: String) -> String {
    ModelRecommenderService::get_model_description(&model_name)
}

use crate::AppState;
use crate::services::learning::{Feedback, PersonaParameters, LearningStats};
use tauri::State;

/// Record user feedback for learning system
#[tauri::command]
pub async fn learning_record_feedback(
    state: State<'_, AppState>,
    feedback: Feedback,
) -> Result<(), String> {
    log::info!("Recording feedback: satisfaction={:.2}", feedback.satisfaction);

    state.learning_service
        .record_feedback(feedback)
        .map_err(|e| format!("Failed to record feedback: {}", e))
}

/// Optimize persona parameters based on feedback history
#[tauri::command]
pub async fn learning_optimize_persona(
    state: State<'_, AppState>,
    current_persona: PersonaParameters,
) -> Result<PersonaParameters, String> {
    log::info!("Optimizing persona parameters");

    state.learning_service
        .optimize_persona(current_persona)
        .map_err(|e| format!("Failed to optimize persona: {}", e))
}

/// Get learning statistics
#[tauri::command]
pub async fn learning_get_stats(
    state: State<'_, AppState>,
) -> Result<LearningStats, String> {
    state.learning_service
        .get_stats()
        .map_err(|e| format!("Failed to get learning stats: {}", e))
}

/// Generate system prompt from persona parameters
#[tauri::command]
pub async fn learning_generate_system_prompt(
    persona: PersonaParameters,
) -> Result<String, String> {
    Ok(crate::services::learning::LearningService::generate_system_prompt(&persona))
}

/// Save persona parameters to local database
#[tauri::command]
pub async fn learning_save_persona(
    state: State<'_, AppState>,
    persona: PersonaParameters,
) -> Result<(), String> {
    log::info!("Saving persona parameters to local database");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();
    let now = chrono::Utc::now().timestamp_millis();

    // Save to database
    conn.execute(
        "INSERT INTO persona_parameters (
            formality, verbosity, humor, emoji_usage, proactiveness,
            technical_depth, empathy, code_examples, questioning, suggestions,
            created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        rusqlite::params![
            persona.formality,
            persona.verbosity,
            persona.humor,
            persona.emoji_usage,
            persona.proactiveness,
            persona.technical_depth,
            persona.empathy,
            persona.code_examples,
            persona.questioning,
            persona.suggestions,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Load persona parameters from local database
#[tauri::command]
pub async fn learning_load_persona(
    state: State<'_, AppState>,
) -> Result<PersonaParameters, String> {
    log::info!("Loading persona parameters from local database");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // Get latest persona
    let persona = conn
        .query_row(
            "SELECT formality, verbosity, humor, emoji_usage, proactiveness,
                    technical_depth, empathy, code_examples, questioning, suggestions
             FROM persona_parameters
             ORDER BY id DESC
             LIMIT 1",
            [],
            |row| {
                Ok(PersonaParameters {
                    formality: row.get(0)?,
                    verbosity: row.get(1)?,
                    humor: row.get(2)?,
                    emoji_usage: row.get(3)?,
                    proactiveness: row.get(4)?,
                    technical_depth: row.get(5)?,
                    empathy: row.get(6)?,
                    code_examples: row.get(7)?,
                    questioning: row.get(8)?,
                    suggestions: row.get(9)?,
                })
            },
        )
        .unwrap_or_else(|_| {
            log::warn!("No persona found in database, using defaults");
            PersonaParameters {
                formality: 0.3,
                verbosity: 0.5,
                humor: 0.2,
                emoji_usage: 0.1,
                proactiveness: 0.4,
                technical_depth: 0.6,
                empathy: 0.5,
                code_examples: 0.7,
                questioning: 0.5,
                suggestions: 0.4,
            }
        });

    Ok(persona)
}

use crate::AppState;
use crate::database::models::UserProfile;
use crate::services::system_info::{SystemInfoService, SystemSpecs};
use crate::services::model_recommender::{ModelRecommenderService, ModelRecommendation, RequiredModels};
use crate::services::model_installer::{ModelInstallerService, ModelDownloadState};
use crate::services::prompt_customizer::{PromptCustomizerService, SurveyResults, ModelConfig};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct OnboardingAnswers {
    pub name: String,
    pub selected_persona: String,
    pub tone_preference: String,
    pub occupation: String,
    pub proactive_frequency: String,
    pub interests: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OnboardingStatus {
    pub completed: bool,
    pub profile: Option<UserProfile>,
}

/// Check if user has completed onboarding
#[tauri::command]
pub async fn check_onboarding_status(
    state: State<'_, AppState>,
) -> Result<OnboardingStatus, String> {
    log::info!("Checking onboarding status...");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // Check if user_profile exists
    let profile_result = conn.query_row(
        "SELECT id, name, display_name, age_group, occupation, interests,
                tone_preference, proactive_frequency, selected_persona,
                onboarding_completed_at, created_at, updated_at
         FROM user_profile WHERE id = 1",
        [],
        |row| {
            Ok(UserProfile {
                id: row.get(0)?,
                name: row.get(1)?,
                display_name: row.get(2)?,
                age_group: row.get(3)?,
                occupation: row.get(4)?,
                interests: row.get(5)?,
                tone_preference: row.get(6)?,
                proactive_frequency: row.get(7)?,
                selected_persona: row.get(8)?,
                onboarding_completed_at: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        },
    );

    match profile_result {
        Ok(profile) => {
            log::info!("User profile found: {}", profile.name);
            Ok(OnboardingStatus {
                completed: true,
                profile: Some(profile),
            })
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            log::info!("No user profile found - onboarding not completed");
            Ok(OnboardingStatus {
                completed: false,
                profile: None,
            })
        }
        Err(e) => {
            log::error!("Error checking onboarding status: {}", e);
            Err(e.to_string())
        }
    }
}

/// Complete onboarding and save user profile
#[tauri::command]
pub async fn complete_onboarding(
    state: State<'_, AppState>,
    answers: OnboardingAnswers,
) -> Result<UserProfile, String> {
    log::info!("Completing onboarding for user: {}", answers.name);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let now = chrono::Utc::now().timestamp_millis();

    // Extract display name (Korean name: use full name, English name: first name)
    let display_name = extract_display_name(&answers.name);

    // Insert user profile
    conn.execute(
        "INSERT INTO user_profile (
            id, name, display_name, age_group, occupation, interests,
            tone_preference, proactive_frequency, selected_persona,
            onboarding_completed_at, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        rusqlite::params![
            1, // Only one profile allowed
            &answers.name,
            &display_name,
            Option::<String>::None, // age_group not collected in onboarding
            &answers.occupation,
            &answers.interests,
            &answers.tone_preference,
            &answers.proactive_frequency,
            &answers.selected_persona,
            now,
            now,
            now,
        ],
    )
    .map_err(|e| format!("Failed to save user profile: {}", e))?;

    // Apply persona settings based on onboarding answers
    apply_persona_from_onboarding(&conn, &answers)?;

    log::info!("Onboarding completed successfully for {}", answers.name);

    // Return the created profile
    let profile = conn
        .query_row(
            "SELECT id, name, display_name, age_group, occupation, interests,
                    tone_preference, proactive_frequency, selected_persona,
                    onboarding_completed_at, created_at, updated_at
             FROM user_profile WHERE id = 1",
            [],
            |row| {
                Ok(UserProfile {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    display_name: row.get(2)?,
                    age_group: row.get(3)?,
                    occupation: row.get(4)?,
                    interests: row.get(5)?,
                    tone_preference: row.get(6)?,
                    proactive_frequency: row.get(7)?,
                    selected_persona: row.get(8)?,
                    onboarding_completed_at: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(profile)
}

/// Extract display name from full name
fn extract_display_name(full_name: &str) -> String {
    // Check if name contains Korean characters
    let has_korean = full_name.chars().any(|c| {
        matches!(c, '\u{AC00}'..='\u{D7A3}') // Korean syllables range
    });

    if has_korean {
        // Korean name: use full name
        full_name.to_string()
    } else {
        // English name: extract first name
        full_name
            .split_whitespace()
            .next()
            .unwrap_or(full_name)
            .to_string()
    }
}

/// Apply persona settings based on onboarding answers
fn apply_persona_from_onboarding(
    conn: &rusqlite::Connection,
    answers: &OnboardingAnswers,
) -> Result<(), String> {
    log::info!("Applying persona settings from onboarding...");

    let now = chrono::Utc::now().timestamp_millis();

    // Base values (default persona settings)
    let mut formality: i32 = 50;
    let mut humor: i32 = 40;
    let verbosity: i32 = 50;
    let mut emoji_usage: i32 = 30;
    let mut enthusiasm: i32 = 60;
    let mut empathy: i32 = 70;
    let mut directness: i32 = 60;
    let mut technicality: i32 = 50;
    let mut patience: i32 = 80;
    let mut encouragement: i32 = 70;

    // Adjust based on selected persona
    match answers.selected_persona.as_str() {
        "friend" => {
            // Friendly, casual persona
            formality = 20;
            humor = 70;
            emoji_usage = 60;
            enthusiasm = 80;
            empathy = 90;
        }
        "assistant" => {
            // Balanced assistant persona
            formality = 50;
            humor = 40;
            emoji_usage = 30;
            enthusiasm = 60;
            empathy = 70;
        }
        "expert" => {
            // Professional, technical persona
            formality = 80;
            humor = 20;
            emoji_usage = 10;
            enthusiasm = 40;
            technicality = 80;
            directness = 80;
        }
        _ => {}
    }

    // Adjust based on tone preference
    match answers.tone_preference.as_str() {
        "casual" => {
            formality = formality.saturating_sub(20);
            humor = humor.saturating_add(20);
            emoji_usage = emoji_usage.saturating_add(20);
        }
        "friendly-formal" => {
            // Keep balanced
        }
        "professional" => {
            formality = formality.saturating_add(20).min(100);
            humor = humor.saturating_sub(15);
            emoji_usage = emoji_usage.saturating_sub(10);
        }
        _ => {}
    }

    // Adjust based on occupation
    match answers.occupation.as_str() {
        "student" => {
            technicality = 40;
            patience = 90;
            encouragement = 90;
        }
        "employee" | "freelancer" | "entrepreneur" => {
            technicality = 60;
            directness = 70;
        }
        _ => {}
    }

    let proactivity: i32 = match answers.proactive_frequency.as_str() {
        "15min" => 80,
        "45min" => 50,
        "2hr" => 30,
        "never" => 10,
        _ => 40,
    };

    // Update persona_settings (there should be one row already)
    conn.execute(
        "UPDATE persona_settings SET
            formality = ?1,
            humor = ?2,
            verbosity = ?3,
            emoji_usage = ?4,
            enthusiasm = ?5,
            empathy = ?6,
            directness = ?7,
            technicality = ?8,
            proactivity = ?9,
            patience = ?10,
            encouragement = ?11,
            updated_at = ?12
         WHERE id = 1",
        rusqlite::params![
            formality,
            humor,
            verbosity,
            emoji_usage,
            enthusiasm,
            empathy,
            directness,
            technicality,
            proactivity,
            patience,
            encouragement,
            now,
        ],
    )
    .map_err(|e| format!("Failed to update persona settings: {}", e))?;

    log::info!("Persona settings applied successfully");
    Ok(())
}

// ==================== NEW ONBOARDING COMMANDS ====================

/// Detect system specifications
#[tauri::command]
pub async fn detect_system_specs() -> Result<SystemSpecs, String> {
    log::info!("Detecting system specifications...");

    let mut service = SystemInfoService::new();
    let specs = service.detect_specs().map_err(|e| e.to_string())?;

    Ok(specs)
}

/// Get model recommendation based on system specs
#[tauri::command]
pub async fn get_model_recommendation(specs: SystemSpecs) -> Result<ModelRecommendation, String> {
    log::info!("Getting model recommendation for system specs");

    let recommendation = ModelRecommenderService::recommend(&specs)
        .map_err(|e| e.to_string())?;

    Ok(recommendation)
}

/// Get required models list
#[tauri::command]
pub async fn get_required_models(llm_model: String) -> Result<RequiredModels, String> {
    log::info!("Getting required models for LLM: {}", llm_model);

    let models = ModelRecommenderService::get_required_models(&llm_model)
        .map_err(|e| e.to_string())?;

    Ok(models)
}

/// Check if Ollama is installed
#[tauri::command]
pub async fn check_ollama_installed(state: State<'_, AppState>) -> Result<bool, String> {
    log::info!("Checking Ollama installation...");

    let is_installed = state.model_installer.check_ollama_installed().await
        .map_err(|e| e.to_string())?;

    Ok(is_installed)
}

/// Install Ollama (auto-install via Homebrew on macOS or installer on Windows)
#[tauri::command]
pub async fn install_ollama(state: State<'_, AppState>) -> Result<(), String> {
    log::info!("Installing Ollama...");

    state.model_installer.install_ollama().await
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Check if a specific model exists
#[tauri::command]
pub async fn check_model_exists(
    state: State<'_, AppState>,
    model_name: String,
) -> Result<bool, String> {
    log::info!("Checking if model exists: {}", model_name);

    let exists = state.model_installer.check_model_exists(&model_name).await
        .map_err(|e| e.to_string())?;

    Ok(exists)
}

/// Start downloading a model
#[tauri::command]
pub async fn start_model_download(
    state: State<'_, AppState>,
    model_name: String,
    model_type: String,
) -> Result<(), String> {
    log::info!("Starting model download: {} ({})", model_name, model_type);

    let model_type_enum = match model_type.as_str() {
        "llm" => crate::services::model_installer::ModelType::LLM,
        "llava" => crate::services::model_installer::ModelType::LLaVA,
        _ => return Err(format!("Invalid model type: {}", model_type)),
    };

    state.model_installer.start_model_download(model_name, model_type_enum).await
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Get download progress
#[tauri::command]
pub async fn get_download_progress(
    state: State<'_, AppState>,
) -> Result<ModelDownloadState, String> {
    let download_state = state.model_installer.get_download_state();

    Ok(download_state)
}

/// Generate custom prompt from survey results
#[tauri::command]
pub async fn generate_custom_prompt(survey: SurveyResults) -> Result<String, String> {
    log::info!("Generating custom prompt from survey results");

    let prompt = PromptCustomizerService::generate_custom_prompt(&survey)
        .map_err(|e| e.to_string())?;

    Ok(prompt)
}

/// Generate model config from survey results
#[tauri::command]
pub async fn generate_model_config(
    survey: SurveyResults,
    model_name: String,
) -> Result<ModelConfig, String> {
    log::info!("Generating model config for: {}", model_name);

    let config = PromptCustomizerService::generate_model_config(&survey, &model_name)
        .map_err(|e| e.to_string())?;

    Ok(config)
}

/// Save onboarding state to database
#[tauri::command]
pub async fn save_onboarding_state(
    state: State<'_, AppState>,
    system_specs_json: String,
    recommended_model: String,
    selected_model: String,
) -> Result<(), String> {
    log::info!("Saving onboarding state to database");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let now = chrono::Utc::now().timestamp_millis();

    conn.execute(
        "INSERT OR REPLACE INTO onboarding_state (
            id, completed, system_specs_json, recommended_model, selected_model, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![
            1, // Only one onboarding state
            false,
            &system_specs_json,
            &recommended_model,
            &selected_model,
            now,
        ],
    )
    .map_err(|e| format!("Failed to save onboarding state: {}", e))?;

    log::info!("Onboarding state saved successfully");
    Ok(())
}

/// Save survey results and custom prompt
#[tauri::command]
pub async fn save_survey_results(
    state: State<'_, AppState>,
    survey_json: String,
    custom_prompt: String,
) -> Result<(), String> {
    log::info!("Saving survey results and custom prompt");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    conn.execute(
        "UPDATE onboarding_state SET
            survey_results_json = ?1,
            custom_prompt = ?2
         WHERE id = 1",
        rusqlite::params![&survey_json, &custom_prompt],
    )
    .map_err(|e| format!("Failed to save survey results: {}", e))?;

    log::info!("Survey results saved successfully");
    Ok(())
}

/// Mark onboarding as completed
#[tauri::command]
pub async fn mark_onboarding_completed(state: State<'_, AppState>) -> Result<(), String> {
    log::info!("Marking onboarding as completed");

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let now = chrono::Utc::now().timestamp_millis();

    conn.execute(
        "UPDATE onboarding_state SET
            completed = 1,
            completed_at = ?1
         WHERE id = 1",
        rusqlite::params![now],
    )
    .map_err(|e| format!("Failed to mark onboarding as completed: {}", e))?;

    log::info!("Onboarding marked as completed");
    Ok(())
}

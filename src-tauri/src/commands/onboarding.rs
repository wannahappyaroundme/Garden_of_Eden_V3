use crate::AppState;
use crate::database::models::UserProfile;
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
    let mut verbosity: i32 = 50;
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

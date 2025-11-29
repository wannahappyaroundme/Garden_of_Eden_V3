use crate::services::calendar::{
    Calendar, CalendarEvent, CalendarService, CalendarToken,
};
use crate::services::webhook_triggers::WebhookTriggerEvent;
use crate::AppState;
use chrono::{DateTime, Utc};
use log::{error, info};
use oauth2::{CsrfToken, PkceCodeVerifier};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

/// OAuth state storage
pub struct OAuthState {
    pub csrf_token: Option<CsrfToken>,
    pub pkce_verifier: Option<PkceCodeVerifier>,
}

/// Calendar service wrapper in AppState
pub struct CalendarServiceWrapper {
    pub service: Arc<Mutex<Option<CalendarService>>>,
    pub oauth_state: Arc<Mutex<OAuthState>>,
}

impl CalendarServiceWrapper {
    pub fn new() -> Self {
        Self {
            service: Arc::new(Mutex::new(None)),
            oauth_state: Arc::new(Mutex::new(OAuthState {
                csrf_token: None,
                pkce_verifier: None,
            })),
        }
    }
}

/// Initialize calendar service with OAuth credentials
#[tauri::command]
pub async fn calendar_initialize(
    state: State<'_, AppState>,
    client_id: String,
    client_secret: String,
) -> Result<(), String> {
    info!("Initializing calendar service");

    let service = CalendarService::new(client_id, client_secret)
        .map_err(|e| format!("Failed to initialize calendar service: {}", e))?;

    *state.calendar_service.service.lock().unwrap() = Some(service);

    info!("Calendar service initialized successfully");
    Ok(())
}

/// Start OAuth flow
#[tauri::command]
pub async fn calendar_start_oauth(state: State<'_, AppState>) -> Result<String, String> {
    info!("Starting calendar OAuth flow");

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let (auth_url, csrf_token, pkce_verifier) = service
        .start_oauth_flow()
        .map_err(|e| format!("Failed to start OAuth flow: {}", e))?;

    // Store OAuth state
    let mut oauth_state = state.calendar_service.oauth_state.lock().unwrap();
    oauth_state.csrf_token = Some(csrf_token);
    oauth_state.pkce_verifier = Some(pkce_verifier);

    info!("OAuth flow started, opening browser");
    Ok(auth_url)
}

/// Complete OAuth flow with authorization code
#[tauri::command]
pub async fn calendar_complete_oauth(
    state: State<'_, AppState>,
    code: String,
    received_state: String,
) -> Result<CalendarToken, String> {
    info!("Completing calendar OAuth flow");

    // Verify CSRF token
    let pkce_verifier = {
        let mut oauth_state = state.calendar_service.oauth_state.lock().unwrap();
        let csrf_token = oauth_state
            .csrf_token
            .take()
            .ok_or("No OAuth flow in progress")?;

        if csrf_token.secret() != &received_state {
            error!("CSRF token mismatch");
            return Err("CSRF token mismatch, possible security issue".to_string());
        }

        oauth_state
            .pkce_verifier
            .take()
            .ok_or("No PKCE verifier found")?
    };

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let token = service
        .complete_oauth_flow(code, pkce_verifier.secret().to_string())
        .await
        .map_err(|e| format!("OAuth completion failed: {}", e))?;

    // Save token to database
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.conn();

        let token_json = serde_json::to_string(&token).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO oauth_tokens (service, token_json, expires_at, created_at)
             VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![
                "google_calendar",
                token_json,
                token.expires_at,
                chrono::Utc::now().timestamp()
            ],
        )
        .map_err(|e| format!("Failed to save token: {}", e))?;
    }

    info!("Calendar OAuth completed and token saved");
    Ok(token)
}

/// Check if calendar is authenticated
#[tauri::command]
pub async fn calendar_is_authenticated(state: State<'_, AppState>) -> Result<bool, String> {
    let service_guard = state.calendar_service.service.lock().unwrap();
    match service_guard.as_ref() {
        Some(service) => Ok(service.is_authenticated()),
        None => Ok(false),
    }
}

/// Sign out from calendar
#[tauri::command]
pub async fn calendar_sign_out(state: State<'_, AppState>) -> Result<(), String> {
    info!("Signing out from calendar");

    {
        let service_guard = state.calendar_service.service.lock().unwrap();
        if let Some(service) = service_guard.as_ref() {
            service.sign_out();
        }
    }

    // Remove token from database
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.conn();

        conn.execute("DELETE FROM oauth_tokens WHERE service = ?1", ["google_calendar"])
            .map_err(|e| format!("Failed to delete token: {}", e))?;
    }

    info!("Calendar signed out successfully");
    Ok(())
}

/// List all calendars
#[tauri::command]
pub async fn calendar_list(state: State<'_, AppState>) -> Result<Vec<Calendar>, String> {
    info!("Listing calendars");

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let calendars = service
        .list_calendars()
        .await
        .map_err(|e| format!("Failed to list calendars: {}", e))?;

    info!("Retrieved {} calendars", calendars.len());
    Ok(calendars)
}

/// Get primary calendar ID
#[tauri::command]
pub async fn calendar_get_primary_id(state: State<'_, AppState>) -> Result<String, String> {
    info!("Getting primary calendar ID");

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let calendar_id = service
        .get_primary_calendar_id()
        .await
        .map_err(|e| format!("Failed to get primary calendar: {}", e))?;

    info!("Primary calendar ID: {}", calendar_id);
    Ok(calendar_id)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListEventsParams {
    pub calendar_id: String,
    pub time_min: Option<String>,
    pub time_max: Option<String>,
    pub max_results: Option<i32>,
}

/// List events in a calendar
#[tauri::command]
pub async fn calendar_list_events(
    state: State<'_, AppState>,
    params: ListEventsParams,
) -> Result<Vec<CalendarEvent>, String> {
    info!("Listing events for calendar: {}", params.calendar_id);

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let time_min = params
        .time_min
        .as_ref()
        .and_then(|s| s.parse::<DateTime<Utc>>().ok());

    let time_max = params
        .time_max
        .as_ref()
        .and_then(|s| s.parse::<DateTime<Utc>>().ok());

    let events = service
        .list_events(
            &params.calendar_id,
            time_min,
            time_max,
            params.max_results,
        )
        .await
        .map_err(|e| format!("Failed to list events: {}", e))?;

    info!("Retrieved {} events", events.len());
    Ok(events)
}

/// Get upcoming events (next N days)
#[tauri::command]
pub async fn calendar_get_upcoming(
    state: State<'_, AppState>,
    calendar_id: String,
    days: i64,
) -> Result<Vec<CalendarEvent>, String> {
    info!("Getting upcoming events for {} days", days);

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let events = service
        .get_upcoming_events(&calendar_id, days)
        .await
        .map_err(|e| format!("Failed to get upcoming events: {}", e))?;

    info!("Retrieved {} upcoming events", events.len());
    Ok(events)
}

/// Create a new event
#[tauri::command]
pub async fn calendar_create_event(
    state: State<'_, AppState>,
    calendar_id: String,
    event: CalendarEvent,
) -> Result<CalendarEvent, String> {
    info!("Creating event: {}", event.summary);

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let created_event = service
        .create_event(&calendar_id, event.clone())
        .await
        .map_err(|e| format!("Failed to create event: {}", e))?;

    // Trigger webhook for event creation
    {
        let trigger_manager = state.webhook_trigger_manager.clone();
        let event_summary = event.summary.clone();
        tokio::spawn(async move {
            trigger_manager
                .trigger_event(WebhookTriggerEvent::MessageReceived {
                    conversation_id: "calendar".to_string(),
                    ai_response: format!("Calendar event created: {}", event_summary),
                    tokens: 0,
                })
                .await;
        });
    }

    info!("Event created successfully");
    Ok(created_event)
}

/// Update an existing event
#[tauri::command]
pub async fn calendar_update_event(
    state: State<'_, AppState>,
    calendar_id: String,
    event_id: String,
    event: CalendarEvent,
) -> Result<CalendarEvent, String> {
    info!("Updating event: {}", event_id);

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let updated_event = service
        .update_event(&calendar_id, &event_id, event)
        .await
        .map_err(|e| format!("Failed to update event: {}", e))?;

    info!("Event updated successfully");
    Ok(updated_event)
}

/// Delete an event
#[tauri::command]
pub async fn calendar_delete_event(
    state: State<'_, AppState>,
    calendar_id: String,
    event_id: String,
) -> Result<(), String> {
    info!("Deleting event: {}", event_id);

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    service
        .delete_event(&calendar_id, &event_id)
        .await
        .map_err(|e| format!("Failed to delete event: {}", e))?;

    info!("Event deleted successfully");
    Ok(())
}

/// Search events by query
#[tauri::command]
pub async fn calendar_search_events(
    state: State<'_, AppState>,
    calendar_id: String,
    query: String,
) -> Result<Vec<CalendarEvent>, String> {
    info!("Searching events with query: {}", query);

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let events = service
        .search_events(&calendar_id, &query)
        .await
        .map_err(|e| format!("Failed to search events: {}", e))?;

    info!("Found {} matching events", events.len());
    Ok(events)
}

/// Quick add event using natural language
#[tauri::command]
pub async fn calendar_quick_add(
    state: State<'_, AppState>,
    calendar_id: String,
    text: String,
) -> Result<CalendarEvent, String> {
    info!("Quick adding event: {}", text);

    let service = {
        let service_guard = state.calendar_service.service.lock().unwrap();
        service_guard
            .clone()
            .ok_or("Calendar service not initialized")?
    };

    let event = service
        .quick_add(&calendar_id, &text)
        .await
        .map_err(|e| format!("Failed to quick add event: {}", e))?;

    // Trigger webhook for event creation
    {
        let trigger_manager = state.webhook_trigger_manager.clone();
        let event_summary = event.summary.clone();
        tokio::spawn(async move {
            trigger_manager
                .trigger_event(WebhookTriggerEvent::MessageReceived {
                    conversation_id: "calendar".to_string(),
                    ai_response: format!("Calendar event quick-added: {}", event_summary),
                    tokens: 0,
                })
                .await;
        });
    }

    info!("Event quick-added successfully");
    Ok(event)
}

/// Load saved token from database
#[tauri::command]
pub async fn calendar_load_saved_token(state: State<'_, AppState>) -> Result<bool, String> {
    info!("Loading saved calendar token");

    let token_json = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn = db.conn();

        let result: Result<String, rusqlite::Error> = conn.query_row(
            "SELECT token_json FROM oauth_tokens WHERE service = ?1 AND expires_at > ?2",
            rusqlite::params!["google_calendar", chrono::Utc::now().timestamp()],
            |row| row.get(0),
        );

        match result {
            Ok(json) => json,
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                info!("No valid saved token found");
                return Ok(false);
            }
            Err(e) => return Err(format!("Failed to load token: {}", e)),
        }
    };

    let token: CalendarToken =
        serde_json::from_str(&token_json).map_err(|e| format!("Failed to parse token: {}", e))?;

    let service_guard = state.calendar_service.service.lock().unwrap();
    if let Some(service) = service_guard.as_ref() {
        service.set_token(token);
        info!("Saved token loaded and set");
        Ok(true)
    } else {
        Err("Calendar service not initialized".to_string())
    }
}

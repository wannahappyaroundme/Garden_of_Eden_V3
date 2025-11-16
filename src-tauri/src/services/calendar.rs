/**
 * Google Calendar Integration Service
 * Provides OAuth 2.0 authentication and full calendar management
 */

use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use log::{error, info, warn};
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, Scope,
    TokenResponse, TokenUrl,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Google Calendar OAuth configuration
const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API: &str = "https://www.googleapis.com/calendar/v3";
const REDIRECT_URI: &str = "http://localhost:8765/callback";

/// OAuth token storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalendarToken {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: i64,
    pub token_type: String,
}

/// Calendar event representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalendarEvent {
    pub id: Option<String>,
    pub summary: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub start: EventDateTime,
    pub end: EventDateTime,
    pub attendees: Vec<Attendee>,
    pub reminders: Option<EventReminders>,
    pub color_id: Option<String>,
    pub recurrence: Option<Vec<String>>,
    pub status: Option<String>,
    pub visibility: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventDateTime {
    #[serde(rename = "dateTime")]
    pub date_time: Option<String>,
    pub date: Option<String>,
    #[serde(rename = "timeZone")]
    pub time_zone: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attendee {
    pub email: String,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    pub optional: Option<bool>,
    #[serde(rename = "responseStatus")]
    pub response_status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventReminders {
    #[serde(rename = "useDefault")]
    pub use_default: bool,
    pub overrides: Option<Vec<ReminderOverride>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReminderOverride {
    pub method: String, // "email" or "popup"
    pub minutes: i32,
}

/// Calendar list item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Calendar {
    pub id: String,
    pub summary: String,
    pub description: Option<String>,
    #[serde(rename = "timeZone")]
    pub time_zone: String,
    #[serde(rename = "colorId")]
    pub color_id: Option<String>,
    #[serde(rename = "backgroundColor")]
    pub background_color: Option<String>,
    #[serde(rename = "foregroundColor")]
    pub foreground_color: Option<String>,
    pub primary: Option<bool>,
}

/// Events list response
#[derive(Debug, Deserialize)]
struct EventsListResponse {
    items: Option<Vec<GoogleCalendarEvent>>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
}

/// Google Calendar API event format
#[derive(Debug, Serialize, Deserialize)]
struct GoogleCalendarEvent {
    id: Option<String>,
    summary: String,
    description: Option<String>,
    location: Option<String>,
    start: EventDateTime,
    end: EventDateTime,
    attendees: Option<Vec<Attendee>>,
    reminders: Option<EventReminders>,
    #[serde(rename = "colorId")]
    color_id: Option<String>,
    recurrence: Option<Vec<String>>,
    status: Option<String>,
    visibility: Option<String>,
}

impl From<CalendarEvent> for GoogleCalendarEvent {
    fn from(event: CalendarEvent) -> Self {
        GoogleCalendarEvent {
            id: event.id,
            summary: event.summary,
            description: event.description,
            location: event.location,
            start: event.start,
            end: event.end,
            attendees: if event.attendees.is_empty() {
                None
            } else {
                Some(event.attendees)
            },
            reminders: event.reminders,
            color_id: event.color_id,
            recurrence: event.recurrence,
            status: event.status,
            visibility: event.visibility,
        }
    }
}

impl From<GoogleCalendarEvent> for CalendarEvent {
    fn from(event: GoogleCalendarEvent) -> Self {
        CalendarEvent {
            id: event.id,
            summary: event.summary,
            description: event.description,
            location: event.location,
            start: event.start,
            end: event.end,
            attendees: event.attendees.unwrap_or_default(),
            reminders: event.reminders,
            color_id: event.color_id,
            recurrence: event.recurrence,
            status: event.status,
            visibility: event.visibility,
        }
    }
}

/// Google Calendar service
#[derive(Clone)]
pub struct CalendarService {
    client: Client,
    token: Arc<Mutex<Option<CalendarToken>>>,
    oauth_client: BasicClient,
}

impl CalendarService {
    /// Create a new calendar service with OAuth credentials
    pub fn new(client_id: String, client_secret: String) -> Result<Self> {
        let oauth_client = BasicClient::new(
            ClientId::new(client_id),
            Some(ClientSecret::new(client_secret)),
            AuthUrl::new(GOOGLE_AUTH_URL.to_string())?,
            Some(TokenUrl::new(GOOGLE_TOKEN_URL.to_string())?),
        )
        .set_redirect_uri(RedirectUrl::new(REDIRECT_URI.to_string())?);

        Ok(Self {
            client: Client::new(),
            token: Arc::new(Mutex::new(None)),
            oauth_client,
        })
    }

    /// Start OAuth flow and return authorization URL
    pub fn start_oauth_flow(&self) -> Result<(String, CsrfToken, PkceCodeVerifier)> {
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

        let (auth_url, csrf_token) = self
            .oauth_client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new(
                "https://www.googleapis.com/auth/calendar".to_string(),
            ))
            .add_scope(Scope::new(
                "https://www.googleapis.com/auth/calendar.events".to_string(),
            ))
            .set_pkce_challenge(pkce_challenge)
            .url();

        info!("OAuth authorization URL generated");
        Ok((auth_url.to_string(), csrf_token, pkce_verifier))
    }

    /// Complete OAuth flow with authorization code
    pub async fn complete_oauth_flow(
        &self,
        code: String,
        pkce_verifier: String,
    ) -> Result<CalendarToken> {
        info!("Exchanging authorization code for tokens");

        let token_result = self
            .oauth_client
            .exchange_code(AuthorizationCode::new(code))
            .set_pkce_verifier(oauth2::PkceCodeVerifier::new(pkce_verifier))
            .request_async(async_http_client)
            .await
            .map_err(|e| anyhow!("Token exchange failed: {}", e))?;

        let expires_at = Utc::now().timestamp()
            + token_result
                .expires_in()
                .map(|d| d.as_secs() as i64)
                .unwrap_or(3600);

        let token = CalendarToken {
            access_token: token_result.access_token().secret().to_string(),
            refresh_token: token_result
                .refresh_token()
                .map(|t| t.secret().to_string()),
            expires_at,
            token_type: "Bearer".to_string(),
        };

        // Store token
        *self.token.lock().unwrap() = Some(token.clone());
        info!("OAuth tokens obtained and stored");

        Ok(token)
    }

    /// Set access token manually
    pub fn set_token(&self, token: CalendarToken) {
        *self.token.lock().unwrap() = Some(token);
        info!("Calendar access token set manually");
    }

    /// Get current access token
    fn get_access_token(&self) -> Result<String> {
        let token_guard = self.token.lock().unwrap();
        match &*token_guard {
            Some(token) => {
                // Check if token is expired
                if token.expires_at <= Utc::now().timestamp() {
                    warn!("Access token expired");
                    return Err(anyhow!("Access token expired, please re-authenticate"));
                }
                Ok(token.access_token.clone())
            }
            None => Err(anyhow!("Not authenticated, please sign in first")),
        }
    }

    /// List all calendars
    pub async fn list_calendars(&self) -> Result<Vec<Calendar>> {
        let access_token = self.get_access_token()?;
        let url = format!("{}/users/me/calendarList", GOOGLE_CALENDAR_API);

        info!("Fetching calendar list");
        let response = self
            .client
            .get(&url)
            .bearer_auth(&access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Calendar list fetch failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to fetch calendars: {}", status));
        }

        let data: serde_json::Value = response.json().await?;
        let calendars: Vec<Calendar> = serde_json::from_value(
            data.get("items")
                .cloned()
                .unwrap_or(serde_json::json!([])),
        )?;

        info!("Found {} calendars", calendars.len());
        Ok(calendars)
    }

    /// Get primary calendar ID
    pub async fn get_primary_calendar_id(&self) -> Result<String> {
        let calendars = self.list_calendars().await?;
        calendars
            .into_iter()
            .find(|c| c.primary.unwrap_or(false))
            .map(|c| c.id)
            .ok_or_else(|| anyhow!("No primary calendar found"))
    }

    /// List events in a calendar
    pub async fn list_events(
        &self,
        calendar_id: &str,
        time_min: Option<DateTime<Utc>>,
        time_max: Option<DateTime<Utc>>,
        max_results: Option<i32>,
    ) -> Result<Vec<CalendarEvent>> {
        let access_token = self.get_access_token()?;
        let url = format!("{}/calendars/{}/events", GOOGLE_CALENDAR_API, calendar_id);

        let mut params = vec![
            ("singleEvents", "true".to_string()),
            ("orderBy", "startTime".to_string()),
        ];

        if let Some(min) = time_min {
            params.push(("timeMin", min.to_rfc3339()));
        }

        if let Some(max) = time_max {
            params.push(("timeMax", max.to_rfc3339()));
        }

        if let Some(max) = max_results {
            params.push(("maxResults", max.to_string()));
        }

        info!(
            "Fetching events from calendar: {} (params: {:?})",
            calendar_id, params
        );

        let response = self
            .client
            .get(&url)
            .bearer_auth(&access_token)
            .query(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Events fetch failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to fetch events: {}", status));
        }

        let data: EventsListResponse = response.json().await?;
        let events: Vec<CalendarEvent> = data
            .items
            .unwrap_or_default()
            .into_iter()
            .map(CalendarEvent::from)
            .collect();

        info!("Fetched {} events", events.len());
        Ok(events)
    }

    /// Create a new event
    pub async fn create_event(
        &self,
        calendar_id: &str,
        event: CalendarEvent,
    ) -> Result<CalendarEvent> {
        let access_token = self.get_access_token()?;
        let url = format!("{}/calendars/{}/events", GOOGLE_CALENDAR_API, calendar_id);

        let google_event: GoogleCalendarEvent = event.into();

        info!("Creating event: {}", google_event.summary);
        let response = self
            .client
            .post(&url)
            .bearer_auth(&access_token)
            .json(&google_event)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Event creation failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to create event: {}", status));
        }

        let created_event: GoogleCalendarEvent = response.json().await?;
        info!("Event created with ID: {:?}", created_event.id);
        Ok(CalendarEvent::from(created_event))
    }

    /// Update an existing event
    pub async fn update_event(
        &self,
        calendar_id: &str,
        event_id: &str,
        event: CalendarEvent,
    ) -> Result<CalendarEvent> {
        let access_token = self.get_access_token()?;
        let url = format!(
            "{}/calendars/{}/events/{}",
            GOOGLE_CALENDAR_API, calendar_id, event_id
        );

        let google_event: GoogleCalendarEvent = event.into();

        info!("Updating event: {}", event_id);
        let response = self
            .client
            .put(&url)
            .bearer_auth(&access_token)
            .json(&google_event)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Event update failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to update event: {}", status));
        }

        let updated_event: GoogleCalendarEvent = response.json().await?;
        info!("Event updated successfully");
        Ok(CalendarEvent::from(updated_event))
    }

    /// Delete an event
    pub async fn delete_event(&self, calendar_id: &str, event_id: &str) -> Result<()> {
        let access_token = self.get_access_token()?;
        let url = format!(
            "{}/calendars/{}/events/{}",
            GOOGLE_CALENDAR_API, calendar_id, event_id
        );

        info!("Deleting event: {}", event_id);
        let response = self
            .client
            .delete(&url)
            .bearer_auth(&access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Event deletion failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to delete event: {}", status));
        }

        info!("Event deleted successfully");
        Ok(())
    }

    /// Get upcoming events (next 7 days)
    pub async fn get_upcoming_events(
        &self,
        calendar_id: &str,
        days: i64,
    ) -> Result<Vec<CalendarEvent>> {
        let time_min = Utc::now();
        let time_max = time_min + chrono::Duration::days(days);

        self.list_events(calendar_id, Some(time_min), Some(time_max), Some(50))
            .await
    }

    /// Search events by query
    pub async fn search_events(
        &self,
        calendar_id: &str,
        query: &str,
    ) -> Result<Vec<CalendarEvent>> {
        let access_token = self.get_access_token()?;
        let url = format!("{}/calendars/{}/events", GOOGLE_CALENDAR_API, calendar_id);

        let params = vec![
            ("q", query),
            ("singleEvents", "true"),
            ("orderBy", "startTime"),
        ];

        info!("Searching events with query: {}", query);
        let response = self
            .client
            .get(&url)
            .bearer_auth(&access_token)
            .query(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Event search failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to search events: {}", status));
        }

        let data: EventsListResponse = response.json().await?;
        let events: Vec<CalendarEvent> = data
            .items
            .unwrap_or_default()
            .into_iter()
            .map(CalendarEvent::from)
            .collect();

        info!("Found {} matching events", events.len());
        Ok(events)
    }

    /// Quick add event using natural language
    pub async fn quick_add(&self, calendar_id: &str, text: &str) -> Result<CalendarEvent> {
        let access_token = self.get_access_token()?;
        let url = format!(
            "{}/calendars/{}/events/quickAdd",
            GOOGLE_CALENDAR_API, calendar_id
        );

        let params = vec![("text", text)];

        info!("Quick adding event: {}", text);
        let response = self
            .client
            .post(&url)
            .bearer_auth(&access_token)
            .query(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await?;
            error!("Quick add failed: {} - {}", status, error_text);
            return Err(anyhow!("Failed to quick add event: {}", status));
        }

        let created_event: GoogleCalendarEvent = response.json().await?;
        info!("Event quick-added with ID: {:?}", created_event.id);
        Ok(CalendarEvent::from(created_event))
    }

    /// Check if authenticated
    pub fn is_authenticated(&self) -> bool {
        self.token.lock().unwrap().is_some()
    }

    /// Clear authentication
    pub fn sign_out(&self) {
        *self.token.lock().unwrap() = None;
        info!("Calendar authentication cleared");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_datetime_serialization() {
        let dt = EventDateTime {
            date_time: Some("2025-01-20T10:00:00Z".to_string()),
            date: None,
            time_zone: Some("America/New_York".to_string()),
        };

        let json = serde_json::to_string(&dt).unwrap();
        assert!(json.contains("dateTime"));
        assert!(json.contains("timeZone"));
    }

    #[test]
    fn test_calendar_event_conversion() {
        let event = CalendarEvent {
            id: Some("event123".to_string()),
            summary: "Test Event".to_string(),
            description: Some("Test description".to_string()),
            location: None,
            start: EventDateTime {
                date_time: Some("2025-01-20T10:00:00Z".to_string()),
                date: None,
                time_zone: Some("UTC".to_string()),
            },
            end: EventDateTime {
                date_time: Some("2025-01-20T11:00:00Z".to_string()),
                date: None,
                time_zone: Some("UTC".to_string()),
            },
            attendees: vec![],
            reminders: None,
            color_id: None,
            recurrence: None,
            status: Some("confirmed".to_string()),
            visibility: Some("default".to_string()),
        };

        let google_event: GoogleCalendarEvent = event.clone().into();
        let converted_back: CalendarEvent = google_event.into();

        assert_eq!(converted_back.id, event.id);
        assert_eq!(converted_back.summary, event.summary);
    }
}

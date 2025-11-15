use crate::AppState;
use crate::services::screen::{ScreenTrackingState, ScreenCapture};
use tauri::State;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ScreenStatus {
    pub is_tracking: bool,
    pub last_capture_time: u64,
    pub capture_count: u64,
    pub capture_interval: u64,
}

impl From<ScreenTrackingState> for ScreenStatus {
    fn from(state: ScreenTrackingState) -> Self {
        Self {
            is_tracking: state.is_tracking,
            last_capture_time: state.last_capture_time,
            capture_count: state.capture_count,
            capture_interval: state.capture_interval,
        }
    }
}

/// Start screen tracking
#[tauri::command]
pub async fn screen_start_tracking(
    state: State<'_, AppState>,
    interval: Option<u64>,
) -> Result<ScreenStatus, String> {
    log::info!("Starting screen tracking with interval: {:?}", interval);

    let interval_seconds = interval.unwrap_or(10);
    state
        .screen_service
        .start_tracking(interval_seconds)
        .await?;

    let status = state.screen_service.get_status()?;
    Ok(status.into())
}

/// Stop screen tracking
#[tauri::command]
pub async fn screen_stop_tracking(state: State<'_, AppState>) -> Result<ScreenStatus, String> {
    log::info!("Stopping screen tracking");

    state.screen_service.stop_tracking()?;

    let status = state.screen_service.get_status()?;
    Ok(status.into())
}

/// Toggle screen tracking (start if stopped, stop if started)
#[tauri::command]
pub async fn screen_toggle_tracking(
    state: State<'_, AppState>,
    interval: Option<u64>,
) -> Result<ScreenStatus, String> {
    log::info!("Toggling screen tracking");

    state.screen_service.toggle_tracking(interval).await?;

    let status = state.screen_service.get_status()?;
    Ok(status.into())
}

/// Get current screen tracking status
#[tauri::command]
pub async fn screen_get_status(state: State<'_, AppState>) -> Result<ScreenStatus, String> {
    let status = state.screen_service.get_status()?;
    Ok(status.into())
}

/// Get recent screen captures
#[tauri::command]
pub async fn screen_get_recent(
    state: State<'_, AppState>,
    limit: Option<usize>,
) -> Result<Vec<ScreenCapture>, String> {
    let limit = limit.unwrap_or(10);
    state.screen_service.get_recent_captures(limit)
}

/// Clear all screen captures (for privacy)
#[tauri::command]
pub async fn screen_clear_all(state: State<'_, AppState>) -> Result<usize, String> {
    log::info!("Clearing all screen captures");
    state.screen_service.clear_all_captures()
}

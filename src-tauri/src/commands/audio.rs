use crate::AppState;
use tauri::State;
use serde::{Deserialize, Serialize};

// ============================================================================
// Whisper STT Commands
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordingStatus {
    pub is_recording: bool,
    pub audio_path: Option<String>,
}

#[tauri::command]
pub async fn whisper_start_recording(
    state: State<'_, AppState>,
) -> Result<String, String> {
    state.whisper_service.start_recording().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn whisper_stop_recording(
    state: State<'_, AppState>,
) -> Result<String, String> {
    state.whisper_service.stop_recording().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn whisper_transcribe(
    state: State<'_, AppState>,
    audio_path: String,
    language: Option<String>,
) -> Result<String, String> {
    state.whisper_service.transcribe_audio(audio_path, language).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn whisper_is_recording(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    Ok(state.whisper_service.is_recording())
}

#[tauri::command]
pub async fn whisper_cleanup_old_files(
    state: State<'_, AppState>,
) -> Result<usize, String> {
    state.whisper_service.cleanup_old_audio_files().await.map_err(|e| e.to_string())
}

// ============================================================================
// TTS Commands
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct TtsStatus {
    pub is_speaking: bool,
    pub language: String,
}

#[tauri::command]
pub async fn tts_speak(
    state: State<'_, AppState>,
    text: String,
    language: Option<String>,
) -> Result<(), String> {
    state.tts_service.speak(text, language).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tts_stop(
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.tts_service.stop().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tts_is_speaking(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    Ok(state.tts_service.is_speaking())
}

#[tauri::command]
pub async fn tts_get_voices(
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    state.tts_service.get_voices().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tts_set_rate(
    state: State<'_, AppState>,
    rate: f32,
) -> Result<(), String> {
    state.tts_service.set_rate(rate).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tts_set_volume(
    state: State<'_, AppState>,
    volume: f32,
) -> Result<(), String> {
    state.tts_service.set_volume(volume).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tts_get_status(
    state: State<'_, AppState>,
) -> Result<TtsStatus, String> {
    Ok(TtsStatus {
        is_speaking: state.tts_service.is_speaking(),
        language: state.tts_service.get_language(),
    })
}

#[tauri::command]
pub async fn tts_test(
    state: State<'_, AppState>,
    language: String,
) -> Result<(), String> {
    state.tts_service.test_tts(&language).await.map_err(|e| e.to_string())
}

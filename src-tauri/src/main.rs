// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod commands;
mod services;

use database::Database;
use services::screen::ScreenCaptureService;
use services::whisper::WhisperService;
use services::tts::TtsService;
use services::llava::LlavaService;
use std::sync::{Arc, Mutex};

/// Application state shared across Tauri commands
pub struct AppState {
    db: Mutex<Database>,
    screen_service: ScreenCaptureService,
    whisper_service: WhisperService,
    tts_service: TtsService,
    llava_service: Mutex<LlavaService>,
}

fn main() {
    env_logger::init();
    log::info!("Starting Garden of Eden V3 (Tauri)...");

    // Initialize database
    let db = Database::new().expect("Failed to initialize database");
    let db_arc = Arc::new(Mutex::new(db));

    // Get data directory for audio files
    let data_dir = dirs::data_dir()
        .expect("Failed to get data directory")
        .join("garden-of-eden-v3");

    // Initialize screen capture service
    let screen_service = ScreenCaptureService::new(Arc::clone(&db_arc));

    // Initialize Whisper service
    let whisper_service = WhisperService::new(data_dir.clone())
        .expect("Failed to initialize Whisper service");

    // Initialize TTS service
    let tts_service = TtsService::new()
        .expect("Failed to initialize TTS service");

    // Initialize LLaVA service (placeholder)
    let llava_service = LlavaService::new()
        .expect("Failed to initialize LLaVA service");

    let app_state = AppState {
        db: Mutex::new(
            Database::new().expect("Failed to initialize database for app state")
        ),
        screen_service,
        whisper_service,
        tts_service,
        llava_service: Mutex::new(llava_service),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::ai::chat,
            commands::ai::chat_stream,
            commands::ai::voice_input_start,
            commands::ai::voice_input_stop,
            commands::audio::whisper_start_recording,
            commands::audio::whisper_stop_recording,
            commands::audio::whisper_transcribe,
            commands::audio::whisper_is_recording,
            commands::audio::whisper_cleanup_old_files,
            commands::audio::tts_speak,
            commands::audio::tts_stop,
            commands::audio::tts_is_speaking,
            commands::audio::tts_get_voices,
            commands::audio::tts_set_rate,
            commands::audio::tts_set_volume,
            commands::audio::tts_get_status,
            commands::audio::tts_test,
            commands::conversation::get_conversations,
            commands::conversation::get_conversation_messages,
            commands::conversation::delete_conversation,
            commands::conversation::update_conversation_title,
            commands::onboarding::check_onboarding_status,
            commands::onboarding::complete_onboarding,
            commands::screen::screen_start_tracking,
            commands::screen::screen_stop_tracking,
            commands::screen::screen_toggle_tracking,
            commands::screen::screen_get_status,
            commands::screen::screen_get_recent,
            commands::screen::screen_clear_all,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::system::get_system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod commands;
mod services;

use database::Database;
use std::sync::Mutex;

/// Application state shared across Tauri commands
pub struct AppState {
    db: Mutex<Database>,
}

fn main() {
    env_logger::init();
    log::info!("Starting Garden of Eden V3 (Tauri)...");

    // Initialize database
    let db = Database::new().expect("Failed to initialize database");
    let app_state = AppState {
        db: Mutex::new(db),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::ai::chat,
            commands::ai::chat_stream,
            commands::ai::voice_input_start,
            commands::ai::voice_input_stop,
            commands::conversation::get_conversations,
            commands::conversation::get_conversation_messages,
            commands::conversation::delete_conversation,
            commands::conversation::update_conversation_title,
            commands::system::get_system_info,
            commands::settings::get_settings,
            commands::settings::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

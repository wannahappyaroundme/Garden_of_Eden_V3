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
use services::model_installer::ModelInstallerService;
use services::learning::LearningService;
use services::webhook_triggers::WebhookTriggerManager;
use services::crash_reporter::CrashReporterService;
use services::tool_calling::ToolService;
use services::tool_implementations::{
    WebSearchTool, UrlFetchTool, FileReadTool, FileWriteTool,
    SystemInfoTool, CalculatorTool,
};
use services::tool_history::ToolHistoryService;
use services::tool_settings::ToolSettingsService;
use commands::calendar::CalendarServiceWrapper;
use commands::crash_reporter::CrashReporterState;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as TokioMutex;

/// Application state shared across Tauri commands
pub struct AppState {
    db: Mutex<Database>,
    screen_service: ScreenCaptureService,
    whisper_service: WhisperService,
    tts_service: TtsService,
    llava_service: Mutex<LlavaService>,
    model_installer: Arc<ModelInstallerService>,
    learning_service: LearningService,
    webhook_trigger_manager: Arc<WebhookTriggerManager>,
    calendar_service: CalendarServiceWrapper,
    tool_service: Arc<ToolService>,  // v3.6.0: Tool calling system
    tool_history_service: Arc<TokioMutex<ToolHistoryService>>,  // v3.3.0: Tool execution tracking
    tool_settings_service: Arc<TokioMutex<ToolSettingsService>>,  // v3.3.0: Tool configuration
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

    // Initialize Model Installer service
    let model_installer = Arc::new(ModelInstallerService::new());

    // Initialize Learning service
    let learning_service = LearningService::new(Arc::clone(&db_arc))
        .expect("Failed to initialize Learning service");

    // Initialize Webhook Trigger Manager
    let webhook_trigger_manager = Arc::new(WebhookTriggerManager::new(Arc::clone(&db_arc)));

    // Initialize Calendar Service Wrapper
    let calendar_service = CalendarServiceWrapper::new();

    // Initialize Tool Service with all 6 production tools (v3.6.0)
    log::info!("Initializing Tool Service with 6 production tools...");
    let mut tool_service = ToolService::new();

    // Register web tools
    match WebSearchTool::new() {
        Ok(tool) => {
            tool_service.register_tool(Box::new(tool));
            log::info!("✓ Registered WebSearchTool");
        }
        Err(e) => log::warn!("Failed to initialize WebSearchTool: {}", e),
    }

    match UrlFetchTool::new() {
        Ok(tool) => {
            tool_service.register_tool(Box::new(tool));
            log::info!("✓ Registered UrlFetchTool");
        }
        Err(e) => log::warn!("Failed to initialize UrlFetchTool: {}", e),
    }

    // Register file system tools
    tool_service.register_tool(Box::new(FileReadTool));
    log::info!("✓ Registered FileReadTool");

    tool_service.register_tool(Box::new(FileWriteTool));
    log::info!("✓ Registered FileWriteTool");

    // Register system tools
    tool_service.register_tool(Box::new(SystemInfoTool));
    log::info!("✓ Registered SystemInfoTool");

    tool_service.register_tool(Box::new(CalculatorTool));
    log::info!("✓ Registered CalculatorTool");

    let tool_service = Arc::new(tool_service);
    log::info!("Tool Service initialized with {} tools", tool_service.list_tools().len());

    // Initialize Tool History Service (v3.3.0)
    log::info!("Initializing Tool History Service...");
    let tool_history_service = ToolHistoryService::new(Arc::clone(&db_arc))
        .expect("Failed to initialize Tool History Service");
    let tool_history_service = Arc::new(TokioMutex::new(tool_history_service));
    log::info!("✓ Tool History Service initialized");

    // Initialize Tool Settings Service (v3.3.0)
    log::info!("Initializing Tool Settings Service...");
    let tool_settings_service = ToolSettingsService::new(Arc::clone(&db_arc));
    let tool_settings_service = Arc::new(TokioMutex::new(tool_settings_service));
    log::info!("✓ Tool Settings Service initialized");

    // Initialize Crash Reporter Service (v3.4.0)
    log::info!("Initializing Crash Reporter Service...");
    let crash_log_dir = data_dir.join("crashes");
    let crash_reporter_service = CrashReporterService::new(crash_log_dir);
    let crash_reporter_arc = Arc::new(Mutex::new(crash_reporter_service));

    // Setup panic handler to capture crashes (v3.4.0)
    CrashReporterService::setup_panic_handler(Arc::clone(&crash_reporter_arc));
    log::info!("✓ Crash Reporter Service initialized with panic handler");

    let crash_reporter_state = CrashReporterState {
        service: crash_reporter_arc,
    };

    let app_state = AppState {
        db: Mutex::new(
            Database::new().expect("Failed to initialize database for app state")
        ),
        screen_service,
        whisper_service,
        tts_service,
        llava_service: Mutex::new(llava_service),
        model_installer,
        learning_service,
        webhook_trigger_manager,
        calendar_service,
        tool_service,  // v3.6.0: Tool calling system
        tool_history_service,  // v3.3.0: Tool execution tracking
        tool_settings_service,  // v3.3.0: Tool configuration
    };

    tauri::Builder::default()
        .manage(app_state)
        .manage(crash_reporter_state)
        .plugin(tauri_plugin_updater::Builder::new().build())  // v3.4.0: Auto-updater
        .invoke_handler(tauri::generate_handler![
            commands::ai::chat,
            commands::ai::chat_stream,
            commands::ai::chat_with_tools,  // v3.6.0: Tool-enabled chat
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
            commands::onboarding::detect_system_specs,
            commands::onboarding::get_model_recommendation,
            commands::onboarding::get_required_models,
            commands::onboarding::check_ollama_installed,
            commands::onboarding::install_ollama,
            commands::onboarding::check_model_exists,
            commands::onboarding::start_model_download,
            commands::onboarding::get_download_progress,
            commands::onboarding::generate_custom_prompt,
            commands::onboarding::generate_model_config,
            commands::onboarding::save_onboarding_state,
            commands::onboarding::save_survey_results,
            commands::onboarding::mark_onboarding_completed,
            commands::screen::screen_start_tracking,
            commands::screen::screen_stop_tracking,
            commands::screen::screen_toggle_tracking,
            commands::screen::screen_get_status,
            commands::screen::screen_get_recent,
            commands::screen::screen_clear_all,
            commands::screen::screen_capture_with_context,
            commands::screen::screen_get_active_window,
            commands::screen::screen_analyze_current,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_available_models_for_system,
            commands::settings::get_current_llm_model,
            commands::settings::switch_llm_model,
            commands::settings::list_ollama_models,
            commands::settings::delete_ollama_model,
            commands::settings::get_ollama_model_size,
            commands::settings::get_model_description,
            commands::system::get_system_info,
            commands::learning::learning_record_feedback,
            commands::learning::learning_optimize_persona,
            commands::learning::learning_get_stats,
            commands::learning::learning_generate_system_prompt,
            commands::learning::learning_save_persona,
            commands::learning::learning_load_persona,
            commands::webhook::register_webhook,
            commands::webhook::list_webhooks,
            commands::webhook::get_webhook,
            commands::webhook::delete_webhook,
            commands::webhook::toggle_webhook,
            commands::webhook::trigger_webhook,
            commands::webhook::test_webhook,
            commands::calendar::calendar_initialize,
            commands::calendar::calendar_start_oauth,
            commands::calendar::calendar_complete_oauth,
            commands::calendar::calendar_is_authenticated,
            commands::calendar::calendar_sign_out,
            commands::calendar::calendar_list,
            commands::calendar::calendar_get_primary_id,
            commands::calendar::calendar_list_events,
            commands::calendar::calendar_get_upcoming,
            commands::calendar::calendar_create_event,
            commands::calendar::calendar_update_event,
            commands::calendar::calendar_delete_event,
            commands::calendar::calendar_search_events,
            commands::calendar::calendar_quick_add,
            commands::calendar::calendar_load_saved_token,
            commands::file::file_read,
            commands::file::file_write,
            commands::file::file_delete,
            commands::file::file_get_metadata,
            commands::file::file_list_directory,
            commands::file::file_create_directory,
            commands::file::file_delete_directory,
            commands::file::file_search,
            commands::file::file_detect_workspace,
            commands::file::file_exists,
            commands::file::file_is_directory,
            commands::file::file_is_file,
            commands::git::git_is_repository,
            commands::git::git_init_repository,
            commands::git::git_get_status,
            commands::git::git_get_diff,
            commands::git::git_stage_files,
            commands::git::git_unstage_files,
            commands::git::git_commit,
            commands::git::git_push,
            commands::git::git_get_log,
            commands::git::git_list_branches,
            commands::git::git_create_branch,
            commands::git::git_checkout_branch,
            commands::git::git_get_current_branch,
            commands::updater::updater_get_version,
            commands::updater::updater_check_for_updates,
            commands::updater::updater_install_update,
            commands::updater::updater_set_check_interval,
            commands::updater::updater_get_endpoint,
            commands::updater::updater_is_newer_version,
            commands::updater::updater_get_channel,
            commands::updater::updater_set_channel,
            commands::updater::updater_get_schedule_settings,
            commands::updater::updater_update_schedule_settings,
            commands::updater::updater_mark_last_check,
            commands::crash_reporter::crash_reporter_is_enabled,
            commands::crash_reporter::crash_reporter_enable,
            commands::crash_reporter::crash_reporter_disable,
            commands::crash_reporter::crash_reporter_get_settings,
            commands::crash_reporter::crash_reporter_update_settings,
            commands::crash_reporter::crash_reporter_report_error,
            commands::crash_reporter::crash_reporter_test,
            commands::crash_reporter::crash_reporter_get_local_reports,  // v3.4.0
            commands::crash_reporter::crash_reporter_cleanup_old_reports,  // v3.4.0
            // Tool History Commands (v3.3.0)
            commands::tool_history::get_tool_history,
            commands::tool_history::get_tool_statistics,
            commands::tool_history::export_tool_history,
            commands::tool_history::delete_tool_history,
            commands::tool_history::get_recent_tools,
            commands::tool_history::get_tool_error_rate,
            // Tool Settings Commands (v3.3.0)
            commands::tool_settings::get_all_tool_settings,
            commands::tool_settings::get_tool_setting,
            commands::tool_settings::update_tool_setting,
            commands::tool_settings::update_all_tool_settings,
            commands::tool_settings::enable_tool,
            commands::tool_settings::disable_tool,
            commands::tool_settings::reset_tool_settings,
            commands::tool_settings::get_tool_default_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

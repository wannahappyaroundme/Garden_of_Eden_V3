// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod commands;
mod services;

use database::Database;
use services::screen::ScreenCaptureService;
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
use services::embedding::EmbeddingService;
use services::rag_v2::RagServiceV2;  // v3.4.0 Phase 6: LanceDB-powered RAG (10-100x faster)
use services::hybrid_search::HybridSearchEngine;
use services::entity_extractor::EntityExtractor;
use services::graph_builder::GraphBuilder;
use services::graph_storage::GraphStorage;
use services::graph_retrieval::GraphRetrievalEngine;
use services::react_agent::ReActAgent;
use services::planner::{Planner, Plan};
use services::computer_control::ComputerControlService;
use services::streaming_vision::StreamingVisionService;
use services::temporal_memory::TemporalMemoryService;
use services::decay_worker::DecayWorker;
use services::pattern_detector::LlmPatternDetector;
use services::contextual_retrieval::ContextualRetrievalService;
use services::memory_consolidation::MemoryConsolidationService;
use services::chain_of_thought::ChainOfThoughtEngine;
use services::visual_analyzer::VisualAnalyzerService;
use services::context_enricher::ContextEnricherService;
use services::semantic_wiki::SemanticWikiService;
use services::memory_enhancer::MemoryEnhancerService;
use services::task_planner::TaskPlannerService;
use services::learning_style_adapter::LearningStyleAdapterService;
use services::goal_tracker::GoalTrackerService;
use commands::calendar::CalendarServiceWrapper;
use commands::crash_reporter::CrashReporterState;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use tokio::sync::Mutex as TokioMutex;
use rusqlite::Connection;

/// Application state shared across Tauri commands
pub struct AppState {
    db: Mutex<Database>,
    screen_service: ScreenCaptureService,
    llava_service: Mutex<LlavaService>,
    model_installer: Arc<ModelInstallerService>,
    learning_service: LearningService,
    webhook_trigger_manager: Arc<WebhookTriggerManager>,
    calendar_service: CalendarServiceWrapper,
    tool_service: Arc<ToolService>,  // v3.6.0: Tool calling system
    tool_history_service: Arc<TokioMutex<ToolHistoryService>>,  // v3.3.0: Tool execution tracking
    tool_settings_service: Arc<TokioMutex<ToolSettingsService>>,  // v3.3.0: Tool configuration
    embedding: Arc<EmbeddingService>,  // v3.6.0: BGE-M3 embeddings
    rag: Arc<RagServiceV2>,  // v3.4.0 Phase 6: LanceDB-powered RAG (10-100x faster)
    hybrid_search: Arc<TokioMutex<HybridSearchEngine>>,  // v3.6.0: Hybrid search (BM25 + semantic)
    attention_sink: Arc<services::attention_sink::AttentionSinkManager>,  // v3.6.0: Long context handling
    prompt_cache: Arc<Mutex<services::prompt_cache::PromptCache>>,  // v3.6.0: Prompt caching
    entity_extractor: Arc<EntityExtractor>,  // v3.7.0: Entity extraction for GraphRAG
    graph_builder: Arc<TokioMutex<GraphBuilder>>,  // v3.7.0: Knowledge graph construction
    graph_storage: Arc<GraphStorage>,  // v3.7.0: SQLite-based graph storage
    graph_retrieval: Arc<GraphRetrievalEngine>,  // v3.7.0: Graph-based retrieval
    react_agent: Arc<ReActAgent>,  // v3.7.0: ReAct agent (Reasoning + Acting)
    planner: Arc<Planner>,  // v3.7.0: Plan-and-Solve agent with user confirmation
    approved_plans: Arc<TokioMutex<HashMap<String, Plan>>>,  // v3.7.0: User-approved plans awaiting execution
    plan_history: Arc<TokioMutex<HashMap<String, Plan>>>,  // v3.7.0: Executed plan history
    computer_control: Arc<ComputerControlService>,  // v3.8.0: LAM (Large Action Model) for computer use
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

    // Initialize LLaVA service
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

    // Initialize Embedding Service (v3.6.0 - BGE-M3 quantized INT8)
    log::info!("Initializing Embedding Service (BGE-M3)...");
    let embedding_service = match EmbeddingService::new() {
        Ok(service) => {
            log::info!("✓ Embedding Service initialized");
            Arc::new(service)
        }
        Err(e) => {
            log::error!("⚠ Failed to initialize Embedding Service: {}", e);
            log::error!("⚠ This is a known issue with ONNX Runtime on some systems.");
            log::error!("⚠ To fix:");
            log::error!("   1. Delete: ~/Library/Application Support/garden-of-eden-v3/models/bge-m3");
            log::error!("   2. Restart the app (BGE-M3 will re-download, ~543MB)");
            log::error!("   3. If issue persists, check ONNX Runtime installation");

            panic!("\n╔════════════════════════════════════════════════════════════════╗\n\
                    ║  CRITICAL ERROR: Embedding Service Failed to Initialize       ║\n\
                    ╚════════════════════════════════════════════════════════════════╝\n\
                    \n\
                    Error: {}\n\
                    \n\
                    🔧 QUICK FIX:\n\
                    Run this command to reset the BGE-M3 model:\n\
                    \n\
                    rm -rf ~/Library/Application\\ Support/garden-of-eden-v3/models/bge-m3\n\
                    \n\
                    Then restart the app. BGE-M3 will re-download automatically (~543MB quantized).\n\
                    \n\
                    📝 This is usually caused by corrupted model files or ONNX Runtime issues.\n\
                    The app requires BGE-M3 embeddings for RAG and semantic search features.\n\
                    \n\
                    ⚠️  Note: The app WILL crash until this is fixed.\n\
                    ", e);
        }
    };

    // Initialize RAG Service v2 (v3.4.0 Phase 6 - LanceDB for maximum performance)
    log::info!("Initializing RAG Service with LanceDB (10-100x faster)...");
    let lance_db_path = data_dir.join("lance_db");
    let rag_service = tokio::runtime::Runtime::new()
        .expect("Failed to create tokio runtime")
        .block_on(async {
            RagServiceV2::new(
                Arc::clone(&db_arc),
                Arc::clone(&embedding_service),
                lance_db_path,
            ).await
        })
        .expect("Failed to initialize RAG Service");
    let rag_service_arc = Arc::new(rag_service);
    log::info!("✓ RAG Service initialized with LanceDB - 10-100x faster vector search! 🚀");

    // Initialize Hybrid Search Engine (v3.6.0)
    log::info!("Initializing Hybrid Search Engine...");
    let hybrid_search_engine = HybridSearchEngine::new(
        Arc::clone(&embedding_service),
        Arc::clone(&rag_service_arc),
    );
    log::info!("✓ Hybrid Search Engine initialized");

    // Initialize Attention Sink Manager (v3.6.0)
    log::info!("Initializing Attention Sink Manager...");
    let attention_sink_manager = services::attention_sink::AttentionSinkManager::new();
    let attention_sink_arc = Arc::new(attention_sink_manager);
    log::info!("✓ Attention Sink Manager initialized");

    // Initialize Prompt Cache (v3.6.0)
    log::info!("Initializing Prompt Cache...");
    let prompt_cache = services::prompt_cache::PromptCache::new();
    let prompt_cache_arc = Arc::new(Mutex::new(prompt_cache));
    log::info!("✓ Prompt Cache initialized");

    // Initialize GraphRAG Services (v3.7.0)
    log::info!("Initializing GraphRAG Services...");

    // Entity Extractor
    let entity_extractor = EntityExtractor::new();
    let entity_extractor_arc = Arc::new(entity_extractor);
    log::info!("✓ Entity Extractor initialized");

    // Graph Storage
    let graph_db_path = data_dir.join("knowledge_graph.db");
    let graph_storage = GraphStorage::new(
        graph_db_path.to_str().expect("Invalid graph DB path")
    ).expect("Failed to initialize Graph Storage");
    let graph_storage_arc = Arc::new(graph_storage);
    log::info!("✓ Graph Storage initialized");

    // Graph Builder
    let graph_builder = GraphBuilder::new(Arc::clone(&entity_extractor_arc));
    let graph_builder_arc = Arc::new(TokioMutex::new(graph_builder));
    log::info!("✓ Graph Builder initialized");

    // Graph Retrieval Engine
    let graph_retrieval = GraphRetrievalEngine::new(Arc::clone(&graph_storage_arc));
    let graph_retrieval_arc = Arc::new(graph_retrieval);
    log::info!("✓ Graph Retrieval Engine initialized");

    log::info!("✓ All GraphRAG Services initialized successfully");

    // Initialize ReAct Agent (v3.7.0)
    log::info!("Initializing ReAct Agent...");
    let react_agent = ReActAgent::new(
        "http://localhost:11434".to_string(),
        Arc::clone(&tool_service)
    );
    let react_agent_arc = Arc::new(react_agent);
    log::info!("✓ ReAct Agent initialized");

    // Initialize Plan-and-Solve Planner (v3.7.0)
    log::info!("Initializing Plan-and-Solve Planner...");
    let planner = Planner::new(
        "http://localhost:11434".to_string(),
        Arc::clone(&react_agent_arc)
    );
    let planner_arc = Arc::new(planner);
    let approved_plans = Arc::new(TokioMutex::new(HashMap::new()));
    let plan_history = Arc::new(TokioMutex::new(HashMap::new()));
    log::info!("✓ Plan-and-Solve Planner initialized");

    // Initialize Computer Control Service (v3.8.0)
    log::info!("Initializing Computer Control Service (LAM)...");
    // Create new instances for computer control service
    let cc_screen_service = ScreenCaptureService::new(Arc::clone(&db_arc));
    let cc_llava_service = LlavaService::new()
        .expect("Failed to initialize LLaVA for Computer Control");

    // Computer Control needs a separate Connection instance
    let cc_db_path = Database::get_db_path()
        .expect("Failed to get database path for Computer Control");
    let cc_conn = Connection::open(&cc_db_path)
        .expect("Failed to open database connection for Computer Control");
    let cc_db_arc = Arc::new(Mutex::new(cc_conn));

    let computer_control = ComputerControlService::new(
        Arc::new(cc_screen_service),
        Arc::new(cc_llava_service),
        cc_db_arc
    ).expect("Failed to initialize Computer Control Service");
    let computer_control_arc = Arc::new(computer_control);
    log::info!("✓ Computer Control Service initialized");

    // Initialize Streaming Vision Service (v3.8.0 Phase 2)
    log::info!("Initializing Streaming Vision Service...");
    let sv_screen_service = ScreenCaptureService::new(Arc::clone(&db_arc));
    let sv_llava_service = LlavaService::new()
        .expect("Failed to initialize LLaVA for Streaming Vision");

    let streaming_vision = StreamingVisionService::new(
        Arc::new(sv_screen_service),
        Arc::new(sv_llava_service),
        Arc::clone(&db_arc)
    ).expect("Failed to initialize Streaming Vision Service");
    let streaming_vision_arc = Arc::new(streaming_vision);
    log::info!("✓ Streaming Vision Service initialized");

    // Initialize Temporal Memory Service (v3.8.0 Phase 3)
    log::info!("Initializing Temporal Memory Service...");
    let temporal_memory = TemporalMemoryService::new(Arc::clone(&db_arc))
        .expect("Failed to initialize Temporal Memory Service");
    let temporal_memory_arc = Arc::new(temporal_memory);
    log::info!("✓ Temporal Memory Service initialized");

    // Start Memory Decay Worker (v3.8.0 Phase 3)
    log::info!("Starting Memory Decay Worker (24h interval)...");
    let _decay_worker = DecayWorker::start(Arc::clone(&temporal_memory_arc), true);
    log::info!("✓ Memory Decay Worker started with auto-prune enabled");

    // Initialize Pattern Detector (v3.8.0 Phase 4)
    log::info!("Initializing Pattern Detector (ML-based trait analysis)...");
    let pattern_detector = LlmPatternDetector::new();
    let pattern_detector_arc = Arc::new(pattern_detector);
    log::info!("✓ Pattern Detector initialized");

    // Initialize Contextual Retrieval Service (v3.8.0 Phase 4)
    log::info!("Initializing Contextual Retrieval Service...");
    let contextual_retrieval = ContextualRetrievalService::new(
        Arc::clone(&db_arc),
        Arc::clone(&rag_service_arc)
    ).expect("Failed to initialize Contextual Retrieval Service");
    let contextual_retrieval_arc = Arc::new(contextual_retrieval);
    log::info!("✓ Contextual Retrieval Service initialized");

    // Initialize Memory Consolidation Service (v3.8.0 Phase 4)
    log::info!("Initializing Memory Consolidation Service...");
    let memory_consolidation = MemoryConsolidationService::new(
        Arc::clone(&db_arc),
        Arc::clone(&rag_service_arc),
        Arc::clone(&embedding_service)
    ).expect("Failed to initialize Memory Consolidation Service");
    let memory_consolidation_arc = Arc::new(memory_consolidation);
    log::info!("✓ Memory Consolidation Service initialized");

    // Initialize Chain-of-Thought Engine (v3.9.0 Phase 5)
    log::info!("Initializing Chain-of-Thought Engine...");
    let cot_engine = ChainOfThoughtEngine::new();
    let cot_engine_arc = Arc::new(cot_engine);
    log::info!("✓ Chain-of-Thought Engine initialized");

    // Initialize Visual Analyzer (v3.9.0 Phase 5 - Stage 1)
    log::info!("Initializing Visual Analyzer...");
    let visual_screen_service = Arc::new(ScreenCaptureService::new(Arc::clone(&db_arc)));
    let visual_analyzer = VisualAnalyzerService::new(
        visual_screen_service,
        Arc::clone(&db_arc)
    ).expect("Failed to initialize Visual Analyzer");
    let visual_analyzer_arc = Arc::new(TokioMutex::new(visual_analyzer));
    log::info!("✓ Visual Analyzer initialized (lazy LLaVA loading)");

    // Initialize Context Enricher (v3.9.0 Phase 5 - Stage 1)
    log::info!("Initializing Context Enricher...");
    let context_enricher = ContextEnricherService::new(
        Arc::clone(&db_arc),
        Arc::clone(&rag_service_arc),
        Some(Arc::clone(&visual_analyzer_arc))
    ).expect("Failed to initialize Context Enricher");
    let context_enricher_arc = Arc::new(context_enricher);
    log::info!("✓ Context Enricher initialized");

    // Initialize Semantic Wiki (v3.9.0 Phase 5 - Stage 2)
    log::info!("Initializing Semantic Wiki...");
    let semantic_wiki = SemanticWikiService::new(
        Arc::clone(&db_arc),
        Arc::clone(&embedding_service)
    ).expect("Failed to initialize Semantic Wiki");
    let semantic_wiki_arc = Arc::new(semantic_wiki);
    log::info!("✓ Semantic Wiki initialized");

    // Initialize Memory Enhancer (v3.9.0 Phase 5 - Stage 2)
    log::info!("Initializing Memory Enhancer...");
    let memory_enhancer = MemoryEnhancerService::new(
        Arc::clone(&db_arc)
    ).expect("Failed to initialize Memory Enhancer");
    let memory_enhancer_arc = Arc::new(memory_enhancer);
    log::info!("✓ Memory Enhancer initialized");

    // Initialize Task Planner (v3.9.0 Phase 5 - Stage 4)
    log::info!("Initializing Task Planner...");
    let task_planner = TaskPlannerService::new(
        Arc::clone(&db_arc)
    ).expect("Failed to initialize Task Planner");
    let task_planner_arc = Arc::new(task_planner);
    log::info!("✓ Task Planner initialized");

    // Initialize Learning Style Adapter (v3.9.0 Phase 5 - Stage 4)
    log::info!("Initializing Learning Style Adapter...");
    let learning_style_adapter = LearningStyleAdapterService::new(
        Arc::clone(&db_arc)
    ).expect("Failed to initialize Learning Style Adapter");
    let learning_style_adapter_arc = Arc::new(learning_style_adapter);
    log::info!("✓ Learning Style Adapter initialized");

    // Initialize Goal Tracker (v3.9.0 Phase 5 - Stage 4)
    log::info!("Initializing Goal Tracker...");
    let goal_tracker = GoalTrackerService::new(
        Arc::clone(&db_arc)
    ).expect("Failed to initialize Goal Tracker");
    let goal_tracker_arc = Arc::new(goal_tracker);
    log::info!("✓ Goal Tracker initialized");

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
        llava_service: Mutex::new(llava_service),
        model_installer,
        learning_service,
        webhook_trigger_manager,
        calendar_service,
        tool_service,  // v3.6.0: Tool calling system
        tool_history_service,  // v3.3.0: Tool execution tracking
        tool_settings_service,  // v3.3.0: Tool configuration
        embedding: embedding_service,  // v3.6.0: BGE-M3 embeddings
        rag: rag_service_arc,  // v3.4.0 Phase 6: LanceDB-powered RAG (10-100x faster)
        hybrid_search: Arc::new(TokioMutex::new(hybrid_search_engine)),  // v3.6.0: Hybrid search
        attention_sink: attention_sink_arc,  // v3.6.0: Attention sink for long contexts
        prompt_cache: prompt_cache_arc,  // v3.6.0: Prompt caching
        entity_extractor: entity_extractor_arc,  // v3.7.0: Entity extraction for GraphRAG
        graph_builder: graph_builder_arc,  // v3.7.0: Knowledge graph construction
        graph_storage: graph_storage_arc,  // v3.7.0: SQLite-based graph storage
        graph_retrieval: graph_retrieval_arc,  // v3.7.0: Graph-based retrieval
        react_agent: react_agent_arc,  // v3.7.0: ReAct agent (Reasoning + Acting)
        planner: planner_arc,  // v3.7.0: Plan-and-Solve agent with user confirmation
        approved_plans,  // v3.7.0: User-approved plans awaiting execution
        plan_history,  // v3.7.0: Executed plan history
        computer_control: Arc::clone(&computer_control_arc),  // v3.8.0: LAM (Large Action Model) for computer use
    };

    tauri::Builder::default()
        .manage(app_state)
        .manage(crash_reporter_state)
        .manage(computer_control_arc)  // v3.8.0: LAM service for commands
        .manage(streaming_vision_arc)  // v3.8.0 Phase 2: Streaming vision service
        .manage(temporal_memory_arc)  // v3.8.0 Phase 3: Temporal memory service
        .manage(pattern_detector_arc)  // v3.8.0 Phase 4: Pattern detector service
        .manage(contextual_retrieval_arc)  // v3.8.0 Phase 4: Contextual retrieval service
        .manage(memory_consolidation_arc)  // v3.8.0 Phase 4: Memory consolidation service
        .manage(cot_engine_arc)  // v3.9.0 Phase 5: Chain-of-Thought engine
        .manage(visual_analyzer_arc)  // v3.9.0 Phase 5 Stage 1: Visual analyzer (lazy LLaVA)
        .manage(context_enricher_arc)  // v3.9.0 Phase 5 Stage 1: Context enricher
        .manage(semantic_wiki_arc)  // v3.9.0 Phase 5 Stage 2: Semantic knowledge base
        .manage(memory_enhancer_arc)  // v3.9.0 Phase 5 Stage 2: Memory quality scoring and enhancement
        .manage(task_planner_arc)  // v3.9.0 Phase 5 Stage 4: Task planning and execution
        .manage(learning_style_adapter_arc)  // v3.9.0 Phase 5 Stage 4: Learning style adaptation
        .manage(goal_tracker_arc)  // v3.9.0 Phase 5 Stage 4: Goal tracking and achievement
        .plugin(tauri_plugin_updater::Builder::new().build())  // v3.4.0: Auto-updater
        .invoke_handler(tauri::generate_handler![
            commands::ai::chat,
            commands::ai::chat_stream,
            commands::ai::chat_with_tools,  // v3.6.0: Tool-enabled chat
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
            commands::learning::learning_evolve_full_persona_from_temporal,  // Phase 4
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
            commands::updater::updater_add_history_entry,
            commands::updater::updater_get_history,
            commands::llm::llm_get_vram_info,
            commands::llm::llm_get_settings,
            commands::llm::llm_set_model,
            commands::llm::llm_set_reasoning_mode,
            commands::llm::llm_update_vram,
            // Conversation Memory Commands (v3.5.0)
            commands::conversation_memory::memory_get_context,
            commands::conversation_memory::memory_needs_summarization,
            commands::conversation_memory::memory_create_summary,
            commands::conversation_memory::memory_get_messages_for_summary,
            commands::conversation_memory::memory_get_summary,
            commands::conversation_memory::memory_delete_summary,
            commands::conversation_memory::memory_format_context,
            // Hybrid Search Commands (v3.6.0)
            commands::hybrid_search::hybrid_search_init,
            commands::hybrid_search::hybrid_search_rebuild_index,
            commands::hybrid_search::hybrid_search_query,
            commands::hybrid_search::hybrid_search_set_weights,
            commands::hybrid_search::hybrid_search_set_rrf_k,
            commands::hybrid_search::hybrid_search_stats,
            commands::hybrid_search::hybrid_search_compare,
            commands::hybrid_search::hybrid_search_toggle_reranking,
            // Attention Sink Commands (v3.6.0)
            commands::attention_sink::attention_sink_manage_context,
            commands::attention_sink::attention_sink_format_prompt,
            commands::attention_sink::attention_sink_needs_compression,
            commands::attention_sink::attention_sink_estimate_tokens,
            commands::attention_sink::attention_sink_get_config,
            commands::attention_sink::attention_sink_stats,
            // Prompt Cache Commands (v3.6.0)
            commands::prompt_cache::prompt_cache_contains,
            commands::prompt_cache::prompt_cache_get,
            commands::prompt_cache::prompt_cache_put,
            commands::prompt_cache::prompt_cache_clear_expired,
            commands::prompt_cache::prompt_cache_clear_all,
            commands::prompt_cache::prompt_cache_stats,
            commands::prompt_cache::prompt_cache_hit_rate,
            commands::prompt_cache::prompt_cache_get_all,
            commands::prompt_cache::prompt_cache_get_config,
            commands::prompt_cache::prompt_cache_evict_lru,
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
            // GraphRAG Commands (v3.7.0)
            commands::graphrag::graphrag_extract_entities,
            commands::graphrag::graphrag_build_graph,
            commands::graphrag::graphrag_save_graph,
            commands::graphrag::graphrag_load_entity,
            commands::graphrag::graphrag_search_entities,
            commands::graphrag::graphrag_get_neighbors,
            commands::graphrag::graphrag_get_community,
            commands::graphrag::graphrag_retrieve,
            commands::graphrag::graphrag_find_path,
            commands::graphrag::graphrag_stats,
            commands::graphrag::graphrag_delete_entity,
            commands::graphrag::graphrag_clear_all,
            commands::graphrag::graphrag_get_extractor_config,
            commands::graphrag::graphrag_get_retrieval_config,
            // ReAct Commands (v3.7.0)
            commands::react::react_execute,
            commands::react::react_get_config,
            commands::react::react_set_config,
            // Plan-and-Solve Commands (v3.7.0)
            commands::planner::planner_generate,
            commands::planner::planner_approve,
            commands::planner::planner_execute,
            commands::planner::planner_reject,
            commands::planner::planner_get_plan,
            commands::planner::planner_list_approved,
            commands::planner::planner_list_history,
            commands::planner::planner_clear_history,
            commands::planner::planner_get_config,
            commands::planner::planner_set_config,
            commands::planner::planner_generate_and_execute,
            commands::planner::planner_stats,
            // Computer Control Commands (v3.8.0 Phase 1)
            commands::computer_control::computer_click_element,
            commands::computer_control::computer_type_text,
            commands::computer_control::computer_press_key,
            commands::computer_control::computer_scroll,
            commands::computer_control::computer_move_mouse,
            commands::computer_control::computer_wait,
            commands::computer_control::computer_get_action_history,
            commands::computer_control::computer_clear_action_history,
            commands::computer_control::computer_get_safety_config,
            commands::computer_control::computer_get_stats,
            commands::computer_control::computer_click_and_type,
            commands::computer_control::computer_type_and_submit,
            commands::computer_control::computer_test_connection,
            #[cfg(target_os = "macos")]
            commands::computer_control::computer_execute_applescript,
            // Streaming Vision Commands (v3.8.0 Phase 2)
            commands::streaming_vision::streaming_vision_start,
            commands::streaming_vision::streaming_vision_stop,
            commands::streaming_vision::streaming_vision_get_state,
            commands::streaming_vision::streaming_vision_get_config,
            commands::streaming_vision::streaming_vision_update_config,
            commands::streaming_vision::streaming_vision_get_history,
            commands::streaming_vision::streaming_vision_clear_history,
            commands::streaming_vision::streaming_vision_get_stats,
            commands::streaming_vision::streaming_vision_test_connection,
            // Temporal Memory Commands (v3.8.0 Phase 3)
            commands::temporal_memory::temporal_pin_memory,
            commands::temporal_memory::temporal_unpin_memory,
            commands::temporal_memory::temporal_get_retention_stats,
            commands::temporal_memory::temporal_trigger_decay_update,
            commands::temporal_memory::temporal_get_config,
            commands::temporal_memory::temporal_update_config,
            commands::temporal_memory::temporal_prune_memories,
            commands::temporal_memory::temporal_calculate_retention,
            // Adaptive Decay (Phase 4)
            commands::temporal_memory::temporal_set_memory_type,
            commands::temporal_memory::temporal_get_memory_type,
            commands::temporal_memory::temporal_classify_memory,
            // Retention Forecasting (Phase 4)
            commands::temporal_memory::temporal_forecast_retention,
            commands::temporal_memory::temporal_find_at_risk_memories,
            // Advanced Pattern Detection (Phase 4)
            commands::pattern_detection::pattern_analyze_traits,
            commands::pattern_detection::pattern_analyze_single_trait,
            // Contextual Retrieval (Phase 4)
            commands::contextual_retrieval::contextual_boost_memories,
            commands::contextual_retrieval::contextual_decay_old_boosts,
            commands::contextual_retrieval::contextual_get_boost_stats,
            commands::contextual_retrieval::contextual_update_config,
            commands::contextual_retrieval::contextual_get_config,
            // Memory Consolidation (Phase 4)
            commands::memory_consolidation::consolidation_run,
            commands::memory_consolidation::consolidation_get_stats,
            commands::memory_consolidation::consolidation_update_config,
            commands::memory_consolidation::consolidation_get_config,
            // Chain-of-Thought (Phase 5)
            commands::chain_of_thought::cot_reason,
            commands::chain_of_thought::cot_update_config,
            commands::chain_of_thought::cot_get_config,
            commands::chain_of_thought::cot_clear_cache,
            commands::chain_of_thought::cot_get_cache_stats,
            // Visual Analyzer (Phase 5 - Stage 1)
            commands::visual_analyzer::visual_analyze_image,
            commands::visual_analyzer::visual_analyze_screen,
            commands::visual_analyzer::visual_update_config,
            commands::visual_analyzer::visual_get_config,
            commands::visual_analyzer::visual_is_loaded,
            commands::visual_analyzer::visual_get_recent,
            // Context Enricher (Phase 5 - Stage 1)
            commands::context_enricher::context_enrich,
            commands::context_enricher::context_update_config,
            commands::context_enricher::context_get_config,
            // Semantic Wiki (Phase 5 - Stage 2)
            commands::semantic_wiki::wiki_extract_facts,
            commands::semantic_wiki::wiki_store_facts,
            commands::semantic_wiki::wiki_search,
            commands::semantic_wiki::wiki_get_by_entity,
            commands::semantic_wiki::wiki_get_stats,
            commands::semantic_wiki::wiki_update_config,
            commands::semantic_wiki::wiki_get_config,
            // Memory Enhancer (Phase 5 - Stage 2)
            commands::memory_enhancer::memory_analyze_quality,
            commands::memory_enhancer::memory_enhance,
            commands::memory_enhancer::memory_process,
            commands::memory_enhancer::memory_batch_enhance,
            commands::memory_enhancer::memory_get_enhancement_stats,
            commands::memory_enhancer::memory_get_enhancement,
            commands::memory_enhancer::memory_update_config,
            commands::memory_enhancer::memory_get_config,
            // Task Planner (Phase 5 - Stage 4)
            commands::task_planner::task_decompose,
            commands::task_planner::task_create,
            commands::task_planner::task_get,
            commands::task_planner::task_update_status,
            commands::task_planner::task_update_progress,
            commands::task_planner::task_generate_execution_plan,
            commands::task_planner::task_get_subtasks,
            commands::task_planner::task_get_all,
            commands::task_planner::task_delete,
            // Learning Style Adapter (Phase 5 - Stage 4)
            commands::learning_style::learning_style_get_profile,
            commands::learning_style::learning_style_record_interaction,
            commands::learning_style::learning_style_update_profile,
            commands::learning_style::learning_style_adapt_response,
            commands::learning_style::learning_style_update_manual,
            // Goal Tracker (Phase 5 - Stage 4)
            commands::goal_tracker::goal_create,
            commands::goal_tracker::goal_get,
            commands::goal_tracker::goal_update_progress,
            commands::goal_tracker::goal_complete_milestone,
            commands::goal_tracker::goal_get_active,
            commands::goal_tracker::goal_get_stale,
            commands::goal_tracker::goal_detect_progress,
            commands::goal_tracker::goal_get_achievements,
            commands::goal_tracker::goal_delete,
            // RAFT Commands (v3.4.0 Phase 7)
            commands::raft::get_raft_config,
            commands::raft::update_raft_config,
            commands::raft::reset_raft_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

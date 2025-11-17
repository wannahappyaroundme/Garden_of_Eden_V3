pub mod ollama;
pub mod screen;
pub mod whisper;
pub mod tts;
pub mod llava;
pub mod system_info;
pub mod model_recommender;
pub mod model_installer;
pub mod prompt_customizer;

// Phase 1: RAG & Episodic Memory
pub mod embedding;
pub mod rag;
pub mod raft;  // v3.2.0: RAFT hallucination reduction
// rag_lancedb postponed - LanceDB 0.22 API migration complex
// Using SQLite + BGE-M3 embeddings instead (sufficient for v3.2.0)

// Phase 2: Screen Context & Vision
pub mod active_window;

// Phase 4: Proactive Mode
pub mod proactive_manager;

// Phase 5: Learning System
pub mod learning;
pub mod personality_detector;  // v3.8.0 Phase 2.1: Conversation pattern analysis
pub mod persona_adjuster;      // v3.8.0 Phase 2.3: Automatic persona adjustment
pub mod lora_data_collector;   // v3.8.0 Phase 3.1: LoRA training data collection

#[cfg(test)]
mod personality_tests;  // v3.8.0 Phase 2: Comprehensive personality tests (30+ tests)

// Phase 6: Webhooks & External Integrations
pub mod webhook;
pub mod webhook_triggers;
pub mod calendar;

// Phase 7: File System & Git Integration
pub mod file;
pub mod git;

// Phase 8: Auto-updater & Crash Reporting
pub mod updater;
pub mod crash_reporter;

// Phase 9: Internet Access (v3.3.0)
pub mod web_search;
pub mod url_fetch;

// Phase 10: Plugin System (v3.4.0)
pub mod plugin;
pub mod plugin_runtime;

// Phase 11: Tool Calling System (v3.5.0)
pub mod tool_calling;
pub mod tool_implementations;

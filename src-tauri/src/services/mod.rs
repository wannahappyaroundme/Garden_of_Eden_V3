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

// Phase 2: Screen Context & Vision
pub mod active_window;

// Phase 4: Proactive Mode
pub mod proactive_manager;

// Phase 5: Learning System
pub mod learning;

// Phase 6: Webhooks & External Integrations
pub mod webhook;
pub mod webhook_triggers;
pub mod calendar;

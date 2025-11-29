pub mod ai;
pub mod conversation;
pub mod onboarding;
pub mod screen;
pub mod settings;
pub mod system;
pub mod learning;
pub mod webhook;
pub mod calendar;
pub mod file;
pub mod git;
pub mod updater;
pub mod crash_reporter;
pub mod tool_history;
pub mod tool_settings;
pub mod llm;
pub mod conversation_memory;
#[cfg(feature = "lancedb-support")]
pub mod hybrid_search;
pub mod attention_sink;
pub mod prompt_cache;
pub mod graphrag;
pub mod react;
pub mod planner;
pub mod computer_control;
pub mod streaming_vision;
pub mod temporal_memory;
pub mod pattern_detection;
#[cfg(feature = "phase4")]
pub mod contextual_retrieval;
#[cfg(feature = "phase4")]
pub mod memory_consolidation;
pub mod chain_of_thought;
pub mod visual_analyzer;
#[cfg(feature = "phase5")]
pub mod context_enricher;
pub mod semantic_wiki;
pub mod memory_enhancer;
pub mod task_planner;
pub mod learning_style;
pub mod goal_tracker;
pub mod raft;  // v3.4.0 Phase 7: RAFT hallucination reduction
pub mod proactive;  // v3.6.0: Proactive AI monitoring
pub mod lora;  // v3.6.0: LoRA training data collection and adapter management
pub mod plugin;  // v3.6.0: Plugin system management
pub mod episodic_memory;  // v3.6.0: Episodic memory visualization commands

pub mod ollama;
pub mod screen;
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
pub mod personality_detector;  // v3.3.0 Phase 2.1: Conversation pattern analysis
pub mod persona_adjuster;      // v3.3.0 Phase 2.3: Automatic persona adjustment
pub mod lora_data_collector;   // v3.3.0 Phase 3.1: LoRA training data collection
pub mod lora_adapter_manager;  // v3.3.0 Phase 3.2: LoRA adapter management

#[cfg(test)]
mod personality_tests;  // v3.3.0 Phase 2: Comprehensive personality tests (69+ tests)

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

// Phase 11: Tool Calling System (v3.3.0)
pub mod tool_calling;
pub mod tool_implementations;
pub mod tool_history;        // v3.3.0: Tool execution tracking and analytics
pub mod tool_settings;       // v3.3.0: Tool configuration management
pub mod plugin_tool_bridge;  // v3.3.0: Plugin-to-tool integration bridge

// Phase 12: Conversation Memory (v3.5.0)
pub mod conversation_memory; // v3.5.0: Summary Buffer Memory for multi-turn conversations

// Phase 13: Hybrid Search (v3.6.0)
pub mod bm25;  // v3.6.0: BM25 lexical search for hybrid retrieval
pub mod hybrid_search;  // v3.6.0: Hybrid search combining BM25 + BGE-M3 with RRF fusion
pub mod reranker;  // v3.6.0: Cross-encoder re-ranking for improved relevance

// Phase 14: Attention Sink (v3.6.0)
pub mod attention_sink;  // v3.6.0: StreamingLLM pattern for long context handling

// Phase 15: Prompt Caching (v3.6.0)
pub mod prompt_cache;  // v3.6.0: LRU cache for system prompts (50% speed improvement)

// Phase 16: GraphRAG (v3.7.0)
pub mod entity_extractor;  // v3.7.0: Entity and relationship extraction for knowledge graphs
pub mod graph_builder;     // v3.7.0: Knowledge graph construction with community detection
pub mod graph_storage;     // v3.7.0: SQLite-based graph storage with CRUD operations
pub mod graph_retrieval;   // v3.7.0: Graph-based retrieval with multi-hop reasoning

// Phase 17: ReAct & Plan-and-Solve (v3.7.0)
pub mod react_agent;  // v3.7.0: ReAct pattern (Reasoning + Acting) for structured problem solving
pub mod planner;      // v3.7.0: Plan-and-Solve with user confirmation and adaptive execution

// Phase 18: LAM (Large Action Model) - Computer Use (v3.8.0)
pub mod computer_control;  // v3.8.0: Vision-guided mouse/keyboard automation with safety controls
pub mod lam_tools;         // v3.8.0: LAM tools for ReAct agent (click, type, scroll, etc.)
pub mod streaming_vision;  // v3.8.0 Phase 2: Continuous screen monitoring with proactive alerts
pub mod temporal_memory;   // v3.8.0 Phase 3: Ebbinghaus forgetting curve with gradual decay
pub mod decay_worker;      // v3.8.0 Phase 3: 24h background worker for memory retention updates
pub mod pattern_detector;  // v3.8.0 Phase 4: ML-based trait extraction using Ollama/Qwen
pub mod contextual_retrieval;  // v3.8.0 Phase 4: Topic-based retention boosting for active conversations
pub mod memory_consolidation;  // v3.8.0 Phase 4: Intelligent merging of similar low-retention memories

// Phase 5: Reasoning Engine 2.0 (v3.9.0)
pub mod chain_of_thought;  // v3.9.0: Step-by-step reasoning with self-correction
pub mod visual_analyzer;   // v3.9.0 Stage 1: Image understanding with LLaVA (lazy loading)
pub mod context_enricher;  // v3.9.0 Stage 1: Multi-source context aggregation
pub mod semantic_wiki;     // v3.9.0 Stage 2: Fact extraction and knowledge base
pub mod memory_enhancer;   // v3.9.0 Stage 2: Memory quality scoring and enhancement

#[cfg(test)]
mod computer_control_tests;  // v3.8.0: Phase 1 LAM integration tests

/**
 * Application State (v3.5.2)
 *
 * Domain-specific service group definitions for better maintainability.
 * These types can be used by commands for more focused dependencies.
 *
 * Current Architecture:
 * - Main AppState in main.rs remains flat for backwards compatibility
 * - These group types provide logical organization
 * - Commands can use either AppState or individual service types
 *
 * Future Migration Path:
 * 1. New commands should use specific service types where possible
 * 2. Gradually migrate existing commands to use grouped accessors
 * 3. Eventually consolidate to a fully grouped AppState
 */

use crate::database::Database;
use crate::services::screen::ScreenCaptureService;
use crate::services::llava::LlavaService;
use crate::services::model_installer::ModelInstallerService;
use crate::services::learning::LearningService;
use crate::services::webhook_triggers::WebhookTriggerManager;
use crate::services::tool_calling::ToolService;
use crate::services::tool_history::ToolHistoryService;
use crate::services::tool_settings::ToolSettingsService;
use crate::services::embedding::UnifiedEmbeddingService;
#[cfg(feature = "lancedb-support")]
use crate::services::rag_v2::RagServiceV2;
#[cfg(not(feature = "lancedb-support"))]
use crate::services::rag::RagService as RagServiceV2;
#[cfg(feature = "lancedb-support")]
use crate::services::hybrid_search::HybridSearchEngine;
use crate::services::entity_extractor::EntityExtractor;
use crate::services::graph_builder::GraphBuilder;
use crate::services::graph_storage::GraphStorage;
use crate::services::graph_retrieval::GraphRetrievalEngine;
use crate::services::react_agent::ReActAgent;
use crate::services::planner::{Planner, Plan};
use crate::services::computer_control::ComputerControlService;
use crate::commands::calendar::CalendarServiceWrapper;

use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use tokio::sync::Mutex as TokioMutex;

// ============================================================================
// DOMAIN-SPECIFIC SERVICE GROUPS
// ============================================================================

/// Core infrastructure services
pub struct CoreServices {
    /// Main database connection
    pub db: Mutex<Database>,
    /// Screen capture service
    pub screen: ScreenCaptureService,
    /// LLaVA vision model service
    pub llava: Mutex<LlavaService>,
    /// Model installer for downloading/managing models
    pub model_installer: Arc<ModelInstallerService>,
    /// Learning service for persona optimization
    pub learning: LearningService,
}

/// AI and ML services
pub struct AiServices {
    /// Unified embedding service (BGE-M3 with TF-IDF fallback)
    pub embedding: Arc<UnifiedEmbeddingService>,
    /// RAG service for episodic memory retrieval
    pub rag: Arc<RagServiceV2>,
    /// Hybrid search engine (BM25 + semantic) - only with lancedb-support
    #[cfg(feature = "lancedb-support")]
    pub hybrid_search: Arc<TokioMutex<HybridSearchEngine>>,
    /// ReAct agent for reasoning + acting
    pub react_agent: Arc<ReActAgent>,
    /// Plan-and-Solve agent
    pub planner: Arc<Planner>,
    /// Approved plans awaiting execution
    pub approved_plans: Arc<TokioMutex<HashMap<String, Plan>>>,
    /// Executed plan history
    pub plan_history: Arc<TokioMutex<HashMap<String, Plan>>>,
}

/// Tool-related services
pub struct ToolServices {
    /// Tool calling system
    pub service: Arc<ToolService>,
    /// Tool execution history tracking
    pub history: Arc<TokioMutex<ToolHistoryService>>,
    /// Tool configuration settings
    pub settings: Arc<TokioMutex<ToolSettingsService>>,
    /// Computer control (LAM) service
    pub computer_control: Arc<ComputerControlService>,
}

/// Memory and knowledge graph services
pub struct MemoryServices {
    /// Attention sink for long context handling
    pub attention_sink: Arc<crate::services::attention_sink::AttentionSinkManager>,
    /// Prompt caching for performance
    pub prompt_cache: Arc<Mutex<crate::services::prompt_cache::PromptCache>>,
    /// Entity extractor for GraphRAG
    pub entity_extractor: Arc<EntityExtractor>,
    /// Knowledge graph builder
    pub graph_builder: Arc<TokioMutex<GraphBuilder>>,
    /// Graph storage backend
    pub graph_storage: Arc<GraphStorage>,
    /// Graph-based retrieval engine
    pub graph_retrieval: Arc<GraphRetrievalEngine>,
}

/// External integration services
pub struct IntegrationServices {
    /// Webhook trigger manager
    pub webhooks: Arc<WebhookTriggerManager>,
    /// Calendar service wrapper
    pub calendar: CalendarServiceWrapper,
}

// ============================================================================
// UNIFIED APP STATE
// ============================================================================

/// Application state shared across Tauri commands
///
/// Organized into domain-specific service groups for better
/// maintainability and testability.
pub struct AppState {
    /// Core infrastructure (database, screen, models)
    pub core: CoreServices,
    /// AI/ML services (embedding, RAG, agents)
    pub ai: AiServices,
    /// Tool services (execution, history, settings)
    pub tools: ToolServices,
    /// Memory services (attention, cache, graph)
    pub memory: MemoryServices,
    /// External integrations (webhooks, calendar)
    pub integrations: IntegrationServices,
}

impl AppState {
    /// Create new AppState from individual service components
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        core: CoreServices,
        ai: AiServices,
        tools: ToolServices,
        memory: MemoryServices,
        integrations: IntegrationServices,
    ) -> Self {
        Self {
            core,
            ai,
            tools,
            memory,
            integrations,
        }
    }

    // === Convenience accessors for backwards compatibility ===

    /// Get database reference
    pub fn db(&self) -> &Mutex<Database> {
        &self.core.db
    }

    /// Get embedding service
    pub fn embedding(&self) -> &Arc<UnifiedEmbeddingService> {
        &self.ai.embedding
    }

    /// Get RAG service
    pub fn rag(&self) -> &Arc<RagServiceV2> {
        &self.ai.rag
    }

    /// Get tool service
    pub fn tool_service(&self) -> &Arc<ToolService> {
        &self.tools.service
    }

    /// Get screen capture service
    pub fn screen_service(&self) -> &ScreenCaptureService {
        &self.core.screen
    }

    /// Get learning service
    pub fn learning_service(&self) -> &LearningService {
        &self.core.learning
    }
}

// ============================================================================
// LEGACY APPSTATE (for gradual migration)
// ============================================================================

/// Legacy AppState structure for backwards compatibility
/// TODO: Migrate commands to use new grouped AppState, then remove this
pub struct LegacyAppState {
    pub db: Mutex<Database>,
    pub screen_service: ScreenCaptureService,
    pub llava_service: Mutex<LlavaService>,
    pub model_installer: Arc<ModelInstallerService>,
    pub learning_service: LearningService,
    pub webhook_trigger_manager: Arc<WebhookTriggerManager>,
    pub calendar_service: CalendarServiceWrapper,
    pub tool_service: Arc<ToolService>,
    pub tool_history_service: Arc<TokioMutex<ToolHistoryService>>,
    pub tool_settings_service: Arc<TokioMutex<ToolSettingsService>>,
    pub embedding: Arc<UnifiedEmbeddingService>,
    pub rag: Arc<RagServiceV2>,
    #[cfg(feature = "lancedb-support")]
    pub hybrid_search: Arc<TokioMutex<HybridSearchEngine>>,
    pub attention_sink: Arc<crate::services::attention_sink::AttentionSinkManager>,
    pub prompt_cache: Arc<Mutex<crate::services::prompt_cache::PromptCache>>,
    pub entity_extractor: Arc<EntityExtractor>,
    pub graph_builder: Arc<TokioMutex<GraphBuilder>>,
    pub graph_storage: Arc<GraphStorage>,
    pub graph_retrieval: Arc<GraphRetrievalEngine>,
    pub react_agent: Arc<ReActAgent>,
    pub planner: Arc<Planner>,
    pub approved_plans: Arc<TokioMutex<HashMap<String, Plan>>>,
    pub plan_history: Arc<TokioMutex<HashMap<String, Plan>>>,
    pub computer_control: Arc<ComputerControlService>,
}

impl LegacyAppState {
    /// Convert to new grouped AppState structure
    pub fn into_grouped(self) -> AppState {
        let core = CoreServices {
            db: self.db,
            screen: self.screen_service,
            llava: self.llava_service,
            model_installer: self.model_installer,
            learning: self.learning_service,
        };

        let ai = AiServices {
            embedding: self.embedding,
            rag: self.rag,
            #[cfg(feature = "lancedb-support")]
            hybrid_search: self.hybrid_search,
            react_agent: self.react_agent,
            planner: self.planner,
            approved_plans: self.approved_plans,
            plan_history: self.plan_history,
        };

        let tools = ToolServices {
            service: self.tool_service,
            history: self.tool_history_service,
            settings: self.tool_settings_service,
            computer_control: self.computer_control,
        };

        let memory = MemoryServices {
            attention_sink: self.attention_sink,
            prompt_cache: self.prompt_cache,
            entity_extractor: self.entity_extractor,
            graph_builder: self.graph_builder,
            graph_storage: self.graph_storage,
            graph_retrieval: self.graph_retrieval,
        };

        let integrations = IntegrationServices {
            webhooks: self.webhook_trigger_manager,
            calendar: self.calendar_service,
        };

        AppState::new(core, ai, tools, memory, integrations)
    }
}

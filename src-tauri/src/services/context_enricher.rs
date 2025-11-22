/**
 * Phase 5: Context Enricher (v3.9.0 - Stage 1)
 *
 * Enriches user queries with contextual information for better understanding.
 *
 * Context Sources:
 * 1. Recent conversation history (last 3 messages)
 * 2. Active window information
 * 3. Recent visual analyses (if available)
 * 4. Temporal context (time of day, day of week)
 * 5. RAG-retrieved relevant memories
 *
 * Features:
 * - Multi-source context aggregation
 * - Relevance scoring for each context piece
 * - Automatic context pruning (keeps under token limit)
 * - Configurable context priority
 */

use crate::database::Database;
use crate::services::active_window::ActiveWindowService;
use crate::services::visual_analyzer::VisualAnalyzerService;
use crate::services::rag::RagService;
use anyhow::{Context, Result};
use chrono::{Datelike, Timelike};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as TokioMutex;

/// Enriched context for a query
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnrichedContext {
    /// Original user query
    pub query: String,

    /// Enriched query with context
    pub enriched_query: String,

    /// Context pieces that were included
    pub context_pieces: Vec<ContextPiece>,

    /// Total relevance score (0.0-1.0)
    pub relevance_score: f32,

    /// Timestamp
    pub timestamp: i64,
}

/// A single piece of context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextPiece {
    /// Source of this context
    pub source: ContextSource,

    /// The actual context text
    pub content: String,

    /// Relevance score (0.0-1.0)
    pub relevance: f32,

    /// Priority (higher = more important)
    pub priority: u8,
}

/// Source of context
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ContextSource {
    /// Recent conversation messages
    Conversation,
    /// Active window/app
    ActiveWindow,
    /// Visual analysis from screen
    Visual,
    /// Temporal context (time/date)
    Temporal,
    /// RAG-retrieved memories
    Memory,
}

/// Configuration for context enricher
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextEnricherConfig {
    /// Maximum context tokens (approximate)
    pub max_tokens: usize,

    /// Number of recent conversation messages
    pub conversation_history_limit: usize,

    /// Whether to include visual context
    pub include_visual: bool,

    /// Whether to include active window context
    pub include_active_window: bool,

    /// Whether to include temporal context
    pub include_temporal: bool,

    /// Number of RAG memories to retrieve
    pub rag_memory_limit: usize,
}

impl Default for ContextEnricherConfig {
    fn default() -> Self {
        Self {
            max_tokens: 1000,
            conversation_history_limit: 3,
            include_visual: true,
            include_active_window: true,
            include_temporal: true,
            rag_memory_limit: 3,
        }
    }
}

/// Context Enricher Service
pub struct ContextEnricherService {
    db: Arc<Mutex<Database>>,
    active_window: ActiveWindowService,
    visual_analyzer: Option<Arc<TokioMutex<VisualAnalyzerService>>>,
    rag: Arc<RagService>,
    config: Arc<Mutex<ContextEnricherConfig>>,
}

impl ContextEnricherService {
    /// Create new context enricher
    pub fn new(
        db: Arc<Mutex<Database>>,
        rag: Arc<RagService>,
        visual_analyzer: Option<Arc<TokioMutex<VisualAnalyzerService>>>,
    ) -> Result<Self> {
        let active_window = ActiveWindowService::new()
            .unwrap_or_else(|e| {
                log::warn!("Failed to initialize active window service: {}", e);
                ActiveWindowService::new().unwrap()
            });

        Ok(Self {
            db,
            active_window,
            visual_analyzer,
            rag,
            config: Arc::new(Mutex::new(ContextEnricherConfig::default())),
        })
    }

    /// Enrich a user query with context
    ///
    /// # Arguments
    /// * `query` - The user's query
    /// * `conversation_id` - Optional conversation ID for history
    ///
    /// # Returns
    /// Enriched context with query and relevant context pieces
    pub async fn enrich(
        &self,
        query: &str,
        conversation_id: Option<&str>,
    ) -> Result<EnrichedContext> {
        log::info!("Enriching query: {}", &query[..query.len().min(100)]);

        let config = self.config.lock().unwrap().clone();
        let mut context_pieces = Vec::new();

        // 1. Temporal context (always quick)
        if config.include_temporal {
            if let Some(temporal) = self.get_temporal_context() {
                context_pieces.push(temporal);
            }
        }

        // 2. Active window context
        if config.include_active_window {
            if let Some(window_ctx) = self.get_active_window_context() {
                context_pieces.push(window_ctx);
            }
        }

        // 3. Conversation history
        if let Some(conv_id) = conversation_id {
            let history = self.get_conversation_context(conv_id, config.conversation_history_limit)?;
            context_pieces.extend(history);
        }

        // 4. RAG memories
        let memories = self.get_rag_context(query, config.rag_memory_limit).await?;
        context_pieces.extend(memories);

        // 5. Visual context (if available and enabled)
        if config.include_visual && self.visual_analyzer.is_some() {
            if let Some(visual) = self.get_visual_context().await {
                context_pieces.push(visual);
            }
        }

        // Sort by priority and relevance
        context_pieces.sort_by(|a, b| {
            b.priority.cmp(&a.priority)
                .then(b.relevance.partial_cmp(&a.relevance).unwrap())
        });

        // Prune to fit token limit (approximate: 4 chars = 1 token)
        let max_chars = config.max_tokens * 4;
        let mut total_chars = 0;
        let mut final_pieces = Vec::new();

        for piece in context_pieces {
            let piece_chars = piece.content.len();
            if total_chars + piece_chars <= max_chars {
                total_chars += piece_chars;
                final_pieces.push(piece);
            } else {
                break;
            }
        }

        // Build enriched query
        let enriched_query = self.build_enriched_query(query, &final_pieces);
        let relevance_score = self.calculate_relevance(&final_pieces);

        log::info!(
            "Context enriched: {} pieces, {:.2} relevance",
            final_pieces.len(),
            relevance_score
        );

        Ok(EnrichedContext {
            query: query.to_string(),
            enriched_query,
            context_pieces: final_pieces,
            relevance_score,
            timestamp: chrono::Utc::now().timestamp(),
        })
    }

    /// Get temporal context
    fn get_temporal_context(&self) -> Option<ContextPiece> {
        let now = chrono::Local::now();
        let hour = now.hour();
        let weekday = now.weekday();
        let date = now.format("%Y-%m-%d").to_string();

        let time_of_day = if hour < 12 {
            "morning"
        } else if hour < 18 {
            "afternoon"
        } else {
            "evening"
        };

        let content = format!(
            "Current time: {} {}, {} ({})",
            time_of_day,
            weekday,
            date,
            now.format("%H:%M")
        );

        Some(ContextPiece {
            source: ContextSource::Temporal,
            content,
            relevance: 0.3, // Low relevance, but always included
            priority: 1,
        })
    }

    /// Get active window context
    fn get_active_window_context(&self) -> Option<ContextPiece> {
        match self.active_window.get_active_window() {
            Ok(window_info) => {
                let content = format!(
                    "Active window: {} ({})",
                    window_info.title,
                    window_info.app_name
                );

                Some(ContextPiece {
                    source: ContextSource::ActiveWindow,
                    content,
                    relevance: 0.6, // Medium-high relevance
                    priority: 3,
                })
            }
            Err(e) => {
                log::debug!("Could not get active window: {}", e);
                None
            }
        }
    }

    /// Get conversation history context
    fn get_conversation_context(
        &self,
        conversation_id: &str,
        limit: usize,
    ) -> Result<Vec<ContextPiece>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT role, content FROM messages
             WHERE conversation_id = ?1
             ORDER BY created_at DESC
             LIMIT ?2"
        )?;

        let messages: Vec<(String, String)> = stmt
            .query_map([conversation_id, &limit.to_string()], |row| {
                Ok((row.get(0)?, row.get(1)?))
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        // Reverse to chronological order
        let messages: Vec<_> = messages.into_iter().rev().collect();

        let pieces: Vec<ContextPiece> = messages
            .into_iter()
            .enumerate()
            .map(|(i, (role, content))| {
                ContextPiece {
                    source: ContextSource::Conversation,
                    content: format!("{}: {}", role, content),
                    relevance: 0.7 + (i as f32 * 0.1), // More recent = higher relevance
                    priority: 4,
                }
            })
            .collect();

        Ok(pieces)
    }

    /// Get RAG memory context
    async fn get_rag_context(&self, query: &str, limit: usize) -> Result<Vec<ContextPiece>> {
        match self.rag.search_with_scores(query, limit).await {
            Ok(results) => {
                let pieces = results
                    .into_iter()
                    .map(|(episode, score)| {
                        let content = format!("{} - {}", episode.user_message, episode.ai_response);
                        ContextPiece {
                            source: ContextSource::Memory,
                            content,
                            relevance: score,
                            priority: 2,
                        }
                    })
                    .collect();

                Ok(pieces)
            }
            Err(e) => {
                log::warn!("Failed to retrieve RAG memories: {}", e);
                Ok(Vec::new())
            }
        }
    }

    /// Get recent visual context
    async fn get_visual_context(&self) -> Option<ContextPiece> {
        if let Some(visual_analyzer) = &self.visual_analyzer {
            let analyzer = visual_analyzer.lock().await;

            match analyzer.get_recent(1) {
                Ok(analyses) if !analyses.is_empty() => {
                    let analysis = &analyses[0];

                    let content = format!(
                        "Recent screen: {} - {}",
                        format!("{:?}", analysis.content_type),
                        analysis.description
                    );

                    Some(ContextPiece {
                        source: ContextSource::Visual,
                        content,
                        relevance: analysis.confidence,
                        priority: 3,
                    })
                }
                _ => None
            }
        } else {
            None
        }
    }

    /// Build enriched query from context pieces
    fn build_enriched_query(&self, query: &str, pieces: &[ContextPiece]) -> String {
        if pieces.is_empty() {
            return query.to_string();
        }

        let mut enriched = String::from("Context:\n");

        for piece in pieces {
            enriched.push_str(&format!("- {}\n", piece.content));
        }

        enriched.push_str(&format!("\nUser Query: {}", query));
        enriched
    }

    /// Calculate overall relevance score
    fn calculate_relevance(&self, pieces: &[ContextPiece]) -> f32 {
        if pieces.is_empty() {
            return 0.0;
        }

        let total: f32 = pieces.iter().map(|p| p.relevance).sum();
        (total / pieces.len() as f32).clamp(0.0, 1.0)
    }

    /// Update configuration
    pub fn update_config(&self, new_config: ContextEnricherConfig) {
        *self.config.lock().unwrap() = new_config;
        log::info!("Context enricher config updated");
    }

    /// Get current configuration
    pub fn get_config(&self) -> ContextEnricherConfig {
        self.config.lock().unwrap().clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_defaults() {
        let config = ContextEnricherConfig::default();
        assert_eq!(config.max_tokens, 1000);
        assert_eq!(config.conversation_history_limit, 3);
        assert!(config.include_visual);
        assert!(config.include_active_window);
        assert!(config.include_temporal);
        assert_eq!(config.rag_memory_limit, 3);
    }

    #[test]
    fn test_context_piece_sorting() {
        let pieces = vec![
            ContextPiece {
                source: ContextSource::Temporal,
                content: "low priority".to_string(),
                relevance: 0.9,
                priority: 1,
            },
            ContextPiece {
                source: ContextSource::Conversation,
                content: "high priority".to_string(),
                relevance: 0.5,
                priority: 4,
            },
        ];

        let mut sorted = pieces.clone();
        sorted.sort_by(|a, b| {
            b.priority.cmp(&a.priority)
                .then(b.relevance.partial_cmp(&a.relevance).unwrap())
        });

        assert_eq!(sorted[0].priority, 4);
    }
}

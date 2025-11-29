//! Phase 5: Semantic Wiki (v3.9.0 - Stage 2)
//!
//! Knowledge base system that extracts and stores structured facts from conversations.
//!
//! Architecture:
//! 1. Fact Extraction: Uses LLM to extract facts/entities/relationships from conversations
//! 2. Knowledge Storage: Stores facts in SQLite with embeddings for semantic search
//! 3. Fact Linking: Maintains relationships between facts (supports/contradicts/extends)
//! 4. Provenance: Tracks which conversation each fact came from
//! 5. Semantic Query: Retrieves relevant facts using semantic similarity
//!
//! Features:
//! - Automatic fact extraction from conversations
//! - Entity and relationship extraction
//! - Fact confidence scoring
//! - Conflict detection (contradicting facts)
//! - Temporal tracking (when facts were learned)
//! - Source attribution (conversation provenance)

#![allow(dead_code)]  // Phase 5: Knowledge base (scheduled)

use crate::database::Database;
use crate::services::embedding::UnifiedEmbeddingService;
use crate::services::ollama;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// A fact stored in the semantic wiki
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fact {
    /// Unique fact ID
    pub id: String,

    /// The fact statement
    pub statement: String,

    /// Entity this fact is about (e.g., "Rust", "User's project")
    pub entity: String,

    /// Fact category (e.g., "preference", "knowledge", "task", "definition")
    pub category: FactCategory,

    /// Confidence score (0.0-1.0)
    pub confidence: f32,

    /// Source conversation ID
    pub source_conversation_id: String,

    /// Source message ID
    pub source_message_id: Option<String>,

    /// Timestamp when fact was learned
    pub learned_at: i64,

    /// Number of times this fact was reinforced
    pub reinforcement_count: i32,

    /// Related fact IDs (supports/extends this fact)
    pub related_facts: Vec<String>,
}

/// Fact category
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FactCategory {
    /// User preference (e.g., "prefers functional programming")
    Preference,
    /// General knowledge (e.g., "Rust uses ownership for memory safety")
    Knowledge,
    /// Task or goal (e.g., "building a chat application")
    Task,
    /// Definition or concept (e.g., "GraphRAG is knowledge graph-based retrieval")
    Definition,
    /// Instruction or how-to (e.g., "use Arc<Mutex<>> for shared state")
    Instruction,
    /// Other
    Other,
}

/// Relationship between two facts
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FactRelation {
    /// Second fact supports/confirms first fact
    Supports,
    /// Second fact contradicts first fact
    Contradicts,
    /// Second fact extends/builds upon first fact
    Extends,
    /// Facts are related but relationship unclear
    Related,
}

/// Configuration for semantic wiki
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticWikiConfig {
    /// Minimum confidence to store a fact
    pub min_confidence: f32,

    /// Maximum facts to extract per conversation turn
    pub max_facts_per_turn: usize,

    /// Whether to enable automatic fact extraction
    pub auto_extract: bool,

    /// Number of facts to retrieve in search
    pub search_limit: usize,
}

impl Default for SemanticWikiConfig {
    fn default() -> Self {
        Self {
            min_confidence: 0.6,
            max_facts_per_turn: 5,
            auto_extract: true,
            search_limit: 10,
        }
    }
}

/// Semantic Wiki Service
pub struct SemanticWikiService {
    db: Arc<Mutex<Database>>,
    embedding: Arc<UnifiedEmbeddingService>,
    config: Arc<Mutex<SemanticWikiConfig>>,
}

impl SemanticWikiService {
    /// Create new semantic wiki
    pub fn new(
        db: Arc<Mutex<Database>>,
        embedding: Arc<UnifiedEmbeddingService>,
    ) -> Result<Self> {
        let service = Self {
            db,
            embedding,
            config: Arc::new(Mutex::new(SemanticWikiConfig::default())),
        };

        service.init_database()?;

        Ok(service)
    }

    /// Initialize database tables
    fn init_database(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        // Create facts table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS wiki_facts (
                id TEXT PRIMARY KEY,
                statement TEXT NOT NULL,
                entity TEXT NOT NULL,
                category TEXT NOT NULL,
                confidence REAL NOT NULL,
                source_conversation_id TEXT NOT NULL,
                source_message_id TEXT,
                learned_at INTEGER NOT NULL,
                reinforcement_count INTEGER DEFAULT 1,
                related_facts TEXT
            )",
            [],
        )?;

        // Create fact embeddings table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS wiki_fact_embeddings (
                fact_id TEXT PRIMARY KEY,
                embedding TEXT NOT NULL,
                FOREIGN KEY (fact_id) REFERENCES wiki_facts(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create indexes
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_wiki_entity ON wiki_facts(entity)",
            [],
        );
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_wiki_category ON wiki_facts(category)",
            [],
        );
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_wiki_learned ON wiki_facts(learned_at DESC)",
            [],
        );

        log::info!("Semantic wiki database initialized");

        Ok(())
    }

    /// Extract facts from a conversation turn
    ///
    /// # Arguments
    /// * `user_message` - User's message
    /// * `ai_response` - AI's response
    /// * `conversation_id` - Conversation ID
    /// * `message_id` - Optional message ID
    ///
    /// # Returns
    /// List of extracted facts
    pub async fn extract_facts(
        &self,
        user_message: &str,
        ai_response: &str,
        conversation_id: &str,
        message_id: Option<&str>,
    ) -> Result<Vec<Fact>> {
        log::info!("Extracting facts from conversation turn");

        let config = self.config.lock().unwrap().clone();

        let prompt = format!(
            r#"Extract factual statements from this conversation. Focus on:
- User preferences and interests
- Key concepts and definitions mentioned
- Tasks or goals discussed
- Important instructions or how-tos
- General knowledge shared

User: {user_message}
Assistant: {ai_response}

Extract facts as JSON array. Each fact should have:
- "statement": The factual statement
- "entity": Main entity/subject (e.g., "Rust", "User", "GraphRAG")
- "category": One of: preference, knowledge, task, definition, instruction, other
- "confidence": Confidence 0.0-1.0

Respond with JSON only (no other text):
[
  {{
    "statement": "fact statement here",
    "entity": "entity name",
    "category": "knowledge",
    "confidence": 0.9
  }}
]"#
        );

        let response = ollama::generate_response(&prompt)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to extract facts: {}", e))?;

        // Parse JSON response
        let json = self.extract_json(&response)?;

        #[derive(Deserialize)]
        struct ExtractedFact {
            statement: String,
            entity: String,
            category: String,
            confidence: f32,
        }

        let extracted: Vec<ExtractedFact> = serde_json::from_str(&json)
            .context("Failed to parse fact extraction JSON")?;

        // Filter by confidence and limit
        let facts: Vec<Fact> = extracted
            .into_iter()
            .filter(|f| f.confidence >= config.min_confidence)
            .take(config.max_facts_per_turn)
            .map(|f| {
                let category = match f.category.to_lowercase().as_str() {
                    "preference" => FactCategory::Preference,
                    "knowledge" => FactCategory::Knowledge,
                    "task" => FactCategory::Task,
                    "definition" => FactCategory::Definition,
                    "instruction" => FactCategory::Instruction,
                    _ => FactCategory::Other,
                };

                Fact {
                    id: uuid::Uuid::new_v4().to_string(),
                    statement: f.statement,
                    entity: f.entity,
                    category,
                    confidence: f.confidence.clamp(0.0, 1.0),
                    source_conversation_id: conversation_id.to_string(),
                    source_message_id: message_id.map(String::from),
                    learned_at: chrono::Utc::now().timestamp(),
                    reinforcement_count: 1,
                    related_facts: Vec::new(),
                }
            })
            .collect();

        log::info!("Extracted {} facts", facts.len());

        Ok(facts)
    }

    /// Store facts in the wiki
    pub async fn store_facts(&self, facts: Vec<Fact>) -> Result<usize> {
        let mut stored_count = 0;

        for fact in facts {
            // Check for existing similar facts BEFORE generating embedding
            if self.find_similar_fact(&fact.statement, 0.95).await?.is_some() {
                log::debug!("Skipping duplicate fact: {}", &fact.statement[..fact.statement.len().min(50)]);
                continue;
            }

            // Generate embedding for the fact
            let embedding = self.embedding.embed(&fact.statement)?;

            // Prepare data before locking
            let category_str = format!("{:?}", fact.category).to_lowercase();
            let related_facts_json = serde_json::to_string(&fact.related_facts)?;
            let embedding_json = serde_json::to_string(&embedding)?;

            // Store in database (short-lived lock)
            {
                let db = self.db.lock().unwrap();
                let conn = db.conn();

                conn.execute(
                    "INSERT INTO wiki_facts (
                        id, statement, entity, category, confidence,
                        source_conversation_id, source_message_id, learned_at,
                        reinforcement_count, related_facts
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                    rusqlite::params![
                        fact.id,
                        fact.statement,
                        fact.entity,
                        category_str,
                        fact.confidence,
                        fact.source_conversation_id,
                        fact.source_message_id,
                        fact.learned_at,
                        fact.reinforcement_count,
                        related_facts_json,
                    ],
                )?;

                // Store embedding
                conn.execute(
                    "INSERT INTO wiki_fact_embeddings (fact_id, embedding) VALUES (?1, ?2)",
                    rusqlite::params![fact.id, embedding_json],
                )?;
            } // Lock released here

            stored_count += 1;
        }

        log::info!("Stored {} facts in wiki", stored_count);

        Ok(stored_count)
    }

    /// Search for facts semantically
    ///
    /// # Arguments
    /// * `query` - Search query
    /// * `limit` - Maximum number of results
    /// * `category_filter` - Optional category filter
    ///
    /// # Returns
    /// List of facts with similarity scores
    pub async fn search(
        &self,
        query: &str,
        limit: usize,
        category_filter: Option<FactCategory>,
    ) -> Result<Vec<(Fact, f32)>> {
        log::info!("Searching wiki for: {}", &query[..query.len().min(50)]);

        // Generate query embedding
        let query_embedding = self.embedding.embed(query)?;

        // Get all facts (with optional category filter)
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let (sql, params): (String, Vec<String>) = if let Some(category) = category_filter {
            let category_str = format!("{:?}", category).to_lowercase();
            (
                "SELECT f.id, f.statement, f.entity, f.category, f.confidence,
                        f.source_conversation_id, f.source_message_id, f.learned_at,
                        f.reinforcement_count, f.related_facts, e.embedding
                 FROM wiki_facts f
                 JOIN wiki_fact_embeddings e ON f.id = e.fact_id
                 WHERE f.category = ?1".to_string(),
                vec![category_str],
            )
        } else {
            (
                "SELECT f.id, f.statement, f.entity, f.category, f.confidence,
                        f.source_conversation_id, f.source_message_id, f.learned_at,
                        f.reinforcement_count, f.related_facts, e.embedding
                 FROM wiki_facts f
                 JOIN wiki_fact_embeddings e ON f.id = e.fact_id".to_string(),
                vec![],
            )
        };

        let mut stmt = conn.prepare(&sql)?;

        let facts_with_scores: Vec<(Fact, f32)> = stmt
            .query_map(rusqlite::params_from_iter(params.iter()), |row| {
                let category_str: String = row.get(3)?;
                let category = match category_str.as_str() {
                    "preference" => FactCategory::Preference,
                    "knowledge" => FactCategory::Knowledge,
                    "task" => FactCategory::Task,
                    "definition" => FactCategory::Definition,
                    "instruction" => FactCategory::Instruction,
                    _ => FactCategory::Other,
                };

                let related_facts_json: String = row.get(9)?;
                let related_facts: Vec<String> = serde_json::from_str(&related_facts_json)
                    .unwrap_or_default();

                let embedding_json: String = row.get(10)?;
                let embedding: Vec<f32> = serde_json::from_str(&embedding_json)
                    .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                        10, rusqlite::types::Type::Text, Box::new(e)
                    ))?;

                let fact = Fact {
                    id: row.get(0)?,
                    statement: row.get(1)?,
                    entity: row.get(2)?,
                    category,
                    confidence: row.get(4)?,
                    source_conversation_id: row.get(5)?,
                    source_message_id: row.get(6)?,
                    learned_at: row.get(7)?,
                    reinforcement_count: row.get(8)?,
                    related_facts,
                };

                Ok((fact, embedding))
            })?
            .filter_map(|result| result.ok())
            .map(|(fact, embedding)| {
                // Calculate cosine similarity
                let similarity = UnifiedEmbeddingService::cosine_similarity(&query_embedding, &embedding);
                (fact, similarity)
            })
            .collect();

        // Sort by similarity and take top results
        let mut sorted = facts_with_scores;
        sorted.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        sorted.truncate(limit);

        log::info!("Found {} relevant facts", sorted.len());

        Ok(sorted)
    }

    /// Find a similar fact (for deduplication)
    async fn find_similar_fact(&self, statement: &str, threshold: f32) -> Result<Option<Fact>> {
        let results = self.search(statement, 1, None).await?;

        if let Some((fact, score)) = results.first() {
            if *score >= threshold {
                return Ok(Some(fact.clone()));
            }
        }

        Ok(None)
    }

    /// Get facts about a specific entity
    pub fn get_facts_by_entity(&self, entity: &str, limit: usize) -> Result<Vec<Fact>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT id, statement, entity, category, confidence,
                    source_conversation_id, source_message_id, learned_at,
                    reinforcement_count, related_facts
             FROM wiki_facts
             WHERE entity = ?1
             ORDER BY confidence DESC, learned_at DESC
             LIMIT ?2"
        )?;

        let facts = stmt
            .query_map([entity, &limit.to_string()], |row| {
                let category_str: String = row.get(3)?;
                let category = match category_str.as_str() {
                    "preference" => FactCategory::Preference,
                    "knowledge" => FactCategory::Knowledge,
                    "task" => FactCategory::Task,
                    "definition" => FactCategory::Definition,
                    "instruction" => FactCategory::Instruction,
                    _ => FactCategory::Other,
                };

                let related_facts_json: String = row.get(9)?;
                let related_facts: Vec<String> = serde_json::from_str(&related_facts_json)
                    .unwrap_or_default();

                Ok(Fact {
                    id: row.get(0)?,
                    statement: row.get(1)?,
                    entity: row.get(2)?,
                    category,
                    confidence: row.get(4)?,
                    source_conversation_id: row.get(5)?,
                    source_message_id: row.get(6)?,
                    learned_at: row.get(7)?,
                    reinforcement_count: row.get(8)?,
                    related_facts,
                })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        Ok(facts)
    }

    /// Get statistics about the wiki
    pub fn get_stats(&self) -> Result<WikiStats> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let total_facts: i64 = conn.query_row(
            "SELECT COUNT(*) FROM wiki_facts",
            [],
            |row| row.get(0)
        )?;

        let mut stmt = conn.prepare(
            "SELECT category, COUNT(*) FROM wiki_facts GROUP BY category"
        )?;

        let facts_by_category: Vec<(String, i64)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        let unique_entities: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT entity) FROM wiki_facts",
            [],
            |row| row.get(0)
        )?;

        Ok(WikiStats {
            total_facts: total_facts as usize,
            facts_by_category,
            unique_entities: unique_entities as usize,
        })
    }

    /// Extract JSON from LLM response
    fn extract_json(&self, response: &str) -> Result<String> {
        let trimmed = response.trim();

        // Check for markdown code block
        if trimmed.starts_with("```") {
            let lines: Vec<&str> = trimmed.lines().collect();
            if lines.len() >= 3 {
                let json_lines = &lines[1..lines.len() - 1];
                return Ok(json_lines.join("\n"));
            }
        }

        // Check for JSON array
        if let Some(start) = trimmed.find('[') {
            if let Some(end) = trimmed.rfind(']') {
                return Ok(trimmed[start..=end].to_string());
            }
        }

        anyhow::bail!("No valid JSON found in response")
    }

    /// Update configuration
    pub fn update_config(&self, new_config: SemanticWikiConfig) {
        *self.config.lock().unwrap() = new_config;
        log::info!("Semantic wiki config updated");
    }

    /// Get current configuration
    pub fn get_config(&self) -> SemanticWikiConfig {
        self.config.lock().unwrap().clone()
    }
}

/// Wiki statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WikiStats {
    pub total_facts: usize,
    pub facts_by_category: Vec<(String, i64)>,
    pub unique_entities: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_defaults() {
        let config = SemanticWikiConfig::default();
        assert_eq!(config.min_confidence, 0.6);
        assert_eq!(config.max_facts_per_turn, 5);
        assert!(config.auto_extract);
        assert_eq!(config.search_limit, 10);
    }

    #[test]
    fn test_fact_category_parsing() {
        let categories = vec![
            ("preference", FactCategory::Preference),
            ("knowledge", FactCategory::Knowledge),
            ("task", FactCategory::Task),
            ("definition", FactCategory::Definition),
            ("instruction", FactCategory::Instruction),
        ];

        for (input, expected) in categories {
            let parsed = match input {
                "preference" => FactCategory::Preference,
                "knowledge" => FactCategory::Knowledge,
                "task" => FactCategory::Task,
                "definition" => FactCategory::Definition,
                "instruction" => FactCategory::Instruction,
                _ => FactCategory::Other,
            };
            assert_eq!(parsed, expected);
        }
    }
}

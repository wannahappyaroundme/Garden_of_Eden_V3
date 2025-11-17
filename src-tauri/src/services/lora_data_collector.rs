// v3.8.0 Phase 3.1: LoRA Training Data Collection Service
//
// This service collects high-quality conversation data for LoRA fine-tuning.
// It filters conversations based on user satisfaction, formats them for
// training frameworks (LLaMA-Factory, Axolotl, etc.), and exports them in
// standard formats (JSONL, Alpaca, ShareGPT).

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::Mutex;
use anyhow::{Result as AnyhowResult, Context};
use chrono::Utc;
use uuid::Uuid;

use crate::database::Database;

/// Training data format (compatible with fine-tuning frameworks)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TrainingFormat {
    /// Alpaca format (instruction, input, output)
    Alpaca,
    /// ShareGPT format (multi-turn conversations with roles)
    ShareGPT,
    /// Raw JSONL format (system, user, assistant)
    JSONL,
}

/// Training data quality filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataFilter {
    /// Minimum satisfaction score (0.0-1.0) to include in training data
    pub min_satisfaction: f32,
    /// Minimum message length to include
    pub min_message_length: usize,
    /// Maximum message length to include (avoid outliers)
    pub max_message_length: usize,
    /// Include only conversations with positive feedback
    pub positive_only: bool,
    /// Exclude conversations with negative feedback
    pub exclude_negative: bool,
    /// Minimum conversation turns (multi-turn preferred for context learning)
    pub min_turns: usize,
}

impl Default for DataFilter {
    fn default() -> Self {
        Self {
            min_satisfaction: 0.7,       // Only high-quality conversations
            min_message_length: 10,       // Avoid trivial messages
            max_message_length: 4000,     // Avoid extremely long messages
            positive_only: false,         // Include neutral conversations
            exclude_negative: true,       // Exclude poor conversations
            min_turns: 2,                 // Multi-turn preferred
        }
    }
}

/// Alpaca format training example
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlpacaExample {
    pub instruction: String,
    pub input: String,
    pub output: String,
}

/// ShareGPT format training example
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareGPTExample {
    pub conversations: Vec<ShareGPTMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareGPTMessage {
    pub from: String,      // "human", "gpt", "system"
    pub value: String,
}

/// Raw JSONL format training example
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JSONLExample {
    pub system: String,
    pub user: String,
    pub assistant: String,
    pub satisfaction: f32,
    pub timestamp: i64,
}

/// Training dataset metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatasetMetadata {
    pub id: String,
    pub name: String,
    pub description: String,
    pub format: TrainingFormat,
    pub total_examples: usize,
    pub avg_satisfaction: f32,
    pub created_at: i64,
    pub filter_config: String, // JSON serialized DataFilter
}

/// LoRA training data collection service
pub struct LoRADataCollectorService {
    db: Arc<Mutex<Database>>,
    filter: DataFilter,
}

impl LoRADataCollectorService {
    /// Create a new LoRA data collector with default filter
    pub fn new(db: Arc<Mutex<Database>>) -> AnyhowResult<Self> {
        Ok(Self {
            db,
            filter: DataFilter::default(),
        })
    }

    /// Create with custom filter
    pub fn with_filter(db: Arc<Mutex<Database>>, filter: DataFilter) -> AnyhowResult<Self> {
        Ok(Self { db, filter })
    }

    /// Update data filter
    pub fn set_filter(&mut self, filter: DataFilter) {
        self.filter = filter;
    }

    /// Get current filter
    pub fn get_filter(&self) -> &DataFilter {
        &self.filter
    }

    /// Collect training data from database
    /// Returns (examples, metadata)
    pub fn collect_training_data(
        &self,
        format: TrainingFormat,
        limit: Option<usize>,
    ) -> AnyhowResult<(Vec<serde_json::Value>, DatasetMetadata)> {
        let db = self.db.lock().map_err(|e| anyhow::anyhow!("Failed to lock database: {}", e))?;

        // Query conversations with satisfaction scores
        let conversations = self.query_quality_conversations(&db, limit)?;

        log::info!(
            "Collected {} conversations for training data (format: {:?})",
            conversations.len(),
            format
        );

        // Convert to requested format
        let examples = match format {
            TrainingFormat::Alpaca => self.convert_to_alpaca(&conversations)?,
            TrainingFormat::ShareGPT => self.convert_to_sharegpt(&conversations)?,
            TrainingFormat::JSONL => self.convert_to_jsonl(&conversations)?,
        };

        // Calculate metadata
        let avg_satisfaction = if !conversations.is_empty() {
            conversations.iter().map(|(_, _, sat, _)| sat).sum::<f32>() / conversations.len() as f32
        } else {
            0.0
        };

        let metadata = DatasetMetadata {
            id: Uuid::new_v4().to_string(),
            name: format!("training_dataset_{}", Utc::now().format("%Y%m%d_%H%M%S")),
            description: format!("LoRA training dataset ({:?} format) with {} examples", format, examples.len()),
            format,
            total_examples: examples.len(),
            avg_satisfaction,
            created_at: Utc::now().timestamp_millis(),
            filter_config: serde_json::to_string(&self.filter).unwrap_or_default(),
        };

        log::info!("Dataset metadata: {} examples, avg satisfaction: {:.2}", metadata.total_examples, metadata.avg_satisfaction);

        Ok((examples, metadata))
    }

    /// Query high-quality conversations from database
    /// Returns: Vec<(user_message, ai_response, satisfaction, timestamp)>
    fn query_quality_conversations(
        &self,
        db: &Database,
        limit: Option<usize>,
    ) -> AnyhowResult<Vec<(String, String, f32, i64)>> {
        let mut conversations = Vec::new();

        // Query episodic memory with satisfaction scores
        let query = if let Some(limit_count) = limit {
            format!(
                "SELECT user_message, ai_response, satisfaction, created_at
                 FROM episodic_memory
                 WHERE satisfaction >= ?1
                 ORDER BY satisfaction DESC, created_at DESC
                 LIMIT {}",
                limit_count
            )
        } else {
            "SELECT user_message, ai_response, satisfaction, created_at
             FROM episodic_memory
             WHERE satisfaction >= ?1
             ORDER BY satisfaction DESC, created_at DESC"
                .to_string()
        };

        let mut stmt = db.conn()
            .prepare(&query)
            .context("Failed to prepare query for training data")?;

        let rows = stmt
            .query_map([self.filter.min_satisfaction], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, f32>(2)?,
                    row.get::<_, i64>(3)?,
                ))
            })
            .context("Failed to query training data")?;

        for row_result in rows {
            let (user_msg, ai_resp, satisfaction, timestamp) = row_result?;

            // Apply filters
            if !self.passes_filter(&user_msg, &ai_resp, satisfaction) {
                continue;
            }

            conversations.push((user_msg, ai_resp, satisfaction, timestamp));
        }

        Ok(conversations)
    }

    /// Check if conversation passes quality filter
    fn passes_filter(&self, user_msg: &str, ai_resp: &str, satisfaction: f32) -> bool {
        // Message length filters
        if user_msg.len() < self.filter.min_message_length || ai_resp.len() < self.filter.min_message_length {
            return false;
        }

        if user_msg.len() > self.filter.max_message_length || ai_resp.len() > self.filter.max_message_length {
            return false;
        }

        // Satisfaction filters
        if self.filter.positive_only && satisfaction < 0.8 {
            return false;
        }

        if self.filter.exclude_negative && satisfaction < 0.5 {
            return false;
        }

        // Quality checks
        // Exclude extremely short or repetitive messages
        if user_msg.trim().is_empty() || ai_resp.trim().is_empty() {
            return false;
        }

        // Exclude conversations with only single character or emoji responses
        if user_msg.trim().chars().count() < 3 || ai_resp.trim().chars().count() < 3 {
            return false;
        }

        true
    }

    /// Convert conversations to Alpaca format
    fn convert_to_alpaca(
        &self,
        conversations: &[(String, String, f32, i64)],
    ) -> AnyhowResult<Vec<serde_json::Value>> {
        let mut examples = Vec::new();

        for (user_msg, ai_resp, _, _) in conversations {
            let example = AlpacaExample {
                instruction: user_msg.clone(),
                input: String::new(), // Alpaca format uses empty input for instruction-only tasks
                output: ai_resp.clone(),
            };

            examples.push(serde_json::to_value(example)?);
        }

        Ok(examples)
    }

    /// Convert conversations to ShareGPT format
    fn convert_to_sharegpt(
        &self,
        conversations: &[(String, String, f32, i64)],
    ) -> AnyhowResult<Vec<serde_json::Value>> {
        let mut examples = Vec::new();

        for (user_msg, ai_resp, _, _) in conversations {
            let example = ShareGPTExample {
                conversations: vec![
                    ShareGPTMessage {
                        from: "human".to_string(),
                        value: user_msg.clone(),
                    },
                    ShareGPTMessage {
                        from: "gpt".to_string(),
                        value: ai_resp.clone(),
                    },
                ],
            };

            examples.push(serde_json::to_value(example)?);
        }

        Ok(examples)
    }

    /// Convert conversations to JSONL format
    fn convert_to_jsonl(
        &self,
        conversations: &[(String, String, f32, i64)],
    ) -> AnyhowResult<Vec<serde_json::Value>> {
        let mut examples = Vec::new();

        for (user_msg, ai_resp, satisfaction, timestamp) in conversations {
            let example = JSONLExample {
                system: "You are a helpful AI assistant.".to_string(),
                user: user_msg.clone(),
                assistant: ai_resp.clone(),
                satisfaction: *satisfaction,
                timestamp: *timestamp,
            };

            examples.push(serde_json::to_value(example)?);
        }

        Ok(examples)
    }

    /// Export training data to file
    pub fn export_to_file(
        &self,
        format: TrainingFormat,
        output_path: &str,
        limit: Option<usize>,
    ) -> AnyhowResult<DatasetMetadata> {
        let (examples, metadata) = self.collect_training_data(format, limit)?;

        // Write to file
        let file = std::fs::File::create(output_path)
            .context(format!("Failed to create output file: {}", output_path))?;

        let writer = std::io::BufWriter::new(file);

        let example_count = examples.len();

        match format {
            TrainingFormat::JSONL => {
                // Write as newline-delimited JSON
                let mut writer = std::io::BufWriter::new(
                    std::fs::File::create(output_path)
                        .context(format!("Failed to create JSONL file: {}", output_path))?,
                );

                for example in &examples {
                    serde_json::to_writer(&mut writer, example)?;
                    std::io::Write::write_all(&mut writer, b"\n")?;
                }
            }
            _ => {
                // Write as JSON array
                serde_json::to_writer_pretty(writer, &examples)?;
            }
        }

        log::info!("Exported {} examples to {}", example_count, output_path);

        // Also write metadata file
        let metadata_path = format!("{}.metadata.json", output_path);
        let metadata_file = std::fs::File::create(&metadata_path)
            .context("Failed to create metadata file")?;
        serde_json::to_writer_pretty(std::io::BufWriter::new(metadata_file), &metadata)?;

        log::info!("Exported metadata to {}", metadata_path);

        Ok(metadata)
    }

    /// Get statistics about available training data
    pub fn get_dataset_statistics(&self) -> AnyhowResult<DatasetStatistics> {
        let db = self.db.lock().map_err(|e| anyhow::anyhow!("Failed to lock database: {}", e))?;

        // Count total conversations
        let total_conversations: i64 = db.conn()
            .query_row("SELECT COUNT(*) FROM episodic_memory", [], |row| row.get(0))
            .context("Failed to count total conversations")?;

        // Count high-quality conversations (satisfaction >= 0.7)
        let high_quality: i64 = db.conn()
            .query_row(
                "SELECT COUNT(*) FROM episodic_memory WHERE satisfaction >= 0.7",
                [],
                |row| row.get(0),
            )
            .context("Failed to count high-quality conversations")?;

        // Count positive conversations (satisfaction >= 0.8)
        let positive: i64 = db.conn()
            .query_row(
                "SELECT COUNT(*) FROM episodic_memory WHERE satisfaction >= 0.8",
                [],
                |row| row.get(0),
            )
            .context("Failed to count positive conversations")?;

        // Count negative conversations (satisfaction < 0.5)
        let negative: i64 = db.conn()
            .query_row(
                "SELECT COUNT(*) FROM episodic_memory WHERE satisfaction < 0.5",
                [],
                |row| row.get(0),
            )
            .context("Failed to count negative conversations")?;

        // Average satisfaction
        let avg_satisfaction: f32 = db.conn()
            .query_row(
                "SELECT AVG(satisfaction) FROM episodic_memory",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        Ok(DatasetStatistics {
            total_conversations: total_conversations as usize,
            high_quality_conversations: high_quality as usize,
            positive_conversations: positive as usize,
            negative_conversations: negative as usize,
            avg_satisfaction,
            filter_config: self.filter.clone(),
        })
    }
}

/// Dataset statistics
#[derive(Debug, Clone, Serialize)]
pub struct DatasetStatistics {
    pub total_conversations: usize,
    pub high_quality_conversations: usize,
    pub positive_conversations: usize,
    pub negative_conversations: usize,
    pub avg_satisfaction: f32,
    #[serde(skip_serializing)]
    pub filter_config: DataFilter,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use std::sync::{Arc, Mutex};

    fn create_test_db() -> Arc<Mutex<Database>> {
        let db = Database::new_test_db().unwrap();
        Arc::new(Mutex::new(db))
    }

    fn insert_test_conversations(db: &Arc<Mutex<Database>>) {
        let db_lock = db.lock().unwrap();
        let conn = db_lock.conn();

        // Insert high-quality conversation
        conn.execute(
            "INSERT INTO episodic_memory (id, user_message, ai_response, satisfaction, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                Uuid::new_v4().to_string(),
                "How do I implement error handling in Rust?",
                "In Rust, error handling is primarily done using Result<T, E> and Option<T>...",
                0.9,
                Utc::now().timestamp_millis(),
            ],
        )
        .unwrap();

        // Insert medium-quality conversation
        conn.execute(
            "INSERT INTO episodic_memory (id, user_message, ai_response, satisfaction, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                Uuid::new_v4().to_string(),
                "What's the weather?",
                "I don't have access to weather data.",
                0.6,
                Utc::now().timestamp_millis(),
            ],
        )
        .unwrap();

        // Insert low-quality conversation
        conn.execute(
            "INSERT INTO episodic_memory (id, user_message, ai_response, satisfaction, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                Uuid::new_v4().to_string(),
                "Hi",
                "Hello",
                0.3,
                Utc::now().timestamp_millis(),
            ],
        )
        .unwrap();
    }

    #[test]
    fn test_data_filter_defaults() {
        let filter = DataFilter::default();
        assert_eq!(filter.min_satisfaction, 0.7);
        assert_eq!(filter.min_message_length, 10);
        assert_eq!(filter.max_message_length, 4000);
        assert!(!filter.positive_only);
        assert!(filter.exclude_negative);
        assert_eq!(filter.min_turns, 2);
    }

    #[test]
    fn test_passes_filter() {
        let db = create_test_db();
        let collector = LoRADataCollectorService::new(db).unwrap();

        // Should pass
        assert!(collector.passes_filter(
            "This is a good question about Rust programming",
            "Here is a detailed answer with examples...",
            0.9
        ));

        // Should fail: too short
        assert!(!collector.passes_filter("Hi", "Hello", 0.9));

        // Should fail: low satisfaction
        assert!(!collector.passes_filter(
            "This is a good question",
            "This is a good answer",
            0.3
        ));
    }

    #[test]
    fn test_collect_training_data_alpaca() {
        let db = create_test_db();
        insert_test_conversations(&db);

        let collector = LoRADataCollectorService::new(Arc::clone(&db)).unwrap();
        let (examples, metadata) = collector
            .collect_training_data(TrainingFormat::Alpaca, None)
            .unwrap();

        assert!(examples.len() >= 1, "Should collect at least 1 high-quality conversation");
        assert_eq!(metadata.format, TrainingFormat::Alpaca);
        assert!(metadata.avg_satisfaction >= 0.7);

        // Verify Alpaca format structure
        let first_example: AlpacaExample = serde_json::from_value(examples[0].clone()).unwrap();
        assert!(!first_example.instruction.is_empty());
        assert!(!first_example.output.is_empty());
    }

    #[test]
    fn test_collect_training_data_sharegpt() {
        let db = create_test_db();
        insert_test_conversations(&db);

        let collector = LoRADataCollectorService::new(Arc::clone(&db)).unwrap();
        let (examples, metadata) = collector
            .collect_training_data(TrainingFormat::ShareGPT, None)
            .unwrap();

        assert!(examples.len() >= 1);
        assert_eq!(metadata.format, TrainingFormat::ShareGPT);

        // Verify ShareGPT format structure
        let first_example: ShareGPTExample = serde_json::from_value(examples[0].clone()).unwrap();
        assert_eq!(first_example.conversations.len(), 2);
        assert_eq!(first_example.conversations[0].from, "human");
        assert_eq!(first_example.conversations[1].from, "gpt");
    }

    #[test]
    fn test_collect_training_data_jsonl() {
        let db = create_test_db();
        insert_test_conversations(&db);

        let collector = LoRADataCollectorService::new(Arc::clone(&db)).unwrap();
        let (examples, metadata) = collector
            .collect_training_data(TrainingFormat::JSONL, None)
            .unwrap();

        assert!(examples.len() >= 1);
        assert_eq!(metadata.format, TrainingFormat::JSONL);

        // Verify JSONL format structure
        let first_example: JSONLExample = serde_json::from_value(examples[0].clone()).unwrap();
        assert!(!first_example.system.is_empty());
        assert!(!first_example.user.is_empty());
        assert!(!first_example.assistant.is_empty());
        assert!(first_example.satisfaction >= 0.7);
    }

    #[test]
    fn test_get_dataset_statistics() {
        let db = create_test_db();
        insert_test_conversations(&db);

        let collector = LoRADataCollectorService::new(Arc::clone(&db)).unwrap();
        let stats = collector.get_dataset_statistics().unwrap();

        assert_eq!(stats.total_conversations, 3);
        assert!(stats.high_quality_conversations >= 1);
        assert!(stats.positive_conversations >= 1);
        assert!(stats.negative_conversations >= 1);
        assert!(stats.avg_satisfaction > 0.0);
    }

    #[test]
    fn test_custom_filter() {
        let db = create_test_db();
        insert_test_conversations(&db);

        let custom_filter = DataFilter {
            min_satisfaction: 0.8,
            min_message_length: 5,
            max_message_length: 5000,
            positive_only: true,
            exclude_negative: true,
            min_turns: 1,
        };

        let collector = LoRADataCollectorService::with_filter(Arc::clone(&db), custom_filter).unwrap();
        let (examples, _) = collector
            .collect_training_data(TrainingFormat::JSONL, None)
            .unwrap();

        // Should only get high-quality conversations (satisfaction >= 0.8)
        for example in examples {
            let jsonl: JSONLExample = serde_json::from_value(example).unwrap();
            assert!(jsonl.satisfaction >= 0.8, "All examples should have satisfaction >= 0.8");
        }
    }

    #[test]
    fn test_limit_parameter() {
        let db = create_test_db();
        insert_test_conversations(&db);

        let collector = LoRADataCollectorService::new(Arc::clone(&db)).unwrap();
        let (examples, _) = collector
            .collect_training_data(TrainingFormat::JSONL, Some(1))
            .unwrap();

        assert!(
            examples.len() <= 1,
            "Should respect limit parameter, got {}",
            examples.len()
        );
    }

    #[test]
    fn test_export_to_file() {
        let db = create_test_db();
        insert_test_conversations(&db);

        let collector = LoRADataCollectorService::new(Arc::clone(&db)).unwrap();

        let temp_dir = std::env::temp_dir();
        let output_path = temp_dir.join("test_training_data.json");
        let output_path_str = output_path.to_str().unwrap();

        let metadata = collector
            .export_to_file(TrainingFormat::Alpaca, output_path_str, None)
            .unwrap();

        assert!(output_path.exists(), "Output file should exist");
        assert!(metadata.total_examples >= 1);

        // Verify metadata file
        let metadata_path = format!("{}.metadata.json", output_path_str);
        assert!(
            std::path::Path::new(&metadata_path).exists(),
            "Metadata file should exist"
        );

        // Cleanup
        std::fs::remove_file(output_path).ok();
        std::fs::remove_file(metadata_path).ok();
    }

    #[test]
    fn test_export_jsonl_format() {
        let db = create_test_db();
        insert_test_conversations(&db);

        let collector = LoRADataCollectorService::new(Arc::clone(&db)).unwrap();

        let temp_dir = std::env::temp_dir();
        let output_path = temp_dir.join("test_training_data.jsonl");
        let output_path_str = output_path.to_str().unwrap().to_string();
        let metadata_path = format!("{}.metadata.json", output_path_str);

        collector
            .export_to_file(TrainingFormat::JSONL, &output_path_str, None)
            .unwrap();

        assert!(output_path.exists());

        // Verify JSONL format (newline-delimited JSON)
        let content = std::fs::read_to_string(&output_path).unwrap();
        let lines: Vec<&str> = content.lines().collect();
        assert!(lines.len() >= 1, "Should have at least one line");

        // Each line should be valid JSON
        for line in lines {
            if line.trim().is_empty() {
                continue;
            }
            let _: JSONLExample = serde_json::from_str(line).unwrap();
        }

        // Cleanup
        std::fs::remove_file(output_path).ok();
        std::fs::remove_file(metadata_path).ok();
    }
}

//! Conversation Summary Buffer Memory Service (v3.5.0)
//!
//! Manages long conversations by maintaining a summary of older messages
//! while keeping recent messages in full detail for context.
//!
//! Pattern: Summary Buffer Memory
//! - Keep recent N messages in full
//! - Summarize older messages into a rolling summary
//! - Provide context (summary + recent messages) to LLM

#![allow(dead_code)]  // Phase 12: Summary buffer (on-demand)

use crate::database::Database;
use anyhow::{anyhow, Result};
use log::info;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Configuration for conversation memory
const MAX_RECENT_MESSAGES: usize = 10; // Keep last 10 messages in full
const SUMMARIZE_THRESHOLD: usize = 20; // Summarize when exceeding 20 messages

/// Message in conversation memory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationMessage {
    pub id: i64,
    pub role: String, // "user" or "assistant"
    pub content: String,
    pub created_at: i64,
}

/// Summary of a conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationSummary {
    pub id: i64,
    pub conversation_id: String,
    pub summary_text: String,
    pub messages_summarized: i64,
    pub last_updated: i64,
}

/// Context for LLM (summary + recent messages)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationContext {
    pub summary: Option<String>,
    pub recent_messages: Vec<ConversationMessage>,
    pub total_messages: usize,
}

/// Conversation Memory Service
pub struct ConversationMemoryService {
    db: Arc<Mutex<Database>>,
}

impl ConversationMemoryService {
    /// Create new conversation memory service
    pub fn new(db: Arc<Mutex<Database>>) -> Self {
        Self { db }
    }

    /// Get conversation context (summary + recent messages)
    pub fn get_context(&self, conversation_id: &str) -> Result<ConversationContext> {
        let db = self.db.lock().map_err(|e| anyhow!("Database lock error: {}", e))?;
        let conn = db.conn();

        // Get total message count
        let total_messages: usize = conn
            .query_row(
                "SELECT COUNT(*) FROM messages WHERE conversation_id = ?1",
                [conversation_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        // Get recent messages (last N)
        let mut stmt = conn.prepare(
            "SELECT id, role, content, created_at
             FROM messages
             WHERE conversation_id = ?1
             ORDER BY created_at DESC
             LIMIT ?2"
        )?;

        let recent_messages: Vec<ConversationMessage> = stmt
            .query_map(params![conversation_id, MAX_RECENT_MESSAGES], |row| {
                Ok(ConversationMessage {
                    id: row.get(0)?,
                    role: row.get(1)?,
                    content: row.get(2)?,
                    created_at: row.get(3)?,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?
            .into_iter()
            .rev() // Reverse to get chronological order
            .collect();

        // Get summary if exists
        let summary: Option<String> = conn
            .query_row(
                "SELECT summary_text FROM conversation_summaries
                 WHERE conversation_id = ?1
                 ORDER BY last_updated DESC
                 LIMIT 1",
                [conversation_id],
                |row| row.get(0),
            )
            .ok();

        Ok(ConversationContext {
            summary,
            recent_messages,
            total_messages,
        })
    }

    /// Check if conversation needs summarization
    pub fn needs_summarization(&self, conversation_id: &str) -> Result<bool> {
        let db = self.db.lock().map_err(|e| anyhow!("Database lock error: {}", e))?;
        let conn = db.conn();

        let message_count: usize = conn
            .query_row(
                "SELECT COUNT(*) FROM messages WHERE conversation_id = ?1",
                [conversation_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        Ok(message_count >= SUMMARIZE_THRESHOLD)
    }

    /// Create or update conversation summary
    pub fn create_summary(
        &self,
        conversation_id: &str,
        summary_text: &str,
        messages_summarized: i64,
    ) -> Result<()> {
        info!(
            "Creating summary for conversation {} ({} messages)",
            conversation_id, messages_summarized
        );

        let db = self.db.lock().map_err(|e| anyhow!("Database lock error: {}", e))?;
        let conn = db.conn();

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        // Check if summary exists
        let existing_summary: Option<i64> = conn
            .query_row(
                "SELECT id FROM conversation_summaries
                 WHERE conversation_id = ?1
                 ORDER BY last_updated DESC
                 LIMIT 1",
                [conversation_id],
                |row| row.get(0),
            )
            .ok();

        match existing_summary {
            Some(summary_id) => {
                // Update existing summary
                conn.execute(
                    "UPDATE conversation_summaries
                     SET summary_text = ?1, messages_summarized = ?2, last_updated = ?3
                     WHERE id = ?4",
                    params![summary_text, messages_summarized, now, summary_id],
                )?;
                info!("Updated existing summary {}", summary_id);
            }
            None => {
                // Create new summary
                conn.execute(
                    "INSERT INTO conversation_summaries
                     (conversation_id, summary_text, messages_summarized, last_updated)
                     VALUES (?1, ?2, ?3, ?4)",
                    params![conversation_id, summary_text, messages_summarized, now],
                )?;
                info!("Created new summary for conversation {}", conversation_id);
            }
        }

        Ok(())
    }

    /// Get messages for summarization (all except recent N)
    pub fn get_messages_for_summary(&self, conversation_id: &str) -> Result<Vec<ConversationMessage>> {
        let db = self.db.lock().map_err(|e| anyhow!("Database lock error: {}", e))?;
        let conn = db.conn();

        // Get all messages except the most recent N
        let mut stmt = conn.prepare(
            "SELECT id, role, content, created_at
             FROM messages
             WHERE conversation_id = ?1
             ORDER BY created_at ASC"
        )?;

        let all_messages: Vec<ConversationMessage> = stmt
            .query_map([conversation_id], |row| {
                Ok(ConversationMessage {
                    id: row.get(0)?,
                    role: row.get(1)?,
                    content: row.get(2)?,
                    created_at: row.get(3)?,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        // Return all except recent N messages
        let messages_to_summarize = if all_messages.len() > MAX_RECENT_MESSAGES {
            all_messages[..all_messages.len() - MAX_RECENT_MESSAGES].to_vec()
        } else {
            Vec::new()
        };

        Ok(messages_to_summarize)
    }

    /// Get summary for a conversation
    pub fn get_summary(&self, conversation_id: &str) -> Result<Option<ConversationSummary>> {
        let db = self.db.lock().map_err(|e| anyhow!("Database lock error: {}", e))?;
        let conn = db.conn();

        let summary = conn
            .query_row(
                "SELECT id, conversation_id, summary_text, messages_summarized, last_updated
                 FROM conversation_summaries
                 WHERE conversation_id = ?1
                 ORDER BY last_updated DESC
                 LIMIT 1",
                [conversation_id],
                |row| {
                    Ok(ConversationSummary {
                        id: row.get(0)?,
                        conversation_id: row.get(1)?,
                        summary_text: row.get(2)?,
                        messages_summarized: row.get(3)?,
                        last_updated: row.get(4)?,
                    })
                },
            )
            .ok();

        Ok(summary)
    }

    /// Delete summary for a conversation
    pub fn delete_summary(&self, conversation_id: &str) -> Result<()> {
        info!("Deleting summary for conversation {}", conversation_id);

        let db = self.db.lock().map_err(|e| anyhow!("Database lock error: {}", e))?;
        let conn = db.conn();

        conn.execute(
            "DELETE FROM conversation_summaries WHERE conversation_id = ?1",
            [conversation_id],
        )?;

        Ok(())
    }

    /// Format context for LLM prompt
    pub fn format_context_for_llm(&self, context: &ConversationContext) -> String {
        let mut formatted = String::new();

        // Add summary if exists
        if let Some(summary) = &context.summary {
            formatted.push_str("**Previous conversation summary:**\n");
            formatted.push_str(summary);
            formatted.push_str("\n\n");
        }

        // Add recent messages
        if !context.recent_messages.is_empty() {
            formatted.push_str("**Recent messages:**\n");
            for msg in &context.recent_messages {
                formatted.push_str(&format!("{}: {}\n", msg.role, msg.content));
            }
        }

        formatted
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;

    fn create_test_db() -> Arc<Mutex<Database>> {
        let db = Database::new(":memory:").expect("Failed to create test database");
        Arc::new(Mutex::new(db))
    }

    #[test]
    fn test_get_context_empty() {
        let db = create_test_db();
        let service = ConversationMemoryService::new(db);

        let context = service.get_context("test-conv-id").unwrap();
        assert_eq!(context.total_messages, 0);
        assert!(context.recent_messages.is_empty());
        assert!(context.summary.is_none());
    }

    #[test]
    fn test_needs_summarization() {
        let db = create_test_db();
        let service = ConversationMemoryService::new(db);

        // Empty conversation doesn't need summarization
        assert!(!service.needs_summarization("test-conv-id").unwrap());
    }

    #[test]
    fn test_create_and_get_summary() {
        let db = create_test_db();
        let service = ConversationMemoryService::new(db);

        let conv_id = "test-conv-id";
        let summary_text = "This is a test summary of the conversation.";
        let messages_summarized = 15;

        // Create summary
        service
            .create_summary(conv_id, summary_text, messages_summarized)
            .unwrap();

        // Retrieve summary
        let retrieved = service.get_summary(conv_id).unwrap();
        assert!(retrieved.is_some());

        let summary = retrieved.unwrap();
        assert_eq!(summary.conversation_id, conv_id);
        assert_eq!(summary.summary_text, summary_text);
        assert_eq!(summary.messages_summarized, messages_summarized);
    }

    #[test]
    fn test_update_summary() {
        let db = create_test_db();
        let service = ConversationMemoryService::new(db);

        let conv_id = "test-conv-id";

        // Create initial summary
        service
            .create_summary(conv_id, "First summary", 10)
            .unwrap();

        // Update summary
        service
            .create_summary(conv_id, "Updated summary", 20)
            .unwrap();

        // Check updated
        let summary = service.get_summary(conv_id).unwrap().unwrap();
        assert_eq!(summary.summary_text, "Updated summary");
        assert_eq!(summary.messages_summarized, 20);
    }

    #[test]
    fn test_delete_summary() {
        let db = create_test_db();
        let service = ConversationMemoryService::new(db);

        let conv_id = "test-conv-id";

        // Create summary
        service.create_summary(conv_id, "Test summary", 10).unwrap();
        assert!(service.get_summary(conv_id).unwrap().is_some());

        // Delete summary
        service.delete_summary(conv_id).unwrap();
        assert!(service.get_summary(conv_id).unwrap().is_none());
    }

    #[test]
    fn test_format_context_for_llm() {
        let db = create_test_db();
        let service = ConversationMemoryService::new(db);

        let context = ConversationContext {
            summary: Some("User asked about Rust programming.".to_string()),
            recent_messages: vec![
                ConversationMessage {
                    id: 1,
                    role: "user".to_string(),
                    content: "What is ownership?".to_string(),
                    created_at: 1000,
                },
                ConversationMessage {
                    id: 2,
                    role: "assistant".to_string(),
                    content: "Ownership is Rust's memory management system.".to_string(),
                    created_at: 2000,
                },
            ],
            total_messages: 12,
        };

        let formatted = service.format_context_for_llm(&context);
        assert!(formatted.contains("Previous conversation summary:"));
        assert!(formatted.contains("User asked about Rust programming."));
        assert!(formatted.contains("Recent messages:"));
        assert!(formatted.contains("user: What is ownership?"));
        assert!(formatted.contains("assistant: Ownership is Rust's memory management system."));
    }
}

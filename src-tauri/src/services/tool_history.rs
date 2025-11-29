/// Tool History Service (v3.3.0)
///
/// Tracks and manages tool execution history for debugging, analytics, and user transparency.
/// Provides comprehensive logging of all tool calls with filtering, search, and export capabilities.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Tool call execution record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCallRecord {
    pub id: String,
    pub conversation_id: String,
    pub message_id: String,
    pub tool_name: String,
    pub tool_input: String,
    pub tool_output: String,
    pub execution_time_ms: i64,
    pub status: ToolCallStatus,
    pub error_message: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ToolCallStatus {
    Success,
    Error,
}

impl ToString for ToolCallStatus {
    fn to_string(&self) -> String {
        match self {
            ToolCallStatus::Success => "success".to_string(),
            ToolCallStatus::Error => "error".to_string(),
        }
    }
}

impl ToolCallStatus {
    pub fn from_str(s: &str) -> Result<Self> {
        match s {
            "success" => Ok(ToolCallStatus::Success),
            "error" => Ok(ToolCallStatus::Error),
            _ => anyhow::bail!("Invalid tool call status: {}", s),
        }
    }
}

/// Filters for querying tool history
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ToolHistoryFilters {
    pub conversation_id: Option<String>,
    pub tool_name: Option<String>,
    pub status: Option<ToolCallStatus>,
    pub start_time: Option<i64>,
    pub end_time: Option<i64>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

/// Tool usage statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolUsageStats {
    pub total_calls: usize,
    pub successful_calls: usize,
    pub failed_calls: usize,
    pub success_rate: f32,
    pub avg_execution_time_ms: f32,
    pub tool_breakdown: Vec<ToolStats>,
    pub recent_calls: Vec<ToolCallRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolStats {
    pub tool_name: String,
    pub call_count: usize,
    pub success_count: usize,
    pub failure_count: usize,
    pub avg_execution_time_ms: f32,
}

/// Export format for tool history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    Json,
    Csv,
}

pub struct ToolHistoryService {
    db: Arc<Mutex<crate::database::Database>>,
}

impl ToolHistoryService {
    /// Create a new ToolHistoryService
    pub fn new(db: Arc<Mutex<crate::database::Database>>) -> Result<Self> {
        Ok(Self { db })
    }

    /// Record a tool execution to the database
    pub fn record_execution(&self, record: ToolCallRecord) -> Result<()> {
        let db = self.db.lock()
            .map_err(|e| anyhow::anyhow!("Database lock failed: {}", e))?;
        let conn = db.conn();

        conn.execute(
            "INSERT INTO tool_call_history (
                id, conversation_id, message_id, tool_name,
                tool_input, tool_output, execution_time_ms,
                status, error_message, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                record.id,
                record.conversation_id,
                record.message_id,
                record.tool_name,
                record.tool_input,
                record.tool_output,
                record.execution_time_ms,
                record.status.to_string(),
                record.error_message,
                record.created_at,
            ],
        )
        .context("Failed to insert tool call record")?;

        log::debug!(
            "Recorded tool execution: {} ({}) - {} in {}ms",
            record.tool_name,
            record.id,
            record.status.to_string(),
            record.execution_time_ms
        );

        Ok(())
    }

    /// Get tool history with optional filters
    pub fn get_history(&self, filters: ToolHistoryFilters) -> Result<Vec<ToolCallRecord>> {
        let db = self.db.lock()
            .map_err(|e| anyhow::anyhow!("Database lock failed: {}", e))?;
        let conn = db.conn();

        let mut query = String::from(
            "SELECT id, conversation_id, message_id, tool_name,
                    tool_input, tool_output, execution_time_ms,
                    status, error_message, created_at
             FROM tool_call_history
             WHERE 1=1"
        );

        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        // Apply filters
        if let Some(ref conversation_id) = filters.conversation_id {
            query.push_str(" AND conversation_id = ?");
            params.push(Box::new(conversation_id.clone()));
        }

        if let Some(ref tool_name) = filters.tool_name {
            query.push_str(" AND tool_name = ?");
            params.push(Box::new(tool_name.clone()));
        }

        if let Some(ref status) = filters.status {
            query.push_str(" AND status = ?");
            params.push(Box::new(status.to_string()));
        }

        if let Some(start_time) = filters.start_time {
            query.push_str(" AND created_at >= ?");
            params.push(Box::new(start_time));
        }

        if let Some(end_time) = filters.end_time {
            query.push_str(" AND created_at <= ?");
            params.push(Box::new(end_time));
        }

        query.push_str(" ORDER BY created_at DESC");

        if let Some(limit) = filters.limit {
            query.push_str(&format!(" LIMIT {}", limit));
        }

        if let Some(offset) = filters.offset {
            query.push_str(&format!(" OFFSET {}", offset));
        }

        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

        let mut stmt = conn.prepare(&query)?;
        let records = stmt
            .query_map(&param_refs[..], |row| {
                Ok(ToolCallRecord {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    message_id: row.get(2)?,
                    tool_name: row.get(3)?,
                    tool_input: row.get(4)?,
                    tool_output: row.get(5)?,
                    execution_time_ms: row.get(6)?,
                    status: ToolCallStatus::from_str(&row.get::<_, String>(7)?).unwrap_or(ToolCallStatus::Error),
                    error_message: row.get(8)?,
                    created_at: row.get(9)?,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        log::debug!("Retrieved {} tool history records with filters", records.len());

        Ok(records)
    }

    /// Get tool usage statistics
    pub fn get_statistics(&self) -> Result<ToolUsageStats> {
        let db = self.db.lock()
            .map_err(|e| anyhow::anyhow!("Database lock failed: {}", e))?;
        let conn = db.conn();

        // Overall statistics
        let (total_calls, successful_calls, failed_calls, avg_execution_time): (usize, usize, usize, f32) =
            conn.query_row(
                "SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failure,
                    COALESCE(AVG(execution_time_ms), 0.0) as avg_time
                FROM tool_call_history",
                [],
                |row| Ok((
                    row.get::<_, i64>(0)? as usize,
                    row.get::<_, i64>(1)? as usize,
                    row.get::<_, i64>(2)? as usize,
                    row.get::<_, f64>(3)? as f32,
                )),
            )?;

        let success_rate = if total_calls > 0 {
            (successful_calls as f32 / total_calls as f32) * 100.0
        } else {
            0.0
        };

        // Per-tool breakdown
        let mut stmt = conn.prepare(
            "SELECT
                tool_name,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failure,
                COALESCE(AVG(execution_time_ms), 0.0) as avg_time
            FROM tool_call_history
            GROUP BY tool_name
            ORDER BY total DESC"
        )?;

        let tool_breakdown = stmt
            .query_map([], |row| {
                Ok(ToolStats {
                    tool_name: row.get(0)?,
                    call_count: row.get::<_, i64>(1)? as usize,
                    success_count: row.get::<_, i64>(2)? as usize,
                    failure_count: row.get::<_, i64>(3)? as usize,
                    avg_execution_time_ms: row.get::<_, f64>(4)? as f32,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        // Recent calls (last 10)
        let recent_calls = self.get_history(ToolHistoryFilters {
            limit: Some(10),
            ..Default::default()
        })?;

        Ok(ToolUsageStats {
            total_calls,
            successful_calls,
            failed_calls,
            success_rate,
            avg_execution_time_ms: avg_execution_time,
            tool_breakdown,
            recent_calls,
        })
    }

    /// Export tool history to file
    pub fn export_history(&self, format: ExportFormat, output_path: &str, filters: Option<ToolHistoryFilters>) -> Result<usize> {
        let records = self.get_history(filters.unwrap_or_default())?;
        let record_count = records.len();

        match format {
            ExportFormat::Json => {
                let json = serde_json::to_string_pretty(&records)
                    .context("Failed to serialize records to JSON")?;
                std::fs::write(output_path, json)
                    .context(format!("Failed to write JSON to {}", output_path))?;
            }
            ExportFormat::Csv => {
                let mut csv_content = String::from("id,conversation_id,message_id,tool_name,execution_time_ms,status,created_at,error_message\n");

                for record in &records {
                    csv_content.push_str(&format!(
                        "{},{},{},{},{},{},{},{}\n",
                        record.id,
                        record.conversation_id,
                        record.message_id,
                        record.tool_name,
                        record.execution_time_ms,
                        record.status.to_string(),
                        record.created_at,
                        record.error_message.as_deref().unwrap_or(""),
                    ));
                }

                std::fs::write(output_path, csv_content)
                    .context(format!("Failed to write CSV to {}", output_path))?;
            }
        }

        log::info!("Exported {} tool history records to {}", record_count, output_path);

        Ok(record_count)
    }

    /// Delete tool history older than the specified timestamp
    pub fn delete_history_before(&self, before_timestamp: i64) -> Result<usize> {
        let db = self.db.lock()
            .map_err(|e| anyhow::anyhow!("Database lock failed: {}", e))?;
        let conn = db.conn();

        let deleted_count = conn.execute(
            "DELETE FROM tool_call_history WHERE created_at < ?1",
            [before_timestamp],
        )?;

        log::info!("Deleted {} old tool history records", deleted_count);

        Ok(deleted_count)
    }

    /// Get the most recently called tools
    pub fn get_recent_tools(&self, limit: usize) -> Result<Vec<String>> {
        let db = self.db.lock()
            .map_err(|e| anyhow::anyhow!("Database lock failed: {}", e))?;
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT DISTINCT tool_name
             FROM tool_call_history
             ORDER BY created_at DESC
             LIMIT ?1"
        )?;

        let tools = stmt
            .query_map([limit as i64], |row| row.get(0))?
            .collect::<std::result::Result<Vec<String>, _>>()?;

        Ok(tools)
    }

    /// Get error rate for a specific tool
    pub fn get_tool_error_rate(&self, tool_name: &str) -> Result<f32> {
        let db = self.db.lock()
            .map_err(|e| anyhow::anyhow!("Database lock failed: {}", e))?;
        let conn = db.conn();

        let (total, failures): (i64, i64) = conn.query_row(
            "SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failures
             FROM tool_call_history
             WHERE tool_name = ?1",
            [tool_name],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        if total == 0 {
            return Ok(0.0);
        }

        Ok((failures as f32 / total as f32) * 100.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_db() -> Arc<Mutex<crate::database::Database>> {
        let db = crate::database::Database::new_test_db().unwrap();
        let db_arc = Arc::new(Mutex::new(db));

        // Create test conversation and message to satisfy foreign key constraints
        {
            let db_lock = db_arc.lock().unwrap();
            let conn = db_lock.conn();
            let now = chrono::Utc::now().timestamp_millis();

            conn.execute(
                "INSERT INTO conversations (id, title, mode, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                &["test-conv-1", "Test Conversation", "user-led", &now.to_string(), &now.to_string()],
            ).unwrap();

            conn.execute(
                "INSERT INTO messages (id, conversation_id, role, content, timestamp) VALUES (?1, ?2, ?3, ?4, ?5)",
                &["test-msg-1", "test-conv-1", "user", "Test message", &now.to_string()],
            ).unwrap();
        }

        db_arc
    }

    fn create_test_record(tool_name: &str, status: ToolCallStatus) -> ToolCallRecord {
        ToolCallRecord {
            id: uuid::Uuid::new_v4().to_string(),
            conversation_id: "test-conv-1".to_string(),
            message_id: "test-msg-1".to_string(),
            tool_name: tool_name.to_string(),
            tool_input: r#"{"query":"test"}"#.to_string(),
            tool_output: r#"{"result":"success"}"#.to_string(),
            execution_time_ms: 1500,
            status,
            error_message: if status == ToolCallStatus::Error {
                Some("Test error".to_string())
            } else {
                None
            },
            created_at: chrono::Utc::now().timestamp_millis(),
        }
    }

    #[test]
    fn test_record_execution() {
        let db = create_test_db();
        let service = ToolHistoryService::new(Arc::clone(&db)).unwrap();

        let record = create_test_record("web_search", ToolCallStatus::Success);
        service.record_execution(record.clone()).unwrap();

        let history = service.get_history(ToolHistoryFilters::default()).unwrap();
        assert_eq!(history.len(), 1);
        assert_eq!(history[0].tool_name, "web_search");
        assert_eq!(history[0].status, ToolCallStatus::Success);
    }

    #[test]
    fn test_get_history_with_filters() {
        let db = create_test_db();
        let service = ToolHistoryService::new(Arc::clone(&db)).unwrap();

        // Insert multiple records
        service.record_execution(create_test_record("web_search", ToolCallStatus::Success)).unwrap();
        service.record_execution(create_test_record("web_search", ToolCallStatus::Error)).unwrap();
        service.record_execution(create_test_record("calculate", ToolCallStatus::Success)).unwrap();

        // Filter by tool name
        let web_search_history = service.get_history(ToolHistoryFilters {
            tool_name: Some("web_search".to_string()),
            ..Default::default()
        }).unwrap();
        assert_eq!(web_search_history.len(), 2);

        // Filter by status
        let success_history = service.get_history(ToolHistoryFilters {
            status: Some(ToolCallStatus::Success),
            ..Default::default()
        }).unwrap();
        assert_eq!(success_history.len(), 2);
    }

    #[test]
    fn test_get_statistics() {
        let db = create_test_db();
        let service = ToolHistoryService::new(Arc::clone(&db)).unwrap();

        service.record_execution(create_test_record("web_search", ToolCallStatus::Success)).unwrap();
        service.record_execution(create_test_record("web_search", ToolCallStatus::Error)).unwrap();
        service.record_execution(create_test_record("calculate", ToolCallStatus::Success)).unwrap();

        let stats = service.get_statistics().unwrap();
        assert_eq!(stats.total_calls, 3);
        assert_eq!(stats.successful_calls, 2);
        assert_eq!(stats.failed_calls, 1);
        assert!((stats.success_rate - 66.67).abs() < 0.1);
    }

    #[test]
    fn test_export_history_json() {
        let db = create_test_db();
        let service = ToolHistoryService::new(Arc::clone(&db)).unwrap();

        service.record_execution(create_test_record("web_search", ToolCallStatus::Success)).unwrap();

        let temp_dir = std::env::temp_dir();
        let output_path = temp_dir.join("tool_history_test.json");
        let output_path_str = output_path.to_str().unwrap();

        let count = service.export_history(ExportFormat::Json, output_path_str, None).unwrap();
        assert_eq!(count, 1);
        assert!(output_path.exists());

        // Cleanup
        std::fs::remove_file(output_path).ok();
    }

    #[test]
    fn test_export_history_csv() {
        let db = create_test_db();
        let service = ToolHistoryService::new(Arc::clone(&db)).unwrap();

        service.record_execution(create_test_record("web_search", ToolCallStatus::Success)).unwrap();

        let temp_dir = std::env::temp_dir();
        let output_path = temp_dir.join("tool_history_test.csv");
        let output_path_str = output_path.to_str().unwrap();

        let count = service.export_history(ExportFormat::Csv, output_path_str, None).unwrap();
        assert_eq!(count, 1);
        assert!(output_path.exists());

        // Verify CSV format
        let content = std::fs::read_to_string(&output_path).unwrap();
        assert!(content.contains("id,conversation_id,message_id,tool_name"));

        // Cleanup
        std::fs::remove_file(output_path).ok();
    }

    #[test]
    fn test_delete_history_before() {
        let db = create_test_db();
        let service = ToolHistoryService::new(Arc::clone(&db)).unwrap();

        service.record_execution(create_test_record("web_search", ToolCallStatus::Success)).unwrap();

        // Delete all records before future timestamp
        let future_timestamp = chrono::Utc::now().timestamp_millis() + 10000;
        let deleted = service.delete_history_before(future_timestamp).unwrap();
        assert_eq!(deleted, 1);

        let history = service.get_history(ToolHistoryFilters::default()).unwrap();
        assert_eq!(history.len(), 0);
    }

    #[test]
    fn test_get_tool_error_rate() {
        let db = create_test_db();
        let service = ToolHistoryService::new(Arc::clone(&db)).unwrap();

        service.record_execution(create_test_record("web_search", ToolCallStatus::Success)).unwrap();
        service.record_execution(create_test_record("web_search", ToolCallStatus::Success)).unwrap();
        service.record_execution(create_test_record("web_search", ToolCallStatus::Error)).unwrap();
        service.record_execution(create_test_record("web_search", ToolCallStatus::Error)).unwrap();

        let error_rate = service.get_tool_error_rate("web_search").unwrap();
        assert!((error_rate - 50.0).abs() < 0.1); // 2 errors out of 4 calls = 50%
    }
}

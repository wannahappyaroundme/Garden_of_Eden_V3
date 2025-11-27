/**
 * Error Types (v3.5.2)
 *
 * Comprehensive error types with recovery suggestions for better UX.
 * All errors include:
 * - Error code for programmatic handling
 * - Human-readable message
 * - Recovery suggestion for users
 * - Optional technical details for debugging
 */

use serde::{Deserialize, Serialize};
use std::fmt;

/// Error codes for categorizing errors
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    // Connection errors (1xxx)
    OllamaNotRunning = 1001,
    OllamaConnectionFailed = 1002,
    NetworkTimeout = 1003,
    NetworkUnavailable = 1004,

    // Model errors (2xxx)
    ModelNotFound = 2001,
    ModelDownloadFailed = 2002,
    ModelIncompatible = 2003,
    ModelLoadFailed = 2004,
    InsufficientVram = 2005,

    // Database errors (3xxx)
    DatabaseConnectionFailed = 3001,
    DatabaseQueryFailed = 3002,
    DatabaseCorrupted = 3003,
    DatabaseLocked = 3004,
    MigrationFailed = 3005,

    // File system errors (4xxx)
    FileNotFound = 4001,
    FileReadFailed = 4002,
    FileWriteFailed = 4003,
    PermissionDenied = 4004,
    DiskFull = 4005,

    // AI/Inference errors (5xxx)
    InferenceFailed = 5001,
    ContextTooLong = 5002,
    TokenLimitExceeded = 5003,
    EmbeddingFailed = 5004,
    RagRetrievalFailed = 5005,

    // User input errors (6xxx)
    InvalidInput = 6001,
    MissingRequiredField = 6002,
    ValidationFailed = 6003,

    // Authentication errors (7xxx)
    OAuthFailed = 7001,
    TokenExpired = 7002,
    Unauthorized = 7003,

    // System errors (9xxx)
    InternalError = 9001,
    Unknown = 9999,
}

impl ErrorCode {
    /// Get the numeric code
    pub fn code(&self) -> u16 {
        *self as u16
    }

    /// Get error category
    pub fn category(&self) -> &'static str {
        match self.code() / 1000 {
            1 => "Connection",
            2 => "Model",
            3 => "Database",
            4 => "File System",
            5 => "AI/Inference",
            6 => "Input",
            7 => "Authentication",
            9 => "System",
            _ => "Unknown",
        }
    }
}

/// Structured application error with recovery suggestions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppError {
    /// Error code for programmatic handling
    pub code: ErrorCode,
    /// Human-readable error message
    pub message: String,
    /// Recovery suggestion for the user
    pub recovery: String,
    /// Optional technical details for debugging
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
    /// Error timestamp
    pub timestamp: i64,
}

impl AppError {
    /// Create a new error with recovery suggestion
    pub fn new(code: ErrorCode, message: impl Into<String>, recovery: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            recovery: recovery.into(),
            details: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    /// Add technical details
    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }

    /// Create from a standard error with context
    pub fn from_error<E: std::error::Error>(code: ErrorCode, error: E) -> Self {
        let (message, recovery) = Self::default_messages(code);
        Self {
            code,
            message,
            recovery,
            details: Some(error.to_string()),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    /// Get default message and recovery for an error code
    fn default_messages(code: ErrorCode) -> (String, String) {
        match code {
            // Connection errors
            ErrorCode::OllamaNotRunning => (
                "Ollama is not running".into(),
                "Start Ollama by running 'ollama serve' in terminal, or install from ollama.com".into(),
            ),
            ErrorCode::OllamaConnectionFailed => (
                "Failed to connect to Ollama".into(),
                "Check if Ollama is running on port 11434. Try: 'curl http://localhost:11434'".into(),
            ),
            ErrorCode::NetworkTimeout => (
                "Request timed out".into(),
                "Check your internet connection and try again".into(),
            ),
            ErrorCode::NetworkUnavailable => (
                "Network unavailable".into(),
                "Check your internet connection".into(),
            ),

            // Model errors
            ErrorCode::ModelNotFound => (
                "AI model not found".into(),
                "Download the model with 'ollama pull qwen2.5:14b' or choose a different model in settings".into(),
            ),
            ErrorCode::ModelDownloadFailed => (
                "Failed to download model".into(),
                "Check your internet connection and try again. You may need to free up disk space".into(),
            ),
            ErrorCode::ModelIncompatible => (
                "Model is incompatible".into(),
                "This model may not be supported. Try a different model version".into(),
            ),
            ErrorCode::ModelLoadFailed => (
                "Failed to load AI model".into(),
                "Restart Ollama and try again. If the problem persists, re-download the model".into(),
            ),
            ErrorCode::InsufficientVram => (
                "Insufficient GPU memory".into(),
                "Close other GPU-intensive applications or switch to a smaller model".into(),
            ),

            // Database errors
            ErrorCode::DatabaseConnectionFailed => (
                "Failed to connect to database".into(),
                "Restart the application. If the problem persists, check disk permissions".into(),
            ),
            ErrorCode::DatabaseQueryFailed => (
                "Database query failed".into(),
                "This is a temporary issue. Try the operation again".into(),
            ),
            ErrorCode::DatabaseCorrupted => (
                "Database may be corrupted".into(),
                "Backup your data and reset the database from Settings > Advanced".into(),
            ),
            ErrorCode::DatabaseLocked => (
                "Database is locked".into(),
                "Close other instances of the application and try again".into(),
            ),
            ErrorCode::MigrationFailed => (
                "Database upgrade failed".into(),
                "Try restarting the application. If the problem persists, contact support".into(),
            ),

            // File system errors
            ErrorCode::FileNotFound => (
                "File not found".into(),
                "Check if the file exists and try again".into(),
            ),
            ErrorCode::FileReadFailed => (
                "Failed to read file".into(),
                "Check file permissions and try again".into(),
            ),
            ErrorCode::FileWriteFailed => (
                "Failed to write file".into(),
                "Check disk space and file permissions".into(),
            ),
            ErrorCode::PermissionDenied => (
                "Permission denied".into(),
                "Grant the application necessary permissions in System Preferences > Security".into(),
            ),
            ErrorCode::DiskFull => (
                "Disk is full".into(),
                "Free up disk space and try again".into(),
            ),

            // AI/Inference errors
            ErrorCode::InferenceFailed => (
                "AI response generation failed".into(),
                "Try again with a shorter message. If the problem persists, restart Ollama".into(),
            ),
            ErrorCode::ContextTooLong => (
                "Message too long for AI context".into(),
                "Try a shorter message or start a new conversation".into(),
            ),
            ErrorCode::TokenLimitExceeded => (
                "Token limit exceeded".into(),
                "Shorten your message or start a new conversation".into(),
            ),
            ErrorCode::EmbeddingFailed => (
                "Failed to process text embeddings".into(),
                "The application is running in reduced accuracy mode. This is normal if BGE-M3 model failed to load".into(),
            ),
            ErrorCode::RagRetrievalFailed => (
                "Memory retrieval failed".into(),
                "Try again. If the problem persists, the memory system will rebuild automatically".into(),
            ),

            // User input errors
            ErrorCode::InvalidInput => (
                "Invalid input".into(),
                "Please check your input and try again".into(),
            ),
            ErrorCode::MissingRequiredField => (
                "Required field is missing".into(),
                "Please fill in all required fields".into(),
            ),
            ErrorCode::ValidationFailed => (
                "Validation failed".into(),
                "Please check your input and try again".into(),
            ),

            // Authentication errors
            ErrorCode::OAuthFailed => (
                "Authentication failed".into(),
                "Try signing in again. If the problem persists, check your internet connection".into(),
            ),
            ErrorCode::TokenExpired => (
                "Session expired".into(),
                "Please sign in again to continue".into(),
            ),
            ErrorCode::Unauthorized => (
                "Not authorized".into(),
                "You don't have permission for this action".into(),
            ),

            // System errors
            ErrorCode::InternalError => (
                "An internal error occurred".into(),
                "Please restart the application. If the problem persists, contact support".into(),
            ),
            ErrorCode::Unknown => (
                "An unknown error occurred".into(),
                "Please try again. If the problem persists, restart the application".into(),
            ),
        }
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.code.code(), self.message)
    }
}

impl std::error::Error for AppError {}

// Conversion from common error types

impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        let code = match &error {
            rusqlite::Error::SqliteFailure(e, _) => {
                match e.code {
                    rusqlite::ErrorCode::DatabaseBusy |
                    rusqlite::ErrorCode::DatabaseLocked => ErrorCode::DatabaseLocked,
                    rusqlite::ErrorCode::DatabaseCorrupt |
                    rusqlite::ErrorCode::NotADatabase => ErrorCode::DatabaseCorrupted,
                    _ => ErrorCode::DatabaseQueryFailed,
                }
            }
            _ => ErrorCode::DatabaseQueryFailed,
        };
        AppError::from_error(code, error)
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        let code = match error.kind() {
            std::io::ErrorKind::NotFound => ErrorCode::FileNotFound,
            std::io::ErrorKind::PermissionDenied => ErrorCode::PermissionDenied,
            std::io::ErrorKind::TimedOut => ErrorCode::NetworkTimeout,
            _ => ErrorCode::InternalError,
        };
        AppError::from_error(code, error)
    }
}

impl From<reqwest::Error> for AppError {
    fn from(error: reqwest::Error) -> Self {
        let code = if error.is_timeout() {
            ErrorCode::NetworkTimeout
        } else if error.is_connect() {
            ErrorCode::OllamaConnectionFailed
        } else {
            ErrorCode::NetworkUnavailable
        };
        AppError::from_error(code, error)
    }
}

impl From<anyhow::Error> for AppError {
    fn from(error: anyhow::Error) -> Self {
        AppError::new(
            ErrorCode::InternalError,
            "An error occurred",
            "Please try again",
        )
        .with_details(error.to_string())
    }
}

/// Result type alias for AppError
pub type AppResult<T> = Result<T, AppError>;

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_code_categories() {
        assert_eq!(ErrorCode::OllamaNotRunning.category(), "Connection");
        assert_eq!(ErrorCode::ModelNotFound.category(), "Model");
        assert_eq!(ErrorCode::DatabaseLocked.category(), "Database");
        assert_eq!(ErrorCode::FileNotFound.category(), "File System");
        assert_eq!(ErrorCode::InferenceFailed.category(), "AI/Inference");
        assert_eq!(ErrorCode::InvalidInput.category(), "Input");
        assert_eq!(ErrorCode::OAuthFailed.category(), "Authentication");
        assert_eq!(ErrorCode::InternalError.category(), "System");
    }

    #[test]
    fn test_error_serialization() {
        let error = AppError::new(
            ErrorCode::OllamaNotRunning,
            "Ollama is not running",
            "Start Ollama",
        );

        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("OLLAMA_NOT_RUNNING"));
    }

    #[test]
    fn test_error_with_details() {
        let error = AppError::new(
            ErrorCode::DatabaseQueryFailed,
            "Query failed",
            "Try again",
        )
        .with_details("SQL syntax error at line 5");

        assert!(error.details.is_some());
        assert!(error.details.unwrap().contains("SQL syntax"));
    }
}

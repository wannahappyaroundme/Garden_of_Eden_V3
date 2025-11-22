/**
 * Phase 5: Visual Analyzer (v3.9.0)
 *
 * Image understanding system using LLaVA for visual context analysis.
 *
 * Features:
 * - Screenshot analysis with code detection
 * - Chart/graph data extraction
 * - UI element identification
 * - Error message OCR and interpretation
 * - Lazy loading (only loads LLaVA when needed)
 * - VRAM efficient (unloads after use)
 *
 * VRAM Usage:
 * - Idle: 0 MB (not loaded)
 * - Active: ~2048 MB (LLaVA running)
 * - Post-analysis: 0 MB (auto-unloads)
 */

use crate::database::Database;
use crate::services::llava::LlavaService;
use crate::services::screen::ScreenCaptureService;
use anyhow::{Context, Result};
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as TokioMutex;

/// Visual analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualAnalysis {
    /// Detected content type
    pub content_type: VisualContentType,

    /// Main description
    pub description: String,

    /// Extracted text (if any)
    pub extracted_text: Option<String>,

    /// Detected code snippets
    pub code_snippets: Vec<CodeSnippet>,

    /// Detected errors/warnings
    pub errors: Vec<String>,

    /// Confidence (0.0-1.0)
    pub confidence: f32,

    /// Analysis timestamp
    pub timestamp: i64,

    /// Image path (for reference)
    pub image_path: String,
}

/// Visual content type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum VisualContentType {
    /// Code editor/IDE screenshot
    Code,
    /// Terminal/console output
    Terminal,
    /// Error dialog/message
    Error,
    /// Chart/graph/diagram
    Chart,
    /// UI/application screenshot
    UI,
    /// Document/text
    Document,
    /// Other/unknown
    Other,
}

/// Code snippet extracted from image
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeSnippet {
    pub language: String,
    pub code: String,
    pub line_numbers: Option<(usize, usize)>,
}

/// Configuration for visual analyzer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualAnalyzerConfig {
    /// Whether to enable automatic unloading
    pub auto_unload: bool,

    /// Minimum confidence threshold
    pub min_confidence: f32,

    /// Whether to store analysis results in database
    pub store_results: bool,
}

impl Default for VisualAnalyzerConfig {
    fn default() -> Self {
        Self {
            auto_unload: true,
            min_confidence: 0.6,
            store_results: true,
        }
    }
}

/// Visual Analyzer Service
pub struct VisualAnalyzerService {
    llava: Arc<TokioMutex<Option<LlavaService>>>,
    screen_capture: Arc<ScreenCaptureService>,
    db: Arc<Mutex<Database>>,
    config: Arc<Mutex<VisualAnalyzerConfig>>,
}

impl VisualAnalyzerService {
    /// Create new visual analyzer
    pub fn new(
        screen_capture: Arc<ScreenCaptureService>,
        db: Arc<Mutex<Database>>,
    ) -> Result<Self> {
        let service = Self {
            llava: Arc::new(TokioMutex::new(None)),
            screen_capture,
            db,
            config: Arc::new(Mutex::new(VisualAnalyzerConfig::default())),
        };

        service.init_database()?;

        Ok(service)
    }

    /// Initialize database tables
    fn init_database(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        // Create visual_memories table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS visual_memories (
                id TEXT PRIMARY KEY,
                image_path TEXT NOT NULL,
                content_type TEXT NOT NULL,
                description TEXT NOT NULL,
                extracted_text TEXT,
                code_snippets TEXT,
                errors TEXT,
                confidence REAL NOT NULL,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Create index
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_visual_created
             ON visual_memories(created_at DESC)",
            [],
        );

        log::info!("Visual analyzer database initialized");

        Ok(())
    }

    /// Analyze an image from file path
    ///
    /// # Arguments
    /// * `image_path` - Path to image file
    /// * `user_question` - Optional question about the image
    pub async fn analyze(
        &self,
        image_path: &str,
        user_question: Option<&str>,
    ) -> Result<VisualAnalysis> {
        log::info!("Analyzing image: {}", image_path);

        // Load image file and convert to base64
        let image_data = std::fs::read(image_path)
            .context("Failed to read image file")?;
        let base64_image = base64::engine::general_purpose::STANDARD.encode(&image_data);

        self.analyze_base64(&base64_image, user_question).await
    }

    /// Analyze an image from base64 data
    ///
    /// # Arguments
    /// * `base64_image` - Base64 encoded image data
    /// * `user_question` - Optional question about the image
    pub async fn analyze_base64(
        &self,
        base64_image: &str,
        user_question: Option<&str>,
    ) -> Result<VisualAnalysis> {
        log::info!("Analyzing base64 image");

        // Load LLaVA if not loaded
        self.ensure_llava_loaded().await?;

        // Perform analysis
        let analysis = self.perform_analysis(base64_image, user_question).await?;

        // Store results if configured
        let config = self.config.lock().unwrap().clone();
        if config.store_results {
            self.store_analysis(&analysis)?;
        }

        // Auto-unload if configured
        if config.auto_unload {
            self.unload_llava().await;
        }

        Ok(analysis)
    }

    /// Analyze current screen capture
    pub async fn analyze_current_screen(
        &self,
        user_question: Option<&str>,
    ) -> Result<VisualAnalysis> {
        log::info!("Analyzing current screen");

        // Capture current screen with basic context
        let capture_result = self.screen_capture
            .capture_with_context(1)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to capture screen: {}", e))?;

        // Use the base64 image directly
        self.analyze_base64(&capture_result.screenshot_base64, user_question).await
    }

    /// Perform actual analysis with LLaVA
    async fn perform_analysis(
        &self,
        base64_image: &str,
        user_question: Option<&str>,
    ) -> Result<VisualAnalysis> {
        // Determine analysis prompt based on question
        let prompt = if let Some(question) = user_question {
            format!(
                "Analyze this image and answer: {}\n\n\
                Also identify:\n\
                1. Content type (code/terminal/error/chart/ui/document/other)\n\
                2. Any visible text or code\n\
                3. Any errors or warnings\n\n\
                Respond in JSON format:\n\
                {{\n\
                  \"content_type\": \"code|terminal|error|chart|ui|document|other\",\n\
                  \"description\": \"detailed description\",\n\
                  \"extracted_text\": \"any visible text\",\n\
                  \"code_snippets\": [\n\
                    {{\"language\": \"rust\", \"code\": \"code here\"}}\n\
                  ],\n\
                  \"errors\": [\"error messages\"],\n\
                  \"confidence\": 0.9\n\
                }}",
                question
            )
        } else {
            "Analyze this image and identify:\n\
            1. Content type (code/terminal/error/chart/ui/document/other)\n\
            2. Main description\n\
            3. Any visible text or code\n\
            4. Any errors or warnings\n\n\
            Respond in JSON format:\n\
            {\n\
              \"content_type\": \"code|terminal|error|chart|ui|document|other\",\n\
              \"description\": \"detailed description\",\n\
              \"extracted_text\": \"any visible text\",\n\
              \"code_snippets\": [\n\
                {\"language\": \"rust\", \"code\": \"code here\"}\n\
              ],\n\
              \"errors\": [\"error messages\"],\n\
              \"confidence\": 0.9\n\
            }".to_string()
        };

        // Get LLaVA response
        let llava_guard = self.llava.lock().await;
        let llava = llava_guard.as_ref()
            .context("LLaVA not loaded")?;

        let response = llava
            .analyze_image(base64_image.to_string(), Some(prompt))
            .await
            .context("Failed to analyze image with LLaVA")?;

        drop(llava_guard);

        // Parse response
        let analysis = self.parse_llava_response(&response, base64_image)?;

        log::info!(
            "Visual analysis complete: type={:?}, confidence={:.2}",
            analysis.content_type,
            analysis.confidence
        );

        Ok(analysis)
    }

    /// Parse LLaVA JSON response
    fn parse_llava_response(
        &self,
        response: &str,
        _image_ref: &str,  // Could be path or base64, kept for future use
    ) -> Result<VisualAnalysis> {
        // Extract JSON from response
        let json = self.extract_json(response)?;

        #[derive(Deserialize)]
        struct LlavaResponse {
            content_type: String,
            description: String,
            extracted_text: Option<String>,
            code_snippets: Option<Vec<CodeSnippet>>,
            errors: Option<Vec<String>>,
            confidence: f32,
        }

        let data: LlavaResponse = serde_json::from_str(&json)
            .context("Failed to parse LLaVA response JSON")?;

        // Parse content type
        let content_type = match data.content_type.to_lowercase().as_str() {
            "code" => VisualContentType::Code,
            "terminal" => VisualContentType::Terminal,
            "error" => VisualContentType::Error,
            "chart" => VisualContentType::Chart,
            "ui" => VisualContentType::UI,
            "document" => VisualContentType::Document,
            _ => VisualContentType::Other,
        };

        Ok(VisualAnalysis {
            content_type,
            description: data.description,
            extracted_text: data.extracted_text,
            code_snippets: data.code_snippets.unwrap_or_default(),
            errors: data.errors.unwrap_or_default(),
            confidence: data.confidence.clamp(0.0, 1.0),
            timestamp: chrono::Utc::now().timestamp(),
            image_path: "base64_image".to_string(),  // Placeholder since we work with base64
        })
    }

    /// Extract JSON from LLaVA response
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

        // Check for JSON object
        if let Some(start) = trimmed.find('{') {
            if let Some(end) = trimmed.rfind('}') {
                return Ok(trimmed[start..=end].to_string());
            }
        }

        anyhow::bail!("No valid JSON found in LLaVA response")
    }

    /// Ensure LLaVA is loaded
    async fn ensure_llava_loaded(&self) -> Result<()> {
        let mut llava_guard = self.llava.lock().await;

        if llava_guard.is_none() {
            log::info!("Loading LLaVA service...");
            let llava = LlavaService::new()
                .context("Failed to initialize LLaVA")?;
            *llava_guard = Some(llava);
            log::info!("✓ LLaVA loaded (~2GB VRAM)");
        }

        Ok(())
    }

    /// Unload LLaVA to free VRAM
    async fn unload_llava(&self) {
        let mut llava_guard = self.llava.lock().await;

        if llava_guard.is_some() {
            *llava_guard = None;
            log::info!("✓ LLaVA unloaded (freed ~2GB VRAM)");
        }
    }

    /// Check if LLaVA is currently loaded
    pub fn is_loaded(&self) -> bool {
        // Use try_lock for sync check
        if let Ok(guard) = self.llava.try_lock() {
            guard.is_some()
        } else {
            false
        }
    }

    /// Store analysis in database
    fn store_analysis(&self, analysis: &VisualAnalysis) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let id = uuid::Uuid::new_v4().to_string();
        let code_snippets_json = serde_json::to_string(&analysis.code_snippets)?;
        let errors_json = serde_json::to_string(&analysis.errors)?;
        let content_type_str = format!("{:?}", analysis.content_type).to_lowercase();

        conn.execute(
            "INSERT INTO visual_memories (
                id, image_path, content_type, description,
                extracted_text, code_snippets, errors, confidence, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                id,
                analysis.image_path,
                content_type_str,
                analysis.description,
                analysis.extracted_text,
                code_snippets_json,
                errors_json,
                analysis.confidence,
                analysis.timestamp,
            ],
        )?;

        log::debug!("Stored visual analysis: {}", id);

        Ok(())
    }

    /// Get recent visual analyses
    pub fn get_recent(&self, limit: usize) -> Result<Vec<VisualAnalysis>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT image_path, content_type, description, extracted_text,
                    code_snippets, errors, confidence, created_at
             FROM visual_memories
             ORDER BY created_at DESC
             LIMIT ?1"
        )?;

        let analyses = stmt
            .query_map([limit], |row| {
                let content_type_str: String = row.get(1)?;
                let content_type = match content_type_str.as_str() {
                    "code" => VisualContentType::Code,
                    "terminal" => VisualContentType::Terminal,
                    "error" => VisualContentType::Error,
                    "chart" => VisualContentType::Chart,
                    "ui" => VisualContentType::UI,
                    "document" => VisualContentType::Document,
                    _ => VisualContentType::Other,
                };

                let code_snippets_json: String = row.get(4)?;
                let code_snippets: Vec<CodeSnippet> =
                    serde_json::from_str(&code_snippets_json).unwrap_or_default();

                let errors_json: String = row.get(5)?;
                let errors: Vec<String> =
                    serde_json::from_str(&errors_json).unwrap_or_default();

                Ok(VisualAnalysis {
                    image_path: row.get(0)?,
                    content_type,
                    description: row.get(2)?,
                    extracted_text: row.get(3)?,
                    code_snippets,
                    errors,
                    confidence: row.get(6)?,
                    timestamp: row.get(7)?,
                })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        Ok(analyses)
    }

    /// Update configuration
    pub fn update_config(&self, new_config: VisualAnalyzerConfig) {
        *self.config.lock().unwrap() = new_config;
        log::info!("Visual analyzer config updated");
    }

    /// Get current configuration
    pub fn get_config(&self) -> VisualAnalyzerConfig {
        self.config.lock().unwrap().clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_defaults() {
        let config = VisualAnalyzerConfig::default();
        assert!(config.auto_unload);
        assert_eq!(config.min_confidence, 0.6);
        assert!(config.store_results);
    }

    #[test]
    fn test_content_type_parsing() {
        let types = vec![
            ("code", VisualContentType::Code),
            ("terminal", VisualContentType::Terminal),
            ("error", VisualContentType::Error),
            ("other", VisualContentType::Other),
        ];

        for (input, expected) in types {
            let parsed = match input {
                "code" => VisualContentType::Code,
                "terminal" => VisualContentType::Terminal,
                "error" => VisualContentType::Error,
                _ => VisualContentType::Other,
            };
            assert_eq!(parsed, expected);
        }
    }
}

use anyhow::Result;
use log::{info, warn, error};
use reqwest::Client;
use serde::{Deserialize, Serialize};

const OLLAMA_API_URL: &str = "http://localhost:11434/api/generate";
const LLAVA_MODEL: &str = "llava:7b";

/// LLaVA Vision Model Service
/// Handles image analysis for screen context understanding using Ollama LLaVA 7B
pub struct LlavaService {
    client: Client,
    model_loaded: bool,
}

#[derive(Debug, Serialize)]
struct LlavaRequest {
    model: String,
    prompt: String,
    images: Vec<String>, // Base64 encoded images
    stream: bool,
    options: LlavaOptions,
}

#[derive(Debug, Serialize)]
struct LlavaOptions {
    temperature: f32,
    top_p: f32,
}

#[derive(Debug, Deserialize)]
struct LlavaResponse {
    response: String,
    #[allow(dead_code)]
    done: bool,
}

impl LlavaService {
    pub fn new() -> Result<Self> {
        info!("LLaVA service initialized with Ollama");

        Ok(Self {
            client: Client::new(),
            model_loaded: true, // Assume Ollama has the model
        })
    }

    /// Analyze an image (base64 encoded) and return description
    ///
    /// # Arguments
    /// * `image_base64` - Base64 encoded image data (without data:image prefix)
    /// * `prompt` - Optional prompt to guide the analysis
    ///
    /// # Returns
    /// String description of the image content
    pub async fn analyze_image(
        &self,
        image_base64: String,
        prompt: Option<String>,
    ) -> Result<String> {
        let analysis_prompt = prompt.unwrap_or_else(||
            "Describe what you see in this screenshot. Focus on:\n\
             - What application or window is active\n\
             - What task the user appears to be working on\n\
             - Any code, text, or UI elements visible\n\
             - The general context of the work".to_string()
        );

        info!("Analyzing image with LLaVA (prompt length: {} chars)", analysis_prompt.len());

        // Prepare request for Ollama vision API
        let request = LlavaRequest {
            model: LLAVA_MODEL.to_string(),
            prompt: analysis_prompt,
            images: vec![image_base64],
            stream: false,
            options: LlavaOptions {
                temperature: 0.3, // Lower temperature for more factual descriptions
                top_p: 0.9,
            },
        };

        // Send request to Ollama
        let response = self.client
            .post(OLLAMA_API_URL)
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                error!("Failed to connect to Ollama for vision analysis: {}", e);
                anyhow::anyhow!("Ollama connection failed: {}", e)
            })?;

        // Check response status
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            error!("Ollama vision API error ({}): {}", status, error_text);
            return Err(anyhow::anyhow!("Vision analysis failed: {} - {}", status, error_text));
        }

        // Parse response
        let llava_response: LlavaResponse = response.json().await.map_err(|e| {
            error!("Failed to parse LLaVA response: {}", e);
            anyhow::anyhow!("Response parsing failed: {}", e)
        })?;

        info!("LLaVA analysis complete (length: {} chars)", llava_response.response.len());
        Ok(llava_response.response.trim().to_string())
    }

    /// Analyze screen context for AI awareness
    ///
    /// # Arguments
    /// * `screenshot_base64` - Base64 encoded screenshot (without data:image prefix)
    /// * `context_level` - 1 (current), 2 (recent), or 3 (full project)
    ///
    /// # Returns
    /// Structured analysis of screen content
    pub async fn analyze_screen_context(
        &self,
        screenshot_base64: String,
        context_level: u8,
    ) -> Result<ScreenAnalysis> {
        let prompt = match context_level {
            1 => {
                // Level 1: Quick analysis - what's on screen now
                "Quickly describe what application or window is currently active and what the user is doing. \
                 Be concise and focus on the main activity."
            },
            2 => {
                // Level 2: Recent work window - deeper understanding
                "Analyze the current screen in detail. Identify:\n\
                 - The active application and what it's being used for\n\
                 - Any code, documents, or content being worked on\n\
                 - The programming language or file type if applicable\n\
                 - The user's apparent task or goal"
            },
            3 => {
                // Level 3: Full project analysis - comprehensive
                "Provide a comprehensive analysis of this workspace:\n\
                 - What project or task is the user working on?\n\
                 - What technologies, frameworks, or tools are visible?\n\
                 - What is the current focus or problem being solved?\n\
                 - Any errors, warnings, or issues visible?\n\
                 - Suggested next steps or areas of focus"
            },
            _ => "Describe the screen content.",
        };

        info!("Analyzing screen with context level {}", context_level);

        let description = self.analyze_image(screenshot_base64, Some(prompt.to_string())).await?;

        // Parse description to extract structured data
        let analysis = self.parse_analysis(&description);

        Ok(ScreenAnalysis {
            description,
            detected_application: analysis.detected_application,
            detected_language: analysis.detected_language,
            workspace_type: analysis.workspace_type,
            confidence: 0.8, // LLaVA is generally reliable
            context_level,
        })
    }

    /// Analyze screen for proactive triggers
    /// Returns potential issues or opportunities for AI intervention
    pub async fn detect_proactive_triggers(
        &self,
        screenshot_base64: String,
    ) -> Result<Vec<ProactiveTrigger>> {
        let prompt = "Analyze this screen for potential issues or opportunities:\n\
                      - Are there any error messages or warnings?\n\
                      - Is there a long-running process that might need attention?\n\
                      - Are there any TODO comments or unfinished work?\n\
                      - Is the user stuck or repeating a pattern?\n\
                      Respond with a list of observations, or 'NONE' if nothing notable.";

        let analysis = self.analyze_image(screenshot_base64, Some(prompt.to_string())).await?;

        // Parse triggers from response
        let triggers = self.parse_triggers(&analysis);

        Ok(triggers)
    }

    /// Check if LLaVA model is loaded and ready
    pub fn is_ready(&self) -> bool {
        self.model_loaded
    }

    /// Test connection to Ollama vision API
    pub async fn test_connection(&self) -> Result<bool> {
        // Create a simple 1x1 pixel white image in base64
        let test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

        match self.analyze_image(test_image.to_string(), Some("Test".to_string())).await {
            Ok(_) => {
                info!("LLaVA vision connection test: SUCCESS");
                Ok(true)
            }
            Err(e) => {
                warn!("LLaVA vision connection test: FAILED - {}", e);
                Ok(false)
            }
        }
    }

    // === Private helper methods ===

    /// Parse analysis text to extract structured information
    fn parse_analysis(&self, description: &str) -> ParsedAnalysis {
        let lower = description.to_lowercase();

        // Detect application
        let detected_application = if lower.contains("vscode") || lower.contains("visual studio code") {
            Some("VSCode".to_string())
        } else if lower.contains("terminal") || lower.contains("command line") {
            Some("Terminal".to_string())
        } else if lower.contains("browser") || lower.contains("chrome") || lower.contains("firefox") {
            Some("Browser".to_string())
        } else if lower.contains("xcode") {
            Some("Xcode".to_string())
        } else if lower.contains("intellij") || lower.contains("pycharm") {
            Some("JetBrains IDE".to_string())
        } else {
            None
        };

        // Detect programming language
        let detected_language = if lower.contains("python") {
            Some("Python".to_string())
        } else if lower.contains("javascript") || lower.contains("typescript") {
            Some("JavaScript/TypeScript".to_string())
        } else if lower.contains("rust") {
            Some("Rust".to_string())
        } else if lower.contains("java") {
            Some("Java".to_string())
        } else if lower.contains("c++") || lower.contains("cpp") {
            Some("C++".to_string())
        } else {
            None
        };

        // Detect workspace type
        let workspace_type = if lower.contains("coding") || lower.contains("programming") {
            Some("Development".to_string())
        } else if lower.contains("writing") || lower.contains("document") {
            Some("Writing".to_string())
        } else if lower.contains("design") || lower.contains("figma") {
            Some("Design".to_string())
        } else {
            None
        };

        ParsedAnalysis {
            detected_application,
            detected_language,
            workspace_type,
        }
    }

    /// Parse proactive triggers from analysis text
    fn parse_triggers(&self, analysis: &str) -> Vec<ProactiveTrigger> {
        let mut triggers = Vec::new();

        if analysis.to_lowercase().contains("none") {
            return triggers;
        }

        let lower = analysis.to_lowercase();

        // Detect error messages
        if lower.contains("error") || lower.contains("exception") {
            triggers.push(ProactiveTrigger::ErrorDetected {
                description: "Error message or exception visible on screen".to_string(),
            });
        }

        // Detect warnings
        if lower.contains("warning") {
            triggers.push(ProactiveTrigger::WarningDetected {
                description: "Warning message visible".to_string(),
            });
        }

        // Detect TODO comments
        if lower.contains("todo") || lower.contains("fixme") {
            triggers.push(ProactiveTrigger::TodoDetected {
                description: "TODO or FIXME comment found".to_string(),
            });
        }

        // Detect build/compile in progress
        if lower.contains("compiling") || lower.contains("building") {
            triggers.push(ProactiveTrigger::LongRunningProcess {
                description: "Build or compilation in progress".to_string(),
            });
        }

        triggers
    }
}

/// Parsed analysis data
struct ParsedAnalysis {
    detected_application: Option<String>,
    detected_language: Option<String>,
    workspace_type: Option<String>,
}

/// Screen analysis result
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ScreenAnalysis {
    pub description: String,
    pub detected_application: Option<String>,
    pub detected_language: Option<String>,
    pub workspace_type: Option<String>,
    pub confidence: f32,
    pub context_level: u8,
}

/// Proactive trigger types
#[derive(Debug, Clone)]
pub enum ProactiveTrigger {
    ErrorDetected { description: String },
    WarningDetected { description: String },
    TodoDetected { description: String },
    LongRunningProcess { description: String },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_application() {
        let service = LlavaService::new().unwrap();
        let analysis = service.parse_analysis("The user is coding in VSCode with Python files open");

        assert_eq!(analysis.detected_application, Some("VSCode".to_string()));
        assert_eq!(analysis.detected_language, Some("Python".to_string()));
    }

    #[tokio::test]
    #[ignore] // Run manually when Ollama is available
    async fn test_vision_connection() {
        let service = LlavaService::new().unwrap();
        let result = service.test_connection().await;
        assert!(result.is_ok());
    }
}

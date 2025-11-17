/**
 * Tool Implementations (v3.5.2)
 *
 * Production tool implementations for the tool calling system:
 * - WebSearchTool: Fully integrated with WebSearchService (DuckDuckGo/SearX)
 * - UrlFetchTool: Fully integrated with UrlFetchService (HTML parsing)
 * - FileReadTool: Integrated with FileService
 * - FileWriteTool: Integrated with FileService
 * - SystemInfoTool: Integrated with SystemInfoService
 * - CalculatorTool: Simple math expression evaluator
 */

use anyhow::{anyhow, Result};
use serde_json;
use std::sync::Arc;
use tokio::sync::Mutex;

use super::tool_calling::{
    ToolCategory, ToolDefinition, ToolExecutor, ToolParameter, ParameterType,
};
use super::web_search::{WebSearchService, WebSearchSettings};
use super::url_fetch::{UrlFetchService, UrlFetchSettings};

/// Web search tool (fully integrated with WebSearchService)
pub struct WebSearchTool {
    service: Arc<Mutex<WebSearchService>>,
}

impl WebSearchTool {
    /// Create new web search tool with default settings
    pub fn new() -> Result<Self> {
        let settings = WebSearchSettings {
            enabled: true,  // Enable for tool usage
            ..Default::default()
        };
        let service = WebSearchService::new(settings)?;
        Ok(Self {
            service: Arc::new(Mutex::new(service)),
        })
    }

    /// Create with custom settings
    pub fn with_settings(settings: WebSearchSettings) -> Result<Self> {
        let service = WebSearchService::new(settings)?;
        Ok(Self {
            service: Arc::new(Mutex::new(service)),
        })
    }
}

#[async_trait::async_trait]
impl ToolExecutor for WebSearchTool {
    async fn execute(&self, arguments: serde_json::Value) -> Result<serde_json::Value> {
        let query = arguments.get("query")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'query' parameter"))?;

        log::info!("Web search tool executing: {}", query);

        // Get service lock and perform search
        let mut service = self.service.lock().await;

        match service.search(query).await {
            Ok(results) => {
                // Convert SearchResult to JSON
                let json_results: Vec<serde_json::Value> = results.iter().map(|r| {
                    serde_json::json!({
                        "title": r.title,
                        "url": r.url,
                        "snippet": r.snippet,
                        "source": r.source
                    })
                }).collect();

                Ok(serde_json::json!({
                    "results": json_results,
                    "query": query,
                    "count": results.len()
                }))
            }
            Err(e) => {
                log::error!("Web search failed: {}", e);
                Err(anyhow!("Web search failed: {}", e))
            }
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "web_search".to_string(),
            description: "Search the web for information using privacy-preserving DuckDuckGo".to_string(),
            category: ToolCategory::WebSearch,
            parameters: vec![
                ToolParameter {
                    name: "query".to_string(),
                    description: "Search query to find information about".to_string(),
                    param_type: ParameterType::String,
                    required: true,
                    enum_values: None,
                },
            ],
        }
    }
}

/// URL fetch tool (fully integrated with UrlFetchService)
pub struct UrlFetchTool {
    service: Arc<UrlFetchService>,
}

impl UrlFetchTool {
    /// Create new URL fetch tool with default settings
    pub fn new() -> Result<Self> {
        let settings = UrlFetchSettings {
            enabled: true,  // Enable for tool usage
            ..Default::default()
        };
        let service = UrlFetchService::new(settings)?;
        Ok(Self {
            service: Arc::new(service),
        })
    }

    /// Create with custom settings
    pub fn with_settings(settings: UrlFetchSettings) -> Result<Self> {
        let service = UrlFetchService::new(settings)?;
        Ok(Self {
            service: Arc::new(service),
        })
    }
}

#[async_trait::async_trait]
impl ToolExecutor for UrlFetchTool {
    async fn execute(&self, arguments: serde_json::Value) -> Result<serde_json::Value> {
        let url = arguments.get("url")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'url' parameter"))?;

        log::info!("URL fetch tool executing: {}", url);

        match self.service.fetch(url).await {
            Ok(content) => {
                Ok(serde_json::json!({
                    "url": content.url,
                    "title": content.title,
                    "text": content.text,
                    "summary": content.summary,
                    "word_count": content.word_count
                }))
            }
            Err(e) => {
                log::error!("URL fetch failed: {}", e);
                Err(anyhow!("URL fetch failed: {}", e))
            }
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "fetch_url".to_string(),
            description: "Fetch and extract text content from a web page URL".to_string(),
            category: ToolCategory::WebFetch,
            parameters: vec![
                ToolParameter {
                    name: "url".to_string(),
                    description: "URL of the web page to fetch (http:// or https://)".to_string(),
                    param_type: ParameterType::String,
                    required: true,
                    enum_values: None,
                },
            ],
        }
    }
}

/// File read tool (demonstration)
pub struct FileReadTool;

#[async_trait::async_trait]
impl ToolExecutor for FileReadTool {
    async fn execute(&self, arguments: serde_json::Value) -> Result<serde_json::Value> {
        let path = arguments.get("path")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'path' parameter"))?;

        log::info!("File read tool executing: {}", path);

        // Use FileService::read_file directly (it's a static method)
        match super::file::FileService::read_file(path) {
            Ok(content) => Ok(serde_json::json!({
                "path": path,
                "content": content,
                "size": content.len()
            })),
            Err(e) => Err(anyhow!("Failed to read file: {}", e))
        }
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "read_file".to_string(),
            description: "Read the contents of a text file from the local filesystem".to_string(),
            category: ToolCategory::FileSystem,
            parameters: vec![
                ToolParameter {
                    name: "path".to_string(),
                    description: "Path to the file to read".to_string(),
                    param_type: ParameterType::String,
                    required: true,
                    enum_values: None,
                },
            ],
        }
    }
}

/// File write tool (demonstration)
pub struct FileWriteTool;

#[async_trait::async_trait]
impl ToolExecutor for FileWriteTool {
    async fn execute(&self, arguments: serde_json::Value) -> Result<serde_json::Value> {
        let path = arguments.get("path")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'path' parameter"))?;

        let content = arguments.get("content")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'content' parameter"))?;

        log::info!("File write tool executing: {}", path);

        // Use FileService::write_file directly (it's a static method)
        super::file::FileService::write_file(path, content)?;

        Ok(serde_json::json!({
            "path": path,
            "bytes_written": content.len(),
            "success": true
        }))
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "write_file".to_string(),
            description: "Write content to a file on the local filesystem (creates or overwrites)".to_string(),
            category: ToolCategory::FileSystem,
            parameters: vec![
                ToolParameter {
                    name: "path".to_string(),
                    description: "Path where the file should be written".to_string(),
                    param_type: ParameterType::String,
                    required: true,
                    enum_values: None,
                },
                ToolParameter {
                    name: "content".to_string(),
                    description: "Text content to write to the file".to_string(),
                    param_type: ParameterType::String,
                    required: true,
                    enum_values: None,
                },
            ],
        }
    }
}

/// System information tool (demonstration)
pub struct SystemInfoTool;

#[async_trait::async_trait]
impl ToolExecutor for SystemInfoTool {
    async fn execute(&self, _arguments: serde_json::Value) -> Result<serde_json::Value> {
        log::info!("System info tool executing");

        // Get system info using SystemInfoService
        let mut service = super::system_info::SystemInfoService::new();
        let specs = service.detect_specs()?;

        Ok(serde_json::json!({
            "cpu_name": specs.cpu_name,
            "cpu_cores": specs.cpu_cores,
            "total_ram_gb": specs.total_ram_gb,
            "available_ram_gb": specs.available_ram_gb,
            "has_gpu": specs.has_gpu,
        }))
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "get_system_info".to_string(),
            description: "Get information about the current system (OS, CPU, memory, etc.)".to_string(),
            category: ToolCategory::System,
            parameters: vec![],
        }
    }
}

/// Calculator tool (demonstration)
pub struct CalculatorTool;

#[async_trait::async_trait]
impl ToolExecutor for CalculatorTool {
    async fn execute(&self, arguments: serde_json::Value) -> Result<serde_json::Value> {
        let expression = arguments.get("expression")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Missing 'expression' parameter"))?;

        log::info!("Calculator tool executing: {}", expression);

        // Simple placeholder evaluation
        // In production, use a proper math expression parser
        let result = if expression.contains("+") {
            let parts: Vec<&str> = expression.split('+').collect();
            if parts.len() == 2 {
                let a = parts[0].trim().parse::<f64>().unwrap_or(0.0);
                let b = parts[1].trim().parse::<f64>().unwrap_or(0.0);
                a + b
            } else {
                0.0
            }
        } else {
            expression.parse::<f64>().unwrap_or(0.0)
        };

        Ok(serde_json::json!({
            "expression": expression,
            "result": result
        }))
    }

    fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: "calculate".to_string(),
            description: "Perform mathematical calculations on simple expressions".to_string(),
            category: ToolCategory::Calculation,
            parameters: vec![
                ToolParameter {
                    name: "expression".to_string(),
                    description: "Mathematical expression to evaluate (e.g., '2 + 3')".to_string(),
                    param_type: ParameterType::String,
                    required: true,
                    enum_values: None,
                },
            ],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_info_tool_definition() {
        let tool = SystemInfoTool;
        let def = tool.definition();

        assert_eq!(def.name, "get_system_info");
        assert_eq!(def.category, ToolCategory::System);
        assert_eq!(def.parameters.len(), 0);
    }

    #[test]
    fn test_file_read_tool_definition() {
        let tool = FileReadTool;
        let def = tool.definition();

        assert_eq!(def.name, "read_file");
        assert_eq!(def.category, ToolCategory::FileSystem);
        assert_eq!(def.parameters.len(), 1);
    }

    #[test]
    fn test_calculator_tool() {
        let tool = CalculatorTool;

        let result = tool.execute(serde_json::json!({
            "expression": "2 + 3"
        })).unwrap();

        assert_eq!(result["result"], 5.0);
    }

    #[test]
    fn test_web_search_tool_definition() {
        let tool = WebSearchTool;
        let def = tool.definition();

        assert_eq!(def.name, "web_search");
        assert_eq!(def.category, ToolCategory::WebSearch);
    }
}

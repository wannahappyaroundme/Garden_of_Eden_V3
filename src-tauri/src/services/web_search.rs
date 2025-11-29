//! Web Search Service (v3.3.0 Internet Access)
//!
//! Privacy-first web search integration:
//! - DuckDuckGo API (no tracking)
//! - SearX instances (privacy-preserving meta-search)
//! - User opt-in required
//! - Rate limiting to prevent abuse
//! - No tracking or analytics

#![allow(dead_code)]  // Phase 9: Internet Access (opt-in feature)

use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime};

/// Search result from web search
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub source: String,  // "duckduckgo" or "searx"
}

/// Web search settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSearchSettings {
    pub enabled: bool,
    pub default_engine: SearchEngine,
    pub max_results: usize,
    pub searx_instance: String,  // Custom SearX instance URL
}

impl Default for WebSearchSettings {
    fn default() -> Self {
        Self {
            enabled: false,  // Privacy-first: disabled by default
            default_engine: SearchEngine::DuckDuckGo,
            max_results: 5,
            searx_instance: "https://searx.be".to_string(),
        }
    }
}

/// Available search engines
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SearchEngine {
    DuckDuckGo,
    SearX,
}

/// DuckDuckGo API response
#[derive(Debug, Deserialize)]
struct DuckDuckGoResponse {
    #[serde(rename = "RelatedTopics")]
    related_topics: Vec<DuckDuckGoTopic>,
}

#[derive(Debug, Deserialize)]
struct DuckDuckGoTopic {
    #[serde(rename = "Text")]
    text: Option<String>,
    #[serde(rename = "FirstURL")]
    first_url: Option<String>,
}

/// SearX API response
#[derive(Debug, Deserialize)]
struct SearXResponse {
    results: Vec<SearXResult>,
}

#[derive(Debug, Deserialize)]
struct SearXResult {
    title: String,
    url: String,
    content: String,
}

/// Web search service
pub struct WebSearchService {
    client: Client,
    settings: WebSearchSettings,
    last_search_time: Option<SystemTime>,
    rate_limit_seconds: u64,
}

impl WebSearchService {
    /// Create new web search service
    pub fn new(settings: WebSearchSettings) -> Result<Self> {
        let client = Client::builder()
            .user_agent("Garden-of-Eden-V3/3.3.0") // Identify ourselves
            .timeout(Duration::from_secs(10))
            .build()?;

        Ok(Self {
            client,
            settings,
            last_search_time: None,
            rate_limit_seconds: 2, // Minimum 2 seconds between searches
        })
    }

    /// Check if internet access is enabled
    pub fn is_enabled(&self) -> bool {
        self.settings.enabled
    }

    /// Perform web search
    pub async fn search(&mut self, query: &str) -> Result<Vec<SearchResult>> {
        if !self.settings.enabled {
            return Err(anyhow!("Web search is disabled. Enable it in settings."));
        }

        // Rate limiting
        self.check_rate_limit()?;

        log::info!("Performing web search: {} (engine: {:?})", query, self.settings.default_engine);

        let results = match self.settings.default_engine {
            SearchEngine::DuckDuckGo => self.search_duckduckgo(query).await?,
            SearchEngine::SearX => self.search_searx(query).await?,
        };

        self.last_search_time = Some(SystemTime::now());

        log::info!("Found {} search results", results.len());
        Ok(results)
    }

    /// Search using DuckDuckGo Instant Answer API
    async fn search_duckduckgo(&self, query: &str) -> Result<Vec<SearchResult>> {
        let url = format!(
            "https://api.duckduckgo.com/?q={}&format=json&no_html=1&skip_disambig=1",
            urlencoding::encode(query)
        );

        let response = self.client
            .get(&url)
            .send()
            .await?;

        let ddg_response: DuckDuckGoResponse = response.json().await?;

        let results = ddg_response
            .related_topics
            .into_iter()
            .filter_map(|topic| {
                if let (Some(text), Some(url)) = (topic.text, topic.first_url) {
                    // Extract title from text (first sentence usually)
                    let parts: Vec<&str> = text.splitn(2, " - ").collect();
                    let title = parts.get(0).unwrap_or(&text.as_str()).to_string();
                    let snippet = parts.get(1).unwrap_or(&text.as_str()).to_string();

                    Some(SearchResult {
                        title,
                        url,
                        snippet,
                        source: "duckduckgo".to_string(),
                    })
                } else {
                    None
                }
            })
            .take(self.settings.max_results)
            .collect();

        Ok(results)
    }

    /// Search using SearX meta-search engine
    async fn search_searx(&self, query: &str) -> Result<Vec<SearchResult>> {
        let url = format!(
            "{}/search?q={}&format=json&categories=general",
            self.settings.searx_instance,
            urlencoding::encode(query)
        );

        let response = self.client
            .get(&url)
            .send()
            .await?;

        let searx_response: SearXResponse = response.json().await?;

        let results = searx_response
            .results
            .into_iter()
            .take(self.settings.max_results)
            .map(|result| SearchResult {
                title: result.title,
                url: result.url,
                snippet: result.content,
                source: "searx".to_string(),
            })
            .collect();

        Ok(results)
    }

    /// Check rate limiting
    fn check_rate_limit(&self) -> Result<()> {
        if let Some(last_time) = self.last_search_time {
            let elapsed = SystemTime::now()
                .duration_since(last_time)
                .unwrap_or(Duration::from_secs(0));

            if elapsed.as_secs() < self.rate_limit_seconds {
                let wait_time = self.rate_limit_seconds - elapsed.as_secs();
                return Err(anyhow!(
                    "Rate limit: Please wait {} seconds before next search",
                    wait_time
                ));
            }
        }

        Ok(())
    }

    /// Update settings
    pub fn update_settings(&mut self, settings: WebSearchSettings) {
        log::info!("Updating web search settings: {:?}", settings);
        self.settings = settings;
    }

    /// Get current settings
    pub fn get_settings(&self) -> &WebSearchSettings {
        &self.settings
    }

    /// Format search results for AI context
    pub fn format_results_for_context(results: &[SearchResult]) -> String {
        if results.is_empty() {
            return "No web search results found.".to_string();
        }

        let mut context = String::from("=== Web Search Results ===\n\n");

        for (i, result) in results.iter().enumerate() {
            context.push_str(&format!(
                "{}. {}\n   URL: {}\n   {}\n\n",
                i + 1,
                result.title,
                result.url,
                result.snippet
            ));
        }

        context.push_str("=== End of Search Results ===\n");
        context
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = WebSearchSettings::default();
        assert!(!settings.enabled); // Disabled by default for privacy
        assert_eq!(settings.default_engine, SearchEngine::DuckDuckGo);
        assert_eq!(settings.max_results, 5);
    }

    #[test]
    fn test_format_results() {
        let results = vec![
            SearchResult {
                title: "Test Result 1".to_string(),
                url: "https://example.com/1".to_string(),
                snippet: "This is a test snippet".to_string(),
                source: "duckduckgo".to_string(),
            },
            SearchResult {
                title: "Test Result 2".to_string(),
                url: "https://example.com/2".to_string(),
                snippet: "Another test snippet".to_string(),
                source: "searx".to_string(),
            },
        ];

        let formatted = WebSearchService::format_results_for_context(&results);

        assert!(formatted.contains("Web Search Results"));
        assert!(formatted.contains("Test Result 1"));
        assert!(formatted.contains("https://example.com/1"));
        assert!(formatted.contains("This is a test snippet"));
    }

    #[test]
    fn test_format_empty_results() {
        let results: Vec<SearchResult> = vec![];
        let formatted = WebSearchService::format_results_for_context(&results);

        assert_eq!(formatted, "No web search results found.");
    }

    #[tokio::test]
    #[ignore] // Requires internet connection
    async fn test_duckduckgo_search() {
        let mut settings = WebSearchSettings::default();
        settings.enabled = true;
        settings.default_engine = SearchEngine::DuckDuckGo;

        let mut service = WebSearchService::new(settings).unwrap();
        let results = service.search("Rust programming language").await;

        // Should either succeed or fail gracefully
        match results {
            Ok(res) => assert!(!res.is_empty()),
            Err(e) => eprintln!("Search failed (expected in some environments): {}", e),
        }
    }

    #[test]
    fn test_disabled_by_default() {
        let settings = WebSearchSettings::default();
        let mut service = WebSearchService::new(settings).unwrap();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(service.search("test"));

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("disabled"));
    }
}

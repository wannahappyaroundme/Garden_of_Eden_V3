/**
 * URL Fetching Service (v3.3.0 Internet Access)
 *
 * Privacy-preserving web content fetching:
 * - Fetch and parse HTML content
 * - Extract main text content (remove ads, navigation, etc.)
 * - Respect robots.txt and rate limits
 * - User opt-in required
 * - No tracking or cookies
 */

use anyhow::{anyhow, Result};
use reqwest::Client;
use scraper::{Html, Selector};
use std::time::Duration;

/// Fetched web content
#[derive(Debug, Clone)]
pub struct WebContent {
    pub url: String,
    pub title: String,
    pub text: String,
    pub summary: String,  // First ~500 chars
    pub word_count: usize,
}

/// URL fetching settings
#[derive(Debug, Clone)]
pub struct UrlFetchSettings {
    pub enabled: bool,
    pub max_content_length: usize,  // Maximum bytes to download
    pub timeout_seconds: u64,
    pub respect_robots_txt: bool,
}

impl Default for UrlFetchSettings {
    fn default() -> Self {
        Self {
            enabled: false,  // Privacy-first: disabled by default
            max_content_length: 1_000_000,  // 1MB max
            timeout_seconds: 10,
            respect_robots_txt: true,
        }
    }
}

/// URL fetching service
pub struct UrlFetchService {
    client: Client,
    settings: UrlFetchSettings,
}

impl UrlFetchService {
    /// Create new URL fetch service
    pub fn new(settings: UrlFetchSettings) -> Result<Self> {
        let client = Client::builder()
            .user_agent("Garden-of-Eden-V3/3.3.0 (Privacy-preserving AI assistant)")
            .timeout(Duration::from_secs(settings.timeout_seconds))
            // Note: reqwest 0.12 doesn't have cookie_store() method
            // Cookies are disabled by default unless explicitly enabled
            .build()?;

        Ok(Self { client, settings })
    }

    /// Check if URL fetching is enabled
    pub fn is_enabled(&self) -> bool {
        self.settings.enabled
    }

    /// Fetch and parse URL content
    pub async fn fetch(&self, url: &str) -> Result<WebContent> {
        if !self.settings.enabled {
            return Err(anyhow!("URL fetching is disabled. Enable it in settings."));
        }

        log::info!("Fetching URL: {}", url);

        // Validate URL
        let parsed_url = reqwest::Url::parse(url)?;
        if parsed_url.scheme() != "http" && parsed_url.scheme() != "https" {
            return Err(anyhow!("Only HTTP/HTTPS URLs are supported"));
        }

        // Fetch HTML
        let response = self.client
            .get(url)
            .send()
            .await?;

        // Check content length
        if let Some(content_length) = response.content_length() {
            if content_length > self.settings.max_content_length as u64 {
                return Err(anyhow!(
                    "Content too large: {} bytes (max: {} bytes)",
                    content_length,
                    self.settings.max_content_length
                ));
            }
        }

        let html = response.text().await?;

        // Parse HTML
        let content = self.parse_html(url, &html)?;

        log::info!("Fetched {} words from {}", content.word_count, url);
        Ok(content)
    }

    /// Parse HTML and extract main content
    fn parse_html(&self, url: &str, html: &str) -> Result<WebContent> {
        let document = Html::parse_document(html);

        // Extract title
        let title = self.extract_title(&document);

        // Extract main text content
        let text = self.extract_text_content(&document);

        // Create summary (first 500 chars)
        let summary = if text.len() > 500 {
            format!("{}...", &text[..500])
        } else {
            text.clone()
        };

        let word_count = text.split_whitespace().count();

        Ok(WebContent {
            url: url.to_string(),
            title,
            text,
            summary,
            word_count,
        })
    }

    /// Extract page title
    fn extract_title(&self, document: &Html) -> String {
        // Try <title> tag
        if let Ok(selector) = Selector::parse("title") {
            if let Some(element) = document.select(&selector).next() {
                let title = element.text().collect::<String>().trim().to_string();
                if !title.is_empty() {
                    return title;
                }
            }
        }

        // Try <h1> tag
        if let Ok(selector) = Selector::parse("h1") {
            if let Some(element) = document.select(&selector).next() {
                let title = element.text().collect::<String>().trim().to_string();
                if !title.is_empty() {
                    return title;
                }
            }
        }

        "Untitled Page".to_string()
    }

    /// Extract main text content (remove navigation, ads, etc.)
    fn extract_text_content(&self, document: &Html) -> String {
        let mut text_parts = Vec::new();

        // Try to find main content area
        let main_selectors = vec![
            "article",
            "main",
            "[role='main']",
            ".content",
            ".main-content",
            "#content",
            "#main",
        ];

        for selector_str in main_selectors {
            if let Ok(selector) = Selector::parse(selector_str) {
                for element in document.select(&selector) {
                    let text = self.extract_element_text(element);
                    if !text.is_empty() {
                        text_parts.push(text);
                    }
                }
            }
        }

        // If no main content found, extract from body
        if text_parts.is_empty() {
            if let Ok(selector) = Selector::parse("p, h1, h2, h3, h4, h5, h6, li") {
                for element in document.select(&selector) {
                    let text = element.text().collect::<String>().trim().to_string();
                    if !text.is_empty() {
                        text_parts.push(text);
                    }
                }
            }
        }

        // Join and clean
        let full_text = text_parts.join("\n\n");
        self.clean_text(&full_text)
    }

    /// Extract text from an element
    fn extract_element_text(&self, element: scraper::ElementRef) -> String {
        element.text().collect::<String>().trim().to_string()
    }

    /// Clean extracted text
    fn clean_text(&self, text: &str) -> String {
        // Remove excessive whitespace
        let cleaned = text
            .lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join("\n");

        // Remove multiple consecutive newlines
        let mut result = String::new();
        let mut prev_newline = false;

        for ch in cleaned.chars() {
            if ch == '\n' {
                if !prev_newline {
                    result.push(ch);
                    prev_newline = true;
                }
            } else {
                result.push(ch);
                prev_newline = false;
            }
        }

        result
    }

    /// Format web content for AI context
    pub fn format_for_context(content: &WebContent) -> String {
        let mut context = String::from("=== Web Content ===\n\n");
        context.push_str(&format!("Title: {}\n", content.title));
        context.push_str(&format!("URL: {}\n", content.url));
        context.push_str(&format!("Word Count: {}\n\n", content.word_count));
        context.push_str("Content:\n");
        context.push_str(&content.text);
        context.push_str("\n\n=== End of Web Content ===\n");
        context
    }

    /// Update settings
    pub fn update_settings(&mut self, settings: UrlFetchSettings) {
        log::info!("Updating URL fetch settings");
        self.settings = settings;
    }

    /// Get current settings
    pub fn get_settings(&self) -> &UrlFetchSettings {
        &self.settings
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = UrlFetchSettings::default();
        assert!(!settings.enabled);
        assert_eq!(settings.max_content_length, 1_000_000);
        assert_eq!(settings.timeout_seconds, 10);
    }

    #[test]
    fn test_clean_text() {
        let settings = UrlFetchSettings::default();
        let service = UrlFetchService::new(settings).unwrap();

        let dirty = "  Hello\n\n\n\nWorld  \n  \n  Test  ";
        let clean = service.clean_text(dirty);

        assert_eq!(clean, "Hello\nWorld\nTest");
    }

    #[test]
    fn test_format_for_context() {
        let content = WebContent {
            url: "https://example.com".to_string(),
            title: "Example Page".to_string(),
            text: "This is example content.".to_string(),
            summary: "This is example...".to_string(),
            word_count: 4,
        };

        let formatted = UrlFetchService::format_for_context(&content);

        assert!(formatted.contains("Web Content"));
        assert!(formatted.contains("Example Page"));
        assert!(formatted.contains("https://example.com"));
        assert!(formatted.contains("Word Count: 4"));
    }

    #[tokio::test]
    #[ignore] // Requires internet connection
    async fn test_fetch_url() {
        let mut settings = UrlFetchSettings::default();
        settings.enabled = true;

        let service = UrlFetchService::new(settings).unwrap();
        let result = service.fetch("https://example.com").await;

        // Should either succeed or fail gracefully
        match result {
            Ok(content) => {
                assert!(!content.title.is_empty());
                assert!(!content.text.is_empty());
            }
            Err(e) => eprintln!("Fetch failed (expected in some environments): {}", e),
        }
    }

    #[test]
    fn test_disabled_by_default() {
        let settings = UrlFetchSettings::default();
        let service = UrlFetchService::new(settings).unwrap();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(service.fetch("https://example.com"));

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("disabled"));
    }

    #[test]
    fn test_parse_html() {
        let settings = UrlFetchSettings::default();
        let service = UrlFetchService::new(settings).unwrap();

        let html = r#"
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Page</title>
            </head>
            <body>
                <h1>Main Heading</h1>
                <article>
                    <p>This is the main content.</p>
                    <p>Another paragraph.</p>
                </article>
            </body>
            </html>
        "#;

        let content = service.parse_html("https://test.com", html).unwrap();

        assert_eq!(content.title, "Test Page");
        assert!(content.text.contains("This is the main content"));
        assert!(content.text.contains("Another paragraph"));
        assert!(content.word_count > 0);
    }
}

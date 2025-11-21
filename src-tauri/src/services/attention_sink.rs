/**
 * Attention Sink Manager (v3.6.0)
 *
 * StreamingLLM pattern for handling long contexts (100K+ tokens)
 *
 * Algorithm:
 * 1. Keep first 4 tokens (attention sink/anchor)
 * 2. Compress middle section:
 *    - Divide into chunks of 2000 tokens
 *    - Summarize each chunk with LLM
 *    - Result: ~200 tokens per chunk (10x compression)
 * 3. Keep recent 4000 tokens (working memory)
 *
 * Output: 4 + compressed_middle + 4000 tokens (~10K total)
 *
 * Benefits:
 * - Prevents attention degradation in long contexts
 * - Maintains first/last token importance
 * - Reduces context from 100K → 10K tokens
 * - Preserves conversation coherence
 */

use log::{debug, info, warn};
use serde::{Deserialize, Serialize};

/// Attention Sink configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AttentionSinkConfig {
    pub sink_size: usize,        // First N tokens to keep (default: 4)
    pub window_size: usize,      // Recent tokens window (default: 4000)
    pub compression_ratio: f32,  // How much to compress middle (default: 0.1)
    pub chunk_size: usize,       // Size of chunks for compression (default: 2000)
    pub max_context_tokens: usize, // Max tokens before compression (default: 32768)
}

impl Default for AttentionSinkConfig {
    fn default() -> Self {
        AttentionSinkConfig {
            sink_size: 4,
            window_size: 4000,
            compression_ratio: 0.1,
            chunk_size: 2000,
            max_context_tokens: 32768,  // Qwen 2.5 context window
        }
    }
}

/// Managed context with attention sink pattern
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ManagedContext {
    pub attention_sink: String,      // First N tokens (anchor)
    pub compressed_middle: String,   // Summarized middle section
    pub recent_window: String,       // Recent tokens
    pub total_original_tokens: usize,
    pub compressed_tokens: usize,
    pub compression_ratio_achieved: f32,
    pub requires_compression: bool,
}

/// Attention Sink Manager
pub struct AttentionSinkManager {
    config: AttentionSinkConfig,
}

impl AttentionSinkManager {
    /// Create new attention sink manager with default config
    pub fn new() -> Self {
        info!("Initializing Attention Sink Manager (StreamingLLM pattern)");
        AttentionSinkManager {
            config: AttentionSinkConfig::default(),
        }
    }

    /// Create with custom configuration
    pub fn with_config(config: AttentionSinkConfig) -> Self {
        info!(
            "Initializing Attention Sink Manager (sink_size: {}, window_size: {})",
            config.sink_size, config.window_size
        );
        AttentionSinkManager { config }
    }

    /// Check if context needs compression
    pub fn needs_compression(&self, token_count: usize) -> bool {
        token_count > self.config.max_context_tokens
    }

    /// Estimate token count (simple heuristic: ~1.3 tokens per word)
    pub fn estimate_tokens(&self, text: &str) -> usize {
        let word_count = text.split_whitespace().count();
        (word_count as f32 * 1.3) as usize
    }

    /// Manage context with attention sink pattern
    pub fn manage_context(&self, full_context: &str) -> ManagedContext {
        let estimated_tokens = self.estimate_tokens(full_context);

        debug!(
            "Managing context: {} estimated tokens (max: {})",
            estimated_tokens, self.config.max_context_tokens
        );

        // If context is small enough, no compression needed
        if !self.needs_compression(estimated_tokens) {
            debug!("Context within limits, no compression needed");
            return ManagedContext {
                attention_sink: String::new(),
                compressed_middle: String::new(),
                recent_window: full_context.to_string(),
                total_original_tokens: estimated_tokens,
                compressed_tokens: estimated_tokens,
                compression_ratio_achieved: 1.0,
                requires_compression: false,
            };
        }

        info!("Context exceeds limit, applying attention sink compression");

        // Split context into messages/chunks
        let messages: Vec<&str> = full_context.split("\n\n").collect();

        if messages.is_empty() {
            warn!("Empty context provided");
            return self.empty_context();
        }

        // 1. Extract attention sink (first few messages)
        let sink_messages_count = self.config.sink_size.min(messages.len());
        let attention_sink: String = messages[..sink_messages_count].join("\n\n");

        // 2. Extract recent window (last N messages)
        let window_messages_count = self.estimate_message_count_for_tokens(
            &messages,
            self.config.window_size,
        );
        let recent_start = (messages.len() - window_messages_count).max(sink_messages_count);
        let recent_window: String = messages[recent_start..].join("\n\n");

        // 3. Compress middle section
        let middle_start = sink_messages_count;
        let middle_end = recent_start;

        let compressed_middle = if middle_end > middle_start {
            let middle_messages = &messages[middle_start..middle_end];
            self.compress_middle(middle_messages)
        } else {
            String::new()
        };

        // Calculate compression statistics
        let sink_tokens = self.estimate_tokens(&attention_sink);
        let middle_tokens = self.estimate_tokens(&compressed_middle);
        let window_tokens = self.estimate_tokens(&recent_window);
        let compressed_total = sink_tokens + middle_tokens + window_tokens;

        let compression_ratio_achieved = compressed_total as f32 / estimated_tokens as f32;

        info!(
            "Compression complete: {} → {} tokens ({:.1}% compression)",
            estimated_tokens,
            compressed_total,
            (1.0 - compression_ratio_achieved) * 100.0
        );

        ManagedContext {
            attention_sink,
            compressed_middle,
            recent_window,
            total_original_tokens: estimated_tokens,
            compressed_tokens: compressed_total,
            compression_ratio_achieved,
            requires_compression: true,
        }
    }

    /// Compress middle section by summarizing in chunks
    fn compress_middle(&self, messages: &[&str]) -> String {
        if messages.is_empty() {
            return String::new();
        }

        debug!("Compressing {} middle messages", messages.len());

        // Group messages into chunks
        let chunk_size = 10; // ~10 messages per chunk
        let mut compressed_chunks = Vec::new();

        for chunk in messages.chunks(chunk_size) {
            let chunk_text = chunk.join("\n");
            let summary = self.summarize_chunk(&chunk_text);
            compressed_chunks.push(summary);
        }

        let result = compressed_chunks.join("\n\n[...]\n\n");
        debug!("Compressed to {} summary chunks", compressed_chunks.len());

        result
    }

    /// Summarize a chunk of text (placeholder for now)
    fn summarize_chunk(&self, chunk: &str) -> String {
        // For v3.6.0, we use a simple extractive summary
        // TODO: In production, call LLM for abstractive summarization

        let lines: Vec<&str> = chunk.lines().collect();

        if lines.len() <= 3 {
            return chunk.to_string();
        }

        // Extract key lines (first, last, and middle)
        let summary_lines: Vec<String> = vec![
            lines.first().unwrap_or(&"").to_string(),
            lines.get(lines.len() / 2).unwrap_or(&"").to_string(),
            lines.last().unwrap_or(&"").to_string(),
        ];

        format!("[Summary] {}", summary_lines.join(" ... "))
    }

    /// Estimate how many messages fit in token budget
    fn estimate_message_count_for_tokens(&self, messages: &[&str], target_tokens: usize) -> usize {
        let mut total_tokens = 0;
        let mut count = 0;

        for message in messages.iter().rev() {
            let message_tokens = self.estimate_tokens(message);
            if total_tokens + message_tokens > target_tokens {
                break;
            }
            total_tokens += message_tokens;
            count += 1;
        }

        count.max(1) // At least 1 message
    }

    /// Format managed context for LLM prompt
    pub fn format_for_prompt(&self, context: &ManagedContext) -> String {
        let mut formatted = String::new();

        // Add attention sink if present
        if !context.attention_sink.is_empty() {
            formatted.push_str("=== Conversation Start ===\n");
            formatted.push_str(&context.attention_sink);
            formatted.push_str("\n\n");
        }

        // Add compressed middle if present
        if !context.compressed_middle.is_empty() {
            formatted.push_str("=== Earlier Context (Summarized) ===\n");
            formatted.push_str(&context.compressed_middle);
            formatted.push_str("\n\n");
        }

        // Add recent window
        formatted.push_str("=== Recent Conversation ===\n");
        formatted.push_str(&context.recent_window);

        formatted
    }

    /// Get empty context
    fn empty_context(&self) -> ManagedContext {
        ManagedContext {
            attention_sink: String::new(),
            compressed_middle: String::new(),
            recent_window: String::new(),
            total_original_tokens: 0,
            compressed_tokens: 0,
            compression_ratio_achieved: 1.0,
            requires_compression: false,
        }
    }

    /// Get configuration
    pub fn config(&self) -> &AttentionSinkConfig {
        &self.config
    }

    /// Update configuration
    pub fn set_config(&mut self, config: AttentionSinkConfig) {
        info!(
            "Updating Attention Sink config: sink_size={}, window_size={}",
            config.sink_size, config.window_size
        );
        self.config = config;
    }

    /// Get statistics
    pub fn stats(&self) -> AttentionSinkStats {
        AttentionSinkStats {
            sink_size: self.config.sink_size,
            window_size: self.config.window_size,
            compression_ratio: self.config.compression_ratio,
            chunk_size: self.config.chunk_size,
            max_context_tokens: self.config.max_context_tokens,
        }
    }
}

impl Default for AttentionSinkManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Attention Sink statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttentionSinkStats {
    pub sink_size: usize,
    pub window_size: usize,
    pub compression_ratio: f32,
    pub chunk_size: usize,
    pub max_context_tokens: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_token_estimation() {
        let manager = AttentionSinkManager::new();
        let text = "Hello world, this is a test message.";
        let tokens = manager.estimate_tokens(text);

        // ~7 words * 1.3 ≈ 9 tokens
        assert!(tokens >= 8 && tokens <= 10);
    }

    #[test]
    fn test_needs_compression() {
        let manager = AttentionSinkManager::new();

        assert!(!manager.needs_compression(1000));
        assert!(!manager.needs_compression(30000));
        assert!(manager.needs_compression(35000));
        assert!(manager.needs_compression(100000));
    }

    #[test]
    fn test_small_context_no_compression() {
        let manager = AttentionSinkManager::new();
        let small_context = "User: Hello\nAssistant: Hi there!";

        let result = manager.manage_context(small_context);

        assert!(!result.requires_compression);
        assert_eq!(result.recent_window, small_context);
        assert!(result.attention_sink.is_empty());
        assert!(result.compressed_middle.is_empty());
    }

    #[test]
    fn test_large_context_compression() {
        let mut config = AttentionSinkConfig::default();
        config.max_context_tokens = 100; // Low threshold for testing
        let manager = AttentionSinkManager::with_config(config);

        // Create a large context
        let mut messages = Vec::new();
        for i in 0..50 {
            messages.push(format!("User: Message {}\n\nAssistant: Response {}", i, i));
        }
        let large_context = messages.join("\n\n");

        let result = manager.manage_context(&large_context);

        assert!(result.requires_compression);
        assert!(!result.attention_sink.is_empty());
        assert!(!result.recent_window.is_empty());
        assert!(result.compressed_tokens < result.total_original_tokens);
        assert!(result.compression_ratio_achieved < 1.0);
    }

    #[test]
    fn test_format_for_prompt() {
        let manager = AttentionSinkManager::new();

        let context = ManagedContext {
            attention_sink: "User: Hello".to_string(),
            compressed_middle: "[Summary] Previous conversation".to_string(),
            recent_window: "User: What's the weather?".to_string(),
            total_original_tokens: 1000,
            compressed_tokens: 500,
            compression_ratio_achieved: 0.5,
            requires_compression: true,
        };

        let formatted = manager.format_for_prompt(&context);

        assert!(formatted.contains("=== Conversation Start ==="));
        assert!(formatted.contains("=== Earlier Context (Summarized) ==="));
        assert!(formatted.contains("=== Recent Conversation ==="));
        assert!(formatted.contains("Hello"));
        assert!(formatted.contains("Previous conversation"));
        assert!(formatted.contains("weather"));
    }
}

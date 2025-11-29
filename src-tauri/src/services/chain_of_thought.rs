//! Phase 5: Chain-of-Thought Engine (v3.9.0)
//!
//! Step-by-step reasoning system for complex problem solving.
//!
//! Algorithm:
//! 1. Break down complex queries into reasoning steps
//! 2. Execute each step with LLM (Ollama)
//! 3. Verify and self-correct intermediate results
//! 4. Synthesize final answer from step chain
//! 5. Calculate confidence based on reasoning quality
//!
//! Features:
//! - Multi-step reasoning (default: 5 steps max)
//! - Self-correction and verification
//! - Confidence scoring
//! - Intermediate result caching
//! - VRAM efficient (reuses Ollama instance)

#![allow(dead_code)]  // Phase 5: Reasoning Engine 2.0 (scheduled)

use crate::services::ollama;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Single step in chain of thought
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningStep {
    /// Step number (1-indexed)
    pub step_number: usize,

    /// Current understanding of the problem
    pub understanding: String,

    /// What needs to be figured out next
    pub next_question: String,

    /// Whether this is the final answer
    pub is_complete: bool,

    /// Confidence in this step (0.0-1.0)
    pub confidence: f32,

    /// Timestamp
    pub timestamp: i64,
}

/// Complete reasoning chain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reasoning {
    /// All reasoning steps
    pub steps: Vec<ReasoningStep>,

    /// Final synthesized answer
    pub final_answer: String,

    /// Overall confidence (0.0-1.0)
    pub confidence: f32,

    /// Total reasoning time (seconds)
    pub reasoning_time: f32,

    /// Whether reasoning was successful
    pub success: bool,
}

/// Configuration for CoT engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoTConfig {
    /// Maximum reasoning steps
    pub max_steps: usize,

    /// Minimum confidence to proceed
    pub min_confidence: f32,

    /// Whether to enable self-correction
    pub enable_self_correction: bool,

    /// Whether to cache intermediate results
    pub enable_caching: bool,
}

impl Default for CoTConfig {
    fn default() -> Self {
        Self {
            max_steps: 5,
            min_confidence: 0.6,
            enable_self_correction: true,
            enable_caching: true,
        }
    }
}

/// Chain-of-Thought Engine
pub struct ChainOfThoughtEngine {
    config: Arc<Mutex<CoTConfig>>,
    cache: Arc<Mutex<std::collections::HashMap<String, Reasoning>>>,
}

impl ChainOfThoughtEngine {
    /// Create new CoT engine
    pub fn new() -> Self {
        Self {
            config: Arc::new(Mutex::new(CoTConfig::default())),
            cache: Arc::new(Mutex::new(std::collections::HashMap::new())),
        }
    }

    /// Perform step-by-step reasoning
    ///
    /// # Arguments
    /// * `query` - The question/problem to reason about
    /// * `context` - Additional context (optional)
    ///
    /// # Returns
    /// Complete reasoning chain with final answer
    pub async fn reason(&self, query: &str, context: Option<&str>) -> Result<Reasoning> {
        let start_time = std::time::Instant::now();
        let config = self.config.lock().unwrap().clone();

        log::info!("Starting chain-of-thought reasoning for query: {}", &query[..query.len().min(100)]);

        // Check cache
        if config.enable_caching {
            let cache_key = self.generate_cache_key(query, context);
            if let Some(cached) = self.get_cached(&cache_key) {
                log::info!("Using cached reasoning result");
                return Ok(cached);
            }
        }

        let mut steps = Vec::new();
        let mut current_thought = query.to_string();

        // Execute reasoning steps
        for i in 0..config.max_steps {
            log::debug!("Reasoning step {}/{}", i + 1, config.max_steps);

            let step = self.think_step(&current_thought, context, i + 1).await?;

            // Check confidence threshold
            if step.confidence < config.min_confidence && config.enable_self_correction {
                log::warn!(
                    "Low confidence ({:.2}) in step {}, attempting correction",
                    step.confidence,
                    i + 1
                );

                let corrected = self.self_correct(&step, context).await?;
                steps.push(corrected.clone());

                if corrected.is_complete {
                    break;
                }

                current_thought = corrected.next_question;
            } else {
                steps.push(step.clone());

                if step.is_complete {
                    log::info!("Reasoning complete at step {}", i + 1);
                    break;
                }

                current_thought = step.next_question;
            }
        }

        // Synthesize final answer
        let final_answer = self.synthesize_answer(&steps, query).await?;
        let confidence = self.calculate_confidence(&steps);
        let reasoning_time = start_time.elapsed().as_secs_f32();

        let reasoning = Reasoning {
            steps: steps.clone(),
            final_answer,
            confidence,
            reasoning_time,
            success: true,
        };

        // Cache result
        if config.enable_caching {
            let cache_key = self.generate_cache_key(query, context);
            self.cache_result(&cache_key, reasoning.clone());
        }

        log::info!(
            "Reasoning complete: {} steps, confidence={:.2}, time={:.2}s",
            reasoning.steps.len(),
            reasoning.confidence,
            reasoning.reasoning_time
        );

        Ok(reasoning)
    }

    /// Execute single reasoning step
    async fn think_step(
        &self,
        thought: &str,
        context: Option<&str>,
        step_number: usize,
    ) -> Result<ReasoningStep> {
        let context_str = context.unwrap_or("None");

        let prompt = format!(
            r#"You are reasoning step-by-step about a question.

Question/Current Thought:
{thought}

Additional Context:
{context_str}

Think carefully about this step. Provide:
1. Your current understanding of the problem
2. What you need to figure out next (or "Final answer ready" if done)
3. Whether this is the final answer (true/false)
4. Your confidence in this step (0.0 to 1.0)

Respond ONLY with valid JSON (no other text):
{{
  "understanding": "your current understanding...",
  "next_question": "what to figure out next OR final answer",
  "is_complete": false,
  "confidence": 0.8
}}"#
        );

        let response = ollama::generate_response(&prompt)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to generate reasoning step: {}", e))?;

        // Parse JSON response
        let json = self.extract_json(&response)?;

        #[derive(Deserialize)]
        struct StepData {
            understanding: String,
            next_question: String,
            is_complete: bool,
            confidence: f32,
        }

        let data: StepData = serde_json::from_str(&json)
            .context("Failed to parse reasoning step JSON")?;

        Ok(ReasoningStep {
            step_number,
            understanding: data.understanding,
            next_question: data.next_question,
            is_complete: data.is_complete,
            confidence: data.confidence.clamp(0.0, 1.0),
            timestamp: chrono::Utc::now().timestamp(),
        })
    }

    /// Self-correct a low-confidence step
    async fn self_correct(
        &self,
        step: &ReasoningStep,
        context: Option<&str>,
    ) -> Result<ReasoningStep> {
        let context_str = context.unwrap_or("None");

        let prompt = format!(
            r#"You made a reasoning step but had low confidence ({:.2}).

Previous Understanding:
{understanding}

Previous Next Question:
{next_question}

Context:
{context_str}

Re-think this step more carefully. What did you miss? Provide corrected reasoning.

Respond ONLY with valid JSON (no other text):
{{
  "understanding": "corrected understanding...",
  "next_question": "corrected next question...",
  "is_complete": false,
  "confidence": 0.85
}}"#,
            step.confidence,
            understanding = step.understanding,
            next_question = step.next_question,
        );

        let response = ollama::generate_response(&prompt)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to self-correct: {}", e))?;

        let json = self.extract_json(&response)?;

        #[derive(Deserialize)]
        struct CorrectedData {
            understanding: String,
            next_question: String,
            is_complete: bool,
            confidence: f32,
        }

        let data: CorrectedData = serde_json::from_str(&json)
            .context("Failed to parse corrected step JSON")?;

        Ok(ReasoningStep {
            step_number: step.step_number,
            understanding: data.understanding,
            next_question: data.next_question,
            is_complete: data.is_complete,
            confidence: data.confidence.clamp(0.0, 1.0),
            timestamp: chrono::Utc::now().timestamp(),
        })
    }

    /// Synthesize final answer from reasoning steps
    async fn synthesize_answer(&self, steps: &[ReasoningStep], original_query: &str) -> Result<String> {
        if steps.is_empty() {
            return Ok("Unable to generate answer: no reasoning steps completed.".to_string());
        }

        // Format steps for synthesis
        let steps_text = steps
            .iter()
            .map(|s| {
                format!(
                    "Step {}: {}\n  → {}",
                    s.step_number, s.understanding, s.next_question
                )
            })
            .collect::<Vec<_>>()
            .join("\n\n");

        let prompt = format!(
            r#"Based on this step-by-step reasoning, provide a final, comprehensive answer.

Original Question:
{original_query}

Reasoning Steps:
{steps_text}

Synthesize a clear, complete answer that:
1. Directly addresses the original question
2. Incorporates insights from all reasoning steps
3. Is well-structured and easy to understand
4. Includes examples or code if relevant

Provide the final answer:"#
        );

        let answer = ollama::generate_response(&prompt)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to synthesize answer: {}", e))?;

        Ok(answer)
    }

    /// Calculate overall confidence from steps
    fn calculate_confidence(&self, steps: &[ReasoningStep]) -> f32 {
        if steps.is_empty() {
            return 0.0;
        }

        // Weighted average: later steps have more weight
        let mut weighted_sum = 0.0;
        let mut weight_total = 0.0;

        for (i, step) in steps.iter().enumerate() {
            let weight = (i + 1) as f32; // Step 1 weight=1, Step 2 weight=2, etc.
            weighted_sum += step.confidence * weight;
            weight_total += weight;
        }

        (weighted_sum / weight_total).clamp(0.0, 1.0)
    }

    /// Extract JSON from LLM response
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

        anyhow::bail!("No valid JSON found in response: {}", trimmed)
    }

    /// Generate cache key
    fn generate_cache_key(&self, query: &str, context: Option<&str>) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        query.hash(&mut hasher);
        if let Some(ctx) = context {
            ctx.hash(&mut hasher);
        }
        format!("cot_{}", hasher.finish())
    }

    /// Get cached reasoning
    fn get_cached(&self, key: &str) -> Option<Reasoning> {
        self.cache.lock().unwrap().get(key).cloned()
    }

    /// Cache reasoning result
    fn cache_result(&self, key: &str, reasoning: Reasoning) {
        let mut cache = self.cache.lock().unwrap();

        // LRU eviction if cache too large
        if cache.len() >= 50 {
            // Keep only most recent 40
            let mut entries: Vec<_> = cache.drain().collect();
            entries.sort_by_key(|(_, r)| -(r.steps.last().map(|s| s.timestamp).unwrap_or(0)));
            entries.truncate(40);
            *cache = entries.into_iter().collect();
        }

        cache.insert(key.to_string(), reasoning);
    }

    /// Update configuration
    pub fn update_config(&self, new_config: CoTConfig) {
        *self.config.lock().unwrap() = new_config;
        log::info!("CoT configuration updated");
    }

    /// Get current configuration
    pub fn get_config(&self) -> CoTConfig {
        self.config.lock().unwrap().clone()
    }

    /// Clear cache
    pub fn clear_cache(&self) {
        self.cache.lock().unwrap().clear();
        log::info!("CoT cache cleared");
    }

    /// Get cache statistics
    pub fn get_cache_stats(&self) -> CacheStats {
        let cache = self.cache.lock().unwrap();
        CacheStats {
            total_entries: cache.len(),
            total_size_bytes: cache
                .values()
                .map(|r| {
                    r.final_answer.len()
                        + r.steps.iter().map(|s| s.understanding.len() + s.next_question.len()).sum::<usize>()
                })
                .sum(),
        }
    }
}

/// Cache statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_entries: usize,
    pub total_size_bytes: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_defaults() {
        let config = CoTConfig::default();
        assert_eq!(config.max_steps, 5);
        assert_eq!(config.min_confidence, 0.6);
        assert!(config.enable_self_correction);
        assert!(config.enable_caching);
    }

    #[test]
    fn test_confidence_calculation() {
        let engine = ChainOfThoughtEngine::new();

        let steps = vec![
            ReasoningStep {
                step_number: 1,
                understanding: "test".to_string(),
                next_question: "test".to_string(),
                is_complete: false,
                confidence: 0.7,
                timestamp: 0,
            },
            ReasoningStep {
                step_number: 2,
                understanding: "test".to_string(),
                next_question: "test".to_string(),
                is_complete: true,
                confidence: 0.9,
                timestamp: 0,
            },
        ];

        let confidence = engine.calculate_confidence(&steps);

        // Weighted average: (0.7*1 + 0.9*2) / (1+2) = 2.5 / 3 = 0.833...
        assert!((confidence - 0.833).abs() < 0.01);
    }

    #[test]
    fn test_extract_json_plain() {
        let engine = ChainOfThoughtEngine::new();
        let response = r#"{"understanding": "test", "next_question": "q", "is_complete": false, "confidence": 0.8}"#;
        let json = engine.extract_json(response).unwrap();
        assert!(json.contains("understanding"));
    }

    #[test]
    fn test_extract_json_markdown() {
        let engine = ChainOfThoughtEngine::new();
        let response = r#"```json
{"understanding": "test", "next_question": "q", "is_complete": false, "confidence": 0.8}
```"#;
        let json = engine.extract_json(response).unwrap();
        assert!(json.contains("understanding"));
    }

    #[test]
    fn test_cache_key_generation() {
        let engine = ChainOfThoughtEngine::new();
        let key1 = engine.generate_cache_key("query1", None);
        let key2 = engine.generate_cache_key("query1", None);
        let key3 = engine.generate_cache_key("query2", None);

        assert_eq!(key1, key2); // Same query = same key
        assert_ne!(key1, key3); // Different query = different key
    }
}

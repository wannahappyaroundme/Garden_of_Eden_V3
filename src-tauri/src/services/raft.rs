/**
 * RAFT (Retrieval Augmented Fine-Tuning) - Hallucination Reduction (v3.2.0)
 *
 * RAFT is a technique to improve RAG systems by:
 * 1. Teaching the model to distinguish relevant vs irrelevant context
 * 2. Teaching the model to say "I don't know" when context is insufficient
 * 3. Improving context utilization through better prompting
 *
 * Reference: "RAFT: Adapting Language Model to Domain Specific RAG" (2024)
 * https://arxiv.org/abs/2403.10131
 */

use anyhow::Result;
use serde::{Deserialize, Serialize};

use super::rag::Episode;

/// RAFT configuration for hallucination reduction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RaftConfig {
    /// Minimum relevance threshold (0.0-1.0)
    /// Episodes below this threshold are filtered out
    pub relevance_threshold: f32,

    /// Maximum number of distractor documents
    /// Add random episodes to teach model to ignore irrelevant context
    pub num_distractors: usize,

    /// Confidence threshold for "I don't know" responses (0.0-1.0)
    /// If best match is below this, model should admit uncertainty
    pub confidence_threshold: f32,

    /// Enable chain-of-thought prompting
    /// Makes model explain its reasoning before answering
    pub use_chain_of_thought: bool,
}

impl Default for RaftConfig {
    fn default() -> Self {
        Self {
            relevance_threshold: 0.5,  // Filter out episodes with <50% similarity
            num_distractors: 2,         // Add 2 random episodes as distractors
            confidence_threshold: 0.6,  // Admit uncertainty if similarity <60%
            use_chain_of_thought: true, // Enable CoT by default
        }
    }
}

/// Episode with relevance scoring
#[derive(Debug, Clone)]
pub struct RaftEpisode {
    pub episode: Episode,
    pub relevance_score: f32,
    pub is_distractor: bool,  // True if this is a random distractor
}

/// RAFT service for hallucination reduction
pub struct RaftService {
    config: RaftConfig,
}

impl RaftService {
    /// Create new RAFT service
    pub fn new(config: RaftConfig) -> Self {
        log::info!("Initializing RAFT hallucination reduction with config: {:?}", config);
        Self { config }
    }

    /// Create with default configuration
    pub fn with_defaults() -> Self {
        Self::new(RaftConfig::default())
    }

    /// Filter and rank episodes using RAFT criteria
    ///
    /// Returns: (relevant_episodes, has_high_confidence)
    pub fn filter_and_rank(
        &self,
        episodes: Vec<(Episode, f32)>, // (episode, similarity_score)
        all_episodes: Vec<Episode>,    // All available episodes (for distractors)
    ) -> (Vec<RaftEpisode>, bool) {
        let mut raft_episodes = Vec::new();

        // Step 1: Filter by relevance threshold
        let mut relevant_episodes: Vec<(Episode, f32)> = episodes
            .into_iter()
            .filter(|(_, score)| *score >= self.config.relevance_threshold)
            .collect();

        // Step 2: Check if we have high confidence
        let has_high_confidence = relevant_episodes
            .first()
            .map(|(_, score)| *score >= self.config.confidence_threshold)
            .unwrap_or(false);

        // Step 3: Add relevant episodes
        for (episode, score) in relevant_episodes.iter() {
            raft_episodes.push(RaftEpisode {
                episode: episode.clone(),
                relevance_score: *score,
                is_distractor: false,
            });
        }

        // Step 4: Add distractor episodes (random low-relevance episodes)
        if self.config.num_distractors > 0 && !all_episodes.is_empty() {
            let mut added_distractors = 0;
            let relevant_ids: std::collections::HashSet<_> =
                relevant_episodes.iter().map(|(ep, _)| &ep.id).collect();

            for distractor in all_episodes.iter() {
                if added_distractors >= self.config.num_distractors {
                    break;
                }

                // Skip if this is already in relevant episodes
                if relevant_ids.contains(&distractor.id) {
                    continue;
                }

                raft_episodes.push(RaftEpisode {
                    episode: distractor.clone(),
                    relevance_score: 0.0, // Distractors have 0 relevance
                    is_distractor: true,
                });

                added_distractors += 1;
            }
        }

        log::info!(
            "RAFT filtered {} episodes ({}  relevant, {} distractors), confidence: {}",
            raft_episodes.len(),
            raft_episodes.iter().filter(|e| !e.is_distractor).count(),
            raft_episodes.iter().filter(|e| e.is_distractor).count(),
            if has_high_confidence { "HIGH" } else { "LOW" }
        );

        (raft_episodes, has_high_confidence)
    }

    /// Format episodes for RAFT-enhanced prompt
    pub fn format_for_prompt(
        &self,
        raft_episodes: &[RaftEpisode],
        has_high_confidence: bool,
    ) -> String {
        if raft_episodes.is_empty() {
            return self.format_no_context_prompt();
        }

        let mut prompt = String::from("=== Retrieved Context ===\n\n");

        // Add instruction about context usage
        prompt.push_str("IMPORTANT INSTRUCTIONS:\n");
        prompt.push_str("1. The following context may or may not be relevant to the user's query\n");
        prompt.push_str("2. If the context is NOT relevant, do NOT use it - rely on your general knowledge instead\n");
        prompt.push_str("3. If you're unsure or the information is insufficient, say \"I don't know\" or \"I'm not sure\"\n");
        prompt.push_str("4. NEVER make up information that's not in the context or your knowledge\n\n");

        if self.config.use_chain_of_thought {
            prompt.push_str("5. Think step-by-step before answering:\n");
            prompt.push_str("   a) Is this context relevant to the question?\n");
            prompt.push_str("   b) What information does the context provide?\n");
            prompt.push_str("   c) Can I answer confidently based on this?\n\n");
        }

        // Add context episodes
        prompt.push_str("Context Documents:\n\n");
        for (i, raft_ep) in raft_episodes.iter().enumerate() {
            let ep = &raft_ep.episode;

            // In training, we would label distractors
            // In inference, we don't tell the model which are distractors
            // (the model should learn to identify them)

            prompt.push_str(&format!(
                "Document {}:\n",
                i + 1
            ));
            prompt.push_str(&format!("  User: {}\n", ep.user_message));
            prompt.push_str(&format!("  AI: {}\n", ep.ai_response));
            prompt.push_str(&format!("  Satisfaction: {:.2}\n\n", ep.satisfaction));
        }

        // Add confidence indicator
        if !has_high_confidence {
            prompt.push_str("NOTE: No highly relevant context found. You may need to rely on general knowledge or admit uncertainty.\n\n");
        }

        prompt.push_str("=== End of Context ===\n\n");
        prompt
    }

    /// Format prompt when no context is available
    fn format_no_context_prompt(&self) -> String {
        let mut prompt = String::from("=== Retrieved Context ===\n\n");
        prompt.push_str("No relevant past conversations found.\n\n");
        prompt.push_str("IMPORTANT: Answer based on your general knowledge. ");
        prompt.push_str("If you don't know something, admit it honestly.\n\n");
        prompt.push_str("=== End of Context ===\n\n");
        prompt
    }

    /// Generate chain-of-thought reasoning prompt
    pub fn generate_cot_prompt(&self, query: &str) -> String {
        if !self.config.use_chain_of_thought {
            return String::new();
        }

        format!(
            "\nBefore answering the question: \"{}\"\n\
             Please think through:\n\
             1. What information does the retrieved context provide?\n\
             2. Is the context relevant and sufficient to answer?\n\
             3. What can I confidently say based on this?\n\
             4. What should I admit I don't know?\n\n\
             Then provide your answer.\n",
            query
        )
    }

    /// Evaluate if response shows hallucination
    ///
    /// This is a heuristic check - in production, you'd use a fine-tuned classifier
    pub fn detect_hallucination(&self, response: &str, context_episodes: &[Episode]) -> bool {
        // Heuristic 1: If response is very long but context is empty, might be hallucinating
        if context_episodes.is_empty() && response.len() > 500 {
            log::warn!("Potential hallucination: Long response with no context");
            return true;
        }

        // Heuristic 2: If response contains specific numbers/facts not in context
        // (This is a simplified check - production would be more sophisticated)
        let response_lower = response.to_lowercase();

        // Keywords that suggest making up specific information
        let suspicious_phrases = [
            "according to the data",
            "based on statistics",
            "the exact number is",
            "precisely",
            "specifically",
        ];

        for phrase in &suspicious_phrases {
            if response_lower.contains(phrase) {
                // Check if context actually contains data
                let context_has_data = context_episodes
                    .iter()
                    .any(|ep| {
                        ep.ai_response.to_lowercase().contains("data")
                            || ep.ai_response.to_lowercase().contains("statistic")
                    });

                if !context_has_data {
                    log::warn!("Potential hallucination: Claims data without context");
                    return true;
                }
            }
        }

        false // No hallucination detected
    }

    /// Get current configuration
    pub fn get_config(&self) -> &RaftConfig {
        &self.config
    }

    /// Update configuration
    pub fn update_config(&mut self, config: RaftConfig) {
        log::info!("Updating RAFT config: {:?}", config);
        self.config = config;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_episode(id: &str, message: &str, response: &str, satisfaction: f32) -> Episode {
        Episode {
            id: id.to_string(),
            user_message: message.to_string(),
            ai_response: response.to_string(),
            satisfaction,
            created_at: 1234567890,
            access_count: 0,
            importance: satisfaction,
            embedding_id: None,
        }
    }

    #[test]
    fn test_raft_filter_and_rank() {
        let raft = RaftService::with_defaults();

        let episodes_with_scores = vec![
            (create_test_episode("1", "What is Rust?", "A systems language", 0.9), 0.8),
            (create_test_episode("2", "Tell me about Python", "A high-level language", 0.7), 0.6),
            (create_test_episode("3", "Weather today?", "Sunny", 0.5), 0.3), // Below threshold
        ];

        let all_episodes = vec![
            create_test_episode("4", "Random topic", "Random response", 0.5),
        ];

        let (raft_episodes, has_high_confidence) =
            raft.filter_and_rank(episodes_with_scores, all_episodes);

        // Should have 2 relevant (above 0.5 threshold) + 2 distractors = 4 total
        assert_eq!(raft_episodes.len(), 4);
        assert_eq!(raft_episodes.iter().filter(|e| !e.is_distractor).count(), 2);
        assert_eq!(raft_episodes.iter().filter(|e| e.is_distractor).count(), 2);
        assert!(has_high_confidence); // First episode has 0.8 > 0.6 threshold
    }

    #[test]
    fn test_raft_low_confidence() {
        let mut config = RaftConfig::default();
        config.confidence_threshold = 0.9; // Very high threshold
        let raft = RaftService::new(config);

        let episodes_with_scores = vec![
            (create_test_episode("1", "Test", "Response", 0.9), 0.7), // Below 0.9
        ];

        let (_, has_high_confidence) = raft.filter_and_rank(episodes_with_scores, vec![]);

        assert!(!has_high_confidence); // 0.7 < 0.9
    }

    #[test]
    fn test_format_for_prompt() {
        let raft = RaftService::with_defaults();

        let raft_episodes = vec![
            RaftEpisode {
                episode: create_test_episode("1", "What is AI?", "Artificial Intelligence", 0.9),
                relevance_score: 0.8,
                is_distractor: false,
            },
        ];

        let prompt = raft.format_for_prompt(&raft_episodes, true);

        assert!(prompt.contains("Retrieved Context"));
        assert!(prompt.contains("What is AI?"));
        assert!(prompt.contains("IMPORTANT INSTRUCTIONS"));
    }

    #[test]
    fn test_hallucination_detection() {
        let raft = RaftService::with_defaults();

        // Test 1: Long response with no context
        let response = "a".repeat(600);
        assert!(raft.detect_hallucination(&response, &[]));

        // Test 2: Short response with no context - OK
        let response = "I don't know";
        assert!(!raft.detect_hallucination(&response, &[]));

        // Test 3: Claims data without context
        let response = "According to the data, the answer is 42";
        assert!(raft.detect_hallucination(&response, &[]));
    }

    #[test]
    fn test_no_context_prompt() {
        let raft = RaftService::with_defaults();
        let prompt = raft.format_no_context_prompt();

        assert!(prompt.contains("No relevant past conversations found"));
        assert!(prompt.contains("general knowledge"));
    }

    #[test]
    fn test_cot_prompt() {
        let mut raft = RaftService::with_defaults();
        raft.config.use_chain_of_thought = true;

        let cot = raft.generate_cot_prompt("What is the capital of France?");

        assert!(cot.contains("think through"));
        assert!(cot.contains("What is the capital of France?"));

        // Disable CoT
        raft.config.use_chain_of_thought = false;
        let cot2 = raft.generate_cot_prompt("Test");
        assert!(cot2.is_empty());
    }
}

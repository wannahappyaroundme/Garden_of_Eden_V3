/**
 * Phase 4: Advanced Pattern Detection (v3.8.0)
 *
 * ML-based trait extraction using Ollama/Qwen LLM for sophisticated
 * persona parameter analysis from conversation text.
 *
 * Replaces heuristic keyword matching with structured LLM analysis.
 */

use crate::services::ollama;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

/// Comprehensive trait analysis for all 10 persona parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraitAnalysis {
    /// Formality level (0.0 = casual, 1.0 = very formal)
    pub formality: f32,

    /// Verbosity level (0.0 = concise, 1.0 = very detailed)
    pub verbosity: f32,

    /// Technical depth (0.0 = non-technical, 1.0 = highly technical)
    pub technical_depth: f32,

    /// Emoji usage (0.0 = none, 1.0 = frequent)
    pub emoji_usage: f32,

    /// Humor level (0.0 = serious, 1.0 = very humorous)
    pub humor: f32,

    /// Creativity level (0.0 = straightforward, 1.0 = very creative)
    pub creativity: f32,

    /// Empathy level (0.0 = factual, 1.0 = highly empathetic)
    pub empathy: f32,

    /// Assertiveness (0.0 = tentative, 1.0 = very assertive)
    pub assertiveness: f32,

    /// Proactivity (0.0 = reactive, 1.0 = very proactive)
    pub proactivity: f32,

    /// Cultural awareness (0.0 = neutral, 1.0 = culturally sensitive)
    pub cultural_awareness: f32,
}

impl Default for TraitAnalysis {
    fn default() -> Self {
        Self {
            formality: 0.5,
            verbosity: 0.5,
            technical_depth: 0.5,
            emoji_usage: 0.0,
            humor: 0.3,
            creativity: 0.5,
            empathy: 0.5,
            assertiveness: 0.5,
            proactivity: 0.5,
            cultural_awareness: 0.5,
        }
    }
}

/// LLM-based pattern detector service
pub struct LlmPatternDetector;

impl LlmPatternDetector {
    /// Create new pattern detector
    pub fn new() -> Self {
        Self
    }

    /// Analyze traits in a conversation response using LLM
    pub async fn analyze_traits(&self, ai_response: &str) -> Result<TraitAnalysis> {
        // Truncate very long responses to avoid token limits
        let truncated_response = if ai_response.len() > 2000 {
            &ai_response[..2000]
        } else {
            ai_response
        };

        let prompt = self.create_analysis_prompt(truncated_response);

        // Generate analysis using Ollama
        let response = ollama::generate_response(&prompt)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to generate trait analysis: {}", e))?;

        // Parse JSON response
        self.parse_analysis_response(&response)
    }

    /// Batch analyze multiple texts
    pub async fn batch_analyze(&self, texts: Vec<&str>) -> Result<Vec<TraitAnalysis>> {
        let mut results = Vec::new();

        for text in texts {
            match self.analyze_traits(text).await {
                Ok(analysis) => results.push(analysis),
                Err(e) => {
                    log::warn!("Failed to analyze text, using default: {}", e);
                    results.push(TraitAnalysis::default());
                }
            }
        }

        Ok(results)
    }

    /// Create analysis prompt
    fn create_analysis_prompt(&self, text: &str) -> String {
        format!(
            r#"Analyze the following AI assistant response and rate these personality traits from 0.0 to 1.0.

AI Response:
"""
{}
"""

Rate each trait on a scale from 0.0 to 1.0:

1. **Formality** (0.0 = very casual/informal, 1.0 = very formal/professional)
   - Consider: Use of formal language, greetings, professional tone

2. **Verbosity** (0.0 = very concise/brief, 1.0 = very detailed/lengthy)
   - Consider: Response length, level of detail, explanations

3. **Technical Depth** (0.0 = non-technical/simple, 1.0 = highly technical/complex)
   - Consider: Code examples, technical terminology, implementation details

4. **Emoji Usage** (0.0 = no emojis, 1.0 = frequent emoji use)
   - Consider: Presence and frequency of emojis

5. **Humor** (0.0 = completely serious, 1.0 = very humorous/playful)
   - Consider: Jokes, wit, playful language, lighthearted tone

6. **Creativity** (0.0 = straightforward/standard, 1.0 = very creative/innovative)
   - Consider: Novel approaches, creative analogies, unique explanations

7. **Empathy** (0.0 = purely factual, 1.0 = highly empathetic/supportive)
   - Consider: Understanding user's feelings, supportive language, encouragement

8. **Assertiveness** (0.0 = tentative/uncertain, 1.0 = very confident/assertive)
   - Consider: Confidence in statements, direct recommendations, decisiveness

9. **Proactivity** (0.0 = purely reactive, 1.0 = very proactive/anticipatory)
   - Consider: Offering additional help, anticipating needs, suggestions

10. **Cultural Awareness** (0.0 = culturally neutral, 1.0 = culturally sensitive)
    - Consider: Awareness of cultural context, inclusive language, sensitivity

Respond ONLY with valid JSON in this exact format (no other text):
{{
  "formality": 0.5,
  "verbosity": 0.5,
  "technical_depth": 0.5,
  "emoji_usage": 0.0,
  "humor": 0.3,
  "creativity": 0.5,
  "empathy": 0.5,
  "assertiveness": 0.5,
  "proactivity": 0.5,
  "cultural_awareness": 0.5
}}"#,
            text
        )
    }

    /// Parse analysis response from LLM
    fn parse_analysis_response(&self, response: &str) -> Result<TraitAnalysis> {
        // Try to extract JSON from response
        let json_str = self.extract_json(response)?;

        // Parse JSON
        let analysis: TraitAnalysis = serde_json::from_str(&json_str)
            .context("Failed to parse trait analysis JSON")?;

        // Validate ranges (clamp to 0.0-1.0)
        Ok(TraitAnalysis {
            formality: analysis.formality.clamp(0.0, 1.0),
            verbosity: analysis.verbosity.clamp(0.0, 1.0),
            technical_depth: analysis.technical_depth.clamp(0.0, 1.0),
            emoji_usage: analysis.emoji_usage.clamp(0.0, 1.0),
            humor: analysis.humor.clamp(0.0, 1.0),
            creativity: analysis.creativity.clamp(0.0, 1.0),
            empathy: analysis.empathy.clamp(0.0, 1.0),
            assertiveness: analysis.assertiveness.clamp(0.0, 1.0),
            proactivity: analysis.proactivity.clamp(0.0, 1.0),
            cultural_awareness: analysis.cultural_awareness.clamp(0.0, 1.0),
        })
    }

    /// Extract JSON from LLM response (handles markdown code blocks)
    fn extract_json(&self, response: &str) -> Result<String> {
        let trimmed = response.trim();

        // Check for markdown code block
        if trimmed.starts_with("```") {
            // Extract content between ```json and ```
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

        anyhow::bail!("No valid JSON found in response")
    }

    /// Quick analysis for single trait (useful for debugging)
    pub async fn analyze_single_trait(
        &self,
        text: &str,
        trait_name: &str,
    ) -> Result<f32> {
        let full_analysis = self.analyze_traits(text).await?;

        let value = match trait_name.to_lowercase().as_str() {
            "formality" => full_analysis.formality,
            "verbosity" => full_analysis.verbosity,
            "technical_depth" | "technical" => full_analysis.technical_depth,
            "emoji_usage" | "emoji" => full_analysis.emoji_usage,
            "humor" => full_analysis.humor,
            "creativity" => full_analysis.creativity,
            "empathy" => full_analysis.empathy,
            "assertiveness" => full_analysis.assertiveness,
            "proactivity" => full_analysis.proactivity,
            "cultural_awareness" | "cultural" => full_analysis.cultural_awareness,
            _ => anyhow::bail!("Unknown trait: {}", trait_name),
        };

        Ok(value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_json_plain() {
        let detector = LlmPatternDetector::new();

        let response = r#"{"formality": 0.7, "verbosity": 0.5}"#;
        let json = detector.extract_json(response).unwrap();
        assert!(json.contains("formality"));
    }

    #[test]
    fn test_extract_json_markdown() {
        let detector = LlmPatternDetector::new();

        let response = r#"```json
{"formality": 0.7, "verbosity": 0.5}
```"#;
        let json = detector.extract_json(response).unwrap();
        assert!(json.contains("formality"));
    }

    #[test]
    fn test_extract_json_with_prefix() {
        let detector = LlmPatternDetector::new();

        let response = r#"Here is the analysis: {"formality": 0.7, "verbosity": 0.5}"#;
        let json = detector.extract_json(response).unwrap();
        assert!(json.contains("formality"));
    }

    #[test]
    fn test_trait_analysis_default() {
        let analysis = TraitAnalysis::default();
        assert_eq!(analysis.formality, 0.5);
        assert_eq!(analysis.emoji_usage, 0.0);
    }
}

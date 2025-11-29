// Automatic Persona Adjustment System (v3.8.0 Phase 2.3)
// Analyzes personality insights and automatically adjusts persona parameters
// to better match the user's communication style and preferences
#![allow(dead_code)]

use crate::database::{Database, models::PersonaParameters};
use crate::services::personality_detector::{PersonalityDetectorService, PersonalityInsights};
use anyhow::{Context, Result};
use std::sync::{Arc, Mutex};

/// Adjustment strategy determines how aggressive persona changes should be
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum AdjustmentStrategy {
    /// Conservative: Small adjustments (10-20% change max)
    Conservative,
    /// Moderate: Medium adjustments (20-40% change max)
    Moderate,
    /// Aggressive: Large adjustments (40-60% change max)
    Aggressive,
}

/// Adjustment configuration
#[derive(Debug, Clone)]
pub struct AdjustmentConfig {
    /// Strategy for adjustment magnitude
    pub strategy: AdjustmentStrategy,
    /// Minimum confidence required to apply adjustments (0.0-1.0)
    pub min_confidence: f32,
    /// Minimum sample size required for adjustments
    pub min_sample_size: usize,
    /// Whether to apply adjustments automatically or just suggest
    pub auto_apply: bool,
    /// Learning rate (0.0-1.0) - how much to blend old vs new parameters
    pub learning_rate: f32,
}

impl Default for AdjustmentConfig {
    fn default() -> Self {
        Self {
            strategy: AdjustmentStrategy::Moderate,
            min_confidence: 0.5,
            min_sample_size: 20,
            auto_apply: false, // Default to manual approval
            learning_rate: 0.3, // 30% new, 70% old
        }
    }
}

/// Adjustment result with suggested changes
#[derive(Debug, Clone)]
pub struct AdjustmentResult {
    /// Current persona parameters
    pub current: PersonaParameters,
    /// Suggested persona parameters
    pub suggested: PersonaParameters,
    /// Personality insights that drove the adjustment
    pub insights: PersonalityInsights,
    /// Explanation of changes
    pub explanation: Vec<String>,
    /// Whether the adjustment was applied automatically
    pub auto_applied: bool,
}

/// Persona adjuster service
pub struct PersonaAdjusterService {
    db: Arc<Mutex<Database>>,
    detector: PersonalityDetectorService,
    config: AdjustmentConfig,
}

impl PersonaAdjusterService {
    /// Create a new persona adjuster service
    pub fn new(db: Arc<Mutex<Database>>, config: AdjustmentConfig) -> Result<Self> {
        let detector = PersonalityDetectorService::new(Arc::clone(&db))?;

        Ok(Self {
            db,
            detector,
            config,
        })
    }

    /// Create with default configuration
    pub fn new_with_defaults(db: Arc<Mutex<Database>>) -> Result<Self> {
        Self::new(db, AdjustmentConfig::default())
    }

    /// Analyze conversation and suggest persona adjustments
    pub fn analyze_and_suggest(&self, conversation_id: &str) -> Result<AdjustmentResult> {
        // Get current persona
        let current = {
            let db = self.db.lock().unwrap();
            db.load_persona()?
        };

        // Generate personality insights
        let insights = self.detector.generate_insights(conversation_id, self.config.min_sample_size)?;

        // Check if we have enough confidence to suggest adjustments
        if insights.confidence < self.config.min_confidence {
            return Ok(AdjustmentResult {
                current: current.clone(),
                suggested: current.clone(),
                insights: insights.clone(),
                explanation: vec![
                    format!(
                        "Insufficient confidence ({:.1}%) for adjustments. Need at least {:.1}%.",
                        insights.confidence * 100.0,
                        self.config.min_confidence * 100.0
                    )
                ],
                auto_applied: false,
            });
        }

        // Check sample size
        if insights.sample_size < self.config.min_sample_size {
            return Ok(AdjustmentResult {
                current: current.clone(),
                suggested: current.clone(),
                insights: insights.clone(),
                explanation: vec![
                    format!(
                        "Insufficient sample size ({}). Need at least {} messages.",
                        insights.sample_size,
                        self.config.min_sample_size
                    )
                ],
                auto_applied: false,
            });
        }

        // Calculate suggested parameters based on personality insights
        let target = self.detector.suggest_persona_adjustments(&insights);

        // Apply learning rate (blend old and new)
        let suggested = self.blend_parameters(&current, &target, self.config.learning_rate);

        // Generate explanation
        let explanation = self.generate_explanation(&current, &suggested, &insights);

        // Auto-apply if configured
        let auto_applied = if self.config.auto_apply {
            match self.apply_adjustment(&suggested) {
                Ok(_) => true,
                Err(e) => {
                    log::error!("Failed to auto-apply persona adjustment: {}", e);
                    false
                }
            }
        } else {
            false
        };

        Ok(AdjustmentResult {
            current,
            suggested,
            insights,
            explanation,
            auto_applied,
        })
    }

    /// Apply persona adjustment
    pub fn apply_adjustment(&self, suggested: &PersonaParameters) -> Result<()> {
        let db = self.db.lock().unwrap();
        db.update_persona(suggested, "optimization")
            .context("Failed to apply persona adjustment")?;

        log::info!("Applied automatic persona adjustment based on personality insights");
        Ok(())
    }

    /// Blend old and new parameters using learning rate
    pub fn blend_parameters(&self, old: &PersonaParameters, new: &PersonaParameters, learning_rate: f32) -> PersonaParameters {
        // Apply strategy-based limits
        let max_change = match self.config.strategy {
            AdjustmentStrategy::Conservative => 0.2,  // Max 20% change
            AdjustmentStrategy::Moderate => 0.4,      // Max 40% change
            AdjustmentStrategy::Aggressive => 0.6,    // Max 60% change
        };

        PersonaParameters {
            formality: self.blend_param(old.formality, new.formality, learning_rate, max_change),
            verbosity: self.blend_param(old.verbosity, new.verbosity, learning_rate, max_change),
            humor: self.blend_param(old.humor, new.humor, learning_rate, max_change),
            emoji_usage: self.blend_param(old.emoji_usage, new.emoji_usage, learning_rate, max_change),
            empathy: self.blend_param(old.empathy, new.empathy, learning_rate, max_change),
            creativity: self.blend_param(old.creativity, new.creativity, learning_rate, max_change),
            proactiveness: self.blend_param(old.proactiveness, new.proactiveness, learning_rate, max_change),
            technical_depth: self.blend_param(old.technical_depth, new.technical_depth, learning_rate, max_change),
            code_examples: self.blend_param(old.code_examples, new.code_examples, learning_rate, max_change),
            questioning: self.blend_param(old.questioning, new.questioning, learning_rate, max_change),
        }
    }

    /// Blend a single parameter with max change limit
    fn blend_param(&self, old: i32, new: i32, learning_rate: f32, max_change: f32) -> i32 {
        let old_f = old as f32;
        let new_f = new as f32;

        // Calculate desired change
        let desired_change = (new_f - old_f) * learning_rate;

        // Clamp change to max_change
        let max_delta = 100.0 * max_change;
        let clamped_change = desired_change.clamp(-max_delta, max_delta);

        // Apply change
        let result = old_f + clamped_change;

        // Clamp to valid range (0-100)
        result.clamp(0.0, 100.0) as i32
    }

    /// Generate human-readable explanation of adjustments
    fn generate_explanation(&self, current: &PersonaParameters, suggested: &PersonaParameters, insights: &PersonalityInsights) -> Vec<String> {
        let mut explanations = Vec::new();

        // Overall personality summary
        explanations.push(format!(
            "Based on {} messages with {:.1}% confidence:",
            insights.sample_size,
            insights.confidence * 100.0
        ));

        // Big Five insights
        let big_five = &insights.big_five;
        explanations.push(format!("Personality Traits (Big Five):"));
        explanations.push(format!("  • Openness: {:.1}% (curiosity, creativity)", big_five.openness * 100.0));
        explanations.push(format!("  • Conscientiousness: {:.1}% (organization, formality)", big_five.conscientiousness * 100.0));
        explanations.push(format!("  • Extraversion: {:.1}% (social, expressive)", big_five.extraversion * 100.0));
        explanations.push(format!("  • Agreeableness: {:.1}% (empathy, cooperation)", big_five.agreeableness * 100.0));
        explanations.push(format!("  • Neuroticism: {:.1}% (emotional stability)", big_five.neuroticism * 100.0));

        // MBTI insights
        let mbti = &insights.mbti;
        let mbti_type = format!(
            "{}{}{}{}",
            if mbti.ie_score > 0.5 { "E" } else { "I" },
            if mbti.sn_score > 0.5 { "N" } else { "S" },
            if mbti.tf_score > 0.5 { "F" } else { "T" },
            if mbti.jp_score > 0.5 { "P" } else { "J" }
        );
        explanations.push(format!("MBTI Type: {} (approximation)", mbti_type));

        // Parameter changes
        explanations.push(format!("\nSuggested Adjustments:"));

        let changes = vec![
            ("Formality", current.formality, suggested.formality),
            ("Verbosity", current.verbosity, suggested.verbosity),
            ("Humor", current.humor, suggested.humor),
            ("Emoji Usage", current.emoji_usage, suggested.emoji_usage),
            ("Empathy", current.empathy, suggested.empathy),
            ("Creativity", current.creativity, suggested.creativity),
            ("Proactiveness", current.proactiveness, suggested.proactiveness),
            ("Technical Depth", current.technical_depth, suggested.technical_depth),
            ("Code Examples", current.code_examples, suggested.code_examples),
            ("Questioning", current.questioning, suggested.questioning),
        ];

        for (name, old, new) in changes {
            let diff = new - old;
            if diff.abs() > 5 {  // Only show changes > 5%
                let direction = if diff > 0 { "↑" } else { "↓" };
                explanations.push(format!(
                    "  • {}: {} → {} ({} {})",
                    name, old, new, direction, diff.abs()
                ));
            }
        }

        explanations
    }

    /// Get adjustment history from database
    pub fn get_adjustment_history(&self, limit: usize) -> Result<Vec<PersonaParameters>> {
        let db = self.db.lock().unwrap();
        let mut stmt = db.conn().prepare(
            "SELECT parameters FROM persona_history
             WHERE source = 'optimization'
             ORDER BY timestamp DESC
             LIMIT ?1",
        )?;

        let history: Vec<PersonaParameters> = stmt
            .query_map([limit], |row| {
                let json: String = row.get(0)?;
                let params: crate::services::learning::PersonaParameters = serde_json::from_str(&json)
                    .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

                // Convert from learning::PersonaParameters (0.0-1.0) to models::PersonaParameters (0-100)
                Ok(PersonaParameters {
                    formality: (params.formality * 100.0) as i32,
                    verbosity: (params.verbosity * 100.0) as i32,
                    humor: (params.humor * 100.0) as i32,
                    emoji_usage: (params.emoji_usage * 100.0) as i32,
                    empathy: (params.empathy * 100.0) as i32,
                    creativity: (params.creativity * 100.0) as i32,
                    proactiveness: (params.proactiveness * 100.0) as i32,
                    technical_depth: (params.technical_depth * 100.0) as i32,
                    code_examples: (params.code_examples * 100.0) as i32,
                    questioning: (params.questioning * 100.0) as i32,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(history)
    }

    /// Calculate adjustment statistics
    pub fn get_adjustment_stats(&self) -> Result<AdjustmentStats> {
        let db = self.db.lock().unwrap();

        // Count total optimizations
        let total_adjustments: i64 = db.conn().query_row(
            "SELECT COUNT(*) FROM persona_history WHERE source = 'optimization'",
            [],
            |row| row.get(0),
        )?;

        // Count recent adjustments (last 30 days)
        let thirty_days_ago = chrono::Utc::now().timestamp_millis() - (30 * 24 * 60 * 60 * 1000);
        let recent_adjustments: i64 = db.conn().query_row(
            "SELECT COUNT(*) FROM persona_history WHERE source = 'optimization' AND timestamp > ?1",
            [thirty_days_ago],
            |row| row.get(0),
        )?;

        // Get average satisfaction for optimized personas
        let avg_satisfaction: Option<f32> = db.conn().query_row(
            "SELECT AVG(average_satisfaction) FROM persona_history WHERE source = 'optimization' AND average_satisfaction IS NOT NULL",
            [],
            |row| row.get(0),
        )?;

        Ok(AdjustmentStats {
            total_adjustments: total_adjustments as usize,
            recent_adjustments: recent_adjustments as usize,
            average_satisfaction: avg_satisfaction.unwrap_or(0.5),
        })
    }
}

/// Adjustment statistics
#[derive(Debug, Clone)]
pub struct AdjustmentStats {
    pub total_adjustments: usize,
    pub recent_adjustments: usize,
    pub average_satisfaction: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_db() -> Arc<Mutex<Database>> {
        Arc::new(Mutex::new(Database::new().unwrap()))
    }

    #[test]
    fn test_blend_parameters_conservative() {
        let db = create_test_db();
        let config = AdjustmentConfig {
            strategy: AdjustmentStrategy::Conservative,
            learning_rate: 0.5,
            ..Default::default()
        };
        let adjuster = PersonaAdjusterService::new(db, config).unwrap();

        let old = PersonaParameters {
            formality: 50,
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        let new = PersonaParameters {
            formality: 90,  // Wants to increase by 40
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        let blended = adjuster.blend_parameters(&old, &new, 0.5);

        // Conservative max change is 20%, so max delta is 20
        // Desired change: (90 - 50) * 0.5 = 20
        // Clamped to max 20
        // Result: 50 + 20 = 70
        assert_eq!(blended.formality, 70, "Conservative strategy should limit change to 20%");
    }

    #[test]
    fn test_blend_parameters_aggressive() {
        let db = create_test_db();
        let config = AdjustmentConfig {
            strategy: AdjustmentStrategy::Aggressive,
            learning_rate: 1.0,
            ..Default::default()
        };
        let adjuster = PersonaAdjusterService::new(db, config).unwrap();

        let old = PersonaParameters {
            formality: 50,
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        let new = PersonaParameters {
            formality: 100,  // Wants to increase by 50
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        let blended = adjuster.blend_parameters(&old, &new, 1.0);

        // Aggressive max change is 60%, so max delta is 60
        // Desired change: (100 - 50) * 1.0 = 50
        // Clamped to max 60 (but 50 < 60)
        // Result: 50 + 50 = 100
        assert_eq!(blended.formality, 100, "Aggressive strategy should allow large changes");
    }

    #[test]
    fn test_adjustment_config_default() {
        let config = AdjustmentConfig::default();

        assert_eq!(config.strategy, AdjustmentStrategy::Moderate);
        assert_eq!(config.min_confidence, 0.5);
        assert_eq!(config.min_sample_size, 20);
        assert_eq!(config.auto_apply, false);
        assert_eq!(config.learning_rate, 0.3);
    }

    #[test]
    fn test_insufficient_confidence() {
        let db = create_test_db();
        {
            let db_lock = db.lock().unwrap();
            db_lock.create_default_persona().unwrap();
        }

        let config = AdjustmentConfig {
            min_confidence: 0.8,
            min_sample_size: 5,
            ..Default::default()
        };
        let adjuster = PersonaAdjusterService::new(Arc::clone(&db), config).unwrap();

        // Create test conversation with insufficient messages
        let conversation_id = "test-insufficient";

        let result = adjuster.analyze_and_suggest(conversation_id);
        assert!(result.is_ok());

        let adjustment = result.unwrap();
        assert!(!adjustment.auto_applied);
        assert!(adjustment.explanation[0].contains("Insufficient"));
    }

    #[test]
    fn test_generate_explanation() {
        let db = create_test_db();
        let adjuster = PersonaAdjusterService::new_with_defaults(db).unwrap();

        let current = PersonaParameters {
            formality: 50,
            verbosity: 50,
            humor: 30,
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        let suggested = PersonaParameters {
            formality: 70,   // +20
            verbosity: 50,
            humor: 50,       // +20
            emoji_usage: 20,
            empathy: 60,
            creativity: 50,
            proactiveness: 40,
            technical_depth: 50,
            code_examples: 70,
            questioning: 40,
        };

        let insights = crate::services::personality_detector::PersonalityInsights {
            patterns: crate::services::personality_detector::ConversationPatterns {
                avg_message_length: 20.0,
                formality: 0.7,
                verbosity: 0.5,
                humor: 0.5,
                emoji_usage: 0.2,
                empathy: 0.6,
                creativity: 0.5,
                proactiveness: 0.4,
                technical_depth: 0.5,
                code_examples: 0.7,
                questioning: 0.4,
            },
            big_five: crate::services::personality_detector::BigFiveTraits {
                openness: 0.6,
                conscientiousness: 0.7,
                extraversion: 0.5,
                agreeableness: 0.6,
                neuroticism: 0.4,
            },
            mbti: crate::services::personality_detector::MBTIIndicators {
                ie_score: 0.5,
                sn_score: 0.6,
                tf_score: 0.6,
                jp_score: 0.4,
            },
            confidence: 0.75,
            sample_size: 50,
        };

        let explanation = adjuster.generate_explanation(&current, &suggested, &insights);

        assert!(!explanation.is_empty());
        assert!(explanation[0].contains("50 messages"));
        assert!(explanation[0].contains("75"));  // 75% confidence
    }
}

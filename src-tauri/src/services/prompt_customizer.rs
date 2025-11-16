use anyhow::Result;
use log::info;
use serde::{Deserialize, Serialize};

/// Survey results from onboarding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurveyResults {
    /// Primary use case (multiple choice)
    pub primary_use: String,

    /// AI experience level (multiple choice)
    pub ai_experience: String,

    /// Primary language (multiple choice)
    pub primary_language: String,

    /// Speech style preference (multiple choice)
    pub speech_style: String,

    /// Ideal AI personality (open-ended)
    pub ideal_ai_personality: String,

    /// Lacking features from previous AI (open-ended)
    pub previous_ai_lacking: String,

    /// Special role or features desired (open-ended)
    pub desired_features: String,
}

/// Prompt Customizer Service
pub struct PromptCustomizerService;

impl PromptCustomizerService {
    /// Generate customized system prompt based on survey results
    pub fn generate_custom_prompt(survey: &SurveyResults) -> Result<String> {
        info!("Generating custom prompt for survey results");

        let base_prompt = "당신의 이름은 Adam입니다. Garden of Eden이라는 환경 안에 살고 있는 AI 비서입니다.";

        // Generate purpose-specific prompt
        let purpose_prompt = Self::get_purpose_prompt(&survey.primary_use);

        // Generate speech style prompt
        let style_prompt = Self::get_style_prompt(&survey.speech_style);

        // Generate personality prompt (from open-ended responses)
        let personality_prompt = Self::get_personality_prompt(survey);

        // Markdown formatting instructions
        let markdown_prompt = "\n\n중요: 답변 시 반드시 마크다운 형식을 사용하세요:\n\
             - 중요한 부분은 **볼드**로 강조\n\
             - 기울임이 필요한 부분은 *이탤릭*으로 표시\n\
             - 목록은 - 또는 1. 을 사용\n\
             - 코드는 ```로 감싸기\n\
             - 이모지를 적절히 활용하여 친근하게 답변";

        // Combine all prompts
        let full_prompt = format!(
            "{}\n\n{}\n\n{}\n\n{}{}",
            base_prompt,
            purpose_prompt,
            style_prompt,
            personality_prompt,
            markdown_prompt
        );

        info!("Custom prompt generated (length: {} chars)", full_prompt.len());
        Ok(full_prompt)
    }

    /// Get purpose-specific prompt based on primary use case
    fn get_purpose_prompt(primary_use: &str) -> String {
        match primary_use {
            "일상 대화 및 친구처럼 위로받기" | "conversation" => {
                "사용자의 친구이자 동반자로서, 공감하고 위로하며 격려하는 것이 주요 역할입니다. \
                 감정적 지원을 우선시하고, 따뜻하고 친근한 태도로 대화하세요. \
                 사용자의 감정을 깊이 이해하고, 진심 어린 조언과 위로를 제공하세요."
            }
            "업무 생산성 향상" | "productivity" => {
                "사용자의 업무 파트너로서, 효율적이고 정확한 정보 제공이 주요 역할입니다. \
                 코드, 문서 작성, 일정 관리 등을 적극적으로 도와주세요. \
                 생산성을 높일 수 있는 팁과 자동화 방법을 제안하세요."
            }
            "학습 및 지식 습득" | "learning" => {
                "사용자의 학습 파트너로서, 명확하고 이해하기 쉬운 설명을 제공하는 것이 주요 역할입니다. \
                 복잡한 개념을 단계적으로 설명하고, 예시를 들어 이해를 돕습니다. \
                 질문을 장려하고, 학습 동기를 유지할 수 있도록 격려하세요."
            }
            "창작 활동" | "creative" => {
                "사용자의 창작 파트너로서, 창의적인 아이디어와 영감을 제공하는 것이 주요 역할입니다. \
                 브레인스토밍을 도와주고, 다양한 관점에서 아이디어를 제안하세요. \
                 창의성을 자극하는 질문을 던지고, 독창적인 접근을 격려하세요."
            }
            _ => {
                "사용자의 요청에 따라 다양한 역할을 수행합니다. \
                 친절하고 도움이 되는 태도로 사용자를 지원하세요."
            }
        }
        .to_string()
    }

    /// Get speech style prompt based on user preference
    fn get_style_prompt(speech_style: &str) -> String {
        match speech_style {
            "친근하고 편안한 말투 (반말)" | "casual" => {
                "반말을 사용하되, 예의를 지키는 친구 같은 말투로 대화하세요. \
                 \"~해\", \"~야\", \"~네\" 같은 표현을 자연스럽게 사용하세요. \
                 이모지를 적절히 활용하여 친근함을 더하세요."
            }
            "정중하고 격식 있는 말투 (존댓말)" | "formal" => {
                "항상 존댓말을 사용하고, 정중하고 격식 있는 표현을 사용하세요. \
                 \"~습니다\", \"~세요\" 같은 표현으로 예의를 갖춰 대화하세요. \
                 전문적이면서도 따뜻한 태도를 유지하세요."
            }
            "전문적이고 간결한 말투" | "professional" => {
                "간결하고 명확한 표현을 사용하세요. 불필요한 수식어를 피하고, \
                 핵심을 정확하게 전달하는 것에 집중하세요. \
                 전문적인 용어를 적절히 사용하되, 필요시 설명을 덧붙이세요."
            }
            "유머러스하고 재치있는 말투" | "humorous" => {
                "유머와 재치를 적절히 섞어 대화하세요. \
                 가벼운 농담이나 언어유희를 활용하여 즐거운 대화를 만드세요. \
                 하지만 중요한 내용을 다룰 때는 진지하게 대응하세요."
            }
            _ => {
                "사용자의 말투와 분위기에 맞춰 자연스럽게 대화하세요."
            }
        }
        .to_string()
    }

    /// Get personality prompt from open-ended responses
    fn get_personality_prompt(survey: &SurveyResults) -> String {
        let mut prompts = Vec::new();

        // Add ideal personality traits
        if !survey.ideal_ai_personality.is_empty() {
            prompts.push(format!(
                "사용자가 원하는 성격 특성: {}. 이 특성을 대화에 반영하세요.",
                survey.ideal_ai_personality
            ));
        }

        // Add improvements over previous AI
        if !survey.previous_ai_lacking.is_empty() {
            prompts.push(format!(
                "사용자가 이전 AI에서 부족하다고 느낀 점: {}. 이 부분을 개선하여 더 나은 경험을 제공하세요.",
                survey.previous_ai_lacking
            ));
        }

        // Add desired features/roles
        if !survey.desired_features.is_empty() {
            prompts.push(format!(
                "사용자가 바라는 특별한 역할: {}. 이 역할을 충실히 수행하세요.",
                survey.desired_features
            ));
        }

        if prompts.is_empty() {
            String::new()
        } else {
            prompts.join("\n\n")
        }
    }

    /// Generate model configuration based on survey and model size
    pub fn generate_model_config(
        _survey: &SurveyResults,
        model_name: &str,
    ) -> Result<ModelConfig> {
        let is_small_model = model_name.contains("1.5b");
        let is_medium_model = model_name.contains("7b");

        let config = if is_small_model {
            // Small model: More aggressive regularization
            ModelConfig {
                temperature: 0.8,
                top_p: 0.9,
                top_k: 50,
                repeat_penalty: 1.2,
                context_length_limit: 4096,
                response_diversity: 0.85,
            }
        } else if is_medium_model {
            // Medium model: Balanced settings
            ModelConfig {
                temperature: 0.75,
                top_p: 0.92,
                top_k: 60,
                repeat_penalty: 1.15,
                context_length_limit: 8192,
                response_diversity: 0.8,
            }
        } else {
            // Large model: More freedom, less regularization
            ModelConfig {
                temperature: 0.7,
                top_p: 0.95,
                top_k: 100,
                repeat_penalty: 1.1,
                context_length_limit: 32768,
                response_diversity: 0.7,
            }
        };

        Ok(config)
    }
}

/// Model configuration for inference
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    /// Temperature (0.0-1.0): Higher = more creative
    pub temperature: f32,

    /// Top-p (nucleus sampling): Cumulative probability threshold
    pub top_p: f32,

    /// Top-k sampling: Number of top tokens to consider
    pub top_k: i32,

    /// Repeat penalty: Penalize repetition (1.0 = no penalty, higher = more penalty)
    pub repeat_penalty: f32,

    /// Context length limit (tokens)
    pub context_length_limit: usize,

    /// Response diversity (affects temperature dynamically)
    pub response_diversity: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_custom_prompt() {
        let survey = SurveyResults {
            primary_use: "일상 대화 및 친구처럼 위로받기".to_string(),
            ai_experience: "ChatGPT 등 간단히 사용해봤습니다".to_string(),
            primary_language: "한국어".to_string(),
            speech_style: "친근하고 편안한 말투 (반말)".to_string(),
            ideal_ai_personality: "공감 능력이 뛰어나고, 격려를 잘 해줌".to_string(),
            previous_ai_lacking: "감정적 공감 부족".to_string(),
            desired_features: "매일 아침 동기부여".to_string(),
        };

        let prompt = PromptCustomizerService::generate_custom_prompt(&survey).unwrap();

        assert!(prompt.contains("Adam"));
        assert!(prompt.contains("Garden of Eden"));
        assert!(prompt.contains("친구이자 동반자"));
        assert!(prompt.contains("반말"));
        assert!(prompt.contains("공감 능력"));
    }

    #[test]
    fn test_generate_model_config_small() {
        let survey = SurveyResults {
            primary_use: "학습".to_string(),
            ai_experience: "처음".to_string(),
            primary_language: "한국어".to_string(),
            speech_style: "정중".to_string(),
            ideal_ai_personality: String::new(),
            previous_ai_lacking: String::new(),
            desired_features: String::new(),
        };

        let config = PromptCustomizerService::generate_model_config(&survey, "qwen2.5:1.5b").unwrap();

        assert_eq!(config.temperature, 0.8);
        assert_eq!(config.context_length_limit, 4096);
    }

    #[test]
    fn test_generate_model_config_large() {
        let survey = SurveyResults {
            primary_use: "업무".to_string(),
            ai_experience: "많음".to_string(),
            primary_language: "영어".to_string(),
            speech_style: "전문적".to_string(),
            ideal_ai_personality: String::new(),
            previous_ai_lacking: String::new(),
            desired_features: String::new(),
        };

        let config = PromptCustomizerService::generate_model_config(&survey, "qwen2.5:14b").unwrap();

        assert_eq!(config.temperature, 0.7);
        assert_eq!(config.context_length_limit, 32768);
    }
}

use anyhow::Result;
use log::info;
use serde::{Deserialize, Serialize};

use super::system_info::SystemSpecs;

/// Model recommendation based on system specifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRecommendation {
    /// Recommendation type
    pub recommendation_type: RecommendationType,

    /// Recommended model name (Ollama format)
    pub model: Option<String>,

    /// Model display name (user-friendly)
    pub model_display_name: Option<String>,

    /// Model size in GB
    pub size_gb: Option<f32>,

    /// Reason for recommendation
    pub reason: String,

    /// Additional notes or warnings
    pub notes: Vec<String>,

    /// Expected RAM usage during inference
    pub expected_ram_usage_gb: Option<u32>,
}

/// Recommendation type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RecommendationType {
    /// System specs are insufficient
    Insufficient,

    /// Lightweight model (1.5B for 8-11GB RAM)
    Lightweight,

    /// Moderate model (7B for 12-15GB RAM)
    Moderate,

    /// Optimal model (14B for 16GB+ RAM)
    Optimal,
}

/// Required models for full functionality
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequiredModels {
    /// Main LLM model
    pub llm: String,

    /// LLaVA vision model
    pub llava: String,

    /// Whisper speech-to-text model
    pub whisper: String,

    /// Total download size in GB
    pub total_size_gb: f32,

    /// Total expected RAM usage in GB
    pub total_ram_usage_gb: u32,
}

/// Model Recommender Service
pub struct ModelRecommenderService;

impl ModelRecommenderService {
    /// Recommend model based on system specifications
    pub fn recommend(specs: &SystemSpecs) -> Result<ModelRecommendation> {
        info!("Recommending model for specs: RAM={}GB, CPU={}cores",
            specs.total_ram_gb, specs.cpu_cores);

        let recommendation = if specs.total_ram_gb < 8 {
            // Insufficient RAM
            ModelRecommendation {
                recommendation_type: RecommendationType::Insufficient,
                model: None,
                model_display_name: None,
                size_gb: None,
                reason: "시스템 RAM이 부족합니다. Garden of Eden은 최소 8GB RAM이 필요합니다.".to_string(),
                notes: vec![
                    "최소 요구사항: 8GB RAM, 20GB 여유 디스크 공간".to_string(),
                    "권장 사양: 16GB RAM 이상".to_string(),
                ],
                expected_ram_usage_gb: None,
            }
        } else if specs.total_ram_gb <= 11 {
            // Lightweight: Qwen 2.5 1.5B
            ModelRecommendation {
                recommendation_type: RecommendationType::Lightweight,
                model: Some("qwen2.5:1.5b".to_string()),
                model_display_name: Some("Qwen 2.5 1.5B".to_string()),
                size_gb: Some(1.2),
                reason: "초경량 모델 (RAM 3-4GB 사용)".to_string(),
                notes: vec![
                    "한국어 완벽 지원 (29개 언어)".to_string(),
                    "빠른 응답 속도".to_string(),
                    "일상 대화에 최적화".to_string(),
                    "고급 추론 작업은 제한적일 수 있음".to_string(),
                ],
                expected_ram_usage_gb: Some(4),
            }
        } else if specs.total_ram_gb <= 15 {
            // Moderate: TBD - Will be selected during onboarding
            // For now, recommend Qwen 2.5 7B as baseline
            ModelRecommendation {
                recommendation_type: RecommendationType::Moderate,
                model: Some("qwen2.5:7b".to_string()),
                model_display_name: Some("Qwen 2.5 7B".to_string()),
                size_gb: Some(4.7),
                reason: "한국어 완벽 지원 + 균형잡힌 성능 (RAM 6-8GB 사용)".to_string(),
                notes: vec![
                    "한국어 완벽 지원 (29개 언어)".to_string(),
                    "대화, 코딩, 추론 모두 우수".to_string(),
                    "RAM 효율적".to_string(),
                    "12-15GB RAM 시스템에 최적".to_string(),
                ],
                expected_ram_usage_gb: Some(8),
            }
        } else {
            // Optimal: Qwen 2.5 14B
            let notes = if specs.total_ram_gb >= 24 {
                vec![
                    "최고 성능의 대화 품질".to_string(),
                    "한국어 완벽 지원 (29개 언어)".to_string(),
                    "복잡한 추론과 코드 생성 우수".to_string(),
                    "친구처럼 자연스러운 대화".to_string(),
                    "충분한 RAM으로 최적 성능 보장".to_string(),
                ]
            } else {
                vec![
                    "최고 성능의 대화 품질".to_string(),
                    "한국어 완벽 지원 (29개 언어)".to_string(),
                    "복잡한 추론과 코드 생성 우수".to_string(),
                    "친구처럼 자연스러운 대화".to_string(),
                ]
            };

            ModelRecommendation {
                recommendation_type: RecommendationType::Optimal,
                model: Some("qwen2.5:14b".to_string()),
                model_display_name: Some("Qwen 2.5 14B".to_string()),
                size_gb: Some(9.0),
                reason: "최고 성능, 대화 품질 최상 (RAM 10-12GB 사용)".to_string(),
                notes,
                expected_ram_usage_gb: Some(12),
            }
        };

        info!("Recommendation: {:?} - {}",
            recommendation.recommendation_type,
            recommendation.model.as_deref().unwrap_or("None"));

        Ok(recommendation)
    }

    /// Get all required models for full functionality
    pub fn get_required_models(llm_model: &str) -> Result<RequiredModels> {
        // Determine LLM size
        let llm_size = if llm_model.contains("1.5b") {
            1.2
        } else if llm_model.contains("7b") {
            4.7
        } else if llm_model.contains("14b") {
            9.0
        } else {
            9.0 // Default to 14B
        };

        // Determine RAM usage
        let llm_ram = if llm_model.contains("1.5b") {
            4
        } else if llm_model.contains("7b") {
            8
        } else {
            12
        };

        let models = RequiredModels {
            llm: llm_model.to_string(),
            llava: "llava:7b".to_string(),
            whisper: "whisper:large-v3".to_string(),
            total_size_gb: llm_size + 4.4 + 3.1, // LLM + LLaVA + Whisper
            total_ram_usage_gb: llm_ram + 4 + 3, // During simultaneous use
        };

        Ok(models)
    }

    /// Check if a model is valid/supported
    pub fn is_valid_model(model: &str) -> bool {
        matches!(model,
            "qwen2.5:1.5b" |
            "qwen2.5:7b" |
            "qwen2.5:14b" |
            "kwangsuklee/DeepSeek-R1-Distill-Qwen-7B-Multilingual"
        )
    }

    /// Get user-friendly model description
    pub fn get_model_description(model: &str) -> String {
        match model {
            "qwen2.5:1.5b" => "Qwen 2.5 1.5B - 초경량 모델 (1.2GB)".to_string(),
            "qwen2.5:7b" => "Qwen 2.5 7B - 균형 모델 (4.7GB)".to_string(),
            "qwen2.5:14b" => "Qwen 2.5 14B - 최고 성능 모델 (9.0GB)".to_string(),
            "kwangsuklee/DeepSeek-R1-Distill-Qwen-7B-Multilingual" =>
                "DeepSeek-R1 7B Multilingual - 추론 특화 모델 (4.7GB)".to_string(),
            _ => format!("Unknown model: {}", model),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recommend_insufficient() {
        let specs = SystemSpecs {
            total_ram_gb: 4,
            available_ram_gb: 2,
            cpu_cores: 4,
            cpu_name: "Test CPU".to_string(),
            has_gpu: false,
            gpu_name: None,
            disk_free_gb: 50,
            os: "Test OS".to_string(),
            os_version: "1.0".to_string(),
        };

        let rec = ModelRecommenderService::recommend(&specs).unwrap();
        assert_eq!(rec.recommendation_type, RecommendationType::Insufficient);
        assert!(rec.model.is_none());
    }

    #[test]
    fn test_recommend_lightweight() {
        let specs = SystemSpecs {
            total_ram_gb: 8,
            available_ram_gb: 4,
            cpu_cores: 4,
            cpu_name: "Test CPU".to_string(),
            has_gpu: false,
            gpu_name: None,
            disk_free_gb: 50,
            os: "Test OS".to_string(),
            os_version: "1.0".to_string(),
        };

        let rec = ModelRecommenderService::recommend(&specs).unwrap();
        assert_eq!(rec.recommendation_type, RecommendationType::Lightweight);
        assert_eq!(rec.model.as_deref(), Some("qwen2.5:1.5b"));
    }

    #[test]
    fn test_recommend_moderate() {
        let specs = SystemSpecs {
            total_ram_gb: 12,
            available_ram_gb: 6,
            cpu_cores: 8,
            cpu_name: "Test CPU".to_string(),
            has_gpu: true,
            gpu_name: Some("Test GPU".to_string()),
            disk_free_gb: 50,
            os: "Test OS".to_string(),
            os_version: "1.0".to_string(),
        };

        let rec = ModelRecommenderService::recommend(&specs).unwrap();
        assert_eq!(rec.recommendation_type, RecommendationType::Moderate);
        assert_eq!(rec.model.as_deref(), Some("qwen2.5:7b"));
    }

    #[test]
    fn test_recommend_optimal() {
        let specs = SystemSpecs {
            total_ram_gb: 16,
            available_ram_gb: 8,
            cpu_cores: 8,
            cpu_name: "Test CPU".to_string(),
            has_gpu: true,
            gpu_name: Some("Test GPU".to_string()),
            disk_free_gb: 100,
            os: "Test OS".to_string(),
            os_version: "1.0".to_string(),
        };

        let rec = ModelRecommenderService::recommend(&specs).unwrap();
        assert_eq!(rec.recommendation_type, RecommendationType::Optimal);
        assert_eq!(rec.model.as_deref(), Some("qwen2.5:14b"));
    }

    #[test]
    fn test_get_required_models() {
        let models = ModelRecommenderService::get_required_models("qwen2.5:14b").unwrap();

        assert_eq!(models.llm, "qwen2.5:14b");
        assert_eq!(models.llava, "llava:7b");
        assert_eq!(models.whisper, "whisper:large-v3");
        assert!(models.total_size_gb > 15.0); // 9 + 4.4 + 3.1 = 16.5GB
    }

    #[test]
    fn test_is_valid_model() {
        assert!(ModelRecommenderService::is_valid_model("qwen2.5:1.5b"));
        assert!(ModelRecommenderService::is_valid_model("qwen2.5:7b"));
        assert!(ModelRecommenderService::is_valid_model("qwen2.5:14b"));
        assert!(!ModelRecommenderService::is_valid_model("invalid:model"));
    }
}

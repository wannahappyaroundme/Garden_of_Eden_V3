use anyhow::{Result, Context};
use log::info;
use serde::{Deserialize, Serialize};
use std::process::Command;

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

    /// Whisper speech-to-text model (optional - only if voice features enabled)
    pub whisper: Option<String>,

    /// Total download size in GB
    pub total_size_gb: f32,

    /// Total expected RAM usage in GB
    pub total_ram_usage_gb: u32,

    /// Whether voice features are enabled
    pub voice_enabled: bool,
}

/// Model option with detailed information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelOption {
    /// Model name (Ollama format)
    pub model: String,

    /// Display name
    pub display_name: String,

    /// Size in GB
    pub size_gb: f32,

    /// Quantization level
    pub quantization: String,

    /// Expected speed (tokens/sec) on typical hardware
    pub expected_speed_ts: f32,

    /// Quality tier
    pub quality_tier: String,

    /// Korean language support level
    pub korean_support: String,

    /// Pros
    pub pros: Vec<String>,

    /// Cons
    pub cons: Vec<String>,

    /// Is this the recommended option?
    pub is_recommended: bool,
}

/// Downloaded model information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    /// Model name
    pub name: String,

    /// Size in bytes
    pub size_bytes: u64,

    /// Size in GB
    pub size_gb: f32,

    /// Last modified timestamp
    pub modified_at: i64,
}

/// Model Recommender Service
pub struct ModelRecommenderService;

impl ModelRecommenderService {
    /// Recommend model based on system specifications and language preference
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
                    "권장 사양: 12GB RAM 이상".to_string(),
                ],
                expected_ram_usage_gb: None,
            }
        } else if specs.total_ram_gb < 12 {
            // Lightweight: Qwen 2.5 3B (Korean + English)
            ModelRecommendation {
                recommendation_type: RecommendationType::Lightweight,
                model: Some("qwen2.5:3b".to_string()),
                model_display_name: Some("Qwen 2.5 3B".to_string()),
                size_gb: Some(2.0),
                reason: "초경량 모델 (RAM 4-5GB 사용)".to_string(),
                notes: vec![
                    "한국어 완벽 지원 (29개 언어)".to_string(),
                    "빠른 응답 속도 (50-70 t/s)".to_string(),
                    "일상 대화 및 간단한 작업에 최적".to_string(),
                    "복잡한 추론은 제한적".to_string(),
                ],
                expected_ram_usage_gb: Some(5),
            }
        } else if specs.total_ram_gb < 20 {
            // Moderate: Qwen 2.5 7B (fast 3-4s response, excellent Korean)
            ModelRecommendation {
                recommendation_type: RecommendationType::Moderate,
                model: Some("qwen2.5:7b".to_string()),
                model_display_name: Some("Qwen 2.5 7B".to_string()),
                size_gb: Some(4.7),
                reason: "빠른 응답 (3-4초 목표, RAM 6-8GB 사용)".to_string(),
                notes: vec![
                    "Alibaba Qwen 2.5 - 한국어 완벽 지원 (29개 언어)".to_string(),
                    "빠른 응답 속도 (3-4초 목표)".to_string(),
                    "phi3:mini 대비 우수한 추론 능력 (+5% MMLU)".to_string(),
                    "코딩, 추론, 대화 모두 우수".to_string(),
                    "12-19GB RAM 시스템에 최적화".to_string(),
                ],
                expected_ram_usage_gb: Some(8),
            }
        } else {
            // Optimal: Qwen 2.5 32B
            ModelRecommendation {
                recommendation_type: RecommendationType::Optimal,
                model: Some("qwen2.5:32b".to_string()),
                model_display_name: Some("Qwen 2.5 32B".to_string()),
                size_gb: Some(20.0),
                reason: "최고 성능 대형 모델 (RAM 18-22GB 사용)".to_string(),
                notes: vec![
                    "최상급 대화 품질 및 추론 능력".to_string(),
                    "한국어 완벽 지원 (29개 언어)".to_string(),
                    "복잡한 코드 생성 및 분석 우수".to_string(),
                    "친구처럼 깊이 있는 대화".to_string(),
                    "20GB+ RAM 시스템 전용".to_string(),
                ],
                expected_ram_usage_gb: Some(22),
            }
        };

        info!("Recommendation: {:?} - {}",
            recommendation.recommendation_type,
            recommendation.model.as_deref().unwrap_or("None"));

        Ok(recommendation)
    }

    /// Get all available models for user's RAM tier and language preference
    pub fn get_available_models(
        specs: &SystemSpecs,
        language_preference: &str,
    ) -> Result<Vec<ModelOption>> {
        info!("Getting available models for RAM={}GB, language={}",
            specs.total_ram_gb, language_preference);

        let is_korean = language_preference.contains("한국어") ||
                       language_preference.contains("Korean") ||
                       language_preference.contains("한영");

        let mut models = Vec::new();

        if specs.total_ram_gb < 8 {
            // Insufficient RAM - return empty list
            return Ok(models);
        } else if specs.total_ram_gb < 12 {
            // Lightweight tier: Only Qwen 2.5 3B
            models.push(ModelOption {
                model: "qwen2.5:3b".to_string(),
                display_name: "Qwen 2.5 3B".to_string(),
                size_gb: 2.0,
                quantization: "Q4_K_M".to_string(),
                expected_speed_ts: 60.0,
                quality_tier: "Good".to_string(),
                korean_support: "Excellent (Native)".to_string(),
                pros: vec![
                    "빠른 응답 속도 (50-70 t/s)".to_string(),
                    "낮은 RAM 사용량 (4-5GB)".to_string(),
                    "한국어 완벽 지원".to_string(),
                ],
                cons: vec![
                    "복잡한 추론 능력 제한적".to_string(),
                    "긴 문맥 이해 다소 부족".to_string(),
                ],
                is_recommended: true,
            });
        } else if specs.total_ram_gb < 20 {
            // Moderate tier: Korean vs English options
            if is_korean {
                // Korean: Qwen 2.5 14B (recommended) + Qwen 2.5 7B (alternative)
                models.push(ModelOption {
                    model: "qwen2.5:14b".to_string(),
                    display_name: "Qwen 2.5 14B".to_string(),
                    size_gb: 9.0,
                    quantization: "Q5_K_M".to_string(),
                    expected_speed_ts: 25.0,
                    quality_tier: "Excellent".to_string(),
                    korean_support: "Excellent (Native)".to_string(),
                    pros: vec![
                        "최상급 대화 품질".to_string(),
                        "한국어 완벽 지원 (29개 언어)".to_string(),
                        "코딩, 추론, 대화 모두 우수".to_string(),
                        "빠른 응답 속도 (20-30 t/s)".to_string(),
                    ],
                    cons: vec![
                        "RAM 사용량 높음 (10-12GB)".to_string(),
                    ],
                    is_recommended: true,
                });

                models.push(ModelOption {
                    model: "qwen2.5:7b".to_string(),
                    display_name: "Qwen 2.5 7B (경량 대안)".to_string(),
                    size_gb: 4.7,
                    quantization: "Q5_K_M".to_string(),
                    expected_speed_ts: 45.0,
                    quality_tier: "Very Good".to_string(),
                    korean_support: "Excellent (Native)".to_string(),
                    pros: vec![
                        "더 빠른 응답 속도 (40-50 t/s)".to_string(),
                        "낮은 RAM 사용량 (6-8GB)".to_string(),
                        "한국어 완벽 지원".to_string(),
                    ],
                    cons: vec![
                        "14B 대비 대화 품질 다소 낮음".to_string(),
                        "복잡한 추론 능력 제한적".to_string(),
                    ],
                    is_recommended: false,
                });
            } else {
                // English only: Gemma 2 9B (recommended) + Llama 3.1 8B
                models.push(ModelOption {
                    model: "gemma2:9b".to_string(),
                    display_name: "Gemma 2 9B".to_string(),
                    size_gb: 5.5,
                    quantization: "Q5_K_M".to_string(),
                    expected_speed_ts: 35.0,
                    quality_tier: "Excellent".to_string(),
                    korean_support: "None (English Only)".to_string(),
                    pros: vec![
                        "Excellent English conversation".to_string(),
                        "Strong reasoning capabilities".to_string(),
                        "Fast response (30-40 t/s)".to_string(),
                        "Lower RAM usage (7-9GB)".to_string(),
                    ],
                    cons: vec![
                        "No Korean support".to_string(),
                        "Smaller than Qwen 14B".to_string(),
                    ],
                    is_recommended: true,
                });

                models.push(ModelOption {
                    model: "llama3.1:8b".to_string(),
                    display_name: "Llama 3.1 8B".to_string(),
                    size_gb: 4.7,
                    quantization: "Q5_K_M".to_string(),
                    expected_speed_ts: 40.0,
                    quality_tier: "Very Good".to_string(),
                    korean_support: "None (English Only)".to_string(),
                    pros: vec![
                        "Fast response (35-45 t/s)".to_string(),
                        "Good code generation".to_string(),
                        "Lower RAM usage (6-8GB)".to_string(),
                    ],
                    cons: vec![
                        "No Korean support".to_string(),
                        "Lower quality than Gemma 2 9B".to_string(),
                    ],
                    is_recommended: false,
                });
            }
        } else {
            // Optimal tier (20GB+): Qwen 2.5 32B with Q4_K_M and Q5_K_M options
            models.push(ModelOption {
                model: "qwen2.5:32b".to_string(),
                display_name: "Qwen 2.5 32B (Q4_K_M)".to_string(),
                size_gb: 20.0,
                quantization: "Q4_K_M".to_string(),
                expected_speed_ts: 15.0,
                quality_tier: "Outstanding".to_string(),
                korean_support: if is_korean { "Excellent (Native)".to_string() } else { "Excellent (but English-only mode)".to_string() },
                pros: vec![
                    "최상급 대화 품질 및 추론".to_string(),
                    "복잡한 코드 생성 우수".to_string(),
                    "깊이 있는 대화 가능".to_string(),
                    "균형잡힌 속도 (12-18 t/s)".to_string(),
                ],
                cons: vec![
                    "높은 RAM 사용량 (18-22GB)".to_string(),
                    "큰 디스크 공간 (20GB)".to_string(),
                ],
                is_recommended: true,
            });

            if specs.total_ram_gb >= 28 {
                // Only offer Q5_K_M if user has 28GB+ RAM
                models.push(ModelOption {
                    model: "qwen2.5:32b-instruct-q5_k_m".to_string(),
                    display_name: "Qwen 2.5 32B (Q5_K_M 최고 품질)".to_string(),
                    size_gb: 24.0,
                    quantization: "Q5_K_M".to_string(),
                    expected_speed_ts: 12.0,
                    quality_tier: "Maximum Quality".to_string(),
                    korean_support: if is_korean { "Excellent (Native)".to_string() } else { "Excellent (but English-only mode)".to_string() },
                    pros: vec![
                        "최고 품질의 대화 (Q5_K_M)".to_string(),
                        "복잡한 추론 최상급".to_string(),
                        "전문가 수준 코드 생성".to_string(),
                    ],
                    cons: vec![
                        "매우 높은 RAM 사용량 (22-26GB)".to_string(),
                        "큰 디스크 공간 (24GB)".to_string(),
                        "다소 느린 응답 (10-15 t/s)".to_string(),
                    ],
                    is_recommended: false,
                });
            }
        }

        Ok(models)
    }

    /// Get currently active LLM model from Ollama
    pub async fn get_current_model() -> Result<String> {
        // Check Ollama's current model (via ps or config)
        let output = Command::new("ollama")
            .arg("list")
            .output()
            .context("Failed to execute ollama list command")?;

        if !output.status.success() {
            return Err(anyhow::anyhow!("Ollama list command failed"));
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = output_str.lines().collect();

        // Parse output to find the first model (assume it's the active one)
        // Format: NAME    ID    SIZE    MODIFIED
        if lines.len() > 1 {
            let first_model_line = lines[1];
            let model_name = first_model_line
                .split_whitespace()
                .next()
                .unwrap_or("unknown")
                .to_string();

            info!("Current active model: {}", model_name);
            Ok(model_name)
        } else {
            Err(anyhow::anyhow!("No models found in Ollama"))
        }
    }

    /// List all downloaded Ollama models with sizes
    pub async fn list_downloaded_models() -> Result<Vec<ModelInfo>> {
        let output = Command::new("ollama")
            .arg("list")
            .output()
            .context("Failed to execute ollama list command")?;

        if !output.status.success() {
            return Err(anyhow::anyhow!("Ollama list command failed"));
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = output_str.lines().collect();

        let mut models = Vec::new();

        // Skip header line
        for line in lines.iter().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                let name = parts[0].to_string();
                let size_str = parts[2];

                // Parse size (e.g., "9.0 GB" -> 9.0)
                let size_gb: f32 = size_str
                    .split_whitespace()
                    .next()
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(0.0);

                let size_bytes = (size_gb * 1_073_741_824.0) as u64; // GB to bytes

                models.push(ModelInfo {
                    name,
                    size_bytes,
                    size_gb,
                    modified_at: 0, // Ollama doesn't provide timestamps easily
                });
            }
        }

        info!("Found {} downloaded models", models.len());
        Ok(models)
    }

    /// Delete a model from Ollama
    pub async fn delete_model(model_name: &str) -> Result<()> {
        info!("Deleting model: {}", model_name);

        let output = Command::new("ollama")
            .arg("rm")
            .arg(model_name)
            .output()
            .context("Failed to execute ollama rm command")?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Failed to delete model: {}", error_msg));
        }

        info!("Successfully deleted model: {}", model_name);
        Ok(())
    }

    /// Get all required models for full functionality
    pub fn get_required_models(llm_model: &str, voice_enabled: bool) -> Result<RequiredModels> {
        // Determine LLM size based on model
        let llm_size = if llm_model.contains("phi3:mini") {
            2.2
        } else if llm_model.contains("gemma2:2b") {
            1.6
        } else if llm_model.contains("llama3.2:3b") {
            2.0
        } else if llm_model.contains("3b") {
            2.0
        } else if llm_model.contains("7b") {
            4.7
        } else if llm_model.contains("9b") {
            5.5
        } else if llm_model.contains("14b") {
            9.0
        } else if llm_model.contains("32b-instruct-q5_k_m") {
            24.0
        } else if llm_model.contains("32b") {
            20.0
        } else {
            2.2 // Default to Phi-3 Mini size (fast model)
        };

        // Determine RAM usage based on model size
        let llm_ram = if llm_model.contains("phi3:mini") {
            4
        } else if llm_model.contains("gemma2:2b") {
            3
        } else if llm_model.contains("llama3.2:3b") {
            4
        } else if llm_model.contains("3b") {
            5
        } else if llm_model.contains("7b") {
            8
        } else if llm_model.contains("9b") {
            9
        } else if llm_model.contains("14b") {
            12
        } else if llm_model.contains("32b-instruct-q5_k_m") {
            26
        } else if llm_model.contains("32b") {
            22
        } else {
            4 // Default to Phi-3 Mini RAM (fast model)
        };

        // Calculate total size and RAM based on voice features
        let (whisper_model, whisper_size, whisper_ram) = if voice_enabled {
            (Some("whisper:large-v3".to_string()), 3.1, 3)
        } else {
            (None, 0.0, 0)
        };

        let models = RequiredModels {
            llm: llm_model.to_string(),
            llava: "llava:7b".to_string(),
            whisper: whisper_model,
            total_size_gb: llm_size + 4.4 + whisper_size, // LLM + LLaVA + optional Whisper
            total_ram_usage_gb: llm_ram + 4 + whisper_ram, // During simultaneous use
            voice_enabled,
        };

        Ok(models)
    }

    /// Check if a model is valid/supported
    pub fn is_valid_model(model: &str) -> bool {
        matches!(model,
            "phi3:mini" |
            "gemma2:2b" |
            "llama3.2:3b" |
            "qwen2.5:3b" |
            "qwen2.5:7b" |
            "qwen2.5:14b" |
            "qwen2.5:32b" |
            "qwen2.5:32b-instruct-q5_k_m" |
            "gemma2:9b" |
            "llama3.1:8b"
        )
    }

    /// Get user-friendly model description
    pub fn get_model_description(model: &str) -> String {
        match model {
            "phi3:mini" => "Phi-3 Mini - 초고속 응답 (<5초, 2.2GB)".to_string(),
            "gemma2:2b" => "Gemma 2 2B - 초경량 초고속 (1.6GB)".to_string(),
            "llama3.2:3b" => "Llama 3.2 3B - 경량 범용 (2.0GB)".to_string(),
            "qwen2.5:3b" => "Qwen 2.5 3B - 초경량 모델 (2.0GB)".to_string(),
            "qwen2.5:7b" => "Qwen 2.5 7B - 경량 모델 (4.7GB)".to_string(),
            "qwen2.5:14b" => "Qwen 2.5 14B - 균형 모델 (9.0GB)".to_string(),
            "qwen2.5:32b" => "Qwen 2.5 32B - 최고 성능 모델 (20GB)".to_string(),
            "qwen2.5:32b-instruct-q5_k_m" => "Qwen 2.5 32B Q5_K_M - 최대 품질 (24GB)".to_string(),
            "gemma2:9b" => "Gemma 2 9B - English Only (5.5GB)".to_string(),
            "llama3.1:8b" => "Llama 3.1 8B - English Only (4.7GB)".to_string(),
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
        assert_eq!(rec.model.as_deref(), Some("qwen2.5:3b"));
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
            total_ram_gb: 20,
            available_ram_gb: 10,
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
        assert_eq!(rec.model.as_deref(), Some("qwen2.5:32b"));
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

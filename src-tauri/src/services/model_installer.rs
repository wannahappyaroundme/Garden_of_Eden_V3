use anyhow::{anyhow, Context, Result};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

/// Download status for a model
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DownloadStatus {
    NotStarted,
    Downloading { progress: f32 },
    Completed,
    Failed { error: String, retryable: bool },
}

/// Model download progress information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub model_name: String,
    pub status: DownloadStatus,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub progress_percent: f32,
    pub speed_mbps: Option<f32>,
    pub eta_seconds: Option<u32>,
}

/// Model download state (persisted to database)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelDownloadState {
    pub llm_model: DownloadProgress,
    pub llava_model: DownloadProgress,
    pub whisper_model: DownloadProgress,
}

/// Model Installer Service
pub struct ModelInstallerService {
    /// Current download state (shared across threads)
    state: Arc<Mutex<ModelDownloadState>>,
}

impl ModelInstallerService {
    /// Create a new ModelInstallerService
    pub fn new() -> Self {
        let initial_state = ModelDownloadState {
            llm_model: DownloadProgress {
                model_name: "".to_string(),
                status: DownloadStatus::NotStarted,
                downloaded_bytes: 0,
                total_bytes: None,
                progress_percent: 0.0,
                speed_mbps: None,
                eta_seconds: None,
            },
            llava_model: DownloadProgress {
                model_name: "llava:7b".to_string(),
                status: DownloadStatus::NotStarted,
                downloaded_bytes: 0,
                total_bytes: None,
                progress_percent: 0.0,
                speed_mbps: None,
                eta_seconds: None,
            },
            whisper_model: DownloadProgress {
                model_name: "whisper:large-v3".to_string(),
                status: DownloadStatus::NotStarted,
                downloaded_bytes: 0,
                total_bytes: None,
                progress_percent: 0.0,
                speed_mbps: None,
                eta_seconds: None,
            },
        };

        Self {
            state: Arc::new(Mutex::new(initial_state)),
        }
    }

    /// Check if Ollama is installed and running
    pub async fn check_ollama_installed(&self) -> Result<bool> {
        info!("Checking if Ollama is installed...");

        // Try to run `ollama --version`
        let output = TokioCommand::new("ollama")
            .arg("--version")
            .output()
            .await;

        match output {
            Ok(output) if output.status.success() => {
                let version = String::from_utf8_lossy(&output.stdout);
                info!("Ollama installed: {}", version.trim());
                Ok(true)
            }
            Ok(output) => {
                error!("Ollama command failed: {:?}", output);
                Ok(false)
            }
            Err(e) => {
                warn!("Ollama not found: {}", e);
                Ok(false)
            }
        }
    }

    /// Check if a specific model exists locally
    pub async fn check_model_exists(&self, model_name: &str) -> Result<bool> {
        info!("Checking if model exists: {}", model_name);

        let output = TokioCommand::new("ollama")
            .args(&["list"])
            .output()
            .await
            .context("Failed to run 'ollama list'")?;

        if !output.status.success() {
            return Ok(false);
        }

        let list_output = String::from_utf8_lossy(&output.stdout);

        // Check if model name appears in the list
        let model_exists = list_output.lines().any(|line| {
            line.to_lowercase().contains(&model_name.to_lowercase())
        });

        info!("Model {} exists: {}", model_name, model_exists);
        Ok(model_exists)
    }

    /// Start downloading a model (non-blocking)
    pub async fn start_model_download(
        &self,
        model_name: String,
        model_type: ModelType,
    ) -> Result<()> {
        info!("Starting download for model: {} (type: {:?})", model_name, model_type);

        // Update state to "Downloading"
        {
            let mut state = self.state.lock().unwrap();
            let progress = match model_type {
                ModelType::LLM => &mut state.llm_model,
                ModelType::LLaVA => &mut state.llava_model,
                ModelType::Whisper => &mut state.whisper_model,
            };
            progress.model_name = model_name.clone();
            progress.status = DownloadStatus::Downloading { progress: 0.0 };
            progress.progress_percent = 0.0;
        }

        // Spawn download task
        let state_clone = Arc::clone(&self.state);
        let model_name_clone = model_name.clone();
        let model_type_clone = model_type;

        tokio::spawn(async move {
            let result = Self::download_model_internal(
                state_clone.clone(),
                model_name_clone.clone(),
                model_type_clone,
            ).await;

            match result {
                Ok(_) => {
                    info!("Model download completed: {}", model_name_clone);

                    let mut state = state_clone.lock().unwrap();
                    let progress = match model_type_clone {
                        ModelType::LLM => &mut state.llm_model,
                        ModelType::LLaVA => &mut state.llava_model,
                        ModelType::Whisper => &mut state.whisper_model,
                    };
                    progress.status = DownloadStatus::Completed;
                    progress.progress_percent = 100.0;
                }
                Err(e) => {
                    error!("Model download failed: {} - {}", model_name_clone, e);

                    let mut state = state_clone.lock().unwrap();
                    let progress = match model_type_clone {
                        ModelType::LLM => &mut state.llm_model,
                        ModelType::LLaVA => &mut state.llava_model,
                        ModelType::Whisper => &mut state.whisper_model,
                    };
                    progress.status = DownloadStatus::Failed {
                        error: e.to_string(),
                        retryable: true,
                    };
                }
            }
        });

        Ok(())
    }

    /// Internal download implementation (blocking, called in async task)
    async fn download_model_internal(
        state: Arc<Mutex<ModelDownloadState>>,
        model_name: String,
        model_type: ModelType,
    ) -> Result<()> {
        info!("Executing ollama pull for: {}", model_name);

        let mut child = TokioCommand::new("ollama")
            .args(&["pull", &model_name])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .context("Failed to spawn ollama pull")?;

        let stdout = child.stdout.take().ok_or_else(|| anyhow!("Failed to capture stdout"))?;
        let mut reader = BufReader::new(stdout).lines();

        // Parse progress from ollama output
        while let Some(line) = reader.next_line().await? {
            info!("Ollama output: {}", line);

            // Try to parse progress percentage
            // Ollama output format: "pulling manifest... 45%"
            if let Some(progress) = Self::parse_progress(&line) {
                let mut state_lock = state.lock().unwrap();
                let download_progress = match model_type {
                    ModelType::LLM => &mut state_lock.llm_model,
                    ModelType::LLaVA => &mut state_lock.llava_model,
                    ModelType::Whisper => &mut state_lock.whisper_model,
                };
                download_progress.progress_percent = progress;
                download_progress.status = DownloadStatus::Downloading { progress: progress / 100.0 };
            }
        }

        let status = child.wait().await?;

        if !status.success() {
            return Err(anyhow!("Ollama pull failed with status: {}", status));
        }

        Ok(())
    }

    /// Parse progress percentage from ollama output
    fn parse_progress(line: &str) -> Option<f32> {
        // Look for percentage in the line (e.g., "45%", "100%")
        if let Some(percent_idx) = line.find('%') {
            // Find the number before %
            let before_percent = &line[..percent_idx];
            let words: Vec<&str> = before_percent.split_whitespace().collect();

            if let Some(last_word) = words.last() {
                if let Ok(progress) = last_word.parse::<f32>() {
                    return Some(progress.clamp(0.0, 100.0));
                }
            }
        }

        None
    }

    /// Get current download state
    pub fn get_download_state(&self) -> ModelDownloadState {
        self.state.lock().unwrap().clone()
    }

    /// Check if all models are downloaded
    pub fn all_models_downloaded(&self) -> bool {
        let state = self.state.lock().unwrap();
        state.llm_model.status == DownloadStatus::Completed
            && state.llava_model.status == DownloadStatus::Completed
            && state.whisper_model.status == DownloadStatus::Completed
    }

    /// Download all required models sequentially
    pub async fn download_all_models(&self, llm_model: String) -> Result<()> {
        info!("Starting download of all required models...");

        // 1. Download LLM
        self.start_model_download(llm_model.clone(), ModelType::LLM).await?;
        self.wait_for_download(ModelType::LLM).await?;

        // 2. Download LLaVA
        self.start_model_download("llava:7b".to_string(), ModelType::LLaVA).await?;
        self.wait_for_download(ModelType::LLaVA).await?;

        // 3. Download Whisper
        self.start_model_download("whisper:large-v3".to_string(), ModelType::Whisper).await?;
        self.wait_for_download(ModelType::Whisper).await?;

        info!("All models downloaded successfully!");
        Ok(())
    }

    /// Wait for a specific model download to complete
    async fn wait_for_download(&self, model_type: ModelType) -> Result<()> {
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

            let state = self.state.lock().unwrap();
            let progress = match model_type {
                ModelType::LLM => &state.llm_model,
                ModelType::LLaVA => &state.llava_model,
                ModelType::Whisper => &state.whisper_model,
            };

            match &progress.status {
                DownloadStatus::Completed => {
                    return Ok(());
                }
                DownloadStatus::Failed { error, .. } => {
                    return Err(anyhow!("Download failed: {}", error));
                }
                _ => {
                    // Still downloading, continue waiting
                }
            }
        }
    }
}

/// Model type for tracking downloads
#[derive(Debug, Clone, Copy)]
pub enum ModelType {
    LLM,
    LLaVA,
    Whisper,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_progress() {
        assert_eq!(ModelInstallerService::parse_progress("pulling manifest... 45%"), Some(45.0));
        assert_eq!(ModelInstallerService::parse_progress("downloading 100%"), Some(100.0));
        assert_eq!(ModelInstallerService::parse_progress("no progress here"), None);
        assert_eq!(ModelInstallerService::parse_progress("pulling 0%"), Some(0.0));
    }

    #[tokio::test]
    async fn test_check_ollama_installed() {
        let service = ModelInstallerService::new();
        // This test will pass or fail depending on whether Ollama is installed
        // Just ensure it doesn't panic
        let _ = service.check_ollama_installed().await;
    }
}

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

    /// Install Ollama (platform-specific)
    pub async fn install_ollama(&self) -> Result<()> {
        info!("Starting Ollama installation...");

        #[cfg(target_os = "macos")]
        {
            self.install_ollama_macos().await
        }

        #[cfg(target_os = "windows")]
        {
            self.install_ollama_windows().await
        }

        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        {
            Err(anyhow!("Ollama auto-install is only supported on macOS and Windows. Please install manually from https://ollama.ai"))
        }
    }

    #[cfg(target_os = "macos")]
    async fn install_ollama_macos(&self) -> Result<()> {
        info!("Installing Ollama via Homebrew on macOS...");

        // Check if Homebrew is installed
        let brew_check = TokioCommand::new("which")
            .arg("brew")
            .output()
            .await;

        if brew_check.is_err() || !brew_check.unwrap().status.success() {
            return Err(anyhow!(
                "Homebrew is not installed. Please install Homebrew first from https://brew.sh, then try again."
            ));
        }

        // Install Ollama via Homebrew
        info!("Running: brew install ollama");
        let mut child = TokioCommand::new("brew")
            .args(&["install", "ollama"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .context("Failed to start brew install")?;

        let stdout = child.stdout.take().ok_or_else(|| anyhow!("Failed to capture stdout"))?;
        let mut reader = BufReader::new(stdout).lines();

        // Stream output for user feedback
        while let Some(line) = reader.next_line().await? {
            info!("Brew: {}", line);
        }

        let status = child.wait().await?;

        if !status.success() {
            return Err(anyhow!("Homebrew installation failed. Please install Ollama manually from https://ollama.ai"));
        }

        info!("Ollama installed successfully via Homebrew!");

        // Start Ollama service
        info!("Starting Ollama service...");
        let start_result = TokioCommand::new("brew")
            .args(&["services", "start", "ollama"])
            .output()
            .await;

        if let Err(e) = start_result {
            warn!("Failed to start Ollama service via brew services: {}. Will try direct start.", e);

            // Try starting Ollama directly in background
            let _ = TokioCommand::new("ollama")
                .arg("serve")
                .spawn();

            // Give it a moment to start
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
        } else {
            // Give brew services time to start
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
        }

        info!("Ollama service started!");
        Ok(())
    }

    #[cfg(target_os = "windows")]
    async fn install_ollama_windows(&self) -> Result<()> {
        info!("Installing Ollama on Windows...");

        // Download Ollama installer
        let installer_url = "https://ollama.ai/download/OllamaSetup.exe";
        let installer_path = std::env::temp_dir().join("OllamaSetup.exe");

        info!("Downloading Ollama installer from {}", installer_url);

        // Download the installer using curl (available on Windows 10+)
        let download = TokioCommand::new("curl")
            .args(&[
                "-L",
                "-o",
                installer_path.to_str().unwrap(),
                installer_url,
            ])
            .output()
            .await
            .context("Failed to download Ollama installer")?;

        if !download.status.success() {
            return Err(anyhow!(
                "Failed to download Ollama installer. Please download manually from https://ollama.ai"
            ));
        }

        info!("Running Ollama installer...");

        // Run the installer (silent mode)
        let install = TokioCommand::new(&installer_path)
            .arg("/S") // Silent install flag for NSIS installer
            .output()
            .await
            .context("Failed to run Ollama installer")?;

        if !install.status.success() {
            return Err(anyhow!(
                "Ollama installation failed. Please install manually from https://ollama.ai"
            ));
        }

        // Clean up installer
        let _ = std::fs::remove_file(&installer_path);

        info!("Ollama installed successfully on Windows!");
        Ok(())
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
        // Clean ANSI escape codes from the line
        let clean_line = Self::strip_ansi_codes(line);

        // Look for percentage in the line (e.g., "45%", "100%", "51%")
        if let Some(percent_idx) = clean_line.find('%') {
            // Find the number before %
            let before_percent = &clean_line[..percent_idx];

            // Split by whitespace and colons to handle formats like:
            // "pulling manifest... 45%"
            // "pulling 170370233dd5: 51%"
            let words: Vec<&str> = before_percent.split(|c: char| c.is_whitespace() || c == ':').collect();

            if let Some(last_word) = words.last() {
                // Try to parse as float, handling both integer and decimal percentages
                if let Ok(progress) = last_word.trim().parse::<f32>() {
                    info!("Parsed progress: {}%", progress);
                    return Some(progress.clamp(0.0, 100.0));
                }
            }
        }

        None
    }

    /// Strip ANSI escape codes from a string
    fn strip_ansi_codes(s: &str) -> String {
        let mut result = String::new();
        let mut chars = s.chars().peekable();

        while let Some(ch) = chars.next() {
            if ch == '\x1b' || ch == '\u{009b}' {
                // Skip escape sequence
                if chars.peek() == Some(&'[') {
                    chars.next(); // consume '['
                    // Skip until we hit a letter (the command)
                    while let Some(&next_ch) = chars.peek() {
                        chars.next();
                        if next_ch.is_ascii_alphabetic() || next_ch == 'm' || next_ch == 'K' || next_ch == 'G' || next_ch == 'A' || next_ch == 'H' || next_ch == 'J' {
                            break;
                        }
                    }
                }
            } else {
                result.push(ch);
            }
        }

        result
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
        // Old format
        assert_eq!(ModelInstallerService::parse_progress("pulling manifest... 45%"), Some(45.0));
        assert_eq!(ModelInstallerService::parse_progress("downloading 100%"), Some(100.0));
        assert_eq!(ModelInstallerService::parse_progress("pulling 0%"), Some(0.0));

        // New Ollama format with layer IDs
        assert_eq!(ModelInstallerService::parse_progress("pulling 170370233dd5:  51%"), Some(51.0));
        assert_eq!(ModelInstallerService::parse_progress("pulling abc123def456: 75%"), Some(75.0));

        // With ANSI codes (simulated)
        assert_eq!(ModelInstallerService::parse_progress("\x1b[1Gpulling 170370233dd5:  51% \x1b[K"), Some(51.0));

        // No progress
        assert_eq!(ModelInstallerService::parse_progress("no progress here"), None);
    }

    #[test]
    fn test_strip_ansi_codes() {
        assert_eq!(
            ModelInstallerService::strip_ansi_codes("hello\x1b[1mworld\x1b[0m"),
            "helloworld"
        );
        assert_eq!(
            ModelInstallerService::strip_ansi_codes("\x1b[1Gpulling: 51%\x1b[K"),
            "pulling: 51%"
        );
        assert_eq!(
            ModelInstallerService::strip_ansi_codes("no ansi codes"),
            "no ansi codes"
        );
    }

    #[tokio::test]
    async fn test_check_ollama_installed() {
        let service = ModelInstallerService::new();
        // This test will pass or fail depending on whether Ollama is installed
        // Just ensure it doesn't panic
        let _ = service.check_ollama_installed().await;
    }
}

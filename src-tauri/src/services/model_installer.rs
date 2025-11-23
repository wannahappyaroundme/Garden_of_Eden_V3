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
        info!("Installing Ollama on macOS...");

        // Check if Homebrew is installed
        let brew_check = TokioCommand::new("which")
            .arg("brew")
            .output()
            .await;

        let has_brew = brew_check.is_ok() && brew_check.unwrap().status.success();

        if has_brew {
            // Option 1: Use Homebrew if available
            info!("Homebrew detected - Installing Ollama via brew...");
            let mut child = TokioCommand::new("brew")
                .args(&["install", "ollama"])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .context("Failed to start brew install")?;

            // Capture both stdout and stderr for complete error visibility
            let stdout = child.stdout.take().ok_or_else(|| anyhow!("Failed to capture stdout"))?;
            let stderr = child.stderr.take().ok_or_else(|| anyhow!("Failed to capture stderr"))?;

            let mut stdout_reader = BufReader::new(stdout).lines();
            let mut stderr_reader = BufReader::new(stderr).lines();

            // Stream output from both streams for user feedback
            loop {
                tokio::select! {
                    result = stdout_reader.next_line() => {
                        match result {
                            Ok(Some(line)) => info!("[Brew STDOUT] {}", line),
                            Ok(None) => break,
                            Err(e) => return Err(e.into()),
                        }
                    }
                    result = stderr_reader.next_line() => {
                        match result {
                            Ok(Some(line)) => info!("[Brew STDERR] {}", line),
                            Ok(None) => {},
                            Err(e) => warn!("Error reading brew stderr: {}", e),
                        }
                    }
                }
            }

            let status = child.wait().await?;

            if !status.success() {
                return Err(anyhow!("Homebrew installation failed. Please install Ollama manually from https://ollama.com/download/mac"));
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
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn();

                // Give it a moment to start
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
            } else {
                // Give brew services time to start
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
            }
        } else {
            // Option 2: Direct download using official installation script
            info!("Homebrew not found - using official Ollama installation script...");

            // Use official Ollama installation script (recommended by Ollama)
            info!("Running official Ollama installer: curl -fsSL https://ollama.com/install.sh | sh");

            let install = TokioCommand::new("sh")
                .args(&["-c", "curl -fsSL https://ollama.com/install.sh | sh"])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .context("Failed to spawn Ollama installer")?;

            // Read both stdout and stderr to capture all output
            let output = install.wait_with_output().await?;

            // Log all output for debugging
            if !output.stdout.is_empty() {
                let stdout_str = String::from_utf8_lossy(&output.stdout);
                info!("[Ollama Install STDOUT] {}", stdout_str);
            }
            if !output.stderr.is_empty() {
                let stderr_str = String::from_utf8_lossy(&output.stderr);
                info!("[Ollama Install STDERR] {}", stderr_str);
            }

            if !output.status.success() {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                return Err(anyhow!(
                    "Ollama installation failed: {}. Please install manually from https://ollama.com/download/mac",
                    error_msg
                ));
            }

            info!("Ollama installed successfully via official script!");

            // Start Ollama
            info!("Starting Ollama...");
            let _ = TokioCommand::new("ollama")
                .arg("serve")
                .spawn();

            // Give it time to start
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        }

        // Wait for Ollama to be ready
        self.wait_for_ollama_ready().await?;

        info!("Ollama service started and ready!");
        Ok(())
    }

    #[cfg(target_os = "windows")]
    async fn install_ollama_windows(&self) -> Result<()> {
        info!("Installing Ollama on Windows...");

        // Use official Ollama download URL (corrected from .ai to .com)
        let installer_url = "https://ollama.com/download/OllamaSetup.exe";
        let installer_path = std::env::temp_dir().join("OllamaSetup.exe");

        info!("Downloading Ollama installer from {}", installer_url);

        // Use PowerShell with progress tracking (preferred on Windows)
        let ps_script = format!(
            "$ProgressPreference = 'Continue'; Invoke-WebRequest -Uri '{}' -OutFile '{}' -Verbose",
            installer_url,
            installer_path.display()
        );

        let download = TokioCommand::new("powershell")
            .args(&["-Command", &ps_script])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .context("Failed to spawn PowerShell download")?;

        // Read both stdout and stderr to capture all output
        let download_output = download.wait_with_output().await?;

        // Log all output for debugging
        if !download_output.stdout.is_empty() {
            let stdout_str = String::from_utf8_lossy(&download_output.stdout);
            info!("[Download STDOUT] {}", stdout_str);
        }
        if !download_output.stderr.is_empty() {
            let stderr_str = String::from_utf8_lossy(&download_output.stderr);
            info!("[Download STDERR] {}", stderr_str);
        }

        if !download_output.status.success() {
            // Fallback to curl if PowerShell failed
            warn!("PowerShell download failed, trying curl...");
            let curl_download = TokioCommand::new("curl")
                .args(&[
                    "-L",
                    "-o",
                    installer_path.to_str().unwrap(),
                    installer_url,
                ])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .context("Failed to spawn curl download")?;

            let curl_output = curl_download.wait_with_output().await?;

            // Log curl output
            if !curl_output.stdout.is_empty() {
                let stdout_str = String::from_utf8_lossy(&curl_output.stdout);
                info!("[Curl STDOUT] {}", stdout_str);
            }
            if !curl_output.stderr.is_empty() {
                let stderr_str = String::from_utf8_lossy(&curl_output.stderr);
                info!("[Curl STDERR] {}", stderr_str);
            }

            if !curl_output.status.success() {
                let error_msg = String::from_utf8_lossy(&curl_output.stderr);
                return Err(anyhow!(
                    "Failed to download Ollama installer: {}. Please download manually from https://ollama.com/download",
                    error_msg
                ));
            }
        }

        info!("Download complete! Running Ollama installer in silent mode...");

        // Run the installer (silent mode with InnoSetup /VERYSILENT flag)
        // Note: /VERYSILENT is more thorough than /SILENT
        let install = TokioCommand::new(&installer_path)
            .args(&["/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .context("Failed to spawn Ollama installer")?;

        let install_output = install.wait_with_output().await?;

        // Log installer output
        if !install_output.stdout.is_empty() {
            let stdout_str = String::from_utf8_lossy(&install_output.stdout);
            info!("[Installer STDOUT] {}", stdout_str);
        }
        if !install_output.stderr.is_empty() {
            let stderr_str = String::from_utf8_lossy(&install_output.stderr);
            info!("[Installer STDERR] {}", stderr_str);
        }

        if !install_output.status.success() {
            let error_msg = String::from_utf8_lossy(&install_output.stderr);
            return Err(anyhow!(
                "Ollama installation failed: {}. Please install manually from https://ollama.com/download",
                error_msg
            ));
        }

        // Clean up installer
        let _ = std::fs::remove_file(&installer_path);

        info!("Ollama installed successfully on Windows!");

        // Wait a moment for installation to complete fully
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

        // Start Ollama service
        info!("Starting Ollama service on Windows...");
        self.start_ollama_service_windows().await?;

        // Wait for Ollama to be ready
        self.wait_for_ollama_ready().await?;

        info!("Ollama service started and ready!");
        Ok(())
    }

    #[cfg(target_os = "windows")]
    async fn start_ollama_service_windows(&self) -> Result<()> {
        info!("Attempting to start Ollama service on Windows");

        // Try 1: Windows Service (if installed as a service)
        info!("Trying to start Ollama via Windows Service...");
        let service_result = TokioCommand::new("sc")
            .args(&["start", "OllamaService"])
            .output()
            .await;

        if let Ok(output) = service_result {
            if output.status.success() {
                info!("Started Ollama via Windows Service");
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                return Ok(());
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                warn!("Windows Service start failed: {}", stderr);
            }
        }

        // Try 2: Direct spawn (like macOS fallback)
        info!("Windows Service not available, spawning 'ollama serve' directly");

        let spawn_result = TokioCommand::new("ollama")
            .arg("serve")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();

        match spawn_result {
            Ok(_) => {
                info!("Spawned 'ollama serve' in background");
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                Ok(())
            }
            Err(e) => {
                // Try 3: PowerShell Start-Process
                warn!("Direct spawn failed: {}. Trying PowerShell...", e);

                let ps_result = TokioCommand::new("powershell")
                    .args(&[
                        "-Command",
                        "Start-Process",
                        "-FilePath",
                        "ollama",
                        "-ArgumentList",
                        "serve",
                        "-WindowStyle",
                        "Hidden",
                    ])
                    .output()
                    .await;

                if let Ok(output) = ps_result {
                    if output.status.success() {
                        info!("Started Ollama via PowerShell");
                        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                        return Ok(());
                    }
                }

                Err(anyhow!("Failed to start Ollama service. Please run 'ollama serve' manually."))
            }
        }
    }

    /// Wait for Ollama to be ready (health check)
    async fn wait_for_ollama_ready(&self) -> Result<()> {
        info!("Waiting for Ollama to be ready (health check)...");

        for attempt in 1..=10 {
            info!("Health check attempt {}/10", attempt);

            // Try to connect to Ollama API
            let client = reqwest::Client::builder()
                .timeout(tokio::time::Duration::from_secs(5))
                .build()?;

            match client.get("http://localhost:11434/api/tags").send().await {
                Ok(response) if response.status().is_success() => {
                    info!("Ollama is ready! (attempt {})", attempt);
                    return Ok(());
                }
                Ok(response) => {
                    warn!("Ollama responded but not ready (status: {})", response.status());
                }
                Err(e) => {
                    warn!("Health check failed (attempt {}): {}", attempt, e);
                }
            }

            // Wait before retrying
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        }

        Err(anyhow!("Ollama failed to start after 20 seconds. Please check if the service is running."))
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
        info!("[{}] Executing ollama pull for: {}",
            if cfg!(target_os = "windows") { "Windows" }
            else if cfg!(target_os = "macos") { "macOS" }
            else { "Linux" },
            model_name
        );

        // Build command with platform-specific settings
        let mut command = TokioCommand::new("ollama");
        command.args(&["pull", &model_name])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Windows: Hide console window
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            command.creation_flags(CREATE_NO_WINDOW);
            info!("[Windows] Command will run with CREATE_NO_WINDOW flag (hidden terminal)");
        }

        #[cfg(target_os = "macos")]
        {
            info!("[macOS] Running ollama pull in background (no visible terminal)");
        }

        #[cfg(target_os = "linux")]
        {
            info!("[Linux] Running ollama pull in background (no visible terminal)");
        }

        let mut child = command.spawn()
            .context("Failed to spawn ollama pull")?;

        // Capture both stdout AND stderr concurrently
        let stdout = child.stdout.take().ok_or_else(|| anyhow!("Failed to capture stdout"))?;
        let stderr = child.stderr.take().ok_or_else(|| anyhow!("Failed to capture stderr"))?;

        let mut stdout_reader = BufReader::new(stdout).lines();
        let mut stderr_reader = BufReader::new(stderr).lines();

        info!("Reading ollama output from both stdout and stderr...");

        // Read from both streams concurrently using tokio::select!
        loop {
            tokio::select! {
                result = stdout_reader.next_line() => {
                    match result {
                        Ok(Some(line)) => {
                            info!("[STDOUT] {}", line);
                            if let Some(progress) = Self::parse_progress(&line) {
                                let mut state_lock = state.lock().unwrap();
                                let download_progress = match model_type {
                                    ModelType::LLM => &mut state_lock.llm_model,
                                    ModelType::LLaVA => &mut state_lock.llava_model,
                                };
                                download_progress.progress_percent = progress;
                                download_progress.status = DownloadStatus::Downloading { progress: progress / 100.0 };
                                info!("Progress updated: {}%", progress);
                            }
                        }
                        Ok(None) => {
                            info!("stdout stream ended");
                            break;
                        }
                        Err(e) => {
                            warn!("Error reading stdout: {}", e);
                            return Err(e.into());
                        }
                    }
                }
                result = stderr_reader.next_line() => {
                    match result {
                        Ok(Some(line)) => {
                            info!("[STDERR] {}", line);
                            // Ollama often outputs progress to stderr
                            if let Some(progress) = Self::parse_progress(&line) {
                                let mut state_lock = state.lock().unwrap();
                                let download_progress = match model_type {
                                    ModelType::LLM => &mut state_lock.llm_model,
                                    ModelType::LLaVA => &mut state_lock.llava_model,
                                };
                                download_progress.progress_percent = progress;
                                download_progress.status = DownloadStatus::Downloading { progress: progress / 100.0 };
                                info!("Progress updated from stderr: {}%", progress);
                            }
                        }
                        Ok(None) => {
                            info!("stderr stream ended");
                        }
                        Err(e) => {
                            warn!("Error reading stderr: {}", e);
                            // Don't fail on stderr errors, just log
                        }
                    }
                }
            }
        }

        let status = child.wait().await?;

        if !status.success() {
            return Err(anyhow!("Ollama pull failed with status: {}", status));
        }

        info!("Model download completed successfully: {}", model_name);
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

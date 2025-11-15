use anyhow::Result;
use hound::{WavSpec, WavWriter};
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use tokio::process::Command;
use log::{info, error};

/// Whisper Speech-to-Text Service
/// Handles audio recording and transcription using Whisper Medium via Ollama
pub struct WhisperService {
    audio_dir: PathBuf,
    is_recording: Arc<Mutex<bool>>,
    current_audio_path: Arc<Mutex<Option<PathBuf>>>,
}

impl WhisperService {
    pub fn new(data_dir: PathBuf) -> Result<Self> {
        let audio_dir = data_dir.join("audio");
        std::fs::create_dir_all(&audio_dir)?;

        Ok(Self {
            audio_dir,
            is_recording: Arc::new(Mutex::new(false)),
            current_audio_path: Arc::new(Mutex::new(None)),
        })
    }

    /// Start recording audio from the default microphone
    pub fn start_recording(&self) -> Result<String> {
        let mut is_recording = self.is_recording.lock().unwrap();
        if *is_recording {
            return Err(anyhow::anyhow!("Already recording"));
        }

        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let audio_path = self.audio_dir.join(format!("recording_{}.wav", timestamp));

        info!("Starting audio recording: {:?}", audio_path);

        let mut audio_path_guard = self.current_audio_path.lock().unwrap();
        *audio_path_guard = Some(audio_path.clone());
        *is_recording = true;

        // Spawn recording task using std::thread since cpal::Stream is not Send
        let audio_path_clone = audio_path.clone();
        let is_recording_clone = Arc::clone(&self.is_recording);

        std::thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().unwrap();
            if let Err(e) = rt.block_on(Self::record_audio_task(audio_path_clone, is_recording_clone)) {
                error!("Recording task failed: {}", e);
            }
        });

        Ok(audio_path.to_string_lossy().to_string())
    }

    /// Stop recording and return the audio file path
    pub fn stop_recording(&self) -> Result<String> {
        let mut is_recording = self.is_recording.lock().unwrap();
        if !*is_recording {
            return Err(anyhow::anyhow!("Not currently recording"));
        }

        *is_recording = false;
        drop(is_recording);

        // Wait a bit for the recording task to finish writing
        std::thread::sleep(std::time::Duration::from_millis(500));

        let audio_path_guard = self.current_audio_path.lock().unwrap();
        let audio_path = audio_path_guard
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No audio file path"))?
            .clone();

        info!("Stopped audio recording: {:?}", audio_path);
        Ok(audio_path.to_string_lossy().to_string())
    }

    /// Internal task to record audio using cpal
    async fn record_audio_task(
        audio_path: PathBuf,
        is_recording: Arc<Mutex<bool>>,
    ) -> Result<()> {
        use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

        let host = cpal::default_host();
        let device = host
            .default_input_device()
            .ok_or_else(|| anyhow::anyhow!("No input device available"))?;

        let config = device.default_input_config()?;

        info!("Recording config: {:?}", config);

        let spec = WavSpec {
            channels: config.channels(),
            sample_rate: config.sample_rate().0,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let writer = Arc::new(Mutex::new(WavWriter::create(&audio_path, spec)?));
        let writer_clone = Arc::clone(&writer);

        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[f32], _: &_| {
                        let mut writer = writer_clone.lock().unwrap();
                        for &sample in data {
                            let sample_i16 = (sample * i16::MAX as f32) as i16;
                            let _ = writer.write_sample(sample_i16);
                        }
                    },
                    move |err| error!("Audio stream error: {}", err),
                    None,
                )?
            }
            cpal::SampleFormat::I16 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[i16], _: &_| {
                        let mut writer = writer_clone.lock().unwrap();
                        for &sample in data {
                            let _ = writer.write_sample(sample);
                        }
                    },
                    move |err| error!("Audio stream error: {}", err),
                    None,
                )?
            }
            _ => return Err(anyhow::anyhow!("Unsupported sample format")),
        };

        stream.play()?;

        // Keep recording until is_recording becomes false
        loop {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            let still_recording = *is_recording.lock().unwrap();
            if !still_recording {
                break;
            }
        }

        drop(stream);

        // Finalize the WAV file
        let writer_guard = writer.lock().unwrap();
        drop(writer_guard);

        info!("Audio recording saved: {:?}", audio_path);
        Ok(())
    }

    /// Transcribe audio file using Whisper Medium via Ollama
    /// Note: This requires Ollama to support Whisper models in the future
    /// For now, this is a placeholder that will use HTTP API
    pub async fn transcribe_audio(&self, audio_path: String, language: Option<String>) -> Result<String> {
        info!("Transcribing audio: {} (language: {:?})", audio_path, language);

        // Check if file exists
        let path = PathBuf::from(&audio_path);
        if !path.exists() {
            return Err(anyhow::anyhow!("Audio file not found: {}", audio_path));
        }

        // For now, we'll use a placeholder approach
        // In production, this would call Whisper API via Ollama or alternative service
        // Since Ollama doesn't natively support Whisper yet, we have options:
        // 1. Use whisper.cpp directly
        // 2. Use OpenAI-compatible API
        // 3. Wait for Ollama Whisper support

        // Placeholder: Return mock transcription for development
        // TODO: Implement actual Whisper integration
        let transcription = self.call_whisper_api(&path, language.as_deref()).await?;

        Ok(transcription)
    }

    /// Call Whisper API using whisper-cli from Homebrew
    async fn call_whisper_api(&self, audio_path: &PathBuf, language: Option<&str>) -> Result<String> {
        // Resolve user home directory for model path
        let home_dir = dirs::home_dir()
            .ok_or_else(|| anyhow::anyhow!("Could not find home directory"))?;

        let model_path = home_dir.join(".whisper-models/ggml-base.bin");

        // Check if model exists
        if !model_path.exists() {
            return Err(anyhow::anyhow!(
                "Whisper model not found at: {}. Please download it first.",
                model_path.display()
            ));
        }

        info!("Transcribing audio with Whisper: {:?}", audio_path);

        // Use whisper-cli from Homebrew
        let whisper_result = Command::new("/opt/homebrew/bin/whisper-cli")
            .arg("-m").arg(model_path.to_str().unwrap())
            .arg("-f").arg(audio_path.to_str().unwrap())
            .arg("-l").arg(language.unwrap_or("auto"))
            .arg("-np") // Disable progress bar
            .output()
            .await;

        if let Ok(output) = whisper_result {
            if output.status.success() {
                let transcription = String::from_utf8_lossy(&output.stdout).to_string();
                info!("Transcription successful: {}", transcription);

                // Extract just the transcribed text (skip timestamps and metadata)
                let lines: Vec<&str> = transcription.lines()
                    .filter(|line| !line.trim().is_empty() && !line.starts_with('['))
                    .collect();

                return Ok(lines.join(" ").trim().to_string());
            } else {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                error!("Whisper transcription failed: {}", error_msg);
                return Err(anyhow::anyhow!("Whisper transcription failed: {}", error_msg));
            }
        }

        // Fallback error
        Err(anyhow::anyhow!(
            "Whisper CLI not found. Please install whisper-cpp via: brew install whisper-cpp"
        ))
    }

    /// Get recording status
    pub fn is_recording(&self) -> bool {
        *self.is_recording.lock().unwrap()
    }

    /// Clean up old audio files (older than 7 days)
    pub async fn cleanup_old_audio_files(&self) -> Result<usize> {
        let mut cleaned = 0;
        let cutoff = chrono::Utc::now() - chrono::Duration::days(7);

        let entries = std::fs::read_dir(&self.audio_dir)?;
        for entry in entries {
            let entry = entry?;
            let metadata = entry.metadata()?;

            if let Ok(modified) = metadata.modified() {
                let modified_time = chrono::DateTime::<chrono::Utc>::from(modified);
                if modified_time < cutoff {
                    std::fs::remove_file(entry.path())?;
                    cleaned += 1;
                }
            }
        }

        info!("Cleaned up {} old audio files", cleaned);
        Ok(cleaned)
    }
}

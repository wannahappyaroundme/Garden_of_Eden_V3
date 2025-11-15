use anyhow::Result;
use std::sync::{Arc, Mutex};
use tts::Tts;
use log::{info, error};

/// Text-to-Speech Service
/// Handles text-to-speech using system native TTS (macOS AVFoundation / Windows SAPI)
pub struct TtsService {
    tts: Arc<Mutex<Tts>>,
    is_speaking: Arc<Mutex<bool>>,
    current_language: Arc<Mutex<String>>,
}

impl TtsService {
    pub fn new() -> Result<Self> {
        let tts = Tts::default()?;

        info!("TTS Service initialized");

        Ok(Self {
            tts: Arc::new(Mutex::new(tts)),
            is_speaking: Arc::new(Mutex::new(false)),
            current_language: Arc::new(Mutex::new("en".to_string())),
        })
    }

    /// Speak the given text
    pub async fn speak(&self, text: String, language: Option<String>) -> Result<()> {
        let mut is_speaking = self.is_speaking.lock().unwrap();
        if *is_speaking {
            return Err(anyhow::anyhow!("Already speaking"));
        }
        *is_speaking = true;
        drop(is_speaking);

        info!("Speaking: {} (language: {:?})", text, language);

        // Update language if provided
        if let Some(lang) = language {
            let mut current_lang = self.current_language.lock().unwrap();
            *current_lang = lang.clone();
            drop(current_lang);

            // Set voice based on language
            self.set_voice_for_language(&lang)?;
        }

        let tts_clone = Arc::clone(&self.tts);
        let is_speaking_clone = Arc::clone(&self.is_speaking);

        // Spawn speaking task
        tokio::task::spawn_blocking(move || {
            let mut tts = tts_clone.lock().unwrap();

            if let Err(e) = tts.speak(&text, true) {
                error!("TTS speak error: {}", e);
            }

            let mut is_speaking = is_speaking_clone.lock().unwrap();
            *is_speaking = false;
        });

        Ok(())
    }

    /// Stop speaking
    pub async fn stop(&self) -> Result<()> {
        let mut tts = self.tts.lock().unwrap();
        tts.stop()?;

        let mut is_speaking = self.is_speaking.lock().unwrap();
        *is_speaking = false;

        info!("TTS stopped");
        Ok(())
    }

    /// Check if currently speaking
    pub fn is_speaking(&self) -> bool {
        *self.is_speaking.lock().unwrap()
    }

    /// Get available voices
    pub fn get_voices(&self) -> Result<Vec<String>> {
        let tts = self.tts.lock().unwrap();

        match tts.voices() {
            Ok(voices) => {
                let voice_names: Vec<String> = voices
                    .iter()
                    .map(|v| v.name().to_string())
                    .collect();
                Ok(voice_names)
            }
            Err(e) => Err(anyhow::anyhow!("Failed to get voices: {}", e)),
        }
    }

    /// Set voice for a specific language
    fn set_voice_for_language(&self, language: &str) -> Result<()> {
        let mut tts = self.tts.lock().unwrap();

        // Get available voices
        let voices = match tts.voices() {
            Ok(v) => v,
            Err(_) => return Ok(()), // Some platforms don't support voice listing
        };

        // Find appropriate voice for language
        let preferred_voice = match language {
            "ko" | "korean" => {
                // Prefer Korean voices on macOS (Yuna, Sora) or Windows (Korean voices)
                voices.iter().find(|v| {
                    let name = v.name().to_lowercase();
                    name.contains("yuna") ||
                    name.contains("sora") ||
                    name.contains("korean") ||
                    name.contains("ko-")
                })
            }
            "en" | "english" => {
                // Prefer English voices (Samantha on macOS, Microsoft voices on Windows)
                voices.iter().find(|v| {
                    let name = v.name().to_lowercase();
                    name.contains("samantha") ||
                    name.contains("alex") ||
                    name.contains("zira") ||
                    name.contains("david") ||
                    name.contains("en-")
                })
            }
            _ => None,
        };

        if let Some(voice) = preferred_voice {
            info!("Setting TTS voice to: {}", voice.name());
            if let Err(e) = tts.set_voice(voice) {
                error!("Failed to set voice: {}", e);
            }
        }

        Ok(())
    }

    /// Set speaking rate (0.1 to 10.0, 1.0 is normal)
    pub fn set_rate(&self, rate: f32) -> Result<()> {
        let mut tts = self.tts.lock().unwrap();

        match tts.set_rate(rate) {
            Ok(_) => {
                info!("TTS rate set to: {}", rate);
                Ok(())
            }
            Err(e) => Err(anyhow::anyhow!("Failed to set rate: {}", e)),
        }
    }

    /// Set volume (0.0 to 1.0)
    pub fn set_volume(&self, volume: f32) -> Result<()> {
        let mut tts = self.tts.lock().unwrap();

        match tts.set_volume(volume) {
            Ok(_) => {
                info!("TTS volume set to: {}", volume);
                Ok(())
            }
            Err(e) => Err(anyhow::anyhow!("Failed to set volume: {}", e)),
        }
    }

    /// Get current language
    pub fn get_language(&self) -> String {
        self.current_language.lock().unwrap().clone()
    }

    /// Test TTS with a sample message
    pub async fn test_tts(&self, language: &str) -> Result<()> {
        let test_message = match language {
            "ko" | "korean" => "안녕하세요. 음성 출력 테스트입니다.",
            _ => "Hello. This is a text to speech test.",
        };

        self.speak(test_message.to_string(), Some(language.to_string())).await
    }
}

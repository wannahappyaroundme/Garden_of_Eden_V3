/**
 * Production-Level BGE-M3 ONNX Embedding Service
 *
 * BGE-M3 (BAAI General Embedding Model v3) - State-of-the-art multilingual embeddings
 * - Supports 100+ languages including Korean and English
 * - 1024-dimensional dense vectors
 * - Superior semantic understanding and retrieval performance
 * - ONNX Runtime for efficient inference
 * - Model size: ~543MB (quantized INT8 for fast inference)
 */

use anyhow::{anyhow, Result};
use ndarray::{Array2, Axis};
use ort::session::Session;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tokenizers::Tokenizer;
use tracing::{debug, info, warn, instrument};

/// BGE-M3 model configuration
const MODEL_MAX_LENGTH: usize = 512;  // Maximum sequence length
const EMBEDDING_DIM: usize = 1024;    // BGE-M3 output dimension
const POOLING_STRATEGY: PoolingStrategy = PoolingStrategy::Mean;  // Mean pooling

/// Pooling strategies for sentence embeddings
#[derive(Debug, Clone, Copy)]
#[allow(dead_code)]  // Cls and Max reserved for future pooling experiments
enum PoolingStrategy {
    Mean,   // Average of all token embeddings
    Cls,    // Use [CLS] token only
    Max,    // Max pooling
}

/// Production-level embedding service using BGE-M3
pub struct EmbeddingService {
    session: Arc<Mutex<Session>>,
    tokenizer: Arc<Tokenizer>,
}

impl EmbeddingService {
    /// Create new BGE-M3 embedding service
    ///
    /// Downloads model on first run if not present
    #[instrument(name = "embedding_init")]
    pub fn new() -> Result<Self> {
        info!("Initializing BGE-M3 ONNX Embedding Service");

        // Log platform and execution provider info
        #[cfg(target_vendor = "apple")]
        info!(platform = "Apple", arch = std::env::consts::ARCH, "CoreML GPU acceleration available");

        #[cfg(target_os = "windows")]
        info!(platform = "Windows", arch = std::env::consts::ARCH, "DirectML GPU acceleration available (AMD/NVIDIA/Intel)");

        #[cfg(target_os = "linux")]
        info!(platform = "Linux", arch = std::env::consts::ARCH, "CUDA GPU acceleration available (NVIDIA)");

        #[cfg(not(any(target_vendor = "apple", target_os = "windows", target_os = "linux")))]
        info!(platform = std::env::consts::OS, arch = std::env::consts::ARCH, "CPU-only execution");

        // Get model paths
        let model_dir = Self::get_model_dir()?;
        let model_path = model_dir.join("model_quantized.onnx");
        let tokenizer_path = model_dir.join("tokenizer.json");

        // Download model if not present
        if !model_path.exists() || !tokenizer_path.exists() {
            info!("BGE-M3 model not found, downloading (~543MB quantized)...");
            Self::download_model(&model_dir)?;
        }

        // Load tokenizer
        info!("Loading BGE-M3 tokenizer...");
        let tokenizer = Arc::new(
            Tokenizer::from_file(&tokenizer_path)
                .map_err(|e| anyhow!("Failed to load tokenizer: {}", e))?,
        );

        // Load ONNX model with ORT 2.0 API + GPU acceleration
        info!("Loading BGE-M3 ONNX model (quantized INT8) with GPU acceleration...");

        // Try to create session with GPU acceleration, fallback to CPU if unavailable
        // ORT 2.0 API: Use execution provider directly in SessionBuilder
        let session_result = {
            #[cfg(target_vendor = "apple")]
            {
                use ort::execution_providers::{CoreMLExecutionProvider, ExecutionProvider};

                let mut builder = Session::builder()
                    .map_err(|e| anyhow!("Failed to create SessionBuilder: {:?}", e))?;

                // Register CoreML execution provider (Apple Silicon GPU)
                let coreml_ep = CoreMLExecutionProvider::default();
                if let Err(e) = coreml_ep.register(&mut builder) {
                    warn!(error = ?e, "CoreML registration failed, falling back to CPU");
                } else {
                    info!("CoreML execution provider registered (Apple GPU)");
                }

                builder
                    .with_intra_threads(4)
                    .map_err(|e| anyhow!("Failed to set intra_threads: {:?}", e))?
                    .commit_from_file(&model_path)
                    .map_err(|e| anyhow!("Failed to load BGE-M3 model: {:?}", e))
            }
            #[cfg(target_os = "windows")]
            {
                use ort::execution_providers::{DirectMLExecutionProvider, ExecutionProvider};

                let mut builder = Session::builder()
                    .map_err(|e| anyhow!("Failed to create SessionBuilder: {:?}", e))?;

                // Register DirectML execution provider (Windows GPU - AMD/NVIDIA/Intel)
                let directml_ep = DirectMLExecutionProvider::default();
                if let Err(e) = directml_ep.register(&mut builder) {
                    warn!(error = ?e, "DirectML registration failed, falling back to CPU");
                } else {
                    info!("DirectML execution provider registered (Windows GPU)");
                }

                builder
                    .with_intra_threads(4)
                    .map_err(|e| anyhow!("Failed to set intra_threads: {:?}", e))?
                    .commit_from_file(&model_path)
                    .map_err(|e| anyhow!("Failed to load BGE-M3 model: {:?}", e))
            }
            #[cfg(target_os = "linux")]
            {
                use ort::execution_providers::{CUDAExecutionProvider, ExecutionProvider};

                let mut builder = Session::builder()
                    .map_err(|e| anyhow!("Failed to create SessionBuilder: {:?}", e))?;

                // Register CUDA execution provider (NVIDIA GPU on Linux)
                let cuda_ep = CUDAExecutionProvider::default();
                if let Err(e) = cuda_ep.register(&mut builder) {
                    warn!(error = ?e, "CUDA registration failed, falling back to CPU");
                    info!("Make sure CUDA/cuDNN is installed for GPU acceleration");
                } else {
                    info!("CUDA execution provider registered (NVIDIA GPU)");
                }

                builder
                    .with_intra_threads(4)
                    .map_err(|e| anyhow!("Failed to set intra_threads: {:?}", e))?
                    .commit_from_file(&model_path)
                    .map_err(|e| anyhow!("Failed to load BGE-M3 model: {:?}", e))
            }
            #[cfg(not(any(target_vendor = "apple", target_os = "windows", target_os = "linux")))]
            {
                info!("CPU-only execution (no GPU acceleration available)");
                Session::builder()
                    .map_err(|e| anyhow!("Failed to create SessionBuilder: {:?}", e))?
                    .with_intra_threads(4)
                    .map_err(|e| anyhow!("Failed to set intra_threads: {:?}", e))?
                    .commit_from_file(&model_path)
                    .map_err(|e| anyhow!("Failed to load BGE-M3 model: {:?}", e))
            }
        };

        let session = Arc::new(Mutex::new(session_result?));

        info!("BGE-M3 Embedding Service initialized successfully");
        Ok(Self {
            session,
            tokenizer,
        })
    }

    /// Generate embedding for text
    #[instrument(skip(self, text), fields(text_len = text.len()))]
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        debug!("Generating embedding for text: {}", &text[..text.len().min(50)]);

        // Tokenize input
        let encoding = self
            .tokenizer
            .encode(text, true)
            .map_err(|e| anyhow!("Tokenization failed: {}", e))?;

        // Get input IDs and attention mask
        let input_ids = encoding.get_ids();
        let attention_mask = encoding.get_attention_mask();

        // Truncate to max length
        let seq_length = input_ids.len().min(MODEL_MAX_LENGTH);
        let input_ids = &input_ids[..seq_length];
        let attention_mask = &attention_mask[..seq_length];

        // Convert to i64 for ONNX and create tensors
        let input_ids_i64: Vec<i64> = input_ids.iter().map(|&x| x as i64).collect();
        let attention_mask_i64: Vec<i64> = attention_mask.iter().map(|&x| x as i64).collect();

        // Create ORT tensors using tuple format (shape, data)
        let input_ids_tensor = ort::value::Tensor::from_array((vec![1, seq_length], input_ids_i64))
            .map_err(|e| anyhow!("Failed to create input_ids tensor: {:?}", e))?;
        let attention_mask_tensor = ort::value::Tensor::from_array((vec![1, seq_length], attention_mask_i64))
            .map_err(|e| anyhow!("Failed to create attention_mask tensor: {:?}", e))?;

        // Run inference with ORT 2.0 API
        let mut session_guard = self.session.lock().map_err(|e| anyhow!("Lock failed: {}", e))?;
        let outputs = session_guard.run(ort::inputs![input_ids_tensor, attention_mask_tensor])
            .map_err(|e| anyhow!("Model inference failed: {:?}", e))?;

        // Extract output tensor (BGE-M3 outputs last_hidden_state at index 0)
        // Output shape is [batch_size, seq_length, hidden_dim] = [1, seq_length, 1024]
        let output_value = &outputs[0];
        let output_tensor_dyn = output_value.try_extract_array::<f32>()
            .map_err(|e| anyhow!("Failed to extract output tensor: {:?}", e))?;

        // Convert dynamic array to owned Array2 (batch=1, so take first element) [seq_length, 1024]
        let token_embeddings: Array2<f32> = output_tensor_dyn.index_axis(Axis(0), 0)
            .into_dimensionality()
            .map_err(|e| anyhow!("Dimension mismatch: {:?}", e))?
            .to_owned();

        // Apply pooling to get sentence embedding
        let embedding = self.pool_embeddings(&token_embeddings, attention_mask)?;

        // Normalize to unit length
        let normalized = Self::normalize(&embedding);

        debug!(dimensions = normalized.len(), "Embedding generated");
        Ok(normalized)
    }

    /// Pool token embeddings into a single sentence embedding
    /// Input shape: [seq_len, hidden_dim] - each row is a token's embedding
    fn pool_embeddings(
        &self,
        token_embeddings: &Array2<f32>,
        attention_mask: &[u32],
    ) -> Result<Vec<f32>> {
        let seq_len = token_embeddings.nrows();
        let hidden_dim = token_embeddings.ncols();

        match POOLING_STRATEGY {
            PoolingStrategy::Mean => {
                // Mean pooling with attention mask
                let mut pooled = vec![0.0f32; hidden_dim];
                let mut total_weight = 0.0f32;

                for (i, &mask_value) in attention_mask.iter().take(seq_len).enumerate() {
                    if mask_value == 1 {
                        for j in 0..hidden_dim {
                            // token_embeddings[i, j] = i-th token's j-th dimension
                            pooled[j] += token_embeddings[[i, j]];
                        }
                        total_weight += 1.0;
                    }
                }

                if total_weight > 0.0 {
                    for val in &mut pooled {
                        *val /= total_weight;
                    }
                }

                Ok(pooled)
            }
            PoolingStrategy::Cls => {
                // Use [CLS] token embedding (first token row)
                let cls_embedding: Vec<f32> = token_embeddings
                    .index_axis(Axis(0), 0)
                    .to_vec();
                Ok(cls_embedding)
            }
            PoolingStrategy::Max => {
                // Max pooling across all tokens (columns)
                let max_pooled = token_embeddings
                    .axis_iter(Axis(1))
                    .map(|col| {
                        col.iter()
                            .filter_map(|&v| if v.is_finite() { Some(v) } else { None })
                            .fold(f32::NEG_INFINITY, f32::max)
                    })
                    .collect();
                Ok(max_pooled)
            }
        }
    }

    /// Normalize embedding to unit length
    fn normalize(embedding: &[f32]) -> Vec<f32> {
        let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if norm < 1e-10 {
            return embedding.to_vec();
        }
        embedding.iter().map(|x| x / norm).collect()
    }

    /// Calculate cosine similarity between two embeddings
    pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() {
            tracing::error!(a_len = a.len(), b_len = b.len(), "Embedding dimension mismatch");
            return 0.0;
        }

        // For normalized vectors, cosine similarity is just dot product
        a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
    }

    /// Get model directory
    fn get_model_dir() -> Result<PathBuf> {
        let data_dir = dirs::data_dir()
            .ok_or_else(|| anyhow!("Failed to get data directory"))?;
        let model_dir = data_dir.join("garden-of-eden-v3").join("models").join("bge-m3");
        std::fs::create_dir_all(&model_dir)?;
        Ok(model_dir)
    }

    /// Download BGE-M3 model from Hugging Face (Xenova optimized ONNX)
    #[instrument(skip(model_dir))]
    fn download_model(model_dir: &PathBuf) -> Result<()> {
        info!("Downloading BGE-M3 model from Hugging Face...");
        warn!("This is a one-time download (~543MB quantized). Please wait...");

        // URLs for BGE-M3 ONNX model (Xenova/optimum quantized INT8 version)
        const MODEL_URL: &str = "https://huggingface.co/Xenova/bge-m3/resolve/main/onnx/model_quantized.onnx";
        const TOKENIZER_URL: &str = "https://huggingface.co/Xenova/bge-m3/resolve/main/tokenizer.json";

        // Download model (quantized INT8 for faster inference)
        info!("Downloading model_quantized.onnx (~543MB)...");
        let model_bytes = reqwest::blocking::get(MODEL_URL)?
            .bytes()?;
        info!(bytes = model_bytes.len(), mb = model_bytes.len() as f64 / 1024.0 / 1024.0, "Model downloaded");
        std::fs::write(model_dir.join("model_quantized.onnx"), model_bytes)?;

        // Download tokenizer
        info!("Downloading tokenizer.json...");
        let tokenizer_bytes = reqwest::blocking::get(TOKENIZER_URL)?
            .bytes()?;
        info!(bytes = tokenizer_bytes.len(), kb = tokenizer_bytes.len() as f64 / 1024.0, "Tokenizer downloaded");
        std::fs::write(model_dir.join("tokenizer.json"), tokenizer_bytes)?;

        info!("BGE-M3 model downloaded successfully!");
        Ok(())
    }

    /// Batch embed multiple texts (true batch processing for better GPU utilization)
    ///
    /// Processes multiple texts in a single inference call when possible,
    /// falling back to sequential processing if batching fails.
    #[instrument(skip(self, texts), fields(batch_size = texts.len()))]
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        if texts.is_empty() {
            return Ok(vec![]);
        }

        // For single text, use regular embed
        if texts.len() == 1 {
            return Ok(vec![self.embed(texts[0])?]);
        }

        debug!(count = texts.len(), "Batch embedding texts");

        // Try true batch processing first
        match self.embed_batch_internal(texts) {
            Ok(embeddings) => {
                debug!(count = embeddings.len(), "Batch processing succeeded");
                Ok(embeddings)
            }
            Err(e) => {
                warn!(error = ?e, "Batch processing failed, falling back to sequential");
                // Fallback to sequential processing
                texts.iter().map(|text| self.embed(text)).collect()
            }
        }
    }

    /// Internal true batch processing implementation
    fn embed_batch_internal(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        let batch_size = texts.len();

        // Tokenize all texts
        let encodings: Vec<_> = texts
            .iter()
            .map(|text| {
                self.tokenizer
                    .encode(*text, true)
                    .map_err(|e| anyhow!("Tokenization failed: {}", e))
            })
            .collect::<Result<Vec<_>>>()?;

        // Find max sequence length in batch (capped at MODEL_MAX_LENGTH)
        let max_seq_len = encodings
            .iter()
            .map(|enc| enc.get_ids().len().min(MODEL_MAX_LENGTH))
            .max()
            .unwrap_or(0);

        if max_seq_len == 0 {
            return Err(anyhow!("All texts are empty"));
        }

        // Prepare padded batch tensors
        let mut input_ids_batch: Vec<i64> = vec![0; batch_size * max_seq_len];
        let mut attention_mask_batch: Vec<i64> = vec![0; batch_size * max_seq_len];
        let mut actual_lengths: Vec<usize> = Vec::with_capacity(batch_size);

        for (i, encoding) in encodings.iter().enumerate() {
            let ids = encoding.get_ids();
            let mask = encoding.get_attention_mask();
            let seq_len = ids.len().min(MODEL_MAX_LENGTH);
            actual_lengths.push(seq_len);

            // Copy to batch tensor (row-major: batch_idx * max_seq_len + seq_idx)
            for j in 0..seq_len {
                input_ids_batch[i * max_seq_len + j] = ids[j] as i64;
                attention_mask_batch[i * max_seq_len + j] = mask[j] as i64;
            }
            // Remaining positions are already 0 (padding)
        }

        // Create ORT tensors for batch
        let input_ids_tensor = ort::value::Tensor::from_array((vec![batch_size, max_seq_len], input_ids_batch))
            .map_err(|e| anyhow!("Failed to create batch input_ids tensor: {:?}", e))?;
        let attention_mask_tensor = ort::value::Tensor::from_array((vec![batch_size, max_seq_len], attention_mask_batch))
            .map_err(|e| anyhow!("Failed to create batch attention_mask tensor: {:?}", e))?;

        // Run batch inference
        let mut session_guard = self.session.lock().map_err(|e| anyhow!("Lock failed: {}", e))?;
        let outputs = session_guard.run(ort::inputs![input_ids_tensor, attention_mask_tensor])
            .map_err(|e| anyhow!("Batch model inference failed: {:?}", e))?;

        // Extract output tensor [batch_size, max_seq_len, hidden_dim]
        let output_value = &outputs[0];
        let output_tensor_dyn = output_value.try_extract_array::<f32>()
            .map_err(|e| anyhow!("Failed to extract batch output tensor: {:?}", e))?;

        // Convert to ndarray and process each sample in batch
        let output_shape = output_tensor_dyn.shape();
        let hidden_dim = output_shape.get(2).copied().unwrap_or(EMBEDDING_DIM);

        let mut results: Vec<Vec<f32>> = Vec::with_capacity(batch_size);

        for i in 0..batch_size {
            // Extract embeddings for this sample
            let sample_embeddings = output_tensor_dyn.index_axis(ndarray::Axis(0), i);

            // Convert to Array2 for pooling [seq_len, hidden_dim]
            let token_embeddings: Array2<f32> = sample_embeddings
                .into_dimensionality()
                .map_err(|e| anyhow!("Dimension conversion failed: {:?}", e))?
                .to_owned();

            // Create attention mask slice for this sample
            let actual_len = actual_lengths[i];
            let mut attention_mask_slice: Vec<u32> = vec![1; actual_len];
            attention_mask_slice.resize(max_seq_len, 0); // Pad with 0s

            // Apply pooling
            let embedding = self.pool_embeddings(&token_embeddings, &attention_mask_slice)?;

            // Normalize
            let normalized = Self::normalize(&embedding);
            results.push(normalized);
        }

        debug!(count = results.len(), dimensions = hidden_dim, "Batch embedding complete");
        Ok(results)
    }

    /// Calculate semantic similarity between two texts
    pub fn semantic_similarity(&self, text1: &str, text2: &str) -> Result<f32> {
        let emb1 = self.embed(text1)?;
        let emb2 = self.embed(text2)?;
        Ok(Self::cosine_similarity(&emb1, &emb2))
    }
}

/// Fallback keyword-based similarity (if ONNX fails)
pub fn keyword_similarity(text1: &str, text2: &str) -> f32 {
    let text1_lower = text1.to_lowercase();
    let text2_lower = text2.to_lowercase();

    let words1: std::collections::HashSet<_> = text1_lower
        .split_whitespace()
        .filter(|w| w.len() > 2)
        .collect();

    let words2: std::collections::HashSet<_> = text2_lower
        .split_whitespace()
        .filter(|w| w.len() > 2)
        .collect();

    if words1.is_empty() || words2.is_empty() {
        return 0.0;
    }

    let intersection = words1.intersection(&words2).count() as f32;
    let union = words1.union(&words2).count() as f32;

    intersection / union // Jaccard similarity
}

// ============================================================================
// FALLBACK EMBEDDING SERVICE (TF-IDF based, no external dependencies)
// ============================================================================

use std::collections::HashMap;

/// Fallback TF-IDF based embedding service when BGE-M3 fails to load
/// Provides basic semantic similarity without neural networks
pub struct FallbackEmbeddingService {
    /// Dimension of generated pseudo-embeddings (for API compatibility)
    embedding_dim: usize,
}

impl FallbackEmbeddingService {
    /// Create new fallback embedding service
    pub fn new() -> Self {
        warn!("Using fallback TF-IDF embedding service (reduced accuracy)");
        Self {
            embedding_dim: 256, // Smaller dimension for TF-IDF hashes
        }
    }

    /// Generate pseudo-embedding using TF-IDF hashing
    /// Returns a fixed-size vector based on word hashes
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let mut embedding = vec![0.0f32; self.embedding_dim];
        let text_lower = text.to_lowercase();

        // Tokenize and compute word frequencies
        let words: Vec<&str> = text_lower
            .split(|c: char| !c.is_alphanumeric())
            .filter(|w| w.len() > 1)
            .collect();

        if words.is_empty() {
            return Ok(embedding);
        }

        // Compute term frequencies
        let mut term_freq: HashMap<&str, f32> = HashMap::new();
        for word in &words {
            *term_freq.entry(word).or_insert(0.0) += 1.0;
        }

        // Hash each word to embedding dimension and accumulate
        for (word, freq) in term_freq {
            // Use multiple hash functions for better distribution
            let hash1 = Self::hash_word(word, 0) % self.embedding_dim;
            let hash2 = Self::hash_word(word, 1) % self.embedding_dim;
            let hash3 = Self::hash_word(word, 2) % self.embedding_dim;

            // TF-IDF-like weighting (log term frequency)
            let weight = (1.0 + freq.ln()) / (words.len() as f32).sqrt();

            embedding[hash1] += weight;
            embedding[hash2] -= weight * 0.5; // Sign alternation for better separation
            embedding[hash3] += weight * 0.3;
        }

        // Normalize to unit length
        let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if norm > 1e-10 {
            for val in &mut embedding {
                *val /= norm;
            }
        }

        Ok(embedding)
    }

    /// Simple hash function for word to index mapping
    fn hash_word(word: &str, seed: usize) -> usize {
        let mut hash: usize = seed.wrapping_mul(31);
        for byte in word.bytes() {
            hash = hash.wrapping_mul(31).wrapping_add(byte as usize);
        }
        hash
    }

    /// Batch embed multiple texts
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        texts.iter().map(|text| self.embed(text)).collect()
    }

    /// Calculate cosine similarity between two embeddings
    pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() {
            return 0.0;
        }
        a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
    }

    /// Calculate semantic similarity between two texts
    pub fn semantic_similarity(&self, text1: &str, text2: &str) -> Result<f32> {
        let emb1 = self.embed(text1)?;
        let emb2 = self.embed(text2)?;
        Ok(Self::cosine_similarity(&emb1, &emb2))
    }
}

impl Default for FallbackEmbeddingService {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// UNIFIED EMBEDDING SERVICE (wraps either BGE-M3 or Fallback)
// ============================================================================

/// Embedding mode - either full BGE-M3 or fallback TF-IDF
pub enum EmbeddingMode {
    /// Full BGE-M3 neural embeddings (1024 dimensions, high accuracy)
    BgeM3(EmbeddingService),
    /// Fallback TF-IDF hashing (256 dimensions, reduced accuracy)
    Fallback(FallbackEmbeddingService),
}

/// Unified embedding service that gracefully degrades
pub struct UnifiedEmbeddingService {
    mode: EmbeddingMode,
}

impl UnifiedEmbeddingService {
    /// Create new unified embedding service
    /// Tries BGE-M3 first, falls back to TF-IDF if it fails
    #[instrument(name = "unified_embedding_init")]
    pub fn new() -> Self {
        match EmbeddingService::new() {
            Ok(service) => {
                info!("Using BGE-M3 neural embeddings (high accuracy)");
                Self {
                    mode: EmbeddingMode::BgeM3(service),
                }
            }
            Err(e) => {
                tracing::error!(error = %e, "BGE-M3 initialization failed");
                warn!("Falling back to TF-IDF embedding service");
                warn!("RAG accuracy will be reduced, but app remains functional");
                info!("To restore full accuracy, delete the corrupted model:");
                info!("   rm -rf ~/Library/Application\\ Support/garden-of-eden-v3/models/bge-m3");
                info!("   Then restart the app to re-download BGE-M3 (~543MB)");

                Self {
                    mode: EmbeddingMode::Fallback(FallbackEmbeddingService::new()),
                }
            }
        }
    }

    /// Check if using full BGE-M3 or fallback
    pub fn is_full_mode(&self) -> bool {
        matches!(self.mode, EmbeddingMode::BgeM3(_))
    }

    /// Get mode description
    pub fn mode_description(&self) -> &'static str {
        match &self.mode {
            EmbeddingMode::BgeM3(_) => "BGE-M3 Neural Embeddings (1024d)",
            EmbeddingMode::Fallback(_) => "TF-IDF Fallback (256d, reduced accuracy)",
        }
    }

    /// Generate embedding for text
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        match &self.mode {
            EmbeddingMode::BgeM3(service) => service.embed(text),
            EmbeddingMode::Fallback(service) => service.embed(text),
        }
    }

    /// Batch embed multiple texts
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        match &self.mode {
            EmbeddingMode::BgeM3(service) => service.embed_batch(texts),
            EmbeddingMode::Fallback(service) => service.embed_batch(texts),
        }
    }

    /// Calculate cosine similarity between two embeddings
    pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() {
            // Handle dimension mismatch gracefully
            warn!(a_len = a.len(), b_len = b.len(), "Embedding dimension mismatch");
            return keyword_similarity(
                &format!("{:?}", a),
                &format!("{:?}", b),
            );
        }
        a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
    }

    /// Calculate semantic similarity between two texts
    pub fn semantic_similarity(&self, text1: &str, text2: &str) -> Result<f32> {
        let emb1 = self.embed(text1)?;
        let emb2 = self.embed(text2)?;
        Ok(Self::cosine_similarity(&emb1, &emb2))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalization() {
        let vec = vec![3.0, 4.0];
        let normalized = EmbeddingService::normalize(&vec);

        let norm: f32 = normalized.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((norm - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert_eq!(EmbeddingService::cosine_similarity(&a, &b), 1.0);

        let c = vec![0.0, 1.0, 0.0];
        assert_eq!(EmbeddingService::cosine_similarity(&a, &c), 0.0);
    }

    #[test]
    fn test_keyword_similarity() {
        let text1 = "hello world from rust";
        let text2 = "hello world from python";

        let sim = keyword_similarity(text1, text2);
        assert!(sim > 0.5); // Should have decent overlap

        let text3 = "completely different text";
        let sim2 = keyword_similarity(text1, text3);
        assert!(sim2 < 0.3); // Should have low overlap
    }

    #[test]
    #[ignore] // Requires model download
    fn test_embedding_service() {
        let service = EmbeddingService::new().unwrap();

        let text1 = "AI assistant helps with productivity";
        let text2 = "Artificial intelligence boosts efficiency";
        let text3 = "The weather is sunny today";

        let emb1 = service.embed(text1).unwrap();
        let emb2 = service.embed(text2).unwrap();
        let emb3 = service.embed(text3).unwrap();

        // Check dimension
        assert_eq!(emb1.len(), EMBEDDING_DIM);

        // Similar texts should have high similarity
        let sim12 = EmbeddingService::cosine_similarity(&emb1, &emb2);
        let sim13 = EmbeddingService::cosine_similarity(&emb1, &emb3);

        assert!(sim12 > 0.7); // AI-related texts
        assert!(sim13 < 0.5); // Unrelated texts
    }
}

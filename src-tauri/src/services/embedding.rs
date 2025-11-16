use anyhow::Result;
use std::collections::HashMap;

/// Simple TF-IDF based embedding service (placeholder for BGE-M3)
/// This is a temporary solution until ONNX runtime dependencies are resolved
///
/// TODO: Replace with full BGE-M3 ONNX implementation when arrow-arith conflict is fixed
pub struct EmbeddingService {
    // Vocabulary for TF-IDF
    vocab: HashMap<String, usize>,
}

impl EmbeddingService {
    /// Create new simple embedding service
    pub fn new() -> Result<Self> {
        log::info!("Initializing simple TF-IDF embedding service (temporary fallback)");
        log::warn!("Using keyword-based similarity instead of neural embeddings");
        Ok(Self {
            vocab: HashMap::new(),
        })
    }

    /// Generate a simple embedding for text (bag of words + TF-IDF)
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        // Simple keyword extraction and frequency counting
        let words = self.tokenize(text);
        let mut word_freq: HashMap<String, f32> = HashMap::new();

        for word in &words {
            *word_freq.entry(word.clone()).or_insert(0.0) += 1.0;
        }

        // Normalize by document length
        let total = words.len() as f32;
        if total > 0.0 {
            for freq in word_freq.values_mut() {
                *freq /= total;
            }
        }

        // Create a fixed-size vector (128 dimensions for now)
        let mut embedding = vec![0.0; 128];

        for (word, freq) in word_freq {
            let hash = self.hash_word(&word);
            let index = hash % 128;
            embedding[index] += freq;
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

    /// Tokenize text into words (simple whitespace + lowercase)
    fn tokenize(&self, text: &str) -> Vec<String> {
        text.to_lowercase()
            .split_whitespace()
            .filter(|w| w.len() > 2) // Filter short words
            .map(|w| w.to_string())
            .collect()
    }

    /// Simple hash function for words
    fn hash_word(&self, word: &str) -> usize {
        word.bytes().fold(0usize, |acc, b| acc.wrapping_mul(31).wrapping_add(b as usize))
    }

    /// Calculate cosine similarity between two embeddings
    pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() {
            log::error!("Embedding dimension mismatch: {} vs {}", a.len(), b.len());
            return 0.0;
        }

        a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
    }

    /// Calculate keyword overlap similarity (fallback)
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
}

#[cfg(test)]
mod tests {
    use super::*;

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

        let sim = EmbeddingService::keyword_similarity(text1, text2);
        assert!(sim > 0.5); // Should have decent overlap

        let text3 = "completely different text";
        let sim2 = EmbeddingService::keyword_similarity(text1, text3);
        assert!(sim2 < 0.3); // Should have low overlap
    }

    #[test]
    fn test_embedding() {
        let service = EmbeddingService::new().unwrap();
        let embedding = service.embed("hello world").unwrap();

        assert_eq!(embedding.len(), 128);

        // Check normalization
        let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((norm - 1.0).abs() < 0.01);
    }
}

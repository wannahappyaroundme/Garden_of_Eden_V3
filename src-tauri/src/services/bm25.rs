//! BM25 Indexing Service (v3.6.0)
//!
//! TF-IDF based lexical search for hybrid retrieval
//!
//! Algorithm:
//! score(D, Q) = Σ IDF(qi) × (f(qi, D) × (k1 + 1)) / (f(qi, D) + k1 × (1 - b + b × |D| / avgdl))
//!
//! Where:
//! - f(qi, D) = term frequency in document
//! - |D| = document length
//! - avgdl = average document length
//! - IDF(qi) = log((N - df(qi) + 0.5) / (df(qi) + 0.5))
//! - k1 = 1.5 (term frequency saturation)
//! - b = 0.75 (length normalization)

#![allow(dead_code)]  // Phase 13: Hybrid search (LanceDB feature)

use log::{debug, info};
use rusqlite::Connection;
use std::collections::HashMap;
use unicode_segmentation::UnicodeSegmentation;

/// Document representation for BM25 indexing
#[derive(Clone, Debug)]
pub struct Document {
    pub id: String,
    pub content: String,
    pub term_frequencies: HashMap<String, usize>,
    pub length: usize,
}

/// Scored search result
#[derive(Clone, Debug)]
pub struct ScoredDocument {
    pub document_id: String,
    pub score: f32,
    pub content: String,
}

/// BM25 Index with tunable parameters
pub struct BM25Index {
    documents: HashMap<String, Document>,
    idf_scores: HashMap<String, f32>,
    avg_doc_length: f32,
    k1: f32,  // Term frequency saturation (default: 1.5)
    b: f32,   // Length normalization (default: 0.75)
    total_docs: usize,
    document_frequency: HashMap<String, usize>,  // Number of docs containing term
}

impl BM25Index {
    /// Create a new BM25 index with default parameters
    pub fn new() -> Self {
        BM25Index {
            documents: HashMap::new(),
            idf_scores: HashMap::new(),
            avg_doc_length: 0.0,
            k1: 1.5,
            b: 0.75,
            total_docs: 0,
            document_frequency: HashMap::new(),
        }
    }

    /// Create a new BM25 index with custom parameters
    pub fn with_params(k1: f32, b: f32) -> Self {
        BM25Index {
            documents: HashMap::new(),
            idf_scores: HashMap::new(),
            avg_doc_length: 0.0,
            k1,
            b,
            total_docs: 0,
            document_frequency: HashMap::new(),
        }
    }

    /// Tokenize text into terms (lowercase, split by whitespace and punctuation)
    fn tokenize(text: &str) -> Vec<String> {
        text.to_lowercase()
            .unicode_words()
            .map(|s| s.to_string())
            .collect()
    }

    /// Compute term frequencies for a document
    fn compute_term_frequencies(tokens: &[String]) -> HashMap<String, usize> {
        let mut frequencies = HashMap::new();
        for token in tokens {
            *frequencies.entry(token.clone()).or_insert(0) += 1;
        }
        frequencies
    }

    /// Add a document to the index
    pub fn add_document(&mut self, id: String, content: String) {
        let tokens = Self::tokenize(&content);
        let term_frequencies = Self::compute_term_frequencies(&tokens);
        let length = tokens.len();

        // Update document frequency for each unique term
        for term in term_frequencies.keys() {
            *self.document_frequency.entry(term.clone()).or_insert(0) += 1;
        }

        let document = Document {
            id: id.clone(),
            content,
            term_frequencies,
            length,
        };

        self.documents.insert(id, document);
        self.total_docs = self.documents.len();
    }

    /// Build index from episodic memory in database
    pub fn build_from_database(&mut self, conn: &Connection) -> Result<(), String> {
        info!("Building BM25 index from episodic memory");

        let mut stmt = conn
            .prepare(
                "SELECT id, user_input, system_response
                 FROM episodic_memory
                 ORDER BY timestamp DESC",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let episodes = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,  // id
                    row.get::<_, String>(1)?,  // user_input
                    row.get::<_, String>(2)?,  // system_response
                ))
            })
            .map_err(|e| format!("Failed to query episodes: {}", e))?;

        let mut count = 0;
        for episode in episodes {
            let (id, user_input, system_response) = episode
                .map_err(|e| format!("Failed to read episode: {}", e))?;

            // Combine user input and system response for indexing
            let combined_content = format!("{} {}", user_input, system_response);
            self.add_document(id, combined_content);
            count += 1;
        }

        // Compute IDF scores after all documents are added
        self.compute_idf_scores();

        // Compute average document length
        let total_length: usize = self.documents.values().map(|d| d.length).sum();
        self.avg_doc_length = if self.total_docs > 0 {
            total_length as f32 / self.total_docs as f32
        } else {
            0.0
        };

        info!(
            "BM25 index built: {} documents, avg_length: {:.2}, unique_terms: {}",
            count,
            self.avg_doc_length,
            self.idf_scores.len()
        );

        Ok(())
    }

    /// Compute IDF scores for all terms
    fn compute_idf_scores(&mut self) {
        let n = self.total_docs as f32;

        for (term, df) in &self.document_frequency {
            // IDF formula: log((N - df + 0.5) / (df + 0.5))
            let idf = ((n - *df as f32 + 0.5) / (*df as f32 + 0.5)).ln();
            self.idf_scores.insert(term.clone(), idf);
        }
    }

    /// Get IDF score for a term
    fn idf(&self, term: &str) -> f32 {
        *self.idf_scores.get(term).unwrap_or(&0.0)
    }

    /// Compute BM25 score for a document given query terms
    fn compute_score(&self, doc: &Document, query_terms: &[String]) -> f32 {
        let mut score = 0.0;

        for term in query_terms {
            let idf = self.idf(term);
            let tf = *doc.term_frequencies.get(term).unwrap_or(&0) as f32;

            // BM25 formula
            let numerator = tf * (self.k1 + 1.0);
            let denominator = tf
                + self.k1 * (1.0 - self.b + self.b * (doc.length as f32 / self.avg_doc_length));

            score += idf * (numerator / denominator);
        }

        score
    }

    /// Search for documents matching the query
    pub fn search(&self, query: &str, top_k: usize) -> Vec<ScoredDocument> {
        debug!("BM25 search: '{}' (top_k: {})", query, top_k);

        let query_terms = Self::tokenize(query);

        if query_terms.is_empty() {
            return Vec::new();
        }

        // Score all documents
        let mut scored_docs: Vec<ScoredDocument> = self
            .documents
            .values()
            .map(|doc| {
                let score = self.compute_score(doc, &query_terms);
                ScoredDocument {
                    document_id: doc.id.clone(),
                    score,
                    content: doc.content.clone(),
                }
            })
            .filter(|sd| sd.score > 0.0)  // Only include documents with positive scores
            .collect();

        // Sort by score descending
        scored_docs.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // Return top-k results
        scored_docs.truncate(top_k);

        debug!(
            "BM25 search returned {} results (max score: {:.4})",
            scored_docs.len(),
            scored_docs.first().map(|d| d.score).unwrap_or(0.0)
        );

        scored_docs
    }

    /// Get index statistics
    pub fn stats(&self) -> IndexStats {
        IndexStats {
            total_documents: self.total_docs,
            unique_terms: self.idf_scores.len(),
            avg_doc_length: self.avg_doc_length,
            k1: self.k1,
            b: self.b,
        }
    }

    /// Rebuild index (clear and rebuild from database)
    pub fn rebuild(&mut self, conn: &Connection) -> Result<(), String> {
        self.clear();
        self.build_from_database(conn)
    }

    /// Clear the index
    pub fn clear(&mut self) {
        self.documents.clear();
        self.idf_scores.clear();
        self.document_frequency.clear();
        self.total_docs = 0;
        self.avg_doc_length = 0.0;
    }
}

impl Default for BM25Index {
    fn default() -> Self {
        Self::new()
    }
}

/// Index statistics
#[derive(Debug, Clone)]
pub struct IndexStats {
    pub total_documents: usize,
    pub unique_terms: usize,
    pub avg_doc_length: f32,
    pub k1: f32,
    pub b: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenization() {
        let text = "Hello, World! This is a test.";
        let tokens = BM25Index::tokenize(text);
        assert_eq!(tokens, vec!["hello", "world", "this", "is", "a", "test"]);
    }

    #[test]
    fn test_term_frequencies() {
        let tokens = vec![
            "hello".to_string(),
            "world".to_string(),
            "hello".to_string(),
        ];
        let frequencies = BM25Index::compute_term_frequencies(&tokens);
        assert_eq!(frequencies.get("hello"), Some(&2));
        assert_eq!(frequencies.get("world"), Some(&1));
    }

    #[test]
    fn test_bm25_scoring() {
        let mut index = BM25Index::new();

        index.add_document(
            "doc1".to_string(),
            "the quick brown fox jumps over the lazy dog".to_string(),
        );
        index.add_document(
            "doc2".to_string(),
            "the quick brown cat jumps over the lazy cat".to_string(),
        );
        index.add_document("doc3".to_string(), "a completely different document".to_string());

        index.compute_idf_scores();
        index.avg_doc_length = 7.0;

        let results = index.search("quick brown", 3);

        assert!(results.len() >= 2);
        assert!(results[0].score > 0.0);
        // Documents with matching terms should score higher
        assert!(results[0].document_id == "doc1" || results[0].document_id == "doc2");
    }

    #[test]
    fn test_index_stats() {
        let mut index = BM25Index::new();
        index.add_document("doc1".to_string(), "hello world".to_string());
        index.add_document("doc2".to_string(), "goodbye world".to_string());
        index.compute_idf_scores();

        let stats = index.stats();
        assert_eq!(stats.total_documents, 2);
        assert_eq!(stats.k1, 1.5);
        assert_eq!(stats.b, 0.75);
    }
}

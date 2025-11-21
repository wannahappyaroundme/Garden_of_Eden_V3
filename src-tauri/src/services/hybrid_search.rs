/**
 * Hybrid Search Engine (v3.6.0)
 *
 * Combines BM25 lexical search + BGE-M3 semantic search using RRF fusion
 *
 * Pipeline:
 * 1. BM25 search (keyword-based) → top-20 results
 * 2. BGE-M3 search (semantic) → top-20 results
 * 3. RRF (Reciprocal Rank Fusion) → combine scores
 * 4. Return top-K results
 *
 * RRF Formula:
 * RRF_score(d) = Σ 1 / (k + rank(d))
 * where k = 60 (default constant)
 */

use super::bm25::{BM25Index, ScoredDocument as BM25ScoredDocument};
use super::embedding::EmbeddingService;
use super::rag::{RagService, Episode};
use super::reranker::HeuristicReranker;
use log::{debug, info};
use rusqlite::Connection;
use std::collections::HashMap;
use std::sync::Arc;

/// Fusion weights for combining BM25 and semantic search
#[derive(Clone, Debug)]
pub struct FusionWeights {
    pub bm25_weight: f32,
    pub semantic_weight: f32,
}

impl Default for FusionWeights {
    fn default() -> Self {
        FusionWeights {
            bm25_weight: 0.5,
            semantic_weight: 0.5,
        }
    }
}

/// Hybrid search result with combined score
#[derive(Clone, Debug)]
pub struct HybridSearchResult {
    pub episode_id: String,
    pub content: String,
    pub hybrid_score: f32,
    pub bm25_score: f32,
    pub semantic_score: f32,
    pub bm25_rank: Option<usize>,
    pub semantic_rank: Option<usize>,
    pub rerank_score: Option<f32>,  // Optional re-ranking score
}

/// Hybrid Search Engine combining BM25 + BGE-M3
pub struct HybridSearchEngine {
    bm25_index: BM25Index,
    embedding_service: Arc<EmbeddingService>,
    rag_service: Arc<RagService>,
    reranker: HeuristicReranker,  // Re-ranker for improved relevance
    fusion_weights: FusionWeights,
    rrf_k: f32,  // RRF constant (default: 60)
    enable_reranking: bool,  // Toggle re-ranking on/off
}

impl HybridSearchEngine {
    /// Create a new hybrid search engine
    pub fn new(
        embedding_service: Arc<EmbeddingService>,
        rag_service: Arc<RagService>,
    ) -> Self {
        HybridSearchEngine {
            bm25_index: BM25Index::new(),
            embedding_service,
            rag_service,
            reranker: HeuristicReranker::new(),
            fusion_weights: FusionWeights::default(),
            rrf_k: 60.0,
            enable_reranking: true,  // Enable by default
        }
    }

    /// Create with custom fusion weights
    pub fn with_weights(
        embedding_service: Arc<EmbeddingService>,
        rag_service: Arc<RagService>,
        weights: FusionWeights,
    ) -> Self {
        HybridSearchEngine {
            bm25_index: BM25Index::new(),
            embedding_service,
            rag_service,
            reranker: HeuristicReranker::new(),
            fusion_weights: weights,
            rrf_k: 60.0,
            enable_reranking: true,
        }
    }

    /// Build BM25 index from database
    pub fn build_index(&mut self, conn: &Connection) -> Result<(), String> {
        info!("Building BM25 index for hybrid search");
        self.bm25_index.build_from_database(conn)?;
        let stats = self.bm25_index.stats();
        info!(
            "BM25 index ready: {} docs, {} terms",
            stats.total_documents, stats.unique_terms
        );
        Ok(())
    }

    /// Rebuild BM25 index
    pub fn rebuild_index(&mut self, conn: &Connection) -> Result<(), String> {
        info!("Rebuilding BM25 index");
        self.bm25_index.rebuild(conn)
    }

    /// Perform hybrid search with RRF fusion
    pub async fn search(
        &self,
        query: &str,
        top_k: usize,
    ) -> Result<Vec<HybridSearchResult>, String> {
        info!("Hybrid search: '{}' (top_k: {})", query, top_k);

        // Step 1: BM25 lexical search (top-20)
        let bm25_results = self.bm25_index.search(query, 20);
        debug!("BM25 returned {} results", bm25_results.len());

        // Step 2: Semantic search with BGE-M3 (top-20)
        let semantic_episodes = self.rag_service.search_memory(query, 20).await
            .map_err(|e| format!("Semantic search failed: {}", e))?;
        debug!("Semantic search returned {} results", semantic_episodes.len());

        // Step 3: RRF fusion
        let mut hybrid_results = self.rrf_fusion(bm25_results, semantic_episodes);
        debug!("RRF fusion produced {} results", hybrid_results.len());

        // Step 4: Optional re-ranking
        if self.enable_reranking && !hybrid_results.is_empty() {
            debug!("Applying re-ranking to top {} results", hybrid_results.len().min(20));

            // Prepare results for re-ranking
            let results_for_reranking: Vec<(String, String, f32)> = hybrid_results
                .iter()
                .take(20)  // Re-rank top 20
                .map(|r| (r.episode_id.clone(), r.content.clone(), r.hybrid_score))
                .collect();

            // Apply re-ranking
            let reranked = self.reranker.rerank(query, results_for_reranking, top_k);

            // Update hybrid results with re-ranking scores
            hybrid_results = reranked.into_iter().map(|r| HybridSearchResult {
                episode_id: r.document_id,
                content: r.content,
                hybrid_score: r.cross_encoder_score,
                bm25_score: r.original_score,
                semantic_score: r.original_score,
                bm25_rank: None,
                semantic_rank: None,
                rerank_score: Some(r.cross_encoder_score),
            }).collect();

            debug!("Re-ranking complete");
        } else {
            // No re-ranking, just truncate
            hybrid_results.truncate(top_k);
        }

        info!(
            "Hybrid search complete: {} results (max score: {:.4})",
            hybrid_results.len(),
            hybrid_results.first().map(|r| r.hybrid_score).unwrap_or(0.0)
        );

        Ok(hybrid_results)
    }

    /// RRF (Reciprocal Rank Fusion) score combination
    fn rrf_fusion(
        &self,
        bm25_results: Vec<BM25ScoredDocument>,
        semantic_results: Vec<Episode>,
    ) -> Vec<HybridSearchResult> {
        // Build rank maps
        let bm25_ranks: HashMap<String, (usize, f32)> = bm25_results
            .iter()
            .enumerate()
            .map(|(rank, doc)| (doc.document_id.clone(), (rank + 1, doc.score)))
            .collect();

        // For semantic results, we use position as the rank (first result = rank 1)
        // and importance as a proxy for score
        let semantic_ranks: HashMap<String, (usize, f32)> = semantic_results
            .iter()
            .enumerate()
            .map(|(rank, episode)| {
                (episode.id.clone(), (rank + 1, episode.importance as f32))
            })
            .collect();

        // Collect all unique document IDs
        let mut all_doc_ids: Vec<String> = bm25_ranks.keys().cloned().collect();
        for id in semantic_ranks.keys() {
            if !all_doc_ids.contains(id) {
                all_doc_ids.push(id.clone());
            }
        }

        // Compute RRF scores
        let mut results: Vec<HybridSearchResult> = all_doc_ids
            .into_iter()
            .map(|doc_id| {
                // RRF score: sum of 1/(k + rank) for each retriever
                let bm25_rrf = if let Some((rank, _)) = bm25_ranks.get(&doc_id) {
                    1.0 / (self.rrf_k + *rank as f32)
                } else {
                    0.0
                };

                let semantic_rrf = if let Some((rank, _)) = semantic_ranks.get(&doc_id) {
                    1.0 / (self.rrf_k + *rank as f32)
                } else {
                    0.0
                };

                // Weighted RRF score
                let hybrid_score = bm25_rrf * self.fusion_weights.bm25_weight
                    + semantic_rrf * self.fusion_weights.semantic_weight;

                // Get original scores for debugging
                let bm25_score = bm25_ranks.get(&doc_id).map(|(_, score)| *score).unwrap_or(0.0);
                let semantic_score = semantic_ranks
                    .get(&doc_id)
                    .map(|(_, score)| *score)
                    .unwrap_or(0.0);

                // Get content (prefer BM25 content as it has both user_input + system_response)
                let content = bm25_results
                    .iter()
                    .find(|r| r.document_id == doc_id)
                    .map(|r| r.content.clone())
                    .unwrap_or_default();

                HybridSearchResult {
                    episode_id: doc_id.clone(),
                    content,
                    hybrid_score,
                    bm25_score,
                    semantic_score,
                    bm25_rank: bm25_ranks.get(&doc_id).map(|(rank, _)| *rank),
                    semantic_rank: semantic_ranks.get(&doc_id).map(|(rank, _)| *rank),
                    rerank_score: None,  // Will be filled in by re-ranking if enabled
                }
            })
            .collect();

        // Sort by hybrid score descending
        results.sort_by(|a, b| {
            b.hybrid_score
                .partial_cmp(&a.hybrid_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        results
    }

    /// Update fusion weights
    pub fn set_fusion_weights(&mut self, weights: FusionWeights) {
        info!(
            "Updating fusion weights: BM25={:.2}, Semantic={:.2}",
            weights.bm25_weight, weights.semantic_weight
        );
        self.fusion_weights = weights;
    }

    /// Update RRF constant
    pub fn set_rrf_k(&mut self, k: f32) {
        info!("Updating RRF constant k: {:.1}", k);
        self.rrf_k = k;
    }

    /// Enable or disable re-ranking
    pub fn set_reranking_enabled(&mut self, enabled: bool) {
        info!("Re-ranking: {}", if enabled { "enabled" } else { "disabled" });
        self.enable_reranking = enabled;
    }

    /// Check if re-ranking is enabled
    pub fn is_reranking_enabled(&self) -> bool {
        self.enable_reranking
    }

    /// Get search engine statistics
    pub fn stats(&self) -> HybridSearchStats {
        let bm25_stats = self.bm25_index.stats();
        HybridSearchStats {
            bm25_documents: bm25_stats.total_documents,
            bm25_terms: bm25_stats.unique_terms,
            fusion_weights: self.fusion_weights.clone(),
            rrf_k: self.rrf_k,
            reranking_enabled: self.enable_reranking,
        }
    }
}

/// Hybrid search statistics
#[derive(Debug, Clone)]
pub struct HybridSearchStats {
    pub bm25_documents: usize,
    pub bm25_terms: usize,
    pub fusion_weights: FusionWeights,
    pub rrf_k: f32,
    pub reranking_enabled: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rrf_score_calculation() {
        // RRF with k=60
        // Document at rank 1: 1/(60+1) ≈ 0.0164
        // Document at rank 2: 1/(60+2) ≈ 0.0161
        let k = 60.0;
        let score_rank1 = 1.0 / (k + 1.0);
        let score_rank2 = 1.0 / (k + 2.0);

        assert!((score_rank1 - 0.0164).abs() < 0.001);
        assert!((score_rank2 - 0.0161).abs() < 0.001);
        assert!(score_rank1 > score_rank2);
    }

    #[test]
    fn test_fusion_weights() {
        let weights = FusionWeights {
            bm25_weight: 0.7,
            semantic_weight: 0.3,
        };

        let bm25_rrf = 0.0164;
        let semantic_rrf = 0.0161;

        let hybrid = bm25_rrf * weights.bm25_weight + semantic_rrf * weights.semantic_weight;

        // Should favor BM25 more heavily
        assert!((hybrid - 0.0163).abs() < 0.001);
    }

    #[test]
    fn test_default_fusion_weights() {
        let weights = FusionWeights::default();
        assert_eq!(weights.bm25_weight, 0.5);
        assert_eq!(weights.semantic_weight, 0.5);
    }
}

/**
 * Embedding Service
 * Uses BGE-M3 model for text embeddings and cosine similarity search
 */

import path from 'path';
import { app } from 'electron';
import log from 'electron-log';
import { getLlama, LlamaModel, LlamaContext, LlamaEmbedding } from 'node-llama-cpp';

export interface EmbeddingVector {
  values: number[];
  dimensions: number;
}

export interface SimilarityResult {
  index: number;
  score: number;
  text: string;
  metadata?: Record<string, any>;
}

/**
 * Embedding Service using BGE-M3
 */
export class EmbeddingService {
  private model: LlamaModel | null = null;
  private context: LlamaContext | null = null;
  private isInitialized = false;
  private modelPath: string;

  constructor() {
    const modelsDir = path.join(app.getPath('userData'), 'models');
    this.modelPath = path.join(modelsDir, 'bge-m3-q4_k_m.gguf');
  }

  /**
   * Initialize the BGE-M3 model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.info('Embedding service already initialized');
      return;
    }

    try {
      log.info('Initializing BGE-M3 embedding model...');

      const llama = await getLlama();

      // Load BGE-M3 model
      this.model = await llama.loadModel({
        modelPath: this.modelPath,
        gpuLayers: 33, // Use GPU acceleration
      });

      // Create context for embeddings
      this.context = await this.model.createContext({
        sequences: 1,
        contextSize: 512, // BGE-M3 supports up to 8192, but 512 is efficient
      });

      this.isInitialized = true;
      log.info('BGE-M3 embedding model initialized successfully');
    } catch (error) {
      log.error('Failed to initialize BGE-M3 model:', error);
      throw new Error(`Failed to initialize embedding model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if the model is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.model !== null && this.context !== null;
  }

  /**
   * Generate embedding vector for text
   */
  async embed(text: string): Promise<EmbeddingVector> {
    if (!this.isReady()) {
      await this.initialize();
    }

    if (!this.context) {
      throw new Error('Embedding context not initialized');
    }

    try {
      log.debug(`Generating embedding for text: "${text.substring(0, 50)}..."`);

      // Normalize text
      const normalizedText = this.normalizeText(text);

      // Generate embedding
      const embedding: LlamaEmbedding = await this.context.getEmbedding(normalizedText);

      // Convert to number array
      const values = Array.from(embedding.vector);

      const result: EmbeddingVector = {
        values,
        dimensions: values.length,
      };

      log.debug(`Generated embedding with ${result.dimensions} dimensions`);
      return result;
    } catch (error) {
      log.error('Failed to generate embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[]): Promise<EmbeddingVector[]> {
    log.info(`Generating embeddings for ${texts.length} texts`);

    const embeddings: EmbeddingVector[] = [];

    for (const text of texts) {
      const embedding = await this.embed(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   */
  cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
    if (a.dimensions !== b.dimensions) {
      throw new Error(`Dimension mismatch: ${a.dimensions} vs ${b.dimensions}`);
    }

    // Calculate dot product
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.dimensions; i++) {
      dotProduct += a.values[i] * b.values[i];
      magnitudeA += a.values[i] * a.values[i];
      magnitudeB += b.values[i] * b.values[i];
    }

    // Calculate cosine similarity
    const similarity = dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));

    return similarity;
  }

  /**
   * Find most similar texts using cosine similarity
   */
  async findSimilar(
    query: string,
    documents: Array<{ text: string; metadata?: Record<string, any> }>,
    options: {
      topK?: number;
      minSimilarity?: number;
    } = {}
  ): Promise<SimilarityResult[]> {
    const { topK = 5, minSimilarity = 0.5 } = options;

    log.info(`Finding similar documents for query: "${query.substring(0, 50)}..."`);

    // Generate query embedding
    const queryEmbedding = await this.embed(query);

    // Generate embeddings for all documents
    const documentEmbeddings = await this.embedBatch(documents.map(d => d.text));

    // Calculate similarities
    const results: SimilarityResult[] = documents.map((doc, index) => ({
      index,
      score: this.cosineSimilarity(queryEmbedding, documentEmbeddings[index]),
      text: doc.text,
      metadata: doc.metadata,
    }));

    // Filter by minimum similarity
    const filtered = results.filter(r => r.score >= minSimilarity);

    // Sort by similarity score (descending)
    filtered.sort((a, b) => b.score - a.score);

    // Return top K results
    return filtered.slice(0, topK);
  }

  /**
   * Normalize text for embedding
   */
  private normalizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 8192); // BGE-M3 max length
  }

  /**
   * Calculate vector magnitude (L2 norm)
   */
  private magnitude(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  /**
   * Normalize a vector to unit length
   */
  normalizeVector(vector: EmbeddingVector): EmbeddingVector {
    const mag = this.magnitude(vector.values);

    if (mag === 0) {
      return vector;
    }

    return {
      values: vector.values.map(v => v / mag),
      dimensions: vector.dimensions,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.dispose();
        this.context = null;
      }

      if (this.model) {
        await this.model.dispose();
        this.model = null;
      }

      this.isInitialized = false;
      log.info('Embedding service cleaned up');
    } catch (error) {
      log.error('Error cleaning up embedding service:', error);
    }
  }

  /**
   * Get model info
   */
  getModelInfo(): { path: string; isLoaded: boolean; dimensions: number } {
    return {
      path: this.modelPath,
      isLoaded: this.isReady(),
      dimensions: 1024, // BGE-M3 produces 1024-dimensional embeddings
    };
  }
}

// Singleton instance
let embeddingServiceInstance: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingServiceInstance) {
    embeddingServiceInstance = new EmbeddingService();
  }
  return embeddingServiceInstance;
}

export async function cleanupEmbeddingService(): Promise<void> {
  if (embeddingServiceInstance) {
    await embeddingServiceInstance.cleanup();
    embeddingServiceInstance = null;
  }
}

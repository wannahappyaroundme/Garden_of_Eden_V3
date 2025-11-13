/**
 * Embedding Service
 * Uses BGE-M3 model for text embeddings and cosine similarity search
 */

import path from 'path';
import { app } from 'electron';
import log from 'electron-log';
import { getLlama, LlamaModel, LlamaContext, LlamaEmbedding } from 'node-llama-cpp';
import { getChunkingService, type TextChunk } from './chunking.service';

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

export interface ChunkedEmbedding {
  chunks: TextChunk[];
  embeddings: EmbeddingVector[];
  aggregated: EmbeddingVector; // Averaged or max-pooled embedding
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

      // Generate embedding using LlamaContext
      // Note: This is a placeholder - actual API may differ
      // For now, return a mock embedding until we test with actual model
      const mockEmbedding = new Array(1024).fill(0).map(() => Math.random());
      const values = mockEmbedding;

      // TODO: Replace with actual embedding generation when BGE-M3 model is loaded
      // const embeddingResult = await this.context.encode(normalizedText);
      // const values = Array.from(embeddingResult);

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
   * Embed long text with chunking (for texts > 512 tokens)
   */
  async embedLongText(text: string, strategy: 'average' | 'maxpool' | 'first' = 'average'): Promise<ChunkedEmbedding> {
    const chunkingService = getChunkingService();

    // Check if chunking is needed
    if (!chunkingService.needsChunking(text, 512)) {
      const embedding = await this.embed(text);
      return {
        chunks: [
          {
            text,
            index: 0,
            startChar: 0,
            endChar: text.length,
          },
        ],
        embeddings: [embedding],
        aggregated: embedding,
      };
    }

    log.info(`Text requires chunking (length: ${text.length})`);

    // Chunk the text
    const chunks = await chunkingService.chunk(text, {
      maxTokens: 512,
      overlap: 50,
      strategy: 'semantic',
      preserveSentences: true,
    });

    log.info(`Created ${chunks.length} chunks`);

    // Generate embeddings for each chunk
    const embeddings: EmbeddingVector[] = [];
    for (const chunk of chunks) {
      const embedding = await this.embed(chunk.text);
      embeddings.push(embedding);
    }

    // Aggregate embeddings
    const aggregated = this.aggregateEmbeddings(embeddings, strategy);

    return {
      chunks,
      embeddings,
      aggregated,
    };
  }

  /**
   * Aggregate multiple embeddings into one
   */
  private aggregateEmbeddings(
    embeddings: EmbeddingVector[],
    strategy: 'average' | 'maxpool' | 'first'
  ): EmbeddingVector {
    if (embeddings.length === 0) {
      throw new Error('Cannot aggregate empty embeddings');
    }

    if (strategy === 'first' || embeddings.length === 1) {
      return embeddings[0];
    }

    const dimensions = embeddings[0].dimensions;
    const aggregated = new Array(dimensions).fill(0);

    if (strategy === 'average') {
      // Average pooling
      for (const embedding of embeddings) {
        for (let i = 0; i < dimensions; i++) {
          aggregated[i] += embedding.values[i];
        }
      }

      for (let i = 0; i < dimensions; i++) {
        aggregated[i] /= embeddings.length;
      }
    } else if (strategy === 'maxpool') {
      // Max pooling
      for (let i = 0; i < dimensions; i++) {
        aggregated[i] = Math.max(...embeddings.map((e) => e.values[i]));
      }
    }

    return {
      values: aggregated,
      dimensions,
    };
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

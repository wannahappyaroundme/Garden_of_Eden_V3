/**
 * Text Chunking Service
 * Intelligently splits long texts for BGE-M3 embedding (8192 token limit)
 */

import log from 'electron-log';

export interface TextChunk {
  text: string;
  index: number;
  startChar: number;
  endChar: number;
  metadata?: Record<string, any>;
}

export interface ChunkingOptions {
  maxTokens?: number; // Max tokens per chunk (default: 512 for efficiency)
  overlap?: number; // Overlap between chunks in tokens (default: 50)
  strategy?: 'fixed' | 'semantic' | 'recursive'; // Chunking strategy
  preserveSentences?: boolean; // Try to preserve sentence boundaries
  minChunkSize?: number; // Minimum chunk size in tokens
}

/**
 * Text Chunking Service for BGE-M3 optimization
 */
export class ChunkingService {
  private readonly CHARS_PER_TOKEN = 4; // Rough estimate: 1 token ≈ 4 characters
  private readonly BGE_M3_MAX_TOKENS = 8192;
  private readonly DEFAULT_CHUNK_SIZE = 512; // Optimal for speed/quality balance

  /**
   * Estimate token count from text
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Check if text needs chunking
   */
  needsChunking(text: string, maxTokens: number = this.DEFAULT_CHUNK_SIZE): boolean {
    const tokens = this.estimateTokens(text);
    return tokens > maxTokens;
  }

  /**
   * Split text into chunks
   */
  async chunk(text: string, options: ChunkingOptions = {}): Promise<TextChunk[]> {
    const {
      maxTokens = this.DEFAULT_CHUNK_SIZE,
      overlap = 50,
      strategy = 'semantic',
      preserveSentences = true,
      minChunkSize = 100,
    } = options;

    // Validate max tokens
    if (maxTokens > this.BGE_M3_MAX_TOKENS) {
      log.warn(`maxTokens (${maxTokens}) exceeds BGE-M3 limit (${this.BGE_M3_MAX_TOKENS}), capping to limit`);
    }

    const effectiveMaxTokens = Math.min(maxTokens, this.BGE_M3_MAX_TOKENS);

    // Check if chunking is needed
    if (!this.needsChunking(text, effectiveMaxTokens)) {
      return [
        {
          text,
          index: 0,
          startChar: 0,
          endChar: text.length,
        },
      ];
    }

    // Choose chunking strategy
    switch (strategy) {
      case 'fixed':
        return this.fixedSizeChunking(text, effectiveMaxTokens, overlap);
      case 'semantic':
        return this.semanticChunking(text, effectiveMaxTokens, overlap, preserveSentences);
      case 'recursive':
        return this.recursiveChunking(text, effectiveMaxTokens, overlap, minChunkSize);
      default:
        return this.semanticChunking(text, effectiveMaxTokens, overlap, preserveSentences);
    }
  }

  /**
   * Fixed-size chunking (simple, fast)
   */
  private fixedSizeChunking(text: string, maxTokens: number, overlap: number): TextChunk[] {
    const chunks: TextChunk[] = [];
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    const overlapChars = overlap * this.CHARS_PER_TOKEN;
    const step = maxChars - overlapChars;

    let index = 0;
    for (let i = 0; i < text.length; i += step) {
      const end = Math.min(i + maxChars, text.length);
      chunks.push({
        text: text.substring(i, end),
        index: index++,
        startChar: i,
        endChar: end,
      });

      if (end >= text.length) break;
    }

    log.debug(`Fixed chunking: ${text.length} chars → ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Semantic chunking (preserves sentences and paragraphs)
   */
  private semanticChunking(
    text: string,
    maxTokens: number,
    overlap: number,
    preserveSentences: boolean
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    const overlapChars = overlap * this.CHARS_PER_TOKEN;

    // Split into sentences
    const sentences = preserveSentences ? this.splitIntoSentences(text) : [text];

    let currentChunk = '';
    let currentStartChar = 0;
    let index = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const potentialChunk = currentChunk + sentence;

      // Check if adding this sentence exceeds max tokens
      if (this.estimateTokens(potentialChunk) > maxTokens && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          index: index++,
          startChar: currentStartChar,
          endChar: currentStartChar + currentChunk.length,
        });

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, overlapChars);
        currentStartChar = currentStartChar + currentChunk.length - overlapText.length;
        currentChunk = overlapText + sentence;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        index: index++,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
      });
    }

    log.debug(`Semantic chunking: ${text.length} chars → ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Recursive chunking (hierarchical, best for very long documents)
   */
  private recursiveChunking(
    text: string,
    maxTokens: number,
    overlap: number,
    minChunkSize: number
  ): TextChunk[] {
    const chunks: TextChunk[] = [];

    // Level 1: Split by paragraphs
    const paragraphs = text.split(/\n\n+/);

    let currentChunk = '';
    let currentStartChar = 0;
    let index = 0;

    for (const paragraph of paragraphs) {
      const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;

      if (this.estimateTokens(potentialChunk) > maxTokens) {
        // Save current chunk if it's not empty
        if (currentChunk.length >= minChunkSize * this.CHARS_PER_TOKEN) {
          chunks.push({
            text: currentChunk.trim(),
            index: index++,
            startChar: currentStartChar,
            endChar: currentStartChar + currentChunk.length,
          });

          currentStartChar += currentChunk.length;
          currentChunk = '';
        }

        // If single paragraph is too large, chunk it semantically
        if (this.estimateTokens(paragraph) > maxTokens) {
          const subChunks = this.semanticChunking(paragraph, maxTokens, overlap, true);
          for (const subChunk of subChunks) {
            chunks.push({
              ...subChunk,
              index: index++,
              startChar: currentStartChar + subChunk.startChar,
              endChar: currentStartChar + subChunk.endChar,
            });
          }
          currentStartChar += paragraph.length;
        } else {
          currentChunk = paragraph;
        }
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add final chunk
    if (currentChunk.trim().length >= minChunkSize * this.CHARS_PER_TOKEN) {
      chunks.push({
        text: currentChunk.trim(),
        index: index++,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
      });
    }

    log.debug(`Recursive chunking: ${text.length} chars → ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence boundaries (., !, ?, Korean period)
    return text.split(/([.!?。]+\s+)/).reduce((sentences: string[], part, i, arr) => {
      if (i % 2 === 0) {
        const sentence = part + (arr[i + 1] || '');
        if (sentence.trim()) {
          sentences.push(sentence);
        }
      }
      return sentences;
    }, []);
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlapText(text: string, overlapChars: number): string {
    if (text.length <= overlapChars) return text;

    // Try to start overlap at sentence boundary
    const overlap = text.substring(text.length - overlapChars);
    const sentenceMatch = overlap.match(/[.!?。]\s+/);

    if (sentenceMatch && sentenceMatch.index !== undefined) {
      return overlap.substring(sentenceMatch.index + sentenceMatch[0].length);
    }

    return overlap;
  }

  /**
   * Merge chunks back into single text (useful for reconstruction)
   */
  mergeChunks(chunks: TextChunk[]): string {
    return chunks.map((c) => c.text).join('\n\n');
  }

  /**
   * Get chunk statistics
   */
  getChunkStats(chunks: TextChunk[]): {
    totalChunks: number;
    avgChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
    totalTokens: number;
  } {
    const sizes = chunks.map((c) => this.estimateTokens(c.text));

    return {
      totalChunks: chunks.length,
      avgChunkSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
      minChunkSize: Math.min(...sizes),
      maxChunkSize: Math.max(...sizes),
      totalTokens: sizes.reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Create chunks with metadata (useful for document tracking)
   */
  async chunkWithMetadata(
    text: string,
    metadata: Record<string, any>,
    options: ChunkingOptions = {}
  ): Promise<TextChunk[]> {
    const chunks = await this.chunk(text, options);

    return chunks.map((chunk) => ({
      ...chunk,
      metadata: {
        ...metadata,
        chunkIndex: chunk.index,
        totalChunks: chunks.length,
      },
    }));
  }
}

// Singleton instance
let chunkingServiceInstance: ChunkingService | null = null;

export function getChunkingService(): ChunkingService {
  if (!chunkingServiceInstance) {
    chunkingServiceInstance = new ChunkingService();
  }
  return chunkingServiceInstance;
}

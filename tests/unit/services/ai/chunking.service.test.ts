/**
 * Chunking Service Tests
 */

import { ChunkingService } from '../../../../src/main/services/ai/chunking.service';

describe('ChunkingService', () => {
  let chunkingService: ChunkingService;

  beforeEach(() => {
    chunkingService = new ChunkingService();
  });

  describe('needsChunking', () => {
    it('should return false for short text', () => {
      const shortText = 'This is a short text.';
      expect(chunkingService.needsChunking(shortText, 512)).toBe(false);
    });

    it('should return true for long text', () => {
      const longText = 'word '.repeat(2000); // ~2000 words ≈ 500+ tokens
      expect(chunkingService.needsChunking(longText, 512)).toBe(true);
    });
  });

  describe('fixed size chunking', () => {
    it('should split text into fixed-size chunks', async () => {
      const longText = 'word '.repeat(2000);

      const chunks = await chunkingService.chunk(longText, {
        strategy: 'fixed',
        maxTokens: 512,
        overlap: 50,
      });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].index).toBe(0);
      expect(chunks[1].index).toBe(1);
    });
  });

  describe('semantic chunking', () => {
    it('should preserve sentence boundaries', async () => {
      const text =
        'This is the first sentence. This is the second sentence. This is the third sentence. '.repeat(
          50
        );

      const chunks = await chunkingService.chunk(text, {
        strategy: 'semantic',
        maxTokens: 512,
        overlap: 50,
        preserveSentences: true,
      });

      for (const chunk of chunks) {
        // Each chunk should end with a period (sentence boundary)
        expect(chunk.text.trim()).toMatch(/[.!?]$/);
      }
    });
  });

  describe('recursive chunking', () => {
    it('should handle paragraphs hierarchically', async () => {
      const text = [
        'First paragraph. ' + 'sentence '.repeat(100),
        'Second paragraph. ' + 'sentence '.repeat(100),
        'Third paragraph. ' + 'sentence '.repeat(100),
      ].join('\n\n');

      const chunks = await chunkingService.chunk(text, {
        strategy: 'recursive',
        maxTokens: 512,
        overlap: 50,
        minChunkSize: 100,
      });

      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('chunk statistics', () => {
    it('should calculate correct statistics', async () => {
      const text = 'word '.repeat(2000);

      const chunks = await chunkingService.chunk(text, {
        maxTokens: 512,
        overlap: 50,
      });

      const stats = chunkingService.getChunkStats(chunks);

      expect(stats.totalChunks).toBe(chunks.length);
      expect(stats.avgChunkSize).toBeGreaterThan(0);
      expect(stats.maxChunkSize).toBeGreaterThanOrEqual(stats.minChunkSize);
    });
  });

  describe('chunkWithMetadata', () => {
    it('should preserve metadata in chunks', async () => {
      const text = 'word '.repeat(2000);
      const metadata = { source: 'test', author: 'tester' };

      const chunks = await chunkingService.chunkWithMetadata(text, metadata, {
        maxTokens: 512,
      });

      for (const chunk of chunks) {
        expect(chunk.metadata).toBeDefined();
        expect(chunk.metadata?.source).toBe('test');
        expect(chunk.metadata?.author).toBe('tester');
        expect(chunk.metadata?.chunkIndex).toBeDefined();
        expect(chunk.metadata?.totalChunks).toBe(chunks.length);
      }
    });
  });

  describe('Korean text handling', () => {
    it('should properly chunk Korean text', async () => {
      const koreanText =
        '이것은 한국어 문장입니다. '.repeat(500) + '여러 문장을 포함하고 있습니다. '.repeat(500);

      const chunks = await chunkingService.chunk(koreanText, {
        strategy: 'semantic',
        maxTokens: 512,
        preserveSentences: true,
      });

      expect(chunks.length).toBeGreaterThan(1);

      for (const chunk of chunks) {
        expect(chunk.text).toContain('.');
      }
    });
  });

  describe('merge chunks', () => {
    it('should reconstruct text from chunks', async () => {
      const originalText = 'word '.repeat(100);

      const chunks = await chunkingService.chunk(originalText, {
        maxTokens: 512,
        overlap: 0, // No overlap for exact reconstruction
      });

      const merged = chunkingService.mergeChunks(chunks);

      // Should contain similar content (may have whitespace differences)
      expect(merged.replace(/\s+/g, ' ')).toContain(originalText.substring(0, 100));
    });
  });
});

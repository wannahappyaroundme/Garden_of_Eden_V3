/**
 * Synthetic Data Service Tests
 */

import { SyntheticDataService } from '../../../../src/main/services/ai/synthetic-data.service';
import type { ConversationEpisode } from '../../../../src/shared/types/memory.types';

describe('SyntheticDataService', () => {
  let syntheticService: SyntheticDataService;
  let sampleEpisode: ConversationEpisode;

  beforeEach(() => {
    syntheticService = new SyntheticDataService();

    sampleEpisode = {
      id: 'episode-1',
      conversationId: 'conv-1',
      timestamp: new Date(),
      userMessage: 'Python으로 피보나치 함수를 작성해줘',
      edenResponse:
        'def fibonacci(n):\n  if n <= 1:\n    return n\n  return fibonacci(n-1) + fibonacci(n-2)',
      context: {
        filesAccessed: ['fibonacci.py'],
        codeGenerated: {
          language: 'python',
          snippet: 'fibonacci function',
        },
      },
    };
  });

  describe('generateSyntheticQueries', () => {
    it('should generate multiple paraphrased queries', () => {
      const queries = syntheticService.generateSyntheticQueries(sampleEpisode, 5);

      expect(queries.length).toBe(5);

      for (const query of queries) {
        expect(query.query).toBeDefined();
        expect(query.expectedAnswer).toBe(sampleEpisode.edenResponse);
        expect(query.difficulty).toMatch(/easy|medium|hard/);
        expect(query.category).toBeDefined();
      }
    });

    it('should create queries with different difficulties', () => {
      const queries = syntheticService.generateSyntheticQueries(sampleEpisode, 5);

      const difficulties = queries.map((q) => q.difficulty);
      const uniqueDifficulties = new Set(difficulties);

      // Should have at least 2 different difficulty levels
      expect(uniqueDifficulties.size).toBeGreaterThan(1);
    });
  });

  describe('generateNegativeSamples', () => {
    it('should generate queries that should NOT match', () => {
      const negative = syntheticService.generateNegativeSamples(sampleEpisode, 3);

      expect(negative.length).toBe(3);

      for (const sample of negative) {
        expect(sample.category).toBe('negative');
        expect(sample.expectedAnswer).toBe('');
        expect(sample.context).toBe('negative_sample');
      }
    });

    it('should create diverse negative samples', () => {
      const negative = syntheticService.generateNegativeSamples(sampleEpisode, 3);

      // All queries should be different
      const queries = negative.map((n) => n.query);
      const uniqueQueries = new Set(queries);

      expect(uniqueQueries.size).toBe(queries.length);
    });
  });

  describe('generateSyntheticEpisodes', () => {
    it('should generate multiple synthetic episodes', async () => {
      const baseEpisodes = [sampleEpisode];

      const synthetic = await syntheticService.generateSyntheticEpisodes(baseEpisodes, 10);

      expect(synthetic.length).toBe(10);

      for (const episode of synthetic) {
        expect(episode.userMessage).toBeDefined();
        expect(episode.edenResponse).toBeDefined();
        expect(episode.quality).toBeGreaterThan(0);
        expect(episode.quality).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('augmentEpisodes', () => {
    it('should merge similar episodes', () => {
      const episode1: ConversationEpisode = {
        ...sampleEpisode,
        id: 'episode-1',
        userMessage: 'Python 피보나치 함수',
      };

      const episode2: ConversationEpisode = {
        ...sampleEpisode,
        id: 'episode-2',
        userMessage: 'Python 재귀 함수 예제',
      };

      const augmented = syntheticService.augmentEpisodes([episode1, episode2]);

      expect(augmented.length).toBeGreaterThan(0);

      for (const aug of augmented) {
        expect(aug.context.merged).toBe(true);
        expect(aug.context.sources).toHaveLength(2);
      }
    });
  });

  describe('evaluateQuality', () => {
    it('should evaluate synthetic data quality', async () => {
      const baseEpisodes = [sampleEpisode];

      const synthetic = await syntheticService.generateSyntheticEpisodes(baseEpisodes, 20);

      const evaluation = syntheticService.evaluateQuality(synthetic);

      expect(evaluation.avgQuality).toBeGreaterThan(0);
      expect(evaluation.avgQuality).toBeLessThanOrEqual(1);
      expect(evaluation.highQuality + evaluation.mediumQuality + evaluation.lowQuality).toBe(
        synthetic.length
      );
    });
  });

  describe('English text handling', () => {
    it('should handle English queries', () => {
      const englishEpisode: ConversationEpisode = {
        ...sampleEpisode,
        userMessage: 'Create a fibonacci function in Python',
        edenResponse: 'def fibonacci(n):\n  if n <= 1:\n    return n\n  return fibonacci(n-1) + fibonacci(n-2)',
      };

      const queries = syntheticService.generateSyntheticQueries(englishEpisode, 5);

      expect(queries.length).toBe(5);

      for (const query of queries) {
        expect(query.query).toBeDefined();
      }
    });
  });

  describe('mixed language handling', () => {
    it('should handle mixed Korean-English queries', () => {
      const mixedEpisode: ConversationEpisode = {
        ...sampleEpisode,
        userMessage: 'Python code로 fibonacci 구현해줘',
      };

      const queries = syntheticService.generateSyntheticQueries(mixedEpisode, 5);

      expect(queries.length).toBe(5);
    });
  });
});

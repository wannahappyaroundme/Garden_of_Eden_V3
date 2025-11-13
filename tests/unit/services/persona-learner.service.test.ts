/**
 * PersonaLearner Service Unit Tests
 * Tests gradient descent learning algorithm
 */

import { PersonaLearnerService } from '../../../src/main/services/learning/persona-learner.service';
import type { PersonaParameters } from '../../../src/shared/types/persona.types';

// Mock dependencies
jest.mock('../../../src/main/services/learning/persona.service', () => ({
  getPersonaService: () => ({
    getPersona: jest.fn(() => ({
      formality: 50,
      verbosity: 50,
      humor: 50,
      enthusiasm: 50,
      empathy: 50,
      friendliness: 50,
      assertiveness: 50,
      patience: 50,
      optimism: 50,
      playfulness: 50,
      creativity: 50,
      technicality: 50,
      directness: 50,
      emojiUsage: 50,
      codeSnippets: 50,
      structuredOutput: 50,
      markdown: 50,
      exampleUsage: 50,
      analogy: 50,
      questioning: 50,
      reasoningDepth: 50,
      contextAwareness: 50,
      proactiveness: 50,
      interruptiveness: 50,
      suggestionFrequency: 50,
      confirmation: 50,
      errorTolerance: 50,
      learningFocus: 50,
    })),
    updatePersona: jest.fn(),
  }),
}));

jest.mock('../../../src/main/database/repositories/message.repository', () => ({
  getMessageRepository: () => ({
    findById: jest.fn((id: string) => ({
      id,
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'Test response with code ```js\ncode\n``` and emoji 😊',
      timestamp: new Date(),
      metadata: {},
    })),
  }),
}));

jest.mock('../../../src/main/database/repositories/learning-data.repository', () => ({
  getLearningDataRepository: () => ({
    create: jest.fn(),
  }),
}));

describe('PersonaLearnerService', () => {
  let service: PersonaLearnerService;

  beforeEach(() => {
    service = new PersonaLearnerService();
  });

  describe('Learning Algorithm', () => {
    it('should have default learning rate of 0.02', () => {
      const rate = service.getLearningRate();
      expect(rate).toBe(0.02);
    });

    it('should allow setting learning rate', () => {
      service.setLearningRate(0.05);
      expect(service.getLearningRate()).toBe(0.05);
    });

    it('should clamp learning rate between 0.001 and 0.1', () => {
      service.setLearningRate(0.5);
      expect(service.getLearningRate()).toBe(0.1);

      service.setLearningRate(0.0001);
      expect(service.getLearningRate()).toBe(0.001);
    });
  });

  describe('Parameter Adjustment', () => {
    it('should calculate adjustments based on feedback context', async () => {
      const result = await service.learnFromFeedback('msg-1', 'positive');

      // Should return updated persona and adjustments
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('adjustments');
      expect(typeof result.updated).toBe('object');
      expect(typeof result.adjustments).toBe('object');
    });

    it('should increase parameters on positive feedback', async () => {
      const result = await service.learnFromFeedback('msg-1', 'positive');

      // Check that some parameters were increased
      const adjustmentKeys = Object.keys(result.adjustments);
      expect(adjustmentKeys.length).toBeGreaterThan(0);

      // All changes should be positive (or zero if at boundary)
      Object.values(result.adjustments).forEach((adjustment: any) => {
        expect(adjustment.change).toBeGreaterThanOrEqual(0);
      });
    });

    it('should decrease parameters on negative feedback', async () => {
      const result = await service.learnFromFeedback('msg-1', 'negative');

      // Check that some parameters were decreased
      const adjustmentKeys = Object.keys(result.adjustments);
      expect(adjustmentKeys.length).toBeGreaterThan(0);

      // All changes should be negative (or zero if at boundary)
      Object.values(result.adjustments).forEach((adjustment: any) => {
        expect(adjustment.change).toBeLessThanOrEqual(0);
      });
    });
  });

  describe('Bounds Checking', () => {
    it('should not exceed parameter bounds (0-100)', async () => {
      // Mock high starting values
      const highPersona: PersonaParameters = {
        formality: 95,
        verbosity: 95,
        humor: 95,
        enthusiasm: 95,
        empathy: 95,
        friendliness: 95,
        assertiveness: 95,
        patience: 95,
        optimism: 95,
        playfulness: 95,
        creativity: 95,
        technicality: 95,
        directness: 95,
        emojiUsage: 95,
        codeSnippets: 95,
        structuredOutput: 95,
        markdown: 95,
        exampleUsage: 95,
        analogy: 95,
        questioning: 95,
        reasoningDepth: 95,
        contextAwareness: 95,
        proactiveness: 95,
        interruptiveness: 95,
        suggestionFrequency: 95,
        confirmation: 95,
        errorTolerance: 95,
        learningFocus: 95,
      };

      // Apply multiple positive feedbacks
      for (let i = 0; i < 10; i++) {
        const result = await service.learnFromFeedback('msg-1', 'positive');

        // Check all parameters are within bounds
        Object.values(result.updated).forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should not go below parameter bounds (0-100)', async () => {
      // Apply multiple negative feedbacks
      for (let i = 0; i < 10; i++) {
        const result = await service.learnFromFeedback('msg-1', 'negative');

        // Check all parameters are within bounds
        Object.values(result.updated).forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        });
      }
    });
  });

  describe('Context Analysis', () => {
    it('should detect code snippets in message', async () => {
      const result = await service.learnFromFeedback('msg-1', 'positive');

      // Message contains code, so codeSnippets adjustment should exist
      expect(result.adjustments).toHaveProperty('codeSnippets');
    });

    it('should detect emojis in message', async () => {
      const result = await service.learnFromFeedback('msg-1', 'positive');

      // Message contains emoji, so emojiUsage adjustment should exist
      expect(result.adjustments).toHaveProperty('emojiUsage');
    });
  });

  describe('Learning Statistics', () => {
    it('should return learning stats', async () => {
      const stats = await service.getLearningStats();

      expect(stats).toHaveProperty('totalFeedback');
      expect(stats).toHaveProperty('positiveFeedback');
      expect(stats).toHaveProperty('negativeFeedback');
      expect(stats).toHaveProperty('satisfactionRate');
      expect(typeof stats.totalFeedback).toBe('number');
      expect(typeof stats.satisfactionRate).toBe('number');
    });

    it('should return feedback trend', async () => {
      const trend = await service.getFeedbackTrend(7);

      expect(Array.isArray(trend)).toBe(true);
      trend.forEach((entry) => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('positive');
        expect(entry).toHaveProperty('negative');
      });
    });
  });
});

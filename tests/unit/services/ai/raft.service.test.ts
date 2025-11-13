/**
 * RAFT Service Tests
 */

import { RAFTService } from '../../../../src/main/services/ai/raft.service';
import type { RetrievedEpisode } from '../../../../src/main/services/learning/memory.service';

describe('RAFTService', () => {
  let raftService: RAFTService;
  let sampleDocs: RetrievedEpisode[];

  beforeEach(() => {
    raftService = new RAFTService();

    sampleDocs = [
      {
        id: 'ep1',
        conversationId: 'conv1',
        timestamp: new Date(),
        userMessage: 'Python으로 피보나치 수열 함수를 작성해줘',
        edenResponse: 'def fibonacci(n):\n  if n <= 1:\n    return n\n  return fibonacci(n-1) + fibonacci(n-2)',
        similarity: 0.92,
      },
      {
        id: 'ep2',
        conversationId: 'conv1',
        timestamp: new Date(),
        userMessage: 'Python recursion은 어떻게 작동하나요?',
        edenResponse: 'Recursion은 함수가 자기 자신을 호출하는 방식입니다. Base case와 recursive case가 필요합니다.',
        similarity: 0.85,
      },
    ];
  });

  describe('generateGroundedResponse', () => {
    it('should generate RAFT context with reasoning', async () => {
      const query = 'Python 재귀 함수 예제를 보여줘';

      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      expect(raftContext.query).toBe(query);
      expect(raftContext.documents).toHaveLength(2);
      expect(raftContext.reasoning).toBeDefined();
      expect(raftContext.reasoning.length).toBeGreaterThan(0);
      expect(raftContext.sources).toHaveLength(2);
      expect(raftContext.confidence).toBeGreaterThan(0);
      expect(raftContext.confidence).toBeLessThanOrEqual(1);
    });

    it('should use fast mode for casual queries', async () => {
      const query = 'hi';

      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'fast');

      expect(raftContext.reasoning).toBeDefined();
      // Fast mode should have shorter reasoning
      expect(raftContext.reasoning.length).toBeLessThan(200);
    });

    it('should handle empty document list', async () => {
      const query = 'New question with no context';

      const raftContext = await raftService.generateGroundedResponse(query, [], 'detailed');

      expect(raftContext.documents).toHaveLength(0);
      expect(raftContext.confidence).toBeLessThan(0.5); // Low confidence
      expect(raftContext.sources).toHaveLength(0);
    });
  });

  describe('validateResponse', () => {
    it('should validate grounded responses', async () => {
      const query = 'Python recursion이 뭐야?';
      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      const response = 'Recursion은 함수가 자기 자신을 호출하는 방식입니다.';

      const validation = raftService.validateResponse(response, raftContext);

      expect(validation.isGrounded).toBe(true);
      expect(validation.confidence).toBeGreaterThan(0.7);
      expect(validation.supportingEvidence).toHaveLength(1);
      expect(validation.missingInfo).toHaveLength(0);
    });

    it('should detect ungrounded responses', async () => {
      const query = 'Python recursion이 뭐야?';
      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      // Response with unrelated info
      const response = 'Python은 1991년에 Guido van Rossum이 만들었습니다. 인터프리터 언어입니다.';

      const validation = raftService.validateResponse(response, raftContext);

      expect(validation.isGrounded).toBe(false);
      expect(validation.confidence).toBeLessThan(0.7);
      expect(validation.missingInfo.length).toBeGreaterThan(0);
    });

    it('should extract claims from response', async () => {
      const query = 'Python recursion이 뭐야?';
      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      const response =
        'Recursion은 함수가 자기 자신을 호출하는 것입니다. Base case와 recursive case가 필요합니다. 피보나치가 대표적인 예시입니다.';

      const validation = raftService.validateResponse(response, raftContext);

      // Should have 3 claims
      expect(validation.supportingEvidence.length + validation.missingInfo.length).toBe(3);
    });
  });

  describe('assessHallucinationRisk', () => {
    it('should detect low risk for well-grounded responses', async () => {
      const query = 'Python recursion이 뭐야?';
      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      const response = 'Recursion은 함수가 자기 자신을 호출하는 방식입니다.';

      const risk = raftService.assessHallucinationRisk(response, raftContext);

      expect(risk).toBe('low');
    });

    it('should detect high risk for ungrounded responses', async () => {
      const query = 'Python recursion이 뭐야?';
      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      const response = 'Python recursion은 매우 빠르고 항상 최선의 선택입니다. 모든 문제를 해결할 수 있습니다.';

      const risk = raftService.assessHallucinationRisk(response, raftContext);

      expect(risk).toBe('high');
    });

    it('should detect medium risk for partially grounded responses', async () => {
      const query = 'Python recursion이 뭐야?';
      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      const response =
        'Recursion은 함수가 자기 자신을 호출하는 것입니다. 이것은 매우 효율적이고 메모리를 절약합니다.';

      const risk = raftService.assessHallucinationRisk(response, raftContext);

      expect(['medium', 'high']).toContain(risk); // Partially false claims
    });
  });

  describe('createRAFTPrompt', () => {
    it('should create detailed prompt', async () => {
      const query = 'Python recursion 예제';
      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      const prompt = raftService.createRAFTPrompt(query, raftContext, 'detailed');

      expect(prompt).toContain('Retrieved Context');
      expect(prompt).toContain('Chain of Thought');
      expect(prompt).toContain(query);
      expect(prompt.length).toBeGreaterThan(500);
    });

    it('should create fast prompt', async () => {
      const query = 'hi';
      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'fast');

      const prompt = raftService.createRAFTPrompt(query, raftContext, 'fast');

      expect(prompt).toContain(query);
      expect(prompt.length).toBeLessThan(300); // Shorter for fast mode
    });

    it('should include sources in detailed prompt', async () => {
      const query = 'Python recursion 설명';
      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      const prompt = raftService.createRAFTPrompt(query, raftContext, 'detailed');

      expect(prompt).toContain('[Source');
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', async () => {
      const query = '';

      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      expect(raftContext.confidence).toBeLessThan(0.3);
    });

    it('should handle very long query', async () => {
      const query = 'Python recursion '.repeat(200);

      const raftContext = await raftService.generateGroundedResponse(query, sampleDocs, 'detailed');

      expect(raftContext.query.length).toBeLessThanOrEqual(2000);
    });

    it('should handle documents with low similarity', async () => {
      const lowSimDocs: RetrievedEpisode[] = [
        {
          ...sampleDocs[0],
          similarity: 0.3,
        },
        {
          ...sampleDocs[1],
          similarity: 0.25,
        },
      ];

      const query = 'Completely unrelated question';
      const raftContext = await raftService.generateGroundedResponse(query, lowSimDocs, 'detailed');

      expect(raftContext.confidence).toBeLessThan(0.5);
    });
  });
});

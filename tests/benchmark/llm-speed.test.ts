/**
 * LLM Speed Benchmark Tests
 * Measures actual performance of Qwen 2.5 14B on Apple Silicon
 */

import { llamaService } from '../../src/main/services/ai/llama.service';

describe('Qwen 2.5 14B Speed Benchmarks', () => {
  beforeAll(async () => {
    // Initialize model before running benchmarks
    if (!llamaService.isInitialized()) {
      console.log('Initializing Qwen 2.5 14B model...');
      const start = Date.now();
      await llamaService.initialize();
      const loadTime = Date.now() - start;
      console.log(`Model loaded in ${loadTime}ms`);
    }
  }, 60000); // 60s timeout for model loading

  afterAll(async () => {
    await llamaService.shutdown();
  });

  describe('Tokens per Second', () => {
    it('should achieve moderate speed for short responses (50 tokens)', async () => {
      const prompt = '간단히 대답해줘: 오늘 날씨 어때?';
      const maxTokens = 50;

      const start = Date.now();
      const response = await llamaService.generateResponse(prompt);
      const elapsed = Date.now() - start;

      // Estimate tokens (rough: ~4 chars per token)
      const tokens = response.length / 4;
      const tokensPerSecond = (tokens / elapsed) * 1000;

      console.log(`Generated ${tokens} tokens in ${elapsed}ms`);
      console.log(`Speed: ${tokensPerSecond.toFixed(2)} t/s`);

      // Expected: Moderate speed on Apple Silicon (Qwen 2.5 14B)
      expect(tokensPerSecond).toBeGreaterThanOrEqual(10); // Allow reasonable margin
      expect(tokensPerSecond).toBeLessThanOrEqual(40);
    }, 30000);

    it('should achieve moderate speed for medium responses (100 tokens)', async () => {
      const prompt = '파이썬으로 피보나치 수열을 구현하는 함수를 작성해줘.';
      const maxTokens = 100;

      const start = Date.now();
      const response = await llamaService.generateResponse(prompt);
      const elapsed = Date.now();

      const tokens = response.length / 4;
      const tokensPerSecond = (tokens / elapsed) * 1000;

      console.log(`Generated ${tokens} tokens in ${elapsed}ms`);
      console.log(`Speed: ${tokensPerSecond.toFixed(2)} t/s`);

      expect(tokensPerSecond).toBeGreaterThanOrEqual(10);
      expect(tokensPerSecond).toBeLessThanOrEqual(40);
    }, 45000);

    it('should achieve moderate speed for long responses (150 tokens)', async () => {
      const prompt = 'React에서 useEffect와 useState를 사용하는 방법을 자세히 설명해줘.';
      const maxTokens = 150;

      const start = Date.now();
      const response = await llamaService.generateResponse(prompt);
      const elapsed = Date.now() - start;

      const tokens = response.length / 4;
      const tokensPerSecond = (tokens / elapsed) * 1000;

      console.log(`Generated ${tokens} tokens in ${elapsed}ms`);
      console.log(`Speed: ${tokensPerSecond.toFixed(2)} t/s`);

      expect(tokensPerSecond).toBeGreaterThanOrEqual(10);
      expect(tokensPerSecond).toBeLessThanOrEqual(40);
    }, 60000);
  });

  describe('Response Time Targets', () => {
    it('should respond in reasonable time for casual chat (fast mode)', async () => {
      const prompt = '오늘 기분이 어때?';

      const start = Date.now();
      const response = await llamaService.generateResponse(prompt);
      const elapsed = Date.now() - start;

      console.log(`Response time: ${elapsed}ms`);
      console.log(`Response: ${response.substring(0, 100)}...`);

      // Target: <5s for casual chat (Qwen 2.5 14B)
      expect(elapsed).toBeLessThan(5000);
    }, 10000);

    it('should respond in reasonable time for detailed response', async () => {
      const prompt = 'TypeScript의 Generic 타입에 대해 설명해줘.';

      const start = Date.now();
      const response = await llamaService.generateResponse(prompt);
      const elapsed = Date.now() - start;

      console.log(`Response time: ${elapsed}ms`);

      // Target: <10s for detailed responses (Qwen 2.5 14B)
      expect(elapsed).toBeLessThan(10000);
    }, 15000);
  });

  describe('Korean Language Quality', () => {
    it('should generate responses primarily in Korean (>90%)', async () => {
      const prompt = '한국의 수도는 어디야?';

      const response = await llamaService.generateResponse(prompt);

      // Count Korean characters
      const koreanChars = (response.match(/[\uac00-\ud7af]/g) || []).length;
      const totalChars = response.length;
      const koreanRatio = koreanChars / totalChars;

      console.log(`Korean ratio: ${(koreanRatio * 100).toFixed(1)}%`);
      console.log(`Response: ${response}`);

      // Qwen 2.5 14B should have <10% language mixing (ideally <1% after fine-tuning)
      expect(koreanRatio).toBeGreaterThan(0.9);
    }, 30000);

    it('should handle code generation in Korean context', async () => {
      const prompt = '리스트를 역순으로 뒤집는 파이썬 함수를 짜줘.';

      const response = await llamaService.generateResponse(prompt);

      // Should contain both Korean explanation and Python code
      expect(response).toMatch(/[\uac00-\ud7af]/); // Contains Korean
      expect(response).toMatch(/def|return/i); // Contains Python code

      console.log(`Response: ${response}`);
    }, 30000);
  });

  describe('Memory Usage', () => {
    it('should report RAM usage during operation', () => {
      const memUsage = process.memoryUsage();

      console.log('Memory Usage:');
      console.log(`  RSS: ${(memUsage.rss / 1024 / 1024 / 1024).toFixed(2)} GB`);
      console.log(`  Heap: ${(memUsage.heapUsed / 1024 / 1024 / 1024).toFixed(2)} GB`);
      console.log(`  External: ${(memUsage.external / 1024 / 1024 / 1024).toFixed(2)} GB`);

      // Expected: ~12GB for Qwen 2.5 14B Q4_K_M + ~2-3GB for Node.js
      // RSS should be <20GB on Apple Silicon
      expect(memUsage.rss / 1024 / 1024 / 1024).toBeLessThan(20);
    });
  });

  describe('Streaming Performance', () => {
    it('should stream tokens progressively', async () => {
      const prompt = '한국 역사에 대해 간단히 설명해줘.';
      const tokens: string[] = [];

      const start = Date.now();

      await llamaService.generateStreamingResponse(
        prompt,
        (token: string) => {
          tokens.push(token);
        }
      );

      const elapsed = Date.now() - start;
      const totalTokens = tokens.length;
      const tokensPerSecond = (totalTokens / elapsed) * 1000;

      console.log(`Streamed ${totalTokens} tokens in ${elapsed}ms`);
      console.log(`Streaming speed: ${tokensPerSecond.toFixed(2)} t/s`);

      // Streaming should be at least as fast as non-streaming
      expect(tokensPerSecond).toBeGreaterThanOrEqual(10);
    }, 30000);
  });

  describe('Context Size', () => {
    it('should handle up to 8K context tokens', async () => {
      // Generate a prompt with ~6K tokens (leaving room for response)
      const longContext = '한국어 문장을 반복합니다. '.repeat(2000); // ~6K tokens
      const prompt = `${longContext}\n\n이 문장들의 주제를 요약해줘.`;

      const start = Date.now();
      const response = await llamaService.generateResponse(prompt);
      const elapsed = Date.now() - start;

      console.log(`Long context response time: ${elapsed}ms`);
      expect(response.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(30000); // Should complete within 30s
    }, 60000);
  });

  describe('Benchmark Summary', () => {
    it('should print comprehensive benchmark report', async () => {
      console.log('\n='.repeat(60));
      console.log('Qwen 2.5 14B Benchmark Summary');
      console.log('='.repeat(60));

      // Run multiple quick tests
      const tests = [
        { prompt: '안녕?', label: 'Simple greeting' },
        { prompt: '파이썬 리스트 설명해줘.', label: 'Technical explanation' },
        { prompt: 'React Hooks 설명해줘.', label: 'Code explanation' },
      ];

      for (const test of tests) {
        const start = Date.now();
        const response = await llamaService.generateResponse(test.prompt);
        const elapsed = Date.now() - start;
        const tokens = response.length / 4;
        const tps = (tokens / elapsed) * 1000;

        console.log(`\n${test.label}:`);
        console.log(`  Time: ${elapsed}ms`);
        console.log(`  Tokens: ~${tokens.toFixed(0)}`);
        console.log(`  Speed: ${tps.toFixed(2)} t/s`);
      }

      console.log('\n' + '='.repeat(60));
      console.log('Expected Performance on Apple Silicon:');
      console.log('  Speed: Moderate (varies by hardware)');
      console.log('  Response Time (casual): 2-5s');
      console.log('  Response Time (detailed): 5-10s');
      console.log('  Memory Usage: ~12GB RAM');
      console.log('='.repeat(60) + '\n');
    }, 120000); // 2 min timeout for full benchmark
  });
});

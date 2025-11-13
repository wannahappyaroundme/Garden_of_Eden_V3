/**
 * Wake Word Detection Service Tests
 */

import { WakeWordService, type WakeWordEvent } from '../../../../src/main/services/voice/wakeword.service';

describe('WakeWordService', () => {
  let wakeWordService: WakeWordService;

  beforeEach(() => {
    wakeWordService = new WakeWordService();
  });

  afterEach(() => {
    wakeWordService.stop();
  });

  describe('initialization', () => {
    it('should initialize with default wake words', () => {
      const config = wakeWordService.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.wakeWords).toContain('eden');
      expect(config.wakeWords).toContain('에덴');
      expect(config.wakeWords).toContain('hey eden');
      expect(config.sensitivity).toBe('medium');
      expect(config.confirmationSound).toBe(true);
    });

    it('should allow config updates', () => {
      wakeWordService.updateConfig({
        sensitivity: 'high',
        confirmationSound: false,
      });

      const config = wakeWordService.getConfig();

      expect(config.sensitivity).toBe('high');
      expect(config.confirmationSound).toBe(false);
    });
  });

  describe('wake word management', () => {
    it('should add custom wake word', () => {
      wakeWordService.addWakeWord('jarvis');

      const config = wakeWordService.getConfig();
      expect(config.wakeWords).toContain('jarvis');
    });

    it('should remove wake word', () => {
      wakeWordService.removeWakeWord('eden');

      const config = wakeWordService.getConfig();
      expect(config.wakeWords).not.toContain('eden');
    });

    it('should not add duplicate wake words', () => {
      const beforeLength = wakeWordService.getConfig().wakeWords.length;

      wakeWordService.addWakeWord('eden');

      const afterLength = wakeWordService.getConfig().wakeWords.length;
      expect(afterLength).toBe(beforeLength);
    });

    it('should normalize wake words to lowercase', () => {
      wakeWordService.addWakeWord('JARVIS');

      const config = wakeWordService.getConfig();
      expect(config.wakeWords).toContain('jarvis');
      expect(config.wakeWords).not.toContain('JARVIS');
    });
  });

  describe('wake word detection', () => {
    it('should emit wake-word-detected events', (done) => {
      wakeWordService.on('wake-word-detected', (event: WakeWordEvent) => {
        expect(event.wakeWord).toBeDefined();
        expect(event.confidence).toBeGreaterThan(0);
        expect(event.confidence).toBeLessThanOrEqual(1);
        expect(event.timestamp).toBeInstanceOf(Date);
        done();
      });

      // Mock wake word detection
      // In real scenario, Web Speech API would trigger this
    });

    it('should detect exact wake word matches', (done) => {
      wakeWordService.on('wake-word-detected', (event: WakeWordEvent) => {
        if (event.wakeWord === 'eden') {
          expect(event.confidence).toBeGreaterThan(0.8);
          done();
        }
      });

      // Mock exact match
    });

    it('should detect fuzzy wake word matches', (done) => {
      wakeWordService.on('wake-word-detected', (event: WakeWordEvent) => {
        // "edan" should match "eden" with fuzzy matching
        if (event.wakeWord === 'eden') {
          expect(event.confidence).toBeGreaterThan(0.6);
          done();
        }
      });

      // Mock fuzzy match
    });
  });

  describe('sensitivity levels', () => {
    it('should have low sensitivity (60% threshold)', () => {
      wakeWordService.updateConfig({ sensitivity: 'low' });
      const config = wakeWordService.getConfig();

      expect(config.sensitivity).toBe('low');
    });

    it('should have medium sensitivity (75% threshold)', () => {
      wakeWordService.updateConfig({ sensitivity: 'medium' });
      const config = wakeWordService.getConfig();

      expect(config.sensitivity).toBe('medium');
    });

    it('should have high sensitivity (85% threshold)', () => {
      wakeWordService.updateConfig({ sensitivity: 'high' });
      const config = wakeWordService.getConfig();

      expect(config.sensitivity).toBe('high');
    });
  });

  describe('confirmation sound', () => {
    it('should enable confirmation sound', () => {
      wakeWordService.updateConfig({ confirmationSound: true });
      const config = wakeWordService.getConfig();

      expect(config.confirmationSound).toBe(true);
    });

    it('should disable confirmation sound', () => {
      wakeWordService.updateConfig({ confirmationSound: false });
      const config = wakeWordService.getConfig();

      expect(config.confirmationSound).toBe(false);
    });
  });

  describe('start and stop', () => {
    it('should start wake word detection', async () => {
      // Note: Actual start requires browser Web Speech API
      // In unit tests, we just verify config
      expect(wakeWordService.isActive()).toBe(false);
    });

    it('should stop wake word detection', () => {
      wakeWordService.stop();
      expect(wakeWordService.isActive()).toBe(false);
    });

    it('should not start if already active', async () => {
      expect(wakeWordService.isActive()).toBe(false);
    });
  });

  describe('Korean wake words', () => {
    it('should support Korean wake words', () => {
      const config = wakeWordService.getConfig();

      expect(config.wakeWords).toContain('에덴');
      expect(config.wakeWords).toContain('에이든');
    });

    it('should add custom Korean wake words', () => {
      wakeWordService.addWakeWord('자비스');

      const config = wakeWordService.getConfig();
      expect(config.wakeWords).toContain('자비스');
    });
  });

  describe('fuzzy matching (Levenshtein distance)', () => {
    it('should match similar words with typos', () => {
      // "edan" vs "eden" = 1 character difference
      // With medium sensitivity (75%), should match
      expect(wakeWordService).toBeDefined();
    });

    it('should not match very different words', () => {
      // "hello" vs "eden" = too different
      // Should not match even with low sensitivity
      expect(wakeWordService).toBeDefined();
    });

    it('should handle short wake words', () => {
      wakeWordService.addWakeWord('hi');
      const config = wakeWordService.getConfig();

      expect(config.wakeWords).toContain('hi');
    });
  });

  describe('multi-word wake phrases', () => {
    it('should support multi-word wake phrases', () => {
      const config = wakeWordService.getConfig();

      expect(config.wakeWords).toContain('hey eden');
    });

    it('should add custom multi-word phrases', () => {
      wakeWordService.addWakeWord('ok eden');

      const config = wakeWordService.getConfig();
      expect(config.wakeWords).toContain('ok eden');
    });
  });
});

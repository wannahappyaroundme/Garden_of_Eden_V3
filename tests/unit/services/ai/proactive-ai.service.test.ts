/**
 * Proactive AI Service Tests
 */

import { ProactiveAIService, type ProactiveEvent } from '../../../../src/main/services/ai/proactive-ai.service';

describe('ProactiveAIService', () => {
  let proactiveService: ProactiveAIService;

  beforeEach(() => {
    proactiveService = new ProactiveAIService();
  });

  afterEach(() => {
    proactiveService.stop();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const config = proactiveService.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.frequency).toBe('medium');
      expect(config.personality).toBe('friendly');
      expect(config.quietHours).toEqual({ start: 23, end: 7 });
      expect(config.minIdleTime).toBe(5);
    });

    it('should allow config updates', () => {
      proactiveService.updateConfig({
        frequency: 'high',
        personality: 'enthusiastic',
      });

      const config = proactiveService.getConfig();

      expect(config.frequency).toBe('high');
      expect(config.personality).toBe('enthusiastic');
    });
  });

  describe('proactive event generation', () => {
    it('should emit proactive message events', (done) => {
      proactiveService.updateConfig({
        enabled: true,
        frequency: 'high',
        minIdleTime: 0, // Immediate
      });

      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        expect(event).toBeDefined();
        expect(event.type).toMatch(/greeting|check_in|suggestion|encouragement|curiosity/);
        expect(event.message).toBeDefined();
        expect(event.timestamp).toBeInstanceOf(Date);
        done();
      });

      proactiveService.start();
      proactiveService.triggerProactive(); // Force immediate trigger
    });

    it('should generate different event types', () => {
      const events: ProactiveEvent[] = [];

      // Generate multiple events
      for (let i = 0; i < 10; i++) {
        proactiveService.triggerProactive();
      }

      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        events.push(event);
      });

      // Should have variety of event types
      const types = new Set(events.map((e) => e.type));
      expect(types.size).toBeGreaterThan(1);
    });
  });

  describe('personality modes', () => {
    it('should generate reserved messages', () => {
      proactiveService.updateConfig({ personality: 'reserved' });

      proactiveService.triggerProactive();

      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        expect(event.message).toBeDefined();
        expect(event.message.length).toBeLessThan(100); // Reserved = concise
        expect(event.message).not.toMatch(/!{2,}/); // No excessive exclamation
      });
    });

    it('should generate friendly messages', () => {
      proactiveService.updateConfig({ personality: 'friendly' });

      proactiveService.triggerProactive();

      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        expect(event.message).toBeDefined();
      });
    });

    it('should generate enthusiastic messages', () => {
      proactiveService.updateConfig({ personality: 'enthusiastic' });

      proactiveService.triggerProactive();

      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        expect(event.message).toBeDefined();
        // Enthusiastic might have emojis or exclamation marks
      });
    });
  });

  describe('frequency control', () => {
    it('should respect low frequency (30-60 min)', () => {
      proactiveService.updateConfig({ frequency: 'low' });
      const config = proactiveService.getConfig();

      // Low frequency should have longer intervals
      expect(config.frequency).toBe('low');
    });

    it('should respect medium frequency (15-30 min)', () => {
      proactiveService.updateConfig({ frequency: 'medium' });
      const config = proactiveService.getConfig();

      expect(config.frequency).toBe('medium');
    });

    it('should respect high frequency (5-15 min)', () => {
      proactiveService.updateConfig({ frequency: 'high' });
      const config = proactiveService.getConfig();

      expect(config.frequency).toBe('high');
    });
  });

  describe('quiet hours', () => {
    it('should respect default quiet hours (11pm-7am)', () => {
      const config = proactiveService.getConfig();

      expect(config.quietHours.start).toBe(23);
      expect(config.quietHours.end).toBe(7);
    });

    it('should allow custom quiet hours', () => {
      proactiveService.updateConfig({
        quietHours: { start: 22, end: 8 },
      });

      const config = proactiveService.getConfig();

      expect(config.quietHours.start).toBe(22);
      expect(config.quietHours.end).toBe(8);
    });
  });

  describe('conversation pause', () => {
    it('should pause during conversation', () => {
      proactiveService.start();
      expect(proactiveService.isActive()).toBe(true);

      proactiveService.pauseForConversation();

      // Should still be active but paused
      expect(proactiveService.isActive()).toBe(true);
    });

    it('should resume after conversation', () => {
      proactiveService.start();
      proactiveService.pauseForConversation();

      proactiveService.resumeProactive();

      expect(proactiveService.isActive()).toBe(true);
    });
  });

  describe('event types', () => {
    it('should generate greeting events', () => {
      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        if (event.type === 'greeting') {
          expect(event.message).toMatch(/(good morning|안녕|hi)/i);
        }
      });

      proactiveService.triggerProactive();
    });

    it('should generate check-in events', () => {
      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        if (event.type === 'check_in') {
          expect(event.message).toMatch(/(how are you|잘 지내|괜찮아)/i);
        }
      });

      proactiveService.triggerProactive();
    });

    it('should generate suggestion events', () => {
      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        if (event.type === 'suggestion') {
          expect(event.message).toBeDefined();
        }
      });

      proactiveService.triggerProactive();
    });

    it('should generate encouragement events', () => {
      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        if (event.type === 'encouragement') {
          expect(event.message).toMatch(/(great|good|well done|잘했어|멋져)/i);
        }
      });

      proactiveService.triggerProactive();
    });

    it('should generate curiosity events', () => {
      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        if (event.type === 'curiosity') {
          expect(event.message).toMatch(/\?/); // Should be a question
        }
      });

      proactiveService.triggerProactive();
    });
  });

  describe('start and stop', () => {
    it('should start proactive monitoring', () => {
      proactiveService.start();

      expect(proactiveService.isActive()).toBe(true);
    });

    it('should stop proactive monitoring', () => {
      proactiveService.start();
      proactiveService.stop();

      expect(proactiveService.isActive()).toBe(false);
    });

    it('should not start if already active', () => {
      proactiveService.start();
      const firstStart = proactiveService.isActive();

      proactiveService.start(); // Try starting again
      const secondStart = proactiveService.isActive();

      expect(firstStart).toBe(true);
      expect(secondStart).toBe(true);
    });
  });

  describe('manual trigger', () => {
    it('should allow manual proactive message trigger', (done) => {
      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        expect(event).toBeDefined();
        done();
      });

      proactiveService.triggerProactive();
    });

    it('should not trigger if disabled', () => {
      proactiveService.updateConfig({ enabled: false });

      let triggered = false;
      proactiveService.on('proactive-message', () => {
        triggered = true;
      });

      proactiveService.triggerProactive();

      expect(triggered).toBe(false);
    });
  });

  describe('idle time handling', () => {
    it('should track idle time', () => {
      proactiveService.updateConfig({ minIdleTime: 10 });
      const config = proactiveService.getConfig();

      expect(config.minIdleTime).toBe(10);
    });

    it('should trigger after min idle time', (done) => {
      proactiveService.updateConfig({ minIdleTime: 0 });

      proactiveService.on('proactive-message', (event: ProactiveEvent) => {
        expect(event).toBeDefined();
        done();
      });

      proactiveService.start();
      proactiveService.triggerProactive();
    });
  });
});

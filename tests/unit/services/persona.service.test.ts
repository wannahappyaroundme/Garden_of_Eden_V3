/**
 * Unit Tests for PersonaService
 *
 * Tests all persona management operations including:
 * - Persona parameter management
 * - Preset loading
 * - System prompt generation
 * - Parameter updates
 * - Default reset
 */

import { PersonaService } from '@/main/services/learning/persona.service';
import type { PersonaParameters } from '@shared/types/persona.types';
import { DEFAULT_PERSONA, PERSONA_PRESETS } from '@shared/types/persona.types';

describe('PersonaService', () => {
  let personaService: PersonaService;

  beforeEach(() => {
    personaService = new PersonaService();
  });

  describe('getPersona', () => {
    it('should return default persona initially', () => {
      const persona = personaService.getPersona();

      expect(persona).toEqual(DEFAULT_PERSONA);
    });

    it('should return a copy of persona parameters', () => {
      const persona1 = personaService.getPersona();
      const persona2 = personaService.getPersona();

      expect(persona1).toEqual(persona2);
      expect(persona1).not.toBe(persona2); // Different objects
    });

    it('should not affect internal state when modifying returned object', () => {
      const persona = personaService.getPersona();
      persona.formality = 100;

      const internalPersona = personaService.getPersona();
      expect(internalPersona.formality).toBe(DEFAULT_PERSONA.formality);
    });
  });

  describe('updatePersona', () => {
    it('should update single parameter', () => {
      personaService.updatePersona({ formality: 75 });

      const persona = personaService.getPersona();
      expect(persona.formality).toBe(75);
    });

    it('should update multiple parameters', () => {
      personaService.updatePersona({
        formality: 80,
        humor: 60,
        enthusiasm: 90,
      });

      const persona = personaService.getPersona();
      expect(persona.formality).toBe(80);
      expect(persona.humor).toBe(60);
      expect(persona.enthusiasm).toBe(90);
    });

    it('should preserve non-updated parameters', () => {
      const originalVerbosity = DEFAULT_PERSONA.verbosity;

      personaService.updatePersona({ formality: 70 });

      const persona = personaService.getPersona();
      expect(persona.verbosity).toBe(originalVerbosity);
    });

    it('should handle empty updates', () => {
      const originalPersona = personaService.getPersona();

      personaService.updatePersona({});

      const updatedPersona = personaService.getPersona();
      expect(updatedPersona).toEqual(originalPersona);
    });

    it('should allow updating all parameters', () => {
      const customPersona: PersonaParameters = {
        formality: 90,
        verbosity: 80,
        humor: 10,
        enthusiasm: 95,
        empathy: 85,
        friendliness: 75,
        assertiveness: 65,
        patience: 88,
        optimism: 92,
        playfulness: 45,
        creativity: 78,
        technicality: 55,
        directness: 70,
        emojiUsage: 15,
        codeSnippets: 85,
        structuredOutput: 90,
        markdown: 95,
        exampleUsage: 80,
        analogy: 60,
        questioning: 50,
        reasoningDepth: 75,
        contextAwareness: 88,
        proactiveness: 65,
        interruptiveness: 20,
        suggestionFrequency: 70,
        confirmation: 60,
        errorTolerance: 85,
        learningFocus: 72,
      };

      personaService.updatePersona(customPersona);

      const persona = personaService.getPersona();
      expect(persona).toEqual(customPersona);
    });

    it('should handle sequential updates', () => {
      personaService.updatePersona({ formality: 30 });
      personaService.updatePersona({ humor: 70 });
      personaService.updatePersona({ enthusiasm: 85 });

      const persona = personaService.getPersona();
      expect(persona.formality).toBe(30);
      expect(persona.humor).toBe(70);
      expect(persona.enthusiasm).toBe(85);
    });
  });

  describe('setPreset', () => {
    it('should load valid preset', () => {
      const preset = PERSONA_PRESETS[0]; // First preset
      const result = personaService.setPreset(preset.name);

      expect(result).toBe(true);

      const persona = personaService.getPersona();
      expect(persona).toEqual(preset.parameters);
    });

    it('should return false for non-existent preset', () => {
      const result = personaService.setPreset('NonExistentPreset');

      expect(result).toBe(false);
    });

    it('should not modify persona when preset not found', () => {
      const originalPersona = personaService.getPersona();

      personaService.setPreset('InvalidPreset');

      const currentPersona = personaService.getPersona();
      expect(currentPersona).toEqual(originalPersona);
    });

    it('should load all available presets', () => {
      PERSONA_PRESETS.forEach((preset) => {
        const result = personaService.setPreset(preset.name);
        expect(result).toBe(true);

        const persona = personaService.getPersona();
        expect(persona).toEqual(preset.parameters);
      });
    });

    it('should override previous custom settings', () => {
      personaService.updatePersona({ formality: 99 });

      const preset = PERSONA_PRESETS[0];
      personaService.setPreset(preset.name);

      const persona = personaService.getPersona();
      expect(persona.formality).toBe(preset.parameters.formality);
      expect(persona.formality).not.toBe(99);
    });

    it('should be case-sensitive for preset names', () => {
      const preset = PERSONA_PRESETS[0];
      const result = personaService.setPreset(preset.name.toUpperCase());

      if (preset.name !== preset.name.toUpperCase()) {
        expect(result).toBe(false);
      }
    });
  });

  describe('resetToDefault', () => {
    it('should reset to default persona', () => {
      personaService.updatePersona({ formality: 99, humor: 10, enthusiasm: 5 });

      personaService.resetToDefault();

      const persona = personaService.getPersona();
      expect(persona).toEqual(DEFAULT_PERSONA);
    });

    it('should reset after preset was loaded', () => {
      personaService.setPreset(PERSONA_PRESETS[0].name);

      personaService.resetToDefault();

      const persona = personaService.getPersona();
      expect(persona).toEqual(DEFAULT_PERSONA);
    });

    it('should allow updates after reset', () => {
      personaService.updatePersona({ formality: 80 });
      personaService.resetToDefault();
      personaService.updatePersona({ humor: 90 });

      const persona = personaService.getPersona();
      expect(persona.formality).toBe(DEFAULT_PERSONA.formality);
      expect(persona.humor).toBe(90);
    });

    it('should handle multiple resets', () => {
      personaService.resetToDefault();
      personaService.resetToDefault();
      personaService.resetToDefault();

      const persona = personaService.getPersona();
      expect(persona).toEqual(DEFAULT_PERSONA);
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate prompt with default persona', () => {
      const prompt = personaService.generateSystemPrompt();

      expect(prompt).toContain('Garden of Eden');
      expect(prompt).toContain('Communication Style');
      expect(prompt).toContain('Tone & Personality');
      expect(prompt).toContain('Response Characteristics');
      expect(prompt).toContain('Proactivity');
      expect(prompt).toContain('Interaction Style');
    });

    it('should reflect updated parameters in prompt', () => {
      personaService.updatePersona({ formality: 90 });

      const prompt = personaService.generateSystemPrompt();

      expect(prompt).toContain('very formal');
    });

    it('should describe low values correctly', () => {
      personaService.updatePersona({ formality: 10 });

      const prompt = personaService.generateSystemPrompt();

      expect(prompt).toContain('very casual');
    });

    it('should describe moderate values correctly', () => {
      personaService.updatePersona({ formality: 50 });

      const prompt = personaService.generateSystemPrompt();

      expect(prompt).toMatch(/moderate|balanced/);
    });

    it('should describe high values correctly', () => {
      personaService.updatePersona({ enthusiasm: 85 });

      const prompt = personaService.generateSystemPrompt();

      expect(prompt).toContain('very enthusiastic');
    });

    it('should include all persona parameters', () => {
      const prompt = personaService.generateSystemPrompt();

      // Check for key parameters
      expect(prompt).toContain('Formality');
      expect(prompt).toContain('Verbosity');
      expect(prompt).toContain('Humor');
      expect(prompt).toContain('Enthusiasm');
      expect(prompt).toContain('Empathy');
      expect(prompt).toContain('Friendliness');
      expect(prompt).toContain('Assertiveness');
      expect(prompt).toContain('Patience');
      expect(prompt).toContain('Optimism');
      expect(prompt).toContain('Playfulness');
      expect(prompt).toContain('Creativity');
      expect(prompt).toContain('Technicality');
      expect(prompt).toContain('Directness');
      expect(prompt).toContain('emoji');
      expect(prompt).toContain('code');
      expect(prompt).toContain('Structured');
      expect(prompt).toContain('markdown');
    });

    it('should generate different prompts for different personas', () => {
      const prompt1 = personaService.generateSystemPrompt();

      personaService.updatePersona({ formality: 90, humor: 10, enthusiasm: 5 });
      const prompt2 = personaService.generateSystemPrompt();

      expect(prompt1).not.toBe(prompt2);
    });

    it('should describe emoji usage correctly', () => {
      personaService.updatePersona({ emojiUsage: 10 });
      let prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('no emojis');

      personaService.updatePersona({ emojiUsage: 30 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('occasional emojis');

      personaService.updatePersona({ emojiUsage: 50 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('moderate emoji usage');

      personaService.updatePersona({ emojiUsage: 70 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('frequent emojis');

      personaService.updatePersona({ emojiUsage: 90 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('very frequent emojis');
    });

    it('should describe code snippets preference correctly', () => {
      personaService.updatePersona({ codeSnippets: 30 });
      let prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('text explanations over code');

      personaService.updatePersona({ codeSnippets: 50 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('Balance text and code');

      personaService.updatePersona({ codeSnippets: 70 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('code-heavy responses');
    });

    it('should describe structured output preference correctly', () => {
      personaService.updatePersona({ structuredOutput: 30 });
      let prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('flowing, natural text');

      personaService.updatePersona({ structuredOutput: 50 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('Mix natural text');

      personaService.updatePersona({ structuredOutput: 70 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('structured formats');
    });

    it('should describe markdown usage correctly', () => {
      personaService.updatePersona({ markdown: 30 });
      let prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('simple');

      personaService.updatePersona({ markdown: 50 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('moderate markdown');

      personaService.updatePersona({ markdown: 70 });
      prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('rich markdown');
    });
  });

  describe('edge cases', () => {
    it('should handle extreme parameter values', () => {
      personaService.updatePersona({
        formality: 0,
        humor: 100,
      });

      const prompt = personaService.generateSystemPrompt();
      expect(prompt).toContain('very casual');
      expect(prompt).toContain('very humorous');
    });

    it('should handle boundary values', () => {
      personaService.updatePersona({
        formality: 20,
        humor: 40,
        enthusiasm: 60,
        empathy: 80,
      });

      const prompt = personaService.generateSystemPrompt();

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle rapid parameter changes', () => {
      for (let i = 0; i < 100; i++) {
        personaService.updatePersona({ formality: i % 100 });
      }

      const persona = personaService.getPersona();
      expect(persona.formality).toBe(99);
    });

    it('should handle preset loading and immediate update', () => {
      personaService.setPreset(PERSONA_PRESETS[0].name);
      personaService.updatePersona({ formality: 55 });

      const persona = personaService.getPersona();
      expect(persona.formality).toBe(55);
    });

    it('should handle updates with same values', () => {
      const originalPersona = personaService.getPersona();

      personaService.updatePersona({
        formality: originalPersona.formality,
        humor: originalPersona.humor,
      });

      const updatedPersona = personaService.getPersona();
      expect(updatedPersona).toEqual(originalPersona);
    });
  });

  describe('integration scenarios', () => {
    it('should support complete workflow: update -> preset -> update -> reset', () => {
      // Step 1: Custom update
      personaService.updatePersona({ formality: 70 });
      expect(personaService.getPersona().formality).toBe(70);

      // Step 2: Load preset
      const preset = PERSONA_PRESETS[0];
      personaService.setPreset(preset.name);
      expect(personaService.getPersona()).toEqual(preset.parameters);

      // Step 3: Another update
      personaService.updatePersona({ humor: 85 });
      expect(personaService.getPersona().humor).toBe(85);

      // Step 4: Reset
      personaService.resetToDefault();
      expect(personaService.getPersona()).toEqual(DEFAULT_PERSONA);
    });

    it('should maintain consistency across operations', () => {
      // Multiple operations
      personaService.updatePersona({ formality: 30 });
      const prompt1 = personaService.generateSystemPrompt();

      personaService.updatePersona({ humor: 90 });
      const prompt2 = personaService.generateSystemPrompt();

      // Both prompts should reflect the same formality
      expect(prompt1).toContain('casual');
      expect(prompt2).toContain('casual');
    });

    it('should handle concurrent-like updates correctly', () => {
      const updates = [
        { formality: 20 },
        { humor: 80 },
        { enthusiasm: 60 },
      ];

      updates.forEach(update => personaService.updatePersona(update));

      const persona = personaService.getPersona();
      expect(persona.formality).toBe(20);
      expect(persona.humor).toBe(80);
      expect(persona.enthusiasm).toBe(60);
    });
  });

  describe('parameter ranges', () => {
    it('should accept all parameters from 0-100', () => {
      const allParams: PersonaParameters = {
        formality: 0,
        verbosity: 10,
        humor: 20,
        enthusiasm: 30,
        empathy: 40,
        friendliness: 50,
        assertiveness: 60,
        patience: 70,
        optimism: 80,
        playfulness: 90,
        creativity: 100,
        technicality: 15,
        directness: 25,
        emojiUsage: 35,
        codeSnippets: 45,
        structuredOutput: 55,
        markdown: 65,
        exampleUsage: 75,
        analogy: 85,
        questioning: 95,
        reasoningDepth: 5,
        contextAwareness: 50,
        proactiveness: 50,
        interruptiveness: 50,
        suggestionFrequency: 50,
        confirmation: 50,
        errorTolerance: 50,
        learningFocus: 50,
      };

      personaService.updatePersona(allParams);

      const persona = personaService.getPersona();
      Object.keys(allParams).forEach(key => {
        expect(persona[key as keyof PersonaParameters]).toBe(allParams[key as keyof PersonaParameters]);
      });
    });
  });
});

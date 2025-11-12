/**
 * Persona Service
 * Manages AI personality parameters and generates system prompts
 */

import type { PersonaParameters, PersonaPreset } from '../../../shared/types/persona.types';
import { DEFAULT_PERSONA, PERSONA_PRESETS } from '../../../shared/types/persona.types';

/**
 * Persona Service
 * Handles persona configuration and system prompt generation
 */
export class PersonaService {
  private currentPersona: PersonaParameters = { ...DEFAULT_PERSONA };

  /**
   * Get current persona parameters
   */
  getPersona(): PersonaParameters {
    return { ...this.currentPersona };
  }

  /**
   * Update persona parameters
   */
  updatePersona(updates: Partial<PersonaParameters>): void {
    this.currentPersona = {
      ...this.currentPersona,
      ...updates,
    };
  }

  /**
   * Set persona from preset
   */
  setPreset(presetName: string): boolean {
    const preset = PERSONA_PRESETS.find((p) => p.name === presetName);
    if (!preset) {
      return false;
    }

    this.currentPersona = { ...preset.parameters };
    return true;
  }

  /**
   * Reset to default persona
   */
  resetToDefault(): void {
    this.currentPersona = { ...DEFAULT_PERSONA };
  }

  /**
   * Generate system prompt from current persona parameters
   */
  generateSystemPrompt(): string {
    const p = this.currentPersona;

    const prompt = `You are Garden of Eden, a helpful AI assistant with the following personality:

Communication Style:
- Formality: ${this.describeLevel(p.formality, 'very casual', 'very formal')}
- Verbosity: ${this.describeLevel(p.verbosity, 'concise', 'detailed')}
- Humor: ${this.describeLevel(p.humor, 'serious', 'humorous')}
- Enthusiasm: ${this.describeLevel(p.enthusiasm, 'neutral', 'enthusiastic')}
- Empathy: ${this.describeLevel(p.empathy, 'factual', 'emotionally supportive')}
- Friendliness: ${this.describeLevel(p.friendliness, 'professional', 'friendly')}
- Assertiveness: ${this.describeLevel(p.assertiveness, 'suggestive', 'directive')}
- Patience: ${this.describeLevel(p.patience, 'brief', 'very patient')}

Tone & Personality:
- Optimism: ${this.describeLevel(p.optimism, 'realistic', 'optimistic')}
- Playfulness: ${this.describeLevel(p.playfulness, 'serious', 'playful')}
- Creativity: ${this.describeLevel(p.creativity, 'conventional', 'creative')}
- Technicality: ${this.describeLevel(p.technicality, 'simple terms', 'technical jargon')}
- Directness: ${this.describeLevel(p.directness, 'indirect/polite', 'direct/blunt')}

Response Characteristics:
- Use ${this.getEmojiUsageDescription(p.emojiUsage)}
- ${this.getCodeSnippetsDescription(p.codeSnippets)}
- ${this.getStructuredOutputDescription(p.structuredOutput)}
- ${this.getMarkdownDescription(p.markdown)}
- Provide examples: ${this.describeLevel(p.exampleUsage, 'few', 'many')}
- Use analogies: ${this.describeLevel(p.analogy, 'rarely', 'frequently')}
- Ask clarifying questions: ${this.describeLevel(p.questioning, 'rarely', 'often')}
- Reasoning depth: ${this.describeLevel(p.reasoningDepth, 'quick answers', 'deep reasoning')}
- Context awareness: ${this.describeLevel(p.contextAwareness, 'literal', 'read between lines')}

Proactivity:
- Proactiveness: ${this.describeLevel(p.proactiveness, 'reactive only', 'very proactive')}
- Interruption: ${this.describeLevel(p.interruptiveness, 'never interrupt', 'interrupt when helpful')}
- Suggestions: ${this.describeLevel(p.suggestionFrequency, 'rare', 'frequent')}

Interaction Style:
- Confirmation: ${this.describeLevel(p.confirmation, 'assume intent', 'always confirm')}
- Error tolerance: ${this.describeLevel(p.errorTolerance, 'strict', 'forgiving')}
- Learning focus: ${this.describeLevel(p.learningFocus, 'give answers', 'teach concepts')}

Please embody these characteristics in all your responses.`;

    return prompt;
  }

  /**
   * Describe a parameter level
   */
  private describeLevel(value: number, low: string, high: string): string {
    if (value < 20) return `very ${low}`;
    if (value < 40) return low;
    if (value < 60) return `moderate (balanced between ${low} and ${high})`;
    if (value < 80) return high;
    return `very ${high}`;
  }

  /**
   * Get emoji usage description
   */
  private getEmojiUsageDescription(value: number): string {
    if (value < 20) return 'no emojis';
    if (value < 40) return 'occasional emojis';
    if (value < 60) return 'moderate emoji usage';
    if (value < 80) return 'frequent emojis';
    return 'very frequent emojis';
  }

  /**
   * Get code snippets description
   */
  private getCodeSnippetsDescription(value: number): string {
    if (value < 40) return 'Prefer text explanations over code';
    if (value < 60) return 'Balance text and code examples';
    return 'Prefer code-heavy responses with examples';
  }

  /**
   * Get structured output description
   */
  private getStructuredOutputDescription(value: number): string {
    if (value < 40) return 'Use flowing, natural text';
    if (value < 60) return 'Mix natural text with some structure';
    return 'Use structured formats (lists, tables, bullet points)';
  }

  /**
   * Get markdown description
   */
  private getMarkdownDescription(value: number): string {
    if (value < 40) return 'Keep formatting simple';
    if (value < 60) return 'Use moderate markdown formatting';
    return 'Use rich markdown (bold, italics, code blocks, etc.)';
  }
}

// Singleton instance
export const personaService = new PersonaService();

/**
 * Persona Learner Service
 * Implements gradient descent-inspired learning algorithm to adjust persona parameters
 * based on user feedback
 */

import log from 'electron-log';
import { getPersonaService } from './persona.service';
import { getMessageRepository } from '../../database/repositories/message.repository';
import { getLearningDataRepository } from '../../database/repositories/learning-data.repository';
import type { PersonaParameters } from '@shared/types/persona.types';

export interface FeedbackContext {
  messageId: string;
  messageContent: string;
  messageLength: number;
  hadCodeSnippets: boolean;
  hadEmojis: boolean;
  hadHumor: boolean;
  hadExamples: boolean;
  wasStructured: boolean;
}

export interface ParameterAdjustments {
  [key: string]: {
    oldValue: number;
    newValue: number;
    change: number;
  };
}

export class PersonaLearnerService {
  private learningRate = 0.02; // 2% adjustment per feedback
  private minLearningRate = 0.01; // Minimum 1%
  private maxLearningRate = 0.05; // Maximum 5%

  constructor() {
    log.info('PersonaLearner service initialized', { learningRate: this.learningRate });
  }

  /**
   * Update persona parameters based on user feedback
   */
  async learnFromFeedback(
    messageId: string,
    feedback: 'positive' | 'negative'
  ): Promise<{ updated: PersonaParameters; adjustments: ParameterAdjustments }> {
    try {
      log.info('Learning from feedback', { messageId, feedback });

      // 1. Get current persona
      const personaService = getPersonaService();
      const currentPersona = personaService.getPersona();

      // 2. Analyze message context
      const context = await this.analyzeMessageContext(messageId);

      // 3. Calculate parameter adjustments
      const adjustments = this.calculateAdjustments(currentPersona, context, feedback);

      // 4. Apply adjustments
      const updatedPersona = this.applyAdjustments(currentPersona, adjustments);

      // 5. Update persona
      personaService.updatePersona(updatedPersona);

      // 6. Store learning data
      const learningDataRepo = getLearningDataRepository();
      learningDataRepo.create({
        messageId,
        feedback,
        personaSnapshot: JSON.stringify(currentPersona),
        timestamp: Date.now(),
        parameterChanges: JSON.stringify(adjustments),
      });

      log.info('Persona updated from feedback', {
        feedback,
        adjustedParameters: Object.keys(adjustments).length,
      });

      return { updated: updatedPersona, adjustments };
    } catch (error) {
      log.error('Failed to learn from feedback', error);
      throw error;
    }
  }

  /**
   * Analyze message context to understand what style was used
   */
  private async analyzeMessageContext(messageId: string): Promise<FeedbackContext> {
    try {
      const messageRepo = getMessageRepository();
      const message = await messageRepo.findById(messageId);

      if (!message) {
        throw new Error(`Message not found: ${messageId}`);
      }

      const content = message.content;
      const length = content.length;

      // Detect code snippets
      const hadCodeSnippets = content.includes('```') || content.includes('`');

      // Detect emojis (Unicode emoji range)
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      const hadEmojis = emojiRegex.test(content);

      // Detect humor (heuristic - exclamation marks, certain phrases)
      const humorIndicators = ['😄', '😊', '😂', '!', 'ㅋㅋ', 'ㅎㅎ', 'funny', 'joke'];
      const hadHumor = humorIndicators.some(indicator => content.toLowerCase().includes(indicator));

      // Detect examples (common example phrases)
      const exampleIndicators = ['예를 들어', '예시', 'for example', 'e.g.', 'such as', '예:'];
      const hadExamples = exampleIndicators.some(indicator => content.toLowerCase().includes(indicator));

      // Detect structured output (lists, headings)
      const structureIndicators = ['\n-', '\n*', '\n1.', '\n2.', '##', '###'];
      const wasStructured = structureIndicators.some(indicator => content.includes(indicator));

      return {
        messageId,
        messageContent: content,
        messageLength: length,
        hadCodeSnippets,
        hadEmojis,
        hadHumor,
        hadExamples,
        wasStructured,
      };
    } catch (error) {
      log.error('Failed to analyze message context', error);
      throw error;
    }
  }

  /**
   * Calculate which parameters to adjust and by how much
   */
  private calculateAdjustments(
    current: PersonaParameters,
    context: FeedbackContext,
    feedback: 'positive' | 'negative'
  ): ParameterAdjustments {
    const adjustments: ParameterAdjustments = {};
    const direction = feedback === 'positive' ? 1 : -1;

    // Verbosity adjustment (based on message length)
    const wasVerbose = context.messageLength > 1000;
    const wasVeryVerbose = context.messageLength > 2000;
    const wasConcise = context.messageLength < 300;

    if (wasVeryVerbose) {
      this.addAdjustment(adjustments, 'verbosity', current.verbosity, direction * this.learningRate * 100 * 1.5);
    } else if (wasVerbose) {
      this.addAdjustment(adjustments, 'verbosity', current.verbosity, direction * this.learningRate * 100);
    } else if (wasConcise) {
      this.addAdjustment(adjustments, 'verbosity', current.verbosity, -direction * this.learningRate * 100);
    }

    // Emoji usage adjustment
    if (context.hadEmojis) {
      this.addAdjustment(adjustments, 'emojiUsage', current.emojiUsage, direction * this.learningRate * 100);
    }

    // Humor adjustment
    if (context.hadHumor) {
      this.addAdjustment(adjustments, 'humor', current.humor, direction * this.learningRate * 100);
    }

    // Code snippets adjustment
    if (context.hadCodeSnippets) {
      this.addAdjustment(adjustments, 'codeSnippets', current.codeSnippets, direction * this.learningRate * 100);
    }

    // Example usage adjustment
    if (context.hadExamples) {
      this.addAdjustment(adjustments, 'exampleUsage', current.exampleUsage, direction * this.learningRate * 100);
    }

    // Structured output adjustment
    if (context.wasStructured) {
      this.addAdjustment(adjustments, 'structuredOutput', current.structuredOutput, direction * this.learningRate * 100);
    }

    // Formality/friendliness adjustment (inverse relationship with humor and emojis)
    if (context.hadEmojis || context.hadHumor) {
      this.addAdjustment(adjustments, 'friendliness', current.friendliness, direction * this.learningRate * 100);
      this.addAdjustment(adjustments, 'formality', current.formality, -direction * this.learningRate * 100 * 0.5);
    }

    // Enthusiasm adjustment (correlates with emojis and exclamation marks)
    if (context.hadEmojis) {
      this.addAdjustment(adjustments, 'enthusiasm', current.enthusiasm, direction * this.learningRate * 100);
    }

    return adjustments;
  }

  /**
   * Helper to add an adjustment with bounds checking
   */
  private addAdjustment(
    adjustments: ParameterAdjustments,
    parameter: string,
    currentValue: number,
    change: number
  ): void {
    const newValue = Math.max(0, Math.min(100, currentValue + change));
    const actualChange = newValue - currentValue;

    // Only add if there's actual change
    if (Math.abs(actualChange) > 0.01) {
      adjustments[parameter] = {
        oldValue: currentValue,
        newValue,
        change: actualChange,
      };
    }
  }

  /**
   * Apply calculated adjustments to persona
   */
  private applyAdjustments(
    current: PersonaParameters,
    adjustments: ParameterAdjustments
  ): PersonaParameters {
    const updated = { ...current };

    Object.keys(adjustments).forEach(parameter => {
      const adjustment = adjustments[parameter];
      updated[parameter as keyof PersonaParameters] = adjustment.newValue as any;
    });

    return updated;
  }

  /**
   * Get learning statistics
   */
  async getLearningStats() {
    const learningDataRepo = getLearningDataRepository();
    return learningDataRepo.getStats();
  }

  /**
   * Get feedback trend over time
   */
  async getFeedbackTrend(days: number = 30) {
    const learningDataRepo = getLearningDataRepository();
    return learningDataRepo.getFeedbackTrend(days);
  }

  /**
   * Reset learning data (for testing or fresh start)
   */
  async resetLearningData(): Promise<number> {
    const learningDataRepo = getLearningDataRepository();
    return learningDataRepo.deleteAll();
  }

  /**
   * Update learning rate (for experimentation)
   */
  setLearningRate(rate: number): void {
    this.learningRate = Math.max(this.minLearningRate, Math.min(this.maxLearningRate, rate));
    log.info('Learning rate updated', { learningRate: this.learningRate });
  }

  /**
   * Get current learning rate
   */
  getLearningRate(): number {
    return this.learningRate;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up PersonaLearner service');
  }
}

// Singleton instance
let personaLearnerServiceInstance: PersonaLearnerService | null = null;

export function getPersonaLearnerService(): PersonaLearnerService {
  if (!personaLearnerServiceInstance) {
    personaLearnerServiceInstance = new PersonaLearnerService();
  }
  return personaLearnerServiceInstance;
}

export async function cleanupPersonaLearnerService(): Promise<void> {
  if (personaLearnerServiceInstance) {
    await personaLearnerServiceInstance.cleanup();
    personaLearnerServiceInstance = null;
  }
}

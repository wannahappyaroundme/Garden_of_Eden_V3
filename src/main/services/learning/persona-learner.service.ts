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
  // Learning rate configuration
  private learningRate = 0.02; // 2% adjustment per feedback
  private minLearningRate = 0.005; // Minimum 0.5% (reduced for stability)
  private maxLearningRate = 0.05; // Maximum 5%

  // Overfitting prevention parameters
  private l2Lambda = 0.01; // L2 regularization strength
  private maxParameterChangePerUpdate = 5.0; // Max change per update (0-100 scale)
  private maxParameterChangePerEpoch = 15.0; // Max total change per epoch
  private momentumBeta = 0.9; // Momentum smoothing factor
  private gradientClipMax = 1.0; // Gradient clipping threshold

  // Momentum tracking (for smoothing updates)
  private parameterMomentum: { [key: string]: number } = {};

  // Validation tracking
  private validationEnabled = true;
  private feedbackHistory: Array<{ feedback: 'positive' | 'negative'; timestamp: number }> = [];
  private validationSplitRatio = 0.2; // 20% for validation
  private minValidationSamples = 50;

  // Early stopping
  private earlyStoppingEnabled = true;
  private earlyStoppingPatience = 20; // Wait 20 feedbacks without improvement
  private earlyStoppingCounter = 0;
  private bestValidationScore = 0;
  private bestPersonaSnapshot: PersonaParameters | null = null;

  // Checkpointing for rollback
  private checkpointInterval = 50; // Save every 50 feedbacks
  private feedbackCount = 0;

  // Experience replay buffer (prevent catastrophic forgetting)
  private experienceBuffer: Array<{ messageId: string; feedback: 'positive' | 'negative' }> = [];
  private maxBufferSize = 500;
  private replaySamplesPerUpdate = 3;

  constructor() {
    log.info('PersonaLearner service initialized with overfitting prevention', {
      learningRate: this.learningRate,
      l2Lambda: this.l2Lambda,
      momentumBeta: this.momentumBeta,
      earlyStoppingPatience: this.earlyStoppingPatience,
    });
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

      // Track feedback count
      this.feedbackCount++;

      // Add to feedback history
      this.feedbackHistory.push({ feedback, timestamp: Date.now() });

      // Add to experience replay buffer
      this.experienceBuffer.push({ messageId, feedback });
      if (this.experienceBuffer.length > this.maxBufferSize) {
        this.experienceBuffer.shift(); // Remove oldest
      }

      // Check if we have enough feedback samples to start learning
      if (this.feedbackCount < 5) {
        log.info('Waiting for minimum feedback samples', {
          current: this.feedbackCount,
          required: 5,
        });
        return { updated: getPersonaService().getPersona(), adjustments: {} };
      }

      // 1. Get current persona
      const personaService = getPersonaService();
      const currentPersona = personaService.getPersona();

      // 2. Check early stopping
      if (this.shouldStopLearning()) {
        log.warn('Early stopping triggered - restoring best persona');
        if (this.bestPersonaSnapshot) {
          personaService.updatePersona(this.bestPersonaSnapshot);
          return { updated: this.bestPersonaSnapshot, adjustments: {} };
        }
      }

      // 3. Analyze message context
      const context = await this.analyzeMessageContext(messageId);

      // 4. Calculate parameter adjustments
      const adjustments = this.calculateAdjustments(currentPersona, context, feedback);

      // 5. Apply adjustments
      const updatedPersona = this.applyAdjustments(currentPersona, adjustments);

      // 6. Validate total parameter shift
      const totalShift = this.calculateTotalParameterShift(currentPersona, updatedPersona);
      if (totalShift > this.maxParameterChangePerEpoch) {
        log.warn('Total parameter shift exceeds limit, scaling down', {
          totalShift,
          maxAllowed: this.maxParameterChangePerEpoch,
        });
        // Scale down all adjustments proportionally
        const scaleFactor = this.maxParameterChangePerEpoch / totalShift;
        Object.keys(adjustments).forEach(param => {
          adjustments[param].change *= scaleFactor;
          adjustments[param].newValue =
            adjustments[param].oldValue + adjustments[param].change;
        });
      }

      // 7. Update persona
      personaService.updatePersona(updatedPersona);

      // 8. Perform validation and update early stopping
      const validationScore = this.calculateValidationScore();
      this.updateEarlyStopping(validationScore, updatedPersona);

      // 9. Checkpoint if needed
      if (this.feedbackCount % this.checkpointInterval === 0) {
        await this.saveCheckpoint(updatedPersona);
      }

      // 10. Perform experience replay (learn from old samples)
      await this.performExperienceReplay();

      // 11. Store learning data
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
        totalShift,
        validationScore,
        earlyStoppingCounter: this.earlyStoppingCounter,
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
   * Helper to add an adjustment with bounds checking and regularization
   */
  private addAdjustment(
    adjustments: ParameterAdjustments,
    parameter: string,
    currentValue: number,
    change: number
  ): void {
    // Apply L2 regularization (weight decay towards center - 50)
    const l2Penalty = this.l2Lambda * (currentValue - 50);
    const regularizedChange = change - l2Penalty;

    // Apply gradient clipping to prevent large jumps
    const clippedChange = this.clipGradient(regularizedChange);

    // Apply momentum smoothing
    const smoothedChange = this.applyMomentum(parameter, clippedChange);

    // Limit maximum change per update
    const limitedChange = Math.max(
      -this.maxParameterChangePerUpdate,
      Math.min(this.maxParameterChangePerUpdate, smoothedChange)
    );

    const newValue = Math.max(0, Math.min(100, currentValue + limitedChange));
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
   * Clip gradient to prevent unstable updates
   */
  private clipGradient(gradient: number): number {
    const norm = Math.abs(gradient);
    if (norm > this.gradientClipMax) {
      return (gradient / norm) * this.gradientClipMax;
    }
    return gradient;
  }

  /**
   * Apply momentum to smooth parameter updates
   */
  private applyMomentum(parameter: string, gradient: number): number {
    if (!this.parameterMomentum[parameter]) {
      this.parameterMomentum[parameter] = 0;
    }

    // Momentum formula: v_t = β * v_{t-1} + (1 - β) * gradient
    this.parameterMomentum[parameter] =
      this.momentumBeta * this.parameterMomentum[parameter] +
      (1 - this.momentumBeta) * gradient;

    return this.parameterMomentum[parameter];
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
   * Calculate total parameter shift between two persona states
   */
  private calculateTotalParameterShift(
    before: PersonaParameters,
    after: PersonaParameters
  ): number {
    let totalShift = 0;
    const params = Object.keys(before) as Array<keyof PersonaParameters>;

    params.forEach(param => {
      const beforeVal = before[param] as number;
      const afterVal = after[param] as number;
      totalShift += Math.abs(afterVal - beforeVal);
    });

    return totalShift;
  }

  /**
   * Calculate validation score (positive feedback ratio)
   */
  private calculateValidationScore(): number {
    if (this.feedbackHistory.length < this.minValidationSamples) {
      return 0;
    }

    // Use last 20% of feedback as validation set
    const validationSize = Math.floor(this.feedbackHistory.length * this.validationSplitRatio);
    const validationSet = this.feedbackHistory.slice(-validationSize);

    const positiveCount = validationSet.filter(f => f.feedback === 'positive').length;
    return positiveCount / validationSet.length;
  }

  /**
   * Update early stopping mechanism
   */
  private updateEarlyStopping(validationScore: number, currentPersona: PersonaParameters): void {
    if (!this.earlyStoppingEnabled) return;

    if (validationScore > this.bestValidationScore + 0.01) {
      // Improvement detected
      this.bestValidationScore = validationScore;
      this.bestPersonaSnapshot = { ...currentPersona };
      this.earlyStoppingCounter = 0;
      log.info('Validation score improved', {
        score: validationScore,
        bestScore: this.bestValidationScore,
      });
    } else {
      // No improvement
      this.earlyStoppingCounter++;
      log.info('No validation improvement', {
        counter: this.earlyStoppingCounter,
        patience: this.earlyStoppingPatience,
      });
    }
  }

  /**
   * Check if we should stop learning
   */
  private shouldStopLearning(): boolean {
    if (!this.earlyStoppingEnabled) return false;
    return this.earlyStoppingCounter >= this.earlyStoppingPatience;
  }

  /**
   * Save checkpoint for rollback
   */
  private async saveCheckpoint(persona: PersonaParameters): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { app } = await import('electron');

      const checkpointDir = path.join(app.getPath('userData'), 'checkpoints');
      await fs.mkdir(checkpointDir, { recursive: true });

      const checkpointPath = path.join(
        checkpointDir,
        `persona_checkpoint_${this.feedbackCount}.json`
      );

      await fs.writeFile(
        checkpointPath,
        JSON.stringify(
          {
            persona,
            feedbackCount: this.feedbackCount,
            validationScore: this.bestValidationScore,
            timestamp: Date.now(),
          },
          null,
          2
        )
      );

      log.info('Checkpoint saved', { path: checkpointPath, feedbackCount: this.feedbackCount });
    } catch (error) {
      log.error('Failed to save checkpoint', error);
    }
  }

  /**
   * Perform experience replay to prevent catastrophic forgetting
   */
  private async performExperienceReplay(): Promise<void> {
    if (this.experienceBuffer.length < this.replaySamplesPerUpdate) {
      return;
    }

    try {
      // Randomly sample old experiences
      const samples = this.sampleExperiences(this.replaySamplesPerUpdate);

      for (const sample of samples) {
        // Re-learn from old feedback (with lower learning rate)
        const oldLearningRate = this.learningRate;
        this.learningRate *= 0.5; // Use 50% learning rate for replay

        const context = await this.analyzeMessageContext(sample.messageId);
        const currentPersona = getPersonaService().getPersona();
        const adjustments = this.calculateAdjustments(currentPersona, context, sample.feedback);
        const updatedPersona = this.applyAdjustments(currentPersona, adjustments);

        getPersonaService().updatePersona(updatedPersona);

        this.learningRate = oldLearningRate; // Restore original learning rate
      }

      log.info('Experience replay completed', { samplesReplayed: samples.length });
    } catch (error) {
      log.error('Experience replay failed', error);
    }
  }

  /**
   * Sample random experiences from buffer
   */
  private sampleExperiences(
    count: number
  ): Array<{ messageId: string; feedback: 'positive' | 'negative' }> {
    const samples: Array<{ messageId: string; feedback: 'positive' | 'negative' }> = [];
    const bufferCopy = [...this.experienceBuffer];

    for (let i = 0; i < count && bufferCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * bufferCopy.length);
      samples.push(bufferCopy[randomIndex]);
      bufferCopy.splice(randomIndex, 1);
    }

    return samples;
  }

  /**
   * Detect overfitting indicators
   */
  async detectOverfitting(): Promise<{
    isOverfitting: boolean;
    indicators: string[];
    recommendations: string[];
  }> {
    const indicators: string[] = [];
    const recommendations: string[] = [];

    // Check train-validation gap
    const recentFeedback = this.feedbackHistory.slice(-50);
    if (recentFeedback.length >= 20) {
      const trainSet = recentFeedback.slice(0, -10);
      const valSet = recentFeedback.slice(-10);

      const trainScore = trainSet.filter(f => f.feedback === 'positive').length / trainSet.length;
      const valScore = valSet.filter(f => f.feedback === 'positive').length / valSet.length;

      const gap = trainScore - valScore;
      if (gap > 0.2) {
        indicators.push(`Large train-validation gap: ${gap.toFixed(2)}`);
        recommendations.push('Reduce learning rate by 50%');
        recommendations.push('Increase L2 regularization');
      }
    }

    // Check parameter volatility
    if (this.feedbackCount >= 20) {
      const learningDataRepo = getLearningDataRepository();
      const recentChanges = await learningDataRepo.getRecentChanges(20);

      let totalVolatility = 0;
      recentChanges.forEach(change => {
        const changes = JSON.parse(change.parameterChanges || '{}');
        Object.values(changes).forEach((c: any) => {
          totalVolatility += Math.abs(c.change);
        });
      });

      if (totalVolatility > 100) {
        indicators.push(`High parameter volatility: ${totalVolatility.toFixed(1)}`);
        recommendations.push('Increase momentum (beta = 0.95)');
        recommendations.push('Enable gradient clipping');
      }
    }

    // Check negative feedback spike
    const lastTenFeedbacks = this.feedbackHistory.slice(-10);
    if (lastTenFeedbacks.length === 10) {
      const negativeCount = lastTenFeedbacks.filter(f => f.feedback === 'negative').length;
      if (negativeCount >= 6) {
        indicators.push(`Negative feedback spike: ${negativeCount}/10`);
        recommendations.push('Rollback to previous checkpoint');
        recommendations.push('Reduce learning rate immediately');
      }
    }

    const isOverfitting = indicators.length > 0;

    if (isOverfitting) {
      log.warn('Overfitting detected', { indicators, recommendations });
    }

    return { isOverfitting, indicators, recommendations };
  }

  /**
   * Apply overfitting prevention actions
   */
  async applyOverfittingPrevention(recommendations: string[]): Promise<void> {
    for (const recommendation of recommendations) {
      if (recommendation.includes('Reduce learning rate')) {
        this.learningRate *= 0.5;
        log.info('Learning rate reduced', { newRate: this.learningRate });
      } else if (recommendation.includes('Increase momentum')) {
        this.momentumBeta = 0.95;
        log.info('Momentum increased', { newBeta: this.momentumBeta });
      } else if (recommendation.includes('Rollback')) {
        await this.rollbackToCheckpoint();
      }
    }
  }

  /**
   * Rollback to last checkpoint
   */
  private async rollbackToCheckpoint(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { app } = await import('electron');

      const checkpointDir = path.join(app.getPath('userData'), 'checkpoints');
      const files = await fs.readdir(checkpointDir);

      // Find most recent checkpoint
      const checkpointFiles = files
        .filter(f => f.startsWith('persona_checkpoint_'))
        .sort()
        .reverse();

      if (checkpointFiles.length === 0) {
        log.warn('No checkpoints available for rollback');
        return;
      }

      const latestCheckpoint = checkpointFiles[0];
      const checkpointPath = path.join(checkpointDir, latestCheckpoint);
      const checkpointData = JSON.parse(await fs.readFile(checkpointPath, 'utf-8'));

      getPersonaService().updatePersona(checkpointData.persona);
      this.bestPersonaSnapshot = checkpointData.persona;

      log.info('Rolled back to checkpoint', {
        checkpoint: latestCheckpoint,
        feedbackCount: checkpointData.feedbackCount,
      });
    } catch (error) {
      log.error('Failed to rollback to checkpoint', error);
    }
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

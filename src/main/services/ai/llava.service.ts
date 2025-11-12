/**
 * LLaVA Service
 * Manages LLaVA 7B model for vision-language understanding
 * Analyzes screen captures to understand user context
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import log from 'electron-log';
import type { ContextLevel } from '../screen/capture.service';

// Types for vision model (will be imported dynamically)
type VisionPipeline = any;

export interface LLaVAConfig {
  modelPath: string;
  maxTokens?: number;
  temperature?: number;
}

export interface VisionAnalysisResult {
  description: string;
  confidence: number;
  detectedObjects?: string[];
  suggestedActions?: string[];
  contextLevel: ContextLevel;
  processingTime: number;
}

/**
 * LLaVA Service
 * Handles local vision-language model for screen understanding
 */
export class LLaVAService {
  private pipeline: VisionPipeline | null = null;
  private config: LLaVAConfig;
  private isLoading: boolean = false;
  private isInitialized: boolean = false;

  constructor(config: LLaVAConfig) {
    this.config = {
      maxTokens: 512,
      temperature: 0.7,
      ...config,
    };
  }

  /**
   * Initialize and load the LLaVA model
   */
  async initialize(): Promise<void> {
    if (this.isLoading) {
      throw new Error('LLaVA model is already loading');
    }

    if (this.isInitialized) {
      log.info('LLaVA model already initialized');
      return;
    }

    this.isLoading = true;

    try {
      log.info('Loading LLaVA model...', { path: this.config.modelPath });

      // Check if model directory exists
      try {
        await fs.access(this.config.modelPath);
      } catch {
        log.warn(
          `LLaVA model not found: ${this.config.modelPath}. Please run 'npm run download:llava' first.`
        );
        this.isLoading = false;
        return;
      }

      // Dynamically import @huggingface/transformers (ES Module)
      const { pipeline } = await import('@huggingface/transformers');

      // Create vision-text-to-text pipeline
      log.info('Creating LLaVA pipeline...');
      this.pipeline = await pipeline('image-to-text', this.config.modelPath, {
        device: 'cpu', // Use CPU for stability (GPU acceleration coming soon)
      });

      log.info('LLaVA model loaded successfully');
      this.isInitialized = true;
    } catch (error) {
      log.error('Failed to initialize LLaVA model:', error);
      this.isLoading = false;
      throw error;
    }

    this.isLoading = false;
  }

  /**
   * Analyze a single screen image
   */
  async analyzeScreen(
    imagePath: string,
    prompt?: string,
    contextLevel: ContextLevel = 1
  ): Promise<VisionAnalysisResult> {
    await this.ensureInitialized();

    if (!this.pipeline) {
      throw new Error('LLaVA pipeline not initialized');
    }

    try {
      log.info('Analyzing screen image', { path: imagePath, contextLevel });

      // Check if image exists
      await fs.access(imagePath);

      const startTime = Date.now();

      // Default prompt based on context level
      let analysisPrompt = prompt;
      if (!analysisPrompt) {
        switch (contextLevel) {
          case 1:
            analysisPrompt = 'Describe what you see on this screen. What is the user currently doing?';
            break;
          case 2:
            analysisPrompt =
              'Analyze this screen in the context of recent work. What task is the user working on?';
            break;
          case 3:
            analysisPrompt =
              'Provide a deep analysis of this screen. What is the project about? What are the key insights?';
            break;
        }
      }

      // Run vision analysis
      const result = await this.pipeline(imagePath, {
        prompt: analysisPrompt,
        max_new_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const processingTime = Date.now() - startTime;

      log.info('Screen analysis complete', {
        processingTime,
        descriptionLength: result.generated_text?.length || 0
      });

      // Parse result and extract insights
      const description = result.generated_text || result.text || '';

      return {
        description,
        confidence: result.confidence || 0.8,
        detectedObjects: this.extractObjects(description),
        suggestedActions: this.extractActions(description, contextLevel),
        contextLevel,
        processingTime,
      };
    } catch (error) {
      log.error('Failed to analyze screen:', error);
      throw error;
    }
  }

  /**
   * Analyze multiple screens (for multi-monitor or recent history)
   */
  async analyzeMultipleScreens(
    imagePaths: string[],
    contextLevel: ContextLevel = 2
  ): Promise<VisionAnalysisResult[]> {
    const results: VisionAnalysisResult[] = [];

    for (const imagePath of imagePaths) {
      try {
        const result = await this.analyzeScreen(imagePath, undefined, contextLevel);
        results.push(result);
      } catch (error) {
        log.error('Failed to analyze screen:', imagePath, error);
        // Continue with other images
      }
    }

    return results;
  }

  /**
   * Generate contextual summary from multiple analyses
   */
  async generateContextSummary(analyses: VisionAnalysisResult[]): Promise<string> {
    if (analyses.length === 0) {
      return 'No screen context available.';
    }

    if (analyses.length === 1) {
      return analyses[0].description;
    }

    // Combine multiple analyses into a coherent summary
    const descriptions = analyses.map((a, i) => `[Screen ${i + 1}] ${a.description}`).join('\n\n');

    // TODO: Use LLM to summarize multiple descriptions
    // For now, just concatenate
    return `Summary of ${analyses.length} screens:\n\n${descriptions}`;
  }

  /**
   * Extract detected objects from description
   */
  private extractObjects(description: string): string[] {
    // Simple keyword extraction (TODO: improve with NER)
    const keywords: string[] = [];
    const objectPatterns = [
      /(?:see|showing|display(?:ing)?|contains?)\s+(?:a\s+)?(\w+(?:\s+\w+)?)/gi,
      /there\s+(?:is|are)\s+(?:a\s+)?(\w+(?:\s+\w+)?)/gi,
    ];

    for (const pattern of objectPatterns) {
      const matches = description.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          keywords.push(match[1].toLowerCase());
        }
      }
    }

    return [...new Set(keywords)].slice(0, 10); // Return unique top 10
  }

  /**
   * Extract suggested actions from description
   */
  private extractActions(description: string, contextLevel: ContextLevel): string[] {
    const actions: string[] = [];

    // Level 1: Simple suggestions
    if (contextLevel === 1) {
      if (description.includes('code') || description.includes('editor')) {
        actions.push('Assist with code review or debugging');
      }
      if (description.includes('browser') || description.includes('website')) {
        actions.push('Summarize web content');
      }
      if (description.includes('terminal') || description.includes('command')) {
        actions.push('Explain command or suggest next steps');
      }
    }

    // Level 2: Contextual suggestions
    if (contextLevel === 2) {
      actions.push('Review recent work progress');
      actions.push('Suggest next task based on current work');
    }

    // Level 3: Deep insights
    if (contextLevel === 3) {
      actions.push('Provide project-level insights');
      actions.push('Suggest architectural improvements');
      actions.push('Identify potential issues or blockers');
    }

    return actions;
  }

  /**
   * Check if model is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.pipeline !== null;
  }

  /**
   * Ensure model is initialized (lazy initialization)
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isReady()) {
      await this.initialize();
    }
  }

  /**
   * Shutdown and cleanup resources
   */
  async shutdown(): Promise<void> {
    log.info('Shutting down LLaVA service');

    if (this.pipeline) {
      this.pipeline = null;
    }

    this.isInitialized = false;
  }
}

// Create default instance with model path
const defaultModelPath = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.garden-of-eden-v3',
  'models',
  'llava-7b'
);

export const llavaService = new LLaVAService({
  modelPath: defaultModelPath,
});

// Singleton instance
let llavaServiceInstance: LLaVAService | null = null;

export function getLLaVAService(): LLaVAService {
  if (!llavaServiceInstance) {
    llavaServiceInstance = llavaService;
  }
  return llavaServiceInstance;
}

export async function cleanupLLaVAService(): Promise<void> {
  if (llavaServiceInstance) {
    await llavaServiceInstance.shutdown();
    llavaServiceInstance = null;
  }
}

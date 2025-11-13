/**
 * Synthetic Data Generation Service
 * Creates high-quality training data for RAG memory fine-tuning
 */

import log from 'electron-log';
import type { ConversationEpisode } from '@shared/types/memory.types';

export interface SyntheticQuery {
  query: string;
  expectedAnswer: string;
  context: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface SyntheticEpisode {
  userMessage: string;
  edenResponse: string;
  context: Record<string, any>;
  quality: number; // 0-1 quality score
}

/**
 * Synthetic Data Generation Service
 * Generates training data for improving RAG search quality
 */
export class SyntheticDataService {
  /**
   * Generate synthetic queries from an episode
   * Creates multiple paraphrased queries that should match this episode
   */
  generateSyntheticQueries(episode: ConversationEpisode, count: number = 5): SyntheticQuery[] {
    const queries: SyntheticQuery[] = [];

    // Extract key concepts from user message
    const concepts = this.extractConcepts(episode.userMessage);

    // Generate paraphrased queries
    const paraphrases = [
      // Direct paraphrase
      this.paraphraseSimple(episode.userMessage),

      // Question form
      this.convertToQuestion(episode.userMessage),

      // Keyword-based
      this.keywordQuery(concepts),

      // Context-aware
      this.contextAwareQuery(episode),

      // Abstract query
      this.abstractQuery(concepts),
    ];

    for (let i = 0; i < Math.min(count, paraphrases.length); i++) {
      queries.push({
        query: paraphrases[i],
        expectedAnswer: episode.edenResponse,
        context: episode.userMessage,
        difficulty: this.estimateDifficulty(paraphrases[i], episode.userMessage),
        category: this.categorizeQuery(episode.userMessage),
      });
    }

    return queries;
  }

  /**
   * Generate negative samples (queries that should NOT match)
   */
  generateNegativeSamples(episode: ConversationEpisode, count: number = 3): SyntheticQuery[] {
    const negative: SyntheticQuery[] = [];

    // Different topic
    negative.push({
      query: this.generateDifferentTopicQuery(episode.userMessage),
      expectedAnswer: '',
      context: 'negative_sample',
      difficulty: 'easy',
      category: 'negative',
    });

    // Similar words, different meaning
    negative.push({
      query: this.generateSimilarWordsQuery(episode.userMessage),
      expectedAnswer: '',
      context: 'negative_sample',
      difficulty: 'medium',
      category: 'negative',
    });

    // Opposite intent
    negative.push({
      query: this.generateOppositeIntentQuery(episode.userMessage),
      expectedAnswer: '',
      context: 'negative_sample',
      difficulty: 'hard',
      category: 'negative',
    });

    return negative.slice(0, count);
  }

  /**
   * Generate synthetic episodes for training
   */
  async generateSyntheticEpisodes(
    baseEpisodes: ConversationEpisode[],
    count: number = 100
  ): Promise<SyntheticEpisode[]> {
    const synthetic: SyntheticEpisode[] = [];

    log.info(`Generating ${count} synthetic episodes from ${baseEpisodes.length} base episodes...`);

    for (let i = 0; i < count; i++) {
      // Pick random base episode
      const base = baseEpisodes[Math.floor(Math.random() * baseEpisodes.length)];

      // Generate variation
      const variation = this.generateEpisodeVariation(base);
      synthetic.push(variation);
    }

    log.info(`Generated ${synthetic.length} synthetic episodes`);
    return synthetic;
  }

  /**
   * Create augmented data by mixing episodes
   */
  augmentEpisodes(episodes: ConversationEpisode[]): SyntheticEpisode[] {
    const augmented: SyntheticEpisode[] = [];

    // Combine similar episodes
    for (let i = 0; i < episodes.length - 1; i++) {
      for (let j = i + 1; j < episodes.length; j++) {
        if (this.areSimilarTopics(episodes[i].userMessage, episodes[j].userMessage)) {
          augmented.push(this.mergeEpisodes(episodes[i], episodes[j]));
        }
      }
    }

    return augmented;
  }

  /**
   * Extract key concepts from text
   */
  private extractConcepts(text: string): string[] {
    // Simple concept extraction (can be improved with NLP)
    const words = text.toLowerCase().split(/\s+/);

    // Filter out common words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', '을', '를', '이', '가', '은', '는']);

    return words
      .filter((w) => w.length > 3 && !stopWords.has(w))
      .filter((w) => /^[a-zA-Z가-힣]+$/.test(w)) // Only letters
      .slice(0, 5); // Top 5 concepts
  }

  /**
   * Simple paraphrase
   */
  private paraphraseSimple(text: string): string {
    // Simple rewording patterns
    return text
      .replace(/어떻게/g, '어떤 방법으로')
      .replace(/만들어/g, '생성해')
      .replace(/도와줘/g, '도와주세요')
      .replace(/help me/gi, 'assist me with')
      .replace(/create/gi, 'make')
      .replace(/how to/gi, 'what is the way to');
  }

  /**
   * Convert statement to question
   */
  private convertToQuestion(text: string): string {
    if (text.endsWith('?')) return text;

    // Korean
    if (/[가-힣]/.test(text)) {
      if (text.includes('해줘')) {
        return text.replace(/해줘$/, '는 방법을 알려주세요?');
      }
      return text + '에 대해 알려주세요?';
    }

    // English
    if (!text.toLowerCase().startsWith('how') && !text.toLowerCase().startsWith('what')) {
      return 'How can I ' + text.toLowerCase() + '?';
    }

    return text;
  }

  /**
   * Create keyword-based query
   */
  private keywordQuery(concepts: string[]): string {
    return concepts.slice(0, 3).join(' ');
  }

  /**
   * Create context-aware query
   */
  private contextAwareQuery(episode: ConversationEpisode): string {
    const concepts = this.extractConcepts(episode.userMessage);

    if (episode.context.filesAccessed && episode.context.filesAccessed.length > 0) {
      return `${concepts[0]} in ${episode.context.filesAccessed[0]}`;
    }

    return `${concepts.slice(0, 2).join(' ')} 관련 정보`;
  }

  /**
   * Create abstract query
   */
  private abstractQuery(concepts: string[]): string {
    if (concepts.length === 0) return 'general question';

    return `${concepts[0]} related question`;
  }

  /**
   * Estimate query difficulty
   */
  private estimateDifficulty(query: string, original: string): 'easy' | 'medium' | 'hard' {
    const similarity = this.calculateTextSimilarity(query, original);

    if (similarity > 0.8) return 'easy';
    if (similarity > 0.5) return 'medium';
    return 'hard';
  }

  /**
   * Calculate text similarity (simple Jaccard)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Categorize query
   */
  private categorizeQuery(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('code') || lowerText.includes('function') || lowerText.includes('함수')) {
      return 'coding';
    }
    if (lowerText.includes('file') || lowerText.includes('파일')) {
      return 'file_operation';
    }
    if (lowerText.includes('explain') || lowerText.includes('설명')) {
      return 'explanation';
    }

    return 'general';
  }

  /**
   * Generate different topic query
   */
  private generateDifferentTopicQuery(text: string): string {
    const topics = ['날씨', 'weather', '음식', 'food', '영화', 'movie'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    return `Tell me about ${randomTopic}`;
  }

  /**
   * Generate similar words query (but different meaning)
   */
  private generateSimilarWordsQuery(text: string): string {
    // Use some words from original but ask about different thing
    const words = text.split(/\s+/).slice(0, 2);
    return `${words.join(' ')} history`;
  }

  /**
   * Generate opposite intent query
   */
  private generateOppositeIntentQuery(text: string): string {
    if (text.includes('create') || text.includes('만들')) {
      return text.replace(/create|만들/gi, 'delete');
    }
    if (text.includes('explain') || text.includes('설명')) {
      return text.replace(/explain|설명/gi, 'ignore');
    }

    return 'Do not ' + text;
  }

  /**
   * Generate episode variation
   */
  private generateEpisodeVariation(base: ConversationEpisode): SyntheticEpisode {
    return {
      userMessage: this.paraphraseSimple(base.userMessage),
      edenResponse: base.edenResponse,
      context: base.context,
      quality: 0.8 + Math.random() * 0.2, // Quality score 0.8-1.0
    };
  }

  /**
   * Check if two topics are similar
   */
  private areSimilarTopics(text1: string, text2: string): boolean {
    const similarity = this.calculateTextSimilarity(text1, text2);
    return similarity > 0.3;
  }

  /**
   * Merge two episodes into one synthetic episode
   */
  private mergeEpisodes(ep1: ConversationEpisode, ep2: ConversationEpisode): SyntheticEpisode {
    const concepts1 = this.extractConcepts(ep1.userMessage);
    const concepts2 = this.extractConcepts(ep2.userMessage);

    const mergedQuery = `${concepts1[0]} and ${concepts2[0]}`;
    const mergedResponse = `${ep1.edenResponse}\n\nAlso, ${ep2.edenResponse}`;

    return {
      userMessage: mergedQuery,
      edenResponse: mergedResponse,
      context: {
        ...ep1.context,
        merged: true,
        sources: [ep1.id, ep2.id],
      },
      quality: 0.7, // Lower quality for merged data
    };
  }

  /**
   * Evaluate synthetic data quality
   */
  evaluateQuality(synthetic: SyntheticEpisode[]): {
    avgQuality: number;
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
  } {
    const qualities = synthetic.map((s) => s.quality);

    return {
      avgQuality: qualities.reduce((a, b) => a + b, 0) / qualities.length,
      highQuality: qualities.filter((q) => q >= 0.8).length,
      mediumQuality: qualities.filter((q) => q >= 0.6 && q < 0.8).length,
      lowQuality: qualities.filter((q) => q < 0.6).length,
    };
  }
}

// Singleton instance
let syntheticDataServiceInstance: SyntheticDataService | null = null;

export function getSyntheticDataService(): SyntheticDataService {
  if (!syntheticDataServiceInstance) {
    syntheticDataServiceInstance = new SyntheticDataService();
  }
  return syntheticDataServiceInstance;
}

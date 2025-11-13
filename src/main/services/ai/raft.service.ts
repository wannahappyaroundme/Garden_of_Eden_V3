/**
 * RAFT Service (Retrieval Augmented Fine-Tuning)
 * Reduces hallucination by grounding responses in retrieved documents
 */

import log from 'electron-log';
import type { RetrievedEpisode } from '@shared/types/memory.types';

export interface RAFTContext {
  query: string;
  documents: RetrievedEpisode[];
  reasoning: string; // Chain-of-thought reasoning
  sources: string[]; // Document IDs used
  confidence: number; // 0-1 confidence score
}

export interface RAFTResponse {
  answer: string;
  context: RAFTContext;
  grounded: boolean; // Whether answer is grounded in documents
  hallucination_risk: 'low' | 'medium' | 'high';
}

export interface GroundingCheck {
  isGrounded: boolean;
  confidence: number;
  supportingEvidence: string[];
  missingInfo: string[];
}

/**
 * RAFT Service for Hallucination Reduction
 *
 * RAFT = Retrieval Augmented Fine-Tuning
 * - Retrieve relevant documents
 * - Chain-of-thought reasoning
 * - Ground answer in retrieved context
 * - Validate factual accuracy
 */
export class RAFTService {
  private readonly CONFIDENCE_THRESHOLD = 0.7; // Minimum confidence for factual claims
  private readonly MAX_CONTEXT_LENGTH = 8192; // BGE-M3 limit

  /**
   * Generate grounded response using RAFT
   */
  async generateGroundedResponse(
    query: string,
    retrievedDocs: RetrievedEpisode[],
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<RAFTContext> {
    log.info(`Generating grounded response for: "${query.substring(0, 50)}..."`);

    // 1. Extract relevant context from documents
    const context = this.extractRelevantContext(retrievedDocs, query);

    // 2. Create chain-of-thought reasoning
    const reasoning = this.createChainOfThought(query, context, conversationHistory);

    // 3. Identify sources
    const sources = retrievedDocs.map((doc) => doc.id);

    // 4. Calculate confidence
    const confidence = this.calculateConfidence(retrievedDocs, query);

    return {
      query,
      documents: retrievedDocs,
      reasoning,
      sources,
      confidence,
    };
  }

  /**
   * Validate response for hallucination
   */
  validateResponse(response: string, context: RAFTContext): GroundingCheck {
    log.debug('Validating response for hallucination...');

    // Extract claims from response
    const claims = this.extractClaims(response);

    // Check each claim against retrieved documents
    const supportingEvidence: string[] = [];
    const missingInfo: string[] = [];

    for (const claim of claims) {
      const evidence = this.findEvidence(claim, context.documents);

      if (evidence) {
        supportingEvidence.push(evidence);
      } else {
        missingInfo.push(claim);
      }
    }

    const groundingRatio = supportingEvidence.length / Math.max(claims.length, 1);
    const isGrounded = groundingRatio >= 0.7; // 70% of claims must be supported

    return {
      isGrounded,
      confidence: groundingRatio,
      supportingEvidence,
      missingInfo,
    };
  }

  /**
   * Assess hallucination risk
   */
  assessHallucinationRisk(
    response: string,
    context: RAFTContext,
    groundingCheck: GroundingCheck
  ): 'low' | 'medium' | 'high' {
    // Factors:
    // 1. Grounding confidence
    // 2. Document relevance (similarity scores)
    // 3. Response specificity (vague vs specific)
    // 4. Source availability

    let risk = 0;

    // Factor 1: Grounding
    if (!groundingCheck.isGrounded) {
      risk += 3;
    } else if (groundingCheck.confidence < 0.8) {
      risk += 1;
    }

    // Factor 2: Document relevance
    const avgSimilarity =
      context.documents.reduce((sum, doc) => sum + doc.similarity, 0) /
      Math.max(context.documents.length, 1);

    if (avgSimilarity < 0.6) {
      risk += 3;
    } else if (avgSimilarity < 0.75) {
      risk += 1;
    }

    // Factor 3: Response specificity
    const hasSpecificClaims = this.hasSpecificClaims(response);
    if (hasSpecificClaims && groundingCheck.missingInfo.length > 0) {
      risk += 2;
    }

    // Factor 4: No sources
    if (context.documents.length === 0) {
      risk += 4;
    }

    // Convert to risk level
    if (risk >= 6) return 'high';
    if (risk >= 3) return 'medium';
    return 'low';
  }

  /**
   * Create instruction for LLM with RAFT prompt
   */
  createRAFTPrompt(query: string, context: RAFTContext, mode: 'fast' | 'detailed' = 'detailed'): string {
    if (mode === 'fast') {
      return this.createFastPrompt(query, context);
    }

    // Detailed RAFT prompt with chain-of-thought
    let prompt = `You are Eden, a helpful AI assistant. Answer the following question based ONLY on the provided context.

# Context from Memory:
`;

    // Add retrieved documents
    for (let i = 0; i < Math.min(context.documents.length, 5); i++) {
      const doc = context.documents[i];
      prompt += `
[Document ${i + 1}] (Relevance: ${(doc.similarity * 100).toFixed(0)}%)
User asked: ${doc.userMessage}
Eden answered: ${doc.edenResponse}
---
`;
    }

    if (context.documents.length === 0) {
      prompt += `
[No relevant documents found in memory]
Please answer based on your general knowledge, but clearly state that you're not recalling specific previous conversations.
`;
    }

    prompt += `
# Question:
${query}

# Instructions:
1. Think step-by-step (chain-of-thought reasoning)
2. ONLY use information from the context above
3. If information is not in context, say "I don't have specific information about that"
4. Be conversational and friendly (like talking to a friend)
5. ${mode === 'detailed' ? 'Provide detailed explanation' : 'Keep response brief (1-2 sentences)'}

# Your Response:
`;

    return prompt;
  }

  /**
   * Create fast response prompt (< 1s target)
   */
  private createFastPrompt(query: string, context: RAFTContext): string {
    const topDoc = context.documents[0];

    if (!topDoc) {
      return `Question: ${query}\n\nRespond naturally in 1-2 sentences. If you don't know, say so briefly.`;
    }

    return `Based on this memory:
User: ${topDoc.userMessage}
Eden: ${topDoc.edenResponse}

Question: ${query}

Respond in 1-2 sentences, conversationally.`;
  }

  /**
   * Extract relevant context from documents
   */
  private extractRelevantContext(docs: RetrievedEpisode[], query: string): string {
    if (docs.length === 0) {
      return 'No relevant context found.';
    }

    // Prioritize by similarity
    const sortedDocs = [...docs].sort((a, b) => b.similarity - a.similarity);

    let context = '';
    let tokenCount = 0;
    const maxTokens = this.MAX_CONTEXT_LENGTH;

    for (const doc of sortedDocs) {
      const docText = `${doc.userMessage} ${doc.edenResponse}`;
      const docTokens = Math.ceil(docText.length / 4); // Rough estimate

      if (tokenCount + docTokens > maxTokens) {
        break;
      }

      context += `${docText}\n\n`;
      tokenCount += docTokens;
    }

    return context;
  }

  /**
   * Create chain-of-thought reasoning
   */
  private createChainOfThought(
    query: string,
    context: string,
    history: Array<{ role: string; content: string }>
  ): string {
    let reasoning = `Query: ${query}\n\n`;

    // Step 1: Analyze query intent
    reasoning += `Step 1: Query asks about ${this.analyzeQueryIntent(query)}\n\n`;

    // Step 2: Available context
    reasoning += `Step 2: Found ${context.length > 0 ? 'relevant' : 'no'} context\n\n`;

    // Step 3: Conversation history
    if (history.length > 0) {
      reasoning += `Step 3: Continuing conversation (${history.length} previous messages)\n\n`;
    }

    // Step 4: Response strategy
    reasoning += `Step 4: ${context.length > 0 ? 'Ground response in context' : 'Provide general knowledge with disclaimer'}\n`;

    return reasoning;
  }

  /**
   * Analyze query intent
   */
  private analyzeQueryIntent(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('how') || lowerQuery.includes('어떻게')) {
      return 'a process or method';
    }
    if (lowerQuery.includes('what') || lowerQuery.includes('무엇') || lowerQuery.includes('뭐')) {
      return 'a definition or explanation';
    }
    if (lowerQuery.includes('why') || lowerQuery.includes('왜')) {
      return 'a reason or cause';
    }
    if (lowerQuery.includes('when') || lowerQuery.includes('언제')) {
      return 'timing or schedule';
    }
    if (lowerQuery.includes('where') || lowerQuery.includes('어디')) {
      return 'a location';
    }

    return 'general information';
  }

  /**
   * Calculate confidence based on document relevance
   */
  private calculateConfidence(docs: RetrievedEpisode[], query: string): number {
    if (docs.length === 0) {
      return 0.3; // Low confidence without context
    }

    // Average similarity of top 3 documents
    const topDocs = docs.slice(0, 3);
    const avgSimilarity = topDocs.reduce((sum, doc) => sum + doc.similarity, 0) / topDocs.length;

    // Boost if many relevant documents
    const documentBonus = Math.min(docs.length / 10, 0.1);

    return Math.min(avgSimilarity + documentBonus, 1.0);
  }

  /**
   * Extract claims from response
   */
  private extractClaims(response: string): string[] {
    // Split by sentences
    const sentences = response.split(/[.!?。]+/).filter((s) => s.trim().length > 0);

    // Filter out non-factual sentences (opinions, questions)
    return sentences.filter((sentence) => {
      const lower = sentence.toLowerCase();

      // Skip if it's a question
      if (lower.includes('?') || lower.includes('would you') || lower.includes('do you')) {
        return false;
      }

      // Skip if it's clearly subjective
      if (
        lower.includes('i think') ||
        lower.includes('in my opinion') ||
        lower.includes('personally')
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Find supporting evidence for a claim
   */
  private findEvidence(claim: string, documents: RetrievedEpisode[]): string | null {
    const claimLower = claim.toLowerCase();

    for (const doc of documents) {
      const docText = `${doc.userMessage} ${doc.edenResponse}`.toLowerCase();

      // Extract key terms from claim
      const keyTerms = claimLower
        .split(/\s+/)
        .filter((word) => word.length > 3 && !/^(the|and|or|but|with|for)$/.test(word));

      // Check if document contains key terms
      const matchCount = keyTerms.filter((term) => docText.includes(term)).length;

      if (matchCount >= keyTerms.length * 0.6) {
        // 60% of key terms found
        return `Supported by: "${doc.userMessage}"`;
      }
    }

    return null;
  }

  /**
   * Check if response has specific claims (vs vague)
   */
  private hasSpecificClaims(response: string): boolean {
    // Specific claims usually contain:
    // - Numbers, dates
    // - Names, places
    // - Technical terms

    const specificPatterns = [
      /\d{4}/, // Years
      /\d+%/, // Percentages
      /\d+\s*(seconds|minutes|hours|days)/, // Time measurements
      /[A-Z][a-z]+\s[A-Z][a-z]+/, // Proper names
      /version\s+\d/, // Versions
    ];

    return specificPatterns.some((pattern) => pattern.test(response));
  }

  /**
   * Generate disclaimer for ungrounded responses
   */
  generateDisclaimer(risk: 'low' | 'medium' | 'high'): string {
    if (risk === 'low') {
      return ''; // No disclaimer needed
    }

    if (risk === 'medium') {
      return '\n\n(Note: This answer is based on general knowledge as I don\'t have specific relevant information in my memory.)';
    }

    return '\n\n(⚠️ I don\'t have confident information about this. Please verify from authoritative sources.)';
  }
}

// Singleton instance
let raftServiceInstance: RAFTService | null = null;

export function getRAFTService(): RAFTService {
  if (!raftServiceInstance) {
    raftServiceInstance = new RAFTService();
  }
  return raftServiceInstance;
}

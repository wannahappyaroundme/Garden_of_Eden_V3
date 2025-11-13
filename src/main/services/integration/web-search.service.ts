/**
 * Web Search Service
 * Integrates web search for RAG augmentation when local knowledge is insufficient
 */

import log from 'electron-log';
import https from 'https';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number; // 0-1 score
  source: 'duckduckgo' | 'brave' | 'searx'; // Search engine used
}

export interface SearchOptions {
  maxResults?: number;
  language?: 'ko' | 'en';
  safeSearch?: boolean;
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
}

/**
 * Web Search Service for RAG Augmentation
 * Privacy-first: Uses DuckDuckGo (no tracking)
 */
export class WebSearchService {
  private readonly USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Search the web for additional context
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { maxResults = 5, language = 'en', safeSearch = true } = options;

    log.info(`Web search: "${query}" (max: ${maxResults}, lang: ${language})`);

    try {
      // Try DuckDuckGo first (privacy-focused)
      const results = await this.searchDuckDuckGo(query, maxResults, language, safeSearch);

      log.info(`Found ${results.length} web search results`);
      return results;
    } catch (error) {
      log.error('Web search failed:', error);
      return [];
    }
  }

  /**
   * Search DuckDuckGo
   */
  private async searchDuckDuckGo(
    query: string,
    maxResults: number,
    language: string,
    safeSearch: boolean
  ): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      const encodedQuery = encodeURIComponent(query);
      const safeSearchParam = safeSearch ? '1' : '-1';
      const langParam = language === 'ko' ? 'kr-kr' : 'en-us';

      // DuckDuckGo Instant Answer API (lite version, no API key needed)
      const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&pretty=1&no_html=1&skip_disambig=1&kl=${langParam}`;

      const request = https.get(
        url,
        {
          headers: {
            'User-Agent': this.USER_AGENT,
          },
        },
        (response) => {
          let data = '';

          response.on('data', (chunk) => {
            data += chunk;
          });

          response.on('end', () => {
            try {
              const json = JSON.parse(data);
              const results: SearchResult[] = [];

              // Parse AbstractText
              if (json.AbstractText) {
                results.push({
                  title: json.Heading || 'DuckDuckGo Answer',
                  url: json.AbstractURL || '',
                  snippet: json.AbstractText,
                  relevance: 0.9,
                  source: 'duckduckgo',
                });
              }

              // Parse RelatedTopics
              if (json.RelatedTopics && Array.isArray(json.RelatedTopics)) {
                for (const topic of json.RelatedTopics.slice(0, maxResults - 1)) {
                  if (topic.Text && topic.FirstURL) {
                    results.push({
                      title: topic.Text.split(' - ')[0] || 'Related',
                      url: topic.FirstURL,
                      snippet: topic.Text,
                      relevance: 0.7,
                      source: 'duckduckgo',
                    });
                  }
                }
              }

              resolve(results.slice(0, maxResults));
            } catch (error) {
              reject(new Error('Failed to parse DuckDuckGo response'));
            }
          });
        }
      );

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Search request timeout'));
      });
    });
  }

  /**
   * Determine if web search is needed
   */
  shouldUseWebSearch(
    query: string,
    localResults: any[],
    threshold: number = 0.7
  ): {
    needed: boolean;
    reason: string;
  } {
    // No local results
    if (localResults.length === 0) {
      return {
        needed: true,
        reason: 'No local results found',
      };
    }

    // Low confidence local results
    const maxSimilarity = Math.max(...localResults.map((r) => r.similarity || 0));
    if (maxSimilarity < threshold) {
      return {
        needed: true,
        reason: `Low confidence (${maxSimilarity.toFixed(2)} < ${threshold})`,
      };
    }

    // Query contains "latest", "recent", "new", "2024", "2025" etc.
    const timeKeywords = /\b(latest|recent|new|current|today|now|2024|2025|최신|최근|새로운)\b/i;
    if (timeKeywords.test(query)) {
      return {
        needed: true,
        reason: 'Query requires up-to-date information',
      };
    }

    // Query asks about external knowledge
    const externalKeywords = /\b(what is|who is|news|wikipedia|definition|뉴스|위키|정의)\b/i;
    if (externalKeywords.test(query)) {
      return {
        needed: true,
        reason: 'Query requires external knowledge',
      };
    }

    return {
      needed: false,
      reason: 'Sufficient local results',
    };
  }

  /**
   * Extract relevant text from search results
   */
  extractContext(results: SearchResult[], maxLength: number = 2000): string {
    let context = '## Web Search Results\n\n';

    for (const result of results) {
      context += `**${result.title}**\n`;
      context += `${result.snippet}\n`;
      context += `Source: ${result.url}\n\n`;

      if (context.length > maxLength) {
        context = context.substring(0, maxLength) + '...';
        break;
      }
    }

    return context;
  }

  /**
   * Combine local and web search results
   */
  async augmentWithWebSearch(
    query: string,
    localResults: any[],
    options: SearchOptions = {}
  ): Promise<{
    localResults: any[];
    webResults: SearchResult[];
    combinedContext: string;
    usedWebSearch: boolean;
  }> {
    const decision = this.shouldUseWebSearch(query, localResults);

    if (!decision.needed) {
      log.info(`Web search not needed: ${decision.reason}`);
      return {
        localResults,
        webResults: [],
        combinedContext: this.formatLocalResults(localResults),
        usedWebSearch: false,
      };
    }

    log.info(`Using web search: ${decision.reason}`);

    try {
      const webResults = await this.search(query, options);

      const combinedContext = this.combineResults(localResults, webResults);

      return {
        localResults,
        webResults,
        combinedContext,
        usedWebSearch: true,
      };
    } catch (error) {
      log.error('Web search augmentation failed:', error);
      return {
        localResults,
        webResults: [],
        combinedContext: this.formatLocalResults(localResults),
        usedWebSearch: false,
      };
    }
  }

  /**
   * Format local results as context
   */
  private formatLocalResults(results: any[]): string {
    if (results.length === 0) return '';

    let context = '## Local Memory\n\n';

    for (const result of results.slice(0, 3)) {
      context += `**Previous conversation:**\n`;
      context += `User: ${result.userMessage}\n`;
      context += `Eden: ${result.edenResponse}\n`;
      context += `Relevance: ${(result.similarity * 100).toFixed(0)}%\n\n`;
    }

    return context;
  }

  /**
   * Combine local and web results
   */
  private combineResults(localResults: any[], webResults: SearchResult[]): string {
    let combined = '';

    // Local results first (higher trust)
    if (localResults.length > 0) {
      combined += this.formatLocalResults(localResults);
      combined += '\n---\n\n';
    }

    // Web results second
    if (webResults.length > 0) {
      combined += this.extractContext(webResults);
    }

    return combined;
  }

  /**
   * Check if web search is available (internet connection)
   */
  async checkConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      const request = https.get('https://api.duckduckgo.com/', (response) => {
        resolve(response.statusCode === 200);
      });

      request.on('error', () => {
        resolve(false);
      });

      request.setTimeout(5000, () => {
        request.destroy();
        resolve(false);
      });
    });
  }
}

// Singleton instance
let webSearchServiceInstance: WebSearchService | null = null;

export function getWebSearchService(): WebSearchService {
  if (!webSearchServiceInstance) {
    webSearchServiceInstance = new WebSearchService();
  }
  return webSearchServiceInstance;
}

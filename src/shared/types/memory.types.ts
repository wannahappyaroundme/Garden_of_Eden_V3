/**
 * Memory Types
 * Type definitions for RAG episodic memory system
 */

export interface ConversationEpisode {
  id: string;
  conversationId: string;
  timestamp: Date;
  userMessage: string;
  edenResponse: string;
  context: EpisodeContext;
  satisfaction?: 'positive' | 'negative' | null;
  embedding?: number[];
}

export interface EpisodeContext {
  screenContext?: {
    level: 1 | 2 | 3;
    capturedAt: Date;
    description?: string;
  };
  filesAccessed: string[];
  codeGenerated?: {
    language: string;
    snippet: string;
  };
  workspaceInfo?: {
    rootPath: string;
    workspaceType: string;
  };
  gitInfo?: {
    branch: string;
    hasChanges: boolean;
  };
}

export interface RetrievedEpisode extends ConversationEpisode {
  similarity: number;
  relevanceScore: number;
}

export interface MemorySearchRequest {
  query: string;
  topK?: number;
  minSimilarity?: number;
  conversationId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface MemorySearchResult {
  episodes: RetrievedEpisode[];
  totalFound: number;
  searchTime: number;
}

export interface MemoryStats {
  totalEpisodes: number;
  oldestEpisode: Date | null;
  newestEpisode: Date | null;
  averageSimilarity: number;
  storageSize: number;
}

// IPC Channels
export interface MemoryChannels {
  'memory:store-episode': {
    request: {
      episode: Omit<ConversationEpisode, 'id' | 'embedding'>;
    };
    response: {
      success: boolean;
      episodeId: string;
    };
  };
  'memory:search': {
    request: MemorySearchRequest;
    response: MemorySearchResult;
  };
  'memory:get-stats': {
    request: void;
    response: { stats: MemoryStats };
  };
  'memory:get-episode': {
    request: { episodeId: string };
    response: { episode: ConversationEpisode | null };
  };
  'memory:delete-episode': {
    request: { episodeId: string };
    response: { success: boolean };
  };
  'memory:clear-all': {
    request: { conversationId?: string };
    response: { success: boolean; deletedCount: number };
  };
}

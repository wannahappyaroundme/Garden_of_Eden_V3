/**
 * GraphRAG Panel Component (v3.7.0)
 *
 * Main UI for knowledge graph-based retrieval
 */

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface GraphEntity {
  entity_id: string;
  name: string;
  entity_type: string;
  properties: Record<string, any>;
  community_id?: number;
  degree: number;
}

interface GraphRetrievalResult {
  entity: GraphEntity;
  relevance_score: number;
  retrieval_path: string[];
  context: any[];
}

interface GraphStats {
  total_entities: number;
  total_relationships: number;
  total_communities: number;
  entity_types: Record<string, number>;
  relationship_types: Record<string, number>;
}

export const GraphRAGPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GraphRetrievalResult[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<GraphEntity | null>(null);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await invoke<GraphStats>('graphrag_stats');
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load GraphRAG stats:', err);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await invoke<{ results: GraphRetrievalResult[] }>(
        'graphrag_retrieve',
        { query }
      );
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEntityClick = async (entityId: string) => {
    try {
      const entity = await invoke<GraphEntity>('graphrag_load_entity', {
        entityId,
      });
      setSelectedEntity(entity);
    } catch (err) {
      console.error('Failed to load entity:', err);
    }
  };

  const handleBuildGraph = async (text: string) => {
    setLoading(true);
    setError(null);

    try {
      await invoke('graphrag_build_graph', { text });
      await loadStats();
      alert('Graph built successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="graphrag-panel p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Knowledge Graph Search
      </h2>

      {/* Stats Section */}
      {stats && (
        <div className="stats-section mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Graph Statistics
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Entities
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total_entities}
              </div>
            </div>
            <div className="stat">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Relationships
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.total_relationships}
              </div>
            </div>
            <div className="stat">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Communities
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.total_communities}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="search-section mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search knowledge graph..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="results-section">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Search Results ({results.length})
          </h3>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                onClick={() => handleEntityClick(result.entity.entity_id)}
                className="result-card p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {result.entity.name}
                    </h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {result.entity.entity_type}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Score: {result.relevance_score.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Degree: {result.entity.degree}
                    </div>
                  </div>
                </div>
                {result.retrieval_path.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Path: {result.retrieval_path.join(' → ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity Details Modal */}
      {selectedEntity && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedEntity(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {selectedEntity.name}
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Type:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {selectedEntity.entity_type}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  ID:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {selectedEntity.entity_id}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Connections:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {selectedEntity.degree}
                </span>
              </div>
              {selectedEntity.community_id && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Community:
                  </span>{' '}
                  <span className="text-gray-600 dark:text-gray-400">
                    {selectedEntity.community_id}
                  </span>
                </div>
              )}
              {Object.keys(selectedEntity.properties).length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Properties:
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedEntity.properties, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphRAGPanel;

/**
 * Memory Visualization Page (v3.2.0 Advanced RAG)
 *
 * Visualize episodic memories with:
 * - Timeline view of conversations
 * - Relevance scores and satisfaction ratings
 * - Search and filter capabilities
 * - Export/import functionality
 */

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Search, Download, Upload, Trash2, Brain, TrendingUp, Clock, ThumbsUp, X } from 'lucide-react';

interface MemoryVisualizationProps {
  onClose: () => void;
}

interface Episode {
  id: string;
  user_message: string;
  ai_response: string;
  satisfaction: number;
  created_at: number;
  access_count: number;
  importance: number;
}

interface MemoryStats {
  total_memories: number;
  average_satisfaction: number;
  most_accessed_topic?: string;
}

const MemoryVisualization: React.FC<MemoryVisualizationProps> = ({ onClose }) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  // Load memories on mount
  useEffect(() => {
    loadMemories();
    loadStats();
  }, []);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const result = await invoke<Episode[]>('episodic_get_recent', { limit: 50 });
      setEpisodes(result);
    } catch (error) {
      console.error('Failed to load memories:', error);
      // Keep empty array on error
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await invoke<MemoryStats>('episodic_get_stats');
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set empty stats on error
      setStats(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMemories();
      return;
    }

    setLoading(true);
    try {
      const result = await invoke<Episode[]>('episodic_search', {
        query: searchQuery,
        limit: 50
      });
      setEpisodes(result);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Get all memories from backend for export
      const allEpisodes = await invoke<Episode[]>('episodic_export', { limit: 1000 });
      const dataStr = JSON.stringify(allEpisodes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `memories_${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as Episode[];
      const importedCount = await invoke<number>('episodic_import', { episodes: imported });
      console.log(`Imported ${importedCount} new memories`);
      // Reload memories to show imported data
      loadMemories();
      loadStats();
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      const deleted = await invoke<boolean>('episodic_delete', { episodeId: id });
      if (deleted) {
        setEpisodes(episodes.filter((ep) => ep.id !== id));
        loadStats(); // Refresh stats after deletion
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return date.toLocaleDateString();
  };

  const getSatisfactionColor = (satisfaction: number) => {
    if (satisfaction >= 0.8) return 'text-green-500';
    if (satisfaction >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Memory Visualization
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition cursor-pointer">
              <Upload className="w-4 h-4" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <Brain className="w-4 h-4" />
                <span className="text-sm">Total Memories</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total_memories}
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">Avg. Satisfaction</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats.average_satisfaction * 100).toFixed(0)}%
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Most Accessed</span>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {stats.most_accessed_topic || 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Loading memories...
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No memories found. Start chatting to create memories!
          </div>
        ) : (
          <div className="space-y-4">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                onClick={() => setSelectedEpisode(episode)}
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700 cursor-pointer hover:shadow-md transition ${
                  selectedEpisode?.id === episode.id ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {formatDate(episode.created_at)}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(episode.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    User:
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {episode.user_message}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    AI:
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 line-clamp-2">
                    {episode.ai_response}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className={`w-4 h-4 ${getSatisfactionColor(episode.satisfaction)}`} />
                    <span className={getSatisfactionColor(episode.satisfaction)}>
                      {(episode.satisfaction * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>{episode.access_count} accesses</span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Brain className="w-4 h-4" />
                    <span>Importance: {(episode.importance * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryVisualization;

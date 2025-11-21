/**
 * Reasoning Mode Toggle Component (v3.5.0)
 *
 * Inline toggle for quick/deep reasoning mode in chat interface
 */

import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ReasoningModeToggleProps {
  onChange?: (mode: 'quick' | 'deep') => void;
}

const ReasoningModeToggle: React.FC<ReasoningModeToggleProps> = ({ onChange }) => {
  const [mode, setMode] = useState<'quick' | 'deep'>('quick');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentMode();
  }, []);

  const loadCurrentMode = async () => {
    try {
      const settings = await invoke<{ reasoning_mode: 'quick' | 'deep' }>('llm_get_settings');
      setMode(settings.reasoning_mode);
    } catch (error) {
      console.error('Failed to load reasoning mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const newMode = mode === 'quick' ? 'deep' : 'quick';

    try {
      await invoke('llm_set_reasoning_mode', { mode: newMode });
      setMode(newMode);
      onChange?.(newMode);
    } catch (error) {
      console.error('Failed to set reasoning mode:', error);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  return (
    <div className="reasoning-mode-toggle">
      <button
        className={`toggle-button ${mode}`}
        onClick={handleToggle}
        title={mode === 'quick' ? 'Switch to Deep Reasoning' : 'Switch to Quick Reasoning'}
      >
        <span className="mode-icon">{mode === 'quick' ? '⚡' : '🧠'}</span>
        <span className="mode-text">
          {mode === 'quick' ? 'Quick' : 'Deep'}
        </span>
      </button>

      <style>{`
        .reasoning-mode-toggle {
          display: inline-flex;
          align-items: center;
        }

        .toggle-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 16px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9em;
        }

        .toggle-button:hover {
          border-color: var(--accent-color, #4CAF50);
          transform: translateY(-1px);
        }

        .toggle-button.quick {
          border-color: #FFA726;
          background: #FFF3E0;
        }

        .toggle-button.quick:hover {
          border-color: #FF9800;
          background: #FFE0B2;
        }

        .toggle-button.deep {
          border-color: #42A5F5;
          background: #E3F2FD;
        }

        .toggle-button.deep:hover {
          border-color: #2196F3;
          background: #BBDEFB;
        }

        .mode-icon {
          font-size: 1.2em;
          line-height: 1;
        }

        .mode-text {
          font-weight: 600;
          color: var(--text-primary, #333);
        }
      `}</style>
    </div>
  );
};

export default ReasoningModeToggle;

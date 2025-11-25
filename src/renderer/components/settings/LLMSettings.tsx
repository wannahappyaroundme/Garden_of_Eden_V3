/**
 * LLM Settings Panel (v3.5.0)
 *
 * VRAM-based model selection and reasoning mode management
 */

import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface VRAMInfo {
  vram_gb: number | null;
  recommended_models: string[];
}

interface LLMSettings {
  selected_model: string;
  reasoning_mode: 'quick' | 'deep';
  auto_select_model: boolean;
  vram_capacity: number | null;
  context_window_size: number;
  max_ram_usage_gb: number;
}

const LLMSettingsPanel: React.FC = () => {
  const [vramInfo, setVramInfo] = useState<VRAMInfo | null>(null);
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [vram, currentSettings] = await Promise.all([
        invoke<VRAMInfo>('llm_get_vram_info'),
        invoke<LLMSettings>('llm_get_settings')
      ]);
      setVramInfo(vram);
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load LLM settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = async (model: string) => {
    if (!settings) return;

    try {
      setSaving(true);
      await invoke('llm_set_model', { model });
      setSettings({ ...settings, selected_model: model });
    } catch (error) {
      console.error('Failed to set model:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReasoningModeChange = async (mode: 'quick' | 'deep') => {
    if (!settings) return;

    try {
      setSaving(true);
      await invoke('llm_set_reasoning_mode', { mode });
      setSettings({ ...settings, reasoning_mode: mode });
    } catch (error) {
      console.error('Failed to set reasoning mode:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleContextWindowChange = async (size: number) => {
    if (!settings) return;

    try {
      setSaving(true);
      await invoke('llm_set_context_window', { size });
      setSettings({ ...settings, context_window_size: size });
    } catch (error) {
      console.error('Failed to set context window:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleMaxRAMChange = async (maxGb: number) => {
    if (!settings) return;

    try {
      setSaving(true);
      await invoke('llm_set_max_ram', { maxGb });
      setSettings({ ...settings, max_ram_usage_gb: maxGb });
    } catch (error) {
      console.error('Failed to set max RAM:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="llm-settings-panel">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!vramInfo || !settings) {
    return (
      <div className="llm-settings-panel">
        <div className="error-message">Failed to load LLM settings</div>
      </div>
    );
  }

  return (
    <div className="llm-settings-panel">
      <div className="settings-section">
        <h3>GPU Information</h3>
        <div className="vram-info">
          <div className="info-row">
            <span className="label">VRAM Capacity:</span>
            <span className="value">
              {vramInfo.vram_gb ? `${vramInfo.vram_gb} GB` : 'Unknown'}
            </span>
          </div>
          {vramInfo.vram_gb && (
            <div className="recommended-models">
              <span className="label">Recommended Models:</span>
              <div className="model-badges">
                {vramInfo.recommended_models.map((model) => (
                  <span key={model} className="model-badge">
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>Model Selection</h3>
        <div className="model-selector">
          <label htmlFor="model-select">Active Model:</label>
          <select
            id="model-select"
            value={settings.selected_model}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={saving}
            className="model-select"
          >
            {vramInfo.recommended_models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {saving && <span className="saving-indicator">Saving...</span>}
        </div>
      </div>

      <div className="settings-section">
        <h3>Reasoning Mode</h3>
        <div className="reasoning-mode-selector">
          <div className="mode-description">
            <p>Choose how the AI should process your questions:</p>
            <ul>
              <li><strong>Quick ⚡:</strong> Fast responses for simple questions</li>
              <li><strong>Deep 🧠:</strong> Thorough reasoning for complex problems</li>
            </ul>
          </div>
          <div className="mode-buttons">
            <button
              className={`mode-button ${settings.reasoning_mode === 'quick' ? 'active' : ''}`}
              onClick={() => handleReasoningModeChange('quick')}
              disabled={saving}
            >
              <span className="mode-icon">⚡</span>
              <span className="mode-label">Quick</span>
            </button>
            <button
              className={`mode-button ${settings.reasoning_mode === 'deep' ? 'active' : ''}`}
              onClick={() => handleReasoningModeChange('deep')}
              disabled={saving}
            >
              <span className="mode-icon">🧠</span>
              <span className="mode-label">Deep</span>
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Performance & Memory</h3>
        <div className="performance-settings">
          <div className="setting-item">
            <div className="setting-header">
              <label htmlFor="context-window">Context Window Size</label>
              <span className="setting-value">{settings.context_window_size.toLocaleString()} tokens</span>
            </div>
            <input
              id="context-window"
              type="range"
              min="2048"
              max="32768"
              step="2048"
              value={settings.context_window_size}
              onChange={(e) => handleContextWindowChange(parseInt(e.target.value))}
              disabled={saving}
              className="slider"
            />
            <div className="setting-description">
              Controls conversation memory length. Higher values use more RAM but remember more context.
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-header">
              <label htmlFor="max-ram">Maximum RAM Usage</label>
              <span className="setting-value">{settings.max_ram_usage_gb} GB</span>
            </div>
            <input
              id="max-ram"
              type="range"
              min="4"
              max="32"
              step="2"
              value={settings.max_ram_usage_gb}
              onChange={(e) => handleMaxRAMChange(parseInt(e.target.value))}
              disabled={saving}
              className="slider"
            />
            <div className="setting-description">
              Limits maximum RAM usage. Lower values reduce memory footprint but may affect performance.
            </div>
          </div>

          <div className="setting-info">
            <p>💡 <strong>Tip:</strong> If you experience slowdowns or crashes, try reducing these values.</p>
            <p>📊 Recommended: 8GB RAM limit with 8192 token context for most systems</p>
          </div>
        </div>
      </div>

      <style>{`
        .llm-settings-panel {
          padding: 20px;
          max-width: 800px;
        }

        .settings-section {
          margin-bottom: 30px;
          padding: 20px;
          background: var(--bg-secondary, #f5f5f5);
          border-radius: 8px;
        }

        .settings-section h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: var(--text-primary, #333);
        }

        .vram-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label {
          font-weight: 500;
          color: var(--text-secondary, #666);
        }

        .value {
          font-weight: 600;
          color: var(--text-primary, #333);
          font-size: 1.1em;
        }

        .recommended-models {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .model-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .model-badge {
          padding: 4px 12px;
          background: var(--accent-color, #4CAF50);
          color: white;
          border-radius: 16px;
          font-size: 0.9em;
          font-weight: 500;
        }

        .model-selector {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .model-selector label {
          font-weight: 500;
          color: var(--text-secondary, #666);
        }

        .model-select {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 4px;
          font-size: 1em;
          background: white;
        }

        .model-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .saving-indicator {
          color: var(--accent-color, #4CAF50);
          font-size: 0.9em;
        }

        .mode-description {
          margin-bottom: 16px;
        }

        .mode-description p {
          margin: 0 0 8px 0;
          color: var(--text-secondary, #666);
        }

        .mode-description ul {
          margin: 0;
          padding-left: 20px;
          color: var(--text-secondary, #666);
        }

        .mode-description li {
          margin: 4px 0;
        }

        .mode-buttons {
          display: flex;
          gap: 16px;
        }

        .mode-button {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          border: 2px solid var(--border-color, #ddd);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-button:hover:not(:disabled) {
          border-color: var(--accent-color, #4CAF50);
          transform: translateY(-2px);
        }

        .mode-button.active {
          border-color: var(--accent-color, #4CAF50);
          background: var(--accent-light, #e8f5e9);
        }

        .mode-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mode-icon {
          font-size: 2em;
        }

        .mode-label {
          font-weight: 600;
          font-size: 1.1em;
          color: var(--text-primary, #333);
        }

        .loading-spinner,
        .error-message {
          padding: 40px;
          text-align: center;
          color: var(--text-secondary, #666);
        }

        .error-message {
          color: var(--error-color, #f44336);
        }

        .performance-settings {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .setting-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .setting-header label {
          font-weight: 600;
          color: var(--text-primary, #333);
          font-size: 1em;
        }

        .setting-value {
          font-weight: 600;
          color: var(--accent-color, #4CAF50);
          font-size: 1.1em;
        }

        .slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #e0e0e0 0%, var(--accent-color, #4CAF50) 100%);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent-color, #4CAF50);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent-color, #4CAF50);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }

        .slider:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .setting-description {
          font-size: 0.9em;
          color: var(--text-secondary, #666);
          line-height: 1.4;
        }

        .setting-info {
          margin-top: 8px;
          padding: 16px;
          background: #fff9e6;
          border-left: 4px solid #ffd700;
          border-radius: 4px;
        }

        .setting-info p {
          margin: 0 0 8px 0;
          color: var(--text-primary, #333);
          font-size: 0.95em;
        }

        .setting-info p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

export default LLMSettingsPanel;

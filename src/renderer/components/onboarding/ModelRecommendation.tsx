/**
 * ModelRecommendation Component
 * Third step (after survey): Show multiple model options based on system specs and language preference
 */

import { useState, useEffect } from 'react';
import type { SystemSpecs, ModelOption, RequiredModels } from '../../lib/tauri-api';

interface ModelRecommendationProps {
  specs: SystemSpecs;
  languagePreference: string;
  onAccept: (selectedModel: string, requiredModels: RequiredModels) => void;
  onBack: () => void;
}

export default function ModelRecommendation({
  specs,
  languagePreference,
  onAccept,
  onBack,
}: ModelRecommendationProps) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [requiredModels, setRequiredModels] = useState<RequiredModels | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Voice features OFF by default

  useEffect(() => {
    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update required models when voice enabled changes
  useEffect(() => {
    if (selectedModel) {
      updateRequiredModels(selectedModel);
    }
  }, [voiceEnabled]);

  const updateRequiredModels = async (modelName: string) => {
    try {
      const models = await window.api.getRequiredModels(modelName, voiceEnabled);
      setRequiredModels(models);
    } catch (err) {
      console.error('Failed to get required models:', err);
    }
  };

  const loadModels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get available models based on language preference
      const availableModels = await window.api.getAvailableModelsForSystem(languagePreference);
      setModels(availableModels);

      // Auto-select the recommended model
      const recommended = availableModels.find((m: { is_recommended: boolean }) => m.is_recommended);
      if (recommended) {
        setSelectedModel(recommended.model);
        await updateRequiredModels(recommended.model);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    }
  };

  const handleModelSelect = async (modelName: string) => {
    setSelectedModel(modelName);
    await updateRequiredModels(modelName);
  };

  const handleAccept = () => {
    if (selectedModel && requiredModels) {
      onAccept(selectedModel, requiredModels);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400">
            최적의 모델을 찾는 중...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              모델 로드 실패
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              이전으로
            </button>
            <button
              onClick={loadModels}
              className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              시스템 사양 부족
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              시스템 RAM이 부족합니다. Garden of Eden은 최소 8GB RAM이 필요합니다.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">현재 시스템:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                메모리: <span className="text-red-600 dark:text-red-400 font-semibold">{specs.total_ram_gb}GB</span> (최소 8GB 필요)
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            이전으로
          </button>
        </div>
      </div>
    );
  }

  // TODO: Use recommended model for UI highlighting
  // const recommendedModel = models.find((m) => m.is_recommended);
  const tierName =
    specs.total_ram_gb < 12
      ? '경량 (Lightweight)'
      : specs.total_ram_gb < 20
      ? '균형 (Moderate)'
      : '최적 (Optimal)';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 animate-fadeIn">
      <div className="max-w-5xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold mb-4">
            {specs.total_ram_gb < 12 ? '💡' : specs.total_ram_gb < 20 ? '⚡' : '🚀'}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI 모델 선택
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            RAM {specs.total_ram_gb}GB · {tierName} 티어
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {languagePreference === '영어' ? 'English-only models' : '한국어 지원 모델'}
          </p>
        </div>

        {/* Model Cards Grid */}
        <div className={`grid gap-4 mb-6 ${models.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {models.map((model) => (
            <ModelCard
              key={model.model}
              model={model}
              isSelected={selectedModel === model.model}
              onSelect={() => handleModelSelect(model.model)}
            />
          ))}
        </div>

        {/* Voice Features Toggle */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  voiceEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                음성 기능 사용 {voiceEnabled ? '✓' : ''}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                음성 인식 (Whisper, +3.1GB)을 다운로드하여 음성으로 대화할 수 있습니다.
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {voiceEnabled
                  ? '음성 기능이 활성화됩니다. 나중에 설정에서 변경할 수 있습니다.'
                  : '텍스트로만 대화합니다. 필요시 설정에서 음성 모델을 다운로드할 수 있습니다.'}
              </p>
            </div>
          </div>
        </div>

        {/* Required Models Summary */}
        {requiredModels && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              다운로드할 AI 모델 패키지:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">💬 대화 AI (LLM)</span>
                <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                  {requiredModels.llm}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">👁️ 비전 AI (화면 분석)</span>
                <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                  {requiredModels.llava}
                </code>
              </div>
              {requiredModels.whisper && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">🎤 음성 인식 (Whisper)</span>
                  <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                    {requiredModels.whisper}
                  </code>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 flex justify-between font-semibold">
                <span className="text-gray-700 dark:text-gray-300">총 용량:</span>
                <span className="text-gray-900 dark:text-white">
                  ~{requiredModels.total_size_gb.toFixed(1)}GB
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">예상 메모리 사용량:</span>
                <span className="text-gray-900 dark:text-white">
                  ~{requiredModels.total_ram_usage_gb}GB
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            이전으로
          </button>
          <button
            onClick={handleAccept}
            disabled={!selectedModel || !requiredModels}
            className="flex-[2] py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음: 모델 다운로드
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

function ModelCard({
  model,
  isSelected,
  onSelect,
}: {
  model: ModelOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative p-6 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      {/* Recommended Badge */}
      {model.is_recommended && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
          추천
        </div>
      )}

      {/* Model Name & Specs */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {model.display_name}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
            {model.size_gb.toFixed(1)}GB
          </span>
          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
            {model.quantization}
          </span>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
            {model.expected_speed_ts.toFixed(0)} t/s
          </span>
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
            {model.quality_tier}
          </span>
        </div>
      </div>

      {/* Pros */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 mb-2">장점:</p>
        <ul className="space-y-1">
          {model.pros.map((pro, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons */}
      {model.cons.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 mb-2">단점:</p>
          <ul className="space-y-1">
            {model.cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

/**
 * ModelRecommendation Component
 * Second step: Show recommended model based on system specs
 */

import { useState, useEffect } from 'react';
import type { SystemSpecs, ModelRecommendation as ModelRec, RequiredModels } from '../../lib/tauri-api';

interface ModelRecommendationProps {
  specs: SystemSpecs;
  onAccept: (selectedModel: string, requiredModels: RequiredModels) => void;
  onBack: () => void;
}

export default function ModelRecommendation({ specs, onAccept, onBack }: ModelRecommendationProps) {
  const [recommendation, setRecommendation] = useState<ModelRec | null>(null);
  const [requiredModels, setRequiredModels] = useState<RequiredModels | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get recommendation
      const rec = await window.api.getModelRecommendation(specs);
      setRecommendation(rec);

      // Get required models if recommendation is valid
      if (rec.model) {
        const models = await window.api.getRequiredModels(rec.model);
        setRequiredModels(models);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to get recommendation:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (recommendation?.model && requiredModels) {
      onAccept(recommendation.model, requiredModels);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400">
            최적의 모델을 추천하는 중...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              모델 추천 실패
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
              onClick={loadRecommendation}
              className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  // Insufficient specs
  if (recommendation.recommendation_type === 'insufficient') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
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
              {recommendation.reason}
            </p>
          </div>

          {/* Requirements */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">최소 요구 사양:</p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-orange-600">•</span>
                <span>메모리: 8GB 이상</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-600">•</span>
                <span>여유 공간: 20GB 이상</span>
              </li>
            </ul>
          </div>

          {/* Current Specs */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">현재 시스템:</p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex justify-between">
                <span>메모리:</span>
                <span className={specs.total_ram_gb < 8 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                  {specs.total_ram_gb}GB
                </span>
              </li>
              <li className="flex justify-between">
                <span>여유 공간:</span>
                <span className={specs.disk_free_gb < 20 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                  {specs.disk_free_gb}GB
                </span>
              </li>
            </ul>
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

  // Valid recommendation
  const typeColors = {
    lightweight: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
    moderate: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
    optimal: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
    insufficient: { bg: '', text: '', border: '' },
  };

  const colors = typeColors[recommendation.recommendation_type];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 animate-fadeIn">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colors.bg} ${colors.text} text-2xl font-bold mb-4`}>
            {recommendation.recommendation_type === 'optimal' && '🚀'}
            {recommendation.recommendation_type === 'moderate' && '⚡'}
            {recommendation.recommendation_type === 'lightweight' && '💡'}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {recommendation.recommendation_type === 'optimal' && '최적의 성능!'}
            {recommendation.recommendation_type === 'moderate' && '균형잡힌 성능'}
            {recommendation.recommendation_type === 'lightweight' && '경량 모델 권장'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {recommendation.reason}
          </p>
        </div>

        {/* Recommended Model */}
        <div className={`border-2 ${colors.border} rounded-xl p-6 mb-6`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">권장 모델</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {recommendation.model_display_name || recommendation.model}
              </h3>
            </div>
            <div className={`px-3 py-1 rounded-full ${colors.bg} ${colors.text} text-sm font-medium`}>
              {recommendation.size_gb}GB
            </div>
          </div>

          {/* Notes */}
          {recommendation.notes && recommendation.notes.length > 0 && (
            <ul className="space-y-2">
              {recommendation.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className={colors.text}>✓</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Required Models */}
        {requiredModels && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">다운로드할 모델:</h4>
            <div className="space-y-3">
              <ModelItem
                name="대화 AI (LLM)"
                model={requiredModels.llm}
                description="대화, 추론, 코드 생성"
              />
              <ModelItem
                name="비전 AI (LLaVA)"
                model={requiredModels.llava}
                description="화면 분석, 이미지 이해"
              />
              <ModelItem
                name="음성 인식 (Whisper)"
                model={requiredModels.whisper}
                description="음성을 텍스트로 변환"
              />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 flex justify-between text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">총 용량:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ~{requiredModels.total_size_gb.toFixed(1)}GB
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">예상 메모리 사용량:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ~{requiredModels.total_ram_usage_gb}GB
              </span>
            </div>
          </div>
        )}

        {/* Expected RAM usage warning */}
        {recommendation.expected_ram_usage_gb && recommendation.expected_ram_usage_gb > specs.available_ram_gb && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 이 모델은 실행 시 약 {recommendation.expected_ram_usage_gb}GB의 메모리를 사용합니다.
              현재 사용 가능한 메모리({specs.available_ram_gb}GB)보다 많을 수 있으므로,
              다른 프로그램을 종료한 후 사용하는 것을 권장합니다.
            </p>
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
            className="flex-[2] py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            다음: 개성 설정
          </button>
        </div>
      </div>

      {/* Add animations */}
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

function ModelItem({ name, model, description }: { name: string; model: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
        {model}
      </code>
    </div>
  );
}

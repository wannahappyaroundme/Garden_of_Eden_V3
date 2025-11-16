/**
 * SystemCheck Component
 * First step: Detect system specifications and display results
 */

import { useState, useEffect } from 'react';
import type { SystemSpecs } from '../../lib/tauri-api';

interface SystemCheckProps {
  onComplete: (specs: SystemSpecs) => void;
}

export default function SystemCheck({ onComplete }: SystemCheckProps) {
  const [isDetecting, setIsDetecting] = useState(true);
  const [specs, setSpecs] = useState<SystemSpecs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectSpecs();
  }, []);

  const detectSpecs = async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const detectedSpecs = await window.api.detectSystemSpecs();
      setSpecs(detectedSpecs);
      setIsDetecting(false);

      // Auto-proceed after 1.5s to show results
      setTimeout(() => {
        onComplete(detectedSpecs);
      }, 1500);
    } catch (err) {
      console.error('Failed to detect system specs:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsDetecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold mb-4">
            E
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            시스템 분석 중...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            당신의 컴퓨터 환경을 분석하여 최적의 AI 모델을 추천해드립니다
          </p>
        </div>

        {/* Detection State */}
        {isDetecting && !error && (
          <div className="space-y-6">
            {/* Loading Animation */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
              <ProgressItem label="CPU 정보 확인 중..." delay={0} />
              <ProgressItem label="메모리 용량 분석 중..." delay={300} />
              <ProgressItem label="GPU 가속 지원 확인 중..." delay={600} />
              <ProgressItem label="디스크 공간 확인 중..." delay={900} />
            </div>
          </div>
        )}

        {/* Results Display */}
        {!isDetecting && specs && !error && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                시스템 분석 완료!
              </p>
            </div>

            {/* Spec Cards */}
            <div className="grid grid-cols-2 gap-4">
              <SpecCard
                icon="💻"
                label="CPU"
                value={specs.cpu_name}
                detail={`${specs.cpu_cores}코어`}
              />
              <SpecCard
                icon="🧠"
                label="메모리"
                value={`${specs.total_ram_gb}GB`}
                detail={`사용 가능: ${specs.available_ram_gb}GB`}
              />
              <SpecCard
                icon="🎮"
                label="GPU"
                value={specs.has_gpu ? '지원됨' : '미지원'}
                detail={specs.gpu_name || 'N/A'}
              />
              <SpecCard
                icon="💾"
                label="여유 공간"
                value={`${specs.disk_free_gb}GB`}
                detail={specs.os}
              />
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              최적의 모델을 추천하는 중...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                시스템 분석 실패
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
            </div>

            <button
              onClick={detectSpecs}
              className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}
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

// Progress Item Component
function ProgressItem({ label, delay }: { label: string; delay: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-3 animate-fadeIn">
      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );
}

// Spec Card Component
function SpecCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="font-semibold text-gray-900 dark:text-white truncate">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{detail}</p>
        </div>
      </div>
    </div>
  );
}

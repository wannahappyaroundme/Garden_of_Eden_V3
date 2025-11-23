/**
 * ModelDownloader Component
 * Fourth step: Download all required models (LLM, LLaVA) with progress tracking
 */

import { useState, useEffect, useRef } from 'react';
import type { RequiredModels, ModelDownloadState, DownloadProgress } from '../../lib/tauri-api';

interface ModelDownloaderProps {
  requiredModels: RequiredModels;
  onComplete: () => void;
  onBack: () => void;
}

export default function ModelDownloader({ requiredModels, onComplete, onBack }: ModelDownloaderProps) {
  const [downloadState, setDownloadState] = useState<ModelDownloadState | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'checking' | 'installing_ollama' | 'downloading' | 'completed' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [ollamaInstalled, setOllamaInstalled] = useState(false);
  const [isInstallingOllama, setIsInstallingOllama] = useState(false);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkOllamaAndModels();

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  const checkOllamaAndModels = async () => {
    try {
      console.log('[ModelDownloader] Checking Ollama and models...');

      // Check if Ollama is installed
      const installed = await window.api.checkOllamaInstalled();
      console.log('[ModelDownloader] Ollama installed:', installed);
      setOllamaInstalled(installed);

      if (!installed) {
        console.log('[ModelDownloader] Ollama not installed, showing error');
        setCurrentPhase('error');
        setError('Ollama가 설치되어 있지 않습니다.');
        return;
      }

      // Check which models already exist
      console.log('[ModelDownloader] Checking model existence:', {
        llm: requiredModels.llm,
        llava: requiredModels.llava,
      });

      const llmExists = await window.api.checkModelExists(requiredModels.llm);
      const llavaExists = await window.api.checkModelExists(requiredModels.llava);

      console.log('[ModelDownloader] Model existence check results:', {
        llmExists,
        llavaExists,
      });

      if (llmExists && llavaExists) {
        // All required models already exist
        console.log('[ModelDownloader] All models exist, completing...');
        setCurrentPhase('completed');
        setTimeout(() => onComplete(), 1500);
        return;
      }

      // Start downloads for missing models
      console.log('[ModelDownloader] Starting downloads for missing models...');
      setCurrentPhase('downloading');
      startDownloads(llmExists, llavaExists);
    } catch (err) {
      console.error('[ModelDownloader] Error in checkOllamaAndModels:', err);
      setError(err instanceof Error ? err.message : String(err));
      setCurrentPhase('error');
    }
  };

  const handleInstallOllama = async () => {
    setIsInstallingOllama(true);
    setCurrentPhase('installing_ollama');
    setError(null);

    try {
      await window.api.installOllama();
      setOllamaInstalled(true);

      // After installation, restart the check process
      setTimeout(() => {
        setIsInstallingOllama(false);
        checkOllamaAndModels();
      }, 2000);
    } catch (err) {
      console.error('Failed to install Ollama:', err);
      setError(err instanceof Error ? err.message : String(err));
      setCurrentPhase('error');
      setIsInstallingOllama(false);
    }
  };

  const startDownloads = async (llmExists: boolean, llavaExists: boolean) => {
    try {
      console.log('[ModelDownloader] startDownloads called with:', { llmExists, llavaExists });

      // Start downloads (they run in background)
      if (!llmExists) {
        console.log('[ModelDownloader] Starting LLM download:', requiredModels.llm);
        await window.api.startModelDownload(requiredModels.llm, 'llm');
        console.log('[ModelDownloader] LLM download started');
      } else {
        console.log('[ModelDownloader] LLM already exists, skipping download');
      }

      if (!llavaExists) {
        console.log('[ModelDownloader] Starting LLaVA download:', requiredModels.llava);
        await window.api.startModelDownload(requiredModels.llava, 'llava');
        console.log('[ModelDownloader] LLaVA download started');
      } else {
        console.log('[ModelDownloader] LLaVA already exists, skipping download');
      }

      console.log('[ModelDownloader] All downloads initiated, starting progress polling...');

      // Start polling for progress
      pollInterval.current = setInterval(async () => {
        try {
          const state = await window.api.getDownloadProgress();
          console.log('[ModelDownloader] Download state:', state);
          setDownloadState(state);

          // Check if all completed
          const allCompleted =
            (llmExists || isCompleted(state.llm_model)) &&
            (llavaExists || isCompleted(state.llava_model));

          console.log('[ModelDownloader] Completion check:', {
            llmStatus: llmExists ? 'exists' : state.llm_model.status,
            llavaStatus: llavaExists ? 'exists' : state.llava_model.status,
            allCompleted
          });

          if (allCompleted) {
            console.log('[ModelDownloader] All downloads completed!');
            if (pollInterval.current) {
              clearInterval(pollInterval.current);
              pollInterval.current = null;
            }
            setCurrentPhase('completed');
            setTimeout(() => onComplete(), 2000);
          }

          // Check for errors
          const hasError =
            isFailed(state.llm_model) ||
            isFailed(state.llava_model);

          if (hasError) {
            console.error('[ModelDownloader] Download error detected:', {
              llm: state.llm_model.status,
              llava: state.llava_model.status,
            });
            if (pollInterval.current) {
              clearInterval(pollInterval.current);
              pollInterval.current = null;
            }
            setError('모델 다운로드 중 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
            setCurrentPhase('error');
          }
        } catch (err) {
          console.error('[ModelDownloader] Error polling download progress:', err);
        }
      }, 1000);
    } catch (err) {
      console.error('[ModelDownloader] Error in startDownloads:', err);
      setError(err instanceof Error ? err.message : String(err));
      setCurrentPhase('error');
    }
  };

  const isCompleted = (progress: DownloadProgress): boolean => {
    return typeof progress.status === 'string' && progress.status === 'completed';
  };

  const isFailed = (progress: DownloadProgress): boolean => {
    return typeof progress.status === 'object' && 'Failed' in progress.status;
  };

  // TODO: Use getStatusText for UI display
  // const getStatusText = (progress: DownloadProgress): string => { ... }

  if (currentPhase === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            환경 확인 중...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Ollama 설치 여부와 모델 상태를 확인하고 있습니다
          </p>
        </div>
      </div>
    );
  }

  if (currentPhase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              다운로드 실패
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
          </div>

          {!ollamaInstalled && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Ollama가 설치되어 있지 않습니다
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    Eden은 Ollama를 사용하여 AI 모델을 관리합니다. 아래 버튼을 클릭하여 자동으로 설치하거나, 수동으로 설치할 수 있습니다.
                  </p>

                  {/* Auto-install button */}
                  <button
                    onClick={handleInstallOllama}
                    disabled={isInstallingOllama}
                    className="w-full mb-3 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isInstallingOllama ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        자동 설치 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Ollama 자동 설치 (권장)
                      </>
                    )}
                  </button>

                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p className="mb-2">또는 수동으로 설치:</p>
                    <ol className="space-y-1 list-decimal list-inside ml-2">
                      <li>
                        <a
                          href="https://ollama.ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          https://ollama.ai
                        </a>
                        에서 다운로드
                      </li>
                      <li>설치 완료 후 "다시 시도" 버튼 클릭</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              이전으로
            </button>
            <button
              onClick={() => {
                setError(null);
                setCurrentPhase('checking');
                checkOllamaAndModels();
              }}
              className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPhase === 'installing_ollama') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Ollama 설치 중...
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {navigator.platform.includes('Mac')
              ? 'Homebrew를 통해 Ollama를 자동으로 설치하고 있습니다.'
              : 'Ollama를 자동으로 설치하고 있습니다.'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            이 작업은 몇 분 정도 소요될 수 있습니다. 잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  if (currentPhase === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            모든 모델 다운로드 완료!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            에덴을 사용할 준비가 완료되었습니다
          </p>
        </div>
      </div>
    );
  }

  // Downloading phase
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold mb-4">
            E
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            AI 모델 다운로드 중...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            총 {requiredModels.total_size_gb.toFixed(1)}GB의 모델을 다운로드합니다
          </p>
        </div>

        {/* Download Progress */}
        {downloadState && (
          <div className="space-y-4">
            <ModelDownloadItem
              name="대화 AI (LLM)"
              model={requiredModels.llm}
              progress={downloadState.llm_model}
              icon="💬"
            />
            <ModelDownloadItem
              name="비전 AI (LLaVA)"
              model={requiredModels.llava}
              progress={downloadState.llava_model}
              icon="👁️"
            />
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            ℹ️ 다운로드가 중단되어도 다음 실행 시 자동으로 이어서 진행됩니다.
            인터넷 연결이 느릴 경우 시간이 다소 걸릴 수 있습니다.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6">
          <button
            onClick={onBack}
            className="w-full py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            이전으로
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

function ModelDownloadItem({
  name,
  model,
  progress,
  icon,
}: {
  name: string;
  model: string;
  progress: DownloadProgress;
  icon: string;
}) {
  const isCompleted = typeof progress.status === 'string' && progress.status === 'completed';
  const isFailed = typeof progress.status === 'object' && 'Failed' in progress.status;
  const isDownloading = typeof progress.status === 'object' && 'Downloading' in progress.status;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{model}</p>
        </div>
        {isCompleted && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {isFailed && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted
                ? 'bg-green-500'
                : isFailed
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${progress.progress_percent}%` }}
          />
        </div>
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${
          isCompleted
            ? 'text-green-600 dark:text-green-400'
            : isFailed
              ? 'text-red-600 dark:text-red-400'
              : 'text-blue-600 dark:text-blue-400'
        }`}>
          {isCompleted && '완료'}
          {isFailed && '실패'}
          {isDownloading && `다운로드 중... ${progress.progress_percent.toFixed(1)}%`}
          {!isCompleted && !isFailed && !isDownloading && '대기 중...'}
        </span>
        {isDownloading && progress.speed_mbps && (
          <span className="text-gray-500 dark:text-gray-400">
            {progress.speed_mbps.toFixed(1)} MB/s
          </span>
        )}
      </div>
    </div>
  );
}

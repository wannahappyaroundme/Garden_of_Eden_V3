/**
 * SurveyFlow Component
 * Third step: 7-question personality survey (4 multiple-choice + 3 open-ended)
 */

import { useState } from 'react';
import type { SurveyResults } from '../../lib/tauri-api';

interface SurveyFlowProps {
  onComplete: (results: SurveyResults, customPrompt: string) => void;
  onBack: () => void;
}

interface Question {
  id: keyof SurveyResults;
  type: 'choice' | 'text';
  question: string;
  description?: string;
  choices?: { value: string; label: string; emoji?: string }[];
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'primary_use',
    type: 'choice',
    question: '에덴을 주로 어떤 용도로 사용하실 계획인가요?',
    description: '가장 중요한 목적을 선택해주세요',
    choices: [
      { value: '일상 대화 및 친구처럼 위로받기', label: '일상 대화 및 친구처럼 위로받기', emoji: '💬' },
      { value: '업무 생산성 향상 (코딩, 문서 작성 등)', label: '업무 생산성 향상 (코딩, 문서 작성 등)', emoji: '💼' },
      { value: '학습 및 지식 탐구', label: '학습 및 지식 탐구', emoji: '📚' },
      { value: '창작 활동 (글쓰기, 아이디어 발상 등)', label: '창작 활동 (글쓰기, 아이디어 발상 등)', emoji: '🎨' },
    ],
  },
  {
    id: 'ai_experience',
    type: 'choice',
    question: 'AI 어시스턴트 사용 경험이 어느 정도이신가요?',
    choices: [
      { value: '처음 사용해봅니다', label: '처음 사용해봅니다', emoji: '🌱' },
      { value: '가끔 사용해봤습니다', label: '가끔 사용해봤습니다', emoji: '🌿' },
      { value: '자주 사용합니다', label: '자주 사용합니다', emoji: '🌳' },
      { value: '거의 매일 사용합니다', label: '거의 매일 사용합니다', emoji: '🌲' },
    ],
  },
  {
    id: 'primary_language',
    type: 'choice',
    question: '주로 어떤 언어로 대화하실 건가요?',
    choices: [
      { value: '한국어', label: '한국어', emoji: '🇰🇷' },
      { value: '영어', label: 'English', emoji: '🇺🇸' },
      { value: '한영 혼용', label: '한국어 + English', emoji: '🌐' },
    ],
  },
  {
    id: 'speech_style',
    type: 'choice',
    question: 'AI가 어떤 말투로 대화하기를 원하시나요?',
    choices: [
      { value: '친근하고 편안한 말투 (반말)', label: '친근하고 편안한 말투 (반말)', emoji: '😊' },
      { value: '공손하면서도 친근한 말투 (존댓말)', label: '공손하면서도 친근한 말투 (존댓말)', emoji: '🙂' },
      { value: '전문적이고 격식있는 말투', label: '전문적이고 격식있는 말투', emoji: '👔' },
    ],
  },
  {
    id: 'ideal_ai_personality',
    type: 'text',
    question: '이상적인 AI의 성격과 특성은 어떤 모습인가요?',
    description: '예: 유머러스하고 낙천적이며, 실수해도 격려해주는 친구 같은 AI',
    placeholder: '자유롭게 작성해주세요...',
  },
  {
    id: 'previous_ai_lacking',
    type: 'text',
    question: '이전에 사용했던 AI에서 아쉬웠던 점이 있나요?',
    description: '없다면 "없음" 또는 "처음 사용"이라고 작성해주세요',
    placeholder: '예: 대화가 너무 딱딱했다, 맥락을 잘 이해하지 못했다 등...',
  },
  {
    id: 'desired_features',
    type: 'text',
    question: '에덴에서 가장 기대하는 기능이나 특징은 무엇인가요?',
    description: '여러 개를 작성하셔도 좋습니다',
    placeholder: '예: 화면을 이해하고 코드를 도와주는 기능, 목소리로 대화하기 등...',
  },
];

export default function SurveyFlow({ onComplete, onBack }: SurveyFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<SurveyResults>>({});
  const [textInput, setTextInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleChoiceSelect = (value: string) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };
    setAnswers(newAnswers);

    // Auto-advance for choice questions
    setTimeout(() => {
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete(newAnswers);
      }
    }, 300);
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: textInput.trim(),
    };
    setAnswers(newAnswers);
    setTextInput('');

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete(newAnswers);
    }
  };

  const handleComplete = async (finalAnswers: Partial<SurveyResults>) => {
    setIsGenerating(true);

    try {
      // Ensure all fields are filled
      const completeAnswers: SurveyResults = {
        primary_use: finalAnswers.primary_use || '',
        ai_experience: finalAnswers.ai_experience || '',
        primary_language: finalAnswers.primary_language || '',
        speech_style: finalAnswers.speech_style || '',
        ideal_ai_personality: finalAnswers.ideal_ai_personality || '',
        previous_ai_lacking: finalAnswers.previous_ai_lacking || '',
        desired_features: finalAnswers.desired_features || '',
      };

      // Generate custom prompt
      const customPrompt = await window.api.generateCustomPrompt(completeAnswers);

      onComplete(completeAnswers, customPrompt);
    } catch (error) {
      console.error('Failed to generate custom prompt:', error);
      alert('설정 생성에 실패했습니다: ' + error);
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTextInput('');
    } else {
      onBack();
    }
  };

  const handleSkip = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            당신만을 위한 AI를 만들고 있습니다...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            응답을 분석하여 맞춤형 설정을 생성하는 중입니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header with Progress */}
      <div className="max-w-2xl w-full mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            개성 설정
          </h2>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentStep + 1} / {QUESTIONS.length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-slideIn">
          {/* Question */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {currentQuestion.question}
            </h1>
            {currentQuestion.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {currentQuestion.description}
              </p>
            )}
          </div>

          {/* Answer Area */}
          {currentQuestion.type === 'choice' ? (
            // Multiple Choice
            <div className="space-y-3">
              {currentQuestion.choices?.map((choice) => (
                <button
                  key={choice.value}
                  onClick={() => handleChoiceSelect(choice.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    answers[currentQuestion.id] === choice.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {choice.emoji && <span className="text-3xl">{choice.emoji}</span>}
                  <span className="flex-1 font-medium text-gray-900 dark:text-white">
                    {choice.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            // Text Input
            <div className="space-y-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleTextSubmit();
                  }
                }}
                placeholder={currentQuestion.placeholder}
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cmd/Ctrl + Enter로 제출
                </p>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  다음
                </button>
              </div>
              {currentQuestion.type === 'text' && (
                <button
                  onClick={handleSkip}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  건너뛰기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-2xl w-full mx-auto mt-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">이전</span>
        </button>
      </div>

      {/* Add animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

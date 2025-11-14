/**
 * Persona Preview Modal
 * Shows preview conversation with selected persona before confirming choice
 */

import { useState } from 'react';
import type { PersonaChoice } from '@shared/types/onboarding.types';

interface PersonaPreviewModalProps {
  persona: PersonaChoice;
  onClose: () => void;
  onSelect: (persona: PersonaChoice) => void;
}

interface PreviewMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PERSONA_PREVIEWS: Record<PersonaChoice, PreviewMessage[]> = {
  Adam: [
    {
      role: 'user',
      content: '오늘 코딩하다가 막혔어...',
    },
    {
      role: 'assistant',
      content: '어? 무슨 문제야? 같이 보자! 🔥\n\n어떤 부분에서 막혔는지 자세히 말해줘. 내가 도와줄게!',
    },
    {
      role: 'user',
      content: '너무 피곤해서 집중이 안 돼.',
    },
    {
      role: 'assistant',
      content: '아 진짜? 그럼 잠깐 쉬어가는 게 어때?\n\n10분만 산책하거나 스트레칭하면 훨씬 나아질 거야! 💪',
    },
  ],
  Eve: [
    {
      role: 'user',
      content: '오늘 코딩하다가 막혔어...',
    },
    {
      role: 'assistant',
      content: '힘드셨겠어요. 천천히 어떤 부분인지 말씀해주세요 😊\n\n함께 차근차근 해결해봐요.',
    },
    {
      role: 'user',
      content: '너무 피곤해서 집중이 안 돼.',
    },
    {
      role: 'assistant',
      content: '많이 지치셨나봐요.\n\n잠깐 휴식을 취하시는 건 어떨까요? 무리하지 마시고 편하게 쉬세요 🌸',
    },
  ],
};

const PERSONA_INFO: Record<PersonaChoice, { name: string; emoji: string; description: string; traits: string[] }> = {
  Adam: {
    name: '아담',
    emoji: '👨',
    description: '활발하고 적극적인 성격',
    traits: ['에너지 넘치는', '격려하는', '친근한', '직설적인'],
  },
  Eve: {
    name: '이브',
    emoji: '👩',
    description: '차분하고 사려깊은 성격',
    traits: ['공감하는', '차분한', '배려하는', '섬세한'],
  },
};

export default function PersonaPreviewModal({ persona, onClose, onSelect }: PersonaPreviewModalProps) {
  const [currentExample, setCurrentExample] = useState(0);
  const info = PERSONA_INFO[persona];
  const examples = PERSONA_PREVIEWS[persona];
  const totalExamples = examples.length / 2; // User + Assistant pairs

  const handleNext = () => {
    if (currentExample < totalExamples - 1) {
      setCurrentExample(currentExample + 1);
    }
  };

  const handlePrevious = () => {
    if (currentExample > 0) {
      setCurrentExample(currentExample - 1);
    }
  };

  const startIndex = currentExample * 2;
  const currentMessages = examples.slice(startIndex, startIndex + 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{info.emoji}</div>
              <div>
                <h2 className="text-2xl font-bold">{info.name}</h2>
                <p className="text-blue-100">{info.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Traits */}
          <div className="flex flex-wrap gap-2 mt-4">
            {info.traits.map(trait => (
              <span
                key={trait}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Preview Messages */}
        <div className="p-8 min-h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">대화 미리보기</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentExample === 0}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="이전 예시"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentExample + 1} / {totalExamples}
              </span>
              <button
                onClick={handleNext}
                disabled={currentExample === totalExamples - 1}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="다음 예시"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {currentMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              다시 선택하기
            </button>
            <button
              onClick={() => onSelect(persona)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              {info.name} 선택하기
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

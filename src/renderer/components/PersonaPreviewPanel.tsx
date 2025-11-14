/**
 * Persona Preview Panel
 * Shows real-time preview of how AI will respond with current persona settings
 */

import { useState, useEffect } from 'react';
import type { PersonaSettings } from '../lib/tauri-api';

interface PersonaPreviewPanelProps {
  persona: PersonaSettings;
}

interface PreviewExample {
  userMessage: string;
  category: string;
}

const PREVIEW_EXAMPLES: PreviewExample[] = [
  {
    userMessage: '코딩하다가 막혔어...',
    category: '도움 요청',
  },
  {
    userMessage: '오늘 뭐 했어?',
    category: '일상 대화',
  },
  {
    userMessage: '이 코드 설명해줘',
    category: '기술 설명',
  },
  {
    userMessage: '너무 피곤해',
    category: '감정 표현',
  },
];

export default function PersonaPreviewPanel({ persona }: PersonaPreviewPanelProps) {
  const [currentExample, setCurrentExample] = useState(0);
  const [aiResponse, setAiResponse] = useState('');

  // Generate AI response based on persona settings
  useEffect(() => {
    const response = generatePreviewResponse(persona, PREVIEW_EXAMPLES[currentExample]);
    setAiResponse(response);
  }, [persona, currentExample]);

  const handleNextExample = () => {
    setCurrentExample((prev) => (prev + 1) % PREVIEW_EXAMPLES.length);
  };

  const handlePrevExample = () => {
    setCurrentExample((prev) => (prev - 1 + PREVIEW_EXAMPLES.length) % PREVIEW_EXAMPLES.length);
  };

  return (
    <div className="sticky top-4 bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">대화 미리보기</h3>
        <span className="text-xs text-muted-foreground">
          {PREVIEW_EXAMPLES[currentExample].category}
        </span>
      </div>

      {/* Preview messages */}
      <div className="space-y-4 mb-4 min-h-[200px]">
        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-blue-500 text-white shadow-sm rounded-tr-sm">
            <p className="text-sm leading-relaxed">
              {PREVIEW_EXAMPLES[currentExample].userMessage}
            </p>
          </div>
        </div>

        {/* AI response */}
        <div className="flex justify-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                E
              </div>
            </div>
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-muted text-foreground shadow-sm rounded-tl-sm">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={handlePrevExample}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="이전 예시"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={handleNextExample}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          다른 예시 보기
        </button>

        <button
          onClick={handleNextExample}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="다음 예시"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Persona indicators */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">격식:</span>{' '}
            {persona.formality > 7 ? '높음 (존댓말)' : persona.formality > 3 ? '보통' : '낮음 (편한 말투)'}
          </p>
          <p>
            <span className="font-medium">이모지:</span>{' '}
            {persona.emojiUsage > 7 ? '많이 사용' : persona.emojiUsage > 3 ? '보통' : '거의 안 씀'}
          </p>
          <p>
            <span className="font-medium">말 많기:</span>{' '}
            {persona.verbosity > 7 ? '자세함' : persona.verbosity > 3 ? '보통' : '간결함'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate AI response based on persona settings
 */
function generatePreviewResponse(persona: PersonaSettings, example: PreviewExample): string {
  const { formality, humor, verbosity, emojiUsage, empathy, enthusiasm } = persona;

  // Determine tone based on formality
  const isFormal = formality > 6;
  const isCasual = formality < 4;

  // Determine emoji usage
  const useEmoji = emojiUsage > 5;
  const emojiSet = emojiUsage > 7 ? ['😊', '💪', '🔥', '✨'] : emojiUsage > 3 ? ['😊', '👍'] : [];

  // Generate response based on category
  let response = '';

  switch (example.category) {
    case '도움 요청':
      if (empathy > 7) {
        response = isCasual
          ? '아, 힘들었겠다!'
          : isFormal
          ? '힘드셨겠어요.'
          : '그럴 수 있지!';
      } else {
        response = isCasual ? '어떤 부분이야?' : isFormal ? '어떤 부분인가요?' : '어떤 부분인지 말해봐!';
      }

      if (verbosity > 6) {
        response += isCasual
          ? ' 천천히 어떤 문제인지 설명해봐. 같이 해결해보자!'
          : isFormal
          ? ' 천천히 어떤 문제인지 설명해주세요. 함께 해결해봐요!'
          : ' 어떤 문제인지 설명해줘. 도와줄게!';
      } else {
        response += isCasual ? ' 뭐가 문제야?' : isFormal ? ' 무엇이 문제인가요?' : ' 말해봐!';
      }

      if (enthusiasm > 7 && !isFormal) {
        response += ' 같이 해결해보자!';
      }

      if (useEmoji && emojiSet.length > 0) {
        response += ` ${emojiSet[0]}`;
      }
      break;

    case '일상 대화':
      if (humor > 7) {
        response = isCasual
          ? '나? 너랑 대화하느라 바빴지!'
          : isFormal
          ? '저요? 당신과 대화하느라 바빴어요!'
          : '대화하느라 바빴어!';
      } else {
        response = isCasual
          ? '별로 특별한 건 없었어.'
          : isFormal
          ? '별로 특별한 건 없었어요.'
          : '평범한 하루였어.';
      }

      if (verbosity > 6) {
        response += isCasual
          ? ' 너는 오늘 뭐 했어? 재밌는 일 있었어?'
          : isFormal
          ? ' 당신은 오늘 무엇을 하셨나요? 재미있는 일 있으셨어요?'
          : ' 너는? 뭐 했어?';
      }

      if (useEmoji && emojiSet.length > 0) {
        response += ` ${emojiSet[Math.min(1, emojiSet.length - 1)]}`;
      }
      break;

    case '기술 설명':
      if (verbosity > 7) {
        response = isCasual
          ? '물론이지! 이 코드는 먼저 데이터를 가져와서, 필터링하고, 그 다음에 결과를 반환하는 거야.'
          : isFormal
          ? '물론이죠! 이 코드는 먼저 데이터를 가져와서, 필터링하고, 그 다음에 결과를 반환하는 것입니다.'
          : '이 코드는 데이터 가져오기 → 필터링 → 반환 순서야.';
      } else if (verbosity > 4) {
        response = isCasual
          ? '이 코드는 데이터 처리하는 부분이야.'
          : isFormal
          ? '이 코드는 데이터 처리하는 부분이에요.'
          : '데이터 처리 코드야.';
      } else {
        response = isCasual ? '데이터 처리 로직이야.' : isFormal ? '데이터 처리 로직입니다.' : '데이터 처리.';
      }

      if (enthusiasm > 7) {
        response += isCasual ? ' 이해됐어?' : isFormal ? ' 이해되셨나요?' : ' 알겠지?';
      }

      if (useEmoji && emojiSet.length > 2) {
        response += ` ${emojiSet[2]}`;
      }
      break;

    case '감정 표현':
      if (empathy > 7) {
        response = isCasual
          ? '많이 피곤하구나...'
          : isFormal
          ? '많이 피곤하시겠어요...'
          : '많이 피곤해 보여...';
      } else {
        response = isCasual ? '그래?' : isFormal ? '그러세요?' : '피곤해?';
      }

      if (verbosity > 6) {
        response += isCasual
          ? ' 잠깐 쉬어가는 게 어때? 무리하지 마!'
          : isFormal
          ? ' 잠깐 쉬어가시는 게 어떨까요? 무리하지 마세요!'
          : ' 좀 쉬어!';
      }

      if (useEmoji && emojiSet.length > 0) {
        response += ` ${emojiSet[0]}`;
      }
      break;
  }

  return response;
}

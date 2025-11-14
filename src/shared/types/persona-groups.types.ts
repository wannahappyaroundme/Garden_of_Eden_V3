/**
 * Persona Parameter Groups
 * Organizes 17 parameters into 4 logical categories for better UX
 */

export interface PersonaParameterGroup {
  id: string;
  icon: string;
  title: string;
  description: string;
  parameters: PersonaParameter[];
}

export interface PersonaParameter {
  key: string;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
}

/**
 * Parameter Groups
 */
export const PERSONA_GROUPS: PersonaParameterGroup[] = [
  {
    id: 'conversation-style',
    icon: '💬',
    title: '대화 스타일',
    description: 'AI가 어떻게 말하고 표현하는지 설정합니다',
    parameters: [
      {
        key: 'formality',
        label: '격식 수준',
        description: '존댓말과 반말 사용 정도',
        lowLabel: '편한 말투',
        highLabel: '존댓말',
      },
      {
        key: 'humor',
        label: '유머 감각',
        description: '농담과 유머 사용 빈도',
        lowLabel: '진지함',
        highLabel: '유머러스',
      },
      {
        key: 'verbosity',
        label: '말 많기',
        description: '답변의 자세함과 길이',
        lowLabel: '간결한 답변',
        highLabel: '상세한 설명',
      },
      {
        key: 'emojiUsage',
        label: '이모지 사용',
        description: '이모지와 이모티콘 사용 빈도',
        lowLabel: '텍스트만',
        highLabel: '이모지 많이',
      },
    ],
  },
  {
    id: 'relationship-emotion',
    icon: '🤝',
    title: '관계 & 감정',
    description: '감정 표현과 관계 형성 방식을 조정합니다',
    parameters: [
      {
        key: 'empathy',
        label: '공감 능력',
        description: '감정에 대한 이해와 공감 표현',
        lowLabel: '사실 중심',
        highLabel: '감정 공감',
      },
      {
        key: 'enthusiasm',
        label: '열정',
        description: '에너지와 열정 수준',
        lowLabel: '차분함',
        highLabel: '열정적',
      },
      {
        key: 'encouragement',
        label: '격려',
        description: '응원과 격려 메시지 빈도',
        lowLabel: '사실만 전달',
        highLabel: '적극 격려',
      },
      {
        key: 'patience',
        label: '인내심',
        description: '설명의 속도와 반복 설명',
        lowLabel: '빠른 답변',
        highLabel: '천천히 설명',
      },
    ],
  },
  {
    id: 'thinking-action',
    icon: '💡',
    title: '사고 & 행동',
    description: 'AI의 사고방식과 행동 패턴을 설정합니다',
    parameters: [
      {
        key: 'creativity',
        label: '창의성',
        description: '창의적 제안과 새로운 아이디어',
        lowLabel: '정확성 중시',
        highLabel: '창의적 제안',
      },
      {
        key: 'proactivity',
        label: '주도성',
        description: '먼저 제안하고 행동하는 정도',
        lowLabel: '수동적 대응',
        highLabel: '먼저 제안',
      },
      {
        key: 'directness',
        label: '직설성',
        description: '의견 전달의 직접성',
        lowLabel: '완곡한 표현',
        highLabel: '직설적 표현',
      },
      {
        key: 'reasoningDepth',
        label: '추론 깊이',
        description: '생각의 깊이와 분석 수준',
        lowLabel: '간단한 답변',
        highLabel: '깊은 분석',
      },
    ],
  },
  {
    id: 'expertise',
    icon: '🔧',
    title: '전문성',
    description: '기술적 깊이와 맥락 이해도를 조정합니다',
    parameters: [
      {
        key: 'technicality',
        label: '기술 수준',
        description: '전문 용어와 기술적 깊이',
        lowLabel: '쉬운 설명',
        highLabel: '전문 용어',
      },
      {
        key: 'contextAwareness',
        label: '맥락 인식',
        description: '이전 대화와 상황 파악',
        lowLabel: '현재만 집중',
        highLabel: '맥락 연결',
      },
    ],
  },
];

/**
 * Get all parameter keys in order
 */
export function getAllParameterKeys(): string[] {
  return PERSONA_GROUPS.flatMap(group => group.parameters.map(p => p.key));
}

/**
 * Get parameter info by key
 */
export function getParameterInfo(key: string): PersonaParameter | undefined {
  for (const group of PERSONA_GROUPS) {
    const param = group.parameters.find(p => p.key === key);
    if (param) return param;
  }
  return undefined;
}

/**
 * Get group by parameter key
 */
export function getGroupByParameterKey(key: string): PersonaParameterGroup | undefined {
  return PERSONA_GROUPS.find(group =>
    group.parameters.some(p => p.key === key)
  );
}

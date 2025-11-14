/**
 * Onboarding Types
 * Types for the initial user onboarding experience
 */

export type TonePreference = 'casual' | 'friendly-formal' | 'professional';

export type ProactiveFrequency = 'frequent' | 'moderate' | 'minimal';

export type Occupation = 'student' | 'employee' | 'freelancer' | 'entrepreneur' | 'other';

export interface OnboardingQuestion {
  id: string;
  type: 'text' | 'choice' | 'multi-choice';
  question: string;
  aiMessage: string; // What AI says when asking this question
  placeholder?: string; // For text inputs
  choices?: Array<{
    value: string;
    label: string;
    emoji?: string;
    description?: string;
  }>;
  required: boolean;
  order: number;
}

export type PersonaChoice = 'Adam' | 'Eve';

export interface OnboardingAnswers {
  name: string;
  personaChoice: PersonaChoice;
  tonePreference: TonePreference;
  proactiveFrequency: ProactiveFrequency;
  occupation?: Occupation;
  interests?: string;
  ageGroup?: string;
}

export interface OnboardingStep {
  step: number;
  totalSteps: number;
  question: OnboardingQuestion;
  answer?: string | string[];
  isComplete: boolean;
  canSkip: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  answers: Partial<OnboardingAnswers>;
  completedAt?: number;
  skipped: boolean;
}

export interface TonePresetConfig {
  formality: number;
  friendliness: number;
  emojiUsage: number;
  enthusiasm: number;
  verbosity: number;
}

export interface OccupationModifiers {
  codeSnippets?: number;
  structuredOutput?: number;
  exampleUsage?: number;
  patience?: number;
  proactivity?: number;
  actionOriented?: number;
}

export const TONE_PRESETS: Record<TonePreference, TonePresetConfig> = {
  casual: {
    formality: 15,
    friendliness: 95,
    emojiUsage: 85,
    enthusiasm: 80,
    verbosity: 50,
  },
  'friendly-formal': {
    formality: 45,
    friendliness: 85,
    emojiUsage: 60,
    enthusiasm: 70,
    verbosity: 55,
  },
  professional: {
    formality: 90,
    friendliness: 50,
    emojiUsage: 15,
    enthusiasm: 40,
    verbosity: 60,
  },
};

export const OCCUPATION_MODIFIERS: Record<Occupation, OccupationModifiers> = {
  student: {
    exampleUsage: 20,
    patience: 10,
    verbosity: 10,
  },
  employee: {
    structuredOutput: 15,
    actionOriented: 10,
  },
  freelancer: {
    proactivity: 15,
    actionOriented: 15,
  },
  entrepreneur: {
    proactivity: 25,
    actionOriented: 20,
    structuredOutput: 10,
  },
  other: {
    // Neutral - no modifiers
  },
};

export const PROACTIVE_INTERVALS: Record<ProactiveFrequency, number> = {
  frequent: 15 * 60 * 1000, // 15 minutes
  moderate: 45 * 60 * 1000, // 45 minutes
  minimal: 2 * 60 * 60 * 1000, // 2 hours
};

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'name',
    type: 'text',
    question: 'What should I call you?',
    aiMessage: '안녕! 난 에덴이야 😊\n\n뭐라고 불러주면 될까?',
    placeholder: '이름을 입력해주세요',
    required: true,
    order: 1,
  },
  {
    id: 'personaChoice',
    type: 'choice',
    question: 'Who do you want to meet?',
    aiMessage: '반가워! 🎉\n\n나는 두 명의 친구가 있어.\n누구를 만나고 싶어?',
    choices: [
      {
        value: 'Adam',
        label: 'Adam (아담)',
        emoji: '👨',
        description: '활발하고 적극적인 성격',
      },
      {
        value: 'Eve',
        label: 'Eve (이브)',
        emoji: '👩',
        description: '차분하고 사려깊은 성격',
      },
    ],
    required: true,
    order: 2,
  },
  {
    id: 'tonePreference',
    type: 'choice',
    question: 'How should I talk to you?',
    aiMessage: '좋아! 그럼 어떻게 말하면 좋을까?',
    choices: [
      {
        value: 'casual',
        label: '친구처럼 편하게',
        emoji: '🤗',
        description: '반말로 편하게 대화해요',
      },
      {
        value: 'friendly-formal',
        label: '친근하지만 존댓말로',
        emoji: '😊',
        description: '친근하면서도 예의 있게',
      },
      {
        value: 'professional',
        label: '정중하고 전문적으로',
        emoji: '🎩',
        description: '격식 있고 전문적인 톤',
      },
    ],
    required: true,
    order: 3,
  },
  {
    id: 'occupation',
    type: 'choice',
    question: 'What do you do?',
    aiMessage: '요즘 뭐 하고 지내? 😊',
    choices: [
      {
        value: 'student',
        label: '학생',
        emoji: '🎓',
      },
      {
        value: 'employee',
        label: '직장인',
        emoji: '💼',
      },
      {
        value: 'freelancer',
        label: '프리랜서',
        emoji: '🚀',
      },
      {
        value: 'entrepreneur',
        label: '창업가',
        emoji: '💡',
      },
      {
        value: 'other',
        label: '기타',
        emoji: '🏠',
      },
    ],
    required: false,
    order: 4,
  },
  {
    id: 'proactiveFrequency',
    type: 'choice',
    question: 'Can I message you first?',
    aiMessage: '내가 먼저 말 걸어도 괜찮아?\n예를 들어 "잠깐 쉬어갈까?" 같은 거!',
    choices: [
      {
        value: 'frequent',
        label: '응, 자주 말 걸어줘!',
        emoji: '💬',
        description: '10-15분마다 먼저 말 걸기',
      },
      {
        value: 'moderate',
        label: '가끔씩만',
        emoji: '🙂',
        description: '30분-1시간 간격',
      },
      {
        value: 'minimal',
        label: '필요할 때만',
        emoji: '🤐',
        description: '2-3시간 간격, 중요한 것만',
      },
    ],
    required: true,
    order: 5,
  },
  {
    id: 'interests',
    type: 'text',
    question: 'What are you interested in?',
    aiMessage: '어떤 거 좋아해?\n예를 들어 "코딩, 음악, 게임" 이런 식으로 자유롭게 말해줘!',
    placeholder: '관심사를 자유롭게 입력해주세요 (예: 개발, 음악, 운동)',
    required: false,
    order: 6,
  },
];

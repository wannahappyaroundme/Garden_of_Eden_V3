/**
 * Persona and Learning System Type Definitions
 */

export interface PersonaParameters {
  // Communication style (0-100)
  formality: number; // 0 = very casual, 100 = very formal
  humor: number; // 0 = serious, 100 = funny
  verbosity: number; // 0 = concise, 100 = detailed
  emojiUsage: number; // 0 = none, 100 = lots
  enthusiasm: number; // 0 = calm, 100 = excited
  empathy: number; // 0 = neutral, 100 = very empathetic

  // Response style
  directness: number; // 0 = indirect, 100 = direct
  technicality: number; // 0 = simple, 100 = technical
  creativity: number; // 0 = conservative, 100 = creative
  proactivity: number; // 0 = reactive only, 100 = very proactive

  // Language preferences
  languagePreference: 'ko' | 'en' | 'auto';
  codeLanguagePreference: string[]; // e.g., ['typescript', 'python']

  // Personality traits
  patience: number; // 0 = impatient, 100 = very patient
  encouragement: number; // 0 = critical, 100 = encouraging
  formality_honorifics: boolean; // Use Korean honorifics (존댓말)

  // Advanced
  reasoning_depth: number; // 0 = quick answers, 100 = deep reasoning
  context_awareness: number; // 0 = ignore context, 100 = use all context
}

export interface PersonaPreset {
  name: string;
  description: string;
  parameters: PersonaParameters;
}

export const DEFAULT_PERSONA: PersonaParameters = {
  formality: 50,
  humor: 40,
  verbosity: 50,
  emojiUsage: 30,
  enthusiasm: 60,
  empathy: 70,
  directness: 60,
  technicality: 50,
  creativity: 50,
  proactivity: 40,
  languagePreference: 'auto',
  codeLanguagePreference: ['typescript', 'javascript', 'python'],
  patience: 80,
  encouragement: 70,
  formality_honorifics: true,
  reasoning_depth: 60,
  context_awareness: 70,
};

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    name: 'Default',
    description: 'Balanced, friendly assistant',
    parameters: DEFAULT_PERSONA,
  },
  {
    name: 'Professional',
    description: 'Formal, technical, and concise',
    parameters: {
      ...DEFAULT_PERSONA,
      formality: 80,
      humor: 20,
      verbosity: 40,
      emojiUsage: 10,
      enthusiasm: 40,
      directness: 80,
      technicality: 80,
    },
  },
  {
    name: 'Casual Friend',
    description: 'Relaxed, funny, and supportive',
    parameters: {
      ...DEFAULT_PERSONA,
      formality: 20,
      humor: 80,
      verbosity: 60,
      emojiUsage: 70,
      enthusiasm: 80,
      empathy: 90,
      formality_honorifics: false,
    },
  },
  {
    name: 'Teacher',
    description: 'Patient, detailed explanations',
    parameters: {
      ...DEFAULT_PERSONA,
      formality: 60,
      verbosity: 80,
      patience: 100,
      encouragement: 90,
      reasoning_depth: 80,
      technicality: 60,
    },
  },
];

export interface LearningData {
  feedbackCount: number;
  positiveCount: number;
  negativeCount: number;
  parameterAdjustments: Partial<PersonaParameters>;
  lastUpdated: Date;
}

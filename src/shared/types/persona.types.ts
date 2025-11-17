/**
 * Persona and Learning System Type Definitions
 * 10 core parameters for comprehensive personality customization
 * Standardized across TypeScript, Rust, and Database layers
 */

export interface PersonaParameters {
  // Communication Style (4 parameters)
  formality: number; // 0-100: 0 = very casual, 100 = very formal
  verbosity: number; // 0-100: 0 = concise, 100 = detailed/verbose
  humor: number; // 0-100: 0 = serious, 100 = humorous
  emojiUsage: number; // 0-100: 0 = no emojis, 100 = frequent emojis

  // Relationship & Emotion (1 parameter)
  empathy: number; // 0-100: 0 = factual/task-focused, 100 = emotionally supportive

  // Thinking & Action (2 parameters)
  creativity: number; // 0-100: 0 = conventional, 100 = creative/analogical
  proactiveness: number; // 0-100: 0 = reactive only, 100 = very proactive

  // Expertise & Content (3 parameters)
  technicalDepth: number; // 0-100: 0 = simple terms, 100 = technical jargon
  codeExamples: number; // 0-100: 0 = text explanations, 100 = code-heavy
  questioning: number; // 0-100: 0 = answers directly, 100 = asks clarifying questions
}

export interface PersonaPreset {
  name: string;
  description: string;
  parameters: PersonaParameters;
}

export const DEFAULT_PERSONA: PersonaParameters = {
  // Communication Style
  formality: 50, // Balanced
  verbosity: 50, // Balanced
  humor: 30, // Light humor
  emojiUsage: 20, // Minimal emojis

  // Relationship & Emotion
  empathy: 60, // Moderately supportive

  // Thinking & Action
  creativity: 50, // Balanced
  proactiveness: 40, // Moderately proactive

  // Expertise & Content
  technicalDepth: 50, // Balanced technical level
  codeExamples: 70, // Frequently include code
  questioning: 40, // Occasional clarifying questions
};

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    name: 'default',
    description: 'Balanced, friendly assistant',
    parameters: DEFAULT_PERSONA,
  },
  {
    name: 'professional',
    description: 'Formal, technical, and concise',
    parameters: {
      formality: 80,
      verbosity: 60,
      humor: 10,
      emojiUsage: 5,
      empathy: 40,
      creativity: 40,
      proactiveness: 50,
      technicalDepth: 80,
      codeExamples: 70,
      questioning: 30,
    },
  },
  {
    name: 'friendly',
    description: 'Relaxed, funny, and supportive',
    parameters: {
      formality: 20,
      verbosity: 60,
      humor: 80,
      emojiUsage: 70,
      empathy: 90,
      creativity: 60,
      proactiveness: 60,
      technicalDepth: 40,
      codeExamples: 50,
      questioning: 50,
    },
  },
  {
    name: 'teacher',
    description: 'Patient, detailed explanations with examples',
    parameters: {
      formality: 60,
      verbosity: 80,
      humor: 40,
      emojiUsage: 30,
      empathy: 80,
      creativity: 70,
      proactiveness: 50,
      technicalDepth: 60,
      codeExamples: 90,
      questioning: 70,
    },
  },
  {
    name: 'technical',
    description: 'Technical, code-focused expert',
    parameters: {
      formality: 70,
      verbosity: 70,
      humor: 20,
      emojiUsage: 10,
      empathy: 40,
      creativity: 50,
      proactiveness: 40,
      technicalDepth: 95,
      codeExamples: 95,
      questioning: 40,
    },
  },
  {
    name: 'creative',
    description: 'Creative, analogical thinker',
    parameters: {
      formality: 30,
      verbosity: 70,
      humor: 70,
      emojiUsage: 60,
      empathy: 70,
      creativity: 95,
      proactiveness: 70,
      technicalDepth: 50,
      codeExamples: 50,
      questioning: 60,
    },
  },
];

/**
 * Convert 0-100 scale to 0-1 scale for Rust backend
 */
export function toRustScale(params: PersonaParameters): Record<string, number> {
  return {
    formality: params.formality / 100,
    verbosity: params.verbosity / 100,
    humor: params.humor / 100,
    emoji_usage: params.emojiUsage / 100,
    empathy: params.empathy / 100,
    creativity: params.creativity / 100,
    proactiveness: params.proactiveness / 100,
    technical_depth: params.technicalDepth / 100,
    code_examples: params.codeExamples / 100,
    questioning: params.questioning / 100,
  };
}

/**
 * Convert 0-1 scale from Rust backend to 0-100 scale
 */
export function fromRustScale(rustParams: Record<string, number>): PersonaParameters {
  return {
    formality: Math.round((rustParams.formality || 0.5) * 100),
    verbosity: Math.round((rustParams.verbosity || 0.5) * 100),
    humor: Math.round((rustParams.humor || 0.3) * 100),
    emojiUsage: Math.round((rustParams.emoji_usage || 0.2) * 100),
    empathy: Math.round((rustParams.empathy || 0.6) * 100),
    creativity: Math.round((rustParams.creativity || 0.5) * 100),
    proactiveness: Math.round((rustParams.proactiveness || 0.4) * 100),
    technicalDepth: Math.round((rustParams.technical_depth || 0.5) * 100),
    codeExamples: Math.round((rustParams.code_examples || 0.7) * 100),
    questioning: Math.round((rustParams.questioning || 0.4) * 100),
  };
}

export interface LearningData {
  feedbackCount: number;
  positiveCount: number;
  negativeCount: number;
  parameterAdjustments: Partial<PersonaParameters>;
  lastUpdated: Date;
}

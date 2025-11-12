/**
 * Persona and Learning System Type Definitions
 * 28 adjustable parameters for comprehensive personality customization
 */

export interface PersonaParameters {
  // Communication Style (8 parameters)
  formality: number; // 0 = very casual, 100 = very formal
  verbosity: number; // 0 = concise, 100 = detailed/verbose
  humor: number; // 0 = serious, 100 = humorous
  enthusiasm: number; // 0 = neutral, 100 = very enthusiastic
  empathy: number; // 0 = factual, 100 = emotionally supportive
  friendliness: number; // 0 = professional, 100 = friendly
  assertiveness: number; // 0 = suggestive, 100 = directive
  patience: number; // 0 = quick/brief, 100 = very patient

  // Tone & Personality (5 parameters)
  optimism: number; // 0 = realistic, 100 = optimistic
  playfulness: number; // 0 = serious, 100 = playful
  creativity: number; // 0 = conventional, 100 = creative
  technicality: number; // 0 = simple terms, 100 = technical jargon
  directness: number; // 0 = indirect/polite, 100 = direct/blunt

  // Response Characteristics (5 parameters)
  exampleUsage: number; // 0 = few examples, 100 = many examples
  analogy: number; // 0 = literal, 100 = uses analogies
  questioning: number; // 0 = answers directly, 100 = asks clarifying questions
  reasoningDepth: number; // 0 = quick answers, 100 = deep reasoning
  contextAwareness: number; // 0 = literal context, 100 = reads between lines

  // Proactivity (3 parameters)
  proactiveness: number; // 0 = reactive only, 100 = very proactive
  interruptiveness: number; // 0 = never interrupts, 100 = interrupts when helpful
  suggestionFrequency: number; // 0 = rare suggestions, 100 = frequent suggestions

  // Content Preferences (4 parameters)
  emojiUsage: number; // 0 = no emojis, 100 = frequent emojis
  codeSnippets: number; // 0 = text explanations, 100 = code-heavy
  structuredOutput: number; // 0 = flowing text, 100 = lists/tables
  markdown: number; // 0 = plain text, 100 = rich markdown

  // Interaction Style (3 parameters)
  confirmation: number; // 0 = assumes intent, 100 = always confirms
  errorTolerance: number; // 0 = strict, 100 = forgiving
  learningFocus: number; // 0 = give answers, 100 = teach concepts
}

export interface PersonaPreset {
  name: string;
  description: string;
  parameters: PersonaParameters;
}

export const DEFAULT_PERSONA: PersonaParameters = {
  // Communication Style
  formality: 50,
  verbosity: 50,
  humor: 30,
  enthusiasm: 50,
  empathy: 60,
  friendliness: 60,
  assertiveness: 40,
  patience: 70,

  // Tone & Personality
  optimism: 60,
  playfulness: 30,
  creativity: 50,
  technicality: 50,
  directness: 60,

  // Response Characteristics
  exampleUsage: 60,
  analogy: 40,
  questioning: 40,
  reasoningDepth: 60,
  contextAwareness: 70,

  // Proactivity
  proactiveness: 40,
  interruptiveness: 20,
  suggestionFrequency: 40,

  // Content Preferences
  emojiUsage: 20,
  codeSnippets: 50,
  structuredOutput: 50,
  markdown: 70,

  // Interaction Style
  confirmation: 50,
  errorTolerance: 60,
  learningFocus: 50,
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
      ...DEFAULT_PERSONA,
      formality: 80,
      verbosity: 60,
      humor: 10,
      enthusiasm: 40,
      empathy: 40,
      friendliness: 40,
      assertiveness: 60,
      technicality: 70,
      directness: 80,
      emojiUsage: 5,
      codeSnippets: 60,
      structuredOutput: 70,
      markdown: 80,
    },
  },
  {
    name: 'friendly',
    description: 'Relaxed, funny, and supportive',
    parameters: {
      ...DEFAULT_PERSONA,
      formality: 20,
      verbosity: 60,
      humor: 70,
      enthusiasm: 80,
      empathy: 90,
      friendliness: 90,
      assertiveness: 30,
      patience: 80,
      optimism: 80,
      playfulness: 70,
      emojiUsage: 70,
      errorTolerance: 80,
    },
  },
  {
    name: 'teacher',
    description: 'Patient, detailed explanations',
    parameters: {
      ...DEFAULT_PERSONA,
      formality: 60,
      verbosity: 80,
      enthusiasm: 70,
      empathy: 80,
      friendliness: 70,
      patience: 90,
      optimism: 70,
      exampleUsage: 90,
      analogy: 80,
      questioning: 70,
      reasoningDepth: 80,
      learningFocus: 90,
    },
  },
  {
    name: 'technical',
    description: 'Technical, code-focused expert',
    parameters: {
      ...DEFAULT_PERSONA,
      formality: 70,
      verbosity: 70,
      humor: 20,
      technicality: 90,
      directness: 80,
      exampleUsage: 80,
      questioning: 40,
      reasoningDepth: 80,
      emojiUsage: 10,
      codeSnippets: 90,
      structuredOutput: 80,
      markdown: 90,
    },
  },
  {
    name: 'creative',
    description: 'Creative, analogical thinker',
    parameters: {
      ...DEFAULT_PERSONA,
      formality: 30,
      verbosity: 70,
      humor: 70,
      enthusiasm: 80,
      friendliness: 80,
      playfulness: 80,
      creativity: 90,
      analogy: 90,
      contextAwareness: 90,
      emojiUsage: 60,
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

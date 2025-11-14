/**
 * Onboarding Service
 * Handles initial persona configuration based on onboarding answers
 */

import log from 'electron-log';
import type { PersonaParameters } from '@shared/types/persona.types';
import type { OnboardingAnswers } from '@shared/types/onboarding.types';
import {
  TONE_PRESETS,
  OCCUPATION_MODIFIERS,
  PROACTIVE_INTERVALS,
} from '@shared/types/onboarding.types';
import { getUserProfileRepository } from '../../database/repositories/user-profile.repository';
import { getPersonaService } from './persona.service';
import { parseDisplayName } from '@shared/utils/name-parser';

export class OnboardingService {
  constructor() {
    log.info('OnboardingService initialized');
  }

  /**
   * Calculate initial persona parameters from onboarding answers
   */
  calculateInitialPersona(answers: OnboardingAnswers): PersonaParameters {
    log.info('Calculating initial persona from onboarding answers', { answers });

    // Start with tone preset
    const tonePreset = TONE_PRESETS[answers.tonePreference];

    // Base persona from tone
    const persona: PersonaParameters = {
      formality: tonePreset.formality,
      humor: 40, // Default
      verbosity: tonePreset.verbosity,
      emojiUsage: tonePreset.emojiUsage,
      enthusiasm: tonePreset.enthusiasm,
      empathy: 70, // Default
      directness: 60, // Default
      technicality: 50, // Default
      creativity: 50, // Default
      proactivity: 40, // Will be adjusted based on frequency
      languagePreference: 'auto',
      codeLanguagePreference: ['typescript', 'javascript', 'python'],
      patience: 80, // Default
      encouragement: 70, // Default
      formalityHonorifics: answers.tonePreference === 'professional' ? 2 : 1,
      reasoningDepth: 60, // Default
      contextAwareness: 70, // Default
      friendliness: tonePreset.friendliness,
      structuredOutput: 50, // Default
      exampleUsage: 50, // Default
      codeSnippets: 50, // Default
      actionOriented: 50, // Default
    };

    // Apply proactive frequency adjustment
    if (answers.proactiveFrequency === 'frequent') {
      persona.proactivity += 30;
      persona.friendliness += 10;
    } else if (answers.proactiveFrequency === 'moderate') {
      persona.proactivity += 10;
    } else if (answers.proactiveFrequency === 'minimal') {
      persona.proactivity -= 10;
      persona.directness += 10;
    }

    // Apply occupation modifiers if provided
    if (answers.occupation && answers.occupation !== 'other') {
      const modifiers = OCCUPATION_MODIFIERS[answers.occupation];

      Object.entries(modifiers).forEach(([key, value]) => {
        if (value !== undefined) {
          const paramKey = this.mapModifierKeyToPersonaKey(key);
          if (paramKey && persona[paramKey] !== undefined) {
            persona[paramKey] = Math.max(0, Math.min(100, persona[paramKey] + value));
          }
        }
      });
    }

    // If they have programming-related interests, boost code-related parameters
    if (answers.interests) {
      const interests = answers.interests.toLowerCase();
      const programmingKeywords = [
        'code',
        'coding',
        'program',
        'programming',
        'developer',
        'development',
        'software',
        '개발',
        '코딩',
        '프로그래밍',
      ];

      if (programmingKeywords.some(keyword => interests.includes(keyword))) {
        persona.codeSnippets += 20;
        persona.technicality += 15;
        persona.structuredOutput += 10;
        log.info('Detected programming interest, boosting code-related parameters');
      }
    }

    // Ensure all values are within bounds [0, 100]
    Object.keys(persona).forEach(key => {
      const value = persona[key as keyof PersonaParameters];
      if (typeof value === 'number') {
        persona[key as keyof PersonaParameters] = Math.max(0, Math.min(100, value)) as any;
      }
    });

    log.info('Initial persona calculated', { persona });

    return persona;
  }

  /**
   * Map modifier key to persona parameter key
   */
  private mapModifierKeyToPersonaKey(modifierKey: string): keyof PersonaParameters | null {
    const mapping: Record<string, keyof PersonaParameters> = {
      codeSnippets: 'codeSnippets',
      structuredOutput: 'structuredOutput',
      exampleUsage: 'exampleUsage',
      patience: 'patience',
      proactivity: 'proactivity',
      actionOriented: 'actionOriented',
    };

    return mapping[modifierKey] || null;
  }

  /**
   * Complete onboarding: save profile and initialize persona
   */
  async completeOnboarding(answers: OnboardingAnswers): Promise<void> {
    try {
      log.info('Completing onboarding', { answers });

      // Calculate initial persona
      const initialPersona = this.calculateInitialPersona(answers);

      // Save user profile to database
      const userProfileRepo = getUserProfileRepository();
      const profile = userProfileRepo.create({
        name: answers.name,
        selectedPersona: answers.personaChoice,
        ageGroup: answers.ageGroup,
        occupation: answers.occupation,
        interests: answers.interests,
        tonePreference: answers.tonePreference,
        proactiveFrequency: answers.proactiveFrequency,
      });

      log.info('User profile created', { profileId: profile.id });

      // Initialize persona with calculated values
      const personaService = getPersonaService();
      personaService.updatePersona(initialPersona);

      log.info('Initial persona set', { persona: initialPersona });

      log.info('Onboarding completed successfully', {
        userId: profile.id,
        name: profile.name,
      });
    } catch (error) {
      log.error('Failed to complete onboarding', error);
      throw error;
    }
  }

  /**
   * Skip onboarding: use neutral persona
   */
  async skipOnboarding(): Promise<void> {
    try {
      log.info('Skipping onboarding, using neutral persona');

      // Use neutral defaults
      const neutralPersona: PersonaParameters = {
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
        formalityHonorifics: 1,
        reasoningDepth: 60,
        contextAwareness: 70,
        friendliness: 60,
        structuredOutput: 50,
        exampleUsage: 50,
        codeSnippets: 50,
        actionOriented: 50,
      };

      const personaService = getPersonaService();
      personaService.updatePersona(neutralPersona);

      log.info('Neutral persona set');
    } catch (error) {
      log.error('Failed to skip onboarding', error);
      throw error;
    }
  }

  /**
   * Get proactive interval based on frequency preference
   */
  getProactiveInterval(frequency: string): number {
    return PROACTIVE_INTERVALS[frequency as keyof typeof PROACTIVE_INTERVALS] || PROACTIVE_INTERVALS.moderate;
  }

  /**
   * Generate welcome message based on answers
   */
  generateWelcomeMessage(answers: OnboardingAnswers): string {
    const { name, personaChoice, tonePreference, proactiveFrequency } = answers;

    // Parse display name (remove Korean surname if applicable)
    const displayName = parseDisplayName(name);

    // Get persona name in Korean
    const personaName = personaChoice === 'Adam' ? '아담' : '이브';

    let message = '';

    // Greeting based on tone with persona introduction
    if (tonePreference === 'casual') {
      message = `${displayName}야, 이제 널 조금 알 것 같아! 앞으로 잘 부탁해 😊\n\n`;
      message += `나는 ${personaName}이야. 같이 재밌게 지내보자!\n\n`;
    } else if (tonePreference === 'friendly-formal') {
      message = `${displayName}님, 이제 조금 알 것 같아요! 앞으로 잘 부탁드려요 😊\n\n`;
      message += `저는 ${personaName}이에요. 함께 좋은 시간 보내요!\n\n`;
    } else {
      message = `${displayName}님, 감사합니다. 앞으로 최선을 다해 도와드리겠습니다.\n\n`;
      message += `저는 ${personaName}입니다. 잘 부탁드립니다.\n\n`;
    }

    // Add proactive message info
    if (proactiveFrequency === 'frequent') {
      if (tonePreference === 'casual') {
        message += '궁금한 거 있으면 언제든 물어봐! 나도 자주 먼저 말 걸게 😄\n';
      } else {
        message += '궁금한 점이 있으면 언제든 말씀해주세요. 제가 자주 먼저 말을 걸 예정이에요.\n';
      }
    } else if (proactiveFrequency === 'moderate') {
      if (tonePreference === 'casual') {
        message += '궁금한 거 있으면 언제든 물어봐! 가끔 내가 먼저 말 걸 수도 있어.\n';
      } else {
        message += '궁금한 점이 있으면 언제든 말씀해주세요. 가끔 제가 먼저 말을 걸 수도 있어요.\n';
      }
    } else {
      if (tonePreference === 'casual') {
        message += '궁금한 거 있으면 언제든 물어봐!\n';
      } else {
        message += '궁금한 점이 있으면 언제든 말씀해주세요.\n';
      }
    }

    // Add context about settings
    if (tonePreference === 'casual') {
      message += '\n부담스러우면 설정에서 조절할 수 있어.\n\n지금 뭐 하고 있었어?';
    } else {
      message += '\n부담스러우시면 설정에서 조절하실 수 있어요.\n\n지금 무엇을 하고 계셨나요?';
    }

    return message;
  }
}

// Singleton instance
let onboardingServiceInstance: OnboardingService | null = null;

export function getOnboardingService(): OnboardingService {
  if (!onboardingServiceInstance) {
    onboardingServiceInstance = new OnboardingService();
  }
  return onboardingServiceInstance;
}

export function resetOnboardingService(): void {
  onboardingServiceInstance = null;
}

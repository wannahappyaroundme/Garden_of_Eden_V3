/**
 * User Profile Types
 * Types for user profile data stored in database
 */

import type { TonePreference, ProactiveFrequency, Occupation } from './onboarding.types';

export type PersonaName = 'Adam' | 'Eve';

export interface UserProfile {
  id: number;
  name: string;
  displayName: string; // Name without surname for Korean names
  ageGroup?: string;
  occupation?: Occupation;
  interests?: string;
  tonePreference: TonePreference;
  proactiveFrequency: ProactiveFrequency;
  selectedPersona: PersonaName; // Adam or Eve
  onboardingCompletedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateUserProfileInput {
  name: string;
  selectedPersona: PersonaName;
  ageGroup?: string;
  occupation?: Occupation;
  interests?: string;
  tonePreference: TonePreference;
  proactiveFrequency: ProactiveFrequency;
}

export interface UpdateUserProfileInput {
  name?: string;
  ageGroup?: string;
  occupation?: Occupation;
  interests?: string;
  tonePreference?: TonePreference;
  proactiveFrequency?: ProactiveFrequency;
}

/**
 * Feedback Types
 * Type definitions for user feedback and learning system
 */

import type { PersonaParameters } from './persona.types';

export interface FeedbackChannels {
  'feedback:update-satisfaction': {
    request: {
      messageId: string;
      satisfaction: 'positive' | 'negative';
    };
    response: {
      success: boolean;
      updated: PersonaParameters;
      adjustments: Record<
        string,
        {
          oldValue: number;
          newValue: number;
          change: number;
        }
      >;
    };
  };
  'feedback:get-stats': {
    request: void;
    response: {
      stats: {
        totalFeedback: number;
        positiveFeedback: number;
        negativeFeedback: number;
        satisfactionRate: number;
        lastFeedbackTime: number | null;
        mostAdjustedParameters: Array<{ parameter: string; adjustmentCount: number }>;
      };
    };
  };
  'feedback:get-trend': {
    request: { days: number };
    response: {
      trend: Array<{ date: string; positive: number; negative: number }>;
    };
  };
  'feedback:reset-learning': {
    request: void;
    response: { success: boolean; deletedCount: number };
  };
  'feedback:get-learning-rate': {
    request: void;
    response: { learningRate: number };
  };
  'feedback:set-learning-rate': {
    request: { rate: number };
    response: { success: boolean; learningRate: number };
  };
}

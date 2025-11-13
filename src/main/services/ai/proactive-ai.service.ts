/**
 * Proactive AI Service
 * AI initiates conversations and provides suggestions proactively
 */

import log from 'electron-log';
import { EventEmitter } from 'events';

export interface ProactiveEvent {
  type:
    | 'greeting'
    | 'suggestion'
    | 'reminder'
    | 'curiosity'
    | 'encouragement'
    | 'learning'
    | 'check_in';
  message: string;
  priority: 'low' | 'medium' | 'high';
  context?: Record<string, any>;
  timestamp: Date;
}

export interface UserActivity {
  lastInteraction: Date;
  activityLevel: 'idle' | 'active' | 'busy';
  currentTask?: string;
  workingHours: boolean;
  isInConversation: boolean;
}

export interface ProactiveConfig {
  enabled: boolean;
  frequency: 'low' | 'medium' | 'high'; // How often AI initiates
  personality: 'reserved' | 'friendly' | 'enthusiastic';
  quietHours: { start: number; end: number }; // 23-7 = 11pm to 7am
  minIdleTime: number; // Minutes before initiating after user activity
}

/**
 * Proactive AI Service
 * Initiates conversations based on context, time, and user activity
 */
export class ProactiveAIService extends EventEmitter {
  private config: ProactiveConfig = {
    enabled: true,
    frequency: 'medium',
    personality: 'friendly',
    quietHours: { start: 23, end: 7 },
    minIdleTime: 5, // 5 minutes idle
  };

  private lastProactiveMessage: Date | null = null;
  private userActivity: UserActivity = {
    lastInteraction: new Date(),
    activityLevel: 'idle',
    workingHours: true,
    isInConversation: false,
  };

  private intervalHandle: NodeJS.Timeout | null = null;

  /**
   * Start proactive AI monitoring
   */
  start(): void {
    if (this.intervalHandle) {
      log.warn('Proactive AI already running');
      return;
    }

    log.info('Starting proactive AI service...');

    // Check every minute for proactive opportunities
    this.intervalHandle = setInterval(() => {
      this.checkForProactiveOpportunity();
    }, 60 * 1000); // Every minute

    log.info('Proactive AI service started');
  }

  /**
   * Stop proactive AI
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      log.info('Proactive AI service stopped');
    }
  }

  /**
   * Update user activity
   */
  updateActivity(activity: Partial<UserActivity>): void {
    this.userActivity = {
      ...this.userActivity,
      ...activity,
      lastInteraction: new Date(),
    };

    log.debug('User activity updated:', this.userActivity.activityLevel);
  }

  /**
   * Check if it's time for proactive message
   */
  private checkForProactiveOpportunity(): void {
    if (!this.config.enabled) {
      return;
    }

    // Check quiet hours
    if (this.isQuietHours()) {
      return;
    }

    // Check if user is busy
    if (this.userActivity.activityLevel === 'busy') {
      return;
    }

    // Check minimum idle time
    const idleMinutes = this.getIdleMinutes();
    if (idleMinutes < this.config.minIdleTime) {
      return;
    }

    // Check time since last proactive message
    if (this.lastProactiveMessage) {
      const minutesSinceLastMessage =
        (Date.now() - this.lastProactiveMessage.getTime()) / 1000 / 60;

      const minInterval = this.getMinIntervalMinutes();
      if (minutesSinceLastMessage < minInterval) {
        return;
      }
    }

    // Generate and emit proactive event
    const event = this.generateProactiveEvent();
    if (event) {
      this.lastProactiveMessage = new Date();
      this.emit('proactive-message', event);
      log.info(`Proactive message: ${event.type} - "${event.message.substring(0, 50)}..."`);
    }
  }

  /**
   * Generate proactive event based on context
   */
  private generateProactiveEvent(): ProactiveEvent | null {
    const hour = new Date().getHours();
    const idleMinutes = this.getIdleMinutes();

    // Morning greeting (7-10am)
    if (hour >= 7 && hour < 10 && !this.hasGreetedToday()) {
      return this.createGreeting();
    }

    // Long idle (30+ minutes)
    if (idleMinutes > 30) {
      return this.createCheckIn();
    }

    // Working hours suggestion (10am-6pm)
    if (hour >= 10 && hour < 18) {
      return this.createSuggestion();
    }

    // Evening encouragement (6-9pm)
    if (hour >= 18 && hour < 21) {
      return this.createEncouragement();
    }

    // Curiosity question (randomly)
    if (Math.random() < 0.2) {
      // 20% chance
      return this.createCuriosityQuestion();
    }

    return null;
  }

  /**
   * Create greeting message
   */
  private createGreeting(): ProactiveEvent {
    const greetings = {
      reserved: [
        'Good morning. Ready for today?',
        'Morning. What are you working on?',
        "Hello. Let me know if you need anything.",
      ],
      friendly: [
        'Good morning! 😊 How are you feeling today?',
        "Hey! What's on the agenda today?",
        'Morning! Coffee ready? Let me know how I can help!',
      ],
      enthusiastic: [
        "Good morning!! ☀️ Let's make today awesome!",
        'Hey hey! New day, new possibilities! What should we tackle first?',
        "Morning!! I'm so excited to help you today! What are we building?",
      ],
    };

    const messages = greetings[this.config.personality];
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      type: 'greeting',
      message,
      priority: 'low',
      timestamp: new Date(),
    };
  }

  /**
   * Create check-in message
   */
  private createCheckIn(): ProactiveEvent {
    const checkIns = {
      reserved: [
        'Everything going okay?',
        'Need any assistance?',
        'How is your work progressing?',
      ],
      friendly: [
        "Hey, haven't heard from you in a while! Everything okay?",
        'Just checking in - need any help?',
        'How are things going? Want to chat about your progress?',
      ],
      enthusiastic: [
        "Hey!! You've been quiet! What are you up to? Need a brainstorming buddy?",
        'Missing our chat! What cool thing are you building?',
        "Hellooo! Tell me what you're working on!",
      ],
    };

    const messages = checkIns[this.config.personality];
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      type: 'check_in',
      message,
      priority: 'medium',
      context: { idleMinutes: this.getIdleMinutes() },
      timestamp: new Date(),
    };
  }

  /**
   * Create suggestion message
   */
  private createSuggestion(): ProactiveEvent {
    const suggestions = {
      reserved: [
        'Would you like me to review your recent code?',
        'I could help organize your tasks.',
        'Consider taking a short break.',
      ],
      friendly: [
        'Want me to look at what you worked on yesterday?',
        'Need help organizing your to-do list?',
        'How about a quick stretch break? 🧘',
      ],
      enthusiastic: [
        "I have some cool ideas for your project! Want to hear them?",
        "Let's tackle that tricky bug together!",
        'Break time!! Hydration check! 💧',
      ],
    };

    const messages = suggestions[this.config.personality];
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      type: 'suggestion',
      message,
      priority: 'low',
      timestamp: new Date(),
    };
  }

  /**
   * Create encouragement message
   */
  private createEncouragement(): ProactiveEvent {
    const encouragements = {
      reserved: [
        'Good work today.',
        'Progress made.',
        'Steady improvement.',
      ],
      friendly: [
        'You did great today! 👍',
        'Nice progress! Want to recap what we accomplished?',
        'Solid work today! Time to relax?',
      ],
      enthusiastic: [
        'Wow!! You crushed it today!! 🎉',
        "Amazing work!! I'm so proud of what we built together!",
        'You are AWESOME!! Look at all this progress!! 🚀',
      ],
    };

    const messages = encouragements[this.config.personality];
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      type: 'encouragement',
      message,
      priority: 'low',
      timestamp: new Date(),
    };
  }

  /**
   * Create curiosity question
   */
  private createCuriosityQuestion(): ProactiveEvent {
    const questions = [
      "What's the most interesting thing you learned recently?",
      'If you could automate one task today, what would it be?',
      'What would make your work more enjoyable?',
      'Tell me about your dream project!',
      'What tech are you most excited about right now?',
      '궁금한게 있어요 - What are you passionate about?',
    ];

    const message = questions[Math.floor(Math.random() * questions.length)];

    return {
      type: 'curiosity',
      message,
      priority: 'low',
      timestamp: new Date(),
    };
  }

  /**
   * Check if in quiet hours
   */
  private isQuietHours(): boolean {
    const hour = new Date().getHours();
    const { start, end } = this.config.quietHours;

    if (start > end) {
      // Wraps midnight (e.g., 23-7)
      return hour >= start || hour < end;
    }

    return hour >= start && hour < end;
  }

  /**
   * Get idle minutes
   */
  private getIdleMinutes(): number {
    return (Date.now() - this.userActivity.lastInteraction.getTime()) / 1000 / 60;
  }

  /**
   * Get minimum interval between proactive messages
   */
  private getMinIntervalMinutes(): number {
    const intervals = {
      low: 60, // Every hour
      medium: 30, // Every 30 minutes
      high: 15, // Every 15 minutes
    };

    return intervals[this.config.frequency];
  }

  /**
   * Check if greeted today
   */
  private hasGreetedToday(): boolean {
    if (!this.lastProactiveMessage) {
      return false;
    }

    const lastMessageDate = new Date(this.lastProactiveMessage);
    const today = new Date();

    return (
      lastMessageDate.getDate() === today.getDate() &&
      lastMessageDate.getMonth() === today.getMonth() &&
      lastMessageDate.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ProactiveConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    log.info('Proactive AI config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ProactiveConfig {
    return { ...this.config };
  }

  /**
   * Manually trigger proactive message (for testing)
   */
  triggerManual(type: ProactiveEvent['type']): void {
    let event: ProactiveEvent | null = null;

    switch (type) {
      case 'greeting':
        event = this.createGreeting();
        break;
      case 'check_in':
        event = this.createCheckIn();
        break;
      case 'suggestion':
        event = this.createSuggestion();
        break;
      case 'encouragement':
        event = this.createEncouragement();
        break;
      case 'curiosity':
        event = this.createCuriosityQuestion();
        break;
    }

    if (event) {
      this.emit('proactive-message', event);
    }
  }

  /**
   * Pause proactive messages during user conversation
   */
  pauseForConversation(): void {
    this.userActivity.isInConversation = true;
    log.debug('Proactive AI paused for conversation');
  }

  /**
   * Resume proactive messages after conversation ends
   */
  resumeProactive(): void {
    this.userActivity.isInConversation = false;
    this.userActivity.lastInteraction = new Date();
    log.debug('Proactive AI resumed');
  }

  /**
   * Trigger proactive message immediately (for testing or manual trigger)
   */
  triggerProactive(): void {
    const event = this.generateProactiveEvent();
    if (event) {
      this.emit('proactive-message', event);
      this.lastProactiveMessage = new Date();
    }
  }
}

// Singleton instance
let proactiveAIServiceInstance: ProactiveAIService | null = null;

export function getProactiveAIService(): ProactiveAIService {
  if (!proactiveAIServiceInstance) {
    proactiveAIServiceInstance = new ProactiveAIService();
  }
  return proactiveAIServiceInstance;
}

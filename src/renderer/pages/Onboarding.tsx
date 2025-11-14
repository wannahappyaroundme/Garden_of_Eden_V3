/**
 * Onboarding Page
 * Interactive onboarding experience with KakaoTalk-style UI
 * UX-first approach: AI-led conversation to learn about the user
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ONBOARDING_QUESTIONS,
  type OnboardingAnswers,
  type OnboardingQuestion,
  type PersonaChoice,
} from '@shared/types/onboarding.types';
import PersonaPreviewModal from '../components/PersonaPreviewModal';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [previewPersona, setPreviewPersona] = useState<PersonaChoice | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
  const requiredQuestions = ONBOARDING_QUESTIONS.filter(q => q.required);
  const requiredStepsCompleted = requiredQuestions
    .filter(q => answers[q.id as keyof OnboardingAnswers] !== undefined).length;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Show welcome message on mount
  useEffect(() => {
    setTimeout(() => {
      addAIMessage(ONBOARDING_QUESTIONS[0].aiMessage);
    }, 500);
  }, []);

  // Focus input after AI message
  useEffect(() => {
    if (!isTyping && currentQuestion?.type !== 'choice') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isTyping, currentQuestion]);

  const addAIMessage = (content: string) => {
    setIsTyping(true);

    // Simulate typing delay based on message length
    const typingDelay = Math.min(800 + content.length * 10, 2000);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, typingDelay);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: 'user',
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const handleChoice = async (choice: string, label: string) => {
    // Special handling for persona choice - show preview modal first
    if (currentQuestion.id === 'personaChoice') {
      setPreviewPersona(choice as PersonaChoice);
      return;
    }

    addUserMessage(label);

    // Save answer
    const questionId = currentQuestion.id;
    const newAnswers = { ...answers, [questionId]: choice };
    setAnswers(newAnswers);

    // Move to next step
    await moveToNextStep(newAnswers);
  };

  const handlePersonaSelect = async (persona: PersonaChoice) => {
    // Close preview modal
    setPreviewPersona(null);

    // Add user message
    const selectedChoice = currentQuestion.choices?.find(c => c.value === persona);
    if (selectedChoice) {
      addUserMessage(selectedChoice.label);
    }

    // Save answer
    const questionId = currentQuestion.id;
    const newAnswers = { ...answers, [questionId]: persona };
    setAnswers(newAnswers);

    // Move to next step
    await moveToNextStep(newAnswers);
  };

  const handleTextSubmit = async () => {
    if (!userInput.trim()) return;

    const input = userInput.trim();
    addUserMessage(input);
    setUserInput('');

    // Save answer
    const questionId = currentQuestion.id;
    const newAnswers = { ...answers, [questionId]: input };
    setAnswers(newAnswers);

    // Move to next step
    await moveToNextStep(newAnswers);
  };

  const moveToNextStep = async (currentAnswers: Partial<OnboardingAnswers>) => {
    const nextStep = currentStep + 1;

    if (nextStep >= ONBOARDING_QUESTIONS.length) {
      // Onboarding complete
      await completeOnboarding(currentAnswers);
      return;
    }

    setCurrentStep(nextStep);

    // Show next question
    setTimeout(() => {
      addAIMessage(ONBOARDING_QUESTIONS[nextStep].aiMessage);
    }, 1000);
  };

  const completeOnboarding = async (finalAnswers: Partial<OnboardingAnswers>) => {
    try {
      // TODO: Call IPC to complete onboarding
      // await window.api.completeOnboarding(finalAnswers as OnboardingAnswers);

      // TODO: Generate welcome message
      // const welcomeMsg = await window.api.generateWelcomeMessage(finalAnswers as OnboardingAnswers);

      // Generate temporary welcome message (will be replaced with IPC call)
      const displayName = finalAnswers.name || '';
      const personaName = finalAnswers.personaChoice === 'Adam' ? '아담' : '이브';
      const tonePreference = finalAnswers.tonePreference || 'friendly-formal';

      let welcomeMsg = '';
      if (tonePreference === 'casual') {
        welcomeMsg = `${displayName}야, 이제 널 조금 알 것 같아! 앞으로 잘 부탁해 😊\n\n`;
        welcomeMsg += `나는 ${personaName}이야. 같이 재밌게 지내보자!\n\n`;
        welcomeMsg += '궁금한 거 있으면 언제든 물어봐!\n\n지금 뭐 하고 있었어?';
      } else if (tonePreference === 'friendly-formal') {
        welcomeMsg = `${displayName}님, 이제 조금 알 것 같아요! 앞으로 잘 부탁드려요 😊\n\n`;
        welcomeMsg += `저는 ${personaName}이에요. 함께 좋은 시간 보내요!\n\n`;
        welcomeMsg += '궁금한 점이 있으면 언제든 말씀해주세요.\n\n지금 무엇을 하고 계셨나요?';
      } else {
        welcomeMsg = `${displayName}님, 감사합니다. 앞으로 최선을 다해 도와드리겠습니다.\n\n`;
        welcomeMsg += `저는 ${personaName}입니다. 잘 부탁드립니다.\n\n`;
        welcomeMsg += '궁금한 점이 있으면 언제든 말씀해주세요.\n\n지금 무엇을 하고 계셨나요?';
      }

      addAIMessage(welcomeMsg);

      // Navigate to chat after delay
      setTimeout(() => {
        navigate('/chat');
      }, 3000);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Fallback: navigate anyway
      setTimeout(() => navigate('/chat'), 2000);
    }
  };

  const skipOnboarding = async () => {
    try {
      // TODO: await window.api.skipOnboarding();
      navigate('/chat');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      navigate('/chat');
    }
  };

  const handleSkipQuestion = async () => {
    if (currentQuestion.required) return;

    // Move to next step without saving
    const nextStep = currentStep + 1;

    if (nextStep >= ONBOARDING_QUESTIONS.length) {
      await completeOnboarding(answers);
      return;
    }

    setCurrentStep(nextStep);
    setTimeout(() => {
      addAIMessage(ONBOARDING_QUESTIONS[nextStep].aiMessage);
    }, 1000);
  };

  const handleBack = () => {
    if (currentStep === 0 || isTyping) return;

    // Go back one step
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);

    // Remove last 2 messages (user answer + AI question)
    setMessages(prev => prev.slice(0, -2));

    // Clear the answer for current question
    const currentQuestionId = currentQuestion.id;
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestionId as keyof OnboardingAnswers];
    setAnswers(newAnswers);
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header with progress */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          {/* Back button */}
          {currentStep > 0 && !isTyping && (
            <button
              onClick={handleBack}
              className="mr-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="이전 단계"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold shadow-md">
            E
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">에덴과의 첫 만남</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {requiredStepsCompleted} / {requiredQuestions.length} 완료
            </p>
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={skipOnboarding}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          나중에 할게요
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${(requiredStepsCompleted / requiredQuestions.length) * 100}%` }}
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fadeIn">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-800">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      {!isTyping && currentQuestion && (
        <div className="border-t border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800 animate-fadeIn">
          <div className="mx-auto max-w-2xl">
            {currentQuestion.type === 'choice' ? (
              // Choice buttons
              <div className="grid gap-3">
                {currentQuestion.choices?.map(choice => (
                  <button
                    key={choice.value}
                    onClick={() => handleChoice(choice.value, choice.label)}
                    className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-md active:scale-98 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-700"
                  >
                    {choice.emoji && <span className="text-2xl">{choice.emoji}</span>}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{choice.label}</p>
                      {choice.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {choice.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // Text input
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                  placeholder={currentQuestion.placeholder || '입력해주세요...'}
                  className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-5 py-3 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-500"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!userInput.trim()}
                  className="rounded-full bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  다음
                </button>
              </div>
            )}

            {/* Skip button for optional questions */}
            {!currentQuestion.required && (
              <button
                onClick={handleSkipQuestion}
                className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                건너뛰기
              </button>
            )}
          </div>
        </div>
      )}

      {/* Persona Preview Modal */}
      {previewPersona && (
        <PersonaPreviewModal
          persona={previewPersona}
          onClose={() => setPreviewPersona(null)}
          onSelect={handlePersonaSelect}
        />
      )}

      {/* Add animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

/**
 * SmartOnboarding Page
 * Main orchestrator for the 5-step smart onboarding flow
 * 1. SystemCheck - Detect hardware specs
 * 2. ModelRecommendation - Show recommended AI model
 * 3. SurveyFlow - Personality customization survey
 * 4. ModelDownloader - Download required AI models
 * 5. CompletionScreen - Success & start chatting
 */

import { useState } from 'react';
import SystemCheck from '../components/onboarding/SystemCheck';
import ModelRecommendation from '../components/onboarding/ModelRecommendation';
import SurveyFlow from '../components/onboarding/SurveyFlow';
import ModelDownloader from '../components/onboarding/ModelDownloader';
import CompletionScreen from '../components/onboarding/CompletionScreen';
import type {
  SystemSpecs,
  RequiredModels,
  SurveyResults,
} from '../lib/tauri-api';

type OnboardingStep = 'system' | 'recommendation' | 'survey' | 'download' | 'complete';

interface SmartOnboardingProps {
  onComplete: () => void;
}

export default function SmartOnboarding({ onComplete }: SmartOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('system');
  const [systemSpecs, setSystemSpecs] = useState<SystemSpecs | null>(null);
  const [_selectedModel, setSelectedModel] = useState<string>('');
  const [requiredModels, setRequiredModels] = useState<RequiredModels | null>(null);
  const [surveyResults, setSurveyResults] = useState<SurveyResults | null>(null);
  const [_customPrompt, setCustomPrompt] = useState<string>('');

  // Step 1: System Check Complete
  const handleSystemCheckComplete = (specs: SystemSpecs) => {
    setSystemSpecs(specs);
    setCurrentStep('survey'); // Go to survey first to get language preference
  };

  // Step 2: Survey Complete (includes language preference)
  const handleSurveyComplete = async (results: SurveyResults, prompt: string) => {
    setSurveyResults(results);
    setCustomPrompt(prompt);

    // Save survey results to database
    try {
      await window.api.saveSurveyResults(JSON.stringify(results), prompt);
    } catch (error) {
      console.error('Failed to save survey results:', error);
    }

    setCurrentStep('recommendation'); // Now show model recommendation with language context
  };

  // Step 3: Model Recommendation Accepted
  const handleModelAccept = async (model: string, models: RequiredModels) => {
    setSelectedModel(model);
    setRequiredModels(models);

    // Save onboarding state to database
    if (systemSpecs) {
      try {
        await window.api.saveOnboardingState(
          JSON.stringify(systemSpecs),
          model,
          model
        );
      } catch (error) {
        console.error('Failed to save onboarding state:', error);
      }
    }

    setCurrentStep('download');
  };

  // Step 4: Download Complete
  const handleDownloadComplete = async () => {
    setCurrentStep('complete');

    // Mark onboarding as completed
    try {
      await window.api.markOnboardingCompleted();
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
    }
  };

  // Step 5: Start Chatting
  const handleStart = () => {
    onComplete();
  };

  // Navigation: Go Back
  const handleBack = () => {
    switch (currentStep) {
      case 'survey':
        setCurrentStep('system');
        break;
      case 'recommendation':
        setCurrentStep('survey');
        break;
      case 'download':
        setCurrentStep('recommendation');
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-screen w-screen">
      {/* Step 1: System Check */}
      {currentStep === 'system' && (
        <SystemCheck onComplete={handleSystemCheckComplete} />
      )}

      {/* Step 2: Survey Flow (NOW BEFORE MODEL RECOMMENDATION) */}
      {currentStep === 'survey' && (
        <SurveyFlow onComplete={handleSurveyComplete} onBack={handleBack} />
      )}

      {/* Step 3: Model Recommendation (WITH LANGUAGE CONTEXT) */}
      {currentStep === 'recommendation' && systemSpecs && surveyResults && (
        <ModelRecommendation
          specs={systemSpecs}
          languagePreference={surveyResults.primary_language}
          onAccept={handleModelAccept}
          onBack={handleBack}
        />
      )}

      {/* Step 4: Model Downloader */}
      {currentStep === 'download' && requiredModels && (
        <ModelDownloader
          requiredModels={requiredModels}
          onComplete={handleDownloadComplete}
          onBack={handleBack}
        />
      )}

      {/* Step 5: Completion Screen */}
      {currentStep === 'complete' && <CompletionScreen onStart={handleStart} />}
    </div>
  );
}

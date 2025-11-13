/**
 * Onboarding Component
 * First-run experience for new users
 *
 * Steps:
 * 1. Welcome message
 * 2. Choose language (Korean, English)
 * 3. Download AI models (~12GB)
 * 4. Choose mode (User-Led, AI-Led)
 * 5. Quick tutorial
 * 6. Grant permissions
 * 7. Customize persona
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ModelDownload } from '@/components/download/ModelDownload';

type OnboardingStep = 'welcome' | 'language' | 'download' | 'mode' | 'tutorial' | 'permissions' | 'persona' | 'complete';

export function Onboarding() {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en'>('ko');
  const [selectedMode, setSelectedMode] = useState<'user-led' | 'ai-led'>('user-led');
  const [personaParams, setPersonaParams] = useState({
    formality: 50,
    humor: 50,
    enthusiasm: 50,
  });

  const totalSteps = 7;
  const currentStepNumber = {
    welcome: 1,
    language: 2,
    download: 3,
    mode: 4,
    tutorial: 5,
    permissions: 6,
    persona: 7,
    complete: 7,
  }[currentStep];

  // Handle language selection
  const handleLanguageSelect = (lang: 'ko' | 'en') => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
  };

  // Handle permissions request
  const handleRequestPermissions = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // TODO: Request screen recording permission via IPC
      // await window.api.requestScreenPermission();

      setCurrentStep('persona');
    } catch (error) {
      console.error('Permission denied:', error);
    }
  };

  // Handle onboarding complete
  const handleComplete = async () => {
    // Save settings
    try {
      // TODO: Save via IPC
      // await window.api.saveOnboardingSettings({
      //   language: selectedLanguage,
      //   mode: selectedMode,
      //   persona: personaParams,
      // });

      setCurrentStep('complete');

      // Navigate to main app after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-3xl text-center">
                {t('onboarding.welcome.title', 'Welcome to Garden of Eden V3')}
              </CardTitle>
              <CardDescription className="text-center text-lg">
                {t('onboarding.welcome.subtitle', 'Your personal AI assistant that runs 100% locally')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p>{t('onboarding.welcome.description', 'Garden of Eden is a privacy-first AI assistant that helps you with:')}</p>
                <ul>
                  <li>{t('onboarding.welcome.feature1', 'Coding and development tasks')}</li>
                  <li>{t('onboarding.welcome.feature2', 'Understanding your screen context')}</li>
                  <li>{t('onboarding.welcome.feature3', 'Voice conversations in Korean and English')}</li>
                  <li>{t('onboarding.welcome.feature4', 'Learning your preferences over time')}</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.welcome.privacy', '🔒 Everything stays on your computer. No data is sent to the cloud.')}
                </p>
              </div>
              <Button onClick={() => setCurrentStep('language')} className="w-full" size="lg">
                {t('onboarding.welcome.getStarted', 'Get Started')}
              </Button>
            </CardContent>
          </Card>
        );

      case 'language':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{t('onboarding.language.title', 'Choose Your Language')}</CardTitle>
              <CardDescription>
                {t('onboarding.language.subtitle', 'Select your preferred language for the interface')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedLanguage} onValueChange={(value) => handleLanguageSelect(value as 'ko' | 'en')}>
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="ko" id="lang-ko" />
                  <Label htmlFor="lang-ko" className="flex-1 cursor-pointer">
                    <div className="font-medium">한국어 (Korean)</div>
                    <div className="text-sm text-muted-foreground">한국어 인터페이스 사용</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="en" id="lang-en" />
                  <Label htmlFor="lang-en" className="flex-1 cursor-pointer">
                    <div className="font-medium">English</div>
                    <div className="text-sm text-muted-foreground">Use English interface</div>
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3">
                <Button onClick={() => setCurrentStep('welcome')} variant="outline" className="flex-1">
                  {t('common.back', 'Back')}
                </Button>
                <Button onClick={() => setCurrentStep('download')} className="flex-1">
                  {t('common.continue', 'Continue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'download':
        return (
          <div className="w-full max-w-3xl space-y-6">
            <ModelDownload onComplete={() => {
              // Auto-advance to next step when download completes
              setTimeout(() => setCurrentStep('mode'), 2000);
            }} />

            <div className="flex gap-3">
              <Button onClick={() => setCurrentStep('language')} variant="outline" className="flex-1">
                {t('common.back', 'Back')}
              </Button>
              <Button onClick={() => setCurrentStep('mode')} variant="outline" className="flex-1">
                {t('onboarding.download.skipForNow', 'Skip for Now')}
              </Button>
            </div>
          </div>
        );

      case 'mode':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{t('onboarding.mode.title', 'Choose Your Mode')}</CardTitle>
              <CardDescription>
                {t('onboarding.mode.subtitle', 'How should Eden interact with you?')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedMode} onValueChange={(value) => setSelectedMode(value as any)}>
                <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="user-led" id="mode-user" className="mt-1" />
                  <Label htmlFor="mode-user" className="flex-1 cursor-pointer">
                    <div className="font-medium mb-1">
                      {t('onboarding.mode.userLed.title', 'User-Led (Recommended)')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('onboarding.mode.userLed.description', 'Eden waits for your input and responds. Like a traditional assistant.')}
                    </div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="ai-led" id="mode-ai" className="mt-1" />
                  <Label htmlFor="mode-ai" className="flex-1 cursor-pointer">
                    <div className="font-medium mb-1">
                      {t('onboarding.mode.aiLed.title', 'AI-Led (Proactive)')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('onboarding.mode.aiLed.description', 'Eden monitors your screen and proactively suggests help. More JARVIS-like.')}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                {t('onboarding.mode.note', 'You can change this anytime in Settings.')}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setCurrentStep('download')} variant="outline" className="flex-1">
                  {t('common.back', 'Back')}
                </Button>
                <Button onClick={() => setCurrentStep('tutorial')} className="flex-1">
                  {t('common.continue', 'Continue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'tutorial':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{t('onboarding.tutorial.title', 'Quick Tutorial')}</CardTitle>
              <CardDescription>
                {t('onboarding.tutorial.subtitle', 'Learn the basics in 30 seconds')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{t('onboarding.tutorial.step1.title', 'Start a Conversation')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.tutorial.step1.description', 'Type your question or press the microphone button for voice input')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{t('onboarding.tutorial.step2.title', 'Get Help')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.tutorial.step2.description', 'Ask Eden to read files, analyze your screen, or help with code')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{t('onboarding.tutorial.step3.title', 'Customize')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.tutorial.step3.description', 'Adjust Eden\'s personality in Settings to match your style')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setCurrentStep('mode')} variant="outline" className="flex-1">
                  {t('common.back', 'Back')}
                </Button>
                <Button onClick={() => setCurrentStep('permissions')} className="flex-1">
                  {t('common.continue', 'Continue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'permissions':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{t('onboarding.permissions.title', 'Grant Permissions')}</CardTitle>
              <CardDescription>
                {t('onboarding.permissions.subtitle', 'Eden needs these permissions to work properly')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="text-2xl">🎤</div>
                  <div>
                    <h4 className="font-medium">{t('onboarding.permissions.microphone.title', 'Microphone Access')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.permissions.microphone.description', 'Required for voice input')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="text-2xl">🖥️</div>
                  <div>
                    <h4 className="font-medium">{t('onboarding.permissions.screen.title', 'Screen Recording')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.permissions.screen.description', 'Required for understanding your screen context')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="text-2xl">📁</div>
                  <div>
                    <h4 className="font-medium">{t('onboarding.permissions.files.title', 'File System Access')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.permissions.files.description', 'Required for reading and editing files you ask about')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                {t('onboarding.permissions.note', 'All data stays on your computer. Permissions can be revoked in System Settings.')}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setCurrentStep('tutorial')} variant="outline" className="flex-1">
                  {t('common.back', 'Back')}
                </Button>
                <Button onClick={handleRequestPermissions} className="flex-1">
                  {t('onboarding.permissions.grant', 'Grant Permissions')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'persona':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{t('onboarding.persona.title', 'Customize Eden\'s Personality')}</CardTitle>
              <CardDescription>
                {t('onboarding.persona.subtitle', 'Quick setup (you can fine-tune later)')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>{t('onboarding.persona.formality', 'Formality')}</Label>
                  <Slider
                    value={[personaParams.formality]}
                    onValueChange={([value]) => setPersonaParams({ ...personaParams, formality: value })}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('onboarding.persona.casual', 'Casual')}</span>
                    <span>{t('onboarding.persona.formal', 'Formal')}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>{t('onboarding.persona.humor', 'Humor')}</Label>
                  <Slider
                    value={[personaParams.humor]}
                    onValueChange={([value]) => setPersonaParams({ ...personaParams, humor: value })}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('onboarding.persona.serious', 'Serious')}</span>
                    <span>{t('onboarding.persona.humorous', 'Humorous')}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>{t('onboarding.persona.enthusiasm', 'Enthusiasm')}</Label>
                  <Slider
                    value={[personaParams.enthusiasm]}
                    onValueChange={([value]) => setPersonaParams({ ...personaParams, enthusiasm: value })}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('onboarding.persona.neutral', 'Neutral')}</span>
                    <span>{t('onboarding.persona.enthusiastic', 'Enthusiastic')}</span>
                  </div>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                {t('onboarding.persona.note', 'Eden will learn your preferences over time and adjust automatically.')}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setCurrentStep('permissions')} variant="outline" className="flex-1">
                  {t('common.back', 'Back')}
                </Button>
                <Button onClick={handleComplete} className="flex-1">
                  {t('onboarding.persona.finish', 'Finish Setup')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card className="w-full max-w-2xl">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold mb-2">{t('onboarding.complete.title', 'You\'re All Set!')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('onboarding.complete.subtitle', 'Eden is ready to assist you')}
              </p>
              <div className="animate-pulse text-sm text-muted-foreground">
                {t('onboarding.complete.loading', 'Launching Garden of Eden...')}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Progress indicator */}
      {currentStep !== 'complete' && (
        <div className="w-full max-w-2xl mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{t('onboarding.progress', 'Step {{current}} of {{total}}', { current: currentStepNumber, total: totalSteps })}</span>
            <span>{Math.round((currentStepNumber / totalSteps) * 100)}%</span>
          </div>
          <Progress value={(currentStepNumber / totalSteps) * 100} />
        </div>
      )}

      {/* Current step content */}
      {renderStep()}

      {/* Skip button (except on download and complete) */}
      {currentStep !== 'download' && currentStep !== 'complete' && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 text-muted-foreground"
          onClick={() => setCurrentStep('complete')}
        >
          {t('onboarding.skip', 'Skip for now')}
        </Button>
      )}
    </div>
  );
}

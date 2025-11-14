/**
 * Settings Page
 * Configure AI parameters, persona, and application preferences
 */

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import PersonaPreviewPanel from '../components/PersonaPreviewPanel';
import PersonaParameterGroup from '../components/PersonaParameterGroup';
import { PERSONA_GROUPS } from '@shared/types/persona-groups.types';
import type { PersonaSettings } from '../lib/tauri-api';

interface SettingsProps {
  onClose: () => void;
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export function Settings({ onClose, onThemeChange }: SettingsProps) {
  const [persona, setPersona] = useState<PersonaSettings>({
    formality: 5,
    humor: 5,
    verbosity: 5,
    emojiUsage: 5,
    enthusiasm: 5,
    empathy: 7,
    directness: 5,
    technicality: 5,
    creativity: 5,
    proactivity: 5,
    languagePreference: 'ko',
    codeLanguagePreference: 'typescript',
    patience: 7,
    encouragement: 7,
    formalityHonorifics: 5,
    reasoningDepth: 5,
    contextAwareness: 7,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [theme, setTheme] = useState('light');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await window.api.getSettings() as { persona: PersonaSettings; theme: string };
      setPersona(settings.persona);
      setTheme(settings.theme);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await window.api.updateSettings({
        persona: {
          ...persona,
          updatedAt: Date.now(),
        },
        theme,
        language: persona.languagePreference,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('모든 설정을 초기화하시겠습니까?')) {
      setPersona({
        formality: 5,
        humor: 5,
        verbosity: 5,
        emojiUsage: 5,
        enthusiasm: 5,
        empathy: 7,
        directness: 5,
        technicality: 5,
        creativity: 5,
        proactivity: 5,
        languagePreference: 'ko',
        codeLanguagePreference: 'typescript',
        patience: 7,
        encouragement: 7,
        formalityHonorifics: 5,
        reasoningDepth: 5,
        contextAwareness: 7,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  };

  const updatePersona = (key: keyof PersonaSettings, value: number | string) => {
    setPersona((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-border px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          <h1 className="text-xl font-semibold">설정</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            초기화
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : saveSuccess ? '저장됨!' : '저장'}
          </Button>
        </div>
      </header>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* 2-column layout: Settings on left, Preview on right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Settings */}
            <div className="space-y-8">
              {/* AI Persona Settings */}
              <section>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">AI 성격 설정</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    각 그룹을 클릭하여 세부 설정을 조정하세요
                  </p>
                </div>

                <div className="space-y-3">
                  {PERSONA_GROUPS.map((group, index) => (
                    <PersonaParameterGroup
                      key={group.id}
                      group={group}
                      persona={persona}
                      onUpdate={updatePersona}
                      defaultExpanded={index === 0} // First group expanded by default
                    />
                  ))}
                </div>
              </section>

              {/* Application Settings */}
              <section>
                <h2 className="text-lg font-semibold mb-4">앱 설정</h2>
                <div className="space-y-4 bg-card p-6 rounded-lg border border-border">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">다크 모드</label>
                  <p className="text-xs text-muted-foreground">어두운 테마 사용</p>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => {
                    const newTheme = checked ? 'dark' : 'light';
                    setTheme(newTheme);
                    onThemeChange?.(newTheme);
                  }}
                />
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">언어</label>
                  <p className="text-xs text-muted-foreground">인터페이스 언어</p>
                </div>
                <select
                  value={persona.languagePreference}
                  onChange={(e) => updatePersona('languagePreference', e.target.value)}
                  className="px-3 py-2 text-sm border border-input rounded-md bg-background"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Code Language */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">선호 코드 언어</label>
                  <p className="text-xs text-muted-foreground">코드 예제 생성 시</p>
                </div>
                <select
                  value={persona.codeLanguagePreference}
                  onChange={(e) => updatePersona('codeLanguagePreference', e.target.value)}
                  className="px-3 py-2 text-sm border border-input rounded-md bg-background"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="rust">Rust</option>
                  <option value="go">Go</option>
                </select>
              </div>
                </div>
              </section>

              {/* About */}
              <section>
                <h2 className="text-lg font-semibold mb-4">정보</h2>
                <div className="bg-card p-6 rounded-lg border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">버전</span>
                <span className="font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">플랫폼</span>
                <span className="font-mono">{window.api.platform}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AI 모델</span>
                <span className="font-mono">Llama 3.1 8B</span>
              </div>
                </div>
              </section>
            </div>

            {/* Right Column: Preview Panel */}
            <div className="hidden lg:block">
              <PersonaPreviewPanel persona={persona} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

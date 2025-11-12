/**
 * Settings Page
 * Configure AI parameters, persona, and application preferences
 */

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import type { PersonaSettings } from '../lib/tauri-api';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
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
      const settings = await window.api.getSettings();
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
        <div className="max-w-3xl mx-auto space-y-8">
          {/* AI Persona Settings */}
          <section>
            <h2 className="text-lg font-semibold mb-4">AI 성격 설정</h2>
            <div className="space-y-6 bg-card p-6 rounded-lg border border-border">
              {/* Formality */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">격식 수준</label>
                  <span className="text-sm text-muted-foreground">{persona.formality}/10</span>
                </div>
                <Slider
                  value={[persona.formality]}
                  onValueChange={([value]) => updatePersona('formality', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 편한 말투 | 높음: 존댓말
                </p>
              </div>

              {/* Humor */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">유머 감각</label>
                  <span className="text-sm text-muted-foreground">{persona.humor}/10</span>
                </div>
                <Slider
                  value={[persona.humor]}
                  onValueChange={([value]) => updatePersona('humor', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 진지함 | 높음: 유머러스
                </p>
              </div>

              {/* Verbosity */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">말 많기</label>
                  <span className="text-sm text-muted-foreground">{persona.verbosity}/10</span>
                </div>
                <Slider
                  value={[persona.verbosity]}
                  onValueChange={([value]) => updatePersona('verbosity', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 간결한 답변 | 높음: 상세한 설명
                </p>
              </div>

              {/* Emoji Usage */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">이모지 사용</label>
                  <span className="text-sm text-muted-foreground">{persona.emojiUsage}/10</span>
                </div>
                <Slider
                  value={[persona.emojiUsage]}
                  onValueChange={([value]) => updatePersona('emojiUsage', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 텍스트만 | 높음: 이모지 많이 사용
                </p>
              </div>

              {/* Enthusiasm */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">열정</label>
                  <span className="text-sm text-muted-foreground">{persona.enthusiasm}/10</span>
                </div>
                <Slider
                  value={[persona.enthusiasm]}
                  onValueChange={([value]) => updatePersona('enthusiasm', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 차분함 | 높음: 열정적
                </p>
              </div>

              {/* Empathy */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">공감 능력</label>
                  <span className="text-sm text-muted-foreground">{persona.empathy}/10</span>
                </div>
                <Slider
                  value={[persona.empathy]}
                  onValueChange={([value]) => updatePersona('empathy', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 사실 중심 | 높음: 감정 공감
                </p>
              </div>

              {/* Directness */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">직설적</label>
                  <span className="text-sm text-muted-foreground">{persona.directness}/10</span>
                </div>
                <Slider
                  value={[persona.directness]}
                  onValueChange={([value]) => updatePersona('directness', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 완곡한 표현 | 높음: 직설적 표현
                </p>
              </div>

              {/* Technicality */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">기술 수준</label>
                  <span className="text-sm text-muted-foreground">{persona.technicality}/10</span>
                </div>
                <Slider
                  value={[persona.technicality]}
                  onValueChange={([value]) => updatePersona('technicality', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 쉬운 설명 | 높음: 전문 용어 사용
                </p>
              </div>

              {/* Creativity */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">창의성</label>
                  <span className="text-sm text-muted-foreground">{persona.creativity}/10</span>
                </div>
                <Slider
                  value={[persona.creativity]}
                  onValueChange={([value]) => updatePersona('creativity', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 정확성 중시 | 높음: 창의적 제안
                </p>
              </div>

              {/* Proactivity */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">주도성</label>
                  <span className="text-sm text-muted-foreground">{persona.proactivity}/10</span>
                </div>
                <Slider
                  value={[persona.proactivity]}
                  onValueChange={([value]) => updatePersona('proactivity', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 수동적 대응 | 높음: 먼저 제안
                </p>
              </div>

              {/* Patience */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">인내심</label>
                  <span className="text-sm text-muted-foreground">{persona.patience}/10</span>
                </div>
                <Slider
                  value={[persona.patience]}
                  onValueChange={([value]) => updatePersona('patience', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 빠른 답변 | 높음: 천천히 설명
                </p>
              </div>

              {/* Encouragement */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">격려</label>
                  <span className="text-sm text-muted-foreground">{persona.encouragement}/10</span>
                </div>
                <Slider
                  value={[persona.encouragement]}
                  onValueChange={([value]) => updatePersona('encouragement', value)}
                  min={0}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  낮음: 사실만 전달 | 높음: 적극 격려
                </p>
              </div>
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
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
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
      </div>
    </div>
  );
}

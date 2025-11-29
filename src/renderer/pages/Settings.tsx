/**
 * Settings Page
 * Configure AI parameters, persona, and application preferences
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import PersonaPreviewPanel from '../components/PersonaPreviewPanel';
import PersonaParameterGroup from '../components/PersonaParameterGroup';
import { PERSONA_GROUPS } from '@shared/types/persona-groups.types';
import type { PersonaSettings } from '../lib/tauri-api';
import { toast } from '../stores/toast.store';
import { ToolsSettings } from '../components/settings';
import { CrashReportsPanel } from '../components/settings/CrashReportsPanel'; // v3.4.0
import { UpdateSettingsPanel } from '../components/settings/UpdateSettingsPanel'; // v3.4.0
import { RaftSettings } from '../components/settings/RaftSettings'; // v3.4.0 Phase 7
import LLMSettingsPanel from '../components/settings/LLMSettings'; // v3.5.0
import { LoRASettings } from '../components/settings/LoRASettings'; // v3.6.0
import { Phase5Settings } from '../components/settings/Phase5Settings'; // v3.9.0
import { IntegrationsSettingsPanel } from '../components/settings/IntegrationsSettings'; // v3.4.0 Performance
import MemoryVisualization from './MemoryVisualization'; // Settings integration
import { TaskPlannerPanel } from '../components/task-planner/TaskPlannerPanel'; // Settings integration
import { GoalTrackerPanel } from '../components/goal-tracker/GoalTrackerPanel'; // Settings integration
import { LearningStylePanel } from '../components/learning-style/LearningStylePanel'; // Settings integration
import ShortcutHelp from '../components/ShortcutHelp'; // Settings integration

interface SettingsProps {
  onClose: () => void;
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export function Settings({ onClose, onThemeChange }: SettingsProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'persona' | 'tools' | 'llm' | 'phase5' | 'lora' | 'app' | 'integrations' | 'raft' | 'updates' | 'crashes' | 'about' | 'shortcuts' | 'memory' | 'taskplanner' | 'goaltracker' | 'learning'>('persona'); // Added: lora, shortcuts, memory, taskplanner, goaltracker, learning
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

  // Handle language change
  const handleLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang);
    updatePersona('languagePreference', newLang);
    toast.success(newLang === 'ko' ? '언어가 변경되었습니다' : 'Language changed successfully');
  };

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

      // Show success toast
      toast.success('설정이 저장되었습니다', '변경사항이 즉시 적용됩니다');
    } catch (error) {
      console.error('Failed to save settings:', error);

      // Show error toast with actionable message
      toast.error(
        '설정 저장 실패',
        '네트워크 연결을 확인하거나 다시 시도해주세요',
        5000
      );
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

      // Show info toast
      toast.info('설정이 초기화되었습니다', '저장 버튼을 눌러 변경사항을 적용하세요');
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            title="뒤로 가기 (Esc)"
          >
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
          <Button variant="outline" size="sm" onClick={handleReset} title="모든 설정을 기본값으로 되돌리기">
            초기화
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} title="변경사항 저장 (⌘S)">
            {isSaving ? '저장 중...' : saveSuccess ? '저장됨!' : '저장'}
          </Button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex-shrink-0 border-b border-border bg-muted/30">
        <div className="flex gap-1 px-6">
          <button
            onClick={() => setActiveTab('persona')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'persona'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🎭 AI 성격
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tools'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🔧 도구 설정
          </button>
          {/* v3.5.0: LLM Settings Tab */}
          <button
            onClick={() => setActiveTab('llm')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'llm'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🧠 LLM 설정
          </button>
          {/* v3.9.0: Phase 5 Reasoning Engine Tab */}
          <button
            onClick={() => setActiveTab('phase5')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'phase5'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🔗 추론 엔진
          </button>
          {/* v3.6.0: LoRA Fine-Tuning Tab */}
          <button
            onClick={() => setActiveTab('lora')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'lora'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🧬 LoRA
          </button>
          <button
            onClick={() => setActiveTab('app')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'app'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            ⚙️ 앱 설정
          </button>
          {/* v3.4.0 Performance: Integrations Tab */}
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'integrations'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🔌 통합 기능
          </button>
          {/* v3.4.0 Phase 7: RAFT Tab */}
          <button
            onClick={() => setActiveTab('raft')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'raft'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🛡️ RAFT
          </button>
          {/* v3.4.0: Updates Tab */}
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'updates'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🔄 업데이트
          </button>
          {/* v3.4.0: Crash Reports Tab */}
          <button
            onClick={() => setActiveTab('crashes')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'crashes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🐛 충돌 리포트
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'shortcuts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            ⌨️ 단축키
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'memory'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🧠 메모리 시각화
          </button>
          <button
            onClick={() => setActiveTab('taskplanner')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'taskplanner'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🎯 작업 계획
          </button>
          <button
            onClick={() => setActiveTab('goaltracker')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'goaltracker'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🏆 목표 추적
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'learning'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            🎓 학습 추적
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'about'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            ℹ️ 정보
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Persona Tab */}
          {activeTab === 'persona' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Settings */}
              <div className="space-y-3">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">AI 성격 설정</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    각 그룹을 클릭하여 세부 설정을 조정하세요
                  </p>
                </div>

                {PERSONA_GROUPS.map((group, index) => (
                  <PersonaParameterGroup
                    key={group.id}
                    group={group}
                    persona={persona}
                    onUpdate={updatePersona}
                    defaultExpanded={index === 0}
                  />
                ))}
              </div>

              {/* Right Column: Preview */}
              <PersonaPreviewPanel persona={persona} />
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="max-w-5xl mx-auto">
              <ToolsSettings />
            </div>
          )}

          {/* LLM Settings Tab (v3.5.0) */}
          {activeTab === 'llm' && (
            <div className="max-w-4xl mx-auto">
              <LLMSettingsPanel />
            </div>
          )}

          {/* Phase 5 Reasoning Engine Tab (v3.9.0) */}
          {activeTab === 'phase5' && (
            <div className="max-w-5xl mx-auto">
              <Phase5Settings />
            </div>
          )}

          {/* LoRA Fine-Tuning Tab (v3.6.0) */}
          {activeTab === 'lora' && (
            <div className="max-w-4xl mx-auto">
              <LoRASettings />
            </div>
          )}

          {/* App Settings Tab */}
          {activeTab === 'app' && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">앱 설정</h2>
                <p className="text-sm text-muted-foreground">
                  애플리케이션 동작 및 외관을 설정합니다
                </p>
              </div>

              <div className="space-y-6">
                {/* Appearance Section */}
                <section className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold mb-4">외관</h3>
                  <div className="space-y-4">
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
                        <label className="text-sm font-medium">{t('settings.app.language')}</label>
                        <p className="text-xs text-muted-foreground">{t('settings.app.languageDesc')}</p>
                      </div>
                      <select
                        value={i18n.language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="px-3 py-2 text-sm border border-input rounded-md bg-background"
                      >
                        <option value="ko">{t('settings.app.korean')}</option>
                        <option value="en">{t('settings.app.english')}</option>
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
              </div>
            </div>
          )}

          {/* Integrations Tab (v3.4.0 Performance) */}
          {activeTab === 'integrations' && (
            <div className="max-w-4xl">
              <IntegrationsSettingsPanel />
            </div>
          )}

          {/* RAFT Tab (v3.4.0 Phase 7) */}
          {activeTab === 'raft' && (
            <div className="max-w-3xl">
              <RaftSettings />
            </div>
          )}

          {/* Updates Tab (v3.4.0) */}
          {activeTab === 'updates' && (
            <div className="max-w-3xl">
              <UpdateSettingsPanel />
            </div>
          )}

          {/* Crash Reports Tab (v3.4.0) */}
          {activeTab === 'crashes' && (
            <div className="max-w-5xl">
              <CrashReportsPanel />
            </div>
          )}

          {/* Keyboard Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div className="max-w-4xl mx-auto">
              <ShortcutHelp isOpen={true} onClose={() => {}} />
            </div>
          )}

          {/* Memory Visualization Tab */}
          {activeTab === 'memory' && (
            <div className="max-w-7xl mx-auto">
              <MemoryVisualization onClose={() => {}} />
            </div>
          )}

          {/* Task Planner Tab */}
          {activeTab === 'taskplanner' && (
            <div className="max-w-6xl mx-auto">
              <TaskPlannerPanel />
            </div>
          )}

          {/* Goal Tracker Tab */}
          {activeTab === 'goaltracker' && (
            <div className="max-w-6xl mx-auto">
              <GoalTrackerPanel />
            </div>
          )}

          {/* Learning Style Tab */}
          {activeTab === 'learning' && (
            <div className="max-w-5xl mx-auto">
              <LearningStylePanel />
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">정보</h2>
                <p className="text-sm text-muted-foreground">
                  Garden of Eden V3에 대한 정보
                </p>
              </div>

              <section>
                <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                  {/* Version Info */}
                  <div className="space-y-2">
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
                      <span className="font-mono">Qwen 2.5 14B Instruct</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* System Info */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold mb-2">시스템 정보</h3>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>🔒 100% 로컬 실행 - 데이터가 외부로 전송되지 않습니다</p>
                      <p>🚀 빠른 응답 - 22-26 tokens/sec</p>
                      <p>💾 메모리 사용량 - 약 22-25GB RAM</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Links */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold mb-2">도움말</h3>
                    <div className="flex flex-col gap-2">
                      <button
                        className="text-xs text-primary hover:underline text-left"
                        onClick={() => window.open('https://github.com', '_blank')}
                      >
                        📖 문서 보기
                      </button>
                      <button
                        className="text-xs text-primary hover:underline text-left"
                        onClick={() => window.open('https://github.com', '_blank')}
                      >
                        🐛 버그 리포트
                      </button>
                      <button
                        className="text-xs text-primary hover:underline text-left"
                        onClick={() => window.open('https://github.com', '_blank')}
                      >
                        💡 기능 제안
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
                    Made with ❤️ by Eden Team
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

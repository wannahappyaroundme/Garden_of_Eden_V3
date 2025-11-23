/**
 * Integrations Settings Panel (v3.4.0 Performance Optimization)
 *
 * Toggle optional features to reduce latency and improve performance:
 * - Webhook Triggers (default: OFF)
 * - Calendar Integration (default: OFF)
 * - Tool Auto-Execute (default: OFF)
 */

import { useState, useEffect } from 'react';
import { Switch } from '../ui/switch';
import { toast } from '../../stores/toast.store';

interface IntegrationsSettings {
  webhooksEnabled: boolean;
  calendarEnabled: boolean;
  toolAutoExecuteEnabled: boolean;
}

export function IntegrationsSettingsPanel() {
  const [settings, setSettings] = useState<IntegrationsSettings>({
    webhooksEnabled: false,
    calendarEnabled: false,
    toolAutoExecuteEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from localStorage for now (can be moved to Tauri settings later)
      const saved = localStorage.getItem('integrations_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load integrations settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async (key: keyof IntegrationsSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      // Save to localStorage
      localStorage.setItem('integrations_settings', JSON.stringify(newSettings));

      // Show success toast
      const featureName = {
        webhooksEnabled: 'Webhook 트리거',
        calendarEnabled: '캘린더 통합',
        toolAutoExecuteEnabled: '도구 자동 실행'
      }[key];

      toast.success(`${featureName}가 ${value ? '활성화' : '비활성화'}되었습니다`);
    } catch (error) {
      console.error('Failed to save integrations settings:', error);
      toast.error('설정 저장 실패');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">🔌 통합 기능 설정</h2>
        <p className="text-sm text-muted-foreground">
          성능 최적화를 위해 사용하지 않는 기능은 비활성화하세요. 모든 기능은 기본적으로 꺼져 있습니다.
        </p>
      </div>

      {/* Performance Notice */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex gap-3">
          <span className="text-blue-600 dark:text-blue-400 text-xl">⚡</span>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              성능 최적화
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              사용하지 않는 기능을 비활성화하면 응답 속도가 빨라지고 리소스 사용량이 줄어듭니다.
            </p>
          </div>
        </div>
      </div>

      {/* Webhook Triggers */}
      <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">🪝 Webhook 트리거</h3>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                {settings.webhooksEnabled ? '활성화' : '비활성화'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              대화 시작, 메시지 전송/수신 시 외부 웹훅 URL로 알림을 전송합니다.
            </p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>• 대화 시작 시 알림 전송</p>
              <p>• 메시지 전송/수신 시 실시간 웹훅 호출</p>
              <p>• 외부 시스템과 연동 (Slack, Discord, 자동화 워크플로우 등)</p>
            </div>
          </div>
          <Switch
            checked={settings.webhooksEnabled}
            onCheckedChange={(checked) => saveSetting('webhooksEnabled', checked)}
          />
        </div>
      </div>

      {/* Calendar Integration */}
      <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">📅 캘린더 통합</h3>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                {settings.calendarEnabled ? '활성화' : '비활성화'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Google Calendar, Outlook 등의 캘린더와 연동하여 일정을 관리합니다.
            </p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>• 캘린더 이벤트 조회 및 생성</p>
              <p>• AI가 자동으로 일정 제안 및 관리</p>
              <p>• 일정 기반 컨텍스트 제공</p>
            </div>
          </div>
          <Switch
            checked={settings.calendarEnabled}
            onCheckedChange={(checked) => saveSetting('calendarEnabled', checked)}
          />
        </div>
      </div>

      {/* Tool Auto-Execute */}
      <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">🔧 도구 자동 실행</h3>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                {settings.toolAutoExecuteEnabled ? '활성화' : '비활성화'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI가 필요하다고 판단할 때 도구를 자동으로 실행합니다.
            </p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>• 파일 조작 (읽기, 쓰기, 검색)</p>
              <p>• 웹 검색 및 정보 수집</p>
              <p>• 코드 실행 및 분석</p>
              <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                ⚠️ 보안: 신뢰할 수 있는 환경에서만 활성화하세요
              </p>
            </div>
          </div>
          <Switch
            checked={settings.toolAutoExecuteEnabled}
            onCheckedChange={(checked) => saveSetting('toolAutoExecuteEnabled', checked)}
          />
        </div>
      </div>

      {/* Performance Impact Notice */}
      <div className="rounded-lg bg-muted border border-border p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">📊 성능 영향</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• <strong>모든 기능 비활성화 (권장):</strong> 최고 성능, 3-4초 응답 시간</p>
          <p>• <strong>Webhook만 활성화:</strong> +50-100ms 추가 레이턴시</p>
          <p>• <strong>캘린더 활성화:</strong> +100-200ms 추가 레이턴시 (API 호출)</p>
          <p>• <strong>도구 자동 실행:</strong> +200-500ms 추가 레이턴시 (도구 실행 시간 포함)</p>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <button
          onClick={() => {
            setSettings({
              webhooksEnabled: false,
              calendarEnabled: false,
              toolAutoExecuteEnabled: false,
            });
            localStorage.setItem('integrations_settings', JSON.stringify({
              webhooksEnabled: false,
              calendarEnabled: false,
              toolAutoExecuteEnabled: false,
            }));
            toast.success('기본 설정으로 초기화되었습니다');
          }}
          className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
        >
          기본값으로 초기화
        </button>
      </div>
    </div>
  );
}

/**
 * Crash Reports Panel Component (v3.4.0)
 * View, manage, and export crash reports
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { AlertTriangle, Download, Trash2, RefreshCw, FileText, Send } from 'lucide-react';
import { CrashReportDialog, useCrashReportDialog, CrashReport } from '../CrashReportDialog';
import { toast } from '../../stores/toast.store';

interface CrashReportingSettings {
  enabled: boolean;
  send_diagnostics: boolean;
  send_performance_data: boolean;
}

export function CrashReportsPanel() {
  const [reports, setReports] = useState<CrashReport[]>([]);
  const [settings, setSettings] = useState<CrashReportingSettings>({
    enabled: false,
    send_diagnostics: false,
    send_performance_data: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);

  const { selectedReport, isOpen, setIsOpen, showReport, handleSendReport } = useCrashReportDialog();

  useEffect(() => {
    loadCrashReports();
    loadSettings();
  }, []);

  const loadCrashReports = async () => {
    setIsLoading(true);
    try {
      const data = await invoke<CrashReport[]>('crash_reporter_get_local_reports');
      setReports(data);
    } catch (error) {
      console.error('Failed to load crash reports:', error);
      toast.error('Failed to load crash reports');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await invoke<CrashReportingSettings>('crash_reporter_get_settings');
      setSettings(data);
    } catch (error) {
      console.error('Failed to load crash reporting settings:', error);
    }
  };

  const handleSettingsChange = async (key: keyof CrashReportingSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await invoke('crash_reporter_update_settings', { settings: newSettings });
      toast.success('Crash reporting settings updated');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
      // Revert on error
      loadSettings();
    }
  };

  const handleCleanupOldReports = async () => {
    if (!confirm('Delete crash reports older than 30 days?')) return;

    setIsCleaning(true);
    try {
      const deleted = await invoke<number>('crash_reporter_cleanup_old_reports', {
        retention_days: 30,
      });
      toast.success(`Deleted ${deleted} old crash reports`);
      await loadCrashReports();
    } catch (error) {
      console.error('Failed to cleanup crash reports:', error);
      toast.error('Failed to cleanup crash reports');
    } finally {
      setIsCleaning(false);
    }
  };

  const exportAllReports = () => {
    const json = JSON.stringify(reports, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crash_reports_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${reports.length} crash reports`);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const getCrashTypeColor = (type: string) => {
    switch (type) {
      case 'Panic':
        return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400';
      case 'RuntimeError':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Crash Reporting Settings</h3>

        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Send Crash Reports</div>
              <div className="text-sm text-muted-foreground">
                Automatically send crash reports to help improve the app
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Include Diagnostic Data</div>
              <div className="text-sm text-muted-foreground">
                Send system information with crash reports
              </div>
            </div>
            <Switch
              checked={settings.send_diagnostics}
              onCheckedChange={(checked) => handleSettingsChange('send_diagnostics', checked)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Include Performance Data</div>
              <div className="text-sm text-muted-foreground">
                Send performance metrics with crash reports
              </div>
            </div>
            <Switch
              checked={settings.send_performance_data}
              onCheckedChange={(checked) => handleSettingsChange('send_performance_data', checked)}
              disabled={!settings.enabled}
            />
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
          <strong>Privacy:</strong> All crash reports are sanitized to remove personal information
          (file paths, usernames, API keys) before being saved or sent.
        </div>
      </div>

      {/* Crash Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Local Crash Reports ({reports.length})
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCrashReports}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {reports.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAllReports}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanupOldReports}
                  disabled={isCleaning}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isCleaning ? 'Cleaning...' : 'Clean Up'}
                </Button>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading crash reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="text-4xl">🎉</div>
            <div className="font-medium">No crashes detected!</div>
            <div className="text-sm text-muted-foreground">
              Your app is running smoothly
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.timestamp}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => showReport(report)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCrashTypeColor(report.error_type)}`}>
                          {report.error_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(report.timestamp)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          v{report.app_version}
                        </span>
                      </div>
                      <div className="font-medium text-sm mb-1 truncate">
                        {report.error_message}
                      </div>
                      {report.context && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                          {report.context}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      showReport(report);
                    }}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crash Report Dialog */}
      <CrashReportDialog
        report={selectedReport}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSendReport={settings.enabled ? handleSendReport : undefined}
      />
    </div>
  );
}

/**
 * Crash Reports Panel Component (v3.4.0)
 * View, manage, and export crash reports
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { AlertTriangle, Download, Trash2, RefreshCw, FileText, BarChart3, TrendingDown, Bug } from 'lucide-react';
import { CrashReportDialog, useCrashReportDialog, CrashReport } from '../CrashReportDialog';
import { toast } from '../../stores/toast.store';
import { Skeleton } from '../ui/skeleton';

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

  const handleTestCrashReport = async () => {
    if (!confirm('This will create a test crash report. Continue?')) return;

    try {
      await invoke('crash_reporter_test');
      toast.success('Test crash report created!');
      // Reload reports after a short delay to allow file write
      setTimeout(loadCrashReports, 500);
    } catch (error) {
      console.error('Failed to create test crash report:', error);
      toast.error('Failed to create test crash report', error as string);
    }
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

  // Calculate crash statistics
  const getCrashStatistics = () => {
    if (reports.length === 0) {
      return {
        totalCrashes: 0,
        crashesByType: {},
        crashesLast7Days: 0,
        crashesLast30Days: 0,
        mostCommonError: null,
      };
    }

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const crashesByType: Record<string, number> = {};
    let crashesLast7Days = 0;
    let crashesLast30Days = 0;

    reports.forEach((report) => {
      const reportTime = report.timestamp * 1000;

      // Count by type
      crashesByType[report.error_type] = (crashesByType[report.error_type] || 0) + 1;

      // Count by time period
      if (reportTime >= sevenDaysAgo) {
        crashesLast7Days++;
      }
      if (reportTime >= thirtyDaysAgo) {
        crashesLast30Days++;
      }
    });

    // Find most common error type
    const mostCommonError = Object.entries(crashesByType).reduce((max, [type, count]) =>
      count > (max[1] || 0) ? [type, count] : max,
      ['', 0] as [string, number]
    );

    return {
      totalCrashes: reports.length,
      crashesByType,
      crashesLast7Days,
      crashesLast30Days,
      mostCommonError: mostCommonError[0] || null,
    };
  };

  const stats = getCrashStatistics();

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

        {/* Developer Tools (v3.4.0) */}
        <div className="p-4 bg-muted/30 border border-dashed border-muted-foreground/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Bug className="w-4 h-4 text-muted-foreground" />
            <div className="font-medium text-sm text-muted-foreground">Developer Tools</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestCrashReport}
            disabled={!settings.enabled}
            className="w-full"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Create Test Crash Report
          </Button>
          {!settings.enabled && (
            <div className="text-xs text-muted-foreground mt-2">
              Enable crash reporting to test
            </div>
          )}
        </div>
      </div>

      {/* Crash Statistics Dashboard (v3.4.0) */}
      {reports.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Crash Statistics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Crashes */}
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-red-700 dark:text-red-400">
                  Total Crashes
                </div>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-900 dark:text-red-300">
                {stats.totalCrashes}
              </div>
              <div className="text-xs text-red-600 dark:text-red-500 mt-1">
                All time
              </div>
            </div>

            {/* Last 7 Days */}
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  Last 7 Days
                </div>
                <TrendingDown className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-300">
                {stats.crashesLast7Days}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                Recent activity
              </div>
            </div>

            {/* Last 30 Days */}
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Last 30 Days
                </div>
                <BarChart3 className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">
                {stats.crashesLast30Days}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                Monthly trend
              </div>
            </div>
          </div>

          {/* Crashes by Type */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="font-medium mb-3">Crashes by Type</div>
            <div className="space-y-2">
              {Object.entries(stats.crashesByType).map(([type, count]) => {
                const percentage = ((count / stats.totalCrashes) * 100).toFixed(1);
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCrashTypeColor(type)}`}>
                          {type}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          type === 'Panic'
                            ? 'bg-red-500'
                            : type === 'RuntimeError'
                            ? 'bg-orange-500'
                            : 'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {stats.mostCommonError && (
              <div className="mt-4 p-3 bg-background rounded border border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Most Common Error Type
                </div>
                <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getCrashTypeColor(stats.mostCommonError)}`}>
                  {stats.mostCommonError}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
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

/**
 * Crash Report Dialog Component (v3.4.0)
 * Displays detailed crash report information with option to send to developers
 */

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, Copy, Download, Send, CheckCircle } from 'lucide-react';
import { toast } from '../stores/toast.store';

export interface CrashReport {
  timestamp: number;
  error_message: string;
  error_type: string;
  stack_trace: string | null;
  app_version: string;
  os_version: string;
  context: string | null;
}

interface CrashReportDialogProps {
  report: CrashReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendReport?: (report: CrashReport) => Promise<void>;
}

export function CrashReportDialog({
  report,
  open,
  onOpenChange,
  onSendReport,
}: CrashReportDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!report) return null;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyToClipboard = async () => {
    const text = `
**Crash Report**
Time: ${formatTimestamp(report.timestamp)}
Type: ${report.error_type}
Version: ${report.app_version}
OS: ${report.os_version}
Location: ${report.context || 'Unknown'}

**Error Message:**
${report.error_message}

**Stack Trace:**
${report.stack_trace || 'Not available'}
`.trim();

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Crash report copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy crash report');
    }
  };

  const downloadReport = () => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crash_${report.timestamp}_${report.error_type}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Crash report downloaded');
  };

  const handleSendReport = async () => {
    if (!onSendReport) {
      toast.error('Crash reporting not enabled');
      return;
    }

    setIsSending(true);
    try {
      await onSendReport(report);
      setSent(true);
      toast.success('Crash report sent successfully');
      setTimeout(() => {
        onOpenChange(false);
        setSent(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to send crash report:', error);
      toast.error('Failed to send crash report');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <DialogTitle>Crash Report Details</DialogTitle>
          </div>
          <DialogDescription>
            The application crashed at {formatTimestamp(report.timestamp)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Type</div>
              <div className="font-mono text-sm">{report.error_type}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">App Version</div>
              <div className="font-mono text-sm">{report.app_version}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">OS</div>
              <div className="font-mono text-sm">{report.os_version}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Location</div>
              <div className="font-mono text-sm text-blue-600 dark:text-blue-400">
                {report.context || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div>
            <div className="text-sm font-semibold mb-2">Error Message</div>
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono text-red-900 dark:text-red-100">
                {report.error_message}
              </pre>
            </div>
          </div>

          {/* Stack Trace */}
          {report.stack_trace && (
            <div>
              <div className="text-sm font-semibold mb-2">Stack Trace</div>
              <div className="p-3 bg-muted/50 border rounded-lg max-h-64 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {report.stack_trace}
                </pre>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm font-semibold mb-1">Privacy Notice</div>
            <p className="text-xs text-muted-foreground">
              This crash report has been automatically sanitized to remove:
              file paths, user names, API keys, and other sensitive information.
              Local crash logs are always saved. Cloud reporting requires your consent.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadReport}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {onSendReport && !sent && (
              <Button
                size="sm"
                onClick={handleSendReport}
                disabled={isSending}
                className="flex-1"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Report
                  </>
                )}
              </Button>
            )}
            {sent && (
              <Button size="sm" variant="outline" className="flex-1" disabled>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Sent!
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage crash report dialogs
 */
export function useCrashReportDialog() {
  const [selectedReport, setSelectedReport] = useState<CrashReport | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showReport = (report: CrashReport) => {
    setSelectedReport(report);
    setIsOpen(true);
  };

  const handleSendReport = async (report: CrashReport) => {
    // Check if crash reporting is enabled
    const settings = await invoke<{ enabled: boolean }>('crash_reporter_get_settings');
    if (!settings.enabled) {
      throw new Error('Crash reporting is disabled. Enable it in Settings > Privacy.');
    }

    // Send the report
    await invoke('crash_reporter_report_error', {
      error_message: report.error_message,
      context: report.context,
    });
  };

  return {
    selectedReport,
    isOpen,
    setIsOpen,
    showReport,
    handleSendReport,
  };
}

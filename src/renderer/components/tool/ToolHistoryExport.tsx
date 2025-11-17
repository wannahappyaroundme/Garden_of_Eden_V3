/**
 * ToolHistoryExport Component (v3.7.0 Phase 3)
 * Export tool history to JSON or CSV
 */

import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Check } from 'lucide-react';
import type {
  ToolCallRecord,
  ToolHistoryExportFormat,
  ToolHistoryExportOptions,
} from '../../../shared/types/tool-history.types';
import { cn } from '../../lib/utils';

export interface ToolHistoryExportProps {
  records: ToolCallRecord[];
  onExport?: (options: ToolHistoryExportOptions) => void;
  className?: string;
}

export function ToolHistoryExport({ records, onExport, className }: ToolHistoryExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [format, setFormat] = useState<ToolHistoryExportFormat>('json');
  const [includeErrors, setIncludeErrors] = useState(true);
  const [includeInput, setIncludeInput] = useState(true);
  const [includeOutput, setIncludeOutput] = useState(true);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const options: ToolHistoryExportOptions = {
        format,
        includeErrors,
        includeInput,
        includeOutput,
      };

      if (onExport) {
        await onExport(options);
      } else {
        // Default export implementation
        const data = prepareExportData(records, options);
        downloadFile(data, format);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const prepareExportData = (records: ToolCallRecord[], options: ToolHistoryExportOptions): string => {
    const filteredRecords = records.map((record) => {
      const filtered: any = {
        id: record.id,
        toolName: record.toolName,
        displayName: record.displayName,
        timestamp: record.timestamp,
        timestampFormatted: new Date(record.timestamp).toISOString(),
        duration: record.duration,
        status: record.status,
      };

      if (options.includeInput) {
        filtered.input = record.input;
      }

      if (options.includeOutput) {
        filtered.output = record.output;
      }

      if (options.includeErrors && record.error) {
        filtered.error = record.error;
      }

      if (record.conversationId) {
        filtered.conversationId = record.conversationId;
      }

      if (record.messageId) {
        filtered.messageId = record.messageId;
      }

      return filtered;
    });

    if (options.format === 'json') {
      return JSON.stringify(filteredRecords, null, 2);
    } else {
      return convertToCSV(filteredRecords);
    }
  };

  const convertToCSV = (records: any[]): string => {
    if (records.length === 0) return '';

    // CSV headers
    const headers = [
      'ID',
      'Tool Name',
      'Display Name',
      'Timestamp',
      'Duration (ms)',
      'Status',
      ...(includeInput ? ['Input'] : []),
      ...(includeOutput ? ['Output'] : []),
      ...(includeErrors ? ['Error'] : []),
      'Conversation ID',
      'Message ID',
    ];

    const csvRows = [headers.join(',')];

    for (const record of records) {
      const row = [
        `"${record.id}"`,
        `"${record.toolName}"`,
        `"${record.displayName}"`,
        `"${record.timestampFormatted}"`,
        record.duration || '',
        `"${record.status}"`,
        ...(includeInput ? [`"${JSON.stringify(record.input).replace(/"/g, '""')}"`] : []),
        ...(includeOutput ? [`"${JSON.stringify(record.output).replace(/"/g, '""')}"`] : []),
        ...(includeErrors ? [`"${record.error ? JSON.stringify(record.error).replace(/"/g, '""') : ''}"`] : []),
        `"${record.conversationId || ''}"`,
        `"${record.messageId || ''}"`,
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  };

  const downloadFile = (data: string, format: ToolHistoryExportFormat) => {
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tool-history-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Export History</h3>
      </div>

      {/* Format Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Format</label>
        <div className="flex gap-2">
          <button
            onClick={() => setFormat('json')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
              format === 'json'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
            )}
          >
            <FileJson className="h-4 w-4" />
            JSON
          </button>
          <button
            onClick={() => setFormat('csv')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
              format === 'csv'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
            )}
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div className="mb-4 space-y-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Include</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeInput}
              onChange={(e) => setIncludeInput(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Input parameters</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeOutput}
              onChange={(e) => setIncludeOutput(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Output results</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeErrors}
              onChange={(e) => setIncludeErrors(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Error details</span>
          </label>
        </div>
      </div>

      {/* Export Summary */}
      <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
        <p>
          Ready to export <strong>{records.length}</strong> record{records.length !== 1 ? 's' : ''} as{' '}
          <strong>{format.toUpperCase()}</strong>
        </p>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || records.length === 0}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
          exportSuccess
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed'
        )}
      >
        {exportSuccess ? (
          <>
            <Check className="h-4 w-4" />
            Exported Successfully
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </>
        )}
      </button>

      {records.length === 0 && (
        <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">No records to export</p>
      )}
    </div>
  );
}

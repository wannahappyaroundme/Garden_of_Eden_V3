/**
 * ToolPrivacyInfo Component (v3.7.0 Phase 2)
 * Privacy information display for tools
 */

import { Shield, AlertTriangle, Info } from 'lucide-react';
import { TOOL_PRIVACY_INFO } from '../../../shared/types/tool-settings.types';
import { cn } from '../../lib/utils';

export interface ToolPrivacyInfoProps {
  toolName: string;
  className?: string;
}

export function ToolPrivacyInfo({ toolName, className }: ToolPrivacyInfoProps) {
  const privacyInfo = TOOL_PRIVACY_INFO[toolName];

  if (!privacyInfo) {
    return null;
  }

  const getPrivacyIcon = () => {
    switch (privacyInfo.privacyLevel) {
      case 'low':
        return <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
  };

  const getPrivacyLevelColor = () => {
    switch (privacyInfo.privacyLevel) {
      case 'low':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'high':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }
  };

  const getPrivacyLevelText = () => {
    switch (privacyInfo.privacyLevel) {
      case 'low':
        return 'Low Privacy Risk';
      case 'medium':
        return 'Medium Privacy Risk';
      case 'high':
        return 'High Privacy Risk';
    }
  };

  return (
    <div className={cn('p-4 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {getPrivacyIcon()}
        <div>
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {privacyInfo.displayName}
          </h3>
          <span
            className={cn(
              'inline-block px-2 py-0.5 text-xs rounded-full border mt-1',
              getPrivacyLevelColor()
            )}
          >
            {getPrivacyLevelText()}
          </span>
        </div>
      </div>

      {/* Data Access List */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
          This tool can access:
        </p>
        <ul className="space-y-1.5">
          {privacyInfo.dataAccess.map((access, index) => (
            <li key={index} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>{access}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Permission Notice */}
      {privacyInfo.requiresPermission && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ⚠️ This tool requires explicit user permission before it can be used.
          </p>
        </div>
      )}
    </div>
  );
}

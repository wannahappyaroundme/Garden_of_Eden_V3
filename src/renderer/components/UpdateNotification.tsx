/**
 * Update Notification Component (v3.4.0)
 * Displays update availability and download progress
 */

import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { X, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface UpdateCheckResult {
  available: boolean;
  current_version: string;
  latest_version: string | null;
  release_notes: string | null;
  download_url: string | null;
}

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'ready'
  | 'error'
  | 'no-update';

interface UpdateNotificationProps {
  checkOnMount?: boolean;
  autoCheckInterval?: number; // in minutes
}

export function UpdateNotification({
  checkOnMount = false,
  autoCheckInterval = 60, // Check every hour by default
}: UpdateNotificationProps) {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Check for updates on mount if enabled
  useEffect(() => {
    if (checkOnMount) {
      checkForUpdates();
    }

    // Set up auto-check interval
    const intervalId = setInterval(() => {
      if (status === 'idle' || status === 'no-update') {
        checkForUpdates();
      }
    }, autoCheckInterval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [checkOnMount, autoCheckInterval]);

  // Listen for download progress events
  useEffect(() => {
    const unlistenProgress = listen<number>('updater://download-progress', (event) => {
      console.log('Download progress:', event.payload);
      setDownloadProgress(event.payload);
    });

    const unlistenInstalling = listen('updater://installing', () => {
      console.log('Installing update...');
      setStatus('installing');
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenInstalling.then((fn) => fn());
    };
  }, []);

  const checkForUpdates = async () => {
    setStatus('checking');
    setErrorMessage(null);
    setIsVisible(true);

    try {
      const result = await invoke<UpdateCheckResult>('updater_check_for_updates');
      setUpdateInfo(result);

      if (result.available) {
        setStatus('available');
      } else {
        setStatus('no-update');
        // Auto-hide if no update available
        setTimeout(() => setIsVisible(false), 3000);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setErrorMessage(error as string);
      setStatus('error');
      setTimeout(() => setIsVisible(false), 5000);
    }
  };

  const installUpdate = async () => {
    setStatus('downloading');
    setDownloadProgress(0);
    setErrorMessage(null);

    try {
      await invoke('updater_install_update');
      setStatus('ready');
      // The app will restart automatically after successful installation
    } catch (error) {
      console.error('Failed to install update:', error);
      setErrorMessage(error as string);
      setStatus('error');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setStatus('idle');
      setUpdateInfo(null);
      setErrorMessage(null);
    }, 300);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'available':
        return <Download className="w-5 h-5 text-green-500" />;
      case 'downloading':
        return <Download className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'installing':
        return <RefreshCw className="w-5 h-5 text-purple-500 animate-spin" />;
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'no-update':
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Checking for updates...';
      case 'available':
        return `Update available: v${updateInfo?.latest_version}`;
      case 'downloading':
        return `Downloading update... ${downloadProgress.toFixed(1)}%`;
      case 'installing':
        return 'Installing update...';
      case 'ready':
        return 'Update installed! App will restart.';
      case 'error':
        return errorMessage || 'Failed to update';
      case 'no-update':
        return 'You are up to date!';
      default:
        return '';
    }
  };

  if (!isVisible || status === 'idle') return null;

  return (
    <div
      className={cn(
        'fixed top-20 right-4 z-50 w-96 transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-2xl backdrop-blur-sm p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-sm">
                {status === 'available' ? 'Update Available' : 'App Updater'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Current: v{updateInfo?.current_version || '3.3.1'}
              </p>
            </div>
          </div>
          {status !== 'downloading' && status !== 'installing' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Status Message */}
        <div className="mb-3">
          <p className="text-sm leading-relaxed">{getStatusMessage()}</p>
        </div>

        {/* Download Progress */}
        {(status === 'downloading' || status === 'installing') && (
          <div className="mb-4">
            <Progress value={status === 'installing' ? 100 : downloadProgress} />
          </div>
        )}

        {/* Release Notes */}
        {status === 'available' && updateInfo?.release_notes && (
          <div className="mb-4 p-3 bg-muted/50 rounded text-xs max-h-32 overflow-y-auto">
            <h4 className="font-semibold mb-2">Release Notes:</h4>
            <div className="whitespace-pre-wrap">{updateInfo.release_notes}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {status === 'available' && (
            <>
              <Button
                size="sm"
                onClick={installUpdate}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Install Update
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="flex-1"
              >
                Later
              </Button>
            </>
          )}

          {status === 'no-update' && (
            <Button
              variant="outline"
              size="sm"
              onClick={checkForUpdates}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          )}

          {status === 'error' && (
            <Button
              variant="outline"
              size="sm"
              onClick={checkForUpdates}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}

          {status === 'ready' && (
            <Button
              size="sm"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restart Now
            </Button>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to manage update notifications
 */
export function useUpdateNotifications() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);

  const checkForUpdates = async () => {
    try {
      const result = await invoke<UpdateCheckResult>('updater_check_for_updates');
      setUpdateInfo(result);
      setHasUpdate(result.available);
      return result;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  };

  const installUpdate = async () => {
    try {
      await invoke('updater_install_update');
      return true;
    } catch (error) {
      console.error('Failed to install update:', error);
      return false;
    }
  };

  return {
    hasUpdate,
    updateInfo,
    checkForUpdates,
    installUpdate,
  };
}

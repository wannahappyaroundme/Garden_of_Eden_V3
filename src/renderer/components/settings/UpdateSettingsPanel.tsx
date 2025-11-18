/**
 * Update Settings Panel Component (v3.4.0)
 * Configure auto-update behavior and check for updates manually
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { RefreshCw, Download, CheckCircle, Info } from 'lucide-react';
import { toast } from '../../stores/toast.store';

interface UpdateCheckResult {
  available: boolean;
  current_version: string;
  latest_version: string | null;
  release_notes: string | null;
  download_url: string | null;
}

export function UpdateSettingsPanel() {
  const [currentVersion, setCurrentVersion] = useState('3.4.0');
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<number | null>(null);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);
  const [checkInterval, setCheckInterval] = useState(60); // minutes

  useEffect(() => {
    loadCurrentVersion();
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const version = await invoke<string>('updater_get_version');
      setCurrentVersion(version);
    } catch (error) {
      console.error('Failed to get current version:', error);
    }
  };

  const checkForUpdates = async () => {
    setIsChecking(true);
    setUpdateInfo(null);

    try {
      const result = await invoke<UpdateCheckResult>('updater_check_for_updates');
      setUpdateInfo(result);
      setLastCheckTime(Date.now());

      if (result.available) {
        toast.success(
          'Update Available',
          `Version ${result.latest_version} is ready to install`
        );
      } else {
        toast.info('No Updates', 'You are running the latest version');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      toast.error('Update Check Failed', error as string);
    } finally {
      setIsChecking(false);
    }
  };

  const installUpdate = async () => {
    if (!updateInfo?.available) return;

    try {
      await invoke('updater_install_update');
      toast.success('Update Installing', 'App will restart when complete');
    } catch (error) {
      console.error('Failed to install update:', error);
      toast.error('Update Failed', error as string);
    }
  };

  const formatLastCheckTime = () => {
    if (!lastCheckTime) return 'Never';

    const diff = Date.now() - lastCheckTime;
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Current Version */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">App Version</h3>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Garden of Eden V3</div>
              <div className="text-sm text-muted-foreground">
                Version {currentVersion}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={checkForUpdates}
                disabled={isChecking}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Checking...' : 'Check for Updates'}
              </Button>
              {updateInfo?.available && (
                <Button
                  size="sm"
                  onClick={installUpdate}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install Update
                </Button>
              )}
            </div>
          </div>

          {lastCheckTime && (
            <div className="mt-2 text-xs text-muted-foreground">
              Last checked: {formatLastCheckTime()}
            </div>
          )}
        </div>
      </div>

      {/* Update Status */}
      {updateInfo && (
        <div className={`p-4 rounded-lg border ${
          updateInfo.available
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-start gap-3">
            {updateInfo.available ? (
              <Download className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-semibold mb-1">
                {updateInfo.available
                  ? `Update Available: v${updateInfo.latest_version}`
                  : 'You are up to date!'}
              </div>
              <div className="text-sm">
                {updateInfo.available
                  ? `A new version is available. Current: v${updateInfo.current_version} → Latest: v${updateInfo.latest_version}`
                  : `You are running the latest version (v${updateInfo.current_version})`}
              </div>

              {updateInfo.release_notes && updateInfo.available && (
                <div className="mt-3 p-3 bg-white dark:bg-black/20 rounded border border-green-200 dark:border-green-800">
                  <div className="text-sm font-semibold mb-2">Release Notes:</div>
                  <div className="text-sm whitespace-pre-wrap">
                    {updateInfo.release_notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-Update Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Auto-Update Settings</h3>

        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable Auto-Check</div>
              <div className="text-sm text-muted-foreground">
                Automatically check for updates on app startup
              </div>
            </div>
            <Switch
              checked={autoCheckEnabled}
              onCheckedChange={setAutoCheckEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Check Interval</div>
              <div className="text-sm text-muted-foreground">
                How often to check for updates (currently: {checkInterval} minutes)
              </div>
            </div>
            <select
              value={checkInterval}
              onChange={(e) => setCheckInterval(Number(e.target.value))}
              disabled={!autoCheckEnabled}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
              <option value={480}>8 hours</option>
              <option value={1440}>24 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Update Information */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">About Updates</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              <li>Updates are downloaded and verified before installation</li>
              <li>Your data and settings are preserved during updates</li>
              <li>The app will restart automatically after update</li>
              <li>You can always postpone updates if you're busy</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Update Channel (Future Feature) */}
      <div className="space-y-4 opacity-50 pointer-events-none">
        <h3 className="text-lg font-semibold">Update Channel (Coming Soon)</h3>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Beta Updates</div>
              <div className="text-sm text-muted-foreground">
                Receive pre-release updates with experimental features
              </div>
            </div>
            <Switch disabled />
          </div>
        </div>
      </div>
    </div>
  );
}

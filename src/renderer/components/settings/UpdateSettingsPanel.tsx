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
  const [checkInterval, setCheckInterval] = useState(3600); // seconds (v3.5.0: changed from minutes to seconds)
  const [updateChannel, setUpdateChannel] = useState<'stable' | 'beta'>('stable'); // v3.5.0
  const [showBetaWarning, setShowBetaWarning] = useState(false); // v3.5.0
  const [downloadInBackground, setDownloadInBackground] = useState(false); // v3.5.0
  const [bandwidthLimit, setBandwidthLimit] = useState<number | null>(null); // v3.5.0 (KB/s)

  useEffect(() => {
    loadCurrentVersion();
    loadUpdateChannel(); // v3.5.0
    loadScheduleSettings(); // v3.5.0
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const version = await invoke<string>('updater_get_version');
      setCurrentVersion(version);
    } catch (error) {
      console.error('Failed to get current version:', error);
    }
  };

  // v3.5.0: Load update channel
  const loadUpdateChannel = async () => {
    try {
      const channel = await invoke<string>('updater_get_channel');
      setUpdateChannel(channel as 'stable' | 'beta');
    } catch (error) {
      console.error('Failed to get update channel:', error);
    }
  };

  // v3.5.0: Handle update channel change
  const handleChannelChange = async (newChannel: 'stable' | 'beta') => {
    // Show warning when switching to beta
    if (newChannel === 'beta') {
      setShowBetaWarning(true);
      return;
    }

    // Direct switch back to stable
    try {
      await invoke('updater_set_channel', { channel: newChannel });
      setUpdateChannel(newChannel);
      toast.success('Update Channel Changed', `Now on ${newChannel} channel`);
    } catch (error) {
      console.error('Failed to set update channel:', error);
      toast.error('Channel Change Failed', error as string);
    }
  };

  // v3.5.0: Confirm beta channel switch
  const confirmBetaChannel = async () => {
    try {
      await invoke('updater_set_channel', { channel: 'beta' });
      setUpdateChannel('beta');
      setShowBetaWarning(false);
      toast.success('Beta Channel Enabled', 'You will now receive pre-release updates');
    } catch (error) {
      console.error('Failed to enable beta channel:', error);
      toast.error('Channel Change Failed', error as string);
      setShowBetaWarning(false);
    }
  };

  // v3.5.0: Load schedule settings
  const loadScheduleSettings = async () => {
    try {
      const settings = await invoke<any>('updater_get_schedule_settings');
      setAutoCheckEnabled(settings.auto_check);
      setCheckInterval(settings.check_interval);
      setDownloadInBackground(settings.download_in_background);
      setBandwidthLimit(settings.bandwidth_limit);
      setLastCheckTime(settings.last_check ? settings.last_check * 1000 : null); // Convert to milliseconds
    } catch (error) {
      console.error('Failed to load schedule settings:', error);
    }
  };

  // v3.5.0: Update schedule setting
  const updateScheduleSetting = async (updates: {
    auto_check?: boolean;
    check_interval?: number;
    download_in_background?: boolean;
    bandwidth_limit?: number | null;
  }) => {
    try {
      await invoke('updater_update_schedule_settings', {
        autoCheck: updates.auto_check,
        checkInterval: updates.check_interval,
        downloadInBackground: updates.download_in_background,
        bandwidthLimit: updates.bandwidth_limit,
      });
      toast.success('Settings Updated', 'Update schedule settings saved');
    } catch (error) {
      console.error('Failed to update schedule settings:', error);
      toast.error('Update Failed', error as string);
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

      {/* Auto-Update Settings (v3.5.0: Enhanced) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Update Scheduling</h3>

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
              onCheckedChange={(checked) => {
                setAutoCheckEnabled(checked);
                updateScheduleSetting({ auto_check: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Check Interval</div>
              <div className="text-sm text-muted-foreground">
                How often to check for updates
              </div>
            </div>
            <select
              value={checkInterval}
              onChange={(e) => {
                const interval = Number(e.target.value);
                setCheckInterval(interval);
                updateScheduleSetting({ check_interval: interval });
              }}
              disabled={!autoCheckEnabled}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value={1800}>30 minutes</option>
              <option value={3600}>1 hour</option>
              <option value={7200}>2 hours</option>
              <option value={14400}>4 hours</option>
              <option value={28800}>8 hours</option>
              <option value={86400}>24 hours</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Download in Background</div>
              <div className="text-sm text-muted-foreground">
                Automatically download updates without notification
              </div>
            </div>
            <Switch
              checked={downloadInBackground}
              onCheckedChange={(checked) => {
                setDownloadInBackground(checked);
                updateScheduleSetting({ download_in_background: checked });
              }}
              disabled={!autoCheckEnabled}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Bandwidth Limit</div>
                <div className="text-sm text-muted-foreground">
                  Throttle download speed (KB/s, 0 = unlimited)
                </div>
              </div>
              <input
                type="number"
                min="0"
                max="102400"
                value={bandwidthLimit ?? 0}
                onChange={(e) => {
                  const limit = Number(e.target.value);
                  setBandwidthLimit(limit === 0 ? null : limit);
                }}
                onBlur={() => {
                  updateScheduleSetting({ bandwidth_limit: bandwidthLimit });
                }}
                disabled={!downloadInBackground}
                className="w-24 px-3 py-2 border rounded-md bg-background text-right"
                placeholder="0"
              />
            </div>
            {bandwidthLimit && bandwidthLimit > 0 && (
              <div className="text-xs text-muted-foreground text-right">
                ~{(bandwidthLimit / 1024).toFixed(1)} MB/s
              </div>
            )}
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

      {/* Update Channel (v3.5.0) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Update Channel</h3>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Beta Updates</div>
              <div className="text-sm text-muted-foreground">
                Receive pre-release updates with experimental features
              </div>
              {updateChannel === 'beta' && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full border border-orange-200 dark:border-orange-800">
                  <Info className="w-3 h-3" />
                  Beta channel active
                </div>
              )}
            </div>
            <Switch
              checked={updateChannel === 'beta'}
              onCheckedChange={(checked) => handleChannelChange(checked ? 'beta' : 'stable')}
            />
          </div>
        </div>
      </div>

      {/* Beta Channel Warning Dialog (v3.5.0) */}
      {showBetaWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg">Enable Beta Channel?</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Beta updates may contain experimental features and could be less stable than stable releases.
                </p>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded p-3">
              <div className="text-sm space-y-1">
                <p className="font-medium text-orange-900 dark:text-orange-100">⚠️ Important Notes:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
                  <li>Beta versions may have bugs</li>
                  <li>Features may change without notice</li>
                  <li>Not recommended for production use</li>
                  <li>You can switch back to stable anytime</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBetaWarning(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBetaChannel}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Enable Beta Channel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

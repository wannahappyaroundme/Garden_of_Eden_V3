/**
 * Model Download Component
 * Handles AI model downloads with progress tracking
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, Pause, Play, X, CheckCircle, AlertCircle, HardDrive } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number;
  checksum: string;
  description: string;
}

interface DownloadProgress {
  modelId: string;
  downloaded: number;
  total: number;
  percent: number;
  speed: number;
  eta: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
}

interface DownloadStatus {
  overall: {
    downloaded: number;
    total: number;
    percent: number;
    speed: number;
    eta: number;
  };
  models: Record<string, DownloadProgress>;
}

interface DiskSpace {
  available: number;
  required: number;
  sufficient: boolean;
}

export function ModelDownload({ onComplete }: { onComplete?: () => void }) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(null);
  const [diskSpace, setDiskSpace] = useState<DiskSpace | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available models on mount
  useEffect(() => {
    loadModels();
    checkDiskSpace();
    checkDownloadedModels();
  }, []);

  // Listen for download progress
  useEffect(() => {
    const cleanup = window.api.onDownloadProgress((status: DownloadStatus) => {
      setDownloadStatus(status);

      // Check if all downloads completed
      const allCompleted = Object.values(status.models).every(
        (m) => m.status === 'completed'
      );

      if (allCompleted && Object.keys(status.models).length > 0) {
        setIsDownloading(false);
        checkDownloadedModels();
        if (onComplete) {
          onComplete();
        }
      }
    });

    return cleanup;
  }, [onComplete]);

  const loadModels = async () => {
    try {
      const availableModels = (await window.api.downloadGetModels()) as ModelInfo[];
      setModels(availableModels);
    } catch (err) {
      setError('Failed to load available models');
      console.error(err);
    }
  };

  const checkDownloadedModels = async () => {
    try {
      const downloaded = (await window.api.downloadGetDownloaded()) as string[];
      setDownloadedModels(downloaded);
    } catch (err) {
      console.error('Failed to check downloaded models:', err);
    }
  };

  const checkDiskSpace = async () => {
    try {
      const space = (await window.api.downloadGetDiskSpace()) as DiskSpace;
      setDiskSpace(space);
    } catch (err) {
      console.error('Failed to check disk space:', err);
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const result = (await window.api.downloadAllModels()) as { success: boolean; error?: string };
      if (!result.success) {
        setError(result.error || 'Download failed');
        setIsDownloading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = async (modelId: string) => {
    setError(null);

    try {
      const result = (await window.api.downloadModel(modelId)) as { success: boolean; error?: string };
      if (!result.success) {
        setError(result.error || 'Download failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handlePause = async (modelId: string) => {
    try {
      await window.api.downloadPause(modelId);
    } catch (err) {
      console.error('Failed to pause download:', err);
    }
  };

  const handleResume = async (modelId: string) => {
    try {
      await window.api.downloadResume(modelId);
    } catch (err) {
      console.error('Failed to resume download:', err);
    }
  };

  const handleCancel = async (modelId: string) => {
    try {
      await window.api.downloadCancel(modelId);
      setDownloadStatus(null);
    } catch (err) {
      console.error('Failed to cancel download:', err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const formatEta = (seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) return 'Calculating...';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const allModelsDownloaded = models.length > 0 && downloadedModels.length === models.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">AI Models Download</h2>
        <p className="text-muted-foreground">
          Download the required AI models (~12GB) to enable Garden of Eden's features.
        </p>
      </div>

      {/* Disk Space Warning */}
      {diskSpace && !diskSpace.sufficient && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <AlertCircle className="h-5 w-5" />
              Insufficient Disk Space
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Required: {formatBytes(diskSpace.required)} | Available: {formatBytes(diskSpace.available)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Overall Progress */}
      {downloadStatus && downloadStatus.overall.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>
              {formatBytes(downloadStatus.overall.downloaded)} / {formatBytes(downloadStatus.overall.total)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={downloadStatus.overall.percent} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{downloadStatus.overall.percent.toFixed(1)}%</span>
              <span>{formatSpeed(downloadStatus.overall.speed)}</span>
              <span>ETA: {formatEta(downloadStatus.overall.eta)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download All Button */}
      {!allModelsDownloaded && !isDownloading && (
        <Button
          onClick={handleDownloadAll}
          size="lg"
          className="w-full"
          disabled={diskSpace ? !diskSpace.sufficient : false}
        >
          <Download className="mr-2 h-5 w-5" />
          Download All Models ({formatBytes(models.reduce((sum, m) => sum + m.size, 0))})
        </Button>
      )}

      {/* Success Message */}
      {allModelsDownloaded && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              All Models Downloaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 dark:text-green-300">
              All AI models are ready. You can now use Garden of Eden!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Individual Models */}
      <div className="space-y-4">
        {models.map((model) => {
          const isDownloaded = downloadedModels.includes(model.id);
          const progress = downloadStatus?.models[model.id];

          return (
            <Card key={model.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {model.name}
                      {isDownloaded && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription>{model.description}</CardDescription>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {formatBytes(model.size)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {progress && progress.status !== 'completed' && (
                  <>
                    <Progress value={progress.percent} />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{progress.percent.toFixed(1)}%</span>
                      <span>{formatSpeed(progress.speed)}</span>
                      <span>ETA: {formatEta(progress.eta)}</span>
                    </div>
                    <div className="flex gap-2">
                      {progress.status === 'downloading' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePause(model.id)}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(model.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {progress.status === 'paused' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResume(model.id)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(model.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {progress.status === 'error' && (
                        <div className="text-sm text-red-500">
                          Error: {progress.error}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!isDownloaded && !progress && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadSingle(model.id)}
                    disabled={isDownloading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download {model.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disk Space Info */}
      {diskSpace && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Disk Space
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required:</span>
                <span className="font-medium">{formatBytes(diskSpace.required)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available:</span>
                <span className="font-medium">{formatBytes(diskSpace.available)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

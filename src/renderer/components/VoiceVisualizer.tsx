/**
 * Voice Visualizer Component
 * Animated waveform visualization for voice input
 */

import { useEffect, useState } from 'react';

interface VoiceVisualizerProps {
  isRecording: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function VoiceVisualizer({ isRecording, size = 'md' }: VoiceVisualizerProps) {
  const [bars, setBars] = useState<number[]>([0.2, 0.4, 0.6, 0.4, 0.2]);

  // Animate bars when recording
  useEffect(() => {
    if (!isRecording) {
      setBars([0.2, 0.4, 0.6, 0.4, 0.2]);
      return;
    }

    const interval = setInterval(() => {
      setBars(prev =>
        prev.map(() => 0.2 + Math.random() * 0.8)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  const sizeClasses = {
    sm: {
      container: 'w-12 h-6',
      bar: 'w-1',
      gap: 'gap-0.5',
    },
    md: {
      container: 'w-16 h-8',
      bar: 'w-1.5',
      gap: 'gap-1',
    },
    lg: {
      container: 'w-24 h-12',
      bar: 'w-2',
      gap: 'gap-1.5',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`${classes.container} flex items-center justify-center ${classes.gap}`}
      aria-label={isRecording ? '음성 녹음 중' : '음성 대기 중'}
    >
      {bars.map((height, index) => (
        <div
          key={index}
          className={`${classes.bar} bg-primary rounded-full transition-all duration-100`}
          style={{
            height: `${height * 100}%`,
            opacity: isRecording ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

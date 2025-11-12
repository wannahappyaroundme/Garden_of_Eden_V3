/**
 * Performance Monitoring Hook
 * Track component render times and performance metrics
 */

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

/**
 * Hook to measure component render performance
 */
export function usePerformance(componentName: string, enabled: boolean = process.env.NODE_ENV === 'development') {
  const renderStart = useRef<number>(performance.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart.current;
    renderCount.current += 1;

    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
      timestamp: Date.now(),
    };

    // Log slow renders (> 16ms for 60fps)
    if (renderTime > 16) {
      console.warn(
        `[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
      );
    }

    // Log metrics in development
    if (process.env.NODE_ENV === 'development' && renderTime > 5) {
      console.log(`[Performance] ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    // Reset for next render
    renderStart.current = performance.now();

    return () => {
      // Cleanup if needed
    };
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * Hook to measure async operation performance
 */
export function useAsyncPerformance() {
  const measureAsync = async <T,>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - start;

      console.log(`[Performance] ${operationName}: ${duration.toFixed(2)}ms`);

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(
        `[Performance] ${operationName} failed after ${duration.toFixed(2)}ms:`,
        error
      );
      throw error;
    }
  };

  return { measureAsync };
}

/**
 * Utility to mark performance points
 */
export const performance Monitor = {
  mark: (name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name);
        if (entries.length > 0) {
          const duration = entries[0].duration;
          console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
          return duration;
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    return 0;
  },

  clearMarks: () => {
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
    }
  },

  clearMeasures: () => {
    if (typeof performance !== 'undefined' && performance.clearMeasures) {
      performance.clearMeasures();
    }
  },
};

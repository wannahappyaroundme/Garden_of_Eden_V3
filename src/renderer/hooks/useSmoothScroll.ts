/**
 * Smooth Scroll Hook
 * Provides enhanced smooth scrolling with customizable behavior
 */

import { useEffect, useRef, RefObject } from 'react';

interface UseSmoothScrollOptions {
  /**
   * Dependencies that trigger scroll
   */
  dependencies: unknown[];
  /**
   * Scroll behavior (auto | smooth)
   */
  behavior?: ScrollBehavior;
  /**
   * Delay before scrolling (ms)
   */
  delay?: number;
  /**
   * Whether to scroll on mount
   */
  scrollOnMount?: boolean;
}

/**
 * Hook to automatically scroll to an element when dependencies change
 */
export function useSmoothScroll<T extends HTMLElement>(
  options: UseSmoothScrollOptions
): RefObject<T> {
  const { dependencies, behavior = 'smooth', delay = 0, scrollOnMount = false } = options;
  const elementRef = useRef<T>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Skip scroll on mount if scrollOnMount is false
    if (!scrollOnMount && dependencies.length === 0) {
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule scroll
    timeoutRef.current = setTimeout(() => {
      elementRef.current?.scrollIntoView({
        behavior,
        block: 'end',
        inline: 'nearest',
      });
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);

  return elementRef;
}

/**
 * Hook to scroll a container to bottom
 */
export function useScrollToBottom<T extends HTMLElement>(
  containerRef: RefObject<T>,
  dependencies: unknown[],
  options?: {
    behavior?: ScrollBehavior;
    delay?: number;
  }
) {
  const { behavior = 'smooth', delay = 0 } = options || {};
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule scroll
    timeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior,
        });
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
}

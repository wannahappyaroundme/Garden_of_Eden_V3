/**
 * Hooks Index (v3.5.2)
 *
 * Re-exports all custom hooks for convenient importing.
 */

export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useSmoothScroll } from './useSmoothScroll';
export { usePerformance } from './usePerformance';

// Chat-specific hooks (v3.5.2)
export { useChatState, type Message, type TrackingStatus, type ChatState } from './useChatState';
export { useChatHandlers } from './useChatHandlers';

// Navigation (v3.5.2 - abstraction layer for future React Router migration)
export {
  useNavigation,
  NavigationProvider,
  createNavigationHandler,
  PAGE_ROUTES,
  type PageName,
} from './useNavigation';

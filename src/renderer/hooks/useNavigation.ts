/**
 * Navigation Hook (v3.5.2)
 *
 * Abstraction layer for navigation that can be migrated to React Router later.
 * Currently uses state-based navigation, but provides a clean interface.
 *
 * Future Migration Path:
 * 1. Install react-router-dom
 * 2. Update useNavigation to use useNavigate() and useLocation()
 * 3. Update App.tsx to use BrowserRouter and Routes
 * 4. No changes needed in consuming components
 */

import { useState, useCallback, useMemo, createContext, useContext, type ReactNode } from 'react';

// Available pages in the application
export type PageName = 'onboarding' | 'chat' | 'settings' | 'integrations' | 'memory';

// Navigation state
interface NavigationState {
  currentPage: PageName;
  previousPage: PageName | null;
  history: PageName[];
}

// Navigation context value
interface NavigationContextValue {
  currentPage: PageName;
  previousPage: PageName | null;
  history: PageName[];
  navigate: (page: PageName) => void;
  goBack: () => void;
  canGoBack: boolean;
  isPage: (page: PageName) => boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
  initialPage?: PageName;
}

/**
 * Navigation Provider
 *
 * Wraps the app and provides navigation context.
 * Replace this with BrowserRouter when migrating to React Router.
 */
export function NavigationProvider({ children, initialPage = 'chat' }: NavigationProviderProps) {
  const [state, setState] = useState<NavigationState>({
    currentPage: initialPage,
    previousPage: null,
    history: [initialPage],
  });

  const navigate = useCallback((page: PageName) => {
    setState((prev) => ({
      currentPage: page,
      previousPage: prev.currentPage,
      history: [...prev.history, page],
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.history.length <= 1) return prev;
      const newHistory = prev.history.slice(0, -1);
      const newCurrentPage = newHistory[newHistory.length - 1];
      return {
        currentPage: newCurrentPage,
        previousPage: prev.currentPage,
        history: newHistory,
      };
    });
  }, []);

  const canGoBack = state.history.length > 1;

  const isPage = useCallback(
    (page: PageName) => state.currentPage === page,
    [state.currentPage]
  );

  const value = useMemo(
    () => ({
      currentPage: state.currentPage,
      previousPage: state.previousPage,
      history: state.history,
      navigate,
      goBack,
      canGoBack,
      isPage,
    }),
    [state, navigate, goBack, canGoBack, isPage]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Navigation Hook
 *
 * Use this hook in any component to access navigation.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { navigate, currentPage, goBack } = useNavigation();
 *
 *   return (
 *     <button onClick={() => navigate('settings')}>
 *       Go to Settings
 *     </button>
 *   );
 * }
 * ```
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// Helper functions for common navigation patterns

/**
 * Create a navigation handler for a specific page.
 * Useful for callbacks that don't need the full context.
 */
export function createNavigationHandler(
  navigate: (page: PageName) => void,
  page: PageName
): () => void {
  return () => navigate(page);
}

/**
 * Page route definitions for future React Router migration.
 * These can be converted to Route components.
 */
export const PAGE_ROUTES: Record<PageName, string> = {
  onboarding: '/onboarding',
  chat: '/',
  settings: '/settings',
  integrations: '/integrations',
  memory: '/memory',
};

export default useNavigation;

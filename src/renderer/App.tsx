/**
 * Root App Component (v3.6.0)
 *
 * Performance optimizations:
 * - React.lazy for code splitting and lazy loading
 * - Suspense boundaries for loading states
 * - Only Chat is loaded eagerly (main page)
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { Chat } from './pages/Chat';
import { ErrorBoundary } from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import './i18n/config'; // Initialize i18n

// Lazy load non-critical pages for faster initial load
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Integrations = lazy(() => import('./pages/Integrations').then(m => ({ default: m.Integrations })));
const MemoryVisualization = lazy(() => import('./pages/MemoryVisualization'));
const SmartOnboarding = lazy(() => import('./pages/SmartOnboarding'));
const UpdateNotification = lazy(() => import('./components/UpdateNotification').then(m => ({ default: m.UpdateNotification })));

type Page = 'onboarding' | 'chat' | 'settings' | 'integrations' | 'memory';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const status = await window.api.checkOnboardingStatus();
        console.log('Onboarding status:', status);

        if (!status.completed) {
          setCurrentPage('onboarding');
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // On error, assume onboarding not completed to be safe
        setCurrentPage('onboarding');
      } finally {
        setIsCheckingOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  // Load theme from settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await window.api.getSettings() as { theme: string };
        setTheme(settings.theme as 'light' | 'dark');
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const handleOnboardingComplete = () => {
    setCurrentPage('chat');
  };

  // Reusable loading fallback for lazy components
  const PageLoadingFallback = (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold animate-pulse">
          E
        </div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );

  // Show loading while checking onboarding
  if (isCheckingOnboarding) {
    return PageLoadingFallback;
  }

  return (
    <ErrorBoundary>
      {/* Lazy-loaded pages with Suspense boundaries */}
      {currentPage === 'onboarding' && (
        <Suspense fallback={PageLoadingFallback}>
          <SmartOnboarding onComplete={handleOnboardingComplete} />
        </Suspense>
      )}
      {currentPage === 'chat' && (
        <Chat
          onOpenSettings={() => setCurrentPage('settings')}
          onOpenIntegrations={() => setCurrentPage('integrations')}
          onOpenMemory={() => setCurrentPage('memory')}
        />
      )}
      {currentPage === 'settings' && (
        <Suspense fallback={PageLoadingFallback}>
          <Settings onClose={() => setCurrentPage('chat')} onThemeChange={handleThemeChange} />
        </Suspense>
      )}
      {currentPage === 'integrations' && (
        <Suspense fallback={PageLoadingFallback}>
          <Integrations onClose={() => setCurrentPage('chat')} />
        </Suspense>
      )}
      {currentPage === 'memory' && (
        <Suspense fallback={PageLoadingFallback}>
          <MemoryVisualization onClose={() => setCurrentPage('chat')} />
        </Suspense>
      )}
      <ToastContainer />
      {/* v3.4.0: Auto-update notification - only show after onboarding and in production */}
      {currentPage !== 'onboarding' && import.meta.env.PROD && (
        <Suspense fallback={null}>
          <UpdateNotification
            checkOnMount={true}
            autoCheckInterval={60} // Check every hour
          />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}

export default App;

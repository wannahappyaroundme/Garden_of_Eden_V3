/**
 * Root App Component
 */

import { useState, useEffect } from 'react';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { Integrations } from './pages/Integrations';
import MemoryVisualization from './pages/MemoryVisualization';
import SmartOnboarding from './pages/SmartOnboarding';
import { ErrorBoundary } from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import { UpdateNotification } from './components/UpdateNotification'; // v3.4.0
import './i18n/config'; // Initialize i18n

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

  // Show loading while checking onboarding
  if (isCheckingOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold animate-pulse">
            E
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {currentPage === 'onboarding' && <SmartOnboarding onComplete={handleOnboardingComplete} />}
      {currentPage === 'chat' && (
        <Chat
          onOpenSettings={() => setCurrentPage('settings')}
          onOpenIntegrations={() => setCurrentPage('integrations')}
          onOpenMemory={() => setCurrentPage('memory')}
        />
      )}
      {currentPage === 'settings' && (
        <Settings onClose={() => setCurrentPage('chat')} onThemeChange={handleThemeChange} />
      )}
      {currentPage === 'integrations' && (
        <Integrations onClose={() => setCurrentPage('chat')} />
      )}
      {currentPage === 'memory' && (
        <MemoryVisualization onClose={() => setCurrentPage('chat')} />
      )}
      <ToastContainer />
      {/* v3.4.0: Auto-update notification - only show after onboarding */}
      {currentPage !== 'onboarding' && (
        <UpdateNotification
          checkOnMount={true}
          autoCheckInterval={60} // Check every hour
        />
      )}
    </ErrorBoundary>
  );
}

export default App;

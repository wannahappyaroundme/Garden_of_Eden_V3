/**
 * Root App Component
 */

import { useState, useEffect } from 'react';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';

type Page = 'chat' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  return (
    <ErrorBoundary>
      {currentPage === 'chat' && <Chat onOpenSettings={() => setCurrentPage('settings')} />}
      {currentPage === 'settings' && (
        <Settings onClose={() => setCurrentPage('chat')} onThemeChange={handleThemeChange} />
      )}
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;

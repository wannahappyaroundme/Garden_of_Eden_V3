/**
 * Root App Component
 */

import { useState } from 'react';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';

type Page = 'chat' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('chat');

  return (
    <>
      {currentPage === 'chat' && <Chat onOpenSettings={() => setCurrentPage('settings')} />}
      {currentPage === 'settings' && <Settings onClose={() => setCurrentPage('chat')} />}
    </>
  );
}

export default App;

/**
 * Root App Component
 */

import React, { useState, useEffect } from 'react';

function App() {
  const [platform, setPlatform] = useState<string>('unknown');

  useEffect(() => {
    // Get platform info from preload script
    if (window.api) {
      setPlatform(window.api.platform);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">🌟 Garden of Eden V3</h1>
        <p className="mb-2 text-xl text-gray-300">100% Local AI Assistant</p>
        <p className="text-sm text-gray-500">
          Running on {platform} · Electron {window.api?.versions.electron}
        </p>
        <div className="mt-8 text-gray-400">
          <p>✅ Project structure initialized</p>
          <p>✅ Electron + React + TypeScript configured</p>
          <p>✅ IPC bridge ready</p>
          <p className="mt-4 text-xs">Development mode active</p>
        </div>
      </div>
    </div>
  );
}

export default App;

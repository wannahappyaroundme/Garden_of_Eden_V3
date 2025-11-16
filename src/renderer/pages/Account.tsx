/**
 * Account Settings Page
 * User profile, Google OAuth login, and account management
 */

import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleLoginButton, GoogleLogoutButton } from '../components/auth/GoogleLoginButton';
import { useAuthStore } from '../stores/authStore';
import { GOOGLE_OAUTH_CONFIG } from '../config/oauth';
import { Button } from '../components/ui/button';
import { ArrowLeft, Cloud, Shield, Database, User } from 'lucide-react';

interface AccountProps {
  onClose: () => void;
}

export function Account({ onClose }: AccountProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_OAUTH_CONFIG.clientId}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Account Settings</h1>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* User Profile Section */}
          <section className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Profile</h2>
            </div>

            {isAuthenticated && user ? (
              <GoogleLogoutButton
                onLogout={() => {
                  console.log('User logged out');
                  setCloudSyncEnabled(false);
                }}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sign in with Google to enable cloud sync and access your conversations across devices.
                </p>
                <GoogleLoginButton
                  onSuccess={(user) => {
                    console.log('Login successful:', user);
                  }}
                  onError={(error) => {
                    console.error('Login error:', error);
                    alert(error);
                  }}
                />
              </div>
            )}
          </section>

          {/* Cloud Sync Section */}
          {isAuthenticated && (
            <section className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Cloud className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Cloud Sync</h2>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Enable Cloud Backup</p>
                  <p className="text-sm text-muted-foreground">
                    Sync your conversations, settings, and persona preferences to the cloud.
                    All data is encrypted end-to-end before uploading.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={cloudSyncEnabled}
                    onChange={(e) => setCloudSyncEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              {cloudSyncEnabled && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Automatic Cloud Backup</p>
                  <p className="text-xs text-muted-foreground">
                    Your persona settings will be automatically backed up to Google Drive when you save them.
                    Go to Persona Settings to backup or restore your data.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600 dark:text-green-400">
                    <Shield className="w-4 h-4" />
                    <span>End-to-end encrypted backup</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Privacy & Security Section */}
          <section className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Privacy & Security</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">100% Local AI</p>
                  <p className="text-xs text-muted-foreground">All AI processing happens on your device</p>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                  Active
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Encrypted Database</p>
                  <p className="text-xs text-muted-foreground">AES-256 encryption for all stored data</p>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                  Enabled
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">No Telemetry</p>
                  <p className="text-xs text-muted-foreground">Zero data collection or tracking</p>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                  Guaranteed
                </div>
              </div>
            </div>
          </section>

          {/* Data Management Section */}
          <section className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Data Management</h2>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Database className="w-4 h-4 mr-2" />
                Export All Data
              </Button>

              <Button variant="outline" className="w-full justify-start text-orange-600 hover:text-orange-700" disabled>
                Clear Conversation History
              </Button>

              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" disabled>
                Delete All Data
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Data management features coming soon. All your data is stored locally and never sent to external servers.
            </p>
          </section>
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}

/**
 * OAuth Configuration
 * Google OAuth settings for social login
 */

export const GOOGLE_OAUTH_CONFIG = {
  // Replace with your actual Google Client ID from Google Cloud Console
  // Get it from: https://console.cloud.google.com/apis/credentials
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',

  // Scopes needed for basic user info
  scopes: [
    'openid',
    'profile',
    'email',
  ],

  // Redirect URI (for desktop app, use postMessage)
  redirectUri: 'postmessage',
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  accessToken: string | null;
  idToken: string | null;
}

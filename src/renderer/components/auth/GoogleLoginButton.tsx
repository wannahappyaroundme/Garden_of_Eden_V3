/**
 * Google Login Button Component
 * Handles Google OAuth authentication flow
 */

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '../../stores/authStore';
import type { GoogleUser } from '../../config/oauth';

interface GoogleLoginButtonProps {
  onSuccess?: (user: GoogleUser) => void;
  onError?: (error: string) => void;
}

interface GoogleJWT {
  sub: string; // User ID
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const { login } = useAuthStore();

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received');
      }

      // Decode JWT token to get user info
      const decoded = jwtDecode<GoogleJWT>(credentialResponse.credential);

      const user: GoogleUser = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        verified_email: decoded.email_verified,
      };

      // Store in auth store
      login(user, credentialResponse.credential, credentialResponse.credential);

      console.log('Google login successful:', user);

      // Call success callback
      onSuccess?.(user);
    } catch (error) {
      console.error('Failed to decode Google credential:', error);
      onError?.('Failed to process login credentials');
    }
  };

  const handleError = () => {
    console.error('Google login failed');
    onError?.('Google login failed. Please try again.');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="filled_blue"
        size="large"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}

/**
 * Google Logout Button Component
 */
export function GoogleLogoutButton({ onLogout }: { onLogout?: () => void }) {
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      {user.picture && (
        <img
          src={user.picture}
          alt={user.name}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div className="flex-1">
        <p className="font-medium text-sm">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

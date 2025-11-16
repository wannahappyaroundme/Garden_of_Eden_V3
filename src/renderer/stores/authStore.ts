/**
 * Authentication Store
 * Manages Google OAuth authentication state using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, GoogleUser } from '../config/oauth';

interface AuthStore extends AuthState {
  login: (user: GoogleUser, accessToken: string, idToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<GoogleUser>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      accessToken: null,
      idToken: null,

      // Login action
      login: (user, accessToken, idToken) => {
        set({
          isAuthenticated: true,
          user,
          accessToken,
          idToken,
        });
      },

      // Logout action
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          idToken: null,
        });
      },

      // Update user info
      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // Don't persist tokens for security (will need to re-login)
      }),
    }
  )
);

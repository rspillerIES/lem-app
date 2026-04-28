import { create } from 'zustand';
import { AuthPayload } from '../types';

interface AuthStore {
  // State
  token: string | null;
  user: AuthPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (token: string, user: AuthPayload) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  restoreFromStorage: () => void;
}

const STORAGE_KEY = 'lem_app_token';
const USER_STORAGE_KEY = 'lem_app_user';

export const useAuth = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: (token: string, user: AuthPayload) => {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  restoreFromStorage: () => {
    const token = localStorage.getItem(STORAGE_KEY);
    const userJson = localStorage.getItem(USER_STORAGE_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({
          token,
          user,
          isAuthenticated: true,
        });
      } catch (err) {
        console.error('Failed to restore auth from storage:', err);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  },
}));

import { create } from 'zustand';
import { FirebaseUser, signInAnon, subscribeToAuthState } from '../lib/firebase';

interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  signIn: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: () => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthState((user) => {
      set({ user, isInitialized: true, isLoading: false });

      // Auto sign in anonymously if no user
      if (!user && !get().isLoading) {
        get().signIn();
      }
    });

    return unsubscribe;
  },

  signIn: async () => {
    set({ isLoading: true, error: null });

    try {
      const user = await signInAnon();
      set({ user, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

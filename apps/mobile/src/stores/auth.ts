import { create } from "zustand";
import { initAuth, signOut as authSignOut } from "../lib/firebase";

interface User {
  uid: string;
  isAnonymous: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;

  // Actions
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAnonymous: true,

  initialize: async () => {
    set({ isLoading: true });

    const user = await initAuth();

    set({
      user,
      isAuthenticated: !!user,
      isAnonymous: user?.isAnonymous ?? true,
      isLoading: false,
    });
  },

  signOut: async () => {
    await authSignOut();
    set({
      user: null,
      isAuthenticated: false,
      isAnonymous: true,
    });
  },
}));

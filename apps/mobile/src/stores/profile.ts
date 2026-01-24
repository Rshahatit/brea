import { create } from "zustand";
import type { UserProfile, MatchResult } from "@brea/shared";
import { api } from "../lib/api";

interface ProfileState {
  profile: UserProfile | null;
  matches: MatchResult[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  runArena: (targetPersonaId?: string) => Promise<MatchResult | null>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  matches: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.getMe();
      set({
        profile: response.user as unknown as UserProfile,
        matches: response.matches as unknown as MatchResult[],
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch profile",
        isLoading: false,
      });
    }
  },

  runArena: async (targetPersonaId?: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.runArena(targetPersonaId);
      const match = response.result as unknown as MatchResult;

      set((state) => ({
        matches: [match, ...state.matches],
        isLoading: false,
      }));

      return match;
    } catch (error) {
      console.error("Failed to run arena:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to run simulation",
        isLoading: false,
      });
      return null;
    }
  },
}));

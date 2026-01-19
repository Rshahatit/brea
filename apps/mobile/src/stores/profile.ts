import { create } from 'zustand';
import type { User, MatchResult, ProfileData } from '../types';
import * as api from '../lib/api';

interface ProfileState {
  user: User | null;
  matches: MatchResult[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  fetchMatches: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  confirmHypothesis: (claim: string, confirmed: boolean) => Promise<void>;
  runArena: (targetPersonaId?: string) => Promise<MatchResult | null>;
  submitConsent: (matchId: string, action: 'APPROVE' | 'REJECT') => Promise<string | null>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  user: null,
  matches: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });

    try {
      const user = await api.getMe();
      set({ user, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      set({ error: message, isLoading: false });
    }
  },

  fetchMatches: async () => {
    set({ isLoading: true, error: null });

    try {
      const { matches } = await api.getMatches();
      set({ matches, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch matches';
      set({ error: message, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const { profile } = await api.updateProfile(data);
      const currentUser = get().user;

      if (currentUser) {
        set({
          user: { ...currentUser, profile },
          isLoading: false,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      set({ error: message, isLoading: false });
    }
  },

  confirmHypothesis: async (claim, confirmed) => {
    try {
      await api.confirmHypothesis(claim, confirmed);
      // Refresh profile to get updated hypotheses
      await get().fetchProfile();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm hypothesis';
      set({ error: message });
    }
  },

  runArena: async (targetPersonaId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.runArena(targetPersonaId);

      const newMatch: MatchResult = {
        id: response.matchId,
        compatibilityScore: response.result.compatibilityScore,
        confidenceLevel: response.result.confidenceLevel,
        whyMatched: response.result.whyMatched,
        potentialFriction: response.result.potentialFriction,
        unknowns: response.result.unknowns,
        transcript: response.result.transcript,
        status: 'PENDING',
        matchedWith: {
          displayName: response.targetPersona.displayName,
          photoUrl: response.targetPersona.photoUrl,
        },
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        matches: [newMatch, ...state.matches],
        isLoading: false,
      }));

      return newMatch;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run arena';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  submitConsent: async (matchId, action) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.submitConsent(matchId, action);

      // Update match in state
      set((state) => ({
        matches: state.matches.map((m) =>
          m.id === matchId
            ? {
                ...m,
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                consent: {
                  action,
                  inviteLink: response.inviteLink,
                },
              }
            : m
        ),
        isLoading: false,
      }));

      return response.inviteLink || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit consent';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));

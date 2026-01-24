/**
 * Brea Store
 *
 * Global state management for the Brea voice session.
 * Handles session state, intelligence chips, and transcriptions.
 */

import { create } from "zustand";
import type {
  SessionState,
  IntelligenceUpdate,
  TranscriptionData,
} from "@brea/shared";

interface BreaState {
  // Session state
  sessionState: SessionState;
  isConnected: boolean;

  // Real-time data
  intelligenceChips: IntelligenceUpdate[];
  transcriptions: TranscriptionData[];

  // Actions
  setSessionState: (state: SessionState) => void;
  setConnected: (connected: boolean) => void;
  addIntelligenceChip: (chip: IntelligenceUpdate) => void;
  addTranscription: (transcription: TranscriptionData) => void;
  clearChips: () => void;
  clearTranscriptions: () => void;
  reset: () => void;
}

export const useBreaStore = create<BreaState>((set) => ({
  // Initial state
  sessionState: "idle",
  isConnected: false,
  intelligenceChips: [],
  transcriptions: [],

  // Session state management
  setSessionState: (state: SessionState) => {
    set({ sessionState: state });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  // Intelligence chips - what Brea learns during conversation
  addIntelligenceChip: (chip: IntelligenceUpdate) => {
    set((state) => {
      // Avoid duplicate chips
      const exists = state.intelligenceChips.some(
        (c) => c.type === chip.type && c.value === chip.value
      );
      if (exists) return state;

      return {
        intelligenceChips: [...state.intelligenceChips, chip],
      };
    });
  },

  // Transcriptions for accessibility and debugging
  addTranscription: (transcription: TranscriptionData) => {
    set((state) => ({
      transcriptions: [...state.transcriptions, transcription],
    }));
  },

  // Clear intelligence chips (e.g., on new session)
  clearChips: () => {
    set({ intelligenceChips: [] });
  },

  // Clear transcriptions
  clearTranscriptions: () => {
    set({ transcriptions: [] });
  },

  // Reset all state
  reset: () => {
    set({
      sessionState: "idle",
      isConnected: false,
      intelligenceChips: [],
      transcriptions: [],
    });
  },
}));

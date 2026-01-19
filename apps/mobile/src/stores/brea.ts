import { create } from 'zustand';
import type { IntelligenceChip } from '../types';

export type SessionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

interface BreaMssageBase {
  id: string;
  timestamp: number;
}

interface UserMessage extends BreaMssageBase {
  type: 'user';
  transcription: string;
}

interface BreaPMessageBase extends BreaMssageBase {
  type: 'brea';
  transcription: string;
  chips: IntelligenceChip[];
}

type BreaMessage = UserMessage | BreaPMessageBase;

interface BreastState {
  // Session state
  sessionId: string | null;
  status: SessionStatus;
  error: string | null;

  // Conversation state
  messages: BreaMessage[];
  currentTranscription: string;
  chips: IntelligenceChip[];

  // Audio state
  isRecording: boolean;
  isMuted: boolean;

  // Actions
  setStatus: (status: SessionStatus) => void;
  setSessionId: (sessionId: string | null) => void;
  setError: (error: string | null) => void;

  addUserMessage: (transcription: string) => void;
  addBreaPMessage: (transcription: string, chips: IntelligenceChip[]) => void;
  updateCurrentTranscription: (text: string) => void;
  clearCurrentTranscription: () => void;

  addChips: (newChips: IntelligenceChip[]) => void;

  setIsRecording: (isRecording: boolean) => void;
  setIsMuted: (isMuted: boolean) => void;

  reset: () => void;
}

const initialState = {
  sessionId: null,
  status: 'idle' as SessionStatus,
  error: null,
  messages: [],
  currentTranscription: '',
  chips: [],
  isRecording: false,
  isMuted: false,
};

export const useBreaPStore = create<BreastState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setSessionId: (sessionId) => set({ sessionId }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),

  addUserMessage: (transcription) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `user-${Date.now()}`,
          type: 'user',
          transcription,
          timestamp: Date.now(),
        },
      ],
    })),

  addBreaPMessage: (transcription, chips) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `brea-${Date.now()}`,
          type: 'brea',
          transcription,
          chips,
          timestamp: Date.now(),
        },
      ],
    })),

  updateCurrentTranscription: (text) =>
    set((state) => ({
      currentTranscription: state.currentTranscription + text,
    })),

  clearCurrentTranscription: () => set({ currentTranscription: '' }),

  addChips: (newChips) =>
    set((state) => ({
      chips: [
        ...state.chips,
        ...newChips.filter(
          (newChip) =>
            !state.chips.some(
              (existing) =>
                existing.type === newChip.type && existing.label === newChip.label
            )
        ),
      ],
    })),

  setIsRecording: (isRecording) => set({ isRecording }),
  setIsMuted: (isMuted) => set({ isMuted }),

  reset: () => set(initialState),
}));

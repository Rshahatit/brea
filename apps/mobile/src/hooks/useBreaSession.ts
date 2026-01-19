import { useCallback, useEffect, useRef } from 'react';
import {
  connectSocket,
  disconnectSocket,
  startSession,
  endSession,
  isSocketConnected,
} from '../lib/socket';
import { useBreaPStore } from '../stores/brea';
import { useAudio } from './useAudio';

export function useBreaSession() {
  const {
    status,
    sessionId,
    chips,
    currentTranscription,
    setStatus,
    setSessionId,
    setError,
    addChips,
    updateCurrentTranscription,
    clearCurrentTranscription,
    addBreaPMessage,
    reset,
  } = useBreaPStore();

  const { playAudioChunk, startRecording, stopRecording, isRecording, hasPermission, requestPermission } =
    useAudio();

  const accumulatedTranscription = useRef('');
  const accumulatedChips = useRef<typeof chips>([]);

  // Connect to socket and set up event handlers
  const connect = useCallback(async () => {
    if (isSocketConnected() || status === 'connecting' || status === 'connected') {
      return;
    }

    setStatus('connecting');

    try {
      await connectSocket({
        onConnect: () => {
          console.log('[BreaSession] Socket connected');
        },
        onDisconnect: () => {
          console.log('[BreaSession] Socket disconnected');
          setStatus('idle');
          setSessionId(null);
        },
        onAudioChunk: (data) => {
          setStatus('speaking');
          playAudioChunk(data);
        },
        onTranscription: (text, isFinal) => {
          if (isFinal) {
            // Store final transcription for message
            accumulatedTranscription.current += text;
            addBreaPMessage(accumulatedTranscription.current, accumulatedChips.current);
            accumulatedTranscription.current = '';
            accumulatedChips.current = [];
            clearCurrentTranscription();
          } else {
            updateCurrentTranscription(text);
          }
        },
        onIntelligenceUpdate: (newChips) => {
          accumulatedChips.current.push(...newChips);
          addChips(newChips);
        },
        onSessionStart: (newSessionId) => {
          setSessionId(newSessionId);
          setStatus('connected');
          console.log('[BreaSession] Session started:', newSessionId);
        },
        onSessionEnd: (reason) => {
          console.log('[BreaSession] Session ended:', reason);
          setStatus('idle');
          setSessionId(null);
        },
        onError: (code, message) => {
          console.error('[BreaSession] Error:', code, message);
          setError(message);
        },
      });

      // Start the voice session
      await startSession();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      setError(message);
    }
  }, [
    status,
    setStatus,
    setSessionId,
    setError,
    addChips,
    updateCurrentTranscription,
    clearCurrentTranscription,
    addBreaPMessage,
    playAudioChunk,
  ]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    endSession();
    disconnectSocket();
    reset();
  }, [reset]);

  // Start push-to-talk
  const startTalking = useCallback(async () => {
    if (status !== 'connected' && status !== 'speaking') {
      console.warn('[BreaSession] Cannot start talking - not connected');
      return;
    }

    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        setError('Microphone permission is required');
        return;
      }
    }

    setStatus('listening');
    await startRecording();
  }, [status, hasPermission, requestPermission, setStatus, setError, startRecording]);

  // Stop push-to-talk
  const stopTalking = useCallback(async () => {
    if (!isRecording) return;

    setStatus('processing');
    await stopRecording();
  }, [isRecording, setStatus, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    status,
    sessionId,
    isConnected: status === 'connected' || status === 'listening' || status === 'processing' || status === 'speaking',
    isRecording,

    // Actions
    connect,
    disconnect,
    startTalking,
    stopTalking,
  };
}

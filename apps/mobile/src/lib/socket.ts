import { io, Socket } from 'socket.io-client';
import { getIdToken } from './firebase';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  IntelligenceChip,
} from '../types';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3001';

type BreaSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: BreaSocket | null = null;
let isConnecting = false;

export interface SocketCallbacks {
  onAudioChunk?: (data: ArrayBuffer) => void;
  onTranscription?: (text: string, isFinal: boolean) => void;
  onIntelligenceUpdate?: (chips: IntelligenceChip[]) => void;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (reason: string) => void;
  onError?: (code: string, message: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Connect to the Brea socket server
 */
export async function connectSocket(callbacks: SocketCallbacks): Promise<void> {
  if (socket?.connected || isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
    });

    // Set up event handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected');
      callbacks.onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      callbacks.onDisconnect?.();
    });

    socket.on('audio:chunk', (data) => {
      callbacks.onAudioChunk?.(data);
    });

    socket.on('brea:transcription', ({ text, isFinal }) => {
      callbacks.onTranscription?.(text, isFinal);
    });

    socket.on('brea:intelligence_update', ({ chips }) => {
      callbacks.onIntelligenceUpdate?.(chips);
    });

    socket.on('brea:session_start', ({ sessionId }) => {
      callbacks.onSessionStart?.(sessionId);
    });

    socket.on('brea:session_end', ({ reason }) => {
      callbacks.onSessionEnd?.(reason);
    });

    socket.on('brea:error', ({ code, message }) => {
      console.error(`[Socket] Error: ${code} - ${message}`);
      callbacks.onError?.(code, message);
    });

    // Connect
    socket.connect();
  } finally {
    isConnecting = false;
  }
}

/**
 * Start a voice session with Brea
 */
export async function startSession(): Promise<void> {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }

  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  socket.emit('session:start', { firebaseToken: token });
}

/**
 * Send audio chunk to server
 */
export function sendAudioChunk(data: ArrayBuffer): void {
  if (!socket?.connected) {
    return;
  }

  socket.emit('audio:chunk', data);
}

/**
 * Signal end of audio input
 */
export function endAudioInput(): void {
  if (!socket?.connected) {
    return;
  }

  socket.emit('audio:end');
}

/**
 * End the current session
 */
export function endSession(): void {
  if (!socket?.connected) {
    return;
  }

  socket.emit('session:end');
}

/**
 * Disconnect from socket server
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

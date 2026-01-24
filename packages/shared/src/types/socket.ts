// Socket.io event types for audio streaming

// Client -> Server events
export interface ClientToServerEvents {
  // Audio chunk from client (PCM16 binary)
  "audio:chunk": (chunk: ArrayBuffer) => void;

  // Start a new audio session
  "audio:start": () => void;

  // End audio session
  "audio:stop": () => void;

  // Cancel current AI response
  "audio:cancel": () => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  // Audio chunk from Brea (PCM16 binary)
  "audio:chunk": (chunk: ArrayBuffer) => void;

  // Transcription text (for accessibility/debugging)
  "brea:transcription": (data: TranscriptionData) => void;

  // Real-time intelligence updates (chips for Live Panel)
  "brea:intelligence_update": (data: IntelligenceUpdate) => void;

  // Session state changes
  "session:state": (state: SessionState) => void;

  // Error events
  "error": (error: SocketError) => void;
}

// Transcription data
export interface TranscriptionData {
  text: string;
  isFinal: boolean;
  speaker: "user" | "brea";
}

// Intelligence chip types
export type IntelligenceChipType =
  | "dealbreaker"
  | "value"
  | "energy"
  | "humor"
  | "planning"
  | "conflict"
  | "hypothesis"
  | "unknown";

// Intelligence update (real-time chips)
export interface IntelligenceUpdate {
  type: IntelligenceChipType;
  label: string;
  value: string;
  emoji?: string;
  confirmed?: boolean;
}

// Session state
export type SessionState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

// Socket error
export interface SocketError {
  code: string;
  message: string;
}

// Inter-server events (not used by client)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data (attached to socket)
export interface SocketData {
  userId: string;
  sessionId: string;
}

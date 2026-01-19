// ============================================================================
// INTELLIGENCE CHIP TYPES
// ============================================================================

export type IntelligenceChipType =
  | 'dealbreaker'
  | 'value'
  | 'energy'
  | 'humor'
  | 'planning'
  | 'conflict'
  | 'hypothesis'
  | 'lifestyle';

export interface IntelligenceChip {
  type: IntelligenceChipType;
  label: string;
  emoji?: string;
  confidence?: number;
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface PersonalityTags {
  humor?: 'dry' | 'playful' | 'silly' | 'sarcastic';
  energy?: 'chill' | 'balanced' | 'high';
  planning?: 'spontaneous' | 'planned';
  conflict?: 'direct' | 'avoidant' | 'collaborative';
}

export interface Hypothesis {
  claim: string;
  question: string;
  confirmed?: boolean;
}

export interface KnowledgeGap {
  question: string;
  reason: string;
}

export interface ProfileData {
  values: string[];
  dealbreakers: string[];
  personalityTags: PersonalityTags;
  hypotheses: Hypothesis[];
  knowledgeGaps: KnowledgeGap[];
  photoUrl?: string;
}

// ============================================================================
// MATCH TYPES
// ============================================================================

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type MatchStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface UnknownItem {
  question: string;
  reason: string;
}

export interface TranscriptEntry {
  role: 'AGENT_A' | 'AGENT_B';
  content: string;
  timestamp?: number;
}

export interface MatchResult {
  id: string;
  compatibilityScore: number;
  confidenceLevel: ConfidenceLevel;
  whyMatched: string[];
  potentialFriction: string[];
  unknowns: UnknownItem[];
  transcript: TranscriptEntry[];
  status: MatchStatus;
  matchedWith: {
    displayName: string;
    photoUrl?: string;
    values?: string[];
  };
  consent?: {
    action: 'APPROVE' | 'REJECT';
    inviteLink?: string;
  };
  createdAt: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  uid: string;
  firebaseUid: string;
  isAnonymous: boolean;
  email?: string;
  profile: ProfileData | null;
  recentMatches: MatchResult[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SOCKET EVENT TYPES
// ============================================================================

export interface ServerToClientEvents {
  'audio:chunk': (data: ArrayBuffer) => void;
  'brea:transcription': (data: { text: string; isFinal: boolean }) => void;
  'brea:intelligence_update': (data: { chips: IntelligenceChip[] }) => void;
  'brea:session_start': (data: { sessionId: string }) => void;
  'brea:session_end': (data: { reason: string }) => void;
  'brea:error': (data: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'audio:chunk': (data: ArrayBuffer) => void;
  'audio:end': () => void;
  'session:start': (data: { firebaseToken: string }) => void;
  'session:end': () => void;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  error: string;
  message: string;
}

export interface ArenaRunResponse {
  matchId: string;
  result: {
    compatibilityScore: number;
    confidenceLevel: ConfidenceLevel;
    whyMatched: string[];
    potentialFriction: string[];
    unknowns: UnknownItem[];
    transcript: TranscriptEntry[];
    safety: { status: 'OK' | 'FLAGGED'; notes?: string };
  };
  targetPersona: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };
}

export interface ConsentResponse {
  success: boolean;
  inviteLink?: string;
}

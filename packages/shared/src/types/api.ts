import type { UserProfile, Hypothesis } from "./profile";
import type { MatchResult, SandboxOutput } from "./sandbox";

// Auth endpoints

export interface UpgradeAuthRequest {
  email?: string;
  phone?: string;
  idToken: string;
}

export interface UpgradeAuthResponse {
  success: boolean;
  user: UserProfile;
}

// Profile endpoints

export interface GetMeResponse {
  user: UserProfile;
  matches: MatchResult[];
}

export interface UploadPhotoRequest {
  // Multipart form data with photo file
}

export interface UploadPhotoResponse {
  photoUrl: string;
  hypotheses: Hypothesis[];
}

// Arena/Sandbox endpoints

export interface RunArenaRequest {
  // Optional: specific persona ID to match against
  targetPersonaId?: string;
}

export interface RunArenaResponse {
  matchId: string;
  result: SandboxOutput;
  matchedProfile: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };
}

// Consent endpoints

export type ConsentEventType =
  | "profile_view"
  | "transcript_view"
  | "invite_sent"
  | "invite_accepted"
  | "date_scheduled";

export interface LogConsentRequest {
  eventType: ConsentEventType;
  targetUserId: string;
  matchId: string;
  metadata?: Record<string, unknown>;
}

export interface LogConsentResponse {
  success: boolean;
  eventId: string;
}

// Dossier types

export interface CandidateDossier {
  match: MatchResult;
  candidate: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };
  intel: string; // Qualitative reason this works
  friction: string[]; // Honest downsides
  confidenceExplanation: string; // "Medium confidence: I like this, but..."
}

// API error response
export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

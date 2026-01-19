import { z } from 'zod';

// ============================================================================
// PROFILE EXTRACTION SCHEMA (From Voice/Photo)
// ============================================================================

export const HumorTypeSchema = z.enum(['dry', 'playful', 'silly', 'sarcastic']);
export const EnergyTypeSchema = z.enum(['chill', 'balanced', 'high']);
export const PlanningTypeSchema = z.enum(['spontaneous', 'planned']);
export const ConflictTypeSchema = z.enum(['direct', 'avoidant', 'collaborative']);

export const PersonalityTagsSchema = z.object({
  humor: HumorTypeSchema.optional(),
  energy: EnergyTypeSchema.optional(),
  planning: PlanningTypeSchema.optional(),
  conflict: ConflictTypeSchema.optional(),
});

export const HypothesisSchema = z.object({
  claim: z.string(),
  question: z.string(),
  confirmed: z.boolean().optional(),
});

export const KnowledgeGapSchema = z.object({
  question: z.string(),
  reason: z.string(),
});

export const ProfileExtractionSchema = z.object({
  values: z.array(z.string()),
  dealbreakers: z.array(z.string()),
  personalityTags: PersonalityTagsSchema,
  hypotheses: z.array(HypothesisSchema),
  knowledgeGaps: z.array(KnowledgeGapSchema),
});

export type HumorType = z.infer<typeof HumorTypeSchema>;
export type EnergyType = z.infer<typeof EnergyTypeSchema>;
export type PlanningType = z.infer<typeof PlanningTypeSchema>;
export type ConflictType = z.infer<typeof ConflictTypeSchema>;
export type PersonalityTags = z.infer<typeof PersonalityTagsSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type KnowledgeGap = z.infer<typeof KnowledgeGapSchema>;
export type ProfileExtraction = z.infer<typeof ProfileExtractionSchema>;

// ============================================================================
// SANDBOX SIMULATION OUTPUT SCHEMA
// ============================================================================

export const ConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const SafetyStatusSchema = z.enum(['OK', 'FLAGGED']);
export const AgentRoleSchema = z.enum(['AGENT_A', 'AGENT_B']);

export const TranscriptEntrySchema = z.object({
  role: AgentRoleSchema,
  content: z.string(),
  timestamp: z.number().optional(),
});

export const SafetyResultSchema = z.object({
  status: SafetyStatusSchema,
  notes: z.string().optional(),
});

export const UnknownItemSchema = z.object({
  question: z.string(),
  reason: z.string(),
});

export const SandboxOutputSchema = z.object({
  compatibilityScore: z.number().min(0).max(100),
  confidenceLevel: ConfidenceLevelSchema,
  whyMatched: z.array(z.string()),
  potentialFriction: z.array(z.string()),
  unknowns: z.array(UnknownItemSchema),
  transcript: z.array(TranscriptEntrySchema),
  safety: SafetyResultSchema,
});

export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;
export type SafetyStatus = z.infer<typeof SafetyStatusSchema>;
export type AgentRole = z.infer<typeof AgentRoleSchema>;
export type TranscriptEntry = z.infer<typeof TranscriptEntrySchema>;
export type SafetyResult = z.infer<typeof SafetyResultSchema>;
export type UnknownItem = z.infer<typeof UnknownItemSchema>;
export type SandboxOutput = z.infer<typeof SandboxOutputSchema>;

// ============================================================================
// INTELLIGENCE UPDATE (Real-time chips for Live Panel)
// ============================================================================

export const IntelligenceChipTypeSchema = z.enum([
  'dealbreaker',
  'value',
  'energy',
  'humor',
  'planning',
  'conflict',
  'hypothesis',
  'lifestyle',
]);

export const IntelligenceChipSchema = z.object({
  type: IntelligenceChipTypeSchema,
  label: z.string(),
  emoji: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type IntelligenceChipType = z.infer<typeof IntelligenceChipTypeSchema>;
export type IntelligenceChip = z.infer<typeof IntelligenceChipSchema>;

// ============================================================================
// SOCKET EVENTS
// ============================================================================

export interface ServerToClientEvents {
  'audio:chunk': (data: Buffer) => void;
  'brea:transcription': (data: { text: string; isFinal: boolean }) => void;
  'brea:intelligence_update': (data: { chips: IntelligenceChip[] }) => void;
  'brea:session_start': (data: { sessionId: string }) => void;
  'brea:session_end': (data: { reason: string }) => void;
  'brea:error': (data: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'audio:chunk': (data: Buffer) => void;
  'audio:end': () => void;
  'session:start': (data: { firebaseToken: string }) => void;
  'session:end': () => void;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface AuthUpgradeRequest {
  email?: string;
  phone?: string;
  password?: string;
}

export interface AuthUpgradeResponse {
  success: boolean;
  uid: string;
}

export interface ProfileResponse {
  uid: string;
  isAnonymous: boolean;
  profile: ProfileExtraction | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoUploadResponse {
  photoUrl: string;
  hypotheses: Hypothesis[];
}

export interface ArenaRunRequest {
  targetPersonaId?: string; // Optional: specific seed persona to match with
}

export interface ArenaRunResponse {
  matchId: string;
  result: SandboxOutput;
  targetPersona: {
    id: string;
    displayName: string;
    photoUrl: string | null;
  };
}

export interface ConsentRequest {
  matchId: string;
  action: 'APPROVE' | 'REJECT';
}

export interface ConsentResponse {
  success: boolean;
  inviteLink?: string;
}

// ============================================================================
// GEMINI LIVE API TYPES
// ============================================================================

export interface GeminiLiveConfig {
  model: string;
  generationConfig: {
    responseModalities: string[];
    speechConfig?: {
      voiceConfig?: {
        prebuiltVoiceConfig?: {
          voiceName: string;
        };
      };
    };
  };
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
}

export interface GeminiLiveMessage {
  setup?: GeminiLiveConfig;
  realtimeInput?: {
    mediaChunks: Array<{
      mimeType: string;
      data: string;
    }>;
  };
  clientContent?: {
    turns: Array<{
      role: string;
      parts: Array<{ text?: string }>;
    }>;
    turnComplete: boolean;
  };
}

export interface GeminiLiveResponse {
  setupComplete?: Record<string, unknown>;
  serverContent?: {
    modelTurn?: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    turnComplete?: boolean;
  };
  toolCall?: {
    functionCalls: Array<{
      name: string;
      args: Record<string, unknown>;
    }>;
  };
}

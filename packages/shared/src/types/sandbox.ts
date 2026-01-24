import { z } from "zod";

// Confidence level
export const ConfidenceLevel = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevel>;

// Safety status
export const SafetyStatus = z.enum(["OK", "FLAGGED"]);
export type SafetyStatus = z.infer<typeof SafetyStatus>;

// Agent role in transcript
export const AgentRole = z.enum(["AGENT_A", "AGENT_B"]);
export type AgentRole = z.infer<typeof AgentRole>;

// Transcript entry
export const TranscriptEntrySchema = z.object({
  role: AgentRole,
  content: z.string(),
  timestamp: z.number().optional(),
});

export type TranscriptEntry = z.infer<typeof TranscriptEntrySchema>;

// Unknown question from sandbox
export const SandboxUnknownSchema = z.object({
  question: z.string(),
  reason: z.string(),
});

export type SandboxUnknown = z.infer<typeof SandboxUnknownSchema>;

// Safety assessment
export const SafetyAssessmentSchema = z.object({
  status: SafetyStatus,
  notes: z.string().optional(),
});

export type SafetyAssessment = z.infer<typeof SafetyAssessmentSchema>;

// Sandbox simulation output
export const SandboxOutputSchema = z.object({
  compatibilityScore: z.number().min(0).max(100),
  confidenceLevel: ConfidenceLevel,
  whyMatched: z.array(z.string()),
  potentialFriction: z.array(z.string()),
  unknowns: z.array(SandboxUnknownSchema),
  transcript: z.array(TranscriptEntrySchema),
  safety: SafetyAssessmentSchema,
});

export type SandboxOutput = z.infer<typeof SandboxOutputSchema>;

// Match result (stored in DB)
export interface MatchResult {
  id: string;
  userAId: string;
  userBId: string;
  compatibilityScore: number;
  confidenceLevel: ConfidenceLevel;
  whyMatched: string[];
  potentialFriction: string[];
  unknowns: SandboxUnknown[];
  redactedTranscript: TranscriptEntry[];
  safety: SafetyAssessment;
  scenarioType: string;
  createdAt: Date;
}

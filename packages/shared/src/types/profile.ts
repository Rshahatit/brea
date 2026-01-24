import { z } from "zod";

// Personality tag options
export const HumorType = z.enum(["dry", "playful", "silly", "sarcastic"]);
export const EnergyType = z.enum(["chill", "balanced", "high"]);
export const PlanningType = z.enum(["spontaneous", "planned"]);
export const ConflictType = z.enum(["direct", "avoidant", "collaborative"]);

export type HumorType = z.infer<typeof HumorType>;
export type EnergyType = z.infer<typeof EnergyType>;
export type PlanningType = z.infer<typeof PlanningType>;
export type ConflictType = z.infer<typeof ConflictType>;

// Personality tags schema
export const PersonalityTagsSchema = z.object({
  humor: HumorType.optional(),
  energy: EnergyType.optional(),
  planning: PlanningType.optional(),
  conflict: ConflictType.optional(),
});

export type PersonalityTags = z.infer<typeof PersonalityTagsSchema>;

// Hypothesis schema
export const HypothesisSchema = z.object({
  claim: z.string(),
  question: z.string(),
  confirmed: z.boolean().optional(),
});

export type Hypothesis = z.infer<typeof HypothesisSchema>;

// Knowledge gap schema
export const KnowledgeGapSchema = z.object({
  question: z.string(),
  reason: z.string(),
});

export type KnowledgeGap = z.infer<typeof KnowledgeGapSchema>;

// Profile extraction schema (from voice/photo)
export const ProfileExtractionSchema = z.object({
  values: z.array(z.string()),
  dealbreakers: z.array(z.string()),
  personalityTags: PersonalityTagsSchema,
  hypotheses: z.array(HypothesisSchema),
  knowledgeGaps: z.array(KnowledgeGapSchema),
});

export type ProfileExtraction = z.infer<typeof ProfileExtractionSchema>;

// User profile (stored in DB)
export interface UserProfile {
  id: string;
  firebaseUid: string;
  isAnonymous: boolean;
  displayName?: string;
  photoUrl?: string;
  values: string[];
  dealbreakers: string[];
  personalityTags: PersonalityTags;
  hypotheses: Hypothesis[];
  knowledgeGaps: KnowledgeGap[];
  isSeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

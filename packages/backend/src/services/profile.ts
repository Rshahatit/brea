import { prisma } from '../lib/prisma.js';
import type { ProfileExtraction, Hypothesis, IntelligenceChip } from '../types/index.js';

/**
 * Get or create a user's profile
 */
export async function getOrCreateProfile(userId: string) {
  let profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId,
        values: [],
        dealbreakers: [],
      },
    });
  }

  return profile;
}

/**
 * Update profile with extracted data from conversation
 */
export async function updateProfileFromExtraction(
  userId: string,
  extraction: Partial<ProfileExtraction>
) {
  const existingProfile = await getOrCreateProfile(userId);

  // Merge values and dealbreakers (avoid duplicates)
  const mergedValues = [...new Set([
    ...existingProfile.values,
    ...(extraction.values || []),
  ])];

  const mergedDealbreakers = [...new Set([
    ...existingProfile.dealbreakers,
    ...(extraction.dealbreakers || []),
  ])];

  // Merge personality tags
  const existingTags = (existingProfile.personalityTags as Record<string, string>) || {};
  const newTags = extraction.personalityTags || {};
  const mergedTags = { ...existingTags, ...newTags };

  // Merge hypotheses
  const existingHypotheses = (existingProfile.hypotheses || []) as Hypothesis[];
  const newHypotheses = extraction.hypotheses || [];
  const mergedHypotheses = [...existingHypotheses];

  for (const newHypo of newHypotheses) {
    const exists = mergedHypotheses.some(
      (h) => h.claim.toLowerCase() === newHypo.claim.toLowerCase()
    );
    if (!exists) {
      mergedHypotheses.push(newHypo);
    }
  }

  // Merge knowledge gaps
  const existingGaps = (existingProfile.knowledgeGaps || []) as Array<{ question: string; reason: string }>;
  const newGaps = extraction.knowledgeGaps || [];
  const mergedGaps = [...existingGaps];

  for (const newGap of newGaps) {
    const exists = mergedGaps.some(
      (g) => g.question.toLowerCase() === newGap.question.toLowerCase()
    );
    if (!exists) {
      mergedGaps.push(newGap);
    }
  }

  return await prisma.profile.update({
    where: { userId },
    data: {
      values: mergedValues,
      dealbreakers: mergedDealbreakers,
      personalityTags: mergedTags,
      hypotheses: mergedHypotheses,
      knowledgeGaps: mergedGaps,
    },
  });
}

/**
 * Confirm or reject a hypothesis
 */
export async function confirmHypothesis(
  userId: string,
  hypothesisClaim: string,
  confirmed: boolean
) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error('Profile not found');
  }

  const hypotheses = (profile.hypotheses || []) as Hypothesis[];
  const updatedHypotheses = hypotheses.map((h) => {
    if (h.claim.toLowerCase() === hypothesisClaim.toLowerCase()) {
      return { ...h, confirmed };
    }
    return h;
  });

  return await prisma.profile.update({
    where: { userId },
    data: { hypotheses: updatedHypotheses },
  });
}

/**
 * Update profile with photo analysis
 */
export async function updateProfilePhoto(
  userId: string,
  photoUrl: string,
  analysis?: Record<string, unknown>
) {
  return await prisma.profile.update({
    where: { userId },
    data: {
      photoUrl,
      photoAnalysis: analysis,
    },
  });
}

/**
 * Convert intelligence chips to profile extraction format
 */
export function chipsToProfileExtraction(chips: IntelligenceChip[]): Partial<ProfileExtraction> {
  const extraction: Partial<ProfileExtraction> = {
    values: [],
    dealbreakers: [],
    personalityTags: {},
  };

  for (const chip of chips) {
    switch (chip.type) {
      case 'value':
        extraction.values!.push(chip.label);
        break;
      case 'dealbreaker':
        extraction.dealbreakers!.push(chip.label);
        break;
      case 'energy':
        extraction.personalityTags!.energy = chip.label.toLowerCase() as 'chill' | 'balanced' | 'high';
        break;
      case 'humor':
        extraction.personalityTags!.humor = chip.label.toLowerCase() as 'dry' | 'playful' | 'silly' | 'sarcastic';
        break;
      case 'planning':
        extraction.personalityTags!.planning = chip.label.toLowerCase() as 'spontaneous' | 'planned';
        break;
      case 'conflict':
        extraction.personalityTags!.conflict = chip.label.toLowerCase() as 'direct' | 'avoidant' | 'collaborative';
        break;
    }
  }

  return extraction;
}

/**
 * Get user's full dossier
 */
export async function getUserDossier(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      sentMatches: {
        include: {
          matchedWith: {
            include: {
              profile: {
                select: {
                  displayName: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    uid: user.id,
    firebaseUid: user.firebaseUid,
    isAnonymous: user.isAnonymous,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: user.profile
      ? {
          values: user.profile.values,
          dealbreakers: user.profile.dealbreakers,
          personalityTags: user.profile.personalityTags,
          hypotheses: user.profile.hypotheses,
          knowledgeGaps: user.profile.knowledgeGaps,
          photoUrl: user.profile.photoUrl,
        }
      : null,
    recentMatches: user.sentMatches.map((m) => ({
      id: m.id,
      compatibilityScore: m.compatibilityScore,
      confidenceLevel: m.confidenceLevel,
      status: m.status,
      matchedWith: {
        displayName: m.matchedWith.profile?.displayName || 'Anonymous',
        photoUrl: m.matchedWith.profile?.photoUrl,
      },
      createdAt: m.createdAt,
    })),
  };
}

import { prisma } from '../lib/prisma.js';
import type {
  SandboxOutput,
  ConfidenceLevel,
  TranscriptEntry,
  UnknownItem,
} from '../types/index.js';

// Scenario templates for deterministic simulation
const SCENARIOS = {
  SATURDAY_PLAN: {
    name: 'The 10AM Saturday Plan',
    prompt: `Scenario: It's Saturday morning at 10 AM. You both have the entire day free.
    Agent A wants to plan the day. Have a natural conversation about what to do.
    Focus on: spontaneity vs planning, energy levels, interests alignment.`,
  },
  CONFLICT_STYLE: {
    name: 'The Minor Disagreement',
    prompt: `Scenario: You're choosing a restaurant for dinner. Agent A prefers sushi, Agent B prefers Italian.
    Have a conversation to reach a decision.
    Focus on: conflict resolution style, compromise ability, communication patterns.`,
  },
  LIFESTYLE_CHECK: {
    name: 'The Living Situation',
    prompt: `Scenario: You're discussing what an ideal living situation looks like.
    Have a conversation about home preferences, cleanliness, guests, and routines.
    Focus on: lifestyle compatibility, dealbreakers, flexibility.`,
  },
  ENERGY_MATCH: {
    name: 'The Social Weekend',
    prompt: `Scenario: There's a big party this weekend that friends invited you both to.
    Discuss whether to go and how to spend the weekend.
    Focus on: social energy, introversion/extroversion balance, quality time preferences.`,
  },
};

interface AgentProfile {
  values: string[];
  dealbreakers: string[];
  personalityTags: Record<string, string>;
  displayName?: string;
}

/**
 * Run a compatibility simulation between two profiles
 */
export async function runCompatibilitySimulation(
  userProfile: AgentProfile,
  targetProfile: AgentProfile
): Promise<SandboxOutput> {
  // Select scenarios to run (for V1, we run all 4)
  const scenarios = Object.values(SCENARIOS);

  // Simulate conversations (in production, this would call Gemini to generate actual conversations)
  const transcripts: TranscriptEntry[] = [];
  const analysisResults: {
    positives: string[];
    frictions: string[];
    unknowns: UnknownItem[];
  } = {
    positives: [],
    frictions: [],
    unknowns: [],
  };

  // Analyze value alignment
  const sharedValues = userProfile.values.filter((v) =>
    targetProfile.values.some((tv) => tv.toLowerCase() === v.toLowerCase())
  );
  if (sharedValues.length > 0) {
    analysisResults.positives.push(`Shared values: ${sharedValues.join(', ')}`);
  }

  // Check for dealbreaker conflicts
  for (const dealbreaker of userProfile.dealbreakers) {
    const conflictingValue = targetProfile.values.find(
      (v) => v.toLowerCase().includes(dealbreaker.toLowerCase())
    );
    if (conflictingValue) {
      analysisResults.frictions.push(
        `Potential conflict: Your dealbreaker "${dealbreaker}" vs their value "${conflictingValue}"`
      );
    }
  }

  // Personality tag analysis
  const userTags = userProfile.personalityTags || {};
  const targetTags = targetProfile.personalityTags || {};

  // Energy compatibility
  if (userTags.energy && targetTags.energy) {
    if (userTags.energy === targetTags.energy) {
      analysisResults.positives.push(`Matching energy levels: both ${userTags.energy}`);
    } else if (
      (userTags.energy === 'chill' && targetTags.energy === 'high') ||
      (userTags.energy === 'high' && targetTags.energy === 'chill')
    ) {
      analysisResults.frictions.push(
        `Energy mismatch: ${userTags.energy} vs ${targetTags.energy}`
      );
    }
  }

  // Humor compatibility
  if (userTags.humor && targetTags.humor) {
    if (userTags.humor === targetTags.humor) {
      analysisResults.positives.push(`Matching humor style: ${userTags.humor}`);
    }
  }

  // Planning style compatibility
  if (userTags.planning && targetTags.planning) {
    if (userTags.planning !== targetTags.planning) {
      analysisResults.frictions.push(
        `Different planning styles: ${userTags.planning} vs ${targetTags.planning}`
      );
    } else {
      analysisResults.positives.push(`Both prefer ${userTags.planning} approach`);
    }
  }

  // Conflict style analysis
  if (userTags.conflict && targetTags.conflict) {
    const compatibleConflict =
      (userTags.conflict === 'collaborative' && targetTags.conflict === 'collaborative') ||
      (userTags.conflict === 'direct' && targetTags.conflict !== 'avoidant');

    if (compatibleConflict) {
      analysisResults.positives.push('Compatible conflict resolution styles');
    } else if (
      userTags.conflict === 'direct' &&
      targetTags.conflict === 'avoidant'
    ) {
      analysisResults.frictions.push(
        'Conflict style mismatch: direct vs avoidant'
      );
    }
  }

  // Generate sample transcript entries
  for (const scenario of scenarios) {
    transcripts.push({
      role: 'AGENT_A',
      content: `[${scenario.name}] Simulated response based on profile...`,
      timestamp: Date.now(),
    });
    transcripts.push({
      role: 'AGENT_B',
      content: `[${scenario.name}] Simulated response based on target profile...`,
      timestamp: Date.now() + 1000,
    });
  }

  // Identify unknowns
  const potentialUnknowns = [
    { question: 'Views on pets?', reason: 'Not discussed' },
    { question: 'Long-term relationship goals?', reason: 'Not explicitly stated' },
    { question: 'Family planning views?', reason: 'Sensitive topic not explored' },
  ];

  // Filter unknowns to only include relevant ones
  for (const unknown of potentialUnknowns) {
    const mentionedInValues =
      userProfile.values.some((v) => v.toLowerCase().includes(unknown.question.toLowerCase())) ||
      targetProfile.values.some((v) => v.toLowerCase().includes(unknown.question.toLowerCase()));

    if (!mentionedInValues) {
      analysisResults.unknowns.push(unknown);
    }
  }

  // Calculate compatibility score
  const baseScore = 50;
  const positivePoints = analysisResults.positives.length * 10;
  const frictionPoints = analysisResults.frictions.length * 15;
  const rawScore = Math.min(100, Math.max(0, baseScore + positivePoints - frictionPoints));

  // Determine confidence level
  let confidenceLevel: ConfidenceLevel = 'MEDIUM';
  if (analysisResults.unknowns.length <= 1 && analysisResults.positives.length >= 3) {
    confidenceLevel = 'HIGH';
  } else if (analysisResults.unknowns.length >= 3 || analysisResults.frictions.length >= 3) {
    confidenceLevel = 'LOW';
  }

  return {
    compatibilityScore: rawScore,
    confidenceLevel,
    whyMatched: analysisResults.positives,
    potentialFriction: analysisResults.frictions,
    unknowns: analysisResults.unknowns,
    transcript: transcripts,
    safety: {
      status: 'OK',
    },
  };
}

/**
 * Get seed personas for matching
 */
export async function getSeedPersonas(limit = 20) {
  const profiles = await prisma.profile.findMany({
    where: { isSeed: true },
    take: limit,
    include: {
      user: {
        select: { id: true },
      },
    },
  });

  return profiles.map((p) => ({
    id: p.user.id,
    displayName: p.displayName || 'Anonymous',
    photoUrl: p.photoUrl,
    values: p.values,
    dealbreakers: p.dealbreakers,
    personalityTags: p.personalityTags as Record<string, string>,
  }));
}

/**
 * Select a compatible persona to match with
 */
export async function selectMatchCandidate(
  userId: string,
  specificPersonaId?: string
) {
  // Get user's existing matches to avoid duplicates
  const existingMatches = await prisma.match.findMany({
    where: { userId },
    select: { matchedWithId: true },
  });

  const excludeIds = [userId, ...existingMatches.map((m) => m.matchedWithId)];

  // If a specific persona is requested
  if (specificPersonaId) {
    const profile = await prisma.profile.findFirst({
      where: {
        userId: specificPersonaId,
        isSeed: true,
        userId: { notIn: excludeIds },
      },
      include: {
        user: { select: { id: true } },
      },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.user.id,
      displayName: profile.displayName || 'Anonymous',
      photoUrl: profile.photoUrl,
      values: profile.values,
      dealbreakers: profile.dealbreakers,
      personalityTags: profile.personalityTags as Record<string, string>,
    };
  }

  // Otherwise, select randomly from available seed personas
  const availablePersonas = await prisma.profile.findMany({
    where: {
      isSeed: true,
      userId: { notIn: excludeIds },
    },
    include: {
      user: { select: { id: true } },
    },
    take: 10,
  });

  if (availablePersonas.length === 0) {
    return null;
  }

  // Random selection
  const selected = availablePersonas[Math.floor(Math.random() * availablePersonas.length)];

  return {
    id: selected.user.id,
    displayName: selected.displayName || 'Anonymous',
    photoUrl: selected.photoUrl,
    values: selected.values,
    dealbreakers: selected.dealbreakers,
    personalityTags: selected.personalityTags as Record<string, string>,
  };
}

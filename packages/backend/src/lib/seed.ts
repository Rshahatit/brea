import { prisma } from './prisma.js';

/**
 * Seed personas for the Compatibility Sandbox
 * These are AI-generated profiles that users can be matched against
 */
const SEED_PERSONAS = [
  {
    displayName: 'Alex',
    values: ['Career', 'Growth', 'Honesty', 'Adventure'],
    dealbreakers: ['Dishonesty', 'Laziness'],
    personalityTags: {
      humor: 'dry',
      energy: 'high',
      planning: 'planned',
      conflict: 'direct',
    },
  },
  {
    displayName: 'Jordan',
    values: ['Family', 'Stability', 'Loyalty', 'Creativity'],
    dealbreakers: ['Smoking', 'Cheating'],
    personalityTags: {
      humor: 'playful',
      energy: 'balanced',
      planning: 'spontaneous',
      conflict: 'collaborative',
    },
  },
  {
    displayName: 'Sam',
    values: ['Adventure', 'Freedom', 'Creativity', 'Connection'],
    dealbreakers: ['Controlling behavior', 'Judgmental attitude'],
    personalityTags: {
      humor: 'silly',
      energy: 'high',
      planning: 'spontaneous',
      conflict: 'avoidant',
    },
  },
  {
    displayName: 'Taylor',
    values: ['Stability', 'Family', 'Health', 'Career'],
    dealbreakers: ['Smoking', 'Drug use', 'Reckless behavior'],
    personalityTags: {
      humor: 'dry',
      energy: 'chill',
      planning: 'planned',
      conflict: 'collaborative',
    },
  },
  {
    displayName: 'Morgan',
    values: ['Growth', 'Spirituality', 'Connection', 'Nature'],
    dealbreakers: ['Materialism', 'Dishonesty'],
    personalityTags: {
      humor: 'playful',
      energy: 'chill',
      planning: 'spontaneous',
      conflict: 'collaborative',
    },
  },
  {
    displayName: 'Casey',
    values: ['Career', 'Achievement', 'Adventure', 'Independence'],
    dealbreakers: ['Clinginess', 'Lack of ambition'],
    personalityTags: {
      humor: 'sarcastic',
      energy: 'high',
      planning: 'planned',
      conflict: 'direct',
    },
  },
  {
    displayName: 'Riley',
    values: ['Family', 'Community', 'Creativity', 'Humor'],
    dealbreakers: ['Cruelty', 'Selfishness'],
    personalityTags: {
      humor: 'silly',
      energy: 'balanced',
      planning: 'spontaneous',
      conflict: 'avoidant',
    },
  },
  {
    displayName: 'Quinn',
    values: ['Knowledge', 'Growth', 'Honesty', 'Deep conversations'],
    dealbreakers: ['Anti-intellectualism', 'Closed-mindedness'],
    personalityTags: {
      humor: 'dry',
      energy: 'chill',
      planning: 'planned',
      conflict: 'direct',
    },
  },
  {
    displayName: 'Avery',
    values: ['Adventure', 'Spontaneity', 'Connection', 'Fun'],
    dealbreakers: ['Boring', 'Too serious', 'No sense of humor'],
    personalityTags: {
      humor: 'playful',
      energy: 'high',
      planning: 'spontaneous',
      conflict: 'avoidant',
    },
  },
  {
    displayName: 'Drew',
    values: ['Stability', 'Loyalty', 'Family', 'Trust'],
    dealbreakers: ['Cheating', 'Unreliability', 'Dishonesty'],
    personalityTags: {
      humor: 'dry',
      energy: 'balanced',
      planning: 'planned',
      conflict: 'collaborative',
    },
  },
  {
    displayName: 'Sage',
    values: ['Mindfulness', 'Nature', 'Health', 'Balance'],
    dealbreakers: ['Negativity', 'Toxic behavior', 'Substance abuse'],
    personalityTags: {
      humor: 'playful',
      energy: 'chill',
      planning: 'balanced',
      conflict: 'collaborative',
    },
  },
  {
    displayName: 'Jamie',
    values: ['Creativity', 'Expression', 'Freedom', 'Authenticity'],
    dealbreakers: ['Conformity pressure', 'Judgment'],
    personalityTags: {
      humor: 'sarcastic',
      energy: 'balanced',
      planning: 'spontaneous',
      conflict: 'direct',
    },
  },
  {
    displayName: 'Cameron',
    values: ['Success', 'Achievement', 'Recognition', 'Growth'],
    dealbreakers: ['Laziness', 'Lack of goals', 'Settling'],
    personalityTags: {
      humor: 'dry',
      energy: 'high',
      planning: 'planned',
      conflict: 'direct',
    },
  },
  {
    displayName: 'Reese',
    values: ['Compassion', 'Empathy', 'Helping others', 'Connection'],
    dealbreakers: ['Cruelty', 'Selfishness', 'Apathy'],
    personalityTags: {
      humor: 'playful',
      energy: 'balanced',
      planning: 'spontaneous',
      conflict: 'collaborative',
    },
  },
  {
    displayName: 'Skyler',
    values: ['Freedom', 'Travel', 'Experience', 'Stories'],
    dealbreakers: ['Settling down too fast', 'Routine obsession'],
    personalityTags: {
      humor: 'silly',
      energy: 'high',
      planning: 'spontaneous',
      conflict: 'avoidant',
    },
  },
  {
    displayName: 'Parker',
    values: ['Logic', 'Efficiency', 'Honesty', 'Respect'],
    dealbreakers: ['Drama', 'Games', 'Manipulation'],
    personalityTags: {
      humor: 'dry',
      energy: 'chill',
      planning: 'planned',
      conflict: 'direct',
    },
  },
  {
    displayName: 'Finley',
    values: ['Fun', 'Humor', 'Connection', 'Experiences'],
    dealbreakers: ['Taking things too seriously', 'Negativity'],
    personalityTags: {
      humor: 'silly',
      energy: 'high',
      planning: 'spontaneous',
      conflict: 'avoidant',
    },
  },
  {
    displayName: 'Harper',
    values: ['Art', 'Culture', 'Expression', 'Beauty'],
    dealbreakers: ['Philistinism', 'Closed-mindedness'],
    personalityTags: {
      humor: 'sarcastic',
      energy: 'balanced',
      planning: 'spontaneous',
      conflict: 'collaborative',
    },
  },
  {
    displayName: 'Emerson',
    values: ['Wisdom', 'Growth', 'Understanding', 'Patience'],
    dealbreakers: ['Immaturity', 'Impulsiveness', 'Disrespect'],
    personalityTags: {
      humor: 'dry',
      energy: 'chill',
      planning: 'planned',
      conflict: 'collaborative',
    },
  },
  {
    displayName: 'Blake',
    values: ['Fitness', 'Health', 'Discipline', 'Adventure'],
    dealbreakers: ['Unhealthy lifestyle', 'No motivation'],
    personalityTags: {
      humor: 'playful',
      energy: 'high',
      planning: 'planned',
      conflict: 'direct',
    },
  },
];

/**
 * Seed the database with test personas
 */
export async function seedPersonas() {
  console.log('[Seed] Creating seed personas...');

  for (const persona of SEED_PERSONAS) {
    // Create a "user" for the persona
    const existingUser = await prisma.user.findFirst({
      where: {
        profile: {
          displayName: persona.displayName,
          isSeed: true,
        },
      },
    });

    if (existingUser) {
      console.log(`[Seed] Persona "${persona.displayName}" already exists, skipping...`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        firebaseUid: `seed_${persona.displayName.toLowerCase()}_${Date.now()}`,
        isAnonymous: false,
      },
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: persona.displayName,
        values: persona.values,
        dealbreakers: persona.dealbreakers,
        personalityTags: persona.personalityTags,
        isSeed: true,
      },
    });

    console.log(`[Seed] Created persona: ${persona.displayName}`);
  }

  console.log('[Seed] Seeding complete!');
}

// Run if called directly
if (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js')) {
  seedPersonas()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] Error:', error);
      process.exit(1);
    });
}

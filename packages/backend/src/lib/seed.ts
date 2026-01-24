import { prisma } from "./prisma.js";
import type { PersonalityTags } from "@brea/shared";

interface SeedPersona {
  displayName: string;
  values: string[];
  dealbreakers: string[];
  personalityTags: PersonalityTags;
}

const SEED_PERSONAS: SeedPersona[] = [
  {
    displayName: "Alex",
    values: ["Career", "Travel", "Independence"],
    dealbreakers: ["Smoking", "No ambition"],
    personalityTags: {
      humor: "dry",
      energy: "high",
      planning: "spontaneous",
      conflict: "direct",
    },
  },
  {
    displayName: "Jordan",
    values: ["Family", "Stability", "Honesty"],
    dealbreakers: ["Dishonesty", "Reckless spending"],
    personalityTags: {
      humor: "playful",
      energy: "balanced",
      planning: "planned",
      conflict: "collaborative",
    },
  },
  {
    displayName: "Casey",
    values: ["Creativity", "Freedom", "Nature"],
    dealbreakers: ["Controlling behavior", "Close-mindedness"],
    personalityTags: {
      humor: "silly",
      energy: "chill",
      planning: "spontaneous",
      conflict: "avoidant",
    },
  },
  {
    displayName: "Morgan",
    values: ["Health", "Learning", "Community"],
    dealbreakers: ["Smoking", "Negativity"],
    personalityTags: {
      humor: "sarcastic",
      energy: "high",
      planning: "planned",
      conflict: "direct",
    },
  },
  {
    displayName: "Riley",
    values: ["Adventure", "Authenticity", "Growth"],
    dealbreakers: ["Judgmental", "No sense of humor"],
    personalityTags: {
      humor: "playful",
      energy: "high",
      planning: "spontaneous",
      conflict: "collaborative",
    },
  },
  {
    displayName: "Taylor",
    values: ["Art", "Connection", "Peace"],
    dealbreakers: ["Aggression", "Workaholism"],
    personalityTags: {
      humor: "dry",
      energy: "chill",
      planning: "planned",
      conflict: "avoidant",
    },
  },
  {
    displayName: "Sam",
    values: ["Success", "Loyalty", "Fitness"],
    dealbreakers: ["Cheating", "Laziness"],
    personalityTags: {
      humor: "sarcastic",
      energy: "high",
      planning: "planned",
      conflict: "direct",
    },
  },
  {
    displayName: "Drew",
    values: ["Music", "Spirituality", "Animals"],
    dealbreakers: ["Animal cruelty", "Materialism"],
    personalityTags: {
      humor: "silly",
      energy: "balanced",
      planning: "spontaneous",
      conflict: "collaborative",
    },
  },
  {
    displayName: "Quinn",
    values: ["Technology", "Innovation", "Efficiency"],
    dealbreakers: ["Anti-science", "Drama"],
    personalityTags: {
      humor: "dry",
      energy: "balanced",
      planning: "planned",
      conflict: "direct",
    },
  },
  {
    displayName: "Avery",
    values: ["Kindness", "Family", "Food"],
    dealbreakers: ["Rudeness", "Picky eating"],
    personalityTags: {
      humor: "playful",
      energy: "chill",
      planning: "spontaneous",
      conflict: "avoidant",
    },
  },
];

async function seed() {
  console.log("Seeding database with personas...");

  for (const persona of SEED_PERSONAS) {
    const existing = await prisma.user.findFirst({
      where: {
        displayName: persona.displayName,
        isSeed: true,
      },
    });

    if (existing) {
      console.log(`Persona ${persona.displayName} already exists, skipping`);
      continue;
    }

    await prisma.user.create({
      data: {
        firebaseUid: `seed_${persona.displayName.toLowerCase()}_${Date.now()}`,
        isAnonymous: false,
        isSeed: true,
        displayName: persona.displayName,
        values: persona.values,
        dealbreakers: persona.dealbreakers,
        personalityTags: persona.personalityTags,
      },
    });

    console.log(`Created persona: ${persona.displayName}`);
  }

  console.log("Seeding complete!");
}

seed()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import type { User } from "@prisma/client";
import type { SandboxOutput } from "@brea/shared";
import { getTextModel } from "../lib/gemini.js";

// Scenario templates for sandbox simulations
const SCENARIOS = {
  LIFESTYLE_COMPATIBILITY: {
    name: "The 10AM Saturday Plan",
    prompt: `You are simulating a conversation between two people planning their ideal Saturday morning.

Agent A represents the first person, Agent B represents the second person.
Based on their profiles, simulate how they would negotiate plans.
Focus on: energy levels, planning preferences, and lifestyle compatibility.`,
  },
  CONFLICT_RESOLUTION: {
    name: "The Restaurant Disagreement",
    prompt: `You are simulating a conversation where two people disagree about where to eat dinner.

Agent A represents the first person, Agent B represents the second person.
Based on their profiles, simulate how they would handle this minor conflict.
Focus on: conflict style, communication patterns, and compromise ability.`,
  },
  ENERGY_MATCH: {
    name: "The Weekend Adventure",
    prompt: `You are simulating a conversation about planning a spontaneous weekend trip.

Agent A represents the first person, Agent B represents the second person.
Based on their profiles, simulate their energy and enthusiasm levels.
Focus on: spontaneity vs planning, energy matching, and excitement levels.`,
  },
};

export async function runSandboxSimulation(
  userA: User,
  userB: User,
  scenarioType: keyof typeof SCENARIOS = "LIFESTYLE_COMPATIBILITY"
): Promise<SandboxOutput> {
  const model = getTextModel();
  const scenario = SCENARIOS[scenarioType];

  const prompt = `${scenario.prompt}

AGENT A PROFILE:
- Values: ${userA.values.join(", ") || "Not specified"}
- Dealbreakers: ${userA.dealbreakers.join(", ") || "None specified"}
- Personality: ${JSON.stringify(userA.personalityTags) || "Not specified"}

AGENT B PROFILE:
- Values: ${userB.values.join(", ") || "Not specified"}
- Dealbreakers: ${userB.dealbreakers.join(", ") || "None specified"}
- Personality: ${JSON.stringify(userB.personalityTags) || "Not specified"}

Generate a simulated conversation (5-8 exchanges) and then analyze the compatibility.

Respond in this exact JSON format:
{
  "transcript": [
    {"role": "AGENT_A", "content": "..."},
    {"role": "AGENT_B", "content": "..."}
  ],
  "compatibilityScore": 0-100,
  "confidenceLevel": "HIGH" | "MEDIUM" | "LOW",
  "whyMatched": ["reason1", "reason2"],
  "potentialFriction": ["friction1"],
  "unknowns": [{"question": "...", "reason": "..."}],
  "safety": {"status": "OK", "notes": ""}
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as SandboxOutput;

    // Validate and sanitize the output
    return {
      compatibilityScore: Math.min(100, Math.max(0, parsed.compatibilityScore)),
      confidenceLevel: parsed.confidenceLevel || "MEDIUM",
      whyMatched: parsed.whyMatched || [],
      potentialFriction: parsed.potentialFriction || [],
      unknowns: parsed.unknowns || [],
      transcript: parsed.transcript || [],
      safety: parsed.safety || { status: "OK" },
    };
  } catch (error) {
    console.error("Sandbox simulation error:", error);

    // Return a default low-confidence result on error
    return {
      compatibilityScore: 50,
      confidenceLevel: "LOW",
      whyMatched: ["Unable to complete full analysis"],
      potentialFriction: ["Simulation incomplete"],
      unknowns: [
        {
          question: "Full compatibility",
          reason: "Simulation encountered an error",
        },
      ],
      transcript: [],
      safety: { status: "OK", notes: "Simulation error - manual review needed" },
    };
  }
}

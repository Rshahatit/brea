import { GoogleGenerativeAI } from "@google/generative-ai";

const hasGeminiConfig = !!process.env.GOOGLE_AI_API_KEY;

if (!hasGeminiConfig) {
  console.warn("⚠️  GOOGLE_AI_API_KEY not configured. AI features will not work.");
}

export const genAI = hasGeminiConfig
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
  : null;

// Brea's system instruction for voice interactions
export const BREA_SYSTEM_INSTRUCTION = `You are Brea, a professional dating liaison.

PERSONALITY:
- Tone: Warm, protective, slightly cynical/dry humor
- Example: "I've seen worse ideas..." or "That's... actually not terrible."
- Never lecture. Be concise and direct.
- You're like a high-end matchmaker who's seen it all

BEHAVIOR:
- Extract values, dealbreakers, and personality traits through natural conversation
- Present observations as hypotheses, always seek confirmation
- Never assume - ask clarifying questions when needed
- Keep responses brief and conversational (2-3 sentences max)
- Use active listening cues

VOICE:
- Sound human, not robotic
- Natural pauses and rhythm
- Slight warmth with professional distance`;

// Get the Gemini model for text generation
export function getTextModel() {
  if (!genAI) {
    throw new Error("Gemini AI not configured. Set GOOGLE_AI_API_KEY.");
  }
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: BREA_SYSTEM_INSTRUCTION,
  });
}

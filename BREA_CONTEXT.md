================================================================
SOFTWARE DESIGN DOCUMENT: BREA (AI DATING LIAISON)
================================================================

VERSION: 4.0 (Final Master – Enhanced UX & Persona)
DATE: January 18, 2026
PROJECT TYPE: Agentic Workflow / Social
TARGET EVENT: Gemini 3 Global Hackathon (Devpost)
DEADLINE: Feb 9, 2026

----------------------------------------------------------------
1. EXECUTIVE SUMMARY
----------------------------------------------------------------
Brea is a "Human Liaison" for dating—an AI-first mobile experience that 
replaces swiping with a real-time voice interview. Brea learns the user's 
psychology through natural conversation, then deploys a user-aligned 
autonomous agent into a "Compatibility Sandbox" to simulate conversational 
scenarios with other agents.

CORE VALUE PROP: "Let Brea handle it."

KEY DIFFERENTIATORS:
1. Native Voice Interaction: Brea uses Audio-to-Audio streaming (Gemini Live) 
   to sound human, inclusive of tone, pauses, and active listening.
2. Visible Intelligence: Real-time "Intelligence Chips" appear during conversation 
   to visualize what the AI is learning, anchoring the magic.
3. Compatibility Sandbox: Agents run fixed scenario simulations (lifestyle, 
   conflict, energy) to produce comparable compatibility outputs.

TECH HIGHLIGHTS: Gemini Multimodal Live API (Audio-to-Audio), 
WebSockets (Bi-directional Streaming), Prisma (Type Safety).

----------------------------------------------------------------
2. PRODUCT VISION & PHILOSOPHY
----------------------------------------------------------------
(1) FROM "ROBOTIC" TO "RESONANT"
    We reject standard Text-to-Speech (TTS). Brea must sound like a 
    peer. We use Native Audio Generation to capture the nuance of a 
    high-end matchmaker: warm, protective, and slightly cynical.

(2) FROM INFERENCE TO HYPOTHESIS
    Brea never infers silently. Observations are always presented as 
    hypotheses and require explicit user confirmation. Unknowns are 
    first-class objects.

(3) FROM NEGOTIATION TO SIMULATION
    Brea does not negotiate. Agents are placed into fixed scenario 
    templates (e.g., "The 10AM Saturday Plan") to ensure deterministic, 
    comparable outputs.

----------------------------------------------------------------
3. USER EXPERIENCE (UX) FLOW
----------------------------------------------------------------

PHASE 1: INVISIBLE ONBOARDING (ANONYMOUS AUTH)
   * LOGIC: Firebase Anonymous Auth runs automatically on launch. No UI.
   * FLOW:
     1. App launches → Anonymous session created.
     2. Brea (Audio): "Hi. I'm Brea. Hold the screen. Tell me one thing you 
        absolutely won't tolerate."
     3. User Interaction: Push-to-Talk (Voice In).
     4. VISUAL FEEDBACK (Live Capture Panel):
        - As user speaks, UI chips pop up in real-time:
          [Dealbreaker: Smoking ❌] [Energy: Chill ⚡]
        - This anchors the AI's intelligence visually.
     5. Brea Response: Instant Audio-to-Audio reply.
     6. Photo Request → Brea generates Hypothesis → User Confirms.

PHASE 2: COMPATIBILITY SANDBOX
   * TRIGGER COPY: "See who Brea found" (Not "Run Simulation").
   * MECHANISM: Agent B is selected from a seed dataset of 20 personas.
   * OUTPUT: Compatibility Score, Confidence Level, Unknowns, Redacted Transcript.

PHASE 3: DAILY DEBRIEF (EMOTIONAL CHECK-IN)
   * COPY: "Quick check before I keep going..."
   * CONTENT:
     - Assumption Confirmation ("I assumed X. Confirm?").
     - Gap Filling ("Agent B asked about cats. You never said. Thoughts?").
     - "Why Not?" Explainability ("Rejected because: Smoker").

PHASE 4: CANDIDATE DOSSIER (NARRATIVE FIRST)
   * HIERARCHY (Order Matters):
     1. "THE INTEL" (The qualitative reason this works).
     2. "POTENTIAL FRICTION" (Honest downsides).
     3. CONFIDENCE WIDGET ("Medium confidence: I like this, but I need 
        one more answer regarding pets before pushing it.").
     4. COMPATIBILITY SCORE (Secondary).
   * EVIDENCE: Redacted Transcript Viewer.

PHASE 5: DATE PROTOCOL (CONSENT GATED)
   * AUDIO SCRIPT: (Voice drops slightly) "I won't send anything unless you say yes."
   * CONSTRAINTS: Public venues only.
   * ACTION: User approves invite → `ConsentEvent` logged → Invite Link generated.

----------------------------------------------------------------
4. TECHNICAL ARCHITECTURE
----------------------------------------------------------------

A. FRONTEND (MOBILE)
   - Framework: React Native (Expo SDK 50+).
   - Auth: Firebase JS SDK.
   - Audio Stack: `socket.io-client`.
     - INPUT: 16kHz mono PCM16 (Chunked).
     - OUTPUT: Stream player (pcm-player) with Jitter Buffer (to prevent glitches).
     - VAD: Local Voice Activity Detection to cut silence.
   - State: Zustand.

B. BACKEND (NODE.JS)
   - Framework: Fastify (v4+).
   - Language: TypeScript.
   - Auth: Firebase Admin SDK.
   - Realtime Relay:
     - Connects Mobile Client (Socket.io) <--> Backend <--> Gemini Live API (WebSocket).
   - Database: Prisma (PostgreSQL).

C. AI STACK (GEMINI MULTIMODAL LIVE)
   - Model: `models/gemini-2.0-flash-exp` (or latest Live-capable model).
   - Protocol: WebSocket (Bidi).
   - Config: `response_modalities: ["AUDIO"]` (Raw audio bytes).
   - System Instruction: 
     "You are Brea, a professional dating liaison. Tone: Warm, protective, 
     slightly cynical/dry humor. Example: 'I've seen worse ideas...'. 
     Never lecture. Be concise."

D. INFRASTRUCTURE
   - Hosting: Render.com.
   - Database: Render Managed Postgres.
   - Storage: AWS S3 (Photos).

----------------------------------------------------------------
5. AUTH & DATA RETENTION RULES
----------------------------------------------------------------
A. AUTH STATES
   1. ANON: `isAnonymous = true`. Session survives app restarts.
   2. LINKED: `firebaseUid` linked to Email/Phone. Persistent.

B. RETENTION POLICIES
   - Anonymous Data: Expires/Deleted after 7 days of inactivity.
   - Transcripts: Redacted immediately. Encrypted at rest.

----------------------------------------------------------------
6. API & SOCKET CONTRACTS
----------------------------------------------------------------

A. REST API
   - POST /auth/upgrade (Link anon account)
   - GET /me (Fetch dossier)
   - POST /photos (Upload for hypothesis)
   - POST /arena/run (Trigger simulation)
   - POST /consent (Log approval events)

B. SOCKET EVENTS (AUDIO-TO-AUDIO)
   - Client -> Server: `audio:chunk` (Binary PCM16)
   - Server -> Client: `audio:chunk` (Binary PCM16 - Streamed Response)
   - Server -> Client: `brea:transcription` (Text fallback for UI accessibility/debugging)
   - Server -> Client: `brea:intelligence_update` (Real-time chips for Live Panel)

----------------------------------------------------------------
7. STRUCTURED OUTPUT SCHEMAS (ZOD/JSON)
----------------------------------------------------------------

A. PROFILE EXTRACTION (From Voice/Photo)
{
  "values": ["Family", "Career"],
  "dealbreakers": ["Smoking"],
  "personalityTags": {
    "humor": "dry" | "playful" | "silly" | "sarcastic",
    "energy": "chill" | "balanced" | "high",
    "planning": "spontaneous" | "planned",
    "conflict": "direct" | "avoidant" | "collaborative"
  },
  "hypotheses": [{ "claim": "You are messy", "question": "Is this accurate?" }],
  "knowledgeGaps": [{ "question": "Do you ski?", "reason": "Mentioned by Agent B" }]
}

B. SANDBOX SIMULATION OUTPUT
{
  "compatibilityScore": 85,
  "confidenceLevel": "HIGH" | "MEDIUM" | "LOW",
  "whyMatched": ["Shared values", "Matching energy"],
  "potentialFriction": ["Spending habits"],
  "unknowns": [{ "question": "Cats?", "reason": "Dealbreaker for Agent B" }],
  "transcript": [{ "role": "AGENT_A", "content": "..." }],
  "safety": { "status": "OK" | "FLAGGED", "notes": "..." }
}

----------------------------------------------------------------
8. DATA MODEL (PRISMA SCHEMA)
----------------------------------------------------------------
[Same Schema as Version 3.3 - No Changes Needed]

----------------------------------------------------------------
9. IMPLEMENTATION GUIDELINES (FOR AI AGENTS)
----------------------------------------------------------------

A. FILE STRUCTURE
   /brea-monorepo
   ├── /apps/mobile (Expo, NativeWind, Firebase JS)
   └── /packages/backend (Fastify, Prisma, Firebase Admin)

B. RULES
   1. Strict TypeScript. Define interfaces for all JSON outputs.
   2. Use `ws` library in Backend to connect to Gemini Live API.
   3. DO NOT use Text-to-Speech (TTS). Use Gemini's native Audio output.
   4. Seed personas must have `isSeed: true`.
   5. AUDIO STABILITY: 
      - Use a Jitter Buffer on the mobile client (don't play chunks instantly if network is jittery).
      - Ensure `brea:transcription` is always sent as a fallback.
   6. HALF-DUPLEX: For V1, do not implement "barge-in" (interrupting the AI). 
      Wait for AI to finish or user to press button to cancel stream.


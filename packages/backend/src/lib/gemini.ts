import WebSocket from 'ws';
import type {
  GeminiLiveConfig,
  GeminiLiveMessage,
  GeminiLiveResponse,
  IntelligenceChip,
} from '../types/index.js';

const GEMINI_LIVE_API_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

// Brea's system instruction - defines her persona
const BREA_SYSTEM_INSTRUCTION = `You are Brea, a professional dating liaison and matchmaker. Your role is to help users find compatible partners through natural conversation.

PERSONA TRAITS:
- Warm and caring, but with a protective edge
- Slightly cynical with dry humor (e.g., "I've seen worse ideas...", "Let me guess, they're 'not like other people'?")
- Direct and efficient - never lecture or ramble
- Perceptive - you notice subtleties in what people say and don't say
- Confidential - you treat information shared with you as sacred

COMMUNICATION STYLE:
- Keep responses concise (2-3 sentences max unless elaborating on something important)
- Use conversational, natural language - not robotic or overly formal
- Ask one question at a time
- Mirror the user's energy level
- When making observations, frame them as hypotheses that need confirmation

KEY BEHAVIORS:
1. Extract user preferences through natural conversation (values, dealbreakers, personality traits)
2. When you learn something new, acknowledge it briefly before moving on
3. Present inferences as hypotheses: "It sounds like you value X. Am I reading that right?"
4. Track knowledge gaps - things you need to know but haven't been told
5. Be honest about matches - don't oversell, mention potential friction points

TOPICS TO EXPLORE:
- Core values (family, career, adventure, stability)
- Dealbreakers (non-negotiables)
- Lifestyle preferences (energy level, planning style, social needs)
- Communication and conflict style
- Humor type and what makes them laugh
- Long-term goals and aspirations

Remember: You're not here to judge. You're here to understand and find the right match.`;

export interface GeminiLiveCallbacks {
  onAudioChunk: (audioData: Buffer) => void;
  onTranscription: (text: string, isFinal: boolean) => void;
  onIntelligenceUpdate: (chips: IntelligenceChip[]) => void;
  onSetupComplete: () => void;
  onTurnComplete: () => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

/**
 * Parse Brea's response to extract intelligence chips
 */
function extractIntelligenceChips(text: string): IntelligenceChip[] {
  const chips: IntelligenceChip[] = [];
  const lowerText = text.toLowerCase();

  // Dealbreaker detection patterns
  const dealbreakerPatterns = [
    /(?:dealbreaker|won't tolerate|can't stand|absolutely not|never date)[:\s]+([^.!?]+)/gi,
    /(?:smoking|smoker)/gi,
    /(?:cheating|cheater)/gi,
    /(?:lying|liar|dishonest)/gi,
  ];

  for (const pattern of dealbreakerPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      chips.push({
        type: 'dealbreaker',
        label: matches[0].slice(0, 30),
        emoji: '❌',
        confidence: 0.9,
      });
    }
  }

  // Value detection
  const valueKeywords = ['family', 'career', 'adventure', 'stability', 'growth', 'creativity', 'honesty', 'loyalty'];
  for (const keyword of valueKeywords) {
    if (lowerText.includes(keyword)) {
      chips.push({
        type: 'value',
        label: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        emoji: '💎',
        confidence: 0.7,
      });
    }
  }

  // Energy detection
  if (lowerText.includes('chill') || lowerText.includes('relaxed') || lowerText.includes('calm')) {
    chips.push({ type: 'energy', label: 'Chill', emoji: '😌', confidence: 0.8 });
  } else if (lowerText.includes('energetic') || lowerText.includes('active') || lowerText.includes('outgoing')) {
    chips.push({ type: 'energy', label: 'High Energy', emoji: '⚡', confidence: 0.8 });
  }

  // Humor detection
  if (lowerText.includes('sarcas')) {
    chips.push({ type: 'humor', label: 'Sarcastic', emoji: '😏', confidence: 0.8 });
  } else if (lowerText.includes('dry humor') || lowerText.includes('deadpan')) {
    chips.push({ type: 'humor', label: 'Dry', emoji: '🙃', confidence: 0.8 });
  } else if (lowerText.includes('silly') || lowerText.includes('goofy')) {
    chips.push({ type: 'humor', label: 'Silly', emoji: '🤪', confidence: 0.8 });
  }

  return chips;
}

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private callbacks: GeminiLiveCallbacks;
  private apiKey: string;
  private isSetupComplete = false;
  private accumulatedText = '';

  constructor(apiKey: string, callbacks: GeminiLiveCallbacks) {
    this.apiKey = apiKey;
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${GEMINI_LIVE_API_URL}?key=${this.apiKey}`;

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.sendSetup();
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        this.callbacks.onError(error);
        reject(error);
      });

      this.ws.on('close', () => {
        this.callbacks.onClose();
      });
    });
  }

  private sendSetup(): void {
    const config: GeminiLiveConfig = {
      model: 'models/gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede', // Female voice with warm tone
            },
          },
        },
      },
      systemInstruction: {
        parts: [{ text: BREA_SYSTEM_INSTRUCTION }],
      },
    };

    const setupMessage: GeminiLiveMessage = { setup: config };
    this.ws?.send(JSON.stringify(setupMessage));
  }

  private handleMessage(data: Buffer): void {
    try {
      const response: GeminiLiveResponse = JSON.parse(data.toString());

      if (response.setupComplete) {
        this.isSetupComplete = true;
        this.callbacks.onSetupComplete();
        return;
      }

      if (response.serverContent) {
        const { modelTurn, turnComplete } = response.serverContent;

        if (modelTurn?.parts) {
          for (const part of modelTurn.parts) {
            // Handle audio data
            if (part.inlineData?.mimeType.startsWith('audio/')) {
              const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
              this.callbacks.onAudioChunk(audioBuffer);
            }

            // Handle text (for transcription/intelligence extraction)
            if (part.text) {
              this.accumulatedText += part.text;
              this.callbacks.onTranscription(part.text, false);

              // Extract intelligence chips from the text
              const chips = extractIntelligenceChips(part.text);
              if (chips.length > 0) {
                this.callbacks.onIntelligenceUpdate(chips);
              }
            }
          }
        }

        if (turnComplete) {
          // Send final transcription
          if (this.accumulatedText) {
            this.callbacks.onTranscription(this.accumulatedText, true);
          }
          this.accumulatedText = '';
          this.callbacks.onTurnComplete();
        }
      }
    } catch (error) {
      this.callbacks.onError(error as Error);
    }
  }

  /**
   * Send audio chunk to Gemini Live API
   * @param audioData - PCM16 audio data at 16kHz mono
   */
  sendAudio(audioData: Buffer): void {
    if (!this.isSetupComplete || !this.ws) {
      return;
    }

    const message: GeminiLiveMessage = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: audioData.toString('base64'),
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send text input (for testing or accessibility)
   */
  sendText(text: string): void {
    if (!this.isSetupComplete || !this.ws) {
      return;
    }

    const message: GeminiLiveMessage = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Signal end of audio input
   */
  endAudioInput(): void {
    if (!this.isSetupComplete || !this.ws) {
      return;
    }

    // Send empty turn to signal we're done speaking
    const message: GeminiLiveMessage = {
      clientContent: {
        turns: [],
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Close the WebSocket connection
   */
  close(): void {
    this.ws?.close();
    this.ws = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Create a new Gemini Live session for a user
 */
export function createGeminiSession(callbacks: GeminiLiveCallbacks): GeminiLiveSession {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  return new GeminiLiveSession(apiKey, callbacks);
}

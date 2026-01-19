import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { verifyToken } from '../lib/firebase.js';
import { prisma } from '../lib/prisma.js';
import { createGeminiSession, GeminiLiveSession } from '../lib/gemini.js';
import {
  updateProfileFromExtraction,
  chipsToProfileExtraction,
} from '../services/profile.js';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  IntelligenceChip,
} from '../types/index.js';

interface SocketData {
  userId: string;
  firebaseUid: string;
  sessionId: string;
  geminiSession: GeminiLiveSession | null;
  accumulatedChips: IntelligenceChip[];
}

type BreaSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/**
 * Initialize Socket.io server for audio streaming
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: BreaSocket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Initialize socket data
    socket.data.accumulatedChips = [];

    // Handle session start (authentication)
    socket.on('session:start', async (data) => {
      try {
        const { firebaseToken } = data;

        // Verify Firebase token
        const decodedToken = await verifyToken(firebaseToken);
        const firebaseUid = decodedToken.uid;

        // Get or create user
        let user = await prisma.user.findUnique({
          where: { firebaseUid },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              firebaseUid,
              isAnonymous: true,
            },
          });
        }

        // Create session record
        const session = await prisma.session.create({
          data: {
            userId: user.id,
          },
        });

        // Store user info in socket data
        socket.data.userId = user.id;
        socket.data.firebaseUid = firebaseUid;
        socket.data.sessionId = session.id;

        // Initialize Gemini Live session
        const geminiSession = createGeminiSession({
          onAudioChunk: (audioData) => {
            socket.emit('audio:chunk', audioData);
          },
          onTranscription: (text, isFinal) => {
            socket.emit('brea:transcription', { text, isFinal });
          },
          onIntelligenceUpdate: async (chips) => {
            // Accumulate chips
            socket.data.accumulatedChips.push(...chips);

            // Emit to client for real-time UI
            socket.emit('brea:intelligence_update', { chips });

            // Update session record
            await prisma.session.update({
              where: { id: session.id },
              data: {
                chips: socket.data.accumulatedChips,
              },
            });
          },
          onSetupComplete: () => {
            socket.emit('brea:session_start', { sessionId: session.id });

            // Send initial greeting (Brea's opening line)
            // This would trigger Gemini to speak the opening
            geminiSession.sendText(
              "Start the conversation with your opening line: 'Hi. I'm Brea. Hold the screen. Tell me one thing you absolutely won't tolerate.'"
            );
          },
          onTurnComplete: async () => {
            // When a turn completes, persist accumulated intelligence to profile
            if (socket.data.accumulatedChips.length > 0) {
              const extraction = chipsToProfileExtraction(socket.data.accumulatedChips);
              await updateProfileFromExtraction(user!.id, extraction);
            }
          },
          onError: (error) => {
            console.error(`[Gemini] Error for user ${user?.id}:`, error);
            socket.emit('brea:error', {
              code: 'GEMINI_ERROR',
              message: 'Voice processing error. Please try again.',
            });
          },
          onClose: () => {
            console.log(`[Gemini] Session closed for user ${user?.id}`);
          },
        });

        // Connect to Gemini
        await geminiSession.connect();
        socket.data.geminiSession = geminiSession;

        console.log(`[Socket] Session started for user ${user.id}`);
      } catch (error) {
        console.error('[Socket] Session start error:', error);
        socket.emit('brea:error', {
          code: 'AUTH_ERROR',
          message: 'Failed to authenticate. Please try again.',
        });
      }
    });

    // Handle incoming audio chunks
    socket.on('audio:chunk', (data) => {
      const geminiSession = socket.data.geminiSession;
      if (!geminiSession) {
        socket.emit('brea:error', {
          code: 'NO_SESSION',
          message: 'No active session. Please start a session first.',
        });
        return;
      }

      // Forward audio to Gemini
      geminiSession.sendAudio(data);
    });

    // Handle end of audio input (user stopped speaking)
    socket.on('audio:end', () => {
      const geminiSession = socket.data.geminiSession;
      if (geminiSession) {
        geminiSession.endAudioInput();
      }
    });

    // Handle session end
    socket.on('session:end', async () => {
      await cleanupSession(socket);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      await cleanupSession(socket);
    });
  });

  return io;
}

/**
 * Cleanup session resources
 */
async function cleanupSession(socket: BreaSocket): Promise<void> {
  const { geminiSession, sessionId, userId, accumulatedChips } = socket.data;

  // Close Gemini connection
  if (geminiSession) {
    geminiSession.close();
    socket.data.geminiSession = null;
  }

  // Update session record
  if (sessionId) {
    try {
      // Persist final chips to profile
      if (userId && accumulatedChips.length > 0) {
        const extraction = chipsToProfileExtraction(accumulatedChips);
        await updateProfileFromExtraction(userId, extraction);
      }

      // Mark session as ended
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endedAt: new Date(),
          chips: accumulatedChips,
        },
      });
    } catch (error) {
      console.error('[Socket] Session cleanup error:', error);
    }
  }

  socket.emit('brea:session_end', { reason: 'Session ended' });
}

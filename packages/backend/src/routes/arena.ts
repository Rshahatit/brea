import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import {
  runCompatibilitySimulation,
  selectMatchCandidate,
} from '../services/sandbox.js';
import { getOrCreateProfile } from '../services/profile.js';

const ArenaRunSchema = z.object({
  targetPersonaId: z.string().optional(),
});

export async function arenaRoutes(fastify: FastifyInstance) {
  /**
   * POST /arena/run
   * Run a compatibility simulation
   */
  fastify.post(
    '/arena/run',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Body: { targetPersonaId?: string } }>,
      reply: FastifyReply
    ) => {
      const userId = request.userId!;

      const parsed = ArenaRunSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parsed.error.errors[0].message,
        });
      }

      try {
        // Get user's profile
        const userProfile = await getOrCreateProfile(userId);

        if (userProfile.values.length === 0 && userProfile.dealbreakers.length === 0) {
          return reply.status(400).send({
            error: 'Profile Incomplete',
            message: 'Please complete your profile by talking to Brea first',
          });
        }

        // Select a match candidate
        const targetPersona = await selectMatchCandidate(
          userId,
          parsed.data.targetPersonaId
        );

        if (!targetPersona) {
          return reply.status(404).send({
            error: 'No Candidates',
            message: 'No available candidates for matching. Please try again later.',
          });
        }

        // Run the simulation
        const result = await runCompatibilitySimulation(
          {
            values: userProfile.values,
            dealbreakers: userProfile.dealbreakers,
            personalityTags: (userProfile.personalityTags as Record<string, string>) || {},
          },
          {
            values: targetPersona.values,
            dealbreakers: targetPersona.dealbreakers,
            personalityTags: targetPersona.personalityTags,
            displayName: targetPersona.displayName,
          }
        );

        // Create match record
        const match = await prisma.match.create({
          data: {
            userId,
            matchedWithId: targetPersona.id,
            compatibilityScore: result.compatibilityScore,
            confidenceLevel: result.confidenceLevel,
            whyMatched: result.whyMatched,
            potentialFriction: result.potentialFriction,
            unknowns: result.unknowns,
            transcript: result.transcript,
            safetyStatus: result.safety.status,
            safetyNotes: result.safety.notes,
          },
        });

        return reply.send({
          matchId: match.id,
          result,
          targetPersona: {
            id: targetPersona.id,
            displayName: targetPersona.displayName,
            photoUrl: targetPersona.photoUrl,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Simulation Failed',
          message,
        });
      }
    }
  );

  /**
   * GET /arena/matches
   * Get user's match history
   */
  fastify.get(
    '/arena/matches',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId!;

      try {
        const matches = await prisma.match.findMany({
          where: { userId },
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
            consentEvent: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return reply.send({
          matches: matches.map((m) => ({
            id: m.id,
            compatibilityScore: m.compatibilityScore,
            confidenceLevel: m.confidenceLevel,
            whyMatched: m.whyMatched,
            potentialFriction: m.potentialFriction,
            unknowns: m.unknowns,
            status: m.status,
            matchedWith: {
              displayName: m.matchedWith.profile?.displayName || 'Anonymous',
              photoUrl: m.matchedWith.profile?.photoUrl,
            },
            consent: m.consentEvent
              ? {
                  action: m.consentEvent.action,
                  inviteLink: m.consentEvent.inviteLink,
                }
              : null,
            createdAt: m.createdAt,
          })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Fetch Failed',
          message,
        });
      }
    }
  );

  /**
   * GET /arena/matches/:matchId
   * Get detailed match info (including redacted transcript)
   */
  fastify.get(
    '/arena/matches/:matchId',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { matchId: string } }>,
      reply: FastifyReply
    ) => {
      const userId = request.userId!;
      const { matchId } = request.params;

      try {
        const match = await prisma.match.findFirst({
          where: {
            id: matchId,
            userId,
          },
          include: {
            matchedWith: {
              include: {
                profile: {
                  select: {
                    displayName: true,
                    photoUrl: true,
                    values: true,
                  },
                },
              },
            },
          },
        });

        if (!match) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Match not found',
          });
        }

        return reply.send({
          id: match.id,
          compatibilityScore: match.compatibilityScore,
          confidenceLevel: match.confidenceLevel,
          whyMatched: match.whyMatched,
          potentialFriction: match.potentialFriction,
          unknowns: match.unknowns,
          transcript: match.transcript,
          status: match.status,
          safetyStatus: match.safetyStatus,
          matchedWith: {
            displayName: match.matchedWith.profile?.displayName || 'Anonymous',
            photoUrl: match.matchedWith.profile?.photoUrl,
            values: match.matchedWith.profile?.values || [],
          },
          createdAt: match.createdAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Fetch Failed',
          message,
        });
      }
    }
  );
}

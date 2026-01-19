import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const ConsentRequestSchema = z.object({
  matchId: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
});

export async function consentRoutes(fastify: FastifyInstance) {
  /**
   * POST /consent
   * Log consent event for a match
   */
  fastify.post(
    '/consent',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Body: { matchId: string; action: 'APPROVE' | 'REJECT' } }>,
      reply: FastifyReply
    ) => {
      const userId = request.userId!;

      const parsed = ConsentRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parsed.error.errors[0].message,
        });
      }

      const { matchId, action } = parsed.data;

      try {
        // Verify the match belongs to this user
        const match = await prisma.match.findFirst({
          where: {
            id: matchId,
            userId,
          },
        });

        if (!match) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Match not found',
          });
        }

        // Check for existing consent event
        const existingConsent = await prisma.consentEvent.findUnique({
          where: { matchId },
        });

        if (existingConsent) {
          return reply.status(400).send({
            error: 'Already Processed',
            message: 'Consent has already been recorded for this match',
          });
        }

        // Check safety status
        if (match.safetyStatus === 'FLAGGED' && action === 'APPROVE') {
          return reply.status(400).send({
            error: 'Safety Concern',
            message: 'This match has been flagged for safety review. Approval is not available.',
          });
        }

        // Generate invite link if approved
        let inviteLink: string | undefined;
        let inviteExpiry: Date | undefined;

        if (action === 'APPROVE') {
          // Generate secure invite link (expires in 7 days)
          const inviteToken = randomUUID();
          inviteLink = `${process.env.APP_URL || 'https://brea.app'}/invite/${inviteToken}`;
          inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        // Create consent event
        const consentEvent = await prisma.consentEvent.create({
          data: {
            userId,
            matchId,
            action,
            inviteLink,
            inviteExpiry,
          },
        });

        // Update match status
        await prisma.match.update({
          where: { id: matchId },
          data: {
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          },
        });

        return reply.send({
          success: true,
          inviteLink: consentEvent.inviteLink,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Consent Failed',
          message,
        });
      }
    }
  );

  /**
   * GET /consent/:matchId
   * Get consent status for a match
   */
  fastify.get(
    '/consent/:matchId',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { matchId: string } }>,
      reply: FastifyReply
    ) => {
      const userId = request.userId!;
      const { matchId } = request.params;

      try {
        const consentEvent = await prisma.consentEvent.findFirst({
          where: {
            matchId,
            userId,
          },
        });

        if (!consentEvent) {
          return reply.send({
            hasConsent: false,
          });
        }

        return reply.send({
          hasConsent: true,
          action: consentEvent.action,
          inviteLink: consentEvent.inviteLink,
          inviteExpiry: consentEvent.inviteExpiry,
          createdAt: consentEvent.createdAt,
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

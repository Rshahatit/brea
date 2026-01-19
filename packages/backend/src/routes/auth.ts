import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { linkAnonymousAccount } from '../lib/firebase.js';
import { authMiddleware } from '../middleware/auth.js';

const UpgradeRequestSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/upgrade
   * Link anonymous account to email/phone
   */
  fastify.post(
    '/auth/upgrade',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Body: { email?: string; phone?: string } }>,
      reply: FastifyReply
    ) => {
      const userId = request.userId!;
      const firebaseUid = request.firebaseUid!;

      // Validate request
      const parsed = UpgradeRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parsed.error.errors[0].message,
        });
      }

      const { email, phone } = parsed.data;

      try {
        // Check if already linked
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user?.isAnonymous) {
          return reply.status(400).send({
            error: 'Already Linked',
            message: 'This account is already linked to an identity',
          });
        }

        // Link in Firebase (email only for now)
        if (email) {
          await linkAnonymousAccount(firebaseUid, email);
        }

        // Update our database
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            email,
            phone,
            isAnonymous: false,
          },
        });

        return reply.send({
          success: true,
          uid: updatedUser.id,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Upgrade Failed',
          message,
        });
      }
    }
  );

  /**
   * GET /auth/status
   * Get current auth status
   */
  fastify.get(
    '/auth/status',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        authenticated: true,
        userId: request.userId,
        isAnonymous: request.isAnonymous,
      });
    }
  );
}

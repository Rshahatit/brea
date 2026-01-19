import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import {
  getUserDossier,
  updateProfileFromExtraction,
  confirmHypothesis,
  updateProfilePhoto,
} from '../services/profile.js';
import { ProfileExtractionSchema } from '../types/index.js';

const HypothesisConfirmSchema = z.object({
  claim: z.string(),
  confirmed: z.boolean(),
});

const PhotoUploadSchema = z.object({
  photoUrl: z.string().url(),
  analysis: z.record(z.unknown()).optional(),
});

export async function profileRoutes(fastify: FastifyInstance) {
  /**
   * GET /me
   * Get current user's dossier
   */
  fastify.get(
    '/me',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId!;

      try {
        const dossier = await getUserDossier(userId);
        return reply.send(dossier);
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
   * PATCH /me/profile
   * Update profile with extracted data
   */
  fastify.patch(
    '/me/profile',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Body: unknown }>,
      reply: FastifyReply
    ) => {
      const userId = request.userId!;

      const parsed = ProfileExtractionSchema.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parsed.error.errors[0].message,
        });
      }

      try {
        const profile = await updateProfileFromExtraction(userId, parsed.data);
        return reply.send({
          success: true,
          profile,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Update Failed',
          message,
        });
      }
    }
  );

  /**
   * POST /me/hypotheses/confirm
   * Confirm or reject a hypothesis
   */
  fastify.post(
    '/me/hypotheses/confirm',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Body: { claim: string; confirmed: boolean } }>,
      reply: FastifyReply
    ) => {
      const userId = request.userId!;

      const parsed = HypothesisConfirmSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parsed.error.errors[0].message,
        });
      }

      try {
        await confirmHypothesis(userId, parsed.data.claim, parsed.data.confirmed);
        return reply.send({ success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Confirmation Failed',
          message,
        });
      }
    }
  );

  /**
   * POST /photos
   * Upload photo and get analysis
   */
  fastify.post(
    '/photos',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Body: { photoUrl: string; analysis?: Record<string, unknown> } }>,
      reply: FastifyReply
    ) => {
      const userId = request.userId!;

      const parsed = PhotoUploadSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parsed.error.errors[0].message,
        });
      }

      try {
        const { photoUrl, analysis } = parsed.data;

        // Update profile with photo
        await updateProfilePhoto(userId, photoUrl, analysis);

        // Generate hypotheses from photo (placeholder - would use Gemini Vision)
        const hypotheses = [
          {
            claim: 'You enjoy outdoor activities',
            question: 'I noticed your photo seems outdoorsy. Is that accurate?',
          },
        ];

        return reply.send({
          photoUrl,
          hypotheses,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(500).send({
          error: 'Upload Failed',
          message,
        });
      }
    }
  );
}

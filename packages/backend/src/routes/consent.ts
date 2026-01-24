import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const consentSchema = z.object({
  eventType: z.enum([
    "profile_view",
    "transcript_view",
    "invite_sent",
    "invite_accepted",
    "date_scheduled",
  ]),
  targetUserId: z.string(),
  matchId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export async function consentRoutes(app: FastifyInstance) {
  // Log a consent event
  app.post("/consent", {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const body = consentSchema.parse(request.body);
      const user = request.user!;

      // Verify the match exists and user is a participant
      const match = await prisma.match.findFirst({
        where: {
          id: body.matchId,
          OR: [{ userAId: user.id }, { userBId: user.id }],
        },
      });

      if (!match) {
        return reply.status(404).send({
          error: "Match not found",
          code: "MATCH_NOT_FOUND",
        });
      }

      // Create consent event
      const event = await prisma.consentEvent.create({
        data: {
          userId: user.id,
          matchId: body.matchId,
          eventType: body.eventType,
          metadata: body.metadata as object | undefined,
        },
      });

      // Update match status based on event type
      if (body.eventType === "invite_sent") {
        await prisma.match.update({
          where: { id: body.matchId },
          data: { status: "INVITED" },
        });
      } else if (body.eventType === "invite_accepted") {
        await prisma.match.update({
          where: { id: body.matchId },
          data: { status: "ACCEPTED" },
        });
      } else if (body.eventType === "date_scheduled") {
        await prisma.match.update({
          where: { id: body.matchId },
          data: { status: "DATE_SCHEDULED" },
        });
      }

      return {
        success: true,
        eventId: event.id,
      };
    },
  });
}

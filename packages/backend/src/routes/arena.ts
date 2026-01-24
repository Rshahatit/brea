import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { runSandboxSimulation } from "../services/sandbox.js";

const runArenaSchema = z.object({
  targetPersonaId: z.string().optional(),
});

export async function arenaRoutes(app: FastifyInstance) {
  // Run compatibility sandbox simulation
  app.post("/arena/run", {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const body = runArenaSchema.parse(request.body);
      const user = request.user!;

      // Get full user profile
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userProfile) {
        return reply.status(404).send({
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Find a seed persona to match against
      let targetPersona;
      if (body.targetPersonaId) {
        targetPersona = await prisma.user.findFirst({
          where: {
            id: body.targetPersonaId,
            isSeed: true,
          },
        });
      } else {
        // Random seed persona
        const seedPersonas = await prisma.user.findMany({
          where: { isSeed: true },
        });

        if (seedPersonas.length === 0) {
          return reply.status(400).send({
            error: "No seed personas available",
            code: "NO_PERSONAS",
          });
        }

        targetPersona =
          seedPersonas[Math.floor(Math.random() * seedPersonas.length)];
      }

      if (!targetPersona) {
        return reply.status(404).send({
          error: "Target persona not found",
          code: "PERSONA_NOT_FOUND",
        });
      }

      // Run the simulation
      const result = await runSandboxSimulation(userProfile, targetPersona);

      // Save the match
      const match = await prisma.match.create({
        data: {
          userAId: user.id,
          userBId: targetPersona.id,
          compatibilityScore: result.compatibilityScore,
          confidenceLevel: result.confidenceLevel,
          whyMatched: result.whyMatched,
          potentialFriction: result.potentialFriction,
          unknowns: result.unknowns,
          redactedTranscript: result.transcript,
          safety: result.safety,
          scenarioType: "LIFESTYLE_COMPATIBILITY",
        },
      });

      return {
        matchId: match.id,
        result,
        matchedProfile: {
          id: targetPersona.id,
          displayName: targetPersona.displayName,
          photoUrl: targetPersona.photoUrl,
        },
      };
    },
  });
}

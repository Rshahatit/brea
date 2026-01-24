import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

export async function profileRoutes(app: FastifyInstance) {
  // Get current user profile and matches
  app.get("/me", {
    preHandler: authMiddleware,
    handler: async (request) => {
      const user = request.user!;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          matchesAsA: {
            include: {
              userB: {
                select: {
                  id: true,
                  displayName: true,
                  photoUrl: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return {
        user: fullUser,
        matches: fullUser?.matchesAsA ?? [],
      };
    },
  });

  // Upload photo (placeholder - needs S3 integration)
  app.post("/photos", {
    preHandler: authMiddleware,
    handler: async (_request, reply) => {
      // TODO: Implement S3 upload and photo analysis
      return reply.status(501).send({
        error: "Photo upload not yet implemented",
        code: "NOT_IMPLEMENTED",
      });
    },
  });
}

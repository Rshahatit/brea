import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const upgradeSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  idToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // Upgrade anonymous account to permanent
  app.post("/auth/upgrade", {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const body = upgradeSchema.parse(request.body);
      const user = request.user!;

      if (!user.isAnonymous) {
        return reply.status(400).send({
          error: "Account already upgraded",
          code: "ALREADY_UPGRADED",
        });
      }

      // Update user with email/phone
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isAnonymous: false,
          email: body.email,
          phone: body.phone,
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    },
  });
}

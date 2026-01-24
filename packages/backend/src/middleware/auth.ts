import type { FastifyRequest, FastifyReply } from "fastify";
import { firebaseAuth } from "../lib/firebase.js";
import { prisma } from "../lib/prisma.js";

export interface AuthenticatedUser {
  id: string;
  firebaseUid: string;
  isAnonymous: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!firebaseAuth) {
    return reply.status(503).send({
      error: "Auth service not configured",
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({
      error: "Unauthorized",
      code: "MISSING_TOKEN",
    });
  }

  const token = authHeader.slice(7);

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user) {
      // Create new user (anonymous by default)
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          isAnonymous: decodedToken.firebase.sign_in_provider === "anonymous",
          email: decodedToken.email,
          phone: decodedToken.phone_number,
        },
      });
    }

    // Update last active timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    request.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      isAnonymous: user.isAnonymous,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return reply.status(401).send({
      error: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }
}

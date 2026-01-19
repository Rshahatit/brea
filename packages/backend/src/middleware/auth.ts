import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../lib/firebase.js';
import { prisma } from '../lib/prisma.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    firebaseUid?: string;
    isAnonymous?: boolean;
  }
}

/**
 * Authentication middleware - verifies Firebase token and attaches user info
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.slice(7);

  try {
    // Verify Firebase token
    const decodedToken = await verifyToken(token);
    const firebaseUid = decodedToken.uid;

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      // Create new user (anonymous by default)
      user = await prisma.user.create({
        data: {
          firebaseUid,
          isAnonymous: true,
        },
      });
    } else {
      // Update last active timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });
    }

    // Attach user info to request
    request.userId = user.id;
    request.firebaseUid = firebaseUid;
    request.isAnonymous = user.isAnonymous;
  } catch (error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Optional auth middleware - allows unauthenticated requests but attaches user if present
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return; // No auth, continue without user
  }

  const token = authHeader.slice(7);

  try {
    const decodedToken = await verifyToken(token);
    const firebaseUid = decodedToken.uid;

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (user) {
      request.userId = user.id;
      request.firebaseUid = firebaseUid;
      request.isAnonymous = user.isAnonymous;
    }
  } catch {
    // Invalid token, continue without user
  }
}

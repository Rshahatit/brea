import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@brea/shared";
import { firebaseAuth } from "../lib/firebase.js";
import { prisma } from "../lib/prisma.js";

export function setupSocketServer(httpServer: HttpServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: "*", // Configure for production
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    if (!firebaseAuth) {
      return next(new Error("Auth service not configured"));
    }

    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decodedToken = await firebaseAuth.verifyIdToken(token);

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            firebaseUid: decodedToken.uid,
            isAnonymous: decodedToken.firebase.sign_in_provider === "anonymous",
          },
        });
      }

      socket.data.userId = user.id;
      socket.data.sessionId = `session_${Date.now()}_${user.id}`;
      next();
    } catch (error) {
      console.error("Socket auth error:", error);
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.data.userId}`);

    // Note: Audio streaming is handled by Pipecat + Daily.co
    // This Socket.io connection is kept for future real-time features
    // (presence notifications, match alerts, etc.)

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.data.userId}`);
    });
  });

  return io;
}

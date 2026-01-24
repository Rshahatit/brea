import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { createServer } from "http";
import { authRoutes } from "./routes/auth.js";
import { profileRoutes } from "./routes/profile.js";
import { arenaRoutes } from "./routes/arena.js";
import { consentRoutes } from "./routes/consent.js";
import { setupSocketServer } from "./services/socket.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  const fastify = Fastify({
    logger: true,
  });

  // Create HTTP server for both Fastify and Socket.io
  const httpServer = createServer(fastify.server);

  // Register plugins
  await fastify.register(cors, {
    origin: true, // Configure for production
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  });

  // Health check
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(profileRoutes);
  await fastify.register(arenaRoutes);
  await fastify.register(consentRoutes);

  // Setup Socket.io
  setupSocketServer(httpServer);

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://${HOST}:${PORT}`);
    console.log(`Socket.io ready`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();

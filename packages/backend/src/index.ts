import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { createServer } from 'http';

import { authRoutes } from './routes/auth.js';
import { profileRoutes } from './routes/profile.js';
import { arenaRoutes } from './routes/arena.js';
import { consentRoutes } from './routes/consent.js';
import { initializeSocketServer } from './services/socket.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max for photos
    },
  });

  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(profileRoutes, { prefix: '' });
  await fastify.register(arenaRoutes, { prefix: '/arena' });
  await fastify.register(consentRoutes, { prefix: '' });

  // Create HTTP server for Socket.io
  const httpServer = createServer(fastify.server);

  // Initialize Socket.io for audio streaming
  const io = initializeSocketServer(httpServer);
  fastify.decorate('io', io);

  // Start server
  try {
    // We need to use the raw http server for Socket.io
    await fastify.ready();

    httpServer.listen(PORT, HOST, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██████╗ ███████╗ █████╗                            ║
║   ██╔══██╗██╔══██╗██╔════╝██╔══██╗                           ║
║   ██████╔╝██████╔╝█████╗  ███████║                           ║
║   ██╔══██╗██╔══██╗██╔══╝  ██╔══██║                           ║
║   ██████╔╝██║  ██║███████╗██║  ██║                           ║
║   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝                           ║
║                                                               ║
║   AI Dating Liaison - Backend Server                          ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║   Server running on: http://${HOST}:${PORT}                       ║
║   Socket.io: Enabled                                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[Server] Shutting down gracefully...');
    io.close();
    await fastify.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

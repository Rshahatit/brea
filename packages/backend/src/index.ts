import Fastify from 'fastify';
import { Server } from 'socket.io';
import { createServer } from 'http';

const fastify = Fastify({
    logger: true
});

// Create HTTP server manually to attach Socket.io
const httpServer = createServer(fastify.server);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    fastify.log.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        fastify.log.info(`Client disconnected: ${socket.id}`);
    });

    // Basic echo for testing
    socket.on('ping', () => {
        socket.emit('pong');
    });
});

fastify.get('/', async (request, reply) => {
    return { hello: 'world' };
});

const start = async () => {
    try {
        // Listen on the HTTP server, not fastify directly
        await new Promise<void>((resolve, reject) => {
            httpServer.listen(3000, '0.0.0.0', () => {
                resolve();
            });
        });
        fastify.log.info(`Server listening on http://0.0.0.0:3000`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

import { io, Socket } from 'socket.io-client';

// Replace with your machine's local IP for physical device testing
// For Android Emulator use 'http://10.0.2.2:3000'
// For iOS Simulator use 'http://localhost:3000'
const SOCKET_URL = 'http://localhost:3000';

class SocketService {
    public socket: Socket;

    constructor() {
        this.socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket'], // Force websocket to avoid polling issues on RN
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('pong', () => {
            console.log('Received pong from server');
        });
    }

    connect() {
        if (!this.socket.connected) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }

    ping() {
        this.socket.emit('ping');
    }
}

export const socketService = new SocketService();

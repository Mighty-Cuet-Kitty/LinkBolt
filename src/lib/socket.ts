import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('[Socket] New connection:', socket.id);

    socket.on('subscribe', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket] ${socket.id} subscribed to user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected:', socket.id);
    });
  });

  return io;
}

export function broadcastPresence(userId: string, presence: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('presence', presence);
}

export function broadcastSpotify(userId: string, playback: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('spotify', playback);
}

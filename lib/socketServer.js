import { Server } from 'socket.io';
import { jwtVerify } from 'jose';

let io = null;

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'secret'
);

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.userId;
  } catch {
    return null;
  }
}

export function initSocketServer(httpServer) {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return next(new Error('Invalid authentication token'));
    }

    socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected via WebSocket`);

    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}

export function emitNotificationToUser(userId, notification) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
}

export function emitNotificationToAll(notification) {
  if (io) {
    io.emit('notification', notification);
  }
}

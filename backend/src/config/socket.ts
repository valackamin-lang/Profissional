import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Profile from '../models/Profile';
import User from '../models/User';
import logger from './logger';

interface SocketUser {
  userId: string;
  profileId: string;
  socketId: string;
}

// Mapa de usuários conectados: userId -> socketId
const connectedUsers = new Map<string, string>();

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware de autenticação
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Token não fornecido'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };
      const profile = await Profile.findOne({ where: { userId: decoded.userId } });

      if (!profile) {
        return next(new Error('Perfil não encontrado'));
      }

      // Adicionar dados do usuário ao socket
      (socket as any).userId = decoded.userId;
      (socket as any).profileId = profile.id;

      next();
    } catch (error) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const profileId = (socket as any).profileId;

    logger.info('User connected', { userId, socketId: socket.id });

    // Registrar usuário como conectado
    connectedUsers.set(userId, socket.id);

    // Notificar outros usuários sobre a conexão
    socket.broadcast.emit('user:online', { userId, profileId });

    // Entrar em salas de chat específicas
    socket.on('chat:join', (chatId: string) => {
      socket.join(`chat:${chatId}`);
      logger.debug('User joined chat', { userId, chatId });
    });

    // Sair de salas de chat
    socket.on('chat:leave', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      logger.debug('User left chat', { userId, chatId });
    });

    // Marcar mensagens como lidas
    socket.on('messages:read', async (data: { chatId: string }) => {
      // Este evento será processado pelo controller
      socket.to(`chat:${data.chatId}`).emit('messages:read', {
        chatId: data.chatId,
        readBy: profileId,
      });
    });

    // Desconexão
    socket.on('disconnect', () => {
      logger.info('User disconnected', { userId, socketId: socket.id });
      connectedUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId, profileId });
    });
  });

  return io;
};

// Função auxiliar para obter socket ID de um usuário
export const getUserSocketId = (userId: string): string | undefined => {
  return connectedUsers.get(userId);
};

// Função auxiliar para verificar se usuário está online
export const isUserOnline = (userId: string): boolean => {
  return connectedUsers.has(userId);
};

// Exportar instância do io (será inicializada no app.ts)
export let io: SocketIOServer;

export const setIO = (socketIO: SocketIOServer) => {
  io = socketIO;
};

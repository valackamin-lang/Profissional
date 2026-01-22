import { Response, NextFunction } from 'express';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Profile from '../models/Profile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';
import { io } from '../config/socket';
import redis from '../config/redis';

// Criar ou obter chat existente
export const getOrCreateChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { participantId } = req.params;
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Verificar se chat já existe
    let chat = await Chat.findOne({
      where: {
        [Op.or]: [
          { participant1Id: profile.id, participant2Id: participantId },
          { participant1Id: participantId, participant2Id: profile.id },
        ],
      },
      include: [
        {
          model: Profile,
          as: 'participant1',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Profile,
          as: 'participant2',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    if (!chat) {
      // Criar novo chat
      chat = await Chat.create({
        participant1Id: profile.id,
        participant2Id: participantId,
        unreadCount1: 0,
        unreadCount2: 0,
      });

      // Buscar com includes
      chat = await Chat.findByPk(chat.id, {
        include: [
          {
            model: Profile,
            as: 'participant1',
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
          },
          {
            model: Profile,
            as: 'participant2',
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
          },
        ],
      });
    }

    res.json({
      success: true,
      data: { chat },
    });
  } catch (error) {
    next(error);
  }
};

// Obter chat específico
export const getChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { chatId } = req.params;
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const chat = await Chat.findOne({
      where: {
        id: chatId,
        [Op.or]: [
          { participant1Id: profile.id },
          { participant2Id: profile.id },
        ],
      },
      include: [
        {
          model: Profile,
          as: 'participant1',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Profile,
          as: 'participant2',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    if (!chat) {
      throw new AppError('Chat não encontrado ou acesso negado', 404);
    }

    // Adicionar informações do outro participante
    const chatData = chat.toJSON() as any;
    const otherParticipant =
      chat.participant1Id === profile.id ? chatData.participant2 : chatData.participant1;
    const unreadCount =
      chat.participant1Id === profile.id ? chat.unreadCount1 : chat.unreadCount2;

    const responseData = {
      ...chatData,
      otherParticipant,
      unreadCount,
    };

    res.json({
      success: true,
      data: { chat: responseData },
    });
  } catch (error) {
    next(error);
  }
};

// Listar chats do usuário
export const getChats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Tentar obter do cache
    const cacheKey = `chats:${profile.id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: JSON.parse(cached),
      });
      return;
    }

    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          { participant1Id: profile.id },
          { participant2Id: profile.id },
        ],
      },
      include: [
        {
          model: Profile,
          as: 'participant1',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Profile,
          as: 'participant2',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
      order: [['lastMessageAt', 'DESC']],
    });

    // Adicionar informações do outro participante
    const chatsWithOtherParticipant = chats.map((chat) => {
      const chatData = chat.toJSON() as any;
      const otherParticipant =
        chat.participant1Id === profile.id ? chatData.participant2 : chatData.participant1;
      const unreadCount =
        chat.participant1Id === profile.id ? chat.unreadCount1 : chat.unreadCount2;

      return {
        ...chatData,
        otherParticipant,
        unreadCount,
      };
    });

    const responseData = { chats: chatsWithOtherParticipant };

    // Cachear por 1 minuto
    await redis.setex(cacheKey, 60, JSON.stringify(responseData));

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// Obter mensagens de um chat
export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Verificar se usuário pertence ao chat
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        [Op.or]: [
          { participant1Id: profile.id },
          { participant2Id: profile.id },
        ],
      },
    });

    if (!chat) {
      throw new AppError('Chat não encontrado ou acesso negado', 404);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { chatId },
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'sender',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverter para ordem cronológica
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Enviar mensagem
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { chatId } = req.params;
    let { content, type = 'text', mediaUrl, fileName, fileSize } = req.body;

    // Processar arquivo se houver
    if (req.file) {
      mediaUrl = `/uploads/chat/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      
      // Determinar tipo baseado no mimetype
      if (req.file.mimetype.startsWith('image/')) {
        type = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        type = 'video';
      } else {
        type = 'file';
      }
    }

    if (!content || content.trim().length === 0) {
      if (!mediaUrl) {
        throw new AppError('Conteúdo da mensagem ou mídia é obrigatório', 400);
      }
      content = mediaUrl; // Se não houver texto, usar URL da mídia como conteúdo
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Verificar se usuário pertence ao chat
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        [Op.or]: [
          { participant1Id: profile.id },
          { participant2Id: profile.id },
        ],
      },
      include: [
        {
          model: Profile,
          as: 'participant1',
        },
        {
          model: Profile,
          as: 'participant2',
        },
      ],
    });

    if (!chat) {
      throw new AppError('Chat não encontrado ou acesso negado', 404);
    }

    // Criar mensagem
    const message = await Message.create({
      chatId,
      senderId: profile.id,
      content: content.trim(),
      type: type as Message['type'],
      mediaUrl,
      fileName,
      fileSize,
    });

    // Buscar mensagem com sender
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: Profile,
          as: 'sender',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    // Atualizar chat
    const isParticipant1 = chat.participant1Id === profile.id;
    const otherParticipantId = isParticipant1 ? chat.participant2Id : chat.participant1Id;

    await chat.update({
      lastMessageAt: new Date(),
      lastMessage: content.substring(0, 100),
      unreadCount1: isParticipant1 ? chat.unreadCount1 : chat.unreadCount1 + 1,
      unreadCount2: isParticipant1 ? chat.unreadCount2 + 1 : chat.unreadCount2,
    });

    // Invalidar cache
    await redis.del(`chats:${profile.id}`);
    await redis.del(`chats:${otherParticipantId}`);

    // Enviar via Socket.io para participantes do chat
    if (io) {
      io.to(`chat:${chatId}`).emit('message:new', messageWithSender);
      
      // Notificar o outro participante mesmo se não estiver na sala
      const otherParticipantProfile = await Profile.findByPk(otherParticipantId);
      if (otherParticipantProfile) {
        const otherUser = await User.findByPk(otherParticipantProfile.userId);
        if (otherUser) {
          io.emit('chat:new-message', {
            chatId,
            message: messageWithSender,
            unreadCount: isParticipant1 ? chat.unreadCount2 + 1 : chat.unreadCount1 + 1,
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: { message: messageWithSender },
    });
  } catch (error) {
    next(error);
  }
};

// Marcar mensagens como lidas
export const markMessagesAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { chatId } = req.params;
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Verificar se usuário pertence ao chat
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        [Op.or]: [
          { participant1Id: profile.id },
          { participant2Id: profile.id },
        ],
      },
    });

    if (!chat) {
      throw new AppError('Chat não encontrado ou acesso negado', 404);
    }

    // Marcar mensagens como lidas
    await Message.update(
      { readAt: new Date() },
      {
        where: {
          chatId,
          senderId: { [Op.ne]: profile.id },
          readAt: null as any,
        },
      }
    );

    // Atualizar contador de não lidas
    const isParticipant1 = chat.participant1Id === profile.id;
    await chat.update({
      unreadCount1: isParticipant1 ? 0 : chat.unreadCount1,
      unreadCount2: isParticipant1 ? chat.unreadCount2 : 0,
    });

    // Invalidar cache
    await redis.del(`chats:${profile.id}`);

    // Notificar via Socket.io
    if (io) {
      io.to(`chat:${chatId}`).emit('messages:read', {
        chatId,
        readBy: profile.id,
      });
    }

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas',
    });
  } catch (error) {
    next(error);
  }
};

// Deletar mensagem
export const deleteMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { messageId } = req.params;
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const message = await Message.findByPk(messageId);
    if (!message) {
      throw new AppError('Mensagem não encontrada', 404);
    }

    // Verificar se é o remetente
    if (message.senderId !== profile.id) {
      throw new AppError('Acesso negado', 403);
    }

    await message.destroy();

    // Notificar via Socket.io
    if (io) {
      io.to(`chat:${message.chatId}`).emit('message:deleted', {
        messageId,
        chatId: message.chatId,
      });
    }

    res.json({
      success: true,
      message: 'Mensagem deletada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from '../services/notificationService';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    const { notifications, total } = await getUserNotifications(
      userId,
      Number(page),
      Number(limit),
      unreadOnly === 'true'
    );

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    await markAsRead(id, userId);

    res.json({
      success: true,
      message: 'Notificação marcada como lida',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    await markAllAsRead(userId);

    res.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas',
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getCommissionStats,
  getCommissionHistory,
} from '../services/commissionService';
import Profile from '../models/Profile';
import { AppError } from '../utils/AppError';

export const getStats = async (
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

    if (profile.type !== 'MENTOR' && profile.type !== 'COMPANY') {
      throw new AppError('Apenas mentores e empresas podem ver comissões', 403);
    }

    const stats = await getCommissionStats(profile.id);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    if (profile.type !== 'MENTOR' && profile.type !== 'COMPANY') {
      throw new AppError('Apenas mentores e empresas podem ver histórico de comissões', 403);
    }

    const { payments, total } = await getCommissionHistory(profile.id, Number(page), Number(limit));

    res.json({
      success: true,
      data: {
        payments,
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

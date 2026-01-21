import { Response, NextFunction } from 'express';
import { generateTwoFactorSecret, enableTwoFactor, disableTwoFactor, verifyTwoFactorCode } from '../services/twoFactorService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';

export const generateSecret = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { secret, qrCode } = await generateTwoFactorSecret(userId);

    res.json({
      success: true,
      data: {
        secret,
        qrCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const enable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { token } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!token) {
      throw new AppError('Token 2FA é obrigatório', 400);
    }

    await enableTwoFactor(userId, token);

    res.json({
      success: true,
      message: '2FA habilitado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const disable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { token } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!token) {
      throw new AppError('Token 2FA é obrigatório', 400);
    }

    await disableTwoFactor(userId, token);

    res.json({
      success: true,
      message: '2FA desabilitado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const verify = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { token } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!token) {
      throw new AppError('Token 2FA é obrigatório', 400);
    }

    const { verifyTwoFactorCode: verifyCode } = await import('../services/twoFactorService');
    const User = (await import('../models/User')).default;

    const user = await User.findByPk(userId);
    if (!user || !user.twoFactorSecret) {
      throw new AppError('2FA não configurado', 400);
    }

    const isValid = verifyCode(user.twoFactorSecret, token);

    if (!isValid) {
      throw new AppError('Código 2FA inválido', 400);
    }

    res.json({
      success: true,
      message: 'Código 2FA válido',
    });
  } catch (error) {
    next(error);
  }
};

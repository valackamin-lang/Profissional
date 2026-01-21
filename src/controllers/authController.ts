import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import AuditLog from '../models/AuditLog';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, roleName = 'STUDENT' } = req.body;

    if (!email || !password) {
      throw new AppError('Email e senha são obrigatórios', 400);
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Usuário já existe', 409);
    }

    // Get role
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      throw new AppError('Role não encontrada', 404);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      roleId: role.id,
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Audit log
    await AuditLog.create({
      action: 'CREATE',
      resource: 'USER',
      resourceId: user.id,
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, twoFactorCode } = req.body;

    if (!email || !password) {
      throw new AppError('Email e senha são obrigatórios', 400);
    }

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      logger.warn(`Login attempt failed: User not found for email ${email}`);
      throw new AppError('Credenciais inválidas', 401);
    }

    logger.info(`Login attempt for user: ${user.email}, User ID: ${user.id}`);

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Login attempt failed: Invalid password for user ${user.email}`);
      throw new AppError('Credenciais inválidas', 401);
    }

    logger.info(`Password verified successfully for user: ${user.email}`);

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: 'Código 2FA necessário',
        });
        return;
      }

      // Verify 2FA code
      if (!user.twoFactorSecret) {
        throw new AppError('2FA não configurado corretamente', 500);
      }

      const { verifyTwoFactorCode } = await import('../services/twoFactorService');
      const isValid = verifyTwoFactorCode(user.twoFactorSecret, twoFactorCode);
      if (!isValid) {
        throw new AppError('Código 2FA inválido', 401);
      }
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Audit log
    await AuditLog.create({
      userId: user.id,
      action: 'LOGIN',
      resource: 'USER',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          role: user.role?.name,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token não fornecido', 400);
    }

    // Verify refresh token
    const { verifyRefreshToken } = await import('../utils/jwt');
    const decoded = verifyRefreshToken(token);

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || user.refreshToken !== token) {
      throw new AppError('Refresh token inválido', 401);
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save new refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        user.refreshToken = null;
        await user.save();

        // Audit log
        await AuditLog.create({
          userId,
          action: 'LOGOUT',
          resource: 'USER',
          resourceId: userId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password', 'refreshToken', 'twoFactorSecret'] },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
          role: user.role?.name,
          isEmailVerified: user.isEmailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

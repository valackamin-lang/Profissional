import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import AuditLog from '../models/AuditLog';
import { sendVerificationEmail, resendVerificationEmail, verifyEmailToken, sendPasswordResetEmail, verifyPasswordResetToken, clearPasswordResetToken } from '../services/emailService';

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

    // Get role - criar se não existir (fallback para garantir que roles básicas existam)
    let role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      // Tentar criar a role STUDENT se não existir
      if (roleName === 'STUDENT') {
        role = await Role.create({
          name: 'STUDENT',
          description: 'Estudante/Profissional',
        });
        logger.info(`Role STUDENT criada automaticamente durante registro`);
      } else {
        throw new AppError(`Role '${roleName}' não encontrada. Por favor, execute os seeders primeiro.`, 404);
      }
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

    // Enviar email de verificação (async, não bloquear resposta)
    sendVerificationEmail(user.id).catch((error) => {
      logger.error(`Erro ao enviar email de verificação para ${user.email}:`, error);
    });

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
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
        refreshToken,
        message: 'Conta criada com sucesso! Verifique seu email para ativar sua conta.',
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
        user.refreshToken = undefined;
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

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

/**
 * Verifica email usando token
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new AppError('Token de verificação é obrigatório', 400);
    }

    const user = await verifyEmailToken(token);

    // Audit log
    await AuditLog.create({
      userId: user.id,
      action: 'UPDATE',
      resource: 'USER',
      resourceId: user.id,
      details: { action: 'EMAIL_VERIFIED' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Email verificado com sucesso!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      },
    });
  } catch (error: any) {
    if (error.message.includes('Token') || error.message.includes('expirado')) {
      throw new AppError(error.message, 400);
    }
    next(error);
  }
};

/**
 * Reenvia email de verificação
 */
export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email é obrigatório', 400);
    }

    await resendVerificationEmail(email);

    res.json({
      success: true,
      message: 'Email de verificação reenviado com sucesso! Verifique sua caixa de entrada.',
    });
  } catch (error: any) {
    if (error.message.includes('já está verificado')) {
      throw new AppError(error.message, 400);
    }
    if (error.message.includes('não encontrado')) {
      throw new AppError('Usuário não encontrado', 404);
    }
    next(error);
  }
};

/**
 * Solicita recuperação de senha
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email é obrigatório', 400);
    }

    // Enviar email (não revela se o email existe ou não)
    await sendPasswordResetEmail(email);

    // Sempre retornar sucesso por segurança (não revelar se email existe)
    res.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Redefine senha usando token
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new AppError('Token e senha são obrigatórios', 400);
    }

    if (password.length < 6) {
      throw new AppError('A senha deve ter no mínimo 6 caracteres', 400);
    }

    // Verificar token
    const user = await verifyPasswordResetToken(token);

    // Hash da nova senha
    const hashedPassword = await hashPassword(password);

    // Atualizar senha
    user.password = hashedPassword;
    await clearPasswordResetToken(user.id);
    await user.save();

    // Invalidar refresh token (forçar logout de outros dispositivos)
    user.refreshToken = undefined;
    await user.save();

    // Audit log
    await AuditLog.create({
      userId: user.id,
      action: 'UPDATE',
      resource: 'USER',
      resourceId: user.id,
      details: { action: 'PASSWORD_RESET' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Senha redefinida para usuário ${user.email}`);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode fazer login.',
    });
  } catch (error: any) {
    if (error.message.includes('Token') || error.message.includes('expirado')) {
      throw new AppError(error.message, 400);
    }
    next(error);
  }
};

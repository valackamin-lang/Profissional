import { Response, NextFunction } from 'express';
import Profile from '../models/Profile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import { createNotification } from '../services/notificationService';
import { Op } from 'sequelize';

export const getPendingApprovals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Check if user is admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    if (user?.role?.name !== 'ADMIN') {
      throw new AppError('Acesso negado: apenas administradores', 403);
    }

    const { page = 1, limit = 20, type } = req.query;

    const where: any = { approvalStatus: 'PENDING' };
    if (type) where.type = type;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: profiles } = await Profile.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        profiles,
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

export const approveProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { profileId } = req.params;
    const { notes } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Check if user is admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    if (user?.role?.name !== 'ADMIN') {
      throw new AppError('Acesso negado: apenas administradores', 403);
    }

    const profile = await Profile.findByPk(profileId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    if (profile.approvalStatus !== 'PENDING') {
      throw new AppError('Perfil não está pendente de aprovação', 400);
    }

    profile.approvalStatus = 'APPROVED';
    if (notes) profile.approvalNotes = notes;
    await profile.save();

    // Notify user
    if (profile.user) {
      await createNotification(
        profile.user.id,
        'SYSTEM',
        'Perfil aprovado',
        `Seu perfil ${profile.type} foi aprovado e agora você pode publicar conteúdo.`,
        `/profiles/${profileId}`
      );
    }

    // Audit log
    await AuditLog.create({
      userId,
      action: 'APPROVE',
      resource: 'PROFILE',
      resourceId: profileId,
      details: { notes },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { profile },
      message: 'Perfil aprovado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const rejectProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { profileId } = req.params;
    const { notes } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Check if user is admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    if (user?.role?.name !== 'ADMIN') {
      throw new AppError('Acesso negado: apenas administradores', 403);
    }

    if (!notes) {
      throw new AppError('Notas de rejeição são obrigatórias', 400);
    }

    const profile = await Profile.findByPk(profileId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    if (profile.approvalStatus !== 'PENDING') {
      throw new AppError('Perfil não está pendente de aprovação', 400);
    }

    profile.approvalStatus = 'REJECTED';
    profile.approvalNotes = notes;
    await profile.save();

    // Notify user
    if (profile.user) {
      await createNotification(
        profile.user.id,
        'SYSTEM',
        'Perfil rejeitado',
        `Seu perfil ${profile.type} foi rejeitado. Motivo: ${notes}`,
        `/profiles/${profileId}`
      );
    }

    // Audit log
    await AuditLog.create({
      userId,
      action: 'REJECT',
      resource: 'PROFILE',
      resourceId: profileId,
      details: { notes },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { profile },
      message: 'Perfil rejeitado',
    });
  } catch (error) {
    next(error);
  }
};

export const moderateContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { resource, resourceId, action, reason } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Check if user is admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    if (user?.role?.name !== 'ADMIN') {
      throw new AppError('Acesso negado: apenas administradores', 403);
    }

    if (!['JOB', 'EVENT', 'MENTORSHIP'].includes(resource)) {
      throw new AppError('Recurso inválido', 400);
    }

    if (!['APPROVE', 'REJECT', 'DELETE'].includes(action)) {
      throw new AppError('Ação inválida', 400);
    }

    // Handle moderation based on resource type
    let model: any;
    switch (resource) {
      case 'JOB':
        model = require('../models/Job').default;
        break;
      case 'EVENT':
        model = require('../models/Event').default;
        break;
      case 'MENTORSHIP':
        model = require('../models/Mentorship').default;
        break;
    }

    const item = await model.findByPk(resourceId);
    if (!item) {
      throw new AppError('Item não encontrado', 404);
    }

    if (action === 'DELETE') {
      await item.destroy();
    } else if (action === 'REJECT') {
      // Mark as inactive or add moderation flag
      if (item.status) {
        item.status = 'SUSPENDED' as any;
        await item.save();
      }
    }

    // Audit log
    await AuditLog.create({
      userId,
      action: action as any,
      resource: resource as any,
      resourceId,
      details: { reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: `Conteúdo ${action === 'DELETE' ? 'deletado' : action === 'REJECT' ? 'rejeitado' : 'aprovado'} com sucesso`,
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

export const getAuditLogs = async (
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

    const {
      page = 1,
      limit = 50,
      action,
      resource,
      userId: filterUserId,
      startDate,
      endDate,
    } = req.query;

    const where: any = {};

    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (filterUserId) where.userId = filterUserId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate as string);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate as string);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: logs } = await AuditLog.findAndCountAll({
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
        logs,
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

export const getAuditReport = async (
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

    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate as string);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate as string);
    }

    const logs = await AuditLog.findAll({ where });

    // Generate report statistics
    const stats = {
      totalActions: logs.length,
      byAction: {} as Record<string, number>,
      byResource: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      dateRange: {
        start: startDate || logs[0]?.createdAt,
        end: endDate || logs[logs.length - 1]?.createdAt,
      },
    };

    logs.forEach((log) => {
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Count by resource
      stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;

      // Count by user
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        stats,
        sampleLogs: logs.slice(0, 100), // First 100 logs as sample
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionLogs = async (
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

    const { page = 1, limit = 50, startDate, endDate } = req.query;

    const where: any = {
      resource: { [Op.in]: ['PAYMENT', 'SUBSCRIPTION'] },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate as string);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate as string);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: logs } = await AuditLog.findAndCountAll({
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
        logs,
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

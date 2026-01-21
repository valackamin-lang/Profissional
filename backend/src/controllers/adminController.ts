import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import User from '../models/User';
import Profile from '../models/Profile';
import Job from '../models/Job';
import Event from '../models/Event';
import Mentorship from '../models/Mentorship';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import Payment from '../models/Payment';
import { asAuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = asAuthRequest(req);
    const userId = authReq.user?.userId;
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

    // Get counts
    const [
      totalUsers,
      totalProfiles,
      pendingProfiles,
      totalJobs,
      activeJobs,
      totalEvents,
      upcomingEvents,
      totalMentorships,
      activeMentorships,
      totalPayments,
      recentAuditLogs,
    ] = await Promise.all([
      User.count(),
      Profile.count(),
      Profile.count({ where: { approvalStatus: 'PENDING' } }),
      Job.count(),
      Job.count({ where: { status: 'OPEN' } }),
      Event.count(),
      Event.count({ where: { status: 'UPCOMING' } }),
      Mentorship.count(),
      Mentorship.count({ where: { status: 'ACTIVE' } }),
      Payment.count(),
      AuditLog.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Get profiles by type - use a simpler approach
    const allProfiles = await Profile.findAll({
      attributes: ['type'],
    });

    // Count profiles by type manually
    const profilesByType = allProfiles.reduce((acc: any, profile: any) => {
      const type = profile.type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    // Get recent activity
    const recentActivity = await AuditLog.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
        },
      ],
    });

    // Get users by role - use a simpler approach
    const allUsers = await User.findAll({
      include: [
        {
          model: require('../models/Role').default,
          as: 'role',
          attributes: ['name'],
        },
      ],
    });

    // Count users by role manually
    const usersByRole = allUsers.reduce((acc: any, user: any) => {
      const roleName = user.role?.name || 'UNKNOWN';
      if (!acc[roleName]) {
        acc[roleName] = 0;
      }
      acc[roleName]++;
      return acc;
    }, {});

    const usersByRoleArray = Object.entries(usersByRole).map(([role, count]) => ({
      role,
      count,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            total: totalUsers,
            byRole: usersByRoleArray,
          },
          profiles: {
            total: totalProfiles,
            pending: pendingProfiles,
            byType: profilesByType,
          },
          jobs: {
            total: totalJobs,
            active: activeJobs,
          },
          events: {
            total: totalEvents,
            upcoming: upcomingEvents,
          },
          mentorships: {
            total: totalMentorships,
            active: activeMentorships,
          },
          payments: {
            total: totalPayments,
          },
          activity: {
            last7Days: recentAuditLogs,
          },
        },
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = asAuthRequest(req);
    const userId = authReq.user?.userId;
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

    const { page = 1, limit = 20, search, roleId } = req.query;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (roleId) where.roleId = roleId;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: require('../models/Role').default,
          as: 'role',
          attributes: ['id', 'name'],
        },
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'type', 'approvalStatus'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        users,
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

export const getAllContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = asAuthRequest(req);
    const userId = authReq.user?.userId;
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

    const { type, status, page = 1, limit = 20 } = req.query;

    if (!type || !['JOB', 'EVENT', 'MENTORSHIP'].includes(type as string)) {
      throw new AppError('Tipo de conteúdo inválido', 400);
    }

    let model: any;
    let includeOptions: any[] = [];

    switch (type) {
      case 'JOB':
        model = Job;
        includeOptions = [
          {
            model: Profile,
            as: 'profile',
            attributes: ['id', 'companyName', 'firstName', 'lastName'],
          },
        ];
        break;
      case 'EVENT':
        model = Event;
        includeOptions = [
          {
            model: Profile,
            as: 'organizer',
            attributes: ['id', 'companyName', 'firstName', 'lastName'],
          },
        ];
        break;
      case 'MENTORSHIP':
        model = Mentorship;
        includeOptions = [
          {
            model: Profile,
            as: 'mentor',
            attributes: ['id', 'firstName', 'lastName'],
          },
        ];
        break;
    }

    const where: any = {};
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: items } = await model.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: includeOptions,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        items,
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

export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = asAuthRequest(req);
    const userId = authReq.user?.userId;
    const { targetUserId } = req.params;
    const { isActive } = req.body;

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

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Prevent admin from deactivating themselves
    if (targetUserId === userId) {
      throw new AppError('Você não pode desativar sua própria conta', 400);
    }

    targetUser.isActive = isActive !== undefined ? isActive : true;
    await targetUser.save();

    // Audit log
    await AuditLog.create({
      userId,
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      resource: 'USER',
      resourceId: targetUserId,
      details: { targetEmail: targetUser.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { user: targetUser },
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import Mentorship from '../models/Mentorship';
import Profile from '../models/Profile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import { Op } from 'sequelize';

export const createMentorship = async (
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
    if (!profile || profile.type !== 'MENTOR') {
      throw new AppError('Apenas mentores podem criar mentorias', 403);
    }

    if (profile.approvalStatus !== 'APPROVED') {
      throw new AppError('Perfil não aprovado para criar mentorias', 403);
    }

    const { title, description, price, duration, maxStudents } = req.body;

    if (!title || !description || !price || !duration) {
      throw new AppError('Campos obrigatórios: title, description, price, duration', 400);
    }

    const mentorship = await Mentorship.create({
      title,
      description,
      price: parseFloat(price),
      duration: parseInt(duration),
      maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
      mentorId: profile.id,
      status: 'ACTIVE',
      currentStudents: 0,
    });

    // Add to feed
    const { addToFeed } = await import('../services/feedService');
    await addToFeed('MENTORSHIP', mentorship.id, 5);

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'MENTORSHIP',
      resourceId: mentorship.id,
      details: { title: mentorship.title },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: { mentorship },
    });
  } catch (error) {
    next(error);
  }
};

export const getMentorships = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, status = 'ACTIVE', search, maxPrice, mentorId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (mentorId) where.mentorId = mentorId;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (maxPrice) {
      where.price = { [Op.lte]: parseFloat(maxPrice as string) };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: mentorships } = await Mentorship.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'mentor',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        mentorships,
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

export const getMentorship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const mentorship = await Mentorship.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'mentor',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    if (!mentorship) {
      throw new AppError('Mentoria não encontrada', 404);
    }

    res.json({
      success: true,
      data: { mentorship },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMentorship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const mentorship = await Mentorship.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'mentor',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });

    if (!mentorship) {
      throw new AppError('Mentoria não encontrada', 404);
    }

    // Check if user owns the mentorship or is admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    const isOwner = mentorship.mentor?.user?.id === userId;
    const isAdmin = user?.role?.name === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Acesso negado', 403);
    }

    const { title, description, price, duration, maxStudents, status } = req.body;

    if (title !== undefined) mentorship.title = title;
    if (description !== undefined) mentorship.description = description;
    if (price !== undefined) mentorship.price = parseFloat(price);
    if (duration !== undefined) mentorship.duration = parseInt(duration);
    if (maxStudents !== undefined) mentorship.maxStudents = maxStudents ? parseInt(maxStudents) : undefined;
    if (status !== undefined) mentorship.status = status;

    await mentorship.save();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE',
      resource: 'MENTORSHIP',
      resourceId: mentorship.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { mentorship },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMentorship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const mentorship = await Mentorship.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'mentor',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });

    if (!mentorship) {
      throw new AppError('Mentoria não encontrada', 404);
    }

    // Check if user owns the mentorship or is admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    const isOwner = mentorship.mentor?.user?.id === userId;
    const isAdmin = user?.role?.name === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Acesso negado', 403);
    }

    await mentorship.destroy();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'DELETE',
      resource: 'MENTORSHIP',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Mentoria deletada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

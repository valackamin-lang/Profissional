import { Response, NextFunction } from 'express';
import Event from '../models/Event';
import Profile from '../models/Profile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import { Op } from 'sequelize';

export const createEvent = async (
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
    if (!profile || (profile.type !== 'PARTNER' && profile.type !== 'COMPANY' && profile.type !== 'MENTOR')) {
      throw new AppError('Apenas parceiros, empresas e mentores podem criar eventos', 403);
    }

    if (profile.approvalStatus !== 'APPROVED') {
      throw new AppError('Perfil não aprovado para criar eventos', 403);
    }

    const { title, description, type, eventDate, price, maxAttendees } = req.body;

    if (!title || !description || !type || !eventDate) {
      throw new AppError('Campos obrigatórios: title, description, type, eventDate', 400);
    }

    const event = await Event.create({
      title,
      description,
      type,
      eventDate: new Date(eventDate),
      price: price ? parseFloat(price) : 0,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
      organizerId: profile.id,
      status: 'UPCOMING',
      currentAttendees: 0,
    });

    // Add to feed
    const { addToFeed } = await import('../services/feedService');
    await addToFeed('EVENT', event.id, 5);

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'EVENT',
      resourceId: event.id,
      details: { title: event.title, type: event.type },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, type, status = 'UPCOMING', search } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: events } = await Event.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'organizer',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
      order: [['eventDate', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        events,
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

export const getEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'organizer',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    if (!event) {
      throw new AppError('Evento não encontrado', 404);
    }

    res.json({
      success: true,
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
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

    const event = await Event.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'organizer',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });

    if (!event) {
      throw new AppError('Evento não encontrado', 404);
    }

    // Check if user owns the event or is admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    const isOwner = event.organizer?.user?.id === userId;
    const isAdmin = user?.role?.name === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Acesso negado', 403);
    }

    const { title, description, type, eventDate, price, maxAttendees, status } = req.body;

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (type !== undefined) event.type = type;
    if (eventDate !== undefined) event.eventDate = new Date(eventDate);
    if (price !== undefined) event.price = parseFloat(price);
    if (maxAttendees !== undefined) event.maxAttendees = maxAttendees ? parseInt(maxAttendees) : undefined;
    if (status !== undefined) event.status = status;

    await event.save();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE',
      resource: 'EVENT',
      resourceId: event.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
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

    const event = await Event.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'organizer',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });

    if (!event) {
      throw new AppError('Evento não encontrado', 404);
    }

    // Check if user owns the event or is admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    const isOwner = event.organizer?.user?.id === userId;
    const isAdmin = user?.role?.name === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Acesso negado', 403);
    }

    await event.destroy();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'DELETE',
      resource: 'EVENT',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Evento deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

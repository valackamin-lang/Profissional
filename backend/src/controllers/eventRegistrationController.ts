import { Response, NextFunction } from 'express';
import Event from '../models/Event';
import EventRegistration from '../models/EventRegistration';
import Profile from '../models/Profile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import { Op } from 'sequelize';

export const registerToEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const eventId = req.params.id || req.params.eventId;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const event = await Event.findByPk(eventId, {
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

    if (event.status !== 'UPCOMING') {
      throw new AppError('Evento não está aberto para inscrições', 400);
    }

    // Check if event is full
    if (event.maxAttendees && (event.currentAttendees || 0) >= event.maxAttendees) {
      throw new AppError('Evento lotado', 400);
    }

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({
      where: {
        eventId,
        attendeeId: profile.id,
        status: 'REGISTERED',
      },
    });

    if (existingRegistration) {
      throw new AppError('Você já está inscrito neste evento', 400);
    }

    // Create registration
    await EventRegistration.create({
      eventId,
      attendeeId: profile.id,
      status: 'REGISTERED',
    });

    // Update event counter
    event.currentAttendees = (event.currentAttendees || 0) + 1;
    await event.save();

    // Notify organizer
    if (event.organizer?.user) {
      await Notification.create({
        userId: event.organizer.user.id,
        type: 'EVENT',
        title: 'Nova inscrição no evento',
        message: `${profile.firstName || 'Usuário'} se inscreveu no evento ${event.title}`,
        link: `/events/${eventId}`,
        metadata: { eventId, attendeeId: profile.id },
      });
    }

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'SUBSCRIPTION',
      resourceId: eventId,
      details: { eventTitle: event.title, type: 'EVENT' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: { message: 'Inscrição realizada com sucesso' },
    });
  } catch (error) {
    next(error);
  }
};

export const checkRegistration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const eventId = req.params.id || req.params.eventId;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Check registration
    const registration = await EventRegistration.findOne({
      where: {
        eventId,
        attendeeId: profile.id,
        status: 'REGISTERED',
      },
    });

    res.json({
      success: true,
      data: { isRegistered: !!registration },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRegistrations = async (
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

    // Get all registrations for this user
    const registrations = await EventRegistration.findAll({
      where: {
        attendeeId: profile.id,
        status: 'REGISTERED',
      },
      include: [
        {
          model: Event,
          as: 'event',
          include: [
            {
              model: Profile,
              as: 'organizer',
              attributes: ['id', 'companyName', 'firstName', 'lastName'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { registrations },
    });
  } catch (error) {
    next(error);
  }
};

// Get all attendees for an event
export const getEventAttendees = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { eventId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Check if event exists and user is the organizer
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado', 404);
    }

    if (event.organizerId !== profile.id) {
      const user = await User.findByPk(userId, {
        include: [{ model: require('../models/Role').default, as: 'role' }],
      });
      if (user?.role?.name !== 'ADMIN') {
        throw new AppError('Acesso negado', 403);
      }
    }

    const where: any = { eventId };
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: registrations } = await EventRegistration.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'attendee',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        registrations,
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

// Get all attendees for all organizer's events
export const getAllOrganizerAttendees = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Get all events by this organizer
    const events = await Event.findAll({
      where: { organizerId: profile.id },
      attributes: ['id'],
    });

    const eventIds = events.map((e) => e.id);

    const where: any = { eventId: { [Op.in]: eventIds } };
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: registrations } = await EventRegistration.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'attendee',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        registrations,
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

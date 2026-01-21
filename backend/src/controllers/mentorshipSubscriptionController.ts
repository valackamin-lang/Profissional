import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Mentorship from '../models/Mentorship';
import MentorshipSubscription from '../models/MentorshipSubscription';
import Profile from '../models/Profile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';

export const subscribeToMentorship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const mentorshipId = req.params.id || req.params.mentorshipId;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const mentorship = await Mentorship.findByPk(mentorshipId, {
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

    if (mentorship.status !== 'ACTIVE') {
      throw new AppError('Mentoria não está ativa', 400);
    }

    // Check if mentorship is full
    if (mentorship.maxStudents && (mentorship.currentStudents || 0) >= mentorship.maxStudents) {
      throw new AppError('Mentoria lotada', 400);
    }

    // Check if already subscribed
    const existingSubscription = await MentorshipSubscription.findOne({
      where: {
        mentorshipId,
        studentId: profile.id,
        status: 'ACTIVE',
      },
    });

    if (existingSubscription) {
      throw new AppError('Você já está inscrito nesta mentoria', 400);
    }

    // Create subscription
    await MentorshipSubscription.create({
      mentorshipId,
      studentId: profile.id,
      status: 'ACTIVE',
    });

    // Update mentorship counter
    mentorship.currentStudents = (mentorship.currentStudents || 0) + 1;
    await mentorship.save();

    // Notify mentor
    if (mentorship.mentor?.user) {
      await Notification.create({
        userId: mentorship.mentor.user.id,
        type: 'MENTORSHIP',
        title: 'Nova inscrição na mentoria',
        message: `${profile.firstName || 'Usuário'} se inscreveu na mentoria ${mentorship.title}`,
        link: `/mentorships/${mentorshipId}`,
        metadata: { mentorshipId, studentId: profile.id },
      });
    }

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'SUBSCRIPTION',
      resourceId: mentorshipId,
      details: { mentorshipTitle: mentorship.title, type: 'MENTORSHIP' },
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

export const checkSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const mentorshipId = req.params.id || req.params.mentorshipId;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Check subscription
    const subscription = await MentorshipSubscription.findOne({
      where: {
        mentorshipId,
        studentId: profile.id,
        status: 'ACTIVE',
      },
    });

    res.json({
      success: true,
      data: { isSubscribed: !!subscription },
    });
  } catch (error) {
    next(error);
  }
};

export const getMySubscriptions = async (
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

    // Get all subscriptions for this user
    const subscriptions = await MentorshipSubscription.findAll({
      where: {
        studentId: profile.id,
        status: 'ACTIVE',
      },
      include: [
        {
          model: Mentorship,
          as: 'mentorship',
          include: [
            {
              model: Profile,
              as: 'mentor',
              attributes: ['id', 'firstName', 'lastName', 'avatar'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { subscriptions },
    });
  } catch (error) {
    next(error);
  }
};

// Get all students subscribed to mentor's mentorships
export const getMentorshipSubscribers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { mentorshipId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Check if mentorship exists and user is the mentor
    const mentorship = await Mentorship.findByPk(mentorshipId);
    if (!mentorship) {
      throw new AppError('Mentoria não encontrada', 404);
    }

    if (mentorship.mentorId !== profile.id) {
      const user = await User.findByPk(userId, {
        include: [{ model: require('../models/Role').default, as: 'role' }],
      });
      if (user?.role?.name !== 'ADMIN') {
        throw new AppError('Acesso negado', 403);
      }
    }

    const where: any = { mentorshipId };
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: subscriptions } = await MentorshipSubscription.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'student',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Mentorship,
          as: 'mentorship',
          attributes: ['id', 'title'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        subscriptions,
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

// Get all subscriptions for all mentor's mentorships
export const getAllMentorSubscribers = async (
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

    if (profile.type !== 'MENTOR') {
      const user = await User.findByPk(userId, {
        include: [{ model: require('../models/Role').default, as: 'role' }],
      });
      if (user?.role?.name !== 'ADMIN') {
        throw new AppError('Apenas mentores podem acessar esta funcionalidade', 403);
      }
    }

    // Get all mentorships by this mentor
    const mentorships = await Mentorship.findAll({
      where: { mentorId: profile.id },
      attributes: ['id'],
    });

    const mentorshipIds = mentorships.map((m) => m.id);

    const where: any = { mentorshipId: { [Op.in]: mentorshipIds } };
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: subscriptions } = await MentorshipSubscription.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'student',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Mentorship,
          as: 'mentorship',
          attributes: ['id', 'title'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        subscriptions,
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

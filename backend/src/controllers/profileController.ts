import { Request, Response, NextFunction } from 'express';
import Profile from '../models/Profile';
import User from '../models/User';
import Mentorship from '../models/Mentorship';
import Follow from '../models/Follow';
import { asAuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import { authorize } from '../middleware/authorize';
import { Op } from 'sequelize';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = asAuthRequest(req);
    const userId = authReq.user?.userId;
    const profileId = req.params.id || userId;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // If requesting by profile ID (not userId), find by profile ID
    let profile;
    if (profileId && profileId !== userId) {
      // Check if it's a profile ID (UUID) or userId
      // Try to find by profile ID first
      profile = await Profile.findByPk(profileId, {
        include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
      });

      if (!profile) {
        // If not found, try by userId
        profile = await Profile.findOne({
          where: { userId: profileId },
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        });
      }

      // Allow viewing any profile if authenticated (all profiles are viewable by authenticated users)
      // No restriction needed
    } else {
      // Viewing own profile
      profile = await Profile.findOne({
        where: { userId: profileId || userId },
        include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
      });
    }

    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Buscar contadores de seguidores/seguindo
    const [followersCount, followingCount] = await Promise.all([
      Follow.count({ where: { followingId: profile.id } }),
      Follow.count({ where: { followerId: profile.id } }),
    ]);

    // Verificar se o usuário autenticado está seguindo este perfil
    let isFollowing = false;
    if (userId) {
      const currentUserProfile = await Profile.findOne({ where: { userId } });
      if (currentUserProfile && currentUserProfile.id !== profile.id) {
        const follow = await Follow.findOne({
          where: {
            followerId: currentUserProfile.id,
            followingId: profile.id,
          },
        });
        isFollowing = !!follow;
      }
    }

    const profileData = profile.toJSON();
    (profileData as any).followersCount = followersCount;
    (profileData as any).followingCount = followingCount;
    (profileData as any).isFollowing = isFollowing;

    res.json({
      success: true,
      data: { profile: profileData },
    });
  } catch (error) {
    next(error);
  }
};

export const createProfile = async (
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

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ where: { userId } });
    if (existingProfile) {
      throw new AppError('Perfil já existe', 409);
    }

    const { type, firstName, lastName, bio, companyName, companyDocument } = req.body;

    if (!type) {
      throw new AppError('Tipo de perfil é obrigatório', 400);
    }

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const avatar = files?.avatar?.[0]?.filename;
    const resume = files?.resume?.[0]?.filename;
    const logo = files?.logo?.[0]?.filename;
    const document = files?.document?.[0]?.filename;

    const profile = await Profile.create({
      userId,
      type,
      firstName,
      lastName,
      bio,
      companyName,
      companyDocument,
      avatar: avatar ? `/uploads/avatars/${avatar}` : undefined,
      resume: resume ? `/uploads/resumes/${resume}` : undefined,
      portfolio: files?.portfolio?.[0]?.filename ? `/uploads/portfolios/${files.portfolio[0].filename}` : undefined,
      companyLogo: logo ? `/uploads/logos/${logo}` : undefined,
      approvalStatus: type === 'COMPANY' || type === 'MENTOR' ? 'PENDING' : 'APPROVED',
    });

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'PROFILE',
      resourceId: profile.id,
      details: { type: profile.type },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = asAuthRequest(req);
    const userId = authReq.user?.userId;
    const profileId = req.params.id || userId;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Find profile by ID (could be profile ID or userId)
    let profile = await Profile.findByPk(profileId);
    if (!profile) {
      // Try to find by userId
      profile = await Profile.findOne({ where: { userId: profileId } });
    }

    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Users can only update their own profile unless they're admin
    if (profile.userId !== userId) {
      const user = await User.findByPk(userId, { include: [{ model: require('../models/Role').default, as: 'role' }] });
      if (user?.role?.name !== 'ADMIN') {
        throw new AppError('Acesso negado', 403);
      }
    }
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const { firstName, lastName, bio, companyName, companyDocument } = req.body;

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files?.avatar?.[0]) {
      profile.avatar = `/uploads/avatars/${files.avatar[0].filename}`;
    }
    if (files?.resume?.[0]) {
      profile.resume = `/uploads/resumes/${files.resume[0].filename}`;
    }
    if (files?.portfolio?.[0]) {
      profile.portfolio = `/uploads/portfolios/${files.portfolio[0].filename}`;
    }
    if (files?.logo?.[0]) {
      profile.companyLogo = `/uploads/logos/${files.logo[0].filename}`;
    }

    // Update fields
    if (firstName !== undefined) profile.firstName = firstName;
    if (lastName !== undefined) profile.lastName = lastName;
    if (bio !== undefined) profile.bio = bio;
    if (companyName !== undefined) profile.companyName = companyName;
    if (companyDocument !== undefined) profile.companyDocument = companyDocument;

    await profile.save();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE',
      resource: 'PROFILE',
      resourceId: profile.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = asAuthRequest(req);
    const userId = authReq.user?.userId;
    const profileId = req.params.id;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Only admin can delete profiles
    const user = await User.findByPk(userId, { include: [{ model: require('../models/Role').default, as: 'role' }] });
    if (user?.role?.name !== 'ADMIN') {
      throw new AppError('Acesso negado', 403);
    }

    const profile = await Profile.findByPk(profileId);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    await profile.destroy();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'DELETE',
      resource: 'PROFILE',
      resourceId: profileId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Perfil deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const getMentorStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = asAuthRequest(req);
    const userId = authReq.user?.userId;
    const profileId = req.params.id;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findByPk(profileId);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    if (profile.type !== 'MENTOR') {
      throw new AppError('Este perfil não é de um mentor', 400);
    }

    // Get all mentorships for this mentor
    const mentorships = await Mentorship.findAll({
      where: { mentorId: profileId },
    });

    const totalMentorships = mentorships.length;
    const activeMentorships = mentorships.filter((m) => m.status === 'ACTIVE').length;
    const totalStudents = mentorships.reduce((sum, m) => sum + (m.currentStudents || 0), 0);
    const totalCapacity = mentorships.reduce((sum, m) => sum + (m.maxStudents || 0), 0);
    const occupancyRate = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;
    
    // Calculate average price
    const totalPrice = mentorships.reduce((sum, m) => sum + Number(m.price), 0);
    const avgPrice = totalMentorships > 0 ? totalPrice / totalMentorships : 0;

    // Simple ranking calculation (based on total students and active mentorships)
    const rankingScore = totalStudents * 2 + activeMentorships * 5;
    let ranking = 'Iniciante';
    if (rankingScore >= 100) ranking = 'Expert';
    else if (rankingScore >= 50) ranking = 'Avançado';
    else if (rankingScore >= 20) ranking = 'Intermediário';
    else if (rankingScore >= 5) ranking = 'Iniciante';

    res.json({
      success: true,
      data: {
        stats: {
          totalMentorships,
          activeMentorships,
          totalStudents,
          totalCapacity,
          occupancyRate: Math.round(occupancyRate * 10) / 10,
          avgPrice: Math.round(avgPrice * 100) / 100,
          ranking,
          rankingScore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listProfiles = async (
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

    // Only admin can list all profiles
    const user = await User.findByPk(userId, { include: [{ model: require('../models/Role').default, as: 'role' }] });
    if (user?.role?.name !== 'ADMIN') {
      throw new AppError('Acesso negado', 403);
    }

    const { type, approvalStatus, page = 1, limit = 10 } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: profiles } = await Profile.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
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

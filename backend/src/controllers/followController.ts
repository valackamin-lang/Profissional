import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import Profile from '../models/Profile';
import Follow from '../models/Follow';
import { Op } from 'sequelize';
import Notification from '../models/Notification';
import User from '../models/User';

// Seguir um perfil
export const followProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { profileId } = req.params;
    const followerProfile = await Profile.findOne({ where: { userId } });
    
    if (!followerProfile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    if (followerProfile.id === profileId) {
      throw new AppError('Você não pode seguir a si mesmo', 400);
    }

    const followingProfile = await Profile.findByPk(profileId);
    if (!followingProfile) {
      throw new AppError('Perfil a ser seguido não encontrado', 404);
    }

    // Verificar se já está seguindo
    const existingFollow = await Follow.findOne({
      where: {
        followerId: followerProfile.id,
        followingId: profileId,
      },
    });

    if (existingFollow) {
      throw new AppError('Você já está seguindo este perfil', 409);
    }

    // Criar relação de follow
    const follow = await Follow.create({
      followerId: followerProfile.id,
      followingId: profileId,
    });

    // Criar notificação
    const followingUser = await User.findByPk(followingProfile.userId);
    if (followingUser) {
      await Notification.create({
        userId: followingUser.id,
        type: 'FOLLOW',
        title: 'Novo seguidor',
        message: `${followerProfile.firstName || followerProfile.companyName || 'Alguém'} começou a seguir você`,
        link: `/profiles/${followerProfile.id}`,
        metadata: {
          resourceId: followerProfile.id,
          resourceType: 'PROFILE',
        },
      });
    }

    res.status(201).json({
      success: true,
      data: { follow },
    });
  } catch (error) {
    next(error);
  }
};

// Deixar de seguir um perfil
export const unfollowProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { profileId } = req.params;
    const followerProfile = await Profile.findOne({ where: { userId } });
    
    if (!followerProfile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const follow = await Follow.findOne({
      where: {
        followerId: followerProfile.id,
        followingId: profileId,
      },
    });

    if (!follow) {
      throw new AppError('Você não está seguindo este perfil', 404);
    }

    await follow.destroy();

    res.json({
      success: true,
      message: 'Deixou de seguir com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

// Verificar se está seguindo
export const checkFollow = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { profileId } = req.params;
    const followerProfile = await Profile.findOne({ where: { userId } });
    
    if (!followerProfile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const follow = await Follow.findOne({
      where: {
        followerId: followerProfile.id,
        followingId: profileId,
      },
    });

    res.json({
      success: true,
      data: { isFollowing: !!follow },
    });
  } catch (error) {
    next(error);
  }
};

// Obter seguidores de um perfil
export const getFollowers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { profileId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: follows } = await Follow.findAndCountAll({
      where: { followingId: profileId },
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'follower',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const followers = follows.map(f => f.follower);

    res.json({
      success: true,
      data: {
        followers,
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

// Obter perfis que um perfil está seguindo
export const getFollowing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { profileId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: follows } = await Follow.findAndCountAll({
      where: { followerId: profileId },
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'following',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const following = follows.map(f => f.following);

    res.json({
      success: true,
      data: {
        following,
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

// Obter contadores de seguidores/seguindo
export const getFollowCounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { profileId } = req.params;

    const [followersCount, followingCount] = await Promise.all([
      Follow.count({ where: { followingId: profileId } }),
      Follow.count({ where: { followerId: profileId } }),
    ]);

    res.json({
      success: true,
      data: {
        followersCount,
        followingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

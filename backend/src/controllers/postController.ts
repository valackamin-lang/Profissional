import { Response, NextFunction } from 'express';
import Post from '../models/Post';
import PostLike from '../models/PostLike';
import PostComment from '../models/PostComment';
import PostShare from '../models/PostShare';
import Profile from '../models/Profile';
import User from '../models/User';
import FeedItem from '../models/FeedItem';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import { Op } from 'sequelize';
import { addToFeed } from '../services/feedService';
import {
  getCachedPost,
  getCachedCounters,
  updateCachedCounters,
  getCachedUserLikes,
  invalidatePostCache,
  invalidateUserLikesCache,
  updateUserLikeCache,
} from '../services/postCacheService';
import redis from '../config/redis';

// Criar post
export const createPost = async (
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

    const { content, visibility = 'PUBLIC' } = req.body;

    if (!content || content.trim().length === 0) {
      throw new AppError('Conteúdo do post é obrigatório', 400);
    }

    // Processar mídia se houver
    let media: string[] = [];
    let mediaType: 'image' | 'video' | 'mixed' | undefined;

    if (req.files && 'media' in req.files) {
      const files = req.files as { media: Express.Multer.File[] };
      media = files.media.map((file) => `/uploads/posts/${file.filename}`);
      
      // Determinar tipo de mídia
      const hasImages = files.media.some(f => f.mimetype.startsWith('image/'));
      const hasVideos = files.media.some(f => f.mimetype.startsWith('video/'));
      
      if (hasImages && hasVideos) {
        mediaType = 'mixed';
      } else if (hasVideos) {
        mediaType = 'video';
      } else if (hasImages) {
        mediaType = 'image';
      }
    }

    const post = await Post.create({
      authorId: profile.id,
      content: content.trim(),
      media: media.length > 0 ? media : undefined,
      mediaType,
      visibility: visibility as 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
    });

    // Adicionar ao feed
    await addToFeed('POST', post.id, 3);

    // Invalidar caches relacionados
    await invalidatePostCache(post.id);

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'POST',
      resourceId: post.id,
      details: { content: content.substring(0, 100) },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Buscar post com autor
    const postWithAuthor = await Post.findByPk(post.id, {
      include: [
        {
          model: Profile,
          as: 'author',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: { post: postWithAuthor },
    });
  } catch (error) {
    next(error);
  }
};

// Listar posts
export const getPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, authorId } = req.query;

    const where: any = {
      visibility: 'PUBLIC', // Por padrão, apenas posts públicos
    };

    if (authorId) {
      where.authorId = authorId;
    }

    // Se usuário autenticado, incluir seus próprios posts e posts de seguidores
    if (userId) {
      const profile = await Profile.findOne({ where: { userId } });
      if (profile) {
        // Buscar IDs dos perfis que o usuário segue
        const Follow = (await import('../models/Follow')).default;
        const follows = await Follow.findAll({
          where: { followerId: profile.id },
          attributes: ['followingId'],
        });
        const followingIds = follows.map(f => f.followingId);
        
        where[Op.or] = [
          { visibility: 'PUBLIC' },
          { authorId: profile.id }, // Próprios posts
          { visibility: 'FOLLOWERS', authorId: { [Op.in]: followingIds } }, // Posts de seguidores
        ];
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Tentar obter do cache primeiro
    const cacheKey = `posts:list:${userId || 'anonymous'}:${page}:${limit}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const cachedData = JSON.parse(cached);
      // Verificar likes do usuário se autenticado
      if (userId && cachedData.posts) {
        const postIds = cachedData.posts.map((p: any) => p.id);
        const likedPostIds = await getCachedUserLikes(userId, postIds);
        cachedData.posts = cachedData.posts.map((post: any) => ({
          ...post,
          isLiked: likedPostIds.has(post.id),
        }));
      }
      res.json({
        success: true,
        data: cachedData,
      });
      return;
    }

    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'author',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Verificar quais posts o usuário curtiu (com cache)
    const postIds = posts.map(p => p.id);
    const likedPostIds = userId ? await getCachedUserLikes(userId, postIds) : new Set<string>();

    const postsWithLiked = posts.map(post => ({
      ...post.toJSON(),
      isLiked: likedPostIds.has(post.id),
    }));

    const responseData = {
      posts: postsWithLiked,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit)),
      },
    };

    // Cachear resultado (sem likes do usuário, serão adicionados na leitura)
    await redis.setex(cacheKey, 180, JSON.stringify(responseData));

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// Obter post específico
export const getPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const post = await Post.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'author',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    // Verificar se usuário curtiu
    let isLiked = false;
    if (userId) {
      const profile = await Profile.findOne({ where: { userId } });
      if (profile) {
        const like = await PostLike.findOne({
          where: { postId: id, userId: profile.id },
        });
        isLiked = !!like;
      }
    }

    res.json({
      success: true,
      data: {
        post: {
          ...post.toJSON(),
          isLiked,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Curtir/descurtir post
export const toggleLike = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const post = await Post.findByPk(id);
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    const existingLike = await PostLike.findOne({
      where: { postId: id, userId: profile.id },
    });

    if (existingLike) {
      // Descurtir
      await existingLike.destroy();
      await post.decrement('likesCount');
      await post.reload();
      
      // Atualizar cache
      await updateCachedCounters(id, { likesCount: post.likesCount });
      await updateUserLikeCache(userId, id, false);
      await invalidatePostCache(id);
      
      res.json({
        success: true,
        data: { liked: false, likesCount: post.likesCount },
      });
    } else {
      // Curtir
      await PostLike.create({
        postId: id,
        userId: profile.id,
      });
      await post.increment('likesCount');
      await post.reload();
      
      // Atualizar cache
      await updateCachedCounters(id, { likesCount: post.likesCount });
      await updateUserLikeCache(userId, id, true);
      await invalidatePostCache(id);
      
      res.json({
        success: true,
        data: { liked: true, likesCount: post.likesCount },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Comentar post
export const createComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      throw new AppError('Conteúdo do comentário é obrigatório', 400);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const post = await Post.findByPk(id);
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    const comment = await PostComment.create({
      postId: id,
      authorId: profile.id,
      content: content.trim(),
      parentId: parentId || undefined,
      likesCount: 0,
    });

    await post.increment('commentsCount');
    await post.reload(); // Recarregar para obter contador atualizado

    // Atualizar cache
    await updateCachedCounters(id, { commentsCount: post.commentsCount });
    await invalidatePostCache(id);

    const commentWithAuthor = await PostComment.findByPk(comment.id, {
      include: [
        {
          model: Profile,
          as: 'author',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: { 
        comment: commentWithAuthor,
        commentsCount: post.commentsCount, // Retornar contador atualizado
      },
    });
  } catch (error) {
    next(error);
  }
};

// Listar comentários de um post
export const getComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const post = await Post.findByPk(id);
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: comments } = await PostComment.findAndCountAll({
      where: {
        postId: id,
        parentId: null as any, // Apenas comentários principais
      },
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'author',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: PostComment,
          as: 'replies',
          include: [
            {
              model: Profile,
              as: 'author',
              include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
            },
          ],
          limit: 5, // Limitar respostas por comentário
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        comments,
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

// Compartilhar post
export const sharePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;
    const { comment } = req.body;

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const post = await Post.findByPk(id);
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    // Criar novo post compartilhado
    const sharedPost = await Post.create({
      authorId: profile.id,
      content: comment || '',
      visibility: 'PUBLIC',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
    });

    // Registrar compartilhamento
    await PostShare.create({
      postId: id,
      userId: profile.id,
      comment: comment || undefined,
    });

    await post.increment('sharesCount');
    await post.reload();

    // Atualizar cache
    await updateCachedCounters(id, { sharesCount: post.sharesCount });
    await invalidatePostCache(id);
    await invalidatePostCache(sharedPost.id);

    // Adicionar ao feed
    await addToFeed('POST', sharedPost.id, 2);

    res.status(201).json({
      success: true,
      data: { sharedPost },
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar post
export const updatePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const post = await Post.findByPk(id);
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    // Verificar se é o autor ou admin
    const Role = (await import('../models/Role')).default;
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }],
    });

    const isOwner = post.authorId === profile.id;
    const isAdmin = user?.role?.name === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Acesso negado', 403);
    }

    const { content, visibility } = req.body;

    // Atualizar conteúdo se fornecido
    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        throw new AppError('Conteúdo do post não pode estar vazio', 400);
      }
      post.content = content.trim();
    }

    // Atualizar visibilidade se fornecida
    if (visibility !== undefined) {
      post.visibility = visibility as 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
    }

    // Processar nova mídia se houver
    if (req.files && 'media' in req.files) {
      const files = req.files as { media: Express.Multer.File[] };
      const newMedia = files.media.map((file) => `/uploads/posts/${file.filename}`);
      
      // Determinar tipo de mídia
      const hasImages = files.media.some(f => f.mimetype.startsWith('image/'));
      const hasVideos = files.media.some(f => f.mimetype.startsWith('video/'));
      
      let newMediaType: 'image' | 'video' | 'mixed' | undefined;
      if (hasImages && hasVideos) {
        newMediaType = 'mixed';
      } else if (hasVideos) {
        newMediaType = 'video';
      } else if (hasImages) {
        newMediaType = 'image';
      }

      // Se houver mídia existente, adicionar nova (ou substituir se for apenas uma)
      if (post.media && Array.isArray(post.media)) {
        post.media = [...post.media, ...newMedia];
      } else {
        post.media = newMedia;
      }
      
      if (newMediaType) {
        post.mediaType = newMediaType;
      }
    }

    await post.save();

    // Invalidar cache
    await invalidatePostCache(id);

    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE',
      resource: 'POST',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Buscar post atualizado com relacionamentos
    const updatedPost = await Post.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'author',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    res.json({
      success: true,
      data: { post: updatedPost },
    });
  } catch (error) {
    next(error);
  }
};

// Deletar post
export const deletePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const post = await Post.findByPk(id);
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    // Verificar se é o autor ou admin
    const Role = (await import('../models/Role')).default;
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }],
    });

    const isOwner = post.authorId === profile.id;
    const isAdmin = user?.role?.name === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Acesso negado', 403);
    }

    // Invalidar cache antes de deletar
    await invalidatePostCache(id);

    await post.destroy();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'DELETE',
      resource: 'POST',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Post deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

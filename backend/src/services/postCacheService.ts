import redis from '../config/redis';
import Post from '../models/Post';
import PostLike from '../models/PostLike';
import Profile from '../models/Profile';
import User from '../models/User';
import { Op } from 'sequelize';

// TTLs em segundos
const POST_CACHE_TTL = 300; // 5 minutos
const COUNTERS_CACHE_TTL = 60; // 1 minuto (contadores mudam mais frequentemente)
const USER_LIKES_CACHE_TTL = 300; // 5 minutos
const FEED_CACHE_TTL = 180; // 3 minutos

// Chaves de cache
const getPostKey = (postId: string) => `post:${postId}`;
const getPostCountersKey = (postId: string) => `post:${postId}:counters`;
const getUserLikesKey = (userId: string) => `user:${userId}:likes`;
const getFeedKey = (userId: string | undefined, page: number, limit: number) => 
  `feed:${userId || 'anonymous'}:${page}:${limit}`;
const getPostListKey = (page: number, limit: number, userId?: string) => 
  `posts:list:${userId || 'anonymous'}:${page}:${limit}`;

interface PostCounters {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

interface CachedPost {
  id: string;
  content: string;
  media?: string[];
  mediaType?: string;
  visibility: string;
  authorId: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
  author?: any;
  isLiked?: boolean;
}

/**
 * Obter post do cache ou do banco de dados
 */
export const getCachedPost = async (postId: string, userId?: string): Promise<CachedPost | null> => {
  try {
    const cacheKey = getPostKey(postId);
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const post = JSON.parse(cached);
      
      // Se usuário autenticado, verificar se curtiu
      if (userId) {
        const isLiked = await checkUserLikedPost(userId, postId);
        post.isLiked = isLiked;
      }
      
      return post;
    }

    // Buscar do banco de dados
    const post = await Post.findByPk(postId, {
      include: [
        {
          model: Profile,
          as: 'author',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    if (!post) {
      return null;
    }

    const postData = post.toJSON() as any;
    
    // Verificar se usuário curtiu
    if (userId) {
      const profile = await Profile.findOne({ where: { userId } });
      if (profile) {
        const like = await PostLike.findOne({
          where: { postId, userId: profile.id },
        });
        postData.isLiked = !!like;
      }
    }

    // Cachear post
    await redis.setex(cacheKey, POST_CACHE_TTL, JSON.stringify(postData));

    return postData;
  } catch (error) {
    console.error('Error in getCachedPost:', error);
    // Em caso de erro no cache, buscar do banco
    const post = await Post.findByPk(postId, {
      include: [
        {
          model: Profile,
          as: 'author',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });
    return post ? post.toJSON() as any : null;
  }
};

/**
 * Obter contadores do cache ou calcular
 */
export const getCachedCounters = async (postId: string): Promise<PostCounters> => {
  try {
    const cacheKey = getPostCountersKey(postId);
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Buscar do banco de dados
    const post = await Post.findByPk(postId, {
      attributes: ['likesCount', 'commentsCount', 'sharesCount'],
    });

    if (!post) {
      return { likesCount: 0, commentsCount: 0, sharesCount: 0 };
    }

    const counters = {
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
    };

    // Cachear contadores
    await redis.setex(cacheKey, COUNTERS_CACHE_TTL, JSON.stringify(counters));

    return counters;
  } catch (error) {
    console.error('Error in getCachedCounters:', error);
    // Em caso de erro, buscar do banco
    const post = await Post.findByPk(postId, {
      attributes: ['likesCount', 'commentsCount', 'sharesCount'],
    });
    return post 
      ? { likesCount: post.likesCount, commentsCount: post.commentsCount, sharesCount: post.sharesCount }
      : { likesCount: 0, commentsCount: 0, sharesCount: 0 };
  }
};

/**
 * Atualizar contadores no cache
 */
export const updateCachedCounters = async (
  postId: string,
  counters: Partial<PostCounters>
): Promise<void> => {
  try {
    const cacheKey = getPostCountersKey(postId);
    const current = await getCachedCounters(postId);
    const updated = { ...current, ...counters };
    await redis.setex(cacheKey, COUNTERS_CACHE_TTL, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating cached counters:', error);
  }
};

/**
 * Verificar se usuário curtiu um post (com cache)
 */
export const checkUserLikedPost = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const likesKey = getUserLikesKey(userId);
    const cachedLikes = await redis.hget(likesKey, postId);
    
    if (cachedLikes !== null) {
      return cachedLikes === '1';
    }

    // Buscar do banco de dados
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      return false;
    }

    const like = await PostLike.findOne({
      where: { postId, userId: profile.id },
    });

    const isLiked = !!like;
    
    // Cachear resultado (usar hash para múltiplos posts)
    await redis.hset(likesKey, postId, isLiked ? '1' : '0');
    await redis.expire(likesKey, USER_LIKES_CACHE_TTL);

    return isLiked;
  } catch (error) {
    console.error('Error in checkUserLikedPost:', error);
    // Em caso de erro, buscar do banco
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      return false;
    }
    const like = await PostLike.findOne({
      where: { postId, userId: profile.id },
    });
    return !!like;
  }
};

/**
 * Obter múltiplos posts com cache de likes do usuário
 */
export const getCachedUserLikes = async (
  userId: string | undefined,
  postIds: string[]
): Promise<Set<string>> => {
  if (!userId || postIds.length === 0) {
    return new Set();
  }

  try {
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      return new Set();
    }

    const likesKey = getUserLikesKey(userId);
    const cachedLikes: string[] = [];
    const uncachedIds: string[] = [];

    // Verificar cache para cada post
    for (const postId of postIds) {
      const cached = await redis.hget(likesKey, postId);
      if (cached !== null) {
        if (cached === '1') {
          cachedLikes.push(postId);
        }
      } else {
        uncachedIds.push(postId);
      }
    }

    // Buscar likes não cacheados do banco
    if (uncachedIds.length > 0) {
      const likes = await PostLike.findAll({
        where: {
          userId: profile.id,
          postId: { [Op.in]: uncachedIds },
        },
        attributes: ['postId'],
      });

      const likedIds = likes.map(l => l.postId);
      
      // Cachear resultados
      for (const postId of uncachedIds) {
        await redis.hset(likesKey, postId, likedIds.includes(postId) ? '1' : '0');
      }
      await redis.expire(likesKey, USER_LIKES_CACHE_TTL);

      cachedLikes.push(...likedIds);
    }

    return new Set(cachedLikes);
  } catch (error) {
    console.error('Error in getCachedUserLikes:', error);
    // Em caso de erro, buscar tudo do banco
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      return new Set();
    }
    const likes = await PostLike.findAll({
      where: {
        userId: profile.id,
        postId: { [Op.in]: postIds },
      },
      attributes: ['postId'],
    });
    return new Set(likes.map(l => l.postId));
  }
};

/**
 * Invalidar cache de um post
 */
export const invalidatePostCache = async (postId: string): Promise<void> => {
  try {
    const postKey = getPostKey(postId);
    const countersKey = getPostCountersKey(postId);
    
    await redis.del(postKey, countersKey);
    
    // Invalidar cache de feed (todos os feeds)
    const feedKeys = await redis.keys('feed:*');
    if (feedKeys.length > 0) {
      await redis.del(...feedKeys);
    }
    
    // Invalidar cache de lista de posts
    const postListKeys = await redis.keys('posts:list:*');
    if (postListKeys.length > 0) {
      await redis.del(...postListKeys);
    }
  } catch (error) {
    console.error('Error invalidating post cache:', error);
  }
};

/**
 * Invalidar cache de likes do usuário
 */
export const invalidateUserLikesCache = async (userId: string): Promise<void> => {
  try {
    const likesKey = getUserLikesKey(userId);
    await redis.del(likesKey);
  } catch (error) {
    console.error('Error invalidating user likes cache:', error);
  }
};

/**
 * Atualizar cache de like do usuário
 */
export const updateUserLikeCache = async (
  userId: string,
  postId: string,
  isLiked: boolean
): Promise<void> => {
  try {
    const likesKey = getUserLikesKey(userId);
    await redis.hset(likesKey, postId, isLiked ? '1' : '0');
    await redis.expire(likesKey, USER_LIKES_CACHE_TTL);
  } catch (error) {
    console.error('Error updating user like cache:', error);
  }
};

/**
 * Invalidar todos os caches relacionados a posts
 */
export const invalidateAllPostCaches = async (): Promise<void> => {
  try {
    const keys = await redis.keys('post:*');
    const feedKeys = await redis.keys('feed:*');
    const postListKeys = await redis.keys('posts:list:*');
    const userLikesKeys = await redis.keys('user:*:likes');
    
    const allKeys = [...keys, ...feedKeys, ...postListKeys, ...userLikesKeys];
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }
  } catch (error) {
    console.error('Error invalidating all post caches:', error);
  }
};

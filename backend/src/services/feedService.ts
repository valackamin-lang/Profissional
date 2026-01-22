import Job from '../models/Job';
import Event from '../models/Event';
import Mentorship from '../models/Mentorship';
import Post from '../models/Post';
import { serializeEvent, serializeMentorship } from '../utils/serializeHelpers';
import FeedItem from '../models/FeedItem';
import Profile from '../models/Profile';
import User from '../models/User';
import redis from '../config/redis';
import { Op } from 'sequelize';
import { getCachedPost, getCachedUserLikes } from './postCacheService';

export interface FeedItemData {
  id: string;
  type: 'JOB' | 'EVENT' | 'MENTORSHIP' | 'POST';
  content: any;
  priority: number;
  createdAt: Date;
}

const calculatePriority = (item: any, userProfile?: Profile | null): number => {
  let priority = 0;

  // Base priority from feed_items table
  priority += item.priority || 0;

  // Recency boost (newer items get higher priority)
  const daysSinceCreation = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  priority += Math.max(0, 10 - daysSinceCreation);

  // Type-specific boosts
  if (item.type === 'JOB' && item.status === 'OPEN') {
    priority += 5;
  }
  if (item.type === 'EVENT' && item.status === 'UPCOMING') {
    priority += 5;
  }
  if (item.type === 'MENTORSHIP' && item.status === 'ACTIVE') {
    priority += 5;
  }
  if (item.type === 'POST') {
    priority += 3; // Posts têm prioridade base menor
    // Boost por interação
    if (item.likesCount) priority += Math.min(item.likesCount / 10, 5);
    if (item.commentsCount) priority += Math.min(item.commentsCount / 5, 3);
  }

  // User profile matching (if user profile exists)
  if (userProfile) {
    // Match job type with user interests (simplified)
    if (item.type === 'JOB' && userProfile.type === 'STUDENT') {
      priority += 3;
    }
  }

  return priority;
};

export const generateFeed = async (userId?: string, page: number = 1, limit: number = 20): Promise<FeedItemData[]> => {
  const cacheKey = `feed:${userId || 'anonymous'}:${page}:${limit}`;

  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Get user profile for personalization
  let userProfile: Profile | null = null;
  if (userId) {
    userProfile = await Profile.findOne({ where: { userId } });
  }

  // Fetch all feed items
  const feedItems = await FeedItem.findAll({
    where: {
      [Op.or]: [
        { expiresAt: null as any },
        { expiresAt: { [Op.gt]: new Date() } },
      ],
    },
    order: [['priority', 'DESC'], ['createdAt', 'DESC']],
    limit: 100, // Fetch more to filter and rank
  });

  // Fetch actual content items
  const jobs = await Job.findAll({
    where: {
      id: { [Op.in]: feedItems.filter((fi) => fi.type === 'JOB').map((fi) => fi.itemId) },
      status: 'OPEN',
    },
    include: [
      {
        model: Profile,
        as: 'profile',
        attributes: ['id', 'companyName', 'companyLogo'],
      },
    ],
  });

  const events = await Event.findAll({
    where: {
      id: { [Op.in]: feedItems.filter((fi) => fi.type === 'EVENT').map((fi) => fi.itemId) },
      status: { [Op.in]: ['UPCOMING', 'LIVE'] },
    },
    include: [
      {
        model: Profile,
        as: 'organizer',
        attributes: ['id', 'companyName', 'companyLogo'],
      },
    ],
  });

  const mentorships = await Mentorship.findAll({
    where: {
      id: { [Op.in]: feedItems.filter((fi) => fi.type === 'MENTORSHIP').map((fi) => fi.itemId) },
      status: 'ACTIVE',
    },
    include: [
      {
        model: Profile,
        as: 'mentor',
        attributes: ['id', 'firstName', 'lastName', 'avatar'],
      },
    ],
  });

  // Buscar posts com cache
  const postFeedItems = feedItems.filter((fi) => fi.type === 'POST');
  const postIds = postFeedItems.map((fi) => fi.itemId);
  
  // Tentar buscar posts do cache primeiro
  const posts: (Post | any)[] = [];
  const uncachedPostIds: string[] = [];
  
  for (const postId of postIds) {
    const cachedPost = await getCachedPost(postId, userId);
    if (cachedPost) {
      // Post do cache já é um objeto simples
      posts.push(cachedPost);
    } else {
      uncachedPostIds.push(postId);
    }
  }
  
  // Buscar posts não cacheados do banco
  if (uncachedPostIds.length > 0) {
    // Construir condições de visibilidade
    const whereConditions: any = {
      id: { [Op.in]: uncachedPostIds },
    };

    if (userProfile) {
      // Buscar IDs dos perfis que o usuário segue
      const Follow = (await import('../models/Follow')).default;
      const follows = await Follow.findAll({
        where: { followerId: userProfile.id },
        attributes: ['followingId'],
      });
      const followingIds = follows.map(f => f.followingId);
      
      whereConditions[Op.or] = [
        { visibility: 'PUBLIC' },
        { visibility: 'FOLLOWERS', authorId: { [Op.in]: followingIds } }, // Posts de seguidores
        { authorId: userProfile.id }, // Próprios posts
      ];
    } else {
      // Usuário não autenticado - apenas posts públicos
      whereConditions.visibility = 'PUBLIC';
    }

    const dbPosts = await Post.findAll({
      where: whereConditions,
      include: [
        {
          model: Profile,
          as: 'author',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });
    posts.push(...dbPosts);
  }

  // Combine and rank items
  const feedData: FeedItemData[] = [];

  for (const job of jobs) {
    const feedItem = feedItems.find((fi) => fi.type === 'JOB' && fi.itemId === job.id);
    if (feedItem) {
      feedData.push({
        id: job.id,
        type: 'JOB',
        content: job,
        priority: calculatePriority({ ...feedItem.toJSON(), type: 'JOB', ...job.toJSON() }, userProfile),
        createdAt: job.createdAt,
      });
    }
  }

  for (const event of events) {
    const feedItem = feedItems.find((fi) => fi.type === 'EVENT' && fi.itemId === event.id);
    if (feedItem) {
      const serializedEvent = serializeEvent(event);
      feedData.push({
        id: event.id,
        type: 'EVENT',
        content: serializedEvent,
        priority: calculatePriority({ ...feedItem.toJSON(), type: 'EVENT', ...serializedEvent }, userProfile),
        createdAt: event.createdAt,
      });
    }
  }

  for (const mentorship of mentorships) {
    const feedItem = feedItems.find((fi) => fi.type === 'MENTORSHIP' && fi.itemId === mentorship.id);
    if (feedItem) {
      const serializedMentorship = serializeMentorship(mentorship);
      feedData.push({
        id: mentorship.id,
        type: 'MENTORSHIP',
        content: serializedMentorship,
        priority: calculatePriority({ ...feedItem.toJSON(), type: 'MENTORSHIP', ...serializedMentorship }, userProfile),
        createdAt: mentorship.createdAt,
      });
    }
  }

  // Obter likes do usuário para todos os posts de uma vez (com cache)
  const allPostIds = posts.map(p => {
    // Posts do cache são objetos simples, posts do banco são instâncias
    return typeof p.toJSON === 'function' ? p.id : (p as any).id;
  });
  const userLikedPosts = userId ? await getCachedUserLikes(userId, allPostIds) : new Set<string>();

  for (const post of posts) {
    const feedItem = feedItems.find((fi) => fi.type === 'POST' && fi.itemId === post.id);
    if (feedItem) {
      // Converter post para objeto simples
      const postData = typeof post.toJSON === 'function' ? post.toJSON() : (post as any);
      const postId = postData.id || (post as any).id;
      const postCreatedAt = postData.createdAt || (post as any).createdAt;
      
      const postWithLike = {
        ...postData,
        isLiked: userLikedPosts.has(postId),
      };
      feedData.push({
        id: postId,
        type: 'POST',
        content: postWithLike,
        priority: calculatePriority({ ...feedItem.toJSON(), type: 'POST', ...postData }, userProfile),
        createdAt: postCreatedAt,
      });
    }
  }

  // Sort by priority
  feedData.sort((a, b) => b.priority - a.priority);

  // Paginate
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedFeed = feedData.slice(start, end);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(paginatedFeed));

  return paginatedFeed;
};

export const addToFeed = async (type: 'JOB' | 'EVENT' | 'MENTORSHIP' | 'POST', itemId: string, priority: number = 0, targetAudience?: string[]): Promise<void> => {
  await FeedItem.create({
    type,
    itemId,
    priority,
    targetAudience,
  });

  // Invalidate feed cache
  const keys = await redis.keys('feed:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

import Job from '../models/Job';
import Event from '../models/Event';
import Mentorship from '../models/Mentorship';
import FeedItem from '../models/FeedItem';
import Profile from '../models/Profile';
import redis from '../config/redis';
import { Op } from 'sequelize';

export interface FeedItemData {
  id: string;
  type: 'JOB' | 'EVENT' | 'MENTORSHIP';
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
        { expiresAt: null },
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
      feedData.push({
        id: event.id,
        type: 'EVENT',
        content: event,
        priority: calculatePriority({ ...feedItem.toJSON(), type: 'EVENT', ...event.toJSON() }, userProfile),
        createdAt: event.createdAt,
      });
    }
  }

  for (const mentorship of mentorships) {
    const feedItem = feedItems.find((fi) => fi.type === 'MENTORSHIP' && fi.itemId === mentorship.id);
    if (feedItem) {
      feedData.push({
        id: mentorship.id,
        type: 'MENTORSHIP',
        content: mentorship,
        priority: calculatePriority({ ...feedItem.toJSON(), type: 'MENTORSHIP', ...mentorship.toJSON() }, userProfile),
        createdAt: mentorship.createdAt,
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

export const addToFeed = async (type: 'JOB' | 'EVENT' | 'MENTORSHIP', itemId: string, priority: number = 0, targetAudience?: string[]): Promise<void> => {
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

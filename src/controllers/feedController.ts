import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateFeed } from '../services/feedService';

export const getFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    const feed = await generateFeed(userId, Number(page), Number(limit));

    res.json({
      success: true,
      data: {
        feed,
        pagination: {
          page: Number(page),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

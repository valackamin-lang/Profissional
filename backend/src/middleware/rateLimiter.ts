import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import { AppError } from '../utils/AppError';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Verificar se rate limiter está desabilitado via env
    if (process.env.DISABLE_RATE_LIMITER === 'true') {
      return next();
    }

    try {
      // Se Redis não estiver disponível, permitir a requisição
      const key = `rate_limit:${req.ip}:${req.path}`;
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(options.windowMs / 1000));
      }

      if (current > options.max) {
        throw new AppError(
          options.message || 'Muitas requisições. Tente novamente mais tarde.',
          429
        );
      }

      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - current));
    } catch (error: any) {
      // Se for erro de Redis, apenas logar e continuar
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Redis')) {
        // Redis não disponível, permitir requisição
      } else {
        // Outro erro, propagar
        throw error;
      }
    }
    
    next();
  };
};

// Predefined rate limiters
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
});

export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

export const strictRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
});

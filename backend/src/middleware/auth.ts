import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Helper para converter Request para AuthRequest
export const asAuthRequest = (req: Request): AuthRequest => {
  return req as AuthRequest;
};

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticação não fornecido', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Token inválido ou expirado', 401));
    }
  }
};

import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { sanitizeError, sanitizeLogData } from '../utils/sanitizeError';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Sanitizar erro para logs
  const sanitizedError = sanitizeError(err);
  
  // Log completo apenas em arquivos (não expor em console em produção)
  logger.error({
    error: sanitizedError.message,
    stack: isProduction ? undefined : err.stack, // Stack completo apenas em desenvolvimento
    path: req.path,
    method: req.method,
    statusCode: statusCode,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...(err instanceof Error && { name: err.name }),
    ...(err.isOperational && { isOperational: true }),
  });

  // Resposta ao cliente - nunca expor stack trace em produção
  const response: any = {
    success: false,
    error: {
      message: isProduction 
        ? (statusCode >= 500 ? 'Internal Server Error' : sanitizedError.message)
        : sanitizedError.message,
    },
  };

  // Stack trace apenas em desenvolvimento e para erros operacionais
  if (!isProduction && err.stack) {
    response.error.stack = err.stack;
  }

  // Não expor detalhes de erros internos em produção
  if (isProduction && statusCode >= 500) {
    response.error.message = 'Internal Server Error';
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error: AppError = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

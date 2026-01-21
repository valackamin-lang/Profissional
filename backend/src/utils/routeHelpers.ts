/**
 * Helper global para resolver problemas de tipos nas rotas do Express
 * 
 * Este helper permite que controllers e middlewares que usam AuthRequest
 * funcionem corretamente com o Express Router sem erros de TypeScript.
 */

import { RequestHandler, Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

/**
 * Converte um handler que usa AuthRequest para um RequestHandler compatível com Express Router
 */
export const asHandler = <T extends (req: AuthRequest, res: Response, next: NextFunction) => any>(
  handler: T
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as AuthRequest, res, next);
  };
};

/**
 * Converte um middleware que usa AuthRequest para um RequestHandler compatível
 */
export const asMiddleware = asHandler;

/**
 * Helper para aplicar type assertion em múltiplos handlers de uma vez
 */
export const asHandlers = <T extends Record<string, (req: AuthRequest, res: Response, next: NextFunction) => any>>(
  handlers: T
): { [K in keyof T]: RequestHandler } => {
  const result: any = {};
  for (const key in handlers) {
    result[key] = asHandler(handlers[key]);
  }
  return result;
};

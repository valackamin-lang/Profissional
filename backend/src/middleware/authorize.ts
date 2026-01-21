import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import User from '../models/User';
import Role from '../models/Role';
import Permission from '../models/Permission';
import RolePermission from '../models/RolePermission';
import { AppError } from '../utils/AppError';

export const authorize = (...allowedRoles: string[]): any => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest;
    try {
      const userId = authReq.user?.userId;
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (!user || !user.role) {
        throw new AppError('Role não encontrada', 404);
      }

      // Check if user's role is in allowed roles
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role.name)) {
        throw new AppError('Acesso negado: permissão insuficiente', 403);
      }

      // Attach role and permissions to request
      const rolePermissions = (user.role as any).permissions || [];
      authReq.user = {
        ...authReq.user!,
        roleName: user.role.name,
        permissions: Array.isArray(rolePermissions) ? rolePermissions.map((p: any) => `${p.resource}:${p.action}`) : [],
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest;
    try {
      const permissions = (authReq.user as any)?.permissions || [];
      const requiredPermission = `${resource}:${action}`;

      if (!permissions.includes(requiredPermission)) {
        throw new AppError(`Acesso negado: permissão ${requiredPermission} necessária`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

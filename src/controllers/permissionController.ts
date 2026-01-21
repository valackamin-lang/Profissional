import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import Permission from '../models/Permission';
import Role from '../models/Role';
import AuditLog from '../models/AuditLog';

// Get all permissions
export const getAllPermissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resource, action } = req.query;

    const where: any = {};
    if (resource) where.resource = resource;
    if (action) where.action = action;

    const permissions = await Permission.findAll({
      where,
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
      ],
      order: [['resource', 'ASC'], ['action', 'ASC']],
    });

    res.json({
      success: true,
      data: { permissions },
    });
  } catch (error) {
    next(error);
  }
};

// Get permission by ID
export const getPermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
      ],
    });

    if (!permission) {
      throw new AppError('Permissão não encontrada', 404);
    }

    res.json({
      success: true,
      data: { permission },
    });
  } catch (error) {
    next(error);
  }
};

// Create permission
export const createPermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, resource, action, description } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!name || !resource || !action) {
      throw new AppError('Nome, recurso e ação são obrigatórios', 400);
    }

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ where: { name } });
    if (existingPermission) {
      throw new AppError('Permissão já existe', 409);
    }

    const permission = await Permission.create({
      name,
      resource,
      action,
      description,
    });

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'PERMISSION',
      resourceId: permission.id,
      details: { name: permission.name, resource: permission.resource, action: permission.action },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: { permission },
    });
  } catch (error) {
    next(error);
  }
};

// Update permission
export const updatePermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { name, resource, action, description } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const permission = await Permission.findByPk(id);
    if (!permission) {
      throw new AppError('Permissão não encontrada', 404);
    }

    if (name && name !== permission.name) {
      // Check if new name already exists
      const existingPermission = await Permission.findOne({ where: { name } });
      if (existingPermission) {
        throw new AppError('Permissão com este nome já existe', 409);
      }
      permission.name = name;
    }

    if (resource) permission.resource = resource;
    if (action) permission.action = action;
    if (description !== undefined) permission.description = description;

    await permission.save();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE',
      resource: 'PERMISSION',
      resourceId: permission.id,
      details: { name: permission.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { permission },
    });
  } catch (error) {
    next(error);
  }
};

// Delete permission
export const deletePermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const permission = await Permission.findByPk(id);
    if (!permission) {
      throw new AppError('Permissão não encontrada', 404);
    }

    // Check if permission is assigned to any role
    const RolePermission = (await import('../models/RolePermission')).default;
    const rolePermissions = await RolePermission.count({ where: { permissionId: id } });
    if (rolePermissions > 0) {
      throw new AppError('Não é possível deletar permissão que está atribuída a roles', 409);
    }

    await permission.destroy();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'DELETE',
      resource: 'PERMISSION',
      resourceId: id,
      details: { name: permission.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Permissão deletada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

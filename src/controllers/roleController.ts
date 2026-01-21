import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import Role from '../models/Role';
import Permission from '../models/Permission';
import RolePermission from '../models/RolePermission';
import AuditLog from '../models/AuditLog';

// Get all roles
export const getAllRoles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: { roles },
    });
  } catch (error) {
    next(error);
  }
};

// Get role by ID
export const getRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      throw new AppError('Role não encontrado', 404);
    }

    res.json({
      success: true,
      data: { role },
    });
  } catch (error) {
    next(error);
  }
};

// Create role
export const createRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, description, permissionIds } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!name) {
      throw new AppError('Nome do role é obrigatório', 400);
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      throw new AppError('Role já existe', 409);
    }

    const role = await Role.create({
      name,
      description,
    });

    // Assign permissions if provided
    if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
      // Clear existing permissions
      await RolePermission.destroy({ where: { roleId: role.id } });
      // Add new permissions
      for (const permissionId of permissionIds) {
        await RolePermission.findOrCreate({
          where: {
            roleId: role.id,
            permissionId,
          },
          defaults: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }

    // Reload with permissions
    await role.reload({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'ROLE',
      resourceId: role.id,
      details: { name: role.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: { role },
    });
  } catch (error) {
    next(error);
  }
};

// Update role
export const updateRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const role = await Role.findByPk(id);
    if (!role) {
      throw new AppError('Role não encontrado', 404);
    }

    // Prevent updating system roles
    const systemRoles = ['ADMIN', 'STUDENT', 'MENTOR', 'PARTNER'];
    if (systemRoles.includes(role.name)) {
      throw new AppError('Não é possível editar roles do sistema', 403);
    }

    if (name && name !== role.name) {
      // Check if new name already exists
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        throw new AppError('Role com este nome já existe', 409);
      }
      role.name = name;
    }

    if (description !== undefined) {
      role.description = description;
    }

    await role.save();

    // Update permissions if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      // Clear existing permissions
      await RolePermission.destroy({ where: { roleId: role.id } });
      // Add new permissions
      for (const permissionId of permissionIds) {
        await RolePermission.findOrCreate({
          where: {
            roleId: role.id,
            permissionId,
          },
          defaults: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }

    // Reload with permissions
    await role.reload({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE',
      resource: 'ROLE',
      resourceId: role.id,
      details: { name: role.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { role },
    });
  } catch (error) {
    next(error);
  }
};

// Delete role
export const deleteRole = async (
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

    const role = await Role.findByPk(id);
    if (!role) {
      throw new AppError('Role não encontrado', 404);
    }

    // Prevent deleting system roles
    const systemRoles = ['ADMIN', 'STUDENT', 'MENTOR', 'PARTNER'];
    if (systemRoles.includes(role.name)) {
      throw new AppError('Não é possível deletar roles do sistema', 403);
    }

    // Check if role is in use
    const User = (await import('../models/User')).default;
    const usersWithRole = await User.count({ where: { roleId: id } });
    if (usersWithRole > 0) {
      throw new AppError('Não é possível deletar role que está em uso', 409);
    }

    await role.destroy();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'DELETE',
      resource: 'ROLE',
      resourceId: id,
      details: { name: role.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Role deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

// Assign permissions to role
export const assignPermissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!permissionIds || !Array.isArray(permissionIds)) {
      throw new AppError('permissionIds deve ser um array', 400);
    }

    const role = await Role.findByPk(id);
    if (!role) {
      throw new AppError('Role não encontrado', 404);
    }

    // Clear existing permissions
    await RolePermission.destroy({ where: { roleId: role.id } });
    // Add new permissions
    for (const permissionId of permissionIds) {
      await RolePermission.findOrCreate({
        where: {
          roleId: role.id,
          permissionId,
        },
        defaults: {
          roleId: role.id,
          permissionId,
        },
      });
    }

    // Reload with permissions
    await role.reload({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
    });

    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE',
      resource: 'ROLE',
      resourceId: role.id,
      details: { action: 'ASSIGN_PERMISSIONS', permissionIds },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { role },
    });
  } catch (error) {
    next(error);
  }
};

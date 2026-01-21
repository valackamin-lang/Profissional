import Role from '../models/Role';
import Permission from '../models/Permission';
import RolePermission from '../models/RolePermission';
import logger from '../config/logger';

const roles = [
  { name: 'STUDENT', description: 'Estudante/Profissional' },
  { name: 'MENTOR', description: 'Mentor' },
  { name: 'PARTNER', description: 'Empresa Parceira' },
  { name: 'ADMIN', description: 'Administrador' },
];

const permissions = [
  // Profile permissions
  { name: 'profile:read', resource: 'PROFILE', action: 'READ', description: 'Ler perfil' },
  { name: 'profile:update', resource: 'PROFILE', action: 'UPDATE', description: 'Atualizar perfil' },
  { name: 'profile:delete', resource: 'PROFILE', action: 'DELETE', description: 'Deletar perfil' },

  // Job permissions
  { name: 'job:create', resource: 'JOB', action: 'CREATE', description: 'Criar vaga' },
  { name: 'job:read', resource: 'JOB', action: 'READ', description: 'Ler vagas' },
  { name: 'job:update', resource: 'JOB', action: 'UPDATE', description: 'Atualizar vaga' },
  { name: 'job:delete', resource: 'JOB', action: 'DELETE', description: 'Deletar vaga' },
  { name: 'job:apply', resource: 'JOB', action: 'APPLY', description: 'Candidatar-se a vaga' },

  // Event permissions
  { name: 'event:create', resource: 'EVENT', action: 'CREATE', description: 'Criar evento' },
  { name: 'event:read', resource: 'EVENT', action: 'READ', description: 'Ler eventos' },
  { name: 'event:update', resource: 'EVENT', action: 'UPDATE', description: 'Atualizar evento' },
  { name: 'event:delete', resource: 'EVENT', action: 'DELETE', description: 'Deletar evento' },
  { name: 'event:register', resource: 'EVENT', action: 'REGISTER', description: 'Registrar-se em evento' },

  // Mentorship permissions
  { name: 'mentorship:create', resource: 'MENTORSHIP', action: 'CREATE', description: 'Criar mentoria' },
  { name: 'mentorship:read', resource: 'MENTORSHIP', action: 'READ', description: 'Ler mentorias' },
  { name: 'mentorship:update', resource: 'MENTORSHIP', action: 'UPDATE', description: 'Atualizar mentoria' },
  { name: 'mentorship:delete', resource: 'MENTORSHIP', action: 'DELETE', description: 'Deletar mentoria' },
  { name: 'mentorship:purchase', resource: 'MENTORSHIP', action: 'PURCHASE', description: 'Comprar mentoria' },

  // Admin permissions
  { name: 'admin:approve', resource: 'ADMIN', action: 'APPROVE', description: 'Aprovar parceiros' },
  { name: 'admin:moderate', resource: 'ADMIN', action: 'MODERATE', description: 'Moderar conteúdo' },
  { name: 'admin:manage_users', resource: 'ADMIN', action: 'MANAGE_USERS', description: 'Gerenciar usuários' },
  { name: 'admin:view_reports', resource: 'ADMIN', action: 'VIEW_REPORTS', description: 'Ver relatórios' },
];

const rolePermissions = {
  STUDENT: [
    'profile:read',
    'profile:update',
    'job:read',
    'job:apply',
    'event:read',
    'event:register',
    'mentorship:read',
    'mentorship:purchase',
  ],
  MENTOR: [
    'profile:read',
    'profile:update',
    'job:read',
    'event:read',
    'event:register',
    'mentorship:create',
    'mentorship:read',
    'mentorship:update',
    'mentorship:delete',
  ],
  PARTNER: [
    'profile:read',
    'profile:update',
    'job:create',
    'job:read',
    'job:update',
    'job:delete',
    'event:create',
    'event:read',
    'event:update',
    'event:delete',
  ],
  ADMIN: [
    // All permissions
    ...permissions.map((p) => p.name),
  ],
};

export const seedRolesAndPermissions = async (): Promise<void> => {
  try {
    logger.info('🌱 Seeding roles and permissions...');

    // Create roles
    const createdRoles: Record<string, Role> = {};
    for (const roleData of roles) {
      const [role] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData,
      });
      createdRoles[role.name] = role;
      logger.info(`✅ Role ${role.name} created/found`);
    }

    // Create permissions
    const createdPermissions: Record<string, Permission> = {};
    for (const permData of permissions) {
      const [permission] = await Permission.findOrCreate({
        where: { name: permData.name },
        defaults: permData,
      });
      createdPermissions[permission.name] = permission;
      logger.info(`✅ Permission ${permission.name} created/found`);
    }

    // Assign permissions to roles
    for (const [roleName, permNames] of Object.entries(rolePermissions)) {
      const role = createdRoles[roleName];
      if (!role) continue;

      // Clear existing permissions
      await RolePermission.destroy({ where: { roleId: role.id } });

      // Add new permissions
      for (const permName of permNames) {
        const permission = createdPermissions[permName];
        if (permission) {
          await RolePermission.findOrCreate({
            where: {
              roleId: role.id,
              permissionId: permission.id,
            },
            defaults: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
      logger.info(`✅ Permissions assigned to role ${roleName}`);
    }

    logger.info('✅ Roles and permissions seeded successfully.');
  } catch (error) {
    logger.error('❌ Error seeding roles and permissions:', error);
    throw error;
  }
};

import User from '../models/User';
import Role from '../models/Role';
import Profile from '../models/Profile';
import { hashPassword } from '../utils/bcrypt';
import logger from '../config/logger';

export const seedAdminUser = async (): Promise<void> => {
  try {
    logger.info('🌱 Seeding admin user...');

    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      throw new Error('Admin role not found. Run roles seeder first.');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@forgetech.com' },
    });

    if (existingAdmin) {
      logger.info('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    const admin = await User.create({
      email: 'admin@forgetech.com',
      password: hashedPassword,
      roleId: adminRole.id,
      isEmailVerified: true,
    });

    // Create admin profile
    await Profile.create({
      userId: admin.id,
      type: 'COMPANY',
      firstName: 'Admin',
      lastName: 'FORGETECH',
      bio: 'Administrador do sistema FORGETECH Professional',
      approvalStatus: 'APPROVED',
    });

    logger.info('✅ Admin user created successfully');
    logger.info('   Email: admin@forgetech.com');
    logger.info('   Password: admin123');
    logger.info('   ⚠️  Please change the password after first login!');
  } catch (error) {
    logger.error('❌ Error seeding admin user:', error);
    throw error;
  }
};

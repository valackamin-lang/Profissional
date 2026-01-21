import { seedRolesAndPermissions } from './01-roles-permissions';
import { seedAdminUser } from './02-admin-user';
import { seedSampleData } from './03-sample-data';
import logger from '../config/logger';

export const runSeeders = async (): Promise<void> => {
  try {
    logger.info('🚀 Starting database seeders...');
    logger.info('');

    // Run seeders in order
    await seedRolesAndPermissions();
    await seedAdminUser();
    await seedSampleData();

    logger.info('');
    logger.info('✅ All seeders completed successfully!');
  } catch (error) {
    logger.error('❌ Error running seeders:', error);
    throw error;
  }
};

export { seedRolesAndPermissions, seedAdminUser, seedSampleData };

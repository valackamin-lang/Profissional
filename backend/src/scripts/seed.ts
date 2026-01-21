import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { syncDatabase } from '../config/syncDatabase';
import { runSeeders } from '../seeders';
import logger from '../config/logger';

dotenv.config();

const run = async (): Promise<void> => {
  try {
    logger.info('🌱 Starting seeding process...');

    // Connect to database
    await connectDatabase();

    // Sync database (create tables)
    await syncDatabase(false); // Don't force, just sync

    // Run seeders
    await runSeeders();

    logger.info('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

run();

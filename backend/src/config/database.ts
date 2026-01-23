import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'forgetech_db',
  process.env.DB_USER || 'forgetech_user',
  process.env.DB_PASSWORD || 'forgetech_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' 
      ? (query: string) => logger.debug('Database query', { query: query.substring(0, 200) }) // Limitar tamanho do log
      : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (error: any) {
    logger.error('Unable to connect to the database', {
      message: error.message,
      code: error.code,
      // Não logar stack trace completo em produção
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    throw error;
  }
};

export default sequelize;

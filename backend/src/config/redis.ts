import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const redisConfig: any = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Adicionar username se fornecido
if (process.env.REDIS_USER || process.env.REDISUSER) {
  redisConfig.username = process.env.REDIS_USER || process.env.REDISUSER;
}

// Adicionar password se fornecido
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const hasAuth = !!(process.env.REDIS_PASSWORD || process.env.REDIS_USER || process.env.REDISUSER);
  logger.info(`Redis connection established successfully. ${host}:${port}${hasAuth ? ' (authenticated)' : ''}`);
});

redis.on('error', (error: any) => {
  logger.error('Redis connection error', {
    message: error.message,
    code: error.code,
    // Não logar detalhes sensíveis de erro de autenticação
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
  
  if (error.message?.includes('password') || error.message?.includes('auth') || error.message?.includes('AUTH')) {
    logger.warn('Redis authentication error - Verifique REDIS_USER e REDIS_PASSWORD no arquivo .env');
  }
});

export default redis;

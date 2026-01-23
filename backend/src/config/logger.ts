import winston from 'winston';
import dotenv from 'dotenv';
import { sanitizeLogData } from '../utils/sanitizeError';

dotenv.config();

// Formato customizado para sanitizar dados sensíveis
const sanitizeFormat = winston.format((info) => {
  // Sanitizar dados sensíveis antes de logar
  if (info.message && typeof info.message === 'object') {
    info.message = sanitizeLogData(info.message);
  }
  if (info.meta) {
    info.meta = sanitizeLogData(info.meta);
  }
  if (info.error && typeof info.error === 'object') {
    info.error = sanitizeLogData(info.error);
  }
  
  // Em produção, não incluir stack traces completos em logs de console
  if (process.env.NODE_ENV === 'production' && info.stack && typeof info.stack === 'string') {
    // Manter stack apenas em arquivos de log, não em console
    if (info.level === 'error') {
      // Stack completo apenas em arquivo de erro
      info.stack = info.stack.split('\n').slice(0, 5).join('\n'); // Limitar a 5 linhas
    }
  }
  
  return info;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'forgetech-backend' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      // Em arquivos, podemos manter mais detalhes, mas ainda sanitizados
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      // Limitar tamanho de stack traces em arquivos também
    }),
  ],
});

// Console apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
} else {
  // Em produção, console apenas para erros críticos e sem stack traces
  logger.add(
    new winston.transports.Console({
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => {
          // Não mostrar stack traces no console em produção
          const { stack, ...rest } = info;
          return JSON.stringify(rest);
        })
      ),
    })
  );
}

export default logger;

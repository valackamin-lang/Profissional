/**
 * Sanitiza erros para não vazar informações sensíveis em produção
 */

interface SanitizedError {
  message: string;
  statusCode: number;
  isOperational: boolean;
  stack?: string;
}

/**
 * Remove informações sensíveis de mensagens de erro
 */
const sanitizeErrorMessage = (message: string): string => {
  if (process.env.NODE_ENV === 'production') {
    // Remover paths do sistema
    let sanitized = message.replace(/\/[^\s]+/g, '[path]');
    
    // Remover possíveis credenciais
    sanitized = sanitized.replace(/password[=:]\s*['"]?[^'"]+['"]?/gi, 'password=[REDACTED]');
    sanitized = sanitized.replace(/token[=:]\s*['"]?[^'"]+['"]?/gi, 'token=[REDACTED]');
    sanitized = sanitized.replace(/secret[=:]\s*['"]?[^'"]+['"]?/gi, 'secret=[REDACTED]');
    sanitized = sanitized.replace(/api[_-]?key[=:]\s*['"]?[^'"]+['"]?/gi, 'api_key=[REDACTED]');
    sanitized = sanitized.replace(/authorization[=:]\s*['"]?[^'"]+['"]?/gi, 'authorization=[REDACTED]');
    
    // Remover emails completos (manter apenas domínio)
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (email) => {
      const [_, domain] = email.split('@');
      return `[user]@${domain}`;
    });
    
    // Remover UUIDs longos
    sanitized = sanitized.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]');
    
    return sanitized;
  }
  return message;
};

/**
 * Sanitiza stack trace removendo informações sensíveis
 */
const sanitizeStack = (stack: string | undefined): string | undefined => {
  if (!stack || process.env.NODE_ENV === 'development') {
    return stack;
  }
  
  // Remover paths completos do sistema
  let sanitized = stack.replace(/\/[^\s]+/g, '[path]');
  
  // Remover informações de arquivos locais
  sanitized = sanitized.replace(/\([^)]+\)/g, '([internal])');
  
  // Remover linhas de código
  sanitized = sanitized.split('\n').slice(0, 3).join('\n'); // Apenas primeiras 3 linhas
  
  return sanitized;
};

/**
 * Sanitiza objeto de erro completo
 */
export const sanitizeError = (error: any): SanitizedError => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sanitized: SanitizedError = {
    message: sanitizeErrorMessage(error?.message || 'Internal Server Error'),
    statusCode: error?.statusCode || 500,
    isOperational: error?.isOperational || false,
  };
  
  // Stack trace apenas em desenvolvimento ou se for erro operacional
  if (!isProduction || error?.isOperational) {
    sanitized.stack = sanitizeStack(error?.stack);
  }
  
  return sanitized;
};

/**
 * Sanitiza dados de log para não vazar informações sensíveis
 */
export const sanitizeLogData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'credentials',
    'refreshToken',
    'accessToken',
    'jwt',
    'session',
    'cookie',
    'db_password',
    'db_user',
    'connection_string',
    'uri',
    'url',
  ];
  
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    // Verificar se a chave contém palavras sensíveis
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
    
    // Sanitizar objetos aninhados
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
    
    // Sanitizar strings que podem conter credenciais
    if (typeof sanitized[key] === 'string') {
      const value = sanitized[key] as string;
      if (value.length > 100 && (lowerKey.includes('token') || lowerKey.includes('secret'))) {
        sanitized[key] = '[REDACTED]';
      }
    }
  }
  
  return sanitized;
};

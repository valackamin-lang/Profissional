import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Permitir múltiplas origens para desenvolvimento e produção
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
  // Permitir domínios do Vercel
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  // Permitir qualquer domínio .vercel.app em desenvolvimento
  ...(process.env.NODE_ENV === 'development' ? [/\.vercel\.app$/] : []),
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar se a origin está na lista de permitidas
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Em desenvolvimento, permitir qualquer origin localhost ou vercel.app
      if (process.env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('vercel.app'))) {
        callback(null, true);
      } else if (origin.includes('vercel.app')) {
        // Permitir domínios do Vercel em produção também
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default cors(corsOptions);

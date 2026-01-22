import express, { Application } from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { syncDatabase } from './config/syncDatabase';
import redis from './config/redis';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeSocket, setIO } from './config/socket';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Inicializar Socket.io
const io = initializeSocket(httpServer);
setIO(io);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS - Permitir qualquer domínio
app.use((req, res, next) => {
  // Permitir qualquer origem
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Responder imediatamente para requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Rate limiting for API routes
import { apiRateLimiter } from './middleware/rateLimiter';
app.use('/api', apiRateLimiter);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'FORGETECH Professional API',
    version: '1.0.0',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
    redis: 'connected',
  });
});

// API Routes
import authRoutes from './routes/authRoutes';
import oauthRoutes from './routes/oauthRoutes';
import twoFactorRoutes from './routes/twoFactorRoutes';
import profileRoutes from './routes/profileRoutes';
import jobRoutes from './routes/jobRoutes';
import eventRoutes from './routes/eventRoutes';
import mentorshipRoutes from './routes/mentorshipRoutes';
import feedRoutes from './routes/feedRoutes';
import postRoutes from './routes/postRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';
import stripeRoutes from './routes/stripeRoutes';
import commissionRoutes from './routes/commissionRoutes';
import videoRoutes from './routes/videoRoutes';
import moderationRoutes from './routes/moderationRoutes';
import auditRoutes from './routes/auditRoutes';
import adminRoutes from './routes/adminRoutes';
import roleRoutes from './routes/roleRoutes';
import permissionRoutes from './routes/permissionRoutes';
import gpoRoutes from './routes/gpoRoutes';
import followRoutes from './routes/followRoutes';
import passport from './config/passport';
import Role from './models/Role';

app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/mentorships', mentorshipRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/gpo', gpoRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/roles', roleRoutes);
app.use('/api/admin/permissions', permissionRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Try to connect to database
    try {
      await connectDatabase();
      await syncDatabase(process.env.NODE_ENV === 'development');
      logger.info('✅ Database connected and synced');
      
      // Verificar se roles básicas existem, se não, executar seeders
      const studentRole = await Role.findOne({ where: { name: 'STUDENT' } });
      if (!studentRole) {
        logger.warn('⚠️  Roles básicas não encontradas. Executando seeders...');
        try {
          const { runSeeders } = await import('./seeders');
          await runSeeders();
          logger.info('✅ Seeders executados com sucesso');
        } catch (seedError) {
          logger.error('❌ Erro ao executar seeders:', seedError);
          logger.warn('   Execute manualmente: npm run seed');
        }
      }
    } catch (dbError) {
      logger.warn('⚠️  Database connection failed. Server will start but database features will not work.');
      logger.warn('   Make sure PostgreSQL is running: docker-compose up -d');
    }

    // Try to connect to Redis
    try {
      await redis.ping();
      logger.info('✅ Redis connected');
    } catch (redisError) {
      logger.warn('⚠️  Redis connection failed. Server will start but caching features will not work.');
      logger.warn('   Make sure Redis is running: docker-compose up -d');
    }
    
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 API available at http://localhost:${PORT}`);
      logger.info(`💬 Socket.io initialized`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

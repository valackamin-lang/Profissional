import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refresh, logout, getMe, verifyEmail, resendVerification } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('roleName').optional().isString(),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  authRateLimiter,
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ],
  validateRequest,
  login
);

router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

// Email verification routes
router.get('/verify-email', verifyEmail);
router.post(
  '/resend-verification',
  authRateLimiter,
  [
    body('email').isEmail().withMessage('Email inválido'),
  ],
  validateRequest,
  resendVerification
);

export default router;

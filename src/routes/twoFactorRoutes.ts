import { Router } from 'express';
import { body } from 'express-validator';
import { generateSecret, enable, disable, verify } from '../controllers/twoFactorController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

router.get('/generate', generateSecret);

router.post(
  '/enable',
  [body('token').notEmpty().withMessage('Token 2FA é obrigatório')],
  validateRequest,
  enable
);

router.post(
  '/disable',
  [body('token').notEmpty().withMessage('Token 2FA é obrigatório')],
  validateRequest,
  disable
);

router.post(
  '/verify',
  [body('token').notEmpty().withMessage('Token 2FA é obrigatório')],
  validateRequest,
  verify
);

export default router;

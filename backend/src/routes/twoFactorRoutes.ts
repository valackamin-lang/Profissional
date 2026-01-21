import { Router } from 'express';
import { body } from 'express-validator';
import { generateSecret, enable, disable, verify } from '../controllers/twoFactorController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asHandler } from '../utils/routeHelpers';

const router = Router();

router.use(authenticate as any);

router.get('/generate', asHandler(generateSecret));

router.post(
  '/enable',
  [body('token').notEmpty().withMessage('Token 2FA é obrigatório')],
  validateRequest,
  asHandler(enable)
);

router.post(
  '/disable',
  [body('token').notEmpty().withMessage('Token 2FA é obrigatório')],
  validateRequest,
  asHandler(disable)
);

router.post(
  '/verify',
  [body('token').notEmpty().withMessage('Token 2FA é obrigatório')],
  validateRequest,
  asHandler(verify)
);

export default router;

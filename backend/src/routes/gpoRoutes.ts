import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  generatePurchaseToken,
  handleCallback,
  checkPaymentStatus,
  checkPaymentByResource,
} from '../controllers/gpoController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asHandler } from '../utils/routeHelpers';
import express from 'express';

const router = Router();

// Callback do GPO (sem autenticação, mas pode ter validação de IP)
router.post(
  '/callback',
  express.json(),
  handleCallback
);

// Rotas autenticadas
router.use(authenticate as any);

router.post(
  '/generate-token',
  [
    body('mentorshipId').optional().isUUID(),
    body('eventId').optional().isUUID(),
  ],
  validateRequest,
  asHandler(generatePurchaseToken)
);

router.get('/:paymentId/status', asHandler(checkPaymentStatus));

router.get(
  '/check',
  [
    query('mentorshipId').optional().isUUID(),
    query('eventId').optional().isUUID(),
  ],
  validateRequest,
  asHandler(checkPaymentByResource)
);

export default router;

import { Router } from 'express';
import { body } from 'express-validator';
import {
  createSubscriptionCheckout,
  cancelUserSubscription,
  createPayment,
  webhook,
  getSubscription,
} from '../controllers/stripeController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asHandler } from '../utils/routeHelpers';
import express from 'express';

const router = Router();

// Webhook must be before body parser
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhook
);

router.use(authenticate as any);

router.get('/subscription', asHandler(getSubscription));

router.post(
  '/subscription',
  [
    body('priceId').notEmpty().withMessage('priceId é obrigatório'),
    body('plan').isIn(['MONTHLY', 'ANNUAL']).withMessage('Plan deve ser MONTHLY ou ANNUAL'),
  ],
  validateRequest,
  asHandler(createSubscriptionCheckout)
);

router.post('/subscription/cancel', asHandler(cancelUserSubscription));

router.post(
  '/payment',
  [
    body('amount').isNumeric().withMessage('Amount deve ser numérico'),
    body('currency').optional().isString(),
    body('description').optional().isString(),
  ],
  validateRequest,
  asHandler(createPayment)
);

export default router;

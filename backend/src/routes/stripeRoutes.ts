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
import express from 'express';

const router = Router();

// Webhook must be before body parser
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhook
);

router.use(authenticate);

router.get('/subscription', getSubscription);

router.post(
  '/subscription',
  [
    body('priceId').notEmpty().withMessage('priceId é obrigatório'),
    body('plan').isIn(['MONTHLY', 'ANNUAL']).withMessage('Plan deve ser MONTHLY ou ANNUAL'),
  ],
  validateRequest,
  createSubscriptionCheckout
);

router.post('/subscription/cancel', cancelUserSubscription);

router.post(
  '/payment',
  [
    body('amount').isNumeric().withMessage('Amount deve ser numérico'),
    body('currency').optional().isString(),
    body('description').optional().isString(),
  ],
  validateRequest,
  createPayment
);

export default router;

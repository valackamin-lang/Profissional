import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createCustomer,
  createSubscription,
  cancelSubscription,
  createPaymentIntent,
  handleWebhook,
  stripe,
} from '../services/stripeService';
import User from '../models/User';
import Subscription from '../models/Subscription';
import { AppError } from '../utils/AppError';

export const createSubscriptionCheckout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { priceId, plan } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!priceId || !plan) {
      throw new AppError('priceId e plan são obrigatórios', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Get or create Stripe customer
    let customerId: string;
    const existingSubscription = await Subscription.findOne({
      where: { userId, status: 'ACTIVE' },
    });

    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      customerId = await createCustomer(userId, user.email);
    }

    const subscription = await createSubscription(userId, customerId, priceId, plan);

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as Stripe.Invoice)?.payment_intent
          ? ((subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent).client_secret
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelUserSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const subscription = await Subscription.findOne({
      where: { userId, status: 'ACTIVE' },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new AppError('Assinatura não encontrada', 404);
    }

    await cancelSubscription(subscription.stripeSubscriptionId);

    res.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { amount, currency = 'USD', description, metadata } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!amount) {
      throw new AppError('Valor é obrigatório', 400);
    }

    const paymentIntent = await createPaymentIntent(userId, amount, currency, description, metadata);

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const webhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    return;
  }

  try {
    await handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const subscription = await Subscription.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    next(error);
  }
};

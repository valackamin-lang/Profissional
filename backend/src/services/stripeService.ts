import Stripe from 'stripe';
import dotenv from 'dotenv';
import Subscription from '../models/Subscription';
import Payment from '../models/Payment';
import User from '../models/User';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const createCustomer = async (userId: string, email: string): Promise<string> => {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer.id;
};

export const createSubscription = async (
  userId: string,
  customerId: string,
  priceId: string,
  plan: 'MONTHLY' | 'ANNUAL'
): Promise<Stripe.Subscription> => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });

  // Save subscription to database
  await Subscription.create({
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    plan,
    status: 'ACTIVE',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });

  return subscription;
};

export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  const dbSubscription = await Subscription.findOne({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (dbSubscription) {
    dbSubscription.cancelAtPeriodEnd = true;
    await dbSubscription.save();
  }
};

export const createPaymentIntent = async (
  userId: string,
  amount: number,
  currency: string = 'USD',
  description?: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    description,
    metadata: {
      userId,
      ...metadata,
    },
  });

  // Save payment to database
  await Payment.create({
    userId,
    stripePaymentIntentId: paymentIntent.id,
    amount,
    currency,
    type: metadata?.type as any || 'EVENT',
    status: 'PENDING',
    description,
    metadata: metadata as any,
  });

  return paymentIntent;
};

export const handleWebhook = async (event: Stripe.Event): Promise<void> => {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscriptionFromStripe(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const dbSubscription = await Subscription.findOne({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (dbSubscription) {
        dbSubscription.status = 'CANCELLED';
        await dbSubscription.save();
      }
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const dbPayment = await Payment.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
      });
      if (dbPayment) {
        dbPayment.status = 'COMPLETED';
        await dbPayment.save();
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const dbPayment = await Payment.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
      });
      if (dbPayment) {
        dbPayment.status = 'FAILED';
        await dbPayment.save();
      }
      break;
    }
  }
};

const updateSubscriptionFromStripe = async (subscription: Stripe.Subscription): Promise<void> => {
  const dbSubscription = await Subscription.findOne({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (dbSubscription) {
    dbSubscription.status = mapStripeStatus(subscription.status);
    dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    dbSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    await dbSubscription.save();
  }
};

const mapStripeStatus = (status: string): 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE' => {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELLED';
    case 'past_due':
      return 'PAST_DUE';
    default:
      return 'EXPIRED';
  }
};

export { stripe };

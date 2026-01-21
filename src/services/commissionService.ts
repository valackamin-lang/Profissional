import Payment from '../models/Payment';
import { stripe } from './stripeService';
import Profile from '../models/Profile';
import User from '../models/User';

const COMMISSION_RATE = 0.15; // 15% commission

export const calculateCommission = (amount: number): { commission: number; payout: number } => {
  const commission = amount * COMMISSION_RATE;
  const payout = amount - commission;
  return { commission, payout };
};

export const processCommission = async (
  paymentId: string,
  recipientProfileId: string,
  amount: number
): Promise<void> => {
  const { commission, payout } = calculateCommission(amount);

  // Get recipient profile
  const recipientProfile = await Profile.findByPk(recipientProfileId, {
    include: [{ model: User, as: 'user' }],
  });

  if (!recipientProfile || !recipientProfile.user) {
    throw new Error('Perfil do destinatário não encontrado');
  }

  // Get or create Stripe account for recipient
  // In production, you would use Stripe Connect for this
  // For now, we'll just record the commission

  // Create commission payment record
  await Payment.create({
    userId: recipientProfile.user.id,
    amount: payout,
    currency: 'USD',
    type: 'COMMISSION',
    status: 'PENDING',
    description: `Comissão de ${amount} (${(COMMISSION_RATE * 100).toFixed(0)}% retido)`,
    metadata: {
      originalPaymentId: paymentId,
      commission,
      payout,
      commissionRate: COMMISSION_RATE,
    },
  });

  // In production, you would transfer funds using Stripe Connect:
  // await stripe.transfers.create({
  //   amount: Math.round(payout * 100),
  //   currency: 'usd',
  //   destination: recipientStripeAccountId,
  // });
};

export const getCommissionStats = async (profileId: string): Promise<{
  totalEarnings: number;
  totalCommissions: number;
  pendingPayouts: number;
  completedPayouts: number;
}> => {
  const profile = await Profile.findByPk(profileId, {
    include: [{ model: User, as: 'user' }],
  });

  if (!profile || !profile.user) {
    throw new Error('Perfil não encontrado');
  }

  const payments = await Payment.findAll({
    where: {
      userId: profile.user.id,
      type: 'COMMISSION',
    },
  });

  const totalEarnings = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCommissions = payments.reduce(
    (sum, p) => sum + Number(p.metadata?.commission || 0),
    0
  );
  const pendingPayouts = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const completedPayouts = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    totalEarnings,
    totalCommissions,
    pendingPayouts,
    completedPayouts,
  };
};

export const getCommissionHistory = async (
  profileId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ payments: Payment[]; total: number }> => {
  const profile = await Profile.findByPk(profileId, {
    include: [{ model: User, as: 'user' }],
  });

  if (!profile || !profile.user) {
    throw new Error('Perfil não encontrado');
  }

  const offset = (page - 1) * limit;

  const { count, rows: payments } = await Payment.findAndCountAll({
    where: {
      userId: profile.user.id,
      type: 'COMMISSION',
    },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { payments, total: count };
};

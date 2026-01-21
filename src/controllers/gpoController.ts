import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import Payment from '../models/Payment';
import Profile from '../models/Profile';
import Mentorship from '../models/Mentorship';
import Event from '../models/Event';
import { GPOService } from '../services/gpoService';
import AuditLog from '../models/AuditLog';
import MentorshipSubscription from '../models/MentorshipSubscription';
import EventRegistration from '../models/EventRegistration';

const gpoService = new GPOService();

/**
 * Gera token de pagamento para mentoria ou evento
 */
export const generatePurchaseToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { mentorshipId, eventId } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!mentorshipId && !eventId) {
      throw new AppError('mentorshipId ou eventId é obrigatório', 400);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Buscar mentoria ou evento
    let resource: Mentorship | Event | null = null;
    let amount = 0;
    let type: 'MENTORSHIP' | 'EVENT' = 'MENTORSHIP';
    let resourceId: string;

    if (mentorshipId) {
      resource = await Mentorship.findByPk(mentorshipId);
      if (!resource) {
        throw new AppError('Mentoria não encontrada', 404);
      }
      amount = Number(resource.price) || 0;
      type = 'MENTORSHIP';
      resourceId = mentorshipId;
    } else if (eventId) {
      resource = await Event.findByPk(eventId);
      if (!resource) {
        throw new AppError('Evento não encontrado', 404);
      }
      amount = Number(resource.price) || 0;
      type = 'EVENT';
      resourceId = eventId;
    } else {
      throw new AppError('mentorshipId ou eventId é obrigatório', 400);
    }

    if (amount <= 0) {
      throw new AppError('Recurso não possui valor configurado', 400);
    }

    // Verificar se já existe pagamento completo
    const existingPayment = await Payment.findOne({
      where: {
        userId,
        ...(mentorshipId ? { mentorshipId } : { eventId }),
        status: 'COMPLETED',
      },
    });

    if (existingPayment) {
      throw new AppError('Já existe um pagamento completo para este recurso', 409);
    }

    // Cancelar pagamentos pendentes anteriores
    await Payment.update(
      { status: 'CANCELLED', failureReason: 'Nova tentativa de pagamento iniciada' },
      {
        where: {
          userId,
          ...(mentorshipId ? { mentorshipId } : { eventId }),
          status: ['PENDING', 'PROCESSING'],
        },
      }
    );

    // Gerar referência única
    const reference = await GPOService.generateReference();

    // Criar registro de pagamento
    const payment = await Payment.create({
      userId,
      mentorshipId: mentorshipId || undefined,
      eventId: eventId || undefined,
      reference,
      amount,
      currency: 'AOA',
      type,
      status: 'PENDING',
    });

    // Gerar token no GPO
    const gpoResponse = await gpoService.generatePurchaseToken(reference, amount);

    // Atualizar pagamento com token
    payment.gpoPurchaseToken = gpoResponse.id;
    await payment.save();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'PAYMENT',
      resourceId: payment.id,
      details: { type, reference, resourceId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        purchaseToken: gpoResponse.id,
        iframeUrl: gpoService.buildIframeUrl(gpoResponse.id),
        timeToLive: gpoResponse.timeToLive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Callback do GPO
 */
export const handleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reference, status, transaction_id, id, message, error } = req.body;

    if (!reference || !status) {
      throw new AppError('Dados inválidos no callback', 422);
    }

    const payment = await Payment.findOne({ where: { reference } });
    if (!payment) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    const gpoStatus = (status as string).toLowerCase();
    const transactionId = transaction_id || id;

    if (['completed', 'success', 'paid', 'approved'].includes(gpoStatus)) {
      payment.status = 'COMPLETED';
      payment.paidAt = new Date();
      if (transactionId) {
        payment.gpoTransactionId = transactionId;
      }
      payment.gpoResponse = req.body;
      await payment.save();

      // Criar inscrição automaticamente após pagamento bem-sucedido
      const profile = await Profile.findOne({ where: { userId: payment.userId } });
      if (profile) {
        if (payment.mentorshipId) {
          // Verificar se já existe inscrição
          const existingSubscription = await MentorshipSubscription.findOne({
            where: {
              mentorshipId: payment.mentorshipId,
              studentId: profile.id,
            },
          });

          if (!existingSubscription) {
            await MentorshipSubscription.create({
              mentorshipId: payment.mentorshipId,
              studentId: profile.id,
              status: 'ACTIVE',
            });
          }
        } else if (payment.eventId) {
          // Verificar se já existe registro
          const existingRegistration = await EventRegistration.findOne({
            where: {
              eventId: payment.eventId,
              attendeeId: profile.id,
            },
          });

          if (!existingRegistration) {
            await EventRegistration.create({
              eventId: payment.eventId,
              attendeeId: profile.id,
              status: 'CONFIRMED',
            });
          }
        }
      }

      // Audit log
      await AuditLog.create({
        userId: payment.userId,
        action: 'UPDATE',
        resource: 'PAYMENT',
        resourceId: payment.id,
        details: { status: 'COMPLETED', transactionId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    } else if (['failed', 'error', 'rejected', 'cancelled'].includes(gpoStatus)) {
      payment.status = 'FAILED';
      payment.failureReason = message || error || 'Pagamento falhou';
      payment.gpoResponse = req.body;
      await payment.save();
    } else {
      payment.status = 'PROCESSING';
      payment.gpoResponse = req.body;
      await payment.save();
    }

    res.json({
      success: true,
      message: 'Callback processado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica status do pagamento
 */
export const checkPaymentStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { paymentId } = req.params;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const payment = await Payment.findOne({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          reference: payment.reference,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paidAt: payment.paidAt,
          type: payment.type,
          mentorshipId: payment.mentorshipId,
          eventId: payment.eventId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica se existe pagamento para um recurso
 */
export const checkPaymentByResource = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { mentorshipId, eventId } = req.query;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!mentorshipId && !eventId) {
      throw new AppError('mentorshipId ou eventId é obrigatório', 400);
    }

    const payment = await Payment.findOne({
      where: {
        userId,
        ...(mentorshipId ? { mentorshipId: mentorshipId as string } : { eventId: eventId as string }),
        status: 'COMPLETED',
      },
    });

    res.json({
      success: true,
      data: {
        hasPayment: !!payment,
        payment: payment
          ? {
              id: payment.id,
              reference: payment.reference,
              amount: payment.amount,
              status: payment.status,
              paidAt: payment.paidAt,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

import Notification from '../models/Notification';
import User from '../models/User';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Função para criar transporter com credenciais limpas
const createEmailTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }

  const smtpHost = process.env.SMTP_HOST.trim();
  const smtpUser = process.env.SMTP_USER.trim();
  // Remover espaços da senha (App Passwords do Gmail podem ter espaços)
  const smtpPassword = process.env.SMTP_PASSWORD.replace(/\s+/g, '').trim();
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Configurações de timeout para produção
    connectionTimeout: 60000, // 60 segundos para estabelecer conexão
    socketTimeout: 60000, // 60 segundos para operações de socket
    greetingTimeout: 30000, // 30 segundos para greeting do servidor
    // Retry logic
    pool: true, // Usar connection pooling
    maxConnections: 5, // Máximo de conexões simultâneas
    maxMessages: 100, // Máximo de mensagens por conexão
    rateDelta: 1000, // Intervalo entre tentativas (ms)
    rateLimit: 14, // Limite de mensagens por rateDelta
  });
};

const emailTransporter = createEmailTransporter();

export const createNotification = async (
  userId: string,
  type: 'JOB' | 'EVENT' | 'MENTORSHIP' | 'APPLICATION' | 'SYSTEM',
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, any>
): Promise<Notification> => {
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    link,
    metadata,
    status: 'UNREAD',
  });

  // Send email notification (async, don't wait)
  sendEmailNotification(userId, title, message, link).catch((error) => {
    console.error('Error sending email notification:', error);
  });

  return notification;
};

const sendEmailNotification = async (
  userId: string,
  title: string,
  message: string,
  link?: string
): Promise<void> => {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.email) {
      return;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">${title}</h2>
        <p>${message}</p>
        ${link ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${link}" style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">Ver mais</a>` : ''}
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">FORGETECH Professional</p>
      </div>
    `;

    if (!emailTransporter) {
      console.warn('⚠️  SMTP não configurado. Email não será enviado.');
      return;
    }

    // Timeout adicional para o envio do email (60 segundos)
    const sendEmailPromise = emailTransporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: title,
      html: emailHtml,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout ao enviar email')), 60000);
    });

    await Promise.race([sendEmailPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.message === 'Timeout ao enviar email' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      console.error(`Timeout ao enviar email de notificação: A conexão com o servidor SMTP demorou muito. Verifique se a porta ${process.env.SMTP_PORT} está acessível.`);
      console.error(`💡 Dica: Em produção, verifique se a porta SMTP não está bloqueada pelo firewall.`);
    } else {
      console.error('Error sending email:', error);
      if (error.code) {
        console.error(`Código do erro: ${error.code}`);
      }
    }
  }
};

export const markAsRead = async (notificationId: string, userId: string): Promise<void> => {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId },
  });

  if (notification) {
    notification.status = 'READ';
    notification.readAt = new Date();
    await notification.save();
  }
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  await Notification.update(
    {
      status: 'READ',
      readAt: new Date(),
    },
    {
      where: {
        userId,
        status: 'UNREAD',
      },
    }
  );
};

export const getUserNotifications = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<{ notifications: Notification[]; total: number }> => {
  const where: any = { userId };
  if (unreadOnly) {
    where.status = 'UNREAD';
  }

  const offset = (page - 1) * limit;

  const { count, rows: notifications } = await Notification.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { notifications, total: count };
};

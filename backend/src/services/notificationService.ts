import Notification from '../models/Notification';
import User from '../models/User';
import logger from '../config/logger';



export const createNotification = async (
  userId: string,
  type: 'JOB' | 'EVENT' | 'MENTORSHIP' | 'APPLICATION' | 'SYSTEM' | 'FOLLOW',
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
import nodemailer from 'nodemailer';

  // Send email notification (async, don't wait)
  sendEmailNotification(userId, title, message, link).catch((error) => {
    logger.error('Error sending email notification:', error);
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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const fullLink = link ? `${frontendUrl}${link}` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">FORGETECH Professional</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">${title}</h2>
            <p>${message}</p>
            ${fullLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${fullLink}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver mais</a>
              </div>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              FORGETECH Professional - Plataforma de Desenvolvimento Profissional<br>
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </body>
      </html>
    `;

    if (!resend) {
    try {
            const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'onboarding@resend.dev';
      
            // SMTP email sending logic should be implemented here
            // Example: Use nodemailer or another SMTP library to send the email
            // ...existing code...
            // For example:
            // await smtpTransport.sendMail({
            //     from: fromEmail,
            //     to: user.email,
            //     subject: title,
            //     html: emailHtml,
            // });
      await resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: title,
        html: emailHtml,
      });
    } catch (error: any) {
      logger.error(`Erro ao enviar email de notificação: ${error.message || error}`);
      if (error.statusCode) {
        logger.error(`Código do erro: ${error.statusCode}`);
      }
    }
  } catch (error: any) {
    logger.error('Error sending email notification:', error);
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
              const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'onboarding@resend.dev';
              const smtpHost = process.env.SMTP_HOST || 'localhost';
              const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
              const smtpUser = process.env.SMTP_USER;
              const smtpPass = process.env.SMTP_PASSWORD;

              const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                } : undefined,
              });

              await transporter.sendMail({
                from: fromEmail,
                to: user.email,
                subject: title,
                html: emailHtml,
              });
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

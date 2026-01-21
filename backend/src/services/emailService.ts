import nodemailer from 'nodemailer';
import User from '../models/User';
import logger from '../config/logger';
import crypto from 'crypto';

// Verificar se as configurações SMTP estão disponíveis
const getEmailTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('⚠️  Configurações SMTP não encontradas. Emails não serão enviados.');
    return null;
  }

  // Limpar e validar credenciais
  const smtpHost = process.env.SMTP_HOST.trim();
  const smtpUser = process.env.SMTP_USER.trim();
  // Remover espaços da senha (App Passwords do Gmail podem ter espaços)
  const smtpPassword = process.env.SMTP_PASSWORD.replace(/\s+/g, '').trim();
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  // Validações
  if (!smtpUser || !smtpPassword) {
    logger.error('❌ SMTP_USER ou SMTP_PASSWORD estão vazios após limpeza');
    return null;
  }

  // Log de configuração (sem mostrar senha completa)
  logger.info(`📧 Configurando SMTP: ${smtpHost}:${smtpPort} | User: ${smtpUser} | Password: ${smtpPassword.length > 0 ? '***' + smtpPassword.slice(-4) : 'vazia'}`);

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    // Opções adicionais para melhor compatibilidade
    tls: {
      rejectUnauthorized: false, // Aceitar certificados auto-assinados (apenas desenvolvimento)
    },
  });
};

/**
 * Gera token de verificação de email
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Envia email de verificação
 */
export const sendVerificationEmail = async (userId: string): Promise<void> => {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.email) {
      throw new Error('Usuário não encontrado ou sem email');
    }

    // Se já está verificado, não enviar
    if (user.isEmailVerified) {
      logger.info(`Usuário ${user.email} já está verificado`);
      return;
    }

    // Gerar token de verificação
    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expira em 24 horas

    // Salvar token no usuário
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // Construir URL de verificação
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    // Template do email
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
            <h2 style="color: #333; margin-top: 0;">Verifique seu email</h2>
            <p>Olá,</p>
            <p>Obrigado por se registrar na FORGETECH Professional! Para completar seu cadastro, por favor verifique seu endereço de email clicando no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar Email</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Importante:</strong> Este link expira em 24 horas. Se você não criou esta conta, pode ignorar este email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              FORGETECH Professional - Plataforma de Desenvolvimento Profissional<br>
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
FORGETECH Professional - Verificação de Email

Olá,

Obrigado por se registrar na FORGETECH Professional! Para completar seu cadastro, por favor verifique seu endereço de email acessando o link abaixo:

${verificationUrl}

Este link expira em 24 horas. Se você não criou esta conta, pode ignorar este email.

FORGETECH Professional
    `;

    const transporter = getEmailTransporter();
    if (!transporter) {
      logger.warn(`⚠️  Não foi possível enviar email de verificação para ${user.email} - SMTP não configurado`);
      return;
    }

    try {
      await transporter.sendMail({
        from: `"FORGETECH Professional" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Verifique seu email - FORGETECH Professional',
        html: emailHtml,
        text: emailText,
      });

      logger.info(`✅ Email de verificação enviado para ${user.email}`);
    } catch (smtpError: any) {
      // Tratamento específico de erros SMTP
      let errorMessage = `Erro ao enviar email de verificação para ${user.email}`;
      
      if (smtpError.code === 'EAUTH') {
        errorMessage = `Erro de autenticação SMTP: ${smtpError.message}`;
        logger.error(`${errorMessage}\n💡 Dica: Verifique se está usando uma "App Password" do Gmail, não a senha normal.`);
        logger.error('📖 Consulte CONFIGURACAO_SMTP.md para instruções detalhadas.');
      } else if (smtpError.code === 'ECONNECTION') {
        errorMessage = `Erro de conexão SMTP: Não foi possível conectar ao servidor ${process.env.SMTP_HOST}`;
        logger.error(`${errorMessage}\n💡 Dica: Verifique SMTP_HOST e SMTP_PORT no arquivo .env`);
      } else if (smtpError.responseCode === 535) {
        errorMessage = `Erro de autenticação: Credenciais SMTP inválidas`;
        logger.error(`${errorMessage}\n💡 Dica: Para Gmail, você precisa usar uma "App Password" (senha de aplicativo).`);
        logger.error('📖 Consulte CONFIGURACAO_SMTP.md para instruções detalhadas.');
      } else {
        errorMessage = `Erro SMTP: ${smtpError.message}`;
        logger.error(errorMessage);
      }
      
      // Não lançar erro para não quebrar o registro do usuário
      // O token já foi salvo, então o usuário pode solicitar reenvio
      logger.warn(`⚠️  Email não enviado, mas token de verificação foi gerado. Usuário pode solicitar reenvio.`);
      return;
    }
  } catch (error: any) {
    logger.error(`Erro ao processar verificação de email: ${error.message}`);
    // Não lançar erro para não quebrar o registro
    return;
  }
};

/**
 * Reenvia email de verificação
 */
export const resendVerificationEmail = async (email: string): Promise<void> => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.isEmailVerified) {
      throw new Error('Email já está verificado');
    }

    await sendVerificationEmail(user.id);
  } catch (error: any) {
    logger.error(`Erro ao reenviar email de verificação: ${error.message}`);
    throw error;
  }
};

/**
 * Verifica token de verificação de email
 */
export const verifyEmailToken = async (token: string): Promise<User> => {
  const user = await User.findOne({
    where: {
      emailVerificationToken: token,
    },
  });

  if (!user) {
    throw new Error('Token de verificação inválido');
  }

  if (user.isEmailVerified) {
    throw new Error('Email já está verificado');
  }

  if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
    throw new Error('Token de verificação expirado. Por favor, solicite um novo email de verificação.');
  }

  // Marcar email como verificado
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info(`Email verificado para ${user.email}`);

  return user;
};

/**
 * Envia email de recuperação de senha
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  try {
    const user = await User.findOne({ where: { email } });
    
    // Por segurança, não revelar se o email existe ou não
    if (!user) {
      logger.warn(`Tentativa de reset de senha para email não cadastrado: ${email}`);
      return; // Não lançar erro para não revelar que o email não existe
    }

    // Gerar token de reset
    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira em 1 hora

    // Salvar token no usuário
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Construir URL de reset
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Template do email
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
            <h2 style="color: #333; margin-top: 0;">Recuperação de Senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta na FORGETECH Professional.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Senha</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Importante:</strong> Este link expira em 1 hora. Se você não solicitou a recuperação de senha, ignore este email e sua senha permanecerá inalterada.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              FORGETECH Professional - Plataforma de Desenvolvimento Profissional<br>
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
FORGETECH Professional - Recuperação de Senha

Olá,

Recebemos uma solicitação para redefinir a senha da sua conta na FORGETECH Professional.

Acesse o link abaixo para criar uma nova senha:

${resetUrl}

Este link expira em 1 hora. Se você não solicitou a recuperação de senha, ignore este email.

FORGETECH Professional
    `;

    const transporter = getEmailTransporter();
    if (!transporter) {
      logger.warn(`⚠️  Não foi possível enviar email de recuperação para ${email} - SMTP não configurado`);
      return;
    }

    try {
      await transporter.sendMail({
        from: `"FORGETECH Professional" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Recuperação de Senha - FORGETECH Professional',
        html: emailHtml,
        text: emailText,
      });

      logger.info(`✅ Email de recuperação de senha enviado para ${user.email}`);
    } catch (smtpError: any) {
      logger.error(`Erro ao enviar email de recuperação: ${smtpError.message}`);
      // Não lançar erro para não revelar se o email existe
      return;
    }
  } catch (error: any) {
    logger.error(`Erro ao processar recuperação de senha: ${error.message}`);
    // Não lançar erro para não revelar se o email existe
    return;
  }
};

/**
 * Verifica token de recuperação de senha
 */
export const verifyPasswordResetToken = async (token: string): Promise<User> => {
  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
    },
  });

  if (!user) {
    throw new Error('Token de recuperação inválido');
  }

  if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
    throw new Error('Token de recuperação expirado. Por favor, solicite um novo email de recuperação.');
  }

  return user;
};

/**
 * Limpa token de recuperação após uso
 */
export const clearPasswordResetToken = async (userId: string): Promise<void> => {
  const user = await User.findByPk(userId);
  if (user) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }
};

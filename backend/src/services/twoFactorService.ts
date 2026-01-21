import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/User';
import { AppError } from '../utils/AppError';

export const generateTwoFactorSecret = async (userId: string): Promise<{ secret: string; qrCode: string }> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const secret = speakeasy.generateSecret({
    name: `FORGETECH (${user.email})`,
    issuer: 'FORGETECH Professional',
  });

  // Save secret temporarily (user needs to verify before enabling)
  user.twoFactorSecret = secret.base32;
  await user.save();

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
  };
};

export const verifyTwoFactorCode = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });
};

export const enableTwoFactor = async (userId: string, token: string): Promise<void> => {
  const user = await User.findByPk(userId);
  if (!user || !user.twoFactorSecret) {
    throw new AppError('Secret 2FA não encontrado', 404);
  }

  const isValid = verifyTwoFactorCode(user.twoFactorSecret, token);
  if (!isValid) {
    throw new AppError('Código 2FA inválido', 400);
  }

  user.twoFactorEnabled = true;
  await user.save();
};

export const disableTwoFactor = async (userId: string, token: string): Promise<void> => {
  const user = await User.findByPk(userId);
  if (!user || !user.twoFactorEnabled) {
    throw new AppError('2FA não está habilitado', 400);
  }

  if (!user.twoFactorSecret) {
    throw new AppError('Secret 2FA não encontrado', 404);
  }

  const isValid = verifyTwoFactorCode(user.twoFactorSecret, token);
  if (!isValid) {
    throw new AppError('Código 2FA inválido', 400);
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  await user.save();
};

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
  roleName?: string;
  permissions?: string[];
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET não configurado');
  }
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret') as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as TokenPayload;
};

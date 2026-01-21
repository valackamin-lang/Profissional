import { Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  passport.authenticate('google', async (err: any, user: any) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    try {
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      user.refreshToken = refreshToken;
      await user.save();

      // Audit log
      await AuditLog.create({
        userId: user.id,
        action: 'LOGIN',
        resource: 'USER',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { method: 'Google OAuth' },
      });

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
    } catch (error) {
      next(error);
    }
  })(req, res, next);
};

export const linkedinAuth = passport.authenticate('linkedin');

export const linkedinCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  passport.authenticate('linkedin', async (err: any, user: any) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    try {
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      user.refreshToken = refreshToken;
      await user.save();

      // Audit log
      await AuditLog.create({
        userId: user.id,
        action: 'LOGIN',
        resource: 'USER',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { method: 'LinkedIn OAuth' },
      });

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
    } catch (error) {
      next(error);
    }
  })(req, res, next);
};

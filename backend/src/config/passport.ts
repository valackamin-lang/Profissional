import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import User from '../models/User';
import Role from '../models/Role';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { email: profile.emails?.[0]?.value } });

        if (!user) {
          // Get default role (STUDENT)
          const defaultRole = await Role.findOne({ where: { name: 'STUDENT' } });
          if (!defaultRole) {
            return done(new Error('Role padrão não encontrada'), undefined);
          }

          user = await User.create({
            email: profile.emails?.[0]?.value || '',
            password: '', // OAuth users don't have passwords
            roleId: defaultRole.id,
            isEmailVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

(passport.use as any)(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      callbackURL: '/api/auth/linkedin/callback',
      scope: ['r_emailaddress', 'r_liteprofile'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Email não encontrado no perfil LinkedIn'), undefined);
        }

        let user = await User.findOne({ where: { email } });

        if (!user) {
          // Get default role (STUDENT)
          const defaultRole = await Role.findOne({ where: { name: 'STUDENT' } });
          if (!defaultRole) {
            return done(new Error('Role padrão não encontrada'), undefined);
          }

          user = await User.create({
            email,
            password: '', // OAuth users don't have passwords
            roleId: defaultRole.id,
            isEmailVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

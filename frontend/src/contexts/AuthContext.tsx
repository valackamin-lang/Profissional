'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, roleName?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
        }
      } catch (error) {
        // Silenciosamente falhar se não conseguir autenticar
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Debug: log da resposta
      console.log('Login response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erro ao fazer login');
      }

      const { accessToken, refreshToken: refresh, user: userData } = response.data.data;

      if (!accessToken || !refresh || !userData) {
        console.error('Missing data in response:', { accessToken: !!accessToken, refresh: !!refresh, userData: !!userData });
        throw new Error('Resposta do servidor incompleta');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refresh);
      }
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  };

  const register = async (email: string, password: string, roleName: string = 'STUDENT') => {
    const response = await api.post('/auth/register', { email, password, roleName });
    const { accessToken, refreshToken: refresh, user: userData } = response.data.data;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refresh);
    }
    setUser(userData);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    setUser(null);
    api.post('/auth/logout').catch(() => {});
  };

  const refreshToken = async () => {
    if (typeof window === 'undefined') {
      throw new Error('No refresh token');
    }

    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
      throw new Error('No refresh token');
    }

    const response = await api.post('/auth/refresh', { refreshToken: refresh });
    const { accessToken, refreshToken: newRefresh } = response.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefresh);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

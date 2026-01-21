'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      
      // Verificar se o email está verificado
      try {
        const response = await api.get('/auth/me');
        if (response.data.data?.user && !response.data.data.user.isEmailVerified) {
          setEmailNotVerified(true);
          setUserEmail(email);
        } else {
          router.push('/');
        }
      } catch {
        // Se não conseguir verificar, continuar normalmente
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Login</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entre com suas credenciais para acessar a plataforma
          </p>
        </div>
        {emailNotVerified ? (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <EnvelopeIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">Email não verificado</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  Seu email <strong>{userEmail}</strong> ainda não foi verificado. Por favor, verifique sua caixa de entrada e clique no link de verificação.
                </p>
                <div className="space-y-2">
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(userEmail)}`}
                    className="block w-full text-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    Reenviar Email de Verificação
                  </Link>
                  <button
                    onClick={() => {
                      setEmailNotVerified(false);
                      router.push('/');
                    }}
                    className="block w-full text-center px-4 py-2 border border-yellow-300 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors text-sm"
                  >
                    Continuar mesmo assim
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </form>
        )}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Credenciais de teste:</p>
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Criar conta
            </Link>
          </p>
          <p className="text-xs text-gray-500 mt-2">Admin: admin@forgetech.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

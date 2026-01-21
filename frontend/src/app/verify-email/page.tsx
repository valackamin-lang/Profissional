'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../components/Header';
import api from '../../lib/api';
import {
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>(emailParam || '');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/auth/verify-email?token=${verificationToken}`);
      
      if (response.data.success) {
        setSuccess(true);
        setEmail(response.data.data.user.email);
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error verifying email:', err);
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        'Erro ao verificar email. O token pode estar inválido ou expirado.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Por favor, informe seu email');
      return;
    }

    try {
      setResending(true);
      setError(null);

      await api.post('/auth/resend-verification', { email });

      setSuccess(true);
      setError(null);
    } catch (err: any) {
      console.error('Error resending verification:', err);
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        'Erro ao reenviar email de verificação.';
      setError(errorMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificando email...</h2>
              <p className="text-gray-600">Aguarde enquanto verificamos seu email.</p>
            </div>
          )}

          {success && !loading && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verificado!</h2>
              <p className="text-gray-600 mb-6">
                Seu email foi verificado com sucesso. Você será redirecionado para a página de login em instantes.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Ir para Login
              </Link>
            </div>
          )}

          {error && !loading && !success && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <XCircleIcon className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro na Verificação</h2>
              <p className="text-gray-600 mb-6">{error}</p>

              {error.includes('expirado') || error.includes('inválido') ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reenviar email de verificação
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={handleResend}
                        disabled={resending}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {resending ? 'Enviando...' : 'Reenviar'}
                      </button>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Voltar para Login
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Voltar para Login
                </Link>
              )}
            </div>
          )}

          {!token && !loading && !error && !success && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <EnvelopeIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificar Email</h2>
              <p className="text-gray-600 mb-6">
                Por favor, informe seu email para reenviarmos o link de verificação.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {resending ? 'Enviando...' : 'Reenviar Email de Verificação'}
                </button>
                <Link
                  href="/login"
                  className="inline-flex items-center text-gray-600 hover:text-gray-700"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Voltar para Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { paymentService } from '../../../../lib/paymentService';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { Header } from '../../../../components/Header';
import api from '../../../../lib/api';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Mentorship {
  id: string;
  title: string;
  price: number;
}

export default function MentorshipPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const mentorshipId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [mentorship, setMentorship] = useState<Mentorship | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (user && mentorshipId && !iframeUrl && !initializedRef.current) {
      initializedRef.current = true;
      loadMentorship();
      initializePayment();
    }
  }, [user, mentorshipId]);

  // Listener para postMessage do GPO
  useEffect(() => {
    if (!paymentId || paymentCompleted) return;

    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = [
        'https://gpo.emis.co.ao',
        'https://cerpagamentonline.emis.co.ao',
      ];

      if (!allowedOrigins.includes(event.origin)) return;

      const status = event.data?.status || event.data?.Status;

      if (['completed', 'success', 'paid'].includes(status)) {
        handlePaymentSuccess();
      } else if (['failed', 'error', 'cancelled'].includes(status)) {
        handlePaymentFailure(event.data?.message || 'Pagamento falhou');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [paymentId, paymentCompleted]);

  const loadMentorship = async () => {
    try {
      const response = await api.get(`/mentorships/${mentorshipId}`);
      setMentorship(response.data.data.mentorship);
    } catch (err) {
      console.error('Error loading mentorship:', err);
    }
  };

  const initializePayment = async () => {
    if (loading || iframeUrl) return;

    try {
      setLoading(true);
      setError(null);

      const response = await paymentService.generatePurchaseToken(mentorshipId);

      if (response.success && response.data.iframeUrl) {
        setIframeUrl(response.data.iframeUrl);
        setPaymentId(response.data.paymentId);
      } else {
        throw new Error('Erro ao gerar token de pagamento');
      }
    } catch (err: any) {
      console.error('Error initializing payment:', err);
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        'Erro ao inicializar pagamento. Tente novamente.';
      setError(errorMessage);
      initializedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentCompleted(true);

    // Verificar status após delay
    setTimeout(async () => {
      if (paymentId) {
        try {
          const status = await paymentService.checkPaymentStatus(paymentId);
          if (status.data.payment.status === 'COMPLETED') {
            setTimeout(() => {
              router.push(`/mentorships/${mentorshipId}`);
            }, 2000);
          }
        } catch (err) {
          console.error('Error checking payment status:', err);
        }
      }
    }, 1000);
  };

  const handlePaymentFailure = (message: string) => {
    setError(message);
  };

  const handleRetry = () => {
    setError(null);
    setPaymentCompleted(false);
    initializedRef.current = false;
    setIframeUrl(null);
    setPaymentId(null);
    initializePayment();
  };

  const handleBack = () => {
    router.push(`/mentorships/${mentorshipId}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar para a Mentoria
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Pagamento da Mentoria</h1>
            <p className="text-gray-600 mt-1">Complete o pagamento para finalizar sua inscrição</p>
          </div>

          {mentorship && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{mentorship.title}</h2>
              <div className="text-3xl font-bold text-primary-600">
                {new Intl.NumberFormat('pt-AO', {
                  style: 'currency',
                  currency: 'AOA',
                }).format(mentorship.price)}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
                <div className="flex">
                  <XCircleIcon className="h-5 w-5 text-red-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {paymentCompleted && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 m-6">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">
                      Pagamento realizado com sucesso! Redirecionando...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando gateway de pagamento...</p>
                </div>
              </div>
            )}

            {!loading && !error && iframeUrl && !paymentCompleted && (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden m-6">
                <iframe
                  src={iframeUrl}
                  className="w-full h-[600px]"
                  title="Gateway de Pagamento GPO"
                  allow="payment"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

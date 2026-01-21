"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../src/contexts/AuthContext';
import { paymentService, PaymentTokenResponse } from '../../src/lib/paymentService';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { Header } from '../../src/components/Header';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const courseId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const initializedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Inicializar pagamento quando a página carregar
  useEffect(() => {
    console.log('Payment page useEffect triggered', {
      initialized: initializedRef.current,
      hasIframeUrl: !!iframeUrl,
      isAuthenticated,
      hasUser: !!user,
      courseId,
      userId: user?.id
    });

    // Se já foi inicializado ou já tem iframe, não fazer nada
    if (initializedRef.current || iframeUrl) {
      console.log('Skipping initialization - already done');
      return;
    }

    // Se não estiver autenticado, redirecionar
    if (!isAuthenticated || !user) {
      console.log('Not authenticated, redirecting...');
      router.push(`/curso/${courseId}`);
      return;
    }

    // Se não tiver courseId, não fazer nada
    if (!courseId) {
      console.log('No courseId, waiting...');
      return;
    }

    // Tudo ok, inicializar
    console.log('✅ Starting payment initialization...');
    initializedRef.current = true;
    initializePayment();
  }, [courseId, isAuthenticated, user?.id, router]);

  // Listener para postMessage do GPO
  useEffect(() => {
    // Só adicionar listener se tiver paymentId e não estiver completado
    if (!paymentId || paymentCompleted) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // Validar origem para garantir segurança
      // Aceitar tanto gpo.emis.co.ao quanto cerpagamentonline.emis.co.ao
      const allowedOrigins = [
        'https://gpo.emis.co.ao',
        'https://cerpagamentonline.emis.co.ao'
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      console.log('Received message from GPO:', event.data);

      // Processar dados da mensagem
      if (event.data && typeof event.data === 'object') {
        const status = event.data.status || event.data.Status;
        
        if (status === 'completed' || status === 'success' || status === 'paid') {
          handlePaymentSuccess();
        } else if (status === 'failed' || status === 'error' || status === 'cancelled') {
          handlePaymentFailure(event.data.message || 'Pagamento falhou');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [paymentId, paymentCompleted]);

  const initializePayment = async () => {
    console.log('🔄 initializePayment called', { hasIframeUrl: !!iframeUrl, hasUser: !!user, courseId });
    
    // Evitar múltiplas chamadas simultâneas
    if (iframeUrl) {
      console.log('⚠️ Skipping - already has iframeUrl');
      return;
    }

    if (!user || !courseId) {
      console.log('⚠️ Skipping - missing user or courseId', { hasUser: !!user, courseId });
      return;
    }

    if (loading) {
      console.log('⚠️ Skipping - already loading');
      return;
    }

    console.log('✅ Calling generatePurchaseToken...', { 
      courseId, 
      userId: user.id, 
      userEmail: user.email
    });
    
    try {
      setLoading(true);
      setError(null);

      // Gerar token de pagamento
      console.log('Requesting payment token from API...');
      const response = await paymentService.generatePurchaseToken(
        courseId, // mentorshipId
        undefined // eventId
      );

      console.log('Payment token response:', response);

      if (response.success && response.data.iframeUrl && response.data.paymentId) {
        console.log('Payment token generated successfully:', { iframeUrl: response.data.iframeUrl, paymentId: response.data.paymentId });
        setIframeUrl(response.data.iframeUrl);
        setPaymentId(response.data.paymentId);
      } else {
        console.error('Payment token generation failed:', response);
        throw new Error('Erro ao gerar token de pagamento');
      }
    } catch (err: any) {
      console.error('❌ Error initializing payment:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao inicializar pagamento. Tente novamente.';
      console.error('Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        stack: err?.stack
      });
      setError(errorMessage);
      initializedRef.current = false; // Permitir nova tentativa em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentCompleted(true);

    // Verificar status do pagamento após um pequeno delay
    setTimeout(async () => {
      if (paymentId) {
        try {
          const status = await paymentService.checkPaymentStatus(paymentId);
          if (status.data.payment.status === 'COMPLETED') {
            // Redirecionar para a página do curso após 2 segundos
            setTimeout(() => {
              router.push(`/curso/${courseId}`);
            }, 2000);
          }
        } catch (err) {
          console.error('Error checking payment status:', err);
        }
      }
    }, 1000);
  };

  const handlePaymentFailure = (message: string) => {
    setError(message || 'O pagamento falhou. Tente novamente.');
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
    router.push(`/curso/${courseId}`);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Pagamento do Curso
            </h1>
            <p className="text-base text-gray-600 text-center mb-8">
              Complete o pagamento para finalizar sua matrícula
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-center">
                {error}
                <button
                  onClick={handleRetry}
                  className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Tentar Novamente
                </button>
              </div>
            )}

            {paymentCompleted && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 text-center">
                Pagamento realizado com sucesso! Redirecionando...
              </div>
            )}

            {loading && (
              <div className="w-full min-h-[600px] border-2 border-gray-200 rounded-xl overflow-hidden mb-5 bg-gray-50 flex items-center justify-center">
                <div className="text-center text-gray-600 text-base">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  Carregando gateway de pagamento...
                </div>
              </div>
            )}

            {!loading && !error && iframeUrl && !paymentCompleted && (
              <div className="w-full min-h-[600px] border-2 border-gray-200 rounded-xl overflow-hidden mb-5 bg-gray-50 flex items-center justify-center">
                <iframe
                  ref={iframeRef}
                  src={iframeUrl}
                  title="Gateway de Pagamento GPO"
                  allow="payment"
                  className="w-full h-[600px] border-none"
                />
              </div>
            )}

            <button
              onClick={handleBack}
              className="w-full px-4 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-xl text-sm font-semibold cursor-pointer mt-3 transition-all hover:bg-gray-50"
            >
              Voltar para o Curso
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

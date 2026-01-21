'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../lib/api';
import { paymentService } from '../../../lib/paymentService';
import {
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  StarIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface Mentorship {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  maxStudents?: number;
  currentStudents?: number;
  mentor?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export default function MentorshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [mentorship, setMentorship] = useState<Mentorship | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id && user) {
      loadMentorship();
      checkSubscription();
    }
  }, [params.id, user]);

  const loadMentorship = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/mentorships/${params.id}`);
      setMentorship(response.data.data.mentorship);
    } catch (error: any) {
      console.error('Error loading mentorship:', error);
      setError('Erro ao carregar mentoria');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/mentorships/${params.id}/subscriptions/me`);
      setIsSubscribed(response.data.data.isSubscribed || false);
    } catch (error) {
      setIsSubscribed(false);
    }
  };

  const handleSubscribe = async () => {
    if (!mentorship) return;

    try {
      setSubscribing(true);
      setError('');

      // Se a mentoria tem preço, verificar se já foi pago
      if (mentorship.price && mentorship.price > 0) {
        try {
          const paymentCheck = await paymentService.checkPaymentByResource(mentorship.id);
          
          if (!paymentCheck.data.hasPayment) {
            // Redirecionar para página de pagamento
            router.push(`/mentorships/${mentorship.id}/payment`);
            setSubscribing(false);
            return;
          }
        } catch (paymentError) {
          // Se houver erro ao verificar pagamento, tentar criar inscrição mesmo assim
          console.error('Error checking payment:', paymentError);
        }
      }

      // Criar inscrição
      await api.post(`/mentorships/${mentorship.id}/subscriptions`, {});
      setIsSubscribed(true);
      // Reload mentorship to update currentStudents
      await loadMentorship();
    } catch (error: any) {
      console.error('Error subscribing:', error);
      // Se o erro for sobre pagamento necessário, redirecionar
      if (error.response?.status === 402 || error.response?.data?.error?.message?.includes('pagamento')) {
        router.push(`/mentorships/${mentorship.id}/payment`);
      } else {
        setError(error.response?.data?.error?.message || 'Erro ao inscrever-se');
      }
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!mentorship) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Mentoria não encontrada</p>
              <button
                onClick={() => router.back()}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                ← Voltar
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const occupancyRate = mentorship.maxStudents 
    ? Math.round(((mentorship.currentStudents || 0) / mentorship.maxStudents) * 100) 
    : 0;
  const spotsLeft = mentorship.maxStudents 
    ? mentorship.maxStudents - (mentorship.currentStudents || 0) 
    : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Status de Inscrição - Banner Superior */}
          {isSubscribed && (
            <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircleIconSolid className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-lg">Você está inscrito nesta mentoria!</h3>
                  <p className="text-sm text-green-100">Acompanhe seu progresso e acesse os materiais exclusivos.</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8">
                  <button
                    onClick={() => router.back()}
                    className="text-white/80 hover:text-white mb-4 text-sm flex items-center"
                  >
                    ← Voltar
                  </button>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-white mb-2">{mentorship.title}</h1>
                      <div className="flex items-center space-x-4 mt-4">
                        {mentorship.mentor?.id ? (
                          <Link
                            href={`/profiles/${mentorship.mentor.id}`}
                            className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
                          >
                            {mentorship.mentor.avatar ? (
                              <img
                                src={mentorship.mentor.avatar}
                                alt={mentorship.mentor.firstName || 'Mentor'}
                                className="h-10 w-10 rounded-full border-2 border-white/30"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                <AcademicCapIcon className="h-6 w-6 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">Mentor</p>
                              <p className="text-sm">
                                {mentorship.mentor?.firstName || ''} {mentorship.mentor?.lastName || ''}
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex items-center space-x-2 text-white/90">
                            <AcademicCapIcon className="h-6 w-6" />
                            <div>
                              <p className="text-sm font-medium">Mentor</p>
                              <p className="text-sm">
                                {mentorship.mentor?.firstName || ''} {mentorship.mentor?.lastName || ''}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Badges de Informação */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center px-4 py-2 bg-indigo-100 rounded-lg">
                      <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      <div>
                        <p className="text-xs text-gray-600">Preço</p>
                        <p className="font-bold text-indigo-900">
                          Kz {typeof mentorship.price === 'number' ? mentorship.price.toFixed(2) : parseFloat(mentorship.price || '0').toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center px-4 py-2 bg-purple-100 rounded-lg">
                      <ClockIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <div>
                        <p className="text-xs text-gray-600">Duração</p>
                        <p className="font-bold text-purple-900">{mentorship.duration} horas</p>
                      </div>
                    </div>
                    {mentorship.maxStudents && (
                      <div className="flex items-center px-4 py-2 bg-blue-100 rounded-lg">
                        <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Vagas</p>
                          <p className="font-bold text-blue-900">
                            {mentorship.currentStudents || 0}/{mentorship.maxStudents}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className={`flex items-center px-4 py-2 rounded-lg ${
                      mentorship.status === 'ACTIVE' ? 'bg-green-100' :
                      mentorship.status === 'INACTIVE' ? 'bg-gray-100' :
                      'bg-red-100'
                    }`}>
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        mentorship.status === 'ACTIVE' ? 'bg-green-500' :
                        mentorship.status === 'INACTIVE' ? 'bg-gray-500' :
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-xs text-gray-600">Status</p>
                        <p className={`font-bold ${
                          mentorship.status === 'ACTIVE' ? 'text-green-900' :
                          mentorship.status === 'INACTIVE' ? 'text-gray-900' :
                          'text-red-900'
                        }`}>
                          {mentorship.status === 'ACTIVE' ? 'Ativa' :
                           mentorship.status === 'INACTIVE' ? 'Inativa' : 'Suspensa'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso de Ocupação */}
                  {mentorship.maxStudents && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Ocupação</span>
                        <span className="text-sm text-gray-600">
                          {occupancyRate}% • {spotsLeft !== null && spotsLeft > 0 ? `${spotsLeft} vagas restantes` : 'Lotada'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            occupancyRate >= 90 ? 'bg-red-500' :
                            occupancyRate >= 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Descrição */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Sobre esta Mentoria</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{mentorship.description}</p>
                    </div>
                  </div>

                  {/* Sobre o Mentor */}
                  {mentorship.mentor?.bio && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Sobre o Mentor</h2>
                      <p className="text-gray-700">{mentorship.mentor.bio}</p>
                      {mentorship.mentor.id && (
                        <Link
                          href={`/profiles/${mentorship.mentor.id}`}
                          className="inline-flex items-center mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Ver perfil completo do mentor →
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Informações Adicionais */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Publicado em</p>
                        <p className="font-medium text-gray-900">
                          {new Date(mentorship.createdAt).toLocaleDateString('pt-AO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {mentorship.updatedAt && (
                        <div>
                          <p className="text-gray-500">Última atualização</p>
                          <p className="font-medium text-gray-900">
                            {new Date(mentorship.updatedAt).toLocaleDateString('pt-AO', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Card de Ação */}
              {user?.role === 'STUDENT' && mentorship.status === 'ACTIVE' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                  {isSubscribed ? (
                    <div className="text-center">
                      <CheckCircleIconSolid className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Inscrição Confirmada</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Você está inscrito nesta mentoria. Acompanhe seu progresso e acesse os materiais exclusivos.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-green-600">Inscrito</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duração:</span>
                          <span className="font-medium">{mentorship.duration}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Investimento:</span>
                          <span className="font-medium">
                            Kz {typeof mentorship.price === 'number' ? mentorship.price.toFixed(2) : parseFloat(mentorship.price || '0').toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Inscrever-se</h3>
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Preço</span>
                          <span className="text-lg font-bold text-gray-900">
                            Kz {typeof mentorship.price === 'number' ? mentorship.price.toFixed(2) : parseFloat(mentorship.price || '0').toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Duração</span>
                          <span className="text-lg font-bold text-gray-900">{mentorship.duration} horas</span>
                        </div>
                        {spotsLeft !== null && (
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Vagas restantes</span>
                            <span className={`text-lg font-bold ${spotsLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {spotsLeft > 0 ? spotsLeft : 'Lotada'}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleSubscribe}
                        disabled={subscribing || (spotsLeft !== null && spotsLeft <= 0)}
                        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        {subscribing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Processando...</span>
                          </>
                        ) : spotsLeft !== null && spotsLeft <= 0 ? (
                          <>
                            <XCircleIcon className="h-5 w-5" />
                            <span>Mentoria Lotada</span>
                          </>
                        ) : (
                          <>
                            {mentorship.price && mentorship.price > 0 ? (
                              <CreditCardIcon className="h-5 w-5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5" />
                            )}
                            <span>
                              {mentorship.price && mentorship.price > 0
                                ? 'Pagar e Inscrever-se'
                                : 'Inscrever-se Agora'}
                            </span>
                          </>
                        )}
                      </button>
                      {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 5 && (
                        <p className="text-xs text-yellow-600 mt-2 text-center">
                          ⚠️ Apenas {spotsLeft} vaga{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Card de Estatísticas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taxa de Ocupação</span>
                    <span className="font-semibold text-gray-900">{occupancyRate}%</span>
                  </div>
                  {mentorship.maxStudents && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total de Vagas</span>
                      <span className="font-semibold text-gray-900">{mentorship.maxStudents}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estudantes Ativos</span>
                    <span className="font-semibold text-gray-900">{mentorship.currentStudents || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`font-semibold ${
                      mentorship.status === 'ACTIVE' ? 'text-green-600' :
                      mentorship.status === 'INACTIVE' ? 'text-gray-600' :
                      'text-red-600'
                    }`}>
                      {mentorship.status === 'ACTIVE' ? 'Ativa' :
                       mentorship.status === 'INACTIVE' ? 'Inativa' : 'Suspensa'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

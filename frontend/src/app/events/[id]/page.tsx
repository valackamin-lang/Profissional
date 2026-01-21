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
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  VideoCameraIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'WORKSHOP' | 'WEBINAR' | 'CONFERENCE';
  status: 'UPCOMING' | 'LIVE' | 'ENDED' | 'CANCELLED';
  eventDate: string;
  price?: number;
  maxAttendees?: number;
  currentAttendees?: number;
  videoLink?: string;
  location?: string;
  organizer?: {
    id?: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id && user) {
      loadEvent();
      checkRegistration();
    }
  }, [params.id, user]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${params.id}`);
      setEvent(response.data.data.event);
    } catch (error: any) {
      console.error('Error loading event:', error);
      setError('Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/events/${params.id}/registrations/me`);
      setIsRegistered(response.data.data.isRegistered || false);
    } catch (error) {
      setIsRegistered(false);
    }
  };

  const handleRegister = async () => {
    if (!event) return;

    try {
      setRegistering(true);
      setError('');

      // Se o evento tem preço, verificar se já foi pago
      if (event.price && event.price > 0) {
        try {
          const paymentCheck = await paymentService.checkPaymentByResource(undefined, event.id);
          
          if (!paymentCheck.data.hasPayment) {
            // Redirecionar para página de pagamento
            router.push(`/events/${event.id}/payment`);
            setRegistering(false);
            return;
          }
        } catch (paymentError) {
          // Se houver erro ao verificar pagamento, tentar criar registro mesmo assim
          console.error('Error checking payment:', paymentError);
        }
      }

      // Criar registro
      await api.post(`/events/${event.id}/registrations`, {});
      setIsRegistered(true);
      // Reload event to update currentAttendees
      await loadEvent();
    } catch (error: any) {
      console.error('Error registering:', error);
      // Se o erro for sobre pagamento necessário, redirecionar
      if (error.response?.status === 402 || error.response?.data?.error?.message?.includes('pagamento')) {
        router.push(`/events/${event.id}/payment`);
      } else {
        setError(error.response?.data?.error?.message || 'Erro ao inscrever-se');
      }
    } finally {
      setRegistering(false);
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

  if (!event) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Evento não encontrado</p>
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

  const eventDate = new Date(event.eventDate);
  const isPast = eventDate < new Date();
  const occupancyRate = event.maxAttendees 
    ? Math.round(((event.currentAttendees || 0) / event.maxAttendees) * 100) 
    : 0;
  const spotsLeft = event.maxAttendees 
    ? event.maxAttendees - (event.currentAttendees || 0) 
    : null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'WORKSHOP':
        return 'Workshop';
      case 'WEBINAR':
        return 'Webinar';
      case 'CONFERENCE':
        return 'Conferência';
      default:
        return type;
    }
  };

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
          {isRegistered && (
            <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircleIconSolid className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-lg">Você está inscrito neste evento!</h3>
                  <p className="text-sm text-green-100">
                    {event.status === 'LIVE' ? 'O evento está ao vivo agora!' :
                     event.status === 'UPCOMING' ? `O evento acontecerá em ${eventDate.toLocaleDateString('pt-AO')}` :
                     'Acompanhe as atualizações do evento.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-8">
                  <button
                    onClick={() => router.back()}
                    className="text-white/80 hover:text-white mb-4 text-sm flex items-center"
                  >
                    ← Voltar
                  </button>
                  <h1 className="text-3xl font-bold text-white mb-4">{event.title}</h1>
                  {event.organizer && (
                    <div className="flex items-center space-x-3">
                      {event.organizer.avatar ? (
                        <img
                          src={event.organizer.avatar}
                          alt={event.organizer.companyName || 'Organizador'}
                          className="h-10 w-10 rounded-full border-2 border-white/30"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                          <BuildingOfficeIcon className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-white/80">Organizado por</p>
                        <p className="text-sm font-medium text-white">
                          {event.organizer.companyName || 
                           `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() || 
                           'Organizador'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Badges de Informação */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center px-4 py-2 bg-purple-100 rounded-lg">
                      <CalendarIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <div>
                        <p className="text-xs text-gray-600">Data e Hora</p>
                        <p className="font-bold text-purple-900">
                          {eventDate.toLocaleDateString('pt-AO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {eventDate.toLocaleTimeString('pt-AO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center px-4 py-2 bg-blue-100 rounded-lg">
                      <div className="h-5 w-5 flex items-center justify-center text-blue-600 mr-2">
                        <span className="text-xs font-bold">{getTypeLabel(event.type).charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Tipo</p>
                        <p className="font-bold text-blue-900">{getTypeLabel(event.type)}</p>
                      </div>
                    </div>
                    {event.price !== undefined && (
                      <div className="flex items-center px-4 py-2 bg-green-100 rounded-lg">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Preço</p>
                          <p className="font-bold text-green-900">
                            {event.price === 0 || event.price === '0' ? 'Gratuito' : 
                             `Kz ${typeof event.price === 'number' ? event.price.toFixed(2) : parseFloat(event.price || '0').toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                    )}
                    {event.maxAttendees && (
                      <div className="flex items-center px-4 py-2 bg-indigo-100 rounded-lg">
                        <UserGroupIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Participantes</p>
                          <p className="font-bold text-indigo-900">
                            {event.currentAttendees || 0}/{event.maxAttendees}
                          </p>
                        </div>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                        <MapPinIcon className="h-5 w-5 text-gray-600 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Localização</p>
                          <p className="font-bold text-gray-900">{event.location}</p>
                        </div>
                      </div>
                    )}
                    <div className={`flex items-center px-4 py-2 rounded-lg ${
                      event.status === 'UPCOMING' ? 'bg-blue-100' :
                      event.status === 'LIVE' ? 'bg-green-100' :
                      event.status === 'ENDED' ? 'bg-gray-100' :
                      'bg-red-100'
                    }`}>
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        event.status === 'UPCOMING' ? 'bg-blue-500' :
                        event.status === 'LIVE' ? 'bg-green-500 animate-pulse' :
                        event.status === 'ENDED' ? 'bg-gray-500' :
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-xs text-gray-600">Status</p>
                        <p className={`font-bold ${
                          event.status === 'UPCOMING' ? 'text-blue-900' :
                          event.status === 'LIVE' ? 'text-green-900' :
                          event.status === 'ENDED' ? 'text-gray-900' :
                          'text-red-900'
                        }`}>
                          {event.status === 'UPCOMING' ? 'Próximo' :
                           event.status === 'LIVE' ? 'Ao Vivo' :
                           event.status === 'ENDED' ? 'Finalizado' : 'Cancelado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso de Ocupação */}
                  {event.maxAttendees && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Ocupação</span>
                        <span className="text-sm text-gray-600">
                          {occupancyRate}% • {spotsLeft !== null && spotsLeft > 0 ? `${spotsLeft} vagas restantes` : 'Lotado'}
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Sobre este Evento</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                    </div>
                  </div>

                  {/* Link de Vídeo */}
                  {event.videoLink && (event.status === 'LIVE' || isRegistered) && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Transmissão ao Vivo</h3>
                          <p className="text-sm text-gray-600">Acesse a transmissão do evento</p>
                        </div>
                        <a
                          href={event.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <VideoCameraIcon className="h-5 w-5 mr-2" />
                          Assistir Agora
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Informações Adicionais */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Publicado em</p>
                        <p className="font-medium text-gray-900">
                          {new Date(event.createdAt).toLocaleDateString('pt-AO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {event.updatedAt && (
                        <div>
                          <p className="text-gray-500">Última atualização</p>
                          <p className="font-medium text-gray-900">
                            {new Date(event.updatedAt).toLocaleDateString('pt-AO', {
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
              {user?.role === 'STUDENT' && event.status === 'UPCOMING' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                  {isRegistered ? (
                    <div className="text-center">
                      <CheckCircleIconSolid className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Inscrição Confirmada</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Você está inscrito neste evento. Não se esqueça da data!
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-green-600">Inscrito</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Data:</span>
                          <span className="font-medium">{eventDate.toLocaleDateString('pt-AO')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hora:</span>
                          <span className="font-medium">
                            {eventDate.toLocaleTimeString('pt-AO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {event.price !== undefined && event.price > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valor:</span>
                            <span className="font-medium">
                              Kz {typeof event.price === 'number' ? event.price.toFixed(2) : parseFloat(event.price || '0').toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Inscrever-se</h3>
                      <div className="space-y-4 mb-6">
                        {event.price !== undefined && event.price > 0 ? (
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Preço</span>
                            <span className="text-lg font-bold text-gray-900">
                              Kz {typeof event.price === 'number' ? event.price.toFixed(2) : parseFloat(event.price || '0').toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-sm text-gray-600">Preço</span>
                            <span className="text-lg font-bold text-green-600">Gratuito</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Data</span>
                          <span className="text-sm font-bold text-gray-900">
                            {eventDate.toLocaleDateString('pt-AO')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Hora</span>
                          <span className="text-sm font-bold text-gray-900">
                            {eventDate.toLocaleTimeString('pt-AO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {spotsLeft !== null && (
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Vagas restantes</span>
                            <span className={`text-lg font-bold ${spotsLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {spotsLeft > 0 ? spotsLeft : 'Lotado'}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleRegister}
                        disabled={registering || (spotsLeft !== null && spotsLeft <= 0)}
                        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        {registering ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Processando...</span>
                          </>
                        ) : spotsLeft !== null && spotsLeft <= 0 ? (
                          <>
                            <XCircleIcon className="h-5 w-5" />
                            <span>Evento Lotado</span>
                          </>
                        ) : (
                          <>
                            {event.price && event.price > 0 ? (
                              <CreditCardIcon className="h-5 w-5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5" />
                            )}
                            <span>
                              {event.price && event.price > 0
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
                  {event.maxAttendees && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Taxa de Ocupação</span>
                        <span className="font-semibold text-gray-900">{occupancyRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total de Vagas</span>
                        <span className="font-semibold text-gray-900">{event.maxAttendees}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Participantes</span>
                    <span className="font-semibold text-gray-900">{event.currentAttendees || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`font-semibold ${
                      event.status === 'UPCOMING' ? 'text-blue-600' :
                      event.status === 'LIVE' ? 'text-green-600' :
                      event.status === 'ENDED' ? 'text-gray-600' :
                      'text-red-600'
                    }`}>
                      {event.status === 'UPCOMING' ? 'Próximo' :
                       event.status === 'LIVE' ? 'Ao Vivo' :
                       event.status === 'ENDED' ? 'Finalizado' : 'Cancelado'}
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

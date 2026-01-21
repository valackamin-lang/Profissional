'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Header } from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Link from 'next/link';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  VideoCameraIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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
  location?: string;
  organizer?: {
    id?: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: 'UPCOMING',
    search: '',
    priceFilter: '',
  });

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      try {
        const response = await api.get(`/events?${params.toString()}`);
        let eventsData = response.data.data.events || [];
        
        // Filter by price if specified
        if (filters.priceFilter === 'free') {
          eventsData = eventsData.filter((e: Event) => !e.price || e.price === 0);
        } else if (filters.priceFilter === 'paid') {
          eventsData = eventsData.filter((e: Event) => e.price && e.price > 0);
        }
        
        setEvents(eventsData);
      } catch {
        const feedResponse = await api.get('/feed?type=EVENT');
        const feedItems = feedResponse.data.data.feed || [];
        setEvents(feedItems.map((item: any) => item.content).filter(Boolean));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WORKSHOP':
        return '🔧';
      case 'WEBINAR':
        return '💻';
      case 'CONFERENCE':
        return '🎤';
      default:
        return '📅';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WORKSHOP':
        return 'bg-blue-100 text-blue-800';
      case 'WEBINAR':
        return 'bg-purple-100 text-purple-800';
      case 'CONFERENCE':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingCount = events.filter(e => e.status === 'UPCOMING').length;
  const liveCount = events.filter(e => e.status === 'LIVE').length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Eventos</h1>
                <p className="text-gray-600 text-lg">Workshops, webinars e conferências profissionais</p>
              </div>
              {(user?.role === 'PARTNER' || user?.role === 'MENTOR' || user?.role === 'ADMIN') && (
                <Link
                  href="/events/create"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all font-medium flex items-center space-x-2"
                >
                  <CalendarIcon className="h-5 w-5" />
                  <span>Criar Evento</span>
                </Link>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Eventos</p>
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Próximos</p>
                    <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ao Vivo</p>
                    <p className="text-2xl font-bold text-green-600">{liveCount}</p>
                  </div>
                  <VideoCameraIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5" />
                <span>Filtros</span>
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {showFilters ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                    Buscar
                  </label>
                  <input
                    type="text"
                    placeholder="Título, descrição..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="WEBINAR">Webinar</option>
                    <option value="CONFERENCE">Conferência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="UPCOMING">Próximos</option>
                    <option value="LIVE">Ao Vivo</option>
                    <option value="ENDED">Finalizados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
                  <select
                    value={filters.priceFilter}
                    onChange={(e) => setFilters({ ...filters, priceFilter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="free">Gratuitos</option>
                    <option value="paid">Pagos</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
              <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-900 mb-2">Nenhum evento encontrado</p>
              <p className="text-gray-600 mb-4">Tente ajustar os filtros ou criar um novo evento</p>
              {(user?.role === 'PARTNER' || user?.role === 'MENTOR' || user?.role === 'ADMIN') && (
                <Link
                  href="/events/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Criar Primeiro Evento
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const eventDate = new Date(event.eventDate);
                const occupancyRate = event.maxAttendees 
                  ? Math.round(((event.currentAttendees || 0) / event.maxAttendees) * 100) 
                  : 0;

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary-300 transition-all duration-300"
                  >
                    {/* Header with gradient */}
                    <div className={`h-2 ${
                      event.status === 'LIVE' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      event.status === 'UPCOMING' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}></div>
                    
                    <div className="p-6">
                      {/* Title and Status */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 flex-1">
                          {event.title}
                        </h3>
                        {event.status === 'LIVE' && (
                          <span className="ml-2 flex-shrink-0 h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </div>

                      {/* Organizer */}
                      {event.organizer && (
                        <div className="flex items-center space-x-2 mb-4">
                          {event.organizer.avatar ? (
                            <img
                              src={event.organizer.avatar}
                              alt={event.organizer.companyName || 'Organizador'}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                          )}
                          <p className="text-sm text-gray-600">
                            {event.organizer.companyName || 
                             `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() || 
                             'Organizador'}
                          </p>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-gray-700 text-sm line-clamp-2 mb-4">{event.description}</p>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                          {getTypeIcon(event.type)} {event.type === 'WORKSHOP' ? 'Workshop' :
                           event.type === 'WEBINAR' ? 'Webinar' : 'Conferência'}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {eventDate.toLocaleDateString('pt-AO', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {event.price !== undefined && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            event.price === 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <CurrencyDollarIcon className="h-3 w-3 inline mr-1" />
                            {event.price === 0 ? 'Gratuito' : 
                             `Kz ${typeof event.price === 'number' ? event.price.toFixed(0) : parseFloat(event.price || '0').toFixed(0)}`}
                          </span>
                        )}
                      </div>

                      {/* Attendance Info */}
                      {event.maxAttendees && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Participantes</span>
                            <span className="text-xs font-medium text-gray-900">
                              {event.currentAttendees || 0}/{event.maxAttendees}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                occupancyRate >= 90 ? 'bg-red-500' :
                                occupancyRate >= 70 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'LIVE' ? 'bg-green-100 text-green-800 animate-pulse' :
                          event.status === 'ENDED' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {event.status === 'UPCOMING' ? 'Próximo' :
                           event.status === 'LIVE' ? '🔴 Ao Vivo' :
                           event.status === 'ENDED' ? 'Finalizado' : 'Cancelado'}
                        </span>
                        <span className="text-sm text-primary-600 font-medium group-hover:text-primary-700">
                          Ver detalhes →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

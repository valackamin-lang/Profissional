'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Registration {
  id: string;
  status: string;
  createdAt: string;
  attendee: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    user?: {
      email: string;
    };
  };
  event: {
    id: string;
    title: string;
  };
}

export default function OrganizerPortalPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    cancelled: 0,
    attended: 0,
  });

  useEffect(() => {
    if (user) {
      loadRegistrations();
    }
  }, [user, filter, page]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter) params.append('status', filter);

      const response = await api.get(`/events/attendees/all?${params}`);
      setRegistrations(response.data.data.registrations || []);
      setTotalPages(response.data.data.pagination?.pages || 1);

      // Calculate stats
      const allRegs = response.data.data.registrations || [];
      setStats({
        total: response.data.data.pagination?.total || 0,
        registered: allRegs.filter((r: Registration) => r.status === 'REGISTERED').length,
        cancelled: allRegs.filter((r: Registration) => r.status === 'CANCELLED').length,
        attended: allRegs.filter((r: Registration) => r.status === 'ATTENDED').length,
      });
    } catch (error: any) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Evento', 'Status', 'Data de Inscrição'];
    const rows = registrations.map((reg) => [
      `${reg.attendee.firstName || ''} ${reg.attendee.lastName || ''}`.trim() || 'N/A',
      reg.attendee.user?.email || 'N/A',
      reg.event.title,
      reg.status,
      new Date(reg.createdAt).toLocaleDateString('pt-AO'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes-eventos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Inscrito
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Cancelado
          </span>
        );
      case 'ATTENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <UserGroupIcon className="h-3 w-3 mr-1" />
            Participou
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <CalendarIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Portal do Organizador</h1>
                    <p className="text-gray-600 mt-1">Gerencie participantes de seus eventos</p>
                  </div>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Inscrições</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inscritos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.registered}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cancelados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Participaram</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.attended}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filtrar por status:</label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="REGISTERED">Inscritos</option>
                <option value="CANCELLED">Cancelados</option>
                <option value="ATTENDED">Participaram</option>
              </select>
            </div>
          </div>

          {/* Registrations List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma inscrição encontrada</h3>
                <p className="text-sm text-gray-500 mb-4">Você ainda não tem participantes inscritos em seus eventos.</p>
                <Link
                  href="/events/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Criar Novo Evento
                </Link>
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Participante
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Evento
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Data de Inscrição
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {registrations.map((registration) => (
                      <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {registration.attendee.avatar ? (
                              <img
                                className="h-12 w-12 rounded-full ring-2 ring-gray-100"
                                src={registration.attendee.avatar}
                                alt={`${registration.attendee.firstName} ${registration.attendee.lastName}`}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-gray-100">
                                <span className="text-white text-sm font-semibold">
                                  {(registration.attendee.firstName?.[0] || 'U') +
                                    (registration.attendee.lastName?.[0] || '')}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {registration.attendee.firstName || ''} {registration.attendee.lastName || ''}
                              </div>
                              <div className="text-sm text-gray-500">{registration.attendee.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/events/${registration.event.id}`}
                            className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium inline-flex items-center"
                          >
                            {registration.event.title}
                            <ArrowRightIcon className="h-4 w-4 ml-1" />
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(registration.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {new Date(registration.createdAt).toLocaleDateString('pt-AO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/profiles/${registration.attendee.id}`}
                            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Ver Perfil
                            <ArrowRightIcon className="h-4 w-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Anterior
                          </button>
                          <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Próxima
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

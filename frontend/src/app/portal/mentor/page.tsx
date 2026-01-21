'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import {
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Subscription {
  id: string;
  status: string;
  createdAt: string;
  student: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    user?: {
      email: string;
    };
  };
  mentorship: {
    id: string;
    title: string;
  };
}

export default function MentorPortalPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    cancelled: 0,
    completed: 0,
  });

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user, filter, page]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter) params.append('status', filter);

      const response = await api.get(`/mentorships/subscribers/all?${params}`);
      setSubscriptions(response.data.data.subscriptions || []);
      setTotalPages(response.data.data.pagination?.pages || 1);

      // Calculate stats
      const allSubs = response.data.data.subscriptions || [];
      setStats({
        total: response.data.data.pagination?.total || 0,
        active: allSubs.filter((s: Subscription) => s.status === 'ACTIVE').length,
        cancelled: allSubs.filter((s: Subscription) => s.status === 'CANCELLED').length,
        completed: allSubs.filter((s: Subscription) => s.status === 'COMPLETED').length,
      });
    } catch (error: any) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Mentoria', 'Status', 'Data de Inscrição'];
    const rows = subscriptions.map((sub) => [
      `${sub.student.firstName || ''} ${sub.student.lastName || ''}`.trim() || 'N/A',
      sub.student.user?.email || 'N/A',
      sub.mentorship.title,
      sub.status,
      new Date(sub.createdAt).toLocaleDateString('pt-AO'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscricoes-mentorias-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Ativa
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Cancelada
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Concluída
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
                    <AcademicCapIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Portal do Mentor</h1>
                    <p className="text-gray-600 mt-1">Gerencie seus estudantes inscritos</p>
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
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
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
                  <p className="text-sm font-medium text-gray-600">Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Canceladas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
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
                <option value="ACTIVE">Ativas</option>
                <option value="CANCELLED">Canceladas</option>
                <option value="COMPLETED">Concluídas</option>
              </select>
            </div>
          </div>

          {/* Subscriptions List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UserGroupIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma inscrição encontrada</h3>
                <p className="text-sm text-gray-500 mb-4">Você ainda não tem estudantes inscritos em suas mentorias.</p>
                <Link
                  href="/mentorships/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Criar Nova Mentoria
                </Link>
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Estudante
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mentoria
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
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {subscription.student.avatar ? (
                              <img
                                className="h-12 w-12 rounded-full ring-2 ring-gray-100"
                                src={subscription.student.avatar}
                                alt={`${subscription.student.firstName} ${subscription.student.lastName}`}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-gray-100">
                                <span className="text-white text-sm font-semibold">
                                  {(subscription.student.firstName?.[0] || 'U') +
                                    (subscription.student.lastName?.[0] || '')}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {subscription.student.firstName || ''} {subscription.student.lastName || ''}
                              </div>
                              <div className="text-sm text-gray-500">{subscription.student.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/mentorships/${subscription.mentorship.id}`}
                            className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium inline-flex items-center"
                          >
                            {subscription.mentorship.title}
                            <ArrowRightIcon className="h-4 w-4 ml-1" />
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(subscription.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {new Date(subscription.createdAt).toLocaleDateString('pt-AO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/profiles/${subscription.student.id}`}
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
                  <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
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

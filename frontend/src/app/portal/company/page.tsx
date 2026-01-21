'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import {
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Application {
  id: string;
  status: string;
  coverLetter?: string;
  resume?: string;
  notes?: string;
  createdAt: string;
  applicant: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    user?: {
      email: string;
    };
  };
  job: {
    id: string;
    title: string;
    company: string;
  };
}

export default function CompanyPortalPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user, filter, page]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter) params.append('status', filter);

      const response = await api.get(`/jobs/applications/all?${params}`);
      setApplications(response.data.data.applications || []);
      setTotalPages(response.data.data.pagination?.pages || 1);

      // Calculate stats
      const allApps = response.data.data.applications || [];
      setStats({
        total: response.data.data.pagination?.total || 0,
        pending: allApps.filter((a: Application) => a.status === 'PENDING').length,
        reviewed: allApps.filter((a: Application) => a.status === 'REVIEWED').length,
        accepted: allApps.filter((a: Application) => a.status === 'ACCEPTED').length,
        rejected: allApps.filter((a: Application) => a.status === 'REJECTED').length,
      });
    } catch (error: any) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      setUpdating(true);
      await api.put(`/jobs/applications/${applicationId}`, { status, notes });
      await loadApplications();
      setSelectedApplication(null);
    } catch (error: any) {
      console.error('Error updating application:', error);
      alert(error.response?.data?.error?.message || 'Erro ao atualizar candidatura');
    } finally {
      setUpdating(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Vaga', 'Status', 'Data de Candidatura'];
    const rows = applications.map((app) => [
      `${app.applicant.firstName || ''} ${app.applicant.lastName || ''}`.trim() || 'N/A',
      app.applicant.user?.email || 'N/A',
      app.job.title,
      app.status,
      new Date(app.createdAt).toLocaleDateString('pt-AO'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidaturas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pendente
        </span>
      );
    }
    if (status === 'REVIEWED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <EyeIcon className="h-3 w-3 mr-1" />
          Revisada
        </span>
      );
    }
    if (status === 'ACCEPTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Aceita
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Rejeitada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
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
                    <BriefcaseIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Portal da Empresa</h1>
                    <p className="text-gray-600 mt-1">Gerencie candidaturas para suas vagas</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <BriefcaseIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <EyeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revisadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.reviewed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aceitas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
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
                <option value="PENDING">Pendentes</option>
                <option value="REVIEWED">Revisadas</option>
                <option value="ACCEPTED">Aceitas</option>
                <option value="REJECTED">Rejeitadas</option>
              </select>
            </div>
          </div>

          {/* Applications List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <BriefcaseIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma candidatura encontrada</h3>
                <p className="text-sm text-gray-500 mb-4">Você ainda não tem candidaturas para suas vagas.</p>
                <Link
                  href="/jobs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Criar Nova Vaga
                </Link>
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Candidato
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Vaga
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {applications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {application.applicant.avatar ? (
                              <img
                                className="h-12 w-12 rounded-full ring-2 ring-gray-100"
                                src={application.applicant.avatar}
                                alt={`${application.applicant.firstName} ${application.applicant.lastName}`}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-gray-100">
                                <span className="text-white text-sm font-semibold">
                                  {(application.applicant.firstName?.[0] || 'U') +
                                    (application.applicant.lastName?.[0] || '')}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {application.applicant.firstName || ''} {application.applicant.lastName || ''}
                              </div>
                              <div className="text-sm text-gray-500">{application.applicant.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/jobs/${application.job.id}`}
                            className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium inline-flex items-center"
                          >
                            {application.job.title}
                            <ArrowRightIcon className="h-4 w-4 ml-1" />
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(application.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(application.createdAt).toLocaleDateString('pt-AO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                          <button
                            onClick={() => setSelectedApplication(application)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Ver Detalhes
                          </button>
                          <Link
                            href={`/profiles/${application.applicant.id}`}
                            className="inline-flex items-center text-gray-600 hover:text-gray-700 font-medium"
                          >
                            Perfil
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

          {/* Application Detail Modal */}
          {selectedApplication && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <h3 className="text-xl font-bold text-gray-900">Detalhes da Candidatura</h3>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Candidato</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedApplication.applicant.firstName} {selectedApplication.applicant.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{selectedApplication.applicant.user?.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vaga</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedApplication.job.title}</p>
                    </div>

                    {selectedApplication.coverLetter && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Carta de Apresentação</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                      </div>
                    )}

                    {selectedApplication.resume && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Currículo</label>
                        <a
                          href={selectedApplication.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-primary-600 hover:text-primary-700"
                        >
                          Ver Currículo
                        </a>
                      </div>
                    )}

                    {selectedApplication.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notas</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedApplication.notes}</p>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                      {selectedApplication.status !== 'ACCEPTED' && (
                        <button
                          onClick={() => updateApplicationStatus(selectedApplication.id, 'ACCEPTED')}
                          disabled={updating}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                        >
                          {updating ? 'Processando...' : 'Aprovar'}
                        </button>
                      )}
                      {selectedApplication.status !== 'REJECTED' && (
                        <button
                          onClick={() => updateApplicationStatus(selectedApplication.id, 'REJECTED')}
                          disabled={updating}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                        >
                          {updating ? 'Processando...' : 'Rejeitar'}
                        </button>
                      )}
                      {selectedApplication.status === 'PENDING' && (
                        <button
                          onClick={() => updateApplicationStatus(selectedApplication.id, 'REVIEWED')}
                          disabled={updating}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                        >
                          {updating ? 'Processando...' : 'Marcar como Revisada'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

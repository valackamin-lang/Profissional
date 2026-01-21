'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import Link from 'next/link';
import {
  BriefcaseIcon,
  CalendarIcon,
  AcademicCapIcon,
  FunnelIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

type ContentType = 'JOB' | 'EVENT' | 'MENTORSHIP';

interface ContentItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  profile?: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
  };
  organizer?: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
  };
  mentor?: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function AdminContentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<ContentType>('JOB');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (user?.role === 'ADMIN') {
      loadContent();
    }
  }, [user, contentType, statusFilter, page]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('type', contentType);
      params.append('page', page.toString());
      params.append('limit', '20');
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/admin/content?${params.toString()}`);
      setContent(response.data.data.items || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error: any) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (resourceId: string, action: 'APPROVE' | 'REJECT' | 'DELETE') => {
    if (action === 'DELETE' && !confirm('Tem certeza que deseja deletar este item?')) {
      return;
    }

    try {
      await api.post('/moderation/content', {
        resource: contentType,
        resourceId,
        action,
        reason: action === 'DELETE' ? 'Deletado por administrador' : '',
      });
      await loadContent();
    } catch (error: any) {
      console.error('Error moderating content:', error);
      alert(error.response?.data?.error?.message || 'Erro ao moderar conteúdo');
    }
  };

  const getContentUrl = (itemId: string) => {
    switch (contentType) {
      case 'JOB':
        return `/jobs/${itemId}`;
      case 'EVENT':
        return `/events/${itemId}`;
      case 'MENTORSHIP':
        return `/mentorships/${itemId}`;
    }
  };

  const getContentIcon = () => {
    switch (contentType) {
      case 'JOB':
        return BriefcaseIcon;
      case 'EVENT':
        return CalendarIcon;
      case 'MENTORSHIP':
        return AcademicCapIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'ACTIVE':
      case 'UPCOMING':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
      case 'ENDED':
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  const ContentIcon = getContentIcon();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <ContentIcon className="h-10 w-10 text-primary-600" />
              <h1 className="text-4xl font-bold text-gray-900">Gestão de Conteúdo</h1>
            </div>
            <p className="text-gray-600 text-lg">Gerencie vagas, eventos e mentorias</p>
          </div>

          {/* Type Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Tipo de Conteúdo:</label>
              <div className="flex space-x-2">
                {(['JOB', 'EVENT', 'MENTORSHIP'] as ContentType[]).map((type) => {
                  const Icon = type === 'JOB' ? BriefcaseIcon : type === 'EVENT' ? CalendarIcon : AcademicCapIcon;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setContentType(type);
                        setPage(1);
                        setStatusFilter('');
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        contentType === type
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>
                        {type === 'JOB' ? 'Vagas' : type === 'EVENT' ? 'Eventos' : 'Mentorias'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5" />
                <span>Filtros</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos os status</option>
                  {contentType === 'JOB' && (
                    <>
                      <option value="OPEN">Aberta</option>
                      <option value="CLOSED">Fechada</option>
                      <option value="PAUSED">Pausada</option>
                    </>
                  )}
                  {contentType === 'EVENT' && (
                    <>
                      <option value="UPCOMING">Próximo</option>
                      <option value="LIVE">Ao Vivo</option>
                      <option value="ENDED">Finalizado</option>
                      <option value="CANCELLED">Cancelado</option>
                    </>
                  )}
                  {contentType === 'MENTORSHIP' && (
                    <>
                      <option value="ACTIVE">Ativa</option>
                      <option value="INACTIVE">Inativa</option>
                      <option value="SUSPENDED">Suspensa</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Content Table */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : content.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <ContentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">Nenhum conteúdo encontrado</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criado por
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {content.map((item) => {
                      const creator = item.profile || item.organizer || item.mentor;
                      const creatorName = creator?.companyName || 
                        `${creator?.firstName || ''} ${creator?.lastName || ''}`.trim() || 
                        'Desconhecido';

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {creatorName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString('pt-AO')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Link
                                href={getContentUrl(item.id)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Ver detalhes"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </Link>
                              {item.status !== 'SUSPENDED' && (
                                <button
                                  onClick={() => handleModerate(item.id, 'REJECT')}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Suspender"
                                >
                                  <XCircleIcon className="h-5 w-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleModerate(item.id, 'DELETE')}
                                className="text-red-600 hover:text-red-900"
                                title="Deletar"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {page} de {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

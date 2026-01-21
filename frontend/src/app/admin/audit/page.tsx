'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import {
  ClockIcon,
  FunnelIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
  };
}

interface AuditReport {
  stats: {
    totalActions: number;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byUser: Record<string, number>;
    dateRange: {
      start?: string;
      end?: string;
    };
  };
  sampleLogs: AuditLog[];
}

export default function AdminAuditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'report' | 'transactions'>('logs');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (user?.role === 'ADMIN') {
      if (activeTab === 'logs') {
        loadLogs();
      } else if (activeTab === 'report') {
        loadReport();
      } else if (activeTab === 'transactions') {
        loadTransactions();
      }
    }
  }, [user, activeTab, page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/audit/logs?${params.toString()}`);
      setLogs(response.data.data.logs || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error: any) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/audit/report?${params.toString()}`);
      setReport(response.data.data);
    } catch (error: any) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/audit/transactions?${params.toString()}`);
      setLogs(response.data.data.logs || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'APPROVE':
        return 'bg-purple-100 text-purple-800';
      case 'REJECT':
        return 'bg-orange-100 text-orange-800';
      case 'ACTIVATE':
        return 'bg-emerald-100 text-emerald-800';
      case 'DEACTIVATE':
        return 'bg-rose-100 text-rose-800';
      case 'LOGIN':
        return 'bg-indigo-100 text-indigo-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceColor = (resource: string) => {
    switch (resource) {
      case 'USER':
        return 'bg-blue-100 text-blue-800';
      case 'PROFILE':
        return 'bg-purple-100 text-purple-800';
      case 'JOB':
        return 'bg-green-100 text-green-800';
      case 'EVENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'MENTORSHIP':
        return 'bg-indigo-100 text-indigo-800';
      case 'PAYMENT':
        return 'bg-emerald-100 text-emerald-800';
      case 'SUBSCRIPTION':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Data', 'Usuário', 'Ação', 'Recurso', 'ID do Recurso', 'IP', 'Detalhes'].join(','),
      ...logs.map(log => [
        new Date(log.createdAt).toISOString(),
        log.user?.email || 'N/A',
        log.action,
        log.resource,
        log.resourceId || 'N/A',
        log.ipAddress || 'N/A',
        JSON.stringify(log.details || {}),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <ClockIcon className="h-10 w-10 text-primary-600" />
              <h1 className="text-4xl font-bold text-gray-900">Auditoria</h1>
            </div>
            <p className="text-gray-600 text-lg">Logs de ações e relatórios de atividade</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'logs', label: 'Logs de Auditoria', icon: DocumentTextIcon },
                  { id: 'report', label: 'Relatórios', icon: ChartBarIcon },
                  { id: 'transactions', label: 'Transações', icon: CurrencyDollarIcon },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setPage(1);
                      }}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5" />
                <span>Filtros</span>
              </h2>
              {activeTab === 'logs' && logs.length > 0 && (
                <button
                  onClick={exportLogs}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Exportar CSV</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {activeTab !== 'transactions' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ação</label>
                    <select
                      value={filters.action}
                      onChange={(e) => {
                        setFilters({ ...filters, action: e.target.value });
                        setPage(1);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Todas</option>
                      <option value="CREATE">Criar</option>
                      <option value="UPDATE">Atualizar</option>
                      <option value="DELETE">Deletar</option>
                      <option value="APPROVE">Aprovar</option>
                      <option value="REJECT">Rejeitar</option>
                      <option value="ACTIVATE">Ativar</option>
                      <option value="DEACTIVATE">Desativar</option>
                      <option value="LOGIN">Login</option>
                      <option value="LOGOUT">Logout</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recurso</label>
                    <select
                      value={filters.resource}
                      onChange={(e) => {
                        setFilters({ ...filters, resource: e.target.value });
                        setPage(1);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Todos</option>
                      <option value="USER">Usuário</option>
                      <option value="PROFILE">Perfil</option>
                      <option value="JOB">Vaga</option>
                      <option value="EVENT">Evento</option>
                      <option value="MENTORSHIP">Mentoria</option>
                      <option value="PAYMENT">Pagamento</option>
                      <option value="SUBSCRIPTION">Inscrição</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters({ ...filters, startDate: e.target.value });
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters({ ...filters, endDate: e.target.value });
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {activeTab === 'logs' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    ID do Usuário
                  </label>
                  <input
                    type="text"
                    placeholder="UUID do usuário..."
                    value={filters.userId}
                    onChange={(e) => {
                      setFilters({ ...filters, userId: e.target.value });
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : activeTab === 'logs' ? (
            <>
              {logs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">Nenhum log encontrado</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data/Hora
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuário
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ação
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Recurso
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Detalhes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(log.createdAt).toLocaleString('pt-AO')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.user?.email || 'Sistema'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getResourceColor(log.resource)}`}>
                                  {log.resource}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {log.ipAddress || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {log.details ? (
                                  <details className="cursor-pointer">
                                    <summary className="text-primary-600 hover:text-primary-700">
                                      Ver detalhes
                                    </summary>
                                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </details>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
            </>
          ) : activeTab === 'report' ? (
            report ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total de Ações</p>
                        <p className="text-3xl font-bold text-gray-900">{report.stats.totalActions}</p>
                      </div>
                      <ChartBarIcon className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tipos de Ação</p>
                        <p className="text-3xl font-bold text-gray-900">{Object.keys(report.stats.byAction).length}</p>
                      </div>
                      <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Recursos</p>
                        <p className="text-3xl font-bold text-gray-900">{Object.keys(report.stats.byResource).length}</p>
                      </div>
                      <ClockIcon className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Usuários Ativos</p>
                        <p className="text-3xl font-bold text-gray-900">{Object.keys(report.stats.byUser).length}</p>
                      </div>
                      <UserIcon className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações por Tipo</h3>
                    <div className="space-y-3">
                      {Object.entries(report.stats.byAction)
                        .sort(([, a], [, b]) => b - a)
                        .map(([action, count]) => (
                          <div key={action}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">{action}</span>
                              <span className="text-sm font-bold text-gray-900">{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getActionColor(action).split(' ')[0]}`}
                                style={{
                                  width: `${(count / report.stats.totalActions) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações por Recurso</h3>
                    <div className="space-y-3">
                      {Object.entries(report.stats.byResource)
                        .sort(([, a], [, b]) => b - a)
                        .map(([resource, count]) => (
                          <div key={resource}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">{resource}</span>
                              <span className="text-sm font-bold text-gray-900">{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getResourceColor(resource).split(' ')[0]}`}
                                style={{
                                  width: `${(count / report.stats.totalActions) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Sample Logs */}
                {report.sampleLogs && report.sampleLogs.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Amostra de Logs (últimos 100)</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.sampleLogs.slice(0, 20).map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {new Date(log.createdAt).toLocaleDateString('pt-AO')}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {log.user?.email || 'Sistema'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getResourceColor(log.resource)}`}>
                                  {log.resource}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-900 mb-2">Nenhum relatório disponível</p>
              </div>
            )
          ) : (
            <>
              {logs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <CurrencyDollarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">Nenhuma transação encontrada</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data/Hora
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuário
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ação
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Recurso
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Detalhes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(log.createdAt).toLocaleString('pt-AO')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.user?.email || 'Sistema'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getResourceColor(log.resource)}`}>
                                  {log.resource}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {log.details ? (
                                  <details className="cursor-pointer">
                                    <summary className="text-primary-600 hover:text-primary-700">
                                      Ver detalhes
                                    </summary>
                                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </details>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

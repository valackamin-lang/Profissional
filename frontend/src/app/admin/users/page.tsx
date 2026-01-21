'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import Link from 'next/link';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShieldCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  isActive?: boolean;
  createdAt: string;
  role?: {
    id: string;
    name: string;
  };
  profile?: {
    id: string;
    type: string;
    approvalStatus: string;
  };
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    roleId: '',
  });

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (user?.role === 'ADMIN') {
      loadUsers();
    }
  }, [user, page, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filters.search) params.append('search', filters.search);
      if (filters.roleId) params.append('roleId', filters.roleId);

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data.users || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error: any) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      await loadUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      alert(error.response?.data?.error?.message || 'Erro ao atualizar status do usuário');
    }
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
              <UserGroupIcon className="h-10 w-10 text-primary-600" />
              <h1 className="text-4xl font-bold text-gray-900">Gestão de Usuários</h1>
            </div>
            <p className="text-gray-600 text-lg">Gerencie usuários da plataforma</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                  Buscar por email
                </label>
                <input
                  type="text"
                  placeholder="Email do usuário..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
                <select
                  value={filters.roleId}
                  onChange={(e) => {
                    setFilters({ ...filters, roleId: e.target.value });
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todas as funções</option>
                  <option value="STUDENT">Estudante</option>
                  <option value="PROFESSIONAL">Profissional</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="COMPANY">Empresa</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Função
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Perfil
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{userItem.email}</div>
                              <div className="text-sm text-gray-500">
                                {userItem.isEmailVerified ? (
                                  <span className="text-green-600">✓ Verificado</span>
                                ) : (
                                  <span className="text-yellow-600">Não verificado</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {userItem.role?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userItem.profile ? (
                            <div>
                              <div className="font-medium">{userItem.profile.type}</div>
                              <div className="text-xs">
                                {userItem.profile.approvalStatus === 'APPROVED' ? (
                                  <span className="text-green-600">Aprovado</span>
                                ) : userItem.profile.approvalStatus === 'PENDING' ? (
                                  <span className="text-yellow-600">Pendente</span>
                                ) : (
                                  <span className="text-red-600">Rejeitado</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Sem perfil</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userItem.isActive !== false ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {userItem.profile && (
                              <Link
                                href={`/profiles/${userItem.profile.id}`}
                                className="text-primary-600 hover:text-primary-900"
                                title="Ver perfil"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </Link>
                            )}
                            {userItem.id !== user?.id && (
                              <button
                                onClick={() => handleToggleStatus(userItem.id, userItem.isActive !== false)}
                                className={`${
                                  userItem.isActive !== false
                                    ? 'text-red-600 hover:text-red-900'
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                                title={userItem.isActive !== false ? 'Desativar' : 'Ativar'}
                              >
                                {userItem.isActive !== false ? (
                                  <XCircleIcon className="h-5 w-5" />
                                ) : (
                                  <CheckCircleIcon className="h-5 w-5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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

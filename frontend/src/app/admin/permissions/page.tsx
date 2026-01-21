'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import {
  KeyIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  roles?: Role[];
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
}

export default function PermissionsPage() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    resource: '',
    action: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    if (user) {
      loadPermissions();
    }
  }, [user]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterResource) params.append('resource', filterResource);
      if (filterAction) params.append('action', filterAction);

      const response = await api.get(`/admin/permissions?${params}`);
      setPermissions(response.data.data.permissions || []);
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      setError(error.response?.data?.error?.message || 'Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPermissions();
    }
  }, [filterResource, filterAction]);

  const handleOpenModal = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission);
      setFormData({
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description || '',
      });
    } else {
      setEditingPermission(null);
      setFormData({
        name: '',
        resource: '',
        action: '',
        description: '',
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPermission(null);
    setFormData({
      name: '',
      resource: '',
      action: '',
      description: '',
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingPermission) {
        await api.put(`/admin/permissions/${editingPermission.id}`, formData);
      } else {
        await api.post('/admin/permissions', formData);
      }
      await loadPermissions();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving permission:', error);
      setError(error.response?.data?.error?.message || 'Erro ao salvar permissão');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (permissionId: string, permissionName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a permissão "${permissionName}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/permissions/${permissionId}`);
      await loadPermissions();
    } catch (error: any) {
      console.error('Error deleting permission:', error);
      alert(error.response?.data?.error?.message || 'Erro ao deletar permissão');
    }
  };

  const uniqueResources = Array.from(new Set(permissions.map((p) => p.resource))).sort();
  const uniqueActions = Array.from(new Set(permissions.map((p) => p.action))).sort();

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
                    <KeyIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestão de Permissões</h1>
                    <p className="text-gray-600 mt-1">Gerencie permissões do sistema</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nova Permissão
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurso</label>
                  <select
                    value={filterResource}
                    onChange={(e) => setFilterResource(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {uniqueResources.map((resource) => (
                      <option key={resource} value={resource}>
                        {resource}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ação</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {uniqueActions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && !showModal && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Recurso
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ação
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {permissions.map((permission) => (
                      <tr key={permission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-primary-50 rounded-lg mr-3">
                              <KeyIcon className="h-5 w-5 text-primary-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{permission.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {permission.resource}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            {permission.action}
                          </span>
                        </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{permission.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {permission.roles?.length || 0} roles
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleOpenModal(permission)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(permission.id, permission.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingPermission ? 'Editar Permissão' : 'Nova Permissão'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6">
                  {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recurso *
                        </label>
                        <input
                          type="text"
                          value={formData.resource}
                          onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ação *
                        </label>
                        <input
                          type="text"
                          value={formData.action}
                          onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? 'Salvando...' : editingPermission ? 'Atualizar' : 'Criar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

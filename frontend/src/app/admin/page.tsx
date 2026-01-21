'use client';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Header } from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Link from 'next/link';
import {
  UserGroupIcon,
  BriefcaseIcon,
  CalendarIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  users: {
    total: number;
    byRole: Array<{ role: string; count: number }>;
  };
  profiles: {
    total: number;
    pending: number;
    byType: Record<string, number>;
  };
  jobs: {
    total: number;
    active: number;
  };
  events: {
    total: number;
    upcoming: number;
  };
  mentorships: {
    total: number;
    active: number;
  };
  payments: {
    total: number;
  };
  activity: {
    last7Days: number;
  };
}

interface Profile {
  id: string;
  type: 'STUDENT' | 'PROFESSIONAL' | 'MENTOR' | 'COMPANY';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  bio?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalNotes?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
  };
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'users' | 'content' | 'audit'>('dashboard');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (user?.role === 'ADMIN') {
      loadDashboard();
      loadPendingApprovals();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.data.stats);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      setError(error.response?.data?.error?.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const response = await api.get('/moderation/approvals');
      setPendingProfiles(response.data.data.profiles || []);
    } catch (error: any) {
      console.error('Error loading approvals:', error);
    }
  };

  const handleApprove = async (profileId: string, notes?: string) => {
    try {
      await api.put(`/moderation/approve/${profileId}`, { notes: notes || '' });
      await loadPendingApprovals();
      await loadDashboard();
    } catch (error: any) {
      console.error('Error approving profile:', error);
      alert(error.response?.data?.error?.message || 'Erro ao aprovar perfil');
    }
  };

  const handleReject = async (profileId: string, notes: string) => {
    if (!notes || notes.trim() === '') {
      alert('Por favor, forneça um motivo para a rejeição');
      return;
    }
    try {
      await api.put(`/moderation/reject/${profileId}`, { notes });
      await loadPendingApprovals();
      await loadDashboard();
    } catch (error: any) {
      console.error('Error rejecting profile:', error);
      alert(error.response?.data?.error?.message || 'Erro ao rejeitar perfil');
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <ShieldCheckIcon className="h-10 w-10 text-primary-600" />
              <h1 className="text-4xl font-bold text-gray-900">Painel de Administração</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Gerencie usuários, perfis, conteúdo e monitore a atividade da plataforma
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
                  { id: 'approvals', label: `Aprovações (${pendingProfiles.length})`, icon: DocumentCheckIcon },
                  { id: 'users', label: 'Usuários', icon: UserGroupIcon },
                  { id: 'content', label: 'Conteúdo', icon: BriefcaseIcon },
                  { id: 'audit', label: 'Auditoria', icon: ClockIcon },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
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

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Total de Usuários"
                      value={stats.users.total}
                      icon={UserGroupIcon}
                      color="blue"
                    />
                    <StatCard
                      title="Perfis Pendentes"
                      value={stats.profiles.pending}
                      icon={ExclamationTriangleIcon}
                      color="yellow"
                      highlight={stats.profiles.pending > 0}
                    />
                    <StatCard
                      title="Vagas Ativas"
                      value={stats.jobs.active}
                      icon={BriefcaseIcon}
                      color="green"
                    />
                    <StatCard
                      title="Eventos Próximos"
                      value={stats.events.upcoming}
                      icon={CalendarIcon}
                      color="purple"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Link
                      href="/admin/roles"
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Roles</h3>
                          <p className="text-sm text-gray-600">Gerencie roles e permissões do sistema</p>
                        </div>
                        <ShieldCheckIcon className="h-10 w-10 text-primary-600" />
                      </div>
                    </Link>
                    <Link
                      href="/admin/permissions"
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Permissões</h3>
                          <p className="text-sm text-gray-600">Crie e gerencie permissões</p>
                        </div>
                        <KeyIcon className="h-10 w-10 text-primary-600" />
                      </div>
                    </Link>
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Users by Role */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuários por Função</h3>
                      <div className="space-y-3">
                        {stats.users.byRole.map((item) => (
                          <div key={item.role} className="flex items-center justify-between">
                            <span className="text-gray-600">{item.role}</span>
                            <span className="font-semibold text-gray-900">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Profiles by Type */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Perfis por Tipo</h3>
                      <div className="space-y-3">
                        {Object.entries(stats.profiles.byType).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-gray-600">{type}</span>
                            <span className="font-semibold text-gray-900">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Content Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Vagas</h3>
                        <BriefcaseIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total</span>
                          <span className="font-semibold">{stats.jobs.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ativas</span>
                          <span className="font-semibold text-green-600">{stats.jobs.active}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Eventos</h3>
                        <CalendarIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total</span>
                          <span className="font-semibold">{stats.events.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Próximos</span>
                          <span className="font-semibold text-blue-600">{stats.events.upcoming}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Mentorias</h3>
                        <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total</span>
                          <span className="font-semibold">{stats.mentorships.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ativas</span>
                          <span className="font-semibold text-green-600">{stats.mentorships.active}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">
                        {stats.activity.last7Days} ações nos últimos 7 dias
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Aprovações Tab */}
          {activeTab === 'approvals' && (
            <div>
              {pendingProfiles.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <DocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">Nenhum perfil pendente</p>
                  <p className="text-gray-600">Todos os perfis foram revisados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProfiles.map((profile) => (
                    <ProfileApprovalCard
                      key={profile.id}
                      profile={profile}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <Link
                href="/admin/users"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium mb-6"
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Gerenciar Usuários
              </Link>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">Acesse a página completa de gestão de usuários para ver e gerenciar todos os usuários da plataforma.</p>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div>
              <Link
                href="/admin/content"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium mb-6"
              >
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                Gerenciar Conteúdo
              </Link>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">Acesse a página completa de gestão de conteúdo para moderar vagas, eventos e mentorias.</p>
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            <div>
              <Link
                href="/admin/audit"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium mb-6"
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                Ver Auditoria Completa
              </Link>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 mb-4">Acesse a página completa de auditoria para ver logs detalhados, relatórios e transações.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Logs de Auditoria</h3>
                    <p className="text-sm text-gray-600">Visualize todas as ações realizadas na plataforma</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Relatórios</h3>
                    <p className="text-sm text-gray-600">Estatísticas e análises de atividade</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Transações</h3>
                    <p className="text-sm text-gray-600">Logs de pagamentos e inscrições</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  highlight?: boolean;
}

function StatCard({ title, value, icon: Icon, color, highlight }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${highlight ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${highlight ? 'text-yellow-600' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

interface ProfileApprovalCardProps {
  profile: Profile;
  onApprove: (profileId: string, notes?: string) => void;
  onReject: (profileId: string, notes: string) => void;
}

function ProfileApprovalCard({ profile, onApprove, onReject }: ProfileApprovalCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const getProfileTypeLabel = (type: string) => {
    switch (type) {
      case 'STUDENT':
        return 'Estudante';
      case 'PROFESSIONAL':
        return 'Profissional';
      case 'MENTOR':
        return 'Mentor';
      case 'COMPANY':
        return 'Empresa';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {profile.companyName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Sem nome'}
            </h3>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              {getProfileTypeLabel(profile.type)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Email:</span> {profile.user?.email || 'N/A'}
          </p>
          {profile.bio && (
            <p className="text-sm text-gray-700 mb-4">{profile.bio}</p>
          )}
          <p className="text-xs text-gray-500">
            Criado em: {new Date(profile.createdAt).toLocaleDateString('pt-AO')}
          </p>
        </div>
        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={() => onApprove(profile.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Aprovar
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Rejeitar
          </button>
        </div>
      </div>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Rejeitar Perfil</h3>
            <p className="text-sm text-gray-600 mb-4">
              Por favor, forneça um motivo para a rejeição:
            </p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Motivo da rejeição..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              rows={4}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onReject(profile.id, rejectNotes);
                  setShowRejectModal(false);
                  setRejectNotes('');
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={!rejectNotes.trim()}
              >
                Confirmar Rejeição
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

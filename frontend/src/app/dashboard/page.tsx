'use client';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Header } from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Load different stats based on user role
      if (user?.role === 'STUDENT') {
        // Load student stats
        const [applicationsRes, eventsRes, mentorshipsRes] = await Promise.all([
          api.get('/jobs/applications/me').catch(() => ({ data: { data: { applications: [] } } })),
          api.get('/events/registrations/me').catch(() => ({ data: { data: { registrations: [] } } })),
          api.get('/mentorships/subscriptions/me').catch(() => ({ data: { data: { subscriptions: [] } } })),
        ]);
        
        setStats({
          applications: applicationsRes.data.data.applications?.length || 0,
          events: eventsRes.data.data.registrations?.length || 0,
          mentorships: mentorshipsRes.data.data.subscriptions?.length || 0,
        });
      } else if (user?.role === 'MENTOR' || user?.role === 'PARTNER') {
        const response = await api.get('/commissions/stats');
        setStats(response.data.data.stats);
      } else if (user?.role === 'ADMIN') {
        // Load admin stats
        const [usersRes, profilesRes, jobsRes, eventsRes] = await Promise.all([
          api.get('/admin/stats/users').catch(() => ({ data: { data: { count: 0 } } })),
          api.get('/moderation/pending').catch(() => ({ data: { data: { count: 0 } } })),
          api.get('/jobs?status=OPEN').catch(() => ({ data: { data: { jobs: [] } } })),
          api.get('/events?status=UPCOMING').catch(() => ({ data: { data: { events: [] } } })),
        ]);
        
        setStats({
          users: usersRes.data.data.count || 0,
          pendingApprovals: profilesRes.data.data.count || 0,
          activeJobs: jobsRes.data.data.jobs?.length || 0,
          upcomingEvents: eventsRes.data.data.events?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {!loading && user?.role === 'STUDENT' && stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Vagas Aplicadas</h3>
                  <p className="text-3xl font-bold text-primary-600">{stats.applications || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Eventos Inscritos</h3>
                  <p className="text-3xl font-bold text-primary-600">{stats.events || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Mentorias</h3>
                  <p className="text-3xl font-bold text-primary-600">{stats.mentorships || 0}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Minhas Inscrições</h3>
                    <p className="text-sm text-gray-600 mt-1">Visualize e gerencie todas as suas inscrições em um só lugar</p>
                  </div>
                  <Link
                    href="/my-subscriptions"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Ver Todas
                  </Link>
                </div>
              </div>
            </>
          )}

          {!loading && (user?.role === 'MENTOR' || user?.role === 'PARTNER') && stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Total de Ganhos</h3>
                  <p className="text-3xl font-bold text-primary-600">
                    Kz {typeof stats.totalEarnings === 'number' ? stats.totalEarnings.toFixed(2) : parseFloat(stats.totalEarnings || '0').toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Comissões</h3>
                  <p className="text-3xl font-bold text-gray-600">
                    Kz {typeof stats.totalCommissions === 'number' ? stats.totalCommissions.toFixed(2) : parseFloat(stats.totalCommissions || '0').toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Pendentes</h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    Kz {typeof stats.pendingPayouts === 'number' ? stats.pendingPayouts.toFixed(2) : parseFloat(stats.pendingPayouts || '0').toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Completos</h3>
                  <p className="text-3xl font-bold text-green-600">
                    Kz {typeof stats.completedPayouts === 'number' ? stats.completedPayouts.toFixed(2) : parseFloat(stats.completedPayouts || '0').toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {user?.role === 'MENTOR' && (
                  <Link
                    href="/portal/mentor"
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold mb-2 text-primary-600">Portal do Mentor</h3>
                    <p className="text-sm text-gray-600">Gerencie estudantes inscritos em suas mentorias</p>
                  </Link>
                )}
                {(user?.role === 'COMPANY' || user?.role === 'PARTNER') && (
                  <Link
                    href="/portal/company"
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold mb-2 text-primary-600">Portal da Empresa</h3>
                    <p className="text-sm text-gray-600">Gerencie candidaturas para suas vagas</p>
                  </Link>
                )}
                {(user?.role === 'PARTNER' || user?.role === 'COMPANY') && (
                  <Link
                    href="/portal/organizer"
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold mb-2 text-primary-600">Portal do Organizador</h3>
                    <p className="text-sm text-gray-600">Gerencie participantes de seus eventos</p>
                  </Link>
                )}
              </div>
            </>
          )}

          {!loading && user?.role === 'ADMIN' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Usuários</h3>
                <p className="text-3xl font-bold text-primary-600">{stats.users || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Aprovações Pendentes</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Vagas Ativas</h3>
                <p className="text-3xl font-bold text-green-600">{stats.activeJobs || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Eventos</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.upcomingEvents || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import api from '../lib/api';
import {
  BriefcaseIcon,
  CalendarIcon,
  AcademicCapIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const FeedSidebar: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    jobs: 0,
    events: 0,
    mentorships: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [jobsRes, eventsRes, mentorshipsRes] = await Promise.all([
        api.get('/jobs?limit=1').catch(() => ({ data: { data: { jobs: [] } } })),
        api.get('/events?limit=1').catch(() => ({ data: { data: { events: [] } } })),
        api.get('/mentorships?limit=1').catch(() => ({ data: { data: { mentorships: [] } } })),
      ]);

      // Get total counts from pagination if available
      setStats({
        jobs: jobsRes.data.data.pagination?.total || 0,
        events: eventsRes.data.data.pagination?.total || 0,
        mentorships: mentorshipsRes.data.data.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: BriefcaseIcon,
      label: 'Ver Vagas',
      href: '/jobs',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: CalendarIcon,
      label: 'Ver Eventos',
      href: '/events',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: AcademicCapIcon,
      label: 'Ver Mentorias',
      href: '/mentorships',
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  if (user?.role === 'PARTNER' || user?.role === 'MENTOR') {
    quickActions.push({
      icon: PlusIcon,
      label: 'Criar Conteúdo',
      href: user.role === 'MENTOR' ? '/mentorships/create' : '/jobs/create',
      color: 'bg-green-100 text-green-600',
    });
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                  {action.label}
                </span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
            </Link>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">Vagas Disponíveis</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.jobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-600">Eventos</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.events}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                <span className="text-sm text-gray-600">Mentorias</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.mentorships}</span>
            </div>
          </div>
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Bem-vindo de volta!</h3>
        <p className="text-sm text-primary-100 mb-4">
          {user?.email}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-white hover:text-primary-100 transition-colors"
        >
          Ver Dashboard
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};

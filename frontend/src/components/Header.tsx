'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { BellIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Atualizar contador a cada 30 segundos
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/notifications');
      const notifications = response.data.data.notifications || [];
      const unread = notifications.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      // Silenciosamente falhar
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-primary-600">
              FORGETECH Professional
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              >
                Feed
              </Link>
              <Link
                href="/jobs"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              >
                Vagas
              </Link>
              <Link
                href="/events"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              >
                Eventos
              </Link>
              <Link
                href="/mentorships"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              >
                Mentorias
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              {user.role === 'STUDENT' && (
                <Link
                  href="/my-subscriptions"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Minhas Inscrições
                </Link>
              )}
              {(user.role === 'PARTNER' || user.role === 'MENTOR') && (
                <>
                  <Link
                    href="/jobs/create"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                  >
                    Criar Vaga
                  </Link>
                  <Link
                    href="/events/create"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                  >
                    Criar Evento
                  </Link>
                </>
              )}
              {user.role === 'MENTOR' && (
                <>
                  <Link
                    href="/mentorships/create"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                  >
                    Criar Mentoria
                  </Link>
                  <Link
                    href="/portal/mentor"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                  >
                    Portal do Mentor
                  </Link>
                </>
              )}
              {(user.role === 'COMPANY' || user.role === 'PARTNER') && (
                <Link
                  href="/portal/company"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Portal da Empresa
                </Link>
              )}
              {(user.role === 'PARTNER' || user.role === 'COMPANY') && (
                <Link
                  href="/portal/organizer"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Portal do Organizador
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                >
                  Administração
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/notifications"
              className="relative p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.25rem]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/profile"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600"
            >
              {user.email}
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

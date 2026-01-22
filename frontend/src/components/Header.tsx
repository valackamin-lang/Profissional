'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import {
  BellIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftIcon,
  HomeIcon,
  BriefcaseIcon,
  CalendarIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserCircleIcon,
  PlusIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      loadUnreadChatsCount();
      // Atualizar contadores a cada 30 segundos
      const interval = setInterval(() => {
        loadUnreadCount();
        loadUnreadChatsCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Fechar menu mobile ao clicar em link
  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

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

  const loadUnreadChatsCount = async () => {
    try {
      const response = await api.get('/chat');
      const chats = response.data.data.chats || [];
      const totalUnread = chats.reduce((sum: number, chat: any) => {
        return sum + (chat.unreadCount || 0);
      }, 0);
      setUnreadChatsCount(totalUnread);
    } catch (error) {
      // Silenciosamente falhar
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Navegação Principal */}
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-primary-600 hidden sm:inline">FORGETECH</span>
            </Link>
            
            {/* Navegação Principal - Desktop */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link
                href="/"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <HomeIcon className="h-4 w-4" />
                <span>Feed</span>
              </Link>
              <Link
                href="/jobs"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <BriefcaseIcon className="h-4 w-4" />
                <span>Vagas</span>
              </Link>
              <Link
                href="/events"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Eventos</span>
              </Link>
              <Link
                href="/mentorships"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <AcademicCapIcon className="h-4 w-4" />
                <span>Mentorias</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <ChartBarIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </nav>
          </div>

          {/* Ações Rápidas e Menu do Usuário */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Botão Criar (para PARTNER e MENTOR) - Desktop */}
            {(user.role === 'PARTNER' || user.role === 'MENTOR') && (
              <div className="hidden xl:flex items-center space-x-1 mr-1">
                <div className="relative group">
                  <button className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transition-all shadow-sm">
                    <PlusIcon className="h-4 w-4" />
                    <span>Criar</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="py-1">
                      <Link
                        href="/jobs/create"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <BriefcaseIcon className="h-4 w-4" />
                        <span>Criar Vaga</span>
                      </Link>
                      <Link
                        href="/events/create"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        <span>Criar Evento</span>
                      </Link>
                      {user.role === 'MENTOR' && (
                        <Link
                          href="/mentorships/create"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>Criar Mentoria</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat */}
            <Link
              href="/chat"
              className="relative p-2 sm:p-2.5 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              title="Mensagens"
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
              {unreadChatsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 inline-flex items-center justify-center px-1 sm:px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full min-w-[1rem] sm:min-w-[1.25rem] text-[10px] sm:text-xs animate-pulse">
                  {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                </span>
              )}
            </Link>

            {/* Notificações */}
            <Link
              href="/notifications"
              className="relative p-2 sm:p-2.5 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              title="Notificações"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 inline-flex items-center justify-center px-1 sm:px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1rem] sm:min-w-[1.25rem] text-[10px] sm:text-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Menu do Perfil */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-1 sm:space-x-2 px-1 sm:px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-all group"
              >
                {user.profile?.avatar ? (
                  <img
                    src={user.profile.avatar}
                    alt={user.profile.firstName || user.email}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border-2 border-gray-200 group-hover:border-primary-500 transition-colors"
                  />
                ) : (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-2 border-gray-200 group-hover:border-primary-500 transition-colors">
                    <span className="text-white font-semibold text-[10px] sm:text-xs">
                      {user.profile?.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <ChevronDownIcon className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-500 transition-transform hidden sm:block ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.profile?.firstName || user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <Link
                      href="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                    
                    {user.role === 'STUDENT' && (
                      <Link
                        href="/my-subscriptions"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>Minhas Inscrições</span>
                      </Link>
                    )}
                    
                    {(user.role === 'PARTNER' || user.role === 'MENTOR') && (
                      <>
                        {user.role === 'MENTOR' && (
                          <Link
                            href="/portal/mentor"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <AcademicCapIcon className="h-4 w-4" />
                            <span>Portal do Mentor</span>
                          </Link>
                        )}
                        {user.role === 'PARTNER' && (
                          <>
                            <Link
                              href="/portal/company"
                              onClick={() => setProfileMenuOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <BriefcaseIcon className="h-4 w-4" />
                              <span>Portal da Empresa</span>
                            </Link>
                            <Link
                              href="/portal/organizer"
                              onClick={() => setProfileMenuOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <CalendarIcon className="h-4 w-4" />
                              <span>Portal do Organizador</span>
                            </Link>
                          </>
                        )}
                      </>
                    )}
                    
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Cog6ToothIcon className="h-4 w-4" />
                        <span>Administração</span>
                      </Link>
                    )}
                    
                    <div className="border-t border-gray-200 my-1"></div>
                    
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botão Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              <Link
                href="/"
                onClick={handleMobileLinkClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <HomeIcon className="h-4 w-4" />
                <span>Feed</span>
              </Link>
              <Link
                href="/jobs"
                onClick={handleMobileLinkClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <BriefcaseIcon className="h-4 w-4" />
                <span>Vagas</span>
              </Link>
              <Link
                href="/events"
                onClick={handleMobileLinkClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Eventos</span>
              </Link>
              <Link
                href="/mentorships"
                onClick={handleMobileLinkClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <AcademicCapIcon className="h-4 w-4" />
                <span>Mentorias</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={handleMobileLinkClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <ChartBarIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              
              {/* Links específicos por role no mobile */}
              {user.role === 'STUDENT' && (
                <Link
                  href="/my-subscriptions"
                  onClick={handleMobileLinkClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
                >
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>Minhas Inscrições</span>
                </Link>
              )}
              
              {(user.role === 'PARTNER' || user.role === 'MENTOR') && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criar</div>
                  <Link
                    href="/jobs/create"
                    onClick={handleMobileLinkClick}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  >
                    <BriefcaseIcon className="h-4 w-4" />
                    <span>Criar Vaga</span>
                  </Link>
                  <Link
                    href="/events/create"
                    onClick={handleMobileLinkClick}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span>Criar Evento</span>
                  </Link>
                  {user.role === 'MENTOR' && (
                    <Link
                      href="/mentorships/create"
                      onClick={handleMobileLinkClick}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
                    >
                      <AcademicCapIcon className="h-4 w-4" />
                      <span>Criar Mentoria</span>
                    </Link>
                  )}
                </>
              )}
              
              {user.role === 'MENTOR' && (
                <Link
                  href="/portal/mentor"
                  onClick={handleMobileLinkClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
                >
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>Portal do Mentor</span>
                </Link>
              )}
              
              {user.role === 'PARTNER' && (
                <>
                  <Link
                    href="/portal/company"
                    onClick={handleMobileLinkClick}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  >
                    <BriefcaseIcon className="h-4 w-4" />
                    <span>Portal da Empresa</span>
                  </Link>
                  <Link
                    href="/portal/organizer"
                    onClick={handleMobileLinkClick}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span>Portal do Organizador</span>
                  </Link>
                </>
              )}
              
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={handleMobileLinkClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  <span>Administração</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

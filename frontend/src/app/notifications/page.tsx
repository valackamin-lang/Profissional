'use client';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Header } from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Link from 'next/link';
import {
  BriefcaseIcon,
  CalendarIcon,
  AcademicCapIcon,
  BellIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.data.notifications || []);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      setError(error.response?.data?.error?.message || 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      await Promise.all(
        unreadNotifications.map((notif) => api.put(`/notifications/${notif.id}/read`))
      );
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    } catch (error: any) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
              <p className="text-gray-600 mt-2">
                {unreadCount > 0
                  ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                  : 'Todas as notificações foram lidas'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-center">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const getNotificationIcon = (type: string) => {
    const iconClass = "h-6 w-6";
    switch (type) {
      case 'JOB':
        return <BriefcaseIcon className={iconClass} />;
      case 'EVENT':
        return <CalendarIcon className={iconClass} />;
      case 'MENTORSHIP':
        return <AcademicCapIcon className={iconClass} />;
      case 'SYSTEM':
        return <BellIcon className={iconClass} />;
      default:
        return <EnvelopeIcon className={iconClass} />;
    }
  };

  const content = (
    <div
      className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
        !notification.read ? 'border-l-4 border-primary-600' : ''
      }`}
      onClick={() => {
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
        if (notification.link) {
          window.location.href = notification.link;
        }
      }}
    >
      <div className="flex items-start space-x-3">
        <div className="text-primary-600">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className={`text-sm font-medium ${
                !notification.read ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              {notification.title}
            </h3>
            {!notification.read && (
              <span className="ml-2 h-2 w-2 bg-primary-600 rounded-full"></span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(notification.createdAt).toLocaleDateString('pt-AO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !isRedirecting) {
      if (!user) {
        if (pathname !== '/login') {
          setIsRedirecting(true);
          // Usar window.location para redirecionamento mais seguro
          window.location.href = '/login';
        }
      } else if (requiredRole && user.role !== requiredRole) {
        if (pathname !== '/') {
          setIsRedirecting(true);
          window.location.href = '/';
        }
      }
    }
  }, [user, loading, requiredRole, router, pathname, isRedirecting]);

  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};

'use client';

import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Header } from '../components/Header';
import { Feed } from '../components/Feed';
import { FeedSidebar } from '../components/FeedSidebar';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">FORGETECH Professional</h1>
          <p className="text-lg text-gray-600 mb-8">
            Plataforma profissional de vagas, mentoria e eventos
          </p>
          <div className="space-x-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-block"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
            <p className="text-gray-600 mt-2">
              Descubra vagas, eventos e mentorias personalizadas para você
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Feed />
            </div>
            <div className="lg:col-span-1">
              <FeedSidebar />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Header } from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Link from 'next/link';
import {
  AcademicCapIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface Mentorship {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  maxStudents?: number;
  currentStudents?: number;
  mentor?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function MentorshipsPage() {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    search: '',
    maxPrice: '',
    minDuration: '',
    maxDuration: '',
  });

  useEffect(() => {
    loadMentorships();
  }, [filters]);

  const loadMentorships = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      try {
        const response = await api.get(`/mentorships?${params.toString()}`);
        let mentorshipsData = response.data.data.mentorships || [];
        
        // Filter by price if specified
        if (filters.maxPrice) {
          const maxPrice = parseFloat(filters.maxPrice);
          mentorshipsData = mentorshipsData.filter((m: Mentorship) => 
            typeof m.price === 'number' ? m.price <= maxPrice : parseFloat(m.price || '0') <= maxPrice
          );
        }
        
        // Filter by duration if specified
        if (filters.minDuration) {
          const minDuration = parseInt(filters.minDuration);
          mentorshipsData = mentorshipsData.filter((m: Mentorship) => m.duration >= minDuration);
        }
        if (filters.maxDuration) {
          const maxDuration = parseInt(filters.maxDuration);
          mentorshipsData = mentorshipsData.filter((m: Mentorship) => m.duration <= maxDuration);
        }
        
        setMentorships(mentorshipsData);
      } catch {
        const feedResponse = await api.get('/feed?type=MENTORSHIP');
        const feedItems = feedResponse.data.data.feed || [];
        setMentorships(feedItems.map((item: any) => item.content).filter(Boolean));
      }
    } catch (error) {
      console.error('Error loading mentorships:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = mentorships.filter(m => m.status === 'ACTIVE').length;
  const avgPrice = mentorships.length > 0
    ? Math.round(
        mentorships.reduce((sum, m) => {
          const price = typeof m.price === 'number' ? m.price : parseFloat(m.price || '0');
          return sum + price;
        }, 0) / mentorships.length
      )
    : 0;
  const totalStudents = mentorships.reduce((sum, m) => sum + (m.currentStudents || 0), 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Mentorias</h1>
                <p className="text-gray-600 text-lg">Desenvolva suas habilidades com mentores experientes</p>
              </div>
              {(user?.role === 'MENTOR' || user?.role === 'ADMIN') && (
                <Link
                  href="/mentorships/create"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all font-medium flex items-center space-x-2"
                >
                  <AcademicCapIcon className="h-5 w-5" />
                  <span>Criar Mentoria</span>
                </Link>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Mentorias</p>
                    <p className="text-2xl font-bold text-gray-900">{mentorships.length}</p>
                  </div>
                  <AcademicCapIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ativas</p>
                    <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Preço Médio</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {avgPrice > 0 ? `Kz ${avgPrice.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Estudantes</p>
                    <p className="text-2xl font-bold text-purple-600">{totalStudents}</p>
                  </div>
                  <UserGroupIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5" />
                <span>Filtros</span>
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {showFilters ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                    Buscar
                  </label>
                  <input
                    type="text"
                    placeholder="Título, descrição..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="ACTIVE">Ativas</option>
                    <option value="INACTIVE">Inativas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço Máx. (Kz)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Sem limite"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duração Mín. (h)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Qualquer"
                    value={filters.minDuration}
                    onChange={(e) => setFilters({ ...filters, minDuration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duração Máx. (h)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Qualquer"
                    value={filters.maxDuration}
                    onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mentorships Grid */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : mentorships.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">Nenhuma mentoria encontrada</p>
              <p className="text-gray-600">Tente ajustar os filtros ou criar uma nova mentoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentorships.map((mentorship) => {
                const price = typeof mentorship.price === 'number' ? mentorship.price : parseFloat(mentorship.price || '0');
                const occupancyRate = mentorship.maxStudents 
                  ? Math.round(((mentorship.currentStudents || 0) / mentorship.maxStudents) * 100) 
                  : 0;
                const spotsLeft = mentorship.maxStudents 
                  ? mentorship.maxStudents - (mentorship.currentStudents || 0) 
                  : null;

                return (
                  <Link
                    key={mentorship.id}
                    href={`/mentorships/${mentorship.id}`}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary-300 transition-all duration-300"
                  >
                    {/* Header with gradient */}
                    <div className={`h-2 ${
                      mentorship.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      mentorship.status === 'INACTIVE' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      'bg-gradient-to-r from-red-500 to-red-600'
                    }`}></div>
                    
                    <div className="p-6">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-3 line-clamp-2">
                        {mentorship.title}
                      </h3>

                      {/* Mentor Info */}
                      {mentorship.mentor && (
                        <div className="flex items-center space-x-2 mb-4">
                          {mentorship.mentor.avatar ? (
                            <img
                              src={mentorship.mentor.avatar}
                              alt={`${mentorship.mentor.firstName || ''} ${mentorship.mentor.lastName || ''}`}
                              className="h-10 w-10 rounded-full border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-gray-200">
                              <AcademicCapIcon className="h-5 w-5 text-primary-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {mentorship.mentor.firstName || ''} {mentorship.mentor.lastName || ''}
                            </p>
                            <p className="text-xs text-gray-500">Mentor</p>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-gray-700 text-sm line-clamp-2 mb-4">{mentorship.description}</p>

                      {/* Price and Duration */}
                      <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Preço</p>
                          <p className="text-xl font-bold text-primary-700">
                            Kz {price.toFixed(0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Duração</p>
                          <p className="text-lg font-bold text-gray-900 flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {mentorship.duration}h
                          </p>
                        </div>
                      </div>

                      {/* Students Info */}
                      {mentorship.maxStudents && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Vagas</span>
                            <span className="text-xs font-medium text-gray-900">
                              {mentorship.currentStudents || 0}/{mentorship.maxStudents}
                              {spotsLeft !== null && spotsLeft > 0 && (
                                <span className="ml-1 text-primary-600">({spotsLeft} restantes)</span>
                              )}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                occupancyRate >= 90 ? 'bg-red-500' :
                                occupancyRate >= 70 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          mentorship.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          mentorship.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {mentorship.status === 'ACTIVE' ? 'Ativa' :
                           mentorship.status === 'INACTIVE' ? 'Inativa' : 'Suspensa'}
                        </span>
                        <span className="text-sm text-primary-600 font-medium group-hover:text-primary-700">
                          Ver detalhes →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

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
  XMarkIcon,
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

type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low' | 'duration-high' | 'duration-low';
type ViewMode = 'list' | 'grid';

export default function MentorshipsPage() {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [filteredMentorships, setFilteredMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    search: '',
    maxPrice: '',
    minDuration: '',
    maxDuration: '',
  });

  useEffect(() => {
    loadMentorships();
  }, []);

  useEffect(() => {
    // Debounce search
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    const timeout = setTimeout(() => {
      loadMentorships();
    }, 500);
    setSearchDebounce(timeout);
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [filters.search]);

  useEffect(() => {
    loadMentorships();
  }, [filters.status, filters.maxPrice, filters.minDuration, filters.maxDuration]);

  useEffect(() => {
    applySortAndFilter();
  }, [mentorships, sortBy]);

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
        
        if (filters.maxPrice) {
          const maxPrice = parseFloat(filters.maxPrice);
          mentorshipsData = mentorshipsData.filter((m: Mentorship) => {
            const price = typeof m.price === 'number' ? m.price : parseFloat(m.price || '0');
            return price <= maxPrice;
          });
        }
        
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

  const applySortAndFilter = () => {
    const sorted = [...mentorships];

    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price || '0');
          const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price || '0');
          return priceB - priceA;
        });
        break;
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price || '0');
          const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price || '0');
          return priceA - priceB;
        });
        break;
      case 'duration-high':
        sorted.sort((a, b) => b.duration - a.duration);
        break;
      case 'duration-low':
        sorted.sort((a, b) => a.duration - b.duration);
        break;
    }

    setFilteredMentorships(sorted);
  };

  const clearFilters = () => {
    setFilters({
      status: 'ACTIVE',
      search: '',
      maxPrice: '',
      minDuration: '',
      maxDuration: '',
    });
  };

  const quickFilterStatus = [
    { value: '', label: 'Todas', icon: '📚' },
    { value: 'ACTIVE', label: 'Ativas', icon: '✅' },
    { value: 'INACTIVE', label: 'Inativas', icon: '⏸️' },
  ];

  const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== 'ACTIVE').length;
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
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Mentorias</h1>
                <p className="text-gray-600 text-lg">Desenvolva suas habilidades com mentores experientes</p>
              </div>
              {(user?.role === 'MENTOR' || user?.role === 'ADMIN') && (
                <Link
                  href="/mentorships/create"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all font-medium flex items-center space-x-2 transform hover:scale-105"
                >
                  <AcademicCapIcon className="h-5 w-5" />
                  <span>Criar Mentoria</span>
                </Link>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Mentorias</p>
                    <p className="text-2xl font-bold text-gray-900">{mentorships.length}</p>
                  </div>
                  <AcademicCapIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ativas</p>
                    <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
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
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
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

          {/* Quick Filters */}
          <div className="mb-6 animate-fade-in">
            <div className="flex flex-wrap gap-2 mb-4">
              {quickFilterStatus.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilters({ ...filters, status: filter.value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.status === filter.value
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="mr-2">{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-4 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <FunnelIcon className="h-5 w-5" />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                      {activeFiltersCount}
                    </span>
                  )}
                </h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span>Limpar filtros</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600'
                    }`}
                    title="Visualização em lista"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600'
                    }`}
                    title="Visualização em grade"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none bg-white"
                  >
                    <option value="newest">Mais recentes</option>
                    <option value="oldest">Mais antigas</option>
                    <option value="price-high">Maior preço</option>
                    <option value="price-low">Menor preço</option>
                    <option value="duration-high">Maior duração</option>
                    <option value="duration-low">Menor duração</option>
                  </select>
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 transition-all duration-300 ${
              showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar mais filtros'}
            </button>
          </div>

          {/* Mentorships List/Grid */}
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-2 bg-gray-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMentorships.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center animate-fade-in">
              <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">Nenhuma mentoria encontrada</p>
              <p className="text-gray-600 mb-4">Tente ajustar os filtros ou criar uma nova mentoria</p>
              {(user?.role === 'MENTOR' || user?.role === 'ADMIN') && (
                <Link
                  href="/mentorships/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Criar Primeira Mentoria
                </Link>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredMentorships.map((mentorship, index) => {
                const price = typeof mentorship.price === 'number' 
                  ? mentorship.price 
                  : (typeof mentorship.price === 'string' 
                    ? parseFloat(mentorship.price) || 0 
                    : Number(mentorship.price) || 0);
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
                    className={`group bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary-300 transition-all duration-300 animate-fade-in ${
                      viewMode === 'list' ? 'flex gap-6 p-6' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Header with gradient */}
                    <div className={`${viewMode === 'list' ? 'w-2' : 'h-2'} ${
                      mentorship.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      mentorship.status === 'INACTIVE' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      'bg-gradient-to-r from-red-500 to-red-600'
                    }`}></div>
                    
                    <div className={`${viewMode === 'list' ? 'flex-1 flex gap-6' : 'p-6'}`}>
                      {viewMode === 'list' && mentorship.mentor && (
                        <div className="flex-shrink-0">
                          {mentorship.mentor.avatar ? (
                            <img
                              src={mentorship.mentor.avatar}
                              alt={`${mentorship.mentor.firstName || ''} ${mentorship.mentor.lastName || ''}`}
                              className="h-24 w-24 rounded-xl object-cover border-2 border-gray-200 shadow-sm"
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-gray-200 shadow-sm">
                              <AcademicCapIcon className="h-12 w-12 text-primary-600" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className={`font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-3 ${
                          viewMode === 'list' ? 'text-2xl' : 'text-xl line-clamp-2'
                        }`}>
                          {mentorship.title}
                        </h3>

                        {/* Mentor Info */}
                        {mentorship.mentor && (
                          <div className="flex items-center space-x-2 mb-4">
                            {viewMode === 'grid' && (
                              <>
                                {mentorship.mentor.avatar ? (
                                  <img
                                    src={mentorship.mentor.avatar}
                                    alt={`${mentorship.mentor.firstName || ''} ${mentorship.mentor.lastName || ''}`}
                                    className="h-10 w-10 rounded-full border-2 border-gray-200 shadow-sm"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-gray-200 shadow-sm">
                                    <AcademicCapIcon className="h-5 w-5 text-primary-600" />
                                  </div>
                                )}
                              </>
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
                        <p className={`text-gray-700 mb-4 ${viewMode === 'list' ? 'text-base' : 'text-sm line-clamp-2'}`}>
                          {mentorship.description}
                        </p>

                        {/* Price and Duration */}
                        <div className={`flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg ${
                          viewMode === 'list' ? 'max-w-md' : ''
                        }`}>
                          <div>
                            <p className="text-xs text-gray-600">Preço</p>
                            <p className="text-xl font-bold text-primary-700">
                              Kz {typeof price === 'number' && !isNaN(price) ? price.toFixed(0) : '0'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Duração</p>
                            <p className="text-lg font-bold text-gray-900 flex items-center justify-end">
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
                          <span className="text-sm text-primary-600 font-medium group-hover:text-primary-700 transition-colors">
                            Ver detalhes →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </ProtectedRoute>
  );
}

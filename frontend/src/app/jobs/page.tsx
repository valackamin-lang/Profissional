'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Header } from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Link from 'next/link';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  location?: string;
  type: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  status: 'OPEN' | 'CLOSED' | 'PAUSED';
  requirements?: string;
  salaryMin?: number;
  salaryMax?: number;
  applicationDeadline?: string;
  profile?: {
    id?: string;
    companyName?: string;
    companyLogo?: string;
  };
  createdAt: string;
}

type SortOption = 'newest' | 'oldest' | 'salary-high' | 'salary-low' | 'deadline';
type ViewMode = 'list' | 'grid';

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    search: '',
    salaryMin: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    // Debounce search
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    const timeout = setTimeout(() => {
      loadJobs();
    }, 500);
    setSearchDebounce(timeout);
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [filters.search]);

  useEffect(() => {
    loadJobs();
  }, [filters.type, filters.location, filters.salaryMin]);

  useEffect(() => {
    applySortAndFilter();
  }, [jobs, sortBy]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.location) params.append('location', filters.location);
      if (filters.search) params.append('search', filters.search);
      params.append('status', 'OPEN');

      const response = await api.get(`/jobs?${params.toString()}`);
      let jobsData = response.data.data.jobs || [];
      
      if (filters.salaryMin) {
        const minSalary = parseFloat(filters.salaryMin);
        jobsData = jobsData.filter((job: Job) => 
          job.salaryMin && job.salaryMin >= minSalary
        );
      }
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySortAndFilter = () => {
    const sorted = [...jobs];

    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'salary-high':
        sorted.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
        break;
      case 'salary-low':
        sorted.sort((a, b) => (a.salaryMin || 0) - (b.salaryMin || 0));
        break;
      case 'deadline':
        sorted.sort((a, b) => {
          const aDeadline = a.applicationDeadline ? new Date(a.applicationDeadline).getTime() : Infinity;
          const bDeadline = b.applicationDeadline ? new Date(b.applicationDeadline).getTime() : Infinity;
          return aDeadline - bDeadline;
        });
        break;
    }

    setFilteredJobs(sorted);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      location: '',
      search: '',
      salaryMin: '',
    });
  };

  const quickFilterTypes = [
    { value: '', label: 'Todos', icon: '💼' },
    { value: 'FULL_TIME', label: 'Tempo Integral', icon: '💼' },
    { value: 'PART_TIME', label: 'Meio Período', icon: '⏰' },
    { value: 'INTERNSHIP', label: 'Estágio', icon: '🎓' },
    { value: 'CONTRACT', label: 'Contrato', icon: '📋' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INTERNSHIP': return '🎓';
      case 'FULL_TIME': return '💼';
      case 'PART_TIME': return '⏰';
      case 'CONTRACT': return '📋';
      default: return '💼';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INTERNSHIP': return 'bg-purple-100 text-purple-800';
      case 'FULL_TIME': return 'bg-blue-100 text-blue-800';
      case 'PART_TIME': return 'bg-green-100 text-green-800';
      case 'CONTRACT': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;
  const openJobsCount = jobs.filter(j => j.status === 'OPEN').length;
  const avgSalary = jobs.length > 0 && jobs.some(j => j.salaryMin && j.salaryMax)
    ? Math.round(
        jobs
          .filter(j => j.salaryMin && j.salaryMax)
          .reduce((sum, j) => sum + ((j.salaryMin! + j.salaryMax!) / 2), 0) /
        jobs.filter(j => j.salaryMin && j.salaryMax).length
      )
    : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Vagas de Emprego</h1>
                <p className="text-gray-600 text-lg">Encontre oportunidades que combinam com você</p>
              </div>
              {(user?.role === 'PARTNER' || user?.role === 'ADMIN') && (
                <Link
                  href="/jobs/create"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all font-medium flex items-center space-x-2 transform hover:scale-105"
                >
                  <BriefcaseIcon className="h-5 w-5" />
                  <span>Criar Vaga</span>
                </Link>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vagas Abertas</p>
                    <p className="text-2xl font-bold text-gray-900">{openJobsCount}</p>
                  </div>
                  <BriefcaseIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Salário Médio</p>
                    <p className="text-2xl font-bold text-green-600">
                      {avgSalary > 0 ? `Kz ${avgSalary.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Vagas</p>
                    <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                  </div>
                  <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mb-6 animate-fade-in">
            <div className="flex flex-wrap gap-2 mb-4">
              {quickFilterTypes.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilters({ ...filters, type: filter.value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.type === filter.value
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
                    <option value="salary-high">Maior salário</option>
                    <option value="salary-low">Menor salário</option>
                    <option value="deadline">Prazo próximo</option>
                  </select>
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-300 ${
              showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Título, empresa..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Todos os tipos</option>
                  <option value="INTERNSHIP">Estágio</option>
                  <option value="FULL_TIME">Tempo Integral</option>
                  <option value="PART_TIME">Meio Período</option>
                  <option value="CONTRACT">Contrato</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Localização</label>
                <input
                  type="text"
                  placeholder="Cidade, estado..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salário Mínimo (Kz)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Sem limite"
                  value={filters.salaryMin}
                  onChange={(e) => setFilters({ ...filters, salaryMin: e.target.value })}
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

          {/* Jobs List/Grid */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="flex gap-6">
                    <div className="h-20 w-20 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center animate-fade-in">
              <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BriefcaseIcon className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-900 mb-2">Nenhuma vaga encontrada</p>
              <p className="text-gray-600 mb-4">Tente ajustar os filtros ou criar uma nova vaga</p>
              {(user?.role === 'PARTNER' || user?.role === 'ADMIN') && (
                <Link
                  href="/jobs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Criar Primeira Vaga
                </Link>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredJobs.map((job, index) => {
                const deadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
                const isDeadlinePassed = deadline ? deadline < new Date() : false;
                const daysUntilDeadline = deadline 
                  ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className={`group block bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary-300 transition-all duration-300 animate-fade-in ${
                      viewMode === 'grid' ? 'p-6' : 'p-6'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {viewMode === 'grid' ? (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          {job.profile?.companyLogo ? (
                            <img
                              src={job.profile.companyLogo}
                              alt={job.company}
                              className="h-16 w-16 rounded-xl object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-gray-200">
                              <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
                            </div>
                          )}
                          {job.status === 'OPEN' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Aberta
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-1 line-clamp-2">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">{job.company}</p>
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-2">{job.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                            {getTypeIcon(job.type)} {job.type === 'INTERNSHIP' ? 'Estágio' :
                             job.type === 'FULL_TIME' ? 'Tempo Integral' :
                             job.type === 'PART_TIME' ? 'Meio Período' : 'Contrato'}
                          </span>
                          {job.salaryMin && job.salaryMax && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                              Kz {job.salaryMin.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-shrink-0">
                          {job.profile?.companyLogo ? (
                            <img
                              src={job.profile.companyLogo}
                              alt={job.company}
                              className="h-20 w-20 rounded-xl object-cover border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-shadow"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
                              <BuildingOfficeIcon className="h-10 w-10 text-primary-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                                {job.title}
                              </h3>
                              <p className="text-lg text-gray-700 font-medium">{job.company}</p>
                            </div>
                            {job.status === 'OPEN' && (
                              <span className="ml-4 flex-shrink-0 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Aberta
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 line-clamp-2 mb-4">{job.description}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                              {getTypeIcon(job.type)} {job.type === 'INTERNSHIP' ? 'Estágio' :
                               job.type === 'FULL_TIME' ? 'Tempo Integral' :
                               job.type === 'PART_TIME' ? 'Meio Período' : 'Contrato'}
                            </span>
                            {job.location && (
                              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                <MapPinIcon className="h-3 w-3 mr-1" />
                                {job.location}
                              </span>
                            )}
                            {job.salaryMin && job.salaryMax && (
                              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                                Kz {job.salaryMin.toLocaleString()} - Kz {job.salaryMax.toLocaleString()}
                              </span>
                            )}
                            {deadline && !isDeadlinePassed && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                daysUntilDeadline !== null && daysUntilDeadline <= 7 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {daysUntilDeadline !== null && daysUntilDeadline <= 7
                                  ? `${daysUntilDeadline} dias restantes`
                                  : `Prazo: ${deadline.toLocaleDateString('pt-AO')}`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-500">
                              Publicado em {new Date(job.createdAt).toLocaleDateString('pt-AO')}
                            </span>
                            <span className="text-sm text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                              Ver detalhes →
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
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

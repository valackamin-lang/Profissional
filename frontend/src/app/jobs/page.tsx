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
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  ClockIcon,
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

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    search: '',
    salaryMin: '',
  });

  useEffect(() => {
    loadJobs();
  }, [filters]);

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
      
      // Filter by minimum salary if specified
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INTERNSHIP':
        return '🎓';
      case 'FULL_TIME':
        return '💼';
      case 'PART_TIME':
        return '⏰';
      case 'CONTRACT':
        return '📋';
      default:
        return '💼';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INTERNSHIP':
        return 'bg-purple-100 text-purple-800';
      case 'FULL_TIME':
        return 'bg-blue-100 text-blue-800';
      case 'PART_TIME':
        return 'bg-green-100 text-green-800';
      case 'CONTRACT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Vagas de Emprego</h1>
                <p className="text-gray-600 text-lg">Encontre oportunidades que combinam com você</p>
              </div>
              {(user?.role === 'COMPANY' || user?.role === 'ADMIN') && (
                <Link
                  href="/jobs/create"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all font-medium flex items-center space-x-2"
                >
                  <BriefcaseIcon className="h-5 w-5" />
                  <span>Criar Vaga</span>
                </Link>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vagas Abertas</p>
                    <p className="text-2xl font-bold text-gray-900">{openJobsCount}</p>
                  </div>
                  <BriefcaseIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
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
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            )}
          </div>

          {/* Jobs List */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
              <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BriefcaseIcon className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-900 mb-2">Nenhuma vaga encontrada</p>
              <p className="text-gray-600 mb-4">Tente ajustar os filtros ou criar uma nova vaga</p>
              {(user?.role === 'COMPANY' || user?.role === 'ADMIN') && (
                <Link
                  href="/jobs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Criar Primeira Vaga
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const deadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
                const isDeadlinePassed = deadline ? deadline < new Date() : false;
                const daysUntilDeadline = deadline 
                  ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="group block bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:shadow-xl hover:border-primary-300 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Company Logo/Icon */}
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

                      {/* Job Info */}
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

                        {/* Badges and Info */}
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

                        {/* Footer */}
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

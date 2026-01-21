'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../lib/api';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

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
  updatedAt?: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id && user) {
      loadJob();
      checkApplication();
    }
  }, [params.id, user]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${params.id}`);
      setJob(response.data.data.job);
    } catch (error: any) {
      console.error('Error loading job:', error);
      setError('Erro ao carregar vaga');
    } finally {
      setLoading(false);
    }
  };

  const checkApplication = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/jobs/${params.id}/applications/me`);
      setHasApplied(response.data.data.hasApplied || false);
    } catch (error) {
      setHasApplied(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    try {
      setApplying(true);
      setError('');
      await api.post(`/jobs/${job.id}/applications`, {
        coverLetter: 'Interessado na vaga',
      });
      setHasApplied(true);
    } catch (error: any) {
      console.error('Error applying:', error);
      setError(error.response?.data?.error?.message || 'Erro ao candidatar-se');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!job) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Vaga não encontrada</p>
              <button
                onClick={() => router.back()}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                ← Voltar
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const deadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
  const isDeadlinePassed = deadline ? deadline < new Date() : false;
  const daysUntilDeadline = deadline 
    ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'INTERNSHIP':
        return 'Estágio';
      case 'FULL_TIME':
        return 'Tempo Integral';
      case 'PART_TIME':
        return 'Meio Período';
      case 'CONTRACT':
        return 'Contrato';
      default:
        return type;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Status de Candidatura - Banner Superior */}
          {hasApplied && (
            <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircleIconSolid className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-lg">Candidatura Enviada!</h3>
                  <p className="text-sm text-green-100">
                    Sua candidatura foi enviada com sucesso. A empresa entrará em contato em breve.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
                  <button
                    onClick={() => router.back()}
                    className="text-white/80 hover:text-white mb-4 text-sm flex items-center"
                  >
                    ← Voltar
                  </button>
                  <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                  <div className="flex items-center space-x-3 mt-4">
                    {job.profile?.companyLogo ? (
                      <img
                        src={job.profile.companyLogo}
                        alt={job.company}
                        className="h-12 w-12 rounded-lg border-2 border-white/30 object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-white/80">Empresa</p>
                      <p className="text-lg font-semibold text-white">{job.company}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Badges de Informação */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center px-4 py-2 bg-blue-100 rounded-lg">
                      <BriefcaseIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-xs text-gray-600">Tipo</p>
                        <p className="font-bold text-blue-900">{getTypeLabel(job.type)}</p>
                      </div>
                    </div>
                    {job.location && (
                      <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                        <MapPinIcon className="h-5 w-5 text-gray-600 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Localização</p>
                          <p className="font-bold text-gray-900">{job.location}</p>
                        </div>
                      </div>
                    )}
                    {job.salaryMin && job.salaryMax && (
                      <div className="flex items-center px-4 py-2 bg-green-100 rounded-lg">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Salário</p>
                          <p className="font-bold text-green-900">
                            Kz {job.salaryMin.toLocaleString()} - Kz {job.salaryMax.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {deadline && (
                      <div className={`flex items-center px-4 py-2 rounded-lg ${
                        isDeadlinePassed ? 'bg-red-100' :
                        daysUntilDeadline !== null && daysUntilDeadline <= 7 ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        <CalendarIcon className={`h-5 w-5 mr-2 ${
                          isDeadlinePassed ? 'text-red-600' :
                          daysUntilDeadline !== null && daysUntilDeadline <= 7 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`} />
                        <div>
                          <p className="text-xs text-gray-600">Prazo</p>
                          <p className={`font-bold ${
                            isDeadlinePassed ? 'text-red-900' :
                            daysUntilDeadline !== null && daysUntilDeadline <= 7 ? 'text-yellow-900' :
                            'text-gray-900'
                          }`}>
                            {isDeadlinePassed ? 'Encerrado' :
                             daysUntilDeadline !== null && daysUntilDeadline <= 7 ? `${daysUntilDeadline} dias` :
                             deadline.toLocaleDateString('pt-AO')}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className={`flex items-center px-4 py-2 rounded-lg ${
                      job.status === 'OPEN' ? 'bg-green-100' :
                      job.status === 'CLOSED' ? 'bg-red-100' :
                      'bg-yellow-100'
                    }`}>
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        job.status === 'OPEN' ? 'bg-green-500' :
                        job.status === 'CLOSED' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="text-xs text-gray-600">Status</p>
                        <p className={`font-bold ${
                          job.status === 'OPEN' ? 'text-green-900' :
                          job.status === 'CLOSED' ? 'text-red-900' :
                          'text-yellow-900'
                        }`}>
                          {job.status === 'OPEN' ? 'Aberta' :
                           job.status === 'CLOSED' ? 'Fechada' : 'Pausada'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Sobre a Vaga</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                    </div>
                  </div>

                  {/* Requisitos */}
                  {job.requirements && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Requisitos</h2>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
                      </div>
                    </div>
                  )}

                  {/* Informações Adicionais */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Publicado em</p>
                        <p className="font-medium text-gray-900">
                          {new Date(job.createdAt).toLocaleDateString('pt-AO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {job.updatedAt && (
                        <div>
                          <p className="text-gray-500">Última atualização</p>
                          <p className="font-medium text-gray-900">
                            {new Date(job.updatedAt).toLocaleDateString('pt-AO', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Card de Ação */}
              {user?.role === 'STUDENT' && job.status === 'OPEN' && !isDeadlinePassed && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                  {hasApplied ? (
                    <div className="text-center">
                      <CheckCircleIconSolid className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Candidatura Enviada</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Sua candidatura foi enviada com sucesso. A empresa entrará em contato em breve.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-green-600">Candidatado</span>
                        </div>
                        {deadline && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prazo:</span>
                            <span className="font-medium">
                              {deadline.toLocaleDateString('pt-AO')}
                            </span>
                          </div>
                        )}
                        {job.salaryMin && job.salaryMax && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Salário:</span>
                            <span className="font-medium">
                              Kz {job.salaryMin.toLocaleString()} - Kz {job.salaryMax.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Candidatar-se</h3>
                      <div className="space-y-4 mb-6">
                        {job.salaryMin && job.salaryMax && (
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Salário</span>
                            <span className="text-lg font-bold text-gray-900">
                              Kz {job.salaryMin.toLocaleString()} - Kz {job.salaryMax.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Tipo</span>
                          <span className="text-sm font-bold text-gray-900">{getTypeLabel(job.type)}</span>
                        </div>
                        {job.location && (
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Localização</span>
                            <span className="text-sm font-bold text-gray-900">{job.location}</span>
                          </div>
                        )}
                        {deadline && (
                          <div className={`flex justify-between items-center p-3 rounded-lg ${
                            daysUntilDeadline !== null && daysUntilDeadline <= 7 ? 'bg-yellow-50' : 'bg-gray-50'
                          }`}>
                            <span className="text-sm text-gray-600">Prazo</span>
                            <span className={`text-sm font-bold ${
                              daysUntilDeadline !== null && daysUntilDeadline <= 7 ? 'text-yellow-900' : 'text-gray-900'
                            }`}>
                              {daysUntilDeadline !== null && daysUntilDeadline <= 7 
                                ? `${daysUntilDeadline} dias restantes`
                                : deadline.toLocaleDateString('pt-AO')}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleApply}
                        disabled={applying || isDeadlinePassed}
                        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        {applying ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Enviando...</span>
                          </>
                        ) : isDeadlinePassed ? (
                          <>
                            <XCircleIcon className="h-5 w-5" />
                            <span>Prazo Encerrado</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>Candidatar-se Agora</span>
                          </>
                        )}
                      </button>
                      {deadline && daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline > 0 && (
                        <p className="text-xs text-yellow-600 mt-2 text-center">
                          ⚠️ Apenas {daysUntilDeadline} dia{daysUntilDeadline > 1 ? 's' : ''} restante{daysUntilDeadline > 1 ? 's' : ''}!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Card de Informações */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`font-semibold ${
                      job.status === 'OPEN' ? 'text-green-600' :
                      job.status === 'CLOSED' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {job.status === 'OPEN' ? 'Aberta' :
                       job.status === 'CLOSED' ? 'Fechada' : 'Pausada'}
                    </span>
                  </div>
                  {deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Prazo de Inscrição</span>
                      <span className={`font-semibold ${
                        isDeadlinePassed ? 'text-red-600' :
                        daysUntilDeadline !== null && daysUntilDeadline <= 7 ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        {isDeadlinePassed ? 'Encerrado' : deadline.toLocaleDateString('pt-AO')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tipo de Contrato</span>
                    <span className="font-semibold text-gray-900">{getTypeLabel(job.type)}</span>
                  </div>
                  {job.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Localização</span>
                      <span className="font-semibold text-gray-900">{job.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

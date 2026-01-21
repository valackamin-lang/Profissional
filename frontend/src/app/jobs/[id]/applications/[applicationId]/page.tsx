'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '../../../../../components/ProtectedRoute';
import { Header } from '../../../../../components/Header';
import { useAuth } from '../../../../../contexts/AuthContext';
import api from '../../../../../lib/api';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Application {
  id: string;
  status: string;
  coverLetter?: string;
  resume?: string;
  notes?: string;
  createdAt: string;
  applicant: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    user?: {
      email: string;
    };
  };
  job: {
    id: string;
    title: string;
    company: string;
    profile?: {
      companyLogo?: string;
    };
  };
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const jobId = params.id as string;
  const applicationId = params.applicationId as string;

  useEffect(() => {
    if (jobId && applicationId && user) {
      loadApplication();
    }
  }, [jobId, applicationId, user]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/jobs/${jobId}/applications/${applicationId}`);
      setApplication(response.data.data.application);
    } catch (error: any) {
      console.error('Error loading application:', error);
      setError(error.response?.data?.error?.message || 'Erro ao carregar candidatura');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (status: string) => {
    try {
      setUpdating(true);
      await api.put(`/jobs/applications/${applicationId}`, { status });
      await loadApplication();
    } catch (error: any) {
      console.error('Error updating application:', error);
      alert(error.response?.data?.error?.message || 'Erro ao atualizar candidatura');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-4 w-4 mr-1" />
          Pendente
        </span>
      );
    }
    if (status === 'REVIEWED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <EyeIcon className="h-4 w-4 mr-1" />
          Revisada
        </span>
      );
    }
    if (status === 'ACCEPTED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Aceita
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-4 w-4 mr-1" />
          Rejeitada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <Header />
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !application) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <Header />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar candidatura</h2>
              <p className="text-gray-600 mb-6">{error || 'Candidatura não encontrada'}</p>
              <Link
                href={`/jobs/${jobId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Voltar para a Vaga
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/jobs/${jobId}`}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar para a Vaga
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Detalhes da Candidatura</h1>
                <p className="text-gray-600 mt-1">Informações completas sobre a candidatura</p>
              </div>
              {getStatusBadge(application.status)}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Applicant Info */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-4">
                {application.applicant.avatar ? (
                  <img
                    className="h-16 w-16 rounded-full ring-2 ring-gray-200"
                    src={application.applicant.avatar}
                    alt={`${application.applicant.firstName} ${application.applicant.lastName}`}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-gray-200">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {application.applicant.firstName || ''} {application.applicant.lastName || ''}
                  </h2>
                  <p className="text-gray-600">{application.applicant.user?.email}</p>
                  <Link
                    href={`/profiles/${application.applicant.id}`}
                    className="inline-flex items-center mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Ver Perfil Completo
                    <ArrowLeftIcon className="h-4 w-4 ml-1 rotate-180" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Job Info */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BriefcaseIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Vaga</h3>
                  <Link
                    href={`/jobs/${application.job.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {application.job.title}
                  </Link>
                  <p className="text-sm text-gray-600">{application.job.company}</p>
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div className="p-6 space-y-6">
              {/* Cover Letter */}
              {application.coverLetter && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                    <label className="block text-sm font-semibold text-gray-900">Carta de Apresentação</label>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{application.coverLetter}</p>
                  </div>
                </div>
              )}

              {/* Resume */}
              {application.resume && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                    <label className="block text-sm font-semibold text-gray-900">Currículo</label>
                  </div>
                  <a
                    href={application.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Ver Currículo
                  </a>
                </div>
              )}

              {/* Notes */}
              {application.notes && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                    <label className="block text-sm font-semibold text-gray-900">Notas</label>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-900">{application.notes}</p>
                  </div>
                </div>
              )}

              {/* Application Date */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <CalendarIcon className="h-5 w-5 text-gray-600" />
                  <label className="block text-sm font-semibold text-gray-900">Data de Candidatura</label>
                </div>
                <p className="text-sm text-gray-700">
                  {new Date(application.createdAt).toLocaleDateString('pt-AO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Actions (only for job owners/admins) */}
            {application.status !== 'ACCEPTED' && application.status !== 'REJECTED' && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  {application.status !== 'ACCEPTED' && (
                    <button
                      onClick={() => updateApplicationStatus('ACCEPTED')}
                      disabled={updating}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      {updating ? 'Processando...' : 'Aprovar Candidatura'}
                    </button>
                  )}
                  {application.status !== 'REJECTED' && (
                    <button
                      onClick={() => updateApplicationStatus('REJECTED')}
                      disabled={updating}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      {updating ? 'Processando...' : 'Rejeitar Candidatura'}
                    </button>
                  )}
                  {application.status === 'PENDING' && (
                    <button
                      onClick={() => updateApplicationStatus('REVIEWED')}
                      disabled={updating}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <EyeIcon className="h-5 w-5 mr-2" />
                      {updating ? 'Processando...' : 'Marcar como Revisada'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

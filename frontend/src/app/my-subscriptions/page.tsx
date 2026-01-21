'use client';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Header } from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import {
  AcademicCapIcon,
  CalendarIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface MentorshipSubscription {
  id: string;
  status: string;
  createdAt: string;
  mentorship: {
    id: string;
    title: string;
    price: number;
    duration: number;
    mentor?: {
      id: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  };
}

interface EventRegistration {
  id: string;
  status: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    type: string;
    eventDate: string;
    price?: number;
    organizer?: {
      id: string;
      companyName?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

interface JobApplication {
  id: string;
  status: string;
  createdAt: string;
  coverLetter?: string;
  job: {
    id: string;
    title: string;
    company: string;
    type: string;
    location?: string;
    status: string;
  };
}

export default function MySubscriptionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'mentorships' | 'events' | 'jobs'>('mentorships');
  const [loading, setLoading] = useState(true);
  const [mentorships, setMentorships] = useState<MentorshipSubscription[]>([]);
  const [events, setEvents] = useState<EventRegistration[]>([]);
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState({
    mentorships: 0,
    events: 0,
    jobs: 0,
  });

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [mentorshipsRes, eventsRes, jobsRes] = await Promise.all([
        api.get('/mentorships/subscriptions/me').catch(() => ({ data: { data: { subscriptions: [] } } })),
        api.get('/events/registrations/me').catch(() => ({ data: { data: { registrations: [] } } })),
        api.get('/jobs/applications/me').catch(() => ({ data: { data: { applications: [] } } })),
      ]);

      const mentorshipsData = mentorshipsRes.data.data.subscriptions || [];
      const eventsData = eventsRes.data.data.registrations || [];
      const jobsData = jobsRes.data.data.applications || [];

      setMentorships(mentorshipsData);
      setEvents(eventsData);
      setJobs(jobsData);

      setStats({
        mentorships: mentorshipsData.length,
        events: eventsData.length,
        jobs: jobsData.length,
      });
    } catch (error: any) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, type: 'mentorship' | 'event' | 'job') => {
    if (type === 'mentorship') {
      switch (status) {
        case 'ACTIVE':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Ativa
            </span>
          );
        case 'CANCELLED':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircleIcon className="h-3 w-3 mr-1" />
              Cancelada
            </span>
          );
        case 'COMPLETED':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Concluída
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {status}
            </span>
          );
      }
    } else if (type === 'event') {
      switch (status) {
        case 'REGISTERED':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Inscrito
            </span>
          );
        case 'CANCELLED':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircleIcon className="h-3 w-3 mr-1" />
              Cancelado
            </span>
          );
        case 'ATTENDED':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Participou
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {status}
            </span>
          );
      }
    } else {
      // job
      switch (status) {
        case 'PENDING':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <ClockIcon className="h-3 w-3 mr-1" />
              Pendente
            </span>
          );
        case 'REVIEWED':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Revisada
            </span>
          );
        case 'ACCEPTED':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Aceita
            </span>
          );
        case 'REJECTED':
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircleIcon className="h-3 w-3 mr-1" />
              Rejeitada
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {status}
            </span>
          );
      }
    }
  };

  const getJobTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      INTERNSHIP: 'Estágio',
      FULL_TIME: 'Tempo Integral',
      PART_TIME: 'Meio Período',
      CONTRACT: 'Contrato',
    };
    return types[type] || type;
  };

  const getEventTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      WORKSHOP: 'Workshop',
      WEBINAR: 'Webinar',
      CONFERENCE: 'Conferência',
    };
    return types[type] || type;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-primary-100 rounded-lg">
                <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Minhas Inscrições</h1>
                <p className="text-gray-600 mt-1">Gerencie todas suas inscrições em um só lugar</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              onClick={() => setActiveTab('mentorships')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all ${
                activeTab === 'mentorships'
                  ? 'border-primary-500 shadow-md scale-105'
                  : 'border-gray-200 hover:shadow-md hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Mentorias</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.mentorships}</p>
                </div>
              </div>
            </div>
            <div
              onClick={() => setActiveTab('events')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all ${
                activeTab === 'events'
                  ? 'border-blue-500 shadow-md scale-105'
                  : 'border-gray-200 hover:shadow-md hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Eventos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.events}</p>
                </div>
              </div>
            </div>
            <div
              onClick={() => setActiveTab('jobs')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all ${
                activeTab === 'jobs'
                  ? 'border-green-500 shadow-md scale-105'
                  : 'border-gray-200 hover:shadow-md hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BriefcaseIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vagas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.jobs}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                {/* Mentorias */}
                {activeTab === 'mentorships' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">Mentorias Ativas</h2>
                    {mentorships.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <AcademicCapIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma mentoria encontrada</h3>
                        <p className="text-sm text-gray-500 mb-4">Você ainda não está inscrito em nenhuma mentoria.</p>
                        <Link
                          href="/mentorships"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Explorar Mentorias
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {mentorships.map((subscription) => (
                          <div
                            key={subscription.id}
                            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <Link
                                    href={`/mentorships/${subscription.mentorship.id}`}
                                    className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors"
                                  >
                                    {subscription.mentorship.title}
                                  </Link>
                                  {getStatusBadge(subscription.status, 'mentorship')}
                                </div>
                                {subscription.mentorship.mentor && (
                                  <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <span>Mentor: </span>
                                    <Link
                                      href={`/profiles/${subscription.mentorship.mentor.id}`}
                                      className="ml-1 text-primary-600 hover:text-primary-700"
                                    >
                                      {subscription.mentorship.mentor.firstName} {subscription.mentorship.mentor.lastName}
                                    </Link>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                  <span>Kz {Number(subscription.mentorship.price).toFixed(2)}</span>
                                  <span>{subscription.mentorship.duration} horas</span>
                                  <span className="flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    Inscrito em {new Date(subscription.createdAt).toLocaleDateString('pt-AO')}
                                  </span>
                                </div>
                              </div>
                              <Link
                                href={`/mentorships/${subscription.mentorship.id}`}
                                className="ml-4 text-primary-600 hover:text-primary-700"
                              >
                                <ArrowRightIcon className="h-5 w-5" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Eventos */}
                {activeTab === 'events' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">Eventos Inscritos</h2>
                    {events.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <CalendarIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento encontrado</h3>
                        <p className="text-sm text-gray-500 mb-4">Você ainda não está inscrito em nenhum evento.</p>
                        <Link
                          href="/events"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Explorar Eventos
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {events.map((registration) => (
                          <div
                            key={registration.id}
                            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <Link
                                    href={`/events/${registration.event.id}`}
                                    className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors"
                                  >
                                    {registration.event.title}
                                  </Link>
                                  {getStatusBadge(registration.status, 'event')}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                    {getEventTypeLabel(registration.event.type)}
                                  </span>
                                  {registration.event.price !== undefined && registration.event.price > 0 && (
                                    <span>Kz {Number(registration.event.price).toFixed(2)}</span>
                                  )}
                                  {registration.event.price === 0 && <span>Gratuito</span>}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                    {new Date(registration.event.eventDate).toLocaleDateString('pt-AO', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  <span className="flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    Inscrito em {new Date(registration.createdAt).toLocaleDateString('pt-AO')}
                                  </span>
                                </div>
                              </div>
                              <Link
                                href={`/events/${registration.event.id}`}
                                className="ml-4 text-primary-600 hover:text-primary-700"
                              >
                                <ArrowRightIcon className="h-5 w-5" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Vagas */}
                {activeTab === 'jobs' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-6 text-gray-900">Vagas Aplicadas</h2>
                    {jobs.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <BriefcaseIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma vaga encontrada</h3>
                        <p className="text-sm text-gray-500 mb-4">Você ainda não se candidatou a nenhuma vaga.</p>
                        <Link
                          href="/jobs"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Explorar Vagas
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobs.map((application) => (
                          <div
                            key={application.id}
                            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <Link
                                    href={`/jobs/${application.job.id}`}
                                    className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors"
                                  >
                                    {application.job.title}
                                  </Link>
                                  {getStatusBadge(application.status, 'job')}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                                  <span className="font-medium">{application.job.company}</span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                                    {getJobTypeLabel(application.job.type)}
                                  </span>
                                  {application.job.location && <span>{application.job.location}</span>}
                                  {application.job.status !== 'OPEN' && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                      {application.job.status === 'CLOSED' ? 'Fechada' : 'Pausada'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  Candidatou-se em {new Date(application.createdAt).toLocaleDateString('pt-AO')}
                                </div>
                                {application.coverLetter && (
                                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Carta de Apresentação:</p>
                                    <p className="text-sm text-gray-600 line-clamp-2">{application.coverLetter}</p>
                                  </div>
                                )}
                              </div>
                              <Link
                                href={`/jobs/${application.job.id}`}
                                className="ml-4 text-primary-600 hover:text-primary-700"
                              >
                                <ArrowRightIcon className="h-5 w-5" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

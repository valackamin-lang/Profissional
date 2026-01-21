'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../lib/api';
import {
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  StarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Profile {
  id: string;
  type: 'STUDENT' | 'PROFESSIONAL' | 'MENTOR' | 'COMPANY';
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  resume?: string;
  portfolio?: string;
  companyName?: string;
  companyDocument?: string;
  companyLogo?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  user?: {
    id: string;
    email: string;
  };
  createdAt: string;
}

interface MentorStats {
  totalMentorships: number;
  activeMentorships: number;
  totalStudents: number;
  totalCapacity: number;
  occupancyRate: number;
  avgPrice: number;
  ranking: string;
  rankingScore: number;
}

interface Mentorship {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  maxStudents?: number;
  currentStudents?: number;
  createdAt: string;
}

export default function ProfileViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      loadProfile();
    }
  }, [params.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, mentorshipsRes] = await Promise.all([
        api.get(`/profiles/${params.id}`),
        api.get(`/mentorships?mentorId=${params.id}&limit=100`).catch(() => ({ data: { data: { mentorships: [] } } })),
      ]);
      
      setProfile(profileRes.data.data.profile);
      setMentorships(mentorshipsRes.data.data.mentorships || []);

      // Load stats if mentor
      if (profileRes.data.data.profile.type === 'MENTOR') {
        try {
          const statsRes = await api.get(`/profiles/${params.id}/stats`);
          setStats(statsRes.data.data.stats);
        } catch (err) {
          console.error('Error loading stats:', err);
        }
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.response?.data?.error?.message || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getProfileTypeLabel = (type: string) => {
    switch (type) {
      case 'STUDENT':
        return 'Estudante';
      case 'PROFESSIONAL':
        return 'Profissional';
      case 'MENTOR':
        return 'Mentor';
      case 'COMPANY':
        return 'Empresa Parceira';
      default:
        return type;
    }
  };

  const getProfileIcon = (type: string) => {
    switch (type) {
      case 'MENTOR':
        return <AcademicCapIcon className="h-6 w-6" />;
      case 'COMPANY':
        return <BuildingOfficeIcon className="h-6 w-6" />;
      default:
        return <UserIcon className="h-6 w-6" />;
    }
  };

  const getRankingColor = (ranking: string) => {
    switch (ranking) {
      case 'Expert':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Avançado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Intermediário':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRankingStars = (ranking: string) => {
    const stars = {
      'Expert': 5,
      'Avançado': 4,
      'Intermediário': 3,
      'Iniciante': 2,
    };
    return stars[ranking as keyof typeof stars] || 2;
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

  if (error || !profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">{error || 'Perfil não encontrado'}</p>
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

  const isMentor = profile.type === 'MENTOR';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 font-medium transition-colors"
          >
            ← Voltar
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header do Perfil */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-8 py-12 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                  <div className="relative flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.firstName || 'Avatar'}
                        className="h-32 w-32 rounded-full border-4 border-white shadow-xl object-cover ring-4 ring-white/50"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-xl flex items-center justify-center ring-4 ring-white/50">
                        <div className="text-primary-600 scale-150">
                          {getProfileIcon(profile.type)}
                        </div>
                      </div>
                    )}
                    <div className="flex-1 text-white text-center sm:text-left">
                      <h1 className="text-4xl font-bold mb-2">
                        {profile.companyName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Sem nome'}
                      </h1>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                        <span className="inline-flex items-center px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/30">
                          {getProfileTypeLabel(profile.type)}
                        </span>
                        {profile.user?.email && (
                          <div className="flex items-center text-sm bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                            <EnvelopeIcon className="h-4 w-4 mr-2" />
                            {profile.user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conteúdo do Perfil */}
                <div className="p-8 space-y-8">
                  {profile.bio && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <UserIcon className="h-6 w-6 mr-2 text-primary-600" />
                        Sobre
                      </h2>
                      <p className="text-gray-700 leading-relaxed text-lg">{profile.bio}</p>
                    </div>
                  )}

                  {profile.type === 'COMPANY' && (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">Informações da Empresa</h2>
                      <div className="space-y-2">
                        {profile.companyName && (
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-gray-700">{profile.companyName}</span>
                          </div>
                        )}
                        {profile.companyDocument && (
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-gray-700">NIF: {profile.companyDocument}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(profile.resume || profile.portfolio) && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <DocumentTextIcon className="h-6 w-6 mr-2 text-primary-600" />
                        Documentos e Portfólio
                      </h2>
                      <div className="flex flex-wrap gap-4">
                        {profile.resume && (
                          <a
                            href={`http://localhost:3001${profile.resume}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-medium transition-colors border border-primary-200"
                          >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Ver Currículo
                          </a>
                        )}
                        {profile.portfolio && (
                          <a
                            href={`http://localhost:3001${profile.portfolio}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors border border-indigo-200"
                          >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Ver Portfólio
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mentorias do Mentor */}
                  {isMentor && mentorships.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <AcademicCapIcon className="h-6 w-6 mr-2 text-primary-600" />
                        Mentorias ({mentorships.length})
                      </h2>
                      <div className="grid grid-cols-1 gap-4">
                        {mentorships.map((mentorship) => (
                          <Link
                            key={mentorship.id}
                            href={`/mentorships/${mentorship.id}`}
                            className="block bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border-2 border-gray-200 hover:border-primary-300"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{mentorship.title}</h3>
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                  {mentorship.description}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary-100 text-primary-800">
                                    <CurrencyDollarIcon className="h-4 w-4 mr-1.5" />
                                    Kz {typeof mentorship.price === 'number' ? mentorship.price.toFixed(2) : parseFloat(mentorship.price || '0').toFixed(2)}
                                  </span>
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700">
                                    <ClockIcon className="h-4 w-4 mr-1.5" />
                                    {mentorship.duration}h
                                  </span>
                                  {mentorship.maxStudents && (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800">
                                      <UserGroupIcon className="h-4 w-4 mr-1.5" />
                                      {mentorship.currentStudents || 0}/{mentorship.maxStudents}
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${
                                    mentorship.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                    mentorship.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {mentorship.status === 'ACTIVE' ? 'Ativa' :
                                     mentorship.status === 'INACTIVE' ? 'Inativa' : 'Suspensa'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-AO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar com Estatísticas (apenas para mentores) */}
            {isMentor && stats && (
              <div className="space-y-6">
                {/* Ranking Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking</h3>
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 mb-3 ${getRankingColor(stats.ranking)}`}>
                      <span className="text-2xl font-bold">{stats.ranking}</span>
                    </div>
                    <div className="flex justify-center space-x-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        i < getRankingStars(stats.ranking) ? (
                          <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                        ) : (
                          <StarIcon key={i} className="h-5 w-5 text-gray-300" />
                        )
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Pontuação: {stats.rankingScore}</p>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        <span className="text-sm text-gray-600">Total de Mentorias</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">{stats.totalMentorships}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-gray-600">Mentorias Ativas</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">{stats.activeMentorships}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Total de Estudantes</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">{stats.totalStudents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="text-sm text-gray-600">Taxa de Ocupação</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">{stats.occupancyRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-gray-600">Preço Médio</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">Kz {stats.avgPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

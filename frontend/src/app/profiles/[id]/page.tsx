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
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { PostCard } from '../../../components/PostCard';
import { Post } from '../../../types';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

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
      
      const profileData = profileRes.data.data.profile;
      setProfile(profileData);
      setMentorships(mentorshipsRes.data.data.mentorships || []);

      // Usar contadores do backend se disponíveis
      if (profileData.followersCount !== undefined) {
        setFollowersCount(profileData.followersCount);
      }
      if (profileData.followingCount !== undefined) {
        setFollowingCount(profileData.followingCount);
      }
      if (profileData.isFollowing !== undefined) {
        setIsFollowing(profileData.isFollowing);
      }

      // Load stats if mentor
      if (profileData.type === 'MENTOR') {
        try {
          const statsRes = await api.get(`/profiles/${params.id}/stats`);
          setStats(statsRes.data.data.stats);
        } catch (err) {
          console.error('Error loading stats:', err);
        }
      }

      // Load posts do perfil
      loadPosts(profileData.id);
      
      // Carregar contadores separadamente se não vieram do backend
      if (user?.profile?.id && (profileData.followersCount === undefined || profileData.followingCount === undefined)) {
        loadFollowCounts(profileData.id);
      }
      if (user?.profile?.id && profileData.isFollowing === undefined) {
        loadFollowStatus(profileData.id);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.response?.data?.error?.message || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadFollowStatus = async (profileId: string) => {
    try {
      const response = await api.get(`/follow/${profileId}/check`);
      setIsFollowing(response.data.data.isFollowing);
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  };

  const loadFollowCounts = async (profileId: string) => {
    try {
      const response = await api.get(`/follow/${profileId}/counts`);
      setFollowersCount(response.data.data.followersCount);
      setFollowingCount(response.data.data.followingCount);
    } catch (error) {
      console.error('Error loading follow counts:', error);
    }
  };

  const handleFollow = async () => {
    if (!profile || !user?.profile?.id || user.profile.id === profile.id) return;
    
    try {
      setIsFollowingLoading(true);
      if (isFollowing) {
        await api.delete(`/follow/${profile.id}`);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await api.post(`/follow/${profile.id}`);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      alert(error.response?.data?.error?.message || 'Erro ao seguir/deixar de seguir');
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const loadPosts = async (profileId: string) => {
    try {
      const response = await api.get(`/posts?authorId=${profileId}&limit=20`);
      setPosts(response.data.data.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
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

  const handleStartChat = async () => {
    if (!user || !profile) return;
    
    // Verificar se não é o próprio perfil
    if (user.profile?.id === profile.id) {
      return;
    }

    try {
      setStartingChat(true);
      const response = await api.get(`/chat/with/${profile.id}`);
      const chat = response.data.data.chat;
      
      // Redirecionar para o chat com o chat selecionado
      router.push(`/chat?chatId=${chat.id}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert(error.response?.data?.error?.message || 'Erro ao iniciar conversa');
    } finally {
      setStartingChat(false);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-primary-600 font-medium transition-colors group"
            >
              <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header do Perfil - Redesenhado */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden transform transition-all hover:shadow-2xl">
                {/* Banner com gradiente animado */}
                <div className="relative h-48 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
                  
                  {/* Avatar flutuante */}
                  <div className="absolute -bottom-16 left-8 transform transition-transform hover:scale-105">
                    {profile.avatar ? (
                      <div className="relative">
                        <img
                          src={profile.avatar}
                          alt={profile.firstName || 'Avatar'}
                          className="h-32 w-32 rounded-2xl border-4 border-white shadow-2xl object-cover ring-4 ring-primary-100"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    ) : (
                      <div className="h-32 w-32 rounded-2xl border-4 border-white bg-gradient-to-br from-primary-400 to-primary-600 shadow-2xl flex items-center justify-center ring-4 ring-primary-100">
                        <div className="text-white scale-150">
                          {getProfileIcon(profile.type)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conteúdo do Header */}
                <div className="pt-20 px-8 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2 group">
                        {profile.companyName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Sem nome'}
                      </h1>
                      
                      {/* Badges e Info */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-sm font-semibold border border-primary-200 shadow-sm">
                          {getProfileTypeLabel(profile.type)}
                        </span>
                        {profile.user?.email && (
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                            <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {profile.user.email}
                          </div>
                        )}
                      </div>

                      {/* Contadores de Seguidores/Seguindo */}
                      {user && (
                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => router.push(`/profiles/${profile.id}/followers`)}
                            className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all group"
                          >
                            <span className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">{followersCount}</span>
                            <span className="text-sm text-gray-600">seguidores</span>
                          </button>
                          <button
                            onClick={() => router.push(`/profiles/${profile.id}/following`)}
                            className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all group"
                          >
                            <span className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">{followingCount}</span>
                            <span className="text-sm text-gray-600">seguindo</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    {user && user.profile?.id !== profile.id && (
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={handleFollow}
                          disabled={isFollowingLoading}
                          className={`inline-flex items-center px-5 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 active:scale-95 ${
                            isFollowing
                              ? 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                              : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                          }`}
                        >
                          {isFollowingLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                              Carregando...
                            </>
                          ) : isFollowing ? (
                            <>
                              <UserGroupIcon className="h-5 w-5 mr-2" />
                              Seguindo
                            </>
                          ) : (
                            <>
                              <UserGroupIcon className="h-5 w-5 mr-2" />
                              Seguir
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleStartChat}
                          disabled={startingChat}
                          className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2 border-primary-200 transform hover:scale-105 active:scale-95"
                        >
                          <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                          {startingChat ? 'Iniciando...' : 'Conversar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conteúdo do Perfil */}
                <div className="px-8 pb-8 space-y-8">
                  {profile.bio && (
                    <div className="pt-6 border-t border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center mr-3">
                          <UserIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        Sobre
                      </h2>
                      <p className="text-gray-700 leading-relaxed text-base pl-13">{profile.bio}</p>
                    </div>
                  )}

                  {profile.type === 'COMPANY' && (
                    <div className="pt-6 border-t border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                          <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        Informações da Empresa
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-13">
                        {profile.companyName && (
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Nome</p>
                              <p className="text-gray-900 font-medium">{profile.companyName}</p>
                            </div>
                          </div>
                        )}
                        {profile.companyDocument && (
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">NIF</p>
                              <p className="text-gray-900 font-medium">{profile.companyDocument}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(profile.resume || profile.portfolio) && (
                    <div className="pt-6 border-t border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                          <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        Documentos e Portfólio
                      </h2>
                      <div className="flex flex-wrap gap-3 pl-13">
                        {profile.resume && (
                          <a
                            href={`http://localhost:3001${profile.resume}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 text-primary-700 rounded-xl font-semibold transition-all border-2 border-primary-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
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
                            className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 rounded-xl font-semibold transition-all border-2 border-indigo-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                          >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Ver Portfólio
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Postagens do Perfil */}
                  {profile.type !== 'COMPANY' && (
                    <div className="pt-6 border-t border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                          <DocumentTextIcon className="h-5 w-5 text-green-600" />
                        </div>
                        Publicações
                        {posts.length > 0 && (
                          <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {posts.length}
                          </span>
                        )}
                      </h2>
                      {posts.length > 0 ? (
                        <div className="space-y-4 pl-13">
                          {posts.map((post) => (
                            <PostCard 
                              key={post.id} 
                              post={post} 
                              onUpdate={() => profile && loadPosts(profile.id)} 
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="pl-13 text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Nenhuma publicação ainda</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mentorias do Mentor */}
                  {isMentor && (
                    <div className="pt-6 border-t border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                          <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        Mentorias
                        {mentorships.length > 0 && (
                          <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                            {mentorships.length}
                          </span>
                        )}
                      </h2>
                      {mentorships.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 pl-13">
                          {mentorships.map((mentorship) => (
                            <Link
                              key={mentorship.id}
                              href={`/mentorships/${mentorship.id}`}
                              className="group block bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-6 hover:shadow-xl transition-all border-2 border-gray-200 hover:border-primary-300 transform hover:-translate-y-1"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{mentorship.title}</h3>
                                  <p className="text-gray-600 mb-4 line-clamp-2">
                                    {mentorship.description}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-primary-100 to-primary-50 text-primary-800 border border-primary-200">
                                      <CurrencyDollarIcon className="h-4 w-4 mr-1.5" />
                                      Kz {typeof mentorship.price === 'number' ? mentorship.price.toFixed(2) : parseFloat(mentorship.price || '0').toFixed(2)}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                      <ClockIcon className="h-4 w-4 mr-1.5" />
                                      {mentorship.duration}h
                                    </span>
                                    {mentorship.maxStudents && (
                                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                        <UserGroupIcon className="h-4 w-4 mr-1.5" />
                                        {mentorship.currentStudents || 0}/{mentorship.maxStudents}
                                      </span>
                                    )}
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                                      mentorship.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' :
                                      mentorship.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                      'bg-red-100 text-red-800 border-red-200'
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
                      ) : (
                        <div className="pl-13 text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <AcademicCapIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Nenhuma mentoria disponível</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500 pl-13">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-AO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Estatísticas Gerais - Sempre visível */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transform transition-all hover:shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center mr-2">
                    <ChartBarIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  Estatísticas
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Publicações</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{posts.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                        <UserGroupIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Seguidores</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{followersCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                        <UserGroupIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Seguindo</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{followingCount}</span>
                  </div>
                  {isMentor && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                          <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Mentorias</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{mentorships.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Contato */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transform transition-all hover:shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center mr-2">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  Contato
                </h3>
                <div className="space-y-3">
                  {profile.user?.email && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Email</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{profile.user.email}</p>
                      </div>
                    </div>
                  )}
                  {profile.type === 'COMPANY' && profile.companyName && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Empresa</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{profile.companyName}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Membro desde</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(profile.createdAt).toLocaleDateString('pt-AO', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Links Rápidos */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transform transition-all hover:shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center mr-2">
                    <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  Links Rápidos
                </h3>
                <div className="space-y-2">
                  {profile.resume && (
                    <a
                      href={`http://localhost:3001${profile.resume}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl font-medium transition-all border border-primary-200 group"
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-3 text-primary-600 group-hover:scale-110 transition-transform" />
                      <span>Ver Currículo</span>
                    </a>
                  )}
                  {profile.portfolio && (
                    <a
                      href={`http://localhost:3001${profile.portfolio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium transition-all border border-indigo-200 group"
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-3 text-indigo-600 group-hover:scale-110 transition-transform" />
                      <span>Ver Portfólio</span>
                    </a>
                  )}
                  {user && user.profile?.id !== profile.id && (
                    <button
                      onClick={() => router.push(`/profiles/${profile.id}/followers`)}
                      className="w-full flex items-center p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium transition-all border border-gray-200 group"
                    >
                      <UserGroupIcon className="h-5 w-5 mr-3 text-gray-600 group-hover:scale-110 transition-transform" />
                      <span>Ver Seguidores</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ranking Card - Apenas para mentores */}
              {isMentor && stats && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transform transition-all hover:shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                    <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center mr-2">
                      <StarIconSolid className="h-5 w-5 text-yellow-600" />
                    </div>
                    Ranking
                  </h3>
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center px-6 py-3 rounded-2xl border-2 mb-4 shadow-sm ${getRankingColor(stats.ranking)}`}>
                      <span className="text-3xl font-bold">{stats.ranking}</span>
                    </div>
                    <div className="flex justify-center space-x-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        i < getRankingStars(stats.ranking) ? (
                          <StarIconSolid key={i} className="h-6 w-6 text-yellow-400" />
                        ) : (
                          <StarIcon key={i} className="h-6 w-6 text-gray-300" />
                        )
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Pontuação: <span className="text-primary-600">{stats.rankingScore}</span></p>
                  </div>
                </div>
              )}

              {/* Estatísticas Detalhadas - Apenas para mentores */}
              {isMentor && stats && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transform transition-all hover:shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                    <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center mr-2">
                      <ChartBarIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    Estatísticas de Mentor
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                          <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Total de Mentorias</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{stats.totalMentorships}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                          <ChartBarIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Mentorias Ativas</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{stats.activeMentorships}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                          <UserGroupIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Total de Estudantes</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{stats.totalStudents}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                          <ChartBarIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Taxa de Ocupação</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{stats.occupancyRate}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
                          <CurrencyDollarIcon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Preço Médio</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">Kz {typeof stats.avgPrice === 'number' ? stats.avgPrice.toFixed(2) : parseFloat(String(stats.avgPrice || '0')).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

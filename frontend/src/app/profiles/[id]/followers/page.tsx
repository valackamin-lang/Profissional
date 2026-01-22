'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { Header } from '../../../../components/Header';
import api from '../../../../lib/api';
import { UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Profile {
  id: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  avatar?: string;
  companyLogo?: string;
  type: string;
  user?: {
    id: string;
    email: string;
  };
}

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      loadFollowers();
    }
  }, [params.id]);

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/follow/${params.id}/followers?limit=100`);
      setFollowers(response.data.data.followers || []);
    } catch (error: any) {
      console.error('Error loading followers:', error);
      setError(error.response?.data?.error?.message || 'Erro ao carregar seguidores');
    } finally {
      setLoading(false);
    }
  };

  const getProfileName = (profile: Profile) => {
    return profile.companyName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.user?.email || 'Usuário';
  };

  const getProfileAvatar = (profile: Profile) => {
    return profile.avatar || profile.companyLogo || null;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Voltar
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
              <h1 className="text-3xl font-bold text-white">Seguidores</h1>
              <p className="text-primary-100 mt-2">{followers.length} seguidores</p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : followers.length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum seguidor ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followers.map((follower) => (
                    <Link
                      key={follower.id}
                      href={`/profiles/${follower.id}`}
                      className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      {getProfileAvatar(follower) ? (
                        <img
                          src={getProfileAvatar(follower)!}
                          alt={getProfileName(follower)}
                          className="h-14 w-14 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-2 border-gray-200">
                          <span className="text-white font-semibold text-lg">
                            {getProfileName(follower)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{getProfileName(follower)}</h3>
                        {follower.user?.email && (
                          <p className="text-sm text-gray-500">{follower.user.email}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

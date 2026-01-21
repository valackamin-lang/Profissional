'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Header } from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface Profile {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    companyName: '',
    companyDocument: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profiles/me');
      const profileData = response.data.data.profile;
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        bio: profileData.bio || '',
        companyName: profileData.companyName || '',
        companyDocument: profileData.companyDocument || '',
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('bio', formData.bio);
      
      if (profile?.type === 'COMPANY') {
        formDataToSend.append('companyName', formData.companyName);
        formDataToSend.append('companyDocument', formData.companyDocument);
      }

      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }
      if (resumeFile) {
        formDataToSend.append('resume', resumeFile);
      }
      if (portfolioFile) {
        formDataToSend.append('portfolio', portfolioFile);
      }
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const response = await api.put(`/profiles/${profile?.id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfile(response.data.data.profile);
      setEditing(false);
      setAvatarFile(null);
      setResumeFile(null);
      setPortfolioFile(null);
      setLogoFile(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error?.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
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

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Criar Perfil</h2>
              <p className="text-gray-600 mb-4">
                Você ainda não tem um perfil. Crie um para começar.
              </p>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Criar Perfil
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Meu Perfil</h1>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            {!editing ? (
              <div className="p-6">
                <div className="flex items-start space-x-6 mb-6">
                  {profile.avatar && (
                    <img
                      src={`http://localhost:3001${profile.avatar}`}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">
                      {profile.firstName} {profile.lastName}
                      {profile.type === 'COMPANY' && profile.companyName && ` - ${profile.companyName}`}
                    </h2>
                    <p className="text-gray-600 mt-1">{user?.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                      {profile.type}
                    </span>
                    {profile.approvalStatus === 'PENDING' && (
                      <span className="ml-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        Aguardando Aprovação
                      </span>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Sobre</h3>
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}

                {profile.type === 'COMPANY' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Informações da Empresa</h3>
                    <div className="space-y-2">
                      {profile.companyName && (
                        <p><span className="font-medium">Nome:</span> {profile.companyName}</p>
                      )}
                      {profile.companyDocument && (
                        <p><span className="font-medium">Documento:</span> {profile.companyDocument}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {profile.resume && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Currículo</h3>
                      <a
                        href={`http://localhost:3001${profile.resume}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        Ver Currículo
                      </a>
                    </div>
                  )}
                  {profile.portfolio && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Portfólio</h3>
                      <a
                        href={`http://localhost:3001${profile.portfolio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        Ver Portfólio
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primeiro Nome
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Último Nome
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {profile.type === 'COMPANY' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIF (Número de Identificação Fiscal)
                      </label>
                      <input
                        type="text"
                        value={formData.companyDocument}
                        onChange={(e) => setFormData({ ...formData, companyDocument: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biografia
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avatar
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  {profile.type === 'STUDENT' || profile.type === 'PROFESSIONAL' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Currículo
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Portfólio
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.zip,.rar"
                          onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">PDF, ZIP ou RAR (máx. 10MB)</p>
                      </div>
                    </>
                  ) : null}
                  {profile.type === 'COMPANY' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logo da Empresa
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setError('');
                      loadProfile();
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

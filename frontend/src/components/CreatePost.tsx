'use client';

import { useState, useRef } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
  GlobeAltIcon,
  UserGroupIcon,
  LockClosedIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface CreatePostProps {
  onPostCreated?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'>('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + media.length > 10) {
      setError('Máximo de 10 arquivos permitidos');
      return;
    }

    const newMedia = [...media, ...files];
    setMedia(newMedia);
    setIsExpanded(true);

    // Criar previews
    const newPreviews: string[] = [];
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target?.result as string);
          setPreviews((prev) => [...prev, ...newPreviews]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        newPreviews.push(URL.createObjectURL(file));
        setPreviews((prev) => [...prev, ...newPreviews]);
      }
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    setCharCount(value.length);
    if (value.length > 0) {
      setIsExpanded(true);
    }
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setMedia(newMedia);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && media.length === 0) {
      setError('Adicione conteúdo ou mídia ao post');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('visibility', visibility);
      media.forEach((file) => {
        formData.append('media', file);
      });

      await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset form
      setContent('');
      setMedia([]);
      setPreviews([]);
      setCharCount(0);
      setVisibility('PUBLIC');
      setIsExpanded(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar post');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'PUBLIC':
        return <GlobeAltIcon className="h-4 w-4" />;
      case 'FOLLOWERS':
        return <UserGroupIcon className="h-4 w-4" />;
      case 'PRIVATE':
        return <LockClosedIcon className="h-4 w-4" />;
    }
  };

  const getVisibilityLabel = () => {
    switch (visibility) {
      case 'PUBLIC':
        return 'Público';
      case 'FOLLOWERS':
        return 'Seguidores';
      case 'PRIVATE':
        return 'Privado';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6 transform transition-all hover:shadow-xl">
      <form onSubmit={handleSubmit}>
        <div className="p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0">
              {user.profile?.avatar ? (
                <img
                  src={user.profile.avatar}
                  alt="Avatar"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-gray-200 ring-2 ring-primary-100"
                />
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-2 border-gray-200 ring-2 ring-primary-100">
                  <span className="text-white font-semibold text-sm sm:text-base">
                    {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onFocus={handleFocus}
                placeholder="O que você está pensando?"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all placeholder:text-gray-400 text-gray-900"
                rows={isExpanded ? 4 : 2}
                maxLength={5000}
              />
              {isExpanded && (
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{charCount}/5000 caracteres</span>
                  {charCount > 4500 && (
                    <span className="text-orange-500 font-medium">Limite próximo</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Media Previews */}
          {previews.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {previews.length} {previews.length === 1 ? 'arquivo' : 'arquivos'} selecionado{previews.length > 1 ? 's' : ''}
                </span>
                {media.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Adicionar mais
                  </button>
                )}
              </div>
              <div className={`grid gap-3 ${
                previews.length === 1 ? 'grid-cols-1' :
                previews.length === 2 ? 'grid-cols-2' :
                previews.length >= 3 ? 'grid-cols-2 sm:grid-cols-3' : ''
              }`}>
                {previews.map((preview, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary-300 transition-all">
                    {media[index]?.type.startsWith('image/') ? (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-40 sm:h-48 object-cover"
                      />
                    ) : (
                      <video
                        src={preview}
                        className="w-full h-40 sm:h-48 object-cover"
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                      title="Remover"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{media[index]?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2">
              <XMarkIcon className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div className={`border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 transition-all ${
          isExpanded || previews.length > 0 ? 'block' : 'block'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Ações de mídia e visibilidade */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 flex-1">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsExpanded(true);
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all border border-gray-200 hover:border-primary-300 group"
              >
                <PhotoIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Foto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsExpanded(true);
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all border border-gray-200 hover:border-primary-300 group"
              >
                <VideoCameraIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Vídeo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Seletor de visibilidade */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all border border-gray-200 hover:border-primary-300"
                >
                  {getVisibilityIcon()}
                  <span className="hidden sm:inline">{getVisibilityLabel()}</span>
                  <ChevronDownIcon className="h-4 w-4 hidden sm:block" />
                </button>
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => setVisibility('PUBLIC')}
                      className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        visibility === 'PUBLIC' ? 'text-primary-600 bg-primary-50' : 'text-gray-700'
                      }`}
                    >
                      <GlobeAltIcon className="h-4 w-4" />
                      <span>Público</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('FOLLOWERS')}
                      className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        visibility === 'FOLLOWERS' ? 'text-primary-600 bg-primary-50' : 'text-gray-700'
                      }`}
                    >
                      <UserGroupIcon className="h-4 w-4" />
                      <span>Seguidores</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('PRIVATE')}
                      className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        visibility === 'PRIVATE' ? 'text-primary-600 bg-primary-50' : 'text-gray-700'
                      }`}
                    >
                      <LockClosedIcon className="h-4 w-4" />
                      <span>Privado</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de publicar */}
            <button
              type="submit"
              disabled={loading || (!content.trim() && media.length === 0)}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-semibold transform hover:scale-105 active:scale-95 disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Publicando...</span>
                </span>
              ) : (
                'Publicar'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

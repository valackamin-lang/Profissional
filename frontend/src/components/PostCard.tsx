'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Post, PostComment } from '../types';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
} from '@heroicons/react/24/solid';

interface PostCardProps {
  post: Post;
  onUpdate?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [sharesCount, setSharesCount] = useState(post.sharesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editVisibility, setEditVisibility] = useState(post.visibility || 'PUBLIC');
  const [editMedia, setEditMedia] = useState<File[]>([]);
  const [editPreviews, setEditPreviews] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualizar dados do post periodicamente
  const updatePostData = useCallback(async () => {
    try {
      const response = await api.get(`/posts/${post.id}`);
      const updatedPost = response.data.data.post;
      setIsLiked(updatedPost.isLiked || false);
      setLikesCount(updatedPost.likesCount);
      setCommentsCount(updatedPost.commentsCount);
      setSharesCount(updatedPost.sharesCount);
    } catch (error) {
      console.error('Error updating post data:', error);
    }
  }, [post.id]);

  // Polling para atualização em tempo real
  useEffect(() => {
    // Atualizar a cada 10 segundos se o post estiver visível
    pollIntervalRef.current = setInterval(() => {
      updatePostData();
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [updatePostData]);

  // Sincronizar estado inicial quando post prop mudar
  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikesCount(post.likesCount);
    setCommentsCount(post.commentsCount);
    setSharesCount(post.sharesCount);
    setEditContent(post.content || '');
    setEditVisibility(post.visibility || 'PUBLIC');
  }, [post.isLiked, post.likesCount, post.commentsCount, post.sharesCount, post.content, post.visibility]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const isOwner = user?.profile?.id === post.authorId;

  const handleLike = async () => {
    if (isLiking) return; // Prevenir múltiplos cliques
    
    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;
    
    // Otimistic update
    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);
    
    try {
      const response = await api.post(`/posts/${post.id}/like`);
      setIsLiked(response.data.data.liked);
      setLikesCount(response.data.data.likesCount);
      
      // Atualizar outros dados também
      await updatePostData();
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      // Reverter em caso de erro
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }

    setLoadingComments(true);
    try {
      const response = await api.get(`/posts/${post.id}/comments`);
      setComments(response.data.data.comments);
      setShowComments(true);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPostingComment(true);
    try {
      const response = await api.post(`/posts/${post.id}/comments`, {
        content: commentText,
      });
      setComments([response.data.data.comment, ...comments]);
      setCommentText('');
      
      // Atualizar contador de comentários
      if (response.data.data.commentsCount !== undefined) {
        setCommentsCount(response.data.data.commentsCount);
      } else {
        setCommentsCount(prev => prev + 1);
      }
      
      // Atualizar dados do post
      await updatePostData();
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPostingComment(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(post.content || '');
    setEditVisibility(post.visibility || 'PUBLIC');
    setEditMedia([]);
    setEditPreviews([]);
    setMenuOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content || '');
    setEditVisibility(post.visibility || 'PUBLIC');
    setEditMedia([]);
    setEditPreviews([]);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() && editMedia.length === 0) {
      alert('Adicione conteúdo ou mídia ao post');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('content', editContent);
      formData.append('visibility', editVisibility);
      editMedia.forEach((file) => {
        formData.append('media', file);
      });

      await api.put(`/posts/${post.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsEditing(false);
      setEditMedia([]);
      setEditPreviews([]);
      
      if (onUpdate) {
        onUpdate();
      }
      
      // Recarregar dados do post
      await updatePostData();
    } catch (error: any) {
      console.error('Error updating post:', error);
      alert(error.response?.data?.error?.message || 'Erro ao atualizar post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/posts/${post.id}`);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.response?.data?.error?.message || 'Erro ao deletar post');
    } finally {
      setIsDeleting(false);
      setMenuOpen(false);
    }
  };

  const handleShare = async () => {
    try {
      await api.post(`/posts/${post.id}/share`);
      setSharesCount(prev => prev + 1);
      await updatePostData();
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error sharing post:', error);
      alert(error.response?.data?.error?.message || 'Erro ao compartilhar post');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + editMedia.length > 10) {
      alert('Máximo de 10 arquivos permitidos');
      return;
    }

    const newMedia = [...editMedia, ...files];
    setEditMedia(newMedia);

    // Criar previews
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setEditPreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        setEditPreviews((prev) => [...prev, URL.createObjectURL(file)]);
      }
    });
  };

  const removeEditMedia = (index: number) => {
    const newMedia = editMedia.filter((_, i) => i !== index);
    const newPreviews = editPreviews.filter((_, i) => i !== index);
    setEditMedia(newMedia);
    setEditPreviews(newPreviews);
  };

  const authorName = post.author?.companyName || 
    `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() ||
    post.author?.user?.email ||
    'Usuário';

  const authorAvatar = post.author?.avatar || post.author?.companyLogo;

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Link href={`/profiles/${post.authorId}`} className="flex items-center space-x-3">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {authorName[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{authorName}</p>
              <p className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleDateString('pt-AO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </Link>
          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Opções"
              >
                <EllipsisHorizontalIcon className="h-5 w-5 text-gray-600" />
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>{isDeleting ? 'Deletando...' : 'Deletar'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={4}
              placeholder="O que você está pensando?"
            />
            
            {/* Preview de nova mídia */}
            {editPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {editPreviews.map((preview, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border-2 border-gray-200">
                    {editMedia[index]?.type.startsWith('image/') ? (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <video
                        src={preview}
                        className="w-full h-32 object-cover"
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeEditMedia(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Mídia existente */}
            {post.media && post.media.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Mídia existente (será mantida):</p>
                <div className="grid grid-cols-2 gap-2">
                  {post.media.map((url, index) => {
                    const getMediaUrl = (path: string) => {
                      if (path.startsWith('http')) return path;
                      const apiUrl = typeof window !== 'undefined' 
                        ? (window as any).__API_URL__ || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                        : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                      return `${apiUrl}${path}`;
                    };
                    const mediaUrl = getMediaUrl(url);
                    const isVideo = url.match(/\.(mp4|webm|mov)$/i) || post.mediaType === 'video';
                    return (
                      <div key={index} className="relative">
                        {isVideo ? (
                          <video src={mediaUrl} className="w-full h-24 object-cover rounded-lg" controls />
                        ) : (
                          <img src={mediaUrl} alt={`Media ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all border border-gray-200"
                >
                  <PhotoIcon className="h-4 w-4" />
                  <span>Adicionar</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="PUBLIC">Público</option>
                  <option value="FOLLOWERS">Seguidores</option>
                  <option value="PRIVATE">Privado</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving || (!editContent.trim() && editMedia.length === 0)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-900 whitespace-pre-wrap mb-4">{post.content}</p>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className={`mb-4 ${
            post.media.length === 1 ? '' : 'grid grid-cols-2 gap-2'
          }`}>
            {post.media.map((url, index) => {
              // Construir URL completa se for relativa
              const getMediaUrl = (path: string) => {
                if (path.startsWith('http')) return path;
                const apiUrl = typeof window !== 'undefined' 
                  ? (window as any).__API_URL__ || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                return `${apiUrl}${path}`;
              };
              const mediaUrl = getMediaUrl(url);
              const isVideo = url.match(/\.(mp4|webm|mov)$/i) || post.mediaType === 'video';
              return (
                <div key={index} className="relative">
                  {isVideo ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full h-auto rounded-lg"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={`Post media ${index + 1}`}
                      className="w-full h-auto rounded-lg object-cover"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-2 transition-colors ${
              isLiking 
                ? 'opacity-50 cursor-not-allowed' 
                : isLiked 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-gray-600 hover:text-red-600'
            }`}
          >
            {isLiked ? (
              <HeartIconSolid className="h-6 w-6 text-red-600" />
            ) : (
              <HeartIcon className="h-6 w-6" />
            )}
            <span className="text-sm font-medium">{likesCount}</span>
          </button>
          <button
            onClick={loadComments}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ChatBubbleLeftIcon className="h-6 w-6" />
            <span className="text-sm font-medium">{commentsCount}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ShareIcon className="h-6 w-6" />
            <span className="text-sm font-medium">{sharesCount}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <form onSubmit={handleComment} className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="submit"
                  disabled={postingComment || !commentText.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {postingComment ? '...' : 'Comentar'}
                </button>
              </div>
            </form>

            {loadingComments ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {comment.author?.avatar ? (
                        <img
                          src={comment.author.avatar}
                          alt="Avatar"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 text-xs font-semibold">
                            {comment.author?.firstName?.[0] || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">
                          {comment.author?.companyName ||
                            `${comment.author?.firstName || ''} ${comment.author?.lastName || ''}`.trim() ||
                            'Usuário'}
                        </span>
                        <span className="text-gray-700 ml-2">{comment.content}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(comment.createdAt).toLocaleDateString('pt-AO', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-4">
                    Nenhum comentário ainda. Seja o primeiro!
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

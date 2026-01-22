'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Chat, Message } from '../types';
import { getSocket } from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';
import {
  PaperClipIcon,
  PhotoIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';

interface ChatWindowProps {
  chat: Chat;
  currentUserId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUserId: propCurrentUserId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousScrollHeight = useRef<number>(0);

  // Determinar o ID do usuário atual
  // Prioridade: 1. propCurrentUserId, 2. user.profile?.id, 3. calcular baseado no chat
  const getCurrentUserId = () => {
    // 1. Usar o prop se fornecido
    if (propCurrentUserId) return propCurrentUserId;
    
    // 2. Usar o profile do usuário autenticado
    if (user?.profile?.id) return user.profile.id;
    
    // 3. Calcular baseado no chat (se otherParticipant é participant1, então o usuário atual é participant2)
    if (chat.otherParticipant?.id) {
      if (chat.otherParticipant.id === chat.participant1Id) {
        return chat.participant2Id;
      }
      return chat.participant1Id;
    }
    
    return '';
  };
  
  const actualCurrentUserId = getCurrentUserId();
  
  // Debug para verificar
  useEffect(() => {
    console.log('🔍 ChatWindow Debug:', {
      propCurrentUserId,
      userProfileId: user?.profile?.id,
      actualCurrentUserId,
      participant1Id: chat.participant1Id,
      participant2Id: chat.participant2Id,
      otherParticipantId: chat.otherParticipant?.id,
      chatId: chat.id
    });
  }, [actualCurrentUserId, propCurrentUserId, user, chat]);

  useEffect(() => {
    // Resetar estado ao mudar de chat
    setMessages([]);
    setPage(1);
    setHasMore(true);
    loadMessages(true, 1);
    joinChatRoom();
    setupSocketListeners();

    return () => {
      leaveChatRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id]);

  useEffect(() => {
    // Scroll para baixo apenas se for mensagem nova (não ao carregar mais antigas)
    if (!loadingMore) {
      scrollToBottom();
    } else {
      // Restaurar posição do scroll ao carregar mensagens antigas
      const container = messagesContainerRef.current;
      if (container && previousScrollHeight.current > 0) {
        const scrollDifference = container.scrollHeight - previousScrollHeight.current;
        container.scrollTop = scrollDifference;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Detectar scroll para cima e carregar mais mensagens
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Se estiver próximo do topo (50px) e houver mais mensagens
      if (container.scrollTop <= 50 && hasMore && !loadingMore && !loading) {
        loadMessages(false, page + 1);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, loading, page]);

  const loadMessages = async (isInitial = false, pageNum = 1) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await api.get(`/chat/${chat.id}/messages?page=${pageNum}&limit=50`);
      const newMessages = response.data.data.messages || [];
      const pagination = response.data.data.pagination;
      
      if (isInitial) {
        setMessages(newMessages);
      } else {
        // Preservar scroll position ao carregar mensagens antigas
        const container = messagesContainerRef.current;
        if (container) {
          previousScrollHeight.current = container.scrollHeight;
        }
        setMessages((prev) => [...newMessages, ...prev]);
      }
      
      setHasMore(pagination.page < pagination.pages);
      setPage(pageNum);
      
      // Marcar como lidas apenas no carregamento inicial
      if (isInitial) {
        await api.put(`/chat/${chat.id}/read`);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const joinChatRoom = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('chat:join', chat.id);
    }
  };

  const leaveChatRoom = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('chat:leave', chat.id);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (message.chatId === chat.id) {
        setMessages((prev) => [...prev, message]);
        // Marcar como lida se for do outro usuário
        if (message.senderId !== actualCurrentUserId) {
          api.put(`/chat/${chat.id}/read`).catch(console.error);
        }
      }
    };

    const handleMessageDeleted = (data: { messageId: string; chatId: string }) => {
      if (data.chatId === chat.id) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    };

    const handleUserOnline = (data: { userId: string; profileId: string }) => {
      if (data.profileId === chat.otherParticipant?.id) {
        setIsOnline(true);
      }
    };

    const handleUserOffline = (data: { userId: string; profileId: string }) => {
      if (data.profileId === chat.otherParticipant?.id) {
        setIsOnline(false);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('content', messageText);
      if (selectedFile) {
        formData.append('chatMedia', selectedFile);
      }

      await api.post(`/chat/${chat.id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessageText('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getParticipantName = () => {
    const participant = chat.otherParticipant;
    if (!participant) return 'Usuário';
    
    return participant.companyName || 
      `${participant.firstName || ''} ${participant.lastName || ''}`.trim() ||
      participant.user?.email ||
      'Usuário';
  };

  const getParticipantAvatar = () => {
    return chat.otherParticipant?.avatar || 
      chat.otherParticipant?.companyLogo ||
      null;
  };

  const isMyMessage = (message: Message) => {
    const result = message.senderId === actualCurrentUserId;
    
    // Debug para primeira mensagem
    if (messages.length > 0 && messages[0].id === message.id) {
      console.log('🔍 isMyMessage Debug:', {
        messageSenderId: message.senderId,
        propCurrentUserId,
        userProfileId: user?.profile?.id,
        actualCurrentUserId,
        isMyMessage: result,
        participant1Id: chat.participant1Id,
        participant2Id: chat.participant2Id,
        otherParticipantId: chat.otherParticipant?.id,
        messageContent: message.content?.substring(0, 20)
      });
    }
    
    return result;
  };

  const getMediaUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${apiUrl}${url}`;
  };

  const formatTimestamp = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    if (messageDay.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString('pt-AO', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (messageDay.getTime() === yesterday.getTime()) {
      return `Ontem ${messageDate.toLocaleTimeString('pt-AO', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else {
      return messageDate.toLocaleDateString('pt-AO', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const shouldShowAvatar = (message: Message, index: number) => {
    if (isMyMessage(message)) return false;
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    if (prevMessage.senderId !== message.senderId) return true;
    const timeDiff = new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime();
    return timeDiff > 300000; // 5 minutos
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {getParticipantAvatar() ? (
              <img
                src={getParticipantAvatar()!}
                alt={getParticipantName()}
                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-2 border-white shadow-md">
                <span className="text-white font-semibold text-lg">
                  {getParticipantName()[0].toUpperCase()}
                </span>
              </div>
            )}
            {isOnline && (
              <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{getParticipantName()}</p>
            <p className="text-xs text-gray-500">
              {isOnline ? (
                <span className="flex items-center">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                  Online
                </span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gradient-to-b from-gray-50 to-white"
        style={{ 
          scrollBehavior: 'smooth',
          minHeight: 0,
          maxHeight: '100%'
        }}
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <span className="text-sm">Carregando mensagens antigas...</span>
            </div>
          </div>
        )}
        {messages.map((message, index) => {
          const myMessage = isMyMessage(message);
          const showAvatar = shouldShowAvatar(message, index);
          const isGrouped = index > 0 && messages[index - 1].senderId === message.senderId && 
            new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() < 300000;

          return (
            <div
              key={message.id}
              className={`flex w-full ${myMessage ? 'justify-end items-end' : 'justify-start items-start'} group animate-[fadeIn_0.3s_ease-in-out] mb-2`}
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
            >
              {/* Mensagem do Receptor (Esquerda) */}
              {!myMessage && (
                <div className="flex items-end space-x-2 max-w-[75%] lg:max-w-[60%]">
                  {/* Avatar */}
                  <div className="flex-shrink-0 self-end mb-1">
                    {showAvatar ? (
                      <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-gray-100">
                        {getParticipantAvatar() ? (
                          <img
                            src={getParticipantAvatar()!}
                            alt={getParticipantName()}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {getParticipantName()[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-9 w-9"></div>
                    )}
                  </div>
                  
                  {/* Balao de Mensagem */}
                  <div className="flex flex-col items-start">
                    {!isGrouped && (
                      <p className="text-xs text-gray-500 mb-1 px-2 font-medium">{getParticipantName()}</p>
                    )}
                    <div
                      className={`relative px-4 py-2.5 shadow-md transition-all duration-200 ${
                        isGrouped ? 'mt-0.5 rounded-2xl' : 'mt-1 rounded-2xl rounded-tl-sm'
                      } bg-white text-gray-900 border border-gray-200`}
                    >
                      {/* Seta esquerda (cauda do balão) */}
                      {!isGrouped && (
                        <div className="absolute -left-2 bottom-0 w-0 h-0">
                          <div className="absolute bottom-0 left-0 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-white border-b-[8px] border-b-transparent"></div>
                          <div className="absolute bottom-[1px] left-0 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-gray-200 border-b-[8px] border-b-transparent"></div>
                        </div>
                      )}
                      
                      {message.type === 'image' && message.mediaUrl && (
                        <img
                          src={getMediaUrl(message.mediaUrl)}
                          alt="Mensagem"
                          className="rounded-xl mb-2 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => message.mediaUrl && window.open(getMediaUrl(message.mediaUrl), '_blank')}
                        />
                      )}
                      {message.type === 'file' && message.mediaUrl && (
                        <a
                          href={getMediaUrl(message.mediaUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors mb-2"
                        >
                          <PaperClipIcon className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">{message.fileName || 'Arquivo'}</span>
                        </a>
                      )}
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-gray-800">{message.content}</p>
                      )}
                      <div className="flex items-center justify-start space-x-1 mt-1.5">
                        <span className="text-xs text-gray-500">{formatTimestamp(message.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagem do Emissor (Direita) */}
              {myMessage && (
                <div className="flex items-end justify-end max-w-[75%] lg:max-w-[60%] ml-auto">
                  {/* Balao de Mensagem */}
                  <div className="flex flex-col items-end">
                    <div
                      className={`relative px-4 py-2.5 shadow-lg transition-all duration-200 ${
                        isGrouped ? 'mt-0.5 rounded-2xl' : 'mt-1 rounded-2xl rounded-tr-sm'
                      } bg-gradient-to-br from-primary-600 to-primary-700 text-white`}
                    >
                      {/* Seta direita (cauda do balão) */}
                      {!isGrouped && (
                        <div className="absolute -right-2 bottom-0 w-0 h-0">
                          <div className="absolute bottom-0 right-0 w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-primary-600 border-b-[8px] border-b-transparent"></div>
                        </div>
                      )}
                      
                      {message.type === 'image' && message.mediaUrl && (
                        <img
                          src={getMediaUrl(message.mediaUrl)}
                          alt="Mensagem"
                          className="rounded-xl mb-2 max-w-full cursor-pointer hover:opacity-90 transition-opacity brightness-110"
                          onClick={() => message.mediaUrl && window.open(getMediaUrl(message.mediaUrl), '_blank')}
                        />
                      )}
                      {message.type === 'file' && message.mediaUrl && (
                        <a
                          href={getMediaUrl(message.mediaUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors mb-2"
                        >
                          <PaperClipIcon className="h-5 w-5 text-white" />
                          <span className="text-sm font-medium text-white">{message.fileName || 'Arquivo'}</span>
                        </a>
                      )}
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-white">{message.content}</p>
                      )}
                      <div className="flex items-center justify-end space-x-1 mt-1.5">
                        <span className="text-xs text-primary-100">{formatTimestamp(message.createdAt)}</span>
                        <span className="ml-1">
                          {message.readAt ? (
                            <CheckIconSolid className="h-3.5 w-3.5 text-blue-200" />
                          ) : (
                            <CheckIcon className="h-3.5 w-3.5 text-primary-200" />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {isTyping && messages.length > 0 && !isMyMessage(messages[messages.length - 1]) && (
          <div className="flex justify-start animate-[fadeIn_0.3s_ease-in-out]">
            <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white shadow-lg">
        {selectedFile && (
          <div className="mb-3 flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-[slideUp_0.2s_ease-out]">
            <PaperClipIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
            <span className="flex-1 truncate text-sm text-gray-700 font-medium">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex items-end space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all duration-200 flex-shrink-0"
            title="Anexar arquivo"
          >
            <PhotoIcon className="h-6 w-6" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (messageText.trim() || selectedFile) {
                    handleSendMessage(e as any);
                  }
                }
              }}
              placeholder="Digite uma mensagem..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={sending || (!messageText.trim() && !selectedFile)}
            className="p-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none flex-shrink-0"
            title="Enviar mensagem"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

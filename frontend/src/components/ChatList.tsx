'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Chat } from '../types';
import { ChatBubbleLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getSocket } from '../lib/socket';

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectChat, selectedChatId }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();
    
    // Atualizar lista quando receber nova mensagem via socket
    const socket = getSocket();
    if (socket) {
      const handleNewMessage = () => {
        loadChats();
      };
      socket.on('chat:new-message', handleNewMessage);
      return () => {
        socket.off('chat:new-message', handleNewMessage);
      };
    }
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat');
      const chatsData = response.data.data.chats || [];
      setChats(chatsData);
      setFilteredChats(chatsData);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = chats.filter((chat) => {
        const participant = chat.otherParticipant;
        const name = participant?.companyName || 
          `${participant?.firstName || ''} ${participant?.lastName || ''}`.trim() ||
          participant?.user?.email ||
          'Usuário';
        const lastMessage = (chat.lastMessage || '').toLowerCase();
        return name.toLowerCase().includes(searchQuery.toLowerCase()) || lastMessage.includes(searchQuery.toLowerCase());
      });
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchQuery, chats]);

  const getParticipantName = (chat: Chat) => {
    const participant = chat.otherParticipant;
    if (!participant) return 'Usuário';
    
    return participant.companyName || 
      `${participant.firstName || ''} ${participant.lastName || ''}`.trim() ||
      participant.user?.email ||
      'Usuário';
  };

  const getParticipantAvatar = (chat: Chat) => {
    return chat.otherParticipant?.avatar || 
      chat.otherParticipant?.companyLogo ||
      null;
  };

  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-AO', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <ChatBubbleLeftIcon className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm font-medium">{searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</p>
            <p className="text-xs mt-2 text-gray-400">{searchQuery ? 'Tente outra busca' : 'Comece uma nova conversa!'}</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
        const isSelected = chat.id === selectedChatId;
        const participantName = getParticipantName(chat);
        const participantAvatar = getParticipantAvatar(chat);
        const unreadCount = chat.unreadCount || 0;

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`flex items-center space-x-3 p-4 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 relative group ${
              isSelected 
                ? 'bg-gradient-to-r from-primary-50 to-white border-l-4 border-l-primary-600 shadow-sm' 
                : 'hover:border-l-4 hover:border-l-gray-300'
            }`}
          >
            <div className="relative flex-shrink-0">
              {participantAvatar ? (
                <img
                  src={participantAvatar}
                  alt={participantName}
                  className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-md group-hover:shadow-lg transition-shadow"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-2 border-white shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-semibold text-lg">
                    {participantName[0].toUpperCase()}
                  </span>
                </div>
              )}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  <span className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </div>
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className={`font-semibold truncate ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                  {participantName}
                </p>
                {chat.lastMessageAt && (
                  <p className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {formatLastMessageTime(chat.lastMessageAt)}
                  </p>
                )}
              </div>
              <p className={`text-sm truncate ${
                unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}>
                {chat.lastMessage || 'Nenhuma mensagem'}
              </p>
            </div>
          </button>
          );
        })
        )}
      </div>
    </div>
  );
};

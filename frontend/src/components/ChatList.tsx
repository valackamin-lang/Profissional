'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Chat } from '../types';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { getSocket } from '../lib/socket';

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectChat, selectedChatId }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

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
      setChats(response.data.data.chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <ChatBubbleLeftIcon className="h-12 w-12 mb-4" />
        <p>Nenhuma conversa ainda</p>
        <p className="text-sm mt-2">Comece uma nova conversa!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {chats.map((chat) => {
        const isSelected = chat.id === selectedChatId;
        const participantName = getParticipantName(chat);
        const participantAvatar = getParticipantAvatar(chat);
        const unreadCount = chat.unreadCount || 0;

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
              isSelected ? 'bg-primary-50 border-primary-200' : ''
            }`}
          >
            {participantAvatar ? (
              <img
                src={participantAvatar}
                alt={participantName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {participantName[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-gray-900 truncate">{participantName}</p>
              <p className="text-sm text-gray-500 truncate">
                {chat.lastMessage || 'Nenhuma mensagem'}
              </p>
              {chat.lastMessageAt && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(chat.lastMessageAt).toLocaleDateString('pt-AO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <div className="flex-shrink-0">
                <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

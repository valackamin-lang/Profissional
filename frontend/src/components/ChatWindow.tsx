'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Chat, Message } from '../types';
import { getSocket } from '../lib/socket';
import {
  PaperClipIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    joinChatRoom();
    setupSocketListeners();

    return () => {
      leaveChatRoom();
    };
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/chat/${chat.id}/messages`);
      setMessages(response.data.data.messages);
      
      // Marcar como lidas
      await api.put(`/chat/${chat.id}/read`);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
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
        if (message.senderId !== currentUserId) {
          api.put(`/chat/${chat.id}/read`).catch(console.error);
        }
      }
    };

    const handleMessageDeleted = (data: { messageId: string; chatId: string }) => {
      if (data.chatId === chat.id) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
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

  const isMyMessage = (message: Message) => message.senderId === currentUserId;

  const getMediaUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${apiUrl}${url}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-200 bg-white">
        {getParticipantAvatar() ? (
          <img
            src={getParticipantAvatar()!}
            alt={getParticipantName()}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-semibold">
              {getParticipantName()[0].toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{getParticipantName()}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => {
          const myMessage = isMyMessage(message);
          return (
            <div
              key={message.id}
              className={`flex ${myMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  myMessage
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {message.type === 'image' && message.mediaUrl && (
                  <img
                    src={getMediaUrl(message.mediaUrl)}
                    alt="Mensagem"
                    className="rounded-lg mb-2 max-w-full"
                  />
                )}
                {message.type === 'file' && message.mediaUrl && (
                  <a
                    href={getMediaUrl(message.mediaUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-2"
                  >
                    <PaperClipIcon className="h-5 w-5" />
                    <span className="text-sm">{message.fileName || 'Arquivo'}</span>
                  </a>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    myMessage ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString('pt-AO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
        {selectedFile && (
          <div className="mb-2 flex items-center space-x-2 text-sm text-gray-600">
            <PaperClipIcon className="h-4 w-4" />
            <span className="truncate">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-red-500 hover:text-red-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2">
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
            className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <PhotoIcon className="h-6 w-6" />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="submit"
            disabled={sending || (!messageText.trim() && !selectedFile)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? '...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
};

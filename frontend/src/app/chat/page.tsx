'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Header } from '../../components/Header';
import { ChatList } from '../../components/ChatList';
import { ChatWindow } from '../../components/ChatWindow';
import { Chat } from '../../types';
import { initializeSocket, disconnectSocket } from '../../lib/socket';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      return; // ProtectedRoute vai lidar com o redirecionamento
    }

    // Obter token do localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      return; // ProtectedRoute vai lidar com o redirecionamento
    }

    // Inicializar Socket.io
    initializeSocket(token);

    // Verificar se há chatId na query string
    const chatId = searchParams.get('chatId');
    if (chatId) {
      loadChatById(chatId);
    }

    return () => {
      disconnectSocket();
    };
  }, [user, loading, router, searchParams]);

  const loadChatById = async (chatId: string) => {
    try {
      // Buscar chat específico
      const response = await api.get(`/chat/${chatId}`);
      setSelectedChat(response.data.data.chat);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  if (loading || !user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-8rem)]">
              {/* Chat List */}
              <div className="border-r border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-200">
                  <h1 className="text-xl font-bold text-gray-900">Mensagens</h1>
                </div>
                <ChatList
                  onSelectChat={setSelectedChat}
                  selectedChatId={selectedChat?.id}
                />
              </div>

              {/* Chat Window */}
              <div className="lg:col-span-2 bg-white">
                {selectedChat ? (
                  <ChatWindow
                    chat={selectedChat}
                    currentUserId={user.profile?.id || ''}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-lg font-semibold mb-2">Selecione uma conversa</p>
                      <p className="text-sm">Escolha uma conversa da lista para começar a conversar</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

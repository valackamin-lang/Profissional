'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../lib/api';
import { CalendarIcon } from '@heroicons/react/24/outline';

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'WEBINAR' as 'WORKSHOP' | 'WEBINAR' | 'CONFERENCE',
    eventDate: '',
    price: '',
    maxAttendees: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
      };

      // Assumindo que a rota será /api/events
      const response = await api.post('/events', payload);
      router.push(`/events/${response.data.data.event.id}`);
    } catch (error: any) {
      console.error('Error creating event:', error);
      setError(error.response?.data?.error?.message || 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'PARTNER' && user?.role !== 'MENTOR' && user?.role !== 'ADMIN') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Acesso negado. Apenas parceiros e mentores podem criar eventos.</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-primary-100 rounded-lg">
                <CalendarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Criar Novo Evento</h1>
                <p className="text-gray-600 mt-1">Organize workshops, webinars ou conferências</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Título do Evento *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Ex: Workshop de React Avançado"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                placeholder="Descreva o evento, conteúdo, público-alvo..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Evento *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                >
                  <option value="WEBINAR">Webinar</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="CONFERENCE">Conferência</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data e Hora *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preço (Kz)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="0.00 (gratuito)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Máximo de Participantes
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                {loading ? 'Criando...' : 'Criar Evento'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

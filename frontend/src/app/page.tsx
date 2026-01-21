'use client';

import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Header } from '../components/Header';
import { Feed } from '../components/Feed';
import { FeedSidebar } from '../components/FeedSidebar';
import Link from 'next/link';
import {
  BriefcaseIcon,
  CalendarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
                FORGETECH
                <span className="text-primary-600"> Professional</span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Conecte-se com oportunidades de carreira, eventos profissionais e mentorias especializadas em Angola
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl hover:from-primary-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl font-semibold text-lg flex items-center gap-2 transform hover:scale-105 active:scale-95"
                >
                  Começar Agora
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl font-semibold text-lg transform hover:scale-105 active:scale-95"
                >
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Tudo que você precisa para crescer profissionalmente
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Uma plataforma completa para estudantes, profissionais e empresas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 - Vagas */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2 border border-blue-200">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                  <BriefcaseIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Vagas de Emprego</h3>
                <p className="text-gray-600 mb-6">
                  Encontre oportunidades de estágio, tempo integral, meio período e contratos em empresas de todo Angola
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Filtros avançados por localização e tipo</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Aplicar diretamente na plataforma</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Acompanhe o status das candidaturas</span>
                  </li>
                </ul>
              </div>

              {/* Feature 2 - Eventos */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2 border border-purple-200">
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Eventos Profissionais</h3>
                <p className="text-gray-600 mb-6">
                  Participe de workshops, webinars e conferências para expandir seus conhecimentos e network
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-purple-600 mr-2" />
                    <span>Eventos presenciais e online</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-purple-600 mr-2" />
                    <span>Integração com Zoom e YouTube</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-purple-600 mr-2" />
                    <span>Certificados de participação</span>
                  </li>
                </ul>
              </div>

              {/* Feature 3 - Mentorias */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2 border border-indigo-200">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                  <AcademicCapIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Mentorias</h3>
                <p className="text-gray-600 mb-6">
                  Conecte-se com mentores experientes e acelere seu desenvolvimento profissional
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    <span>Mentores verificados e qualificados</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    <span>Sessões personalizadas</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    <span>Acompanhamento de progresso</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div className="transform hover:scale-110 transition-transform">
                <div className="text-5xl font-bold text-white mb-2 drop-shadow-lg">500+</div>
                <div className="text-primary-100 font-medium">Vagas Disponíveis</div>
              </div>
              <div className="transform hover:scale-110 transition-transform">
                <div className="text-5xl font-bold text-white mb-2 drop-shadow-lg">200+</div>
                <div className="text-primary-100 font-medium">Eventos Realizados</div>
              </div>
              <div className="transform hover:scale-110 transition-transform">
                <div className="text-5xl font-bold text-white mb-2 drop-shadow-lg">100+</div>
                <div className="text-primary-100 font-medium">Mentores Ativos</div>
              </div>
              <div className="transform hover:scale-110 transition-transform">
                <div className="text-5xl font-bold text-white mb-2 drop-shadow-lg">5K+</div>
                <div className="text-primary-100 font-medium">Usuários Cadastrados</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Pronto para começar sua jornada profissional?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Junte-se a milhares de profissionais que já estão transformando suas carreiras
            </p>
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl hover:from-primary-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl font-semibold text-lg transform hover:scale-105 active:scale-95"
            >
              Criar Conta Grátis
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white text-xl font-bold mb-4">FORGETECH</h3>
                <p className="text-gray-400">
                  Plataforma profissional para conectar talentos e oportunidades em Angola
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Para Estudantes</h4>
                <ul className="space-y-2">
                  <li><Link href="/jobs" className="hover:text-white transition-colors">Vagas</Link></li>
                  <li><Link href="/events" className="hover:text-white transition-colors">Eventos</Link></li>
                  <li><Link href="/mentorships" className="hover:text-white transition-colors">Mentorias</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Para Empresas</h4>
                <ul className="space-y-2">
                  <li><Link href="/register" className="hover:text-white transition-colors">Publicar Vagas</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Criar Eventos</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Oferecer Mentorias</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Suporte</h4>
                <ul className="space-y-2">
                  <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Registro</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} FORGETECH Professional. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </main>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
            <p className="text-gray-600 mt-2">
              Descubra vagas, eventos e mentorias personalizadas para você
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Feed />
            </div>
            <div className="lg:col-span-1">
              <FeedSidebar />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

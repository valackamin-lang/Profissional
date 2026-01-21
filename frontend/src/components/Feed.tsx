'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';
import { FeedItem, Job, Event, Mentorship } from '../types';
import {
  BriefcaseIcon,
  CalendarIcon,
  AcademicCapIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export const Feed: React.FC = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/feed?page=${page}&limit=20`);
      const newItems = response.data.data.feed;
      setFeed((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length === 20);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 1000) {
        if (!loading && hasMore) {
          loadFeed();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore]);

  if (loading && feed.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {feed.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}
      {loading && feed.length > 0 && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
      {!hasMore && feed.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Você viu todas as publicações</p>
        </div>
      )}
    </div>
  );
};

const FeedCard: React.FC<{ item: FeedItem }> = ({ item }) => {
  const getLink = () => {
    switch (item.type) {
      case 'JOB':
        return `/jobs/${item.content.id}`;
      case 'EVENT':
        return `/events/${item.content.id}`;
      case 'MENTORSHIP':
        return `/mentorships/${item.content.id}`;
      default:
        return '#';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FULL_TIME':
        return 'Tempo Integral';
      case 'PART_TIME':
        return 'Meio Período';
      case 'INTERNSHIP':
        return 'Estágio';
      case 'CONTRACT':
        return 'Contrato';
      case 'WORKSHOP':
        return 'Workshop';
      case 'WEBINAR':
        return 'Webinar';
      case 'CONFERENCE':
        return 'Conferência';
      default:
        return type;
    }
  };

  const renderContent = () => {
    switch (item.type) {
      case 'JOB': {
        const job = item.content as Job;
        return (
          <Link href={getLink()} className="block group">
            <article className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all duration-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        <span>{job.company}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {job.description?.substring(0, 250) || job.description}
                  {job.description && job.description.length > 250 && '...'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {getTypeLabel(job.type)}
                  </span>
                  {job.location && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {job.location}
                    </span>
                  )}
                  {job.salaryMin && job.salaryMax && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                      Kz {job.salaryMin.toLocaleString()} - Kz {job.salaryMax.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Publicado {new Date(item.createdAt || Date.now()).toLocaleDateString('pt-AO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        );
      }

      case 'EVENT': {
        const event = item.content as Event;
        return (
          <Link href={getLink()} className="block group">
            <article className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all duration-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CalendarIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {event.title}
                      </h3>
                      {(event.eventDate || event.date) && (
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>
                            {new Date(event.eventDate || event.date).toLocaleDateString('pt-AO', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {event.description?.substring(0, 250) || event.description}
                  {event.description && event.description.length > 250 && '...'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {getTypeLabel(event.type)}
                  </span>
                  {event.price !== undefined && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {event.price === 0 ? (
                        'Gratuito'
                      ) : (
                        <>
                          <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                          Kz {typeof event.price === 'number' ? event.price.toFixed(2) : parseFloat(String(event.price || '0')).toFixed(2)}
                        </>
                      )}
                    </span>
                  )}
                  {event.maxAttendees && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <UserGroupIcon className="h-3 w-3 mr-1" />
                      {event.currentAttendees || 0}/{event.maxAttendees} participantes
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Publicado {new Date(item.createdAt || Date.now()).toLocaleDateString('pt-AO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        );
      }

      case 'MENTORSHIP': {
        const mentorship = item.content as Mentorship;
        return (
          <Link href={getLink()} className="block group">
            <article className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all duration-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {mentorship.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {mentorship.description?.substring(0, 250) || mentorship.description}
                  {mentorship.description && mentorship.description.length > 250 && '...'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Mentoria
                  </span>
                  {mentorship.price !== undefined && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                      Kz {typeof mentorship.price === 'number' ? mentorship.price.toFixed(2) : parseFloat(String(mentorship.price || '0')).toFixed(2)}
                    </span>
                  )}
                  {mentorship.duration && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {mentorship.duration}h
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Publicado {new Date(item.createdAt || Date.now()).toLocaleDateString('pt-AO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        );
      }

      default:
        return null;
    }
  };

  return renderContent();
};

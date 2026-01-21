export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: Profile;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'STUDENT' | 'MENTOR' | 'PARTNER' | 'ADMIN';

export interface Profile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  resume?: string;
  portfolio?: string;
  type: ProfileType;
  createdAt: string;
  updatedAt: string;
}

export type ProfileType = 'STUDENT' | 'PROFESSIONAL' | 'MENTOR' | 'COMPANY';

export interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  location?: string;
  type: JobType;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export type JobType = 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
export type JobStatus = 'OPEN' | 'CLOSED' | 'PAUSED';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  type: EventType;
  videoLink?: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 'WORKSHOP' | 'WEBINAR' | 'CONFERENCE';
export type EventStatus = 'UPCOMING' | 'LIVE' | 'ENDED' | 'CANCELLED';

export interface Mentorship {
  id: string;
  title: string;
  description: string;
  mentorId: string;
  price: number;
  duration: number;
  status: MentorshipStatus;
  createdAt: string;
  updatedAt: string;
}

export type MentorshipStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  content: Job | Event | Mentorship;
  priority: number;
  createdAt: string;
}

export type FeedItemType = 'JOB' | 'EVENT' | 'MENTORSHIP';

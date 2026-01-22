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
  companyName?: string;
  companyDocument?: string;
  companyLogo?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  salaryMin?: number;
  salaryMax?: number;
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
  eventDate?: string;
  type: EventType;
  videoLink?: string;
  status: EventStatus;
  price?: number;
  maxAttendees?: number;
  currentAttendees?: number;
  location?: string;
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

export interface Post {
  id: string;
  authorId: string;
  content: string;
  media?: string[];
  mediaType?: 'image' | 'video' | 'mixed';
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  author?: Profile & { user?: { id: string; email: string } };
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
  likesCount: number;
  author?: Profile & { user?: { id: string; email: string } };
  replies?: PostComment[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedItem {
  id: string;
  type: FeedItemType;
  content: Job | Event | Mentorship | Post;
  priority: number;
  createdAt: string;
}

export type FeedItemType = 'JOB' | 'EVENT' | 'MENTORSHIP' | 'POST';

export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  readAt?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
  sender?: Profile & { user?: { id: string; email: string } };
}

export interface Chat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt?: string;
  lastMessage?: string;
  unreadCount1: number;
  unreadCount2: number;
  createdAt: string;
  updatedAt: string;
  participant1?: Profile & { user?: { id: string; email: string } };
  participant2?: Profile & { user?: { id: string; email: string } };
  otherParticipant?: Profile & { user?: { id: string; email: string } };
  unreadCount?: number;
}

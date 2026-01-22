import User from './User';
import Role from './Role';
import Permission from './Permission';
import RolePermission from './RolePermission';
import Profile from './Profile';
import Job from './Job';
import JobApplication from './JobApplication';
import Mentorship from './Mentorship';
import MentorshipSubscription from './MentorshipSubscription';
import Event from './Event';
import EventRegistration from './EventRegistration';
import Subscription from './Subscription';
import Payment from './Payment';
import AuditLog from './AuditLog';
import Notification from './Notification';
import FeedItem from './FeedItem';
import Post from './Post';
import PostLike from './PostLike';
import PostComment from './PostComment';
import PostShare from './PostShare';
import Chat from './Chat';
import Message from './Message';
import Follow from './Follow';

// User - Role relationship
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

// Role - Permission relationship (many-to-many)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
});

// User - Profile relationship (one-to-one)
User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Profile - Job relationship
Profile.hasMany(Job, { foreignKey: 'postedBy', as: 'postedJobs' });
Job.belongsTo(Profile, { foreignKey: 'postedBy', as: 'profile' });

// Job - JobApplication relationship
Job.hasMany(JobApplication, { foreignKey: 'jobId', as: 'applications' });
JobApplication.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
Profile.hasMany(JobApplication, { foreignKey: 'applicantId', as: 'applications' });
JobApplication.belongsTo(Profile, { foreignKey: 'applicantId', as: 'applicant' });

// Profile - Mentorship relationship
Profile.hasMany(Mentorship, { foreignKey: 'mentorId', as: 'mentorships' });
Mentorship.belongsTo(Profile, { foreignKey: 'mentorId', as: 'mentor' });

// Mentorship - MentorshipSubscription relationship
Mentorship.hasMany(MentorshipSubscription, { foreignKey: 'mentorshipId', as: 'subscriptions' });
MentorshipSubscription.belongsTo(Mentorship, { foreignKey: 'mentorshipId', as: 'mentorship' });
Profile.hasMany(MentorshipSubscription, { foreignKey: 'studentId', as: 'mentorshipSubscriptions' });
MentorshipSubscription.belongsTo(Profile, { foreignKey: 'studentId', as: 'student' });

// Profile - Event relationship
Profile.hasMany(Event, { foreignKey: 'organizerId', as: 'organizedEvents' });
Event.belongsTo(Profile, { foreignKey: 'organizerId', as: 'organizer' });

// Event - EventRegistration relationship
Event.hasMany(EventRegistration, { foreignKey: 'eventId', as: 'registrations' });
EventRegistration.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
Profile.hasMany(EventRegistration, { foreignKey: 'attendeeId', as: 'eventRegistrations' });
EventRegistration.belongsTo(Profile, { foreignKey: 'attendeeId', as: 'attendee' });

// User - Subscription relationship
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Payment relationship
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Payment - Mentorship relationship
Mentorship.hasMany(Payment, { foreignKey: 'mentorshipId', as: 'payments' });
Payment.belongsTo(Mentorship, { foreignKey: 'mentorshipId', as: 'mentorship' });

// Payment - Event relationship
Event.hasMany(Payment, { foreignKey: 'eventId', as: 'payments' });
Payment.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

// User - AuditLog relationship
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Notification relationship
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Profile - Post relationship
Profile.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(Profile, { foreignKey: 'authorId', as: 'author' });

// Post - PostLike relationship
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });
PostLike.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Profile.hasMany(PostLike, { foreignKey: 'userId', as: 'postLikes' });
PostLike.belongsTo(Profile, { foreignKey: 'userId', as: 'user' });

// Post - PostComment relationship
Post.hasMany(PostComment, { foreignKey: 'postId', as: 'comments' });
PostComment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Profile.hasMany(PostComment, { foreignKey: 'authorId', as: 'postComments' });
PostComment.belongsTo(Profile, { foreignKey: 'authorId', as: 'author' });
PostComment.belongsTo(PostComment, { foreignKey: 'parentId', as: 'parent' });
PostComment.hasMany(PostComment, { foreignKey: 'parentId', as: 'replies' });

// Post - PostShare relationship
Post.hasMany(PostShare, { foreignKey: 'postId', as: 'shares' });
PostShare.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
Profile.hasMany(PostShare, { foreignKey: 'userId', as: 'postShares' });
PostShare.belongsTo(Profile, { foreignKey: 'userId', as: 'user' });

// Profile - Chat relationship (participant1)
Profile.hasMany(Chat, { foreignKey: 'participant1Id', as: 'chatsAsParticipant1' });
Chat.belongsTo(Profile, { foreignKey: 'participant1Id', as: 'participant1' });

// Profile - Chat relationship (participant2)
Profile.hasMany(Chat, { foreignKey: 'participant2Id', as: 'chatsAsParticipant2' });
Chat.belongsTo(Profile, { foreignKey: 'participant2Id', as: 'participant2' });

// Chat - Message relationship
Chat.hasMany(Message, { foreignKey: 'chatId', as: 'messages' });
Message.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });

// Profile - Message relationship
Profile.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(Profile, { foreignKey: 'senderId', as: 'sender' });

// Follow relationships
Follow.belongsTo(Profile, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(Profile, { foreignKey: 'followingId', as: 'following' });
Profile.hasMany(Follow, { foreignKey: 'followerId', as: 'following' }); // Perfis que este perfil segue
Profile.hasMany(Follow, { foreignKey: 'followingId', as: 'followers' }); // Perfis que seguem este perfil

export {
  User,
  Role,
  Permission,
  RolePermission,
  Profile,
  Job,
  JobApplication,
  Mentorship,
  MentorshipSubscription,
  Event,
  EventRegistration,
  Subscription,
  Payment,
  AuditLog,
  Notification,
  FeedItem,
  Post,
  PostLike,
  PostComment,
  PostShare,
  Chat,
  Message,
  Follow,
};

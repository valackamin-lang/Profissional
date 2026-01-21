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
};

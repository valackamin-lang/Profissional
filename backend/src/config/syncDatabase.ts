import sequelize from './database';
import logger from './logger';
import {
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
} from '../models';
// Removed seed import - seeders are now in separate files

export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    logger.info('🔄 Syncing database...');

    // Sync in order to respect foreign key constraints
    await Role.sync({ force });
    await Permission.sync({ force });
    await RolePermission.sync({ force });
    await User.sync({ force });
    await Profile.sync({ force });
    await Job.sync({ force });
    await JobApplication.sync({ force });
    await Mentorship.sync({ force });
    await MentorshipSubscription.sync({ force });
    await Event.sync({ force });
    await EventRegistration.sync({ force });
    await Subscription.sync({ force });
    await Payment.sync({ force });
    await AuditLog.sync({ force });
    await Notification.sync({ force });
    await FeedItem.sync({ force });
    logger.info('📝 Syncing Post models...');
    await Post.sync({ force });
    await PostLike.sync({ force });
    await PostComment.sync({ force });
    await PostShare.sync({ force });
    logger.info('✅ Post models synced');
    
    logger.info('💬 Syncing Chat models...');
    await Chat.sync({ force });
    await Message.sync({ force });
    logger.info('✅ Chat models synced');

    logger.info('✅ Database synced successfully.');
  } catch (error) {
    logger.error('❌ Error syncing database:', error);
    throw error;
  }
};

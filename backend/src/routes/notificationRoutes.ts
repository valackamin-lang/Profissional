import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { asHandler } from '../utils/routeHelpers';

const router = Router();

router.use(authenticate as any);

router.get('/', asHandler(getNotifications));
router.put('/:id/read', asHandler(markNotificationAsRead));
router.put('/read-all', asHandler(markAllNotificationsAsRead));

export default router;

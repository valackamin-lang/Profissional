import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getAllContent,
  updateUserStatus,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/content', getAllContent);
router.put('/users/:targetUserId/status', updateUserStatus);

export default router;

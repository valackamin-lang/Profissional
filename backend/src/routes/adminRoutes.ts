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

router.use(authenticate as any);
router.use(authorize('ADMIN') as any);

router.get('/dashboard/stats', getDashboardStats as any);
router.get('/users', getAllUsers as any);
router.get('/content', getAllContent as any);
router.put('/users/:targetUserId/status', updateUserStatus as any);

export default router;

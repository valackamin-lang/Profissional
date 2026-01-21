import { Router } from 'express';
import { getStats, getHistory } from '../controllers/commissionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/stats', getStats as any);
router.get('/history', getHistory as any);

export default router;

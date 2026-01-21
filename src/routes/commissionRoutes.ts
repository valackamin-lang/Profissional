import { Router } from 'express';
import { getStats, getHistory } from '../controllers/commissionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/history', getHistory);

export default router;

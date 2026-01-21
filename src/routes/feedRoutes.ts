import { Router } from 'express';
import { getFeed } from '../controllers/feedController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getFeed);

export default router;

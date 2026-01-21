import { Router } from 'express';
import { getFeed } from '../controllers/feedController';
import { authenticate } from '../middleware/auth';
import { asHandler } from '../utils/routeHelpers';

const router = Router();

router.get('/', authenticate as any, asHandler(getFeed));

export default router;

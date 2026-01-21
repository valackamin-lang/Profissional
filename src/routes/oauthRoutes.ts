import { Router } from 'express';
import { googleAuth, googleCallback, linkedinAuth, linkedinCallback } from '../controllers/oauthController';

const router = Router();

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/linkedin', linkedinAuth);
router.get('/linkedin/callback', linkedinCallback);

export default router;

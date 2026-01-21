import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  listProfiles,
  getMentorStats,
} from '../controllers/profileController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';
import { uploadFields } from '../config/upload';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.get('/', authorize('ADMIN'), listProfiles);
router.get('/:id/stats', getMentorStats);
router.get('/:id', getProfile);

router.post(
  '/',
  [
    body('type').isIn(['STUDENT', 'PROFESSIONAL', 'MENTOR', 'COMPANY']).withMessage('Tipo de perfil inválido'),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('bio').optional().isString(),
    body('companyName').optional().isString(),
    body('companyDocument').optional().isString(),
  ],
  validateRequest,
  uploadFields,
  createProfile
);

router.put(
  '/:id',
  [
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('bio').optional().isString(),
    body('companyName').optional().isString(),
    body('companyDocument').optional().isString(),
  ],
  validateRequest,
  uploadFields,
  updateProfile
);

router.delete('/:id', authorize('ADMIN'), deleteProfile);

export default router;

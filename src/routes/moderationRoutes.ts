import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPendingApprovals,
  approveProfile,
  rejectProfile,
  moderateContent,
} from '../controllers/moderationController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/approvals', getPendingApprovals);

router.put(
  '/approve/:profileId',
  [body('notes').optional().isString()],
  validateRequest,
  approveProfile
);

router.put(
  '/reject/:profileId',
  [body('notes').notEmpty().withMessage('Notas de rejeição são obrigatórias')],
  validateRequest,
  rejectProfile
);

router.post(
  '/content',
  [
    body('resource').isIn(['JOB', 'EVENT', 'MENTORSHIP']).withMessage('Recurso inválido'),
    body('resourceId').notEmpty().withMessage('resourceId é obrigatório'),
    body('action').isIn(['APPROVE', 'REJECT', 'DELETE']).withMessage('Ação inválida'),
    body('reason').optional().isString(),
  ],
  validateRequest,
  moderateContent
);

export default router;

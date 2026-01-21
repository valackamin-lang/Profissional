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
import { asHandler } from '../utils/routeHelpers';

const router = Router();

router.use(authenticate as any);
router.use(authorize('ADMIN') as any);

router.get('/approvals', asHandler(getPendingApprovals));

router.put(
  '/approve/:profileId',
  [body('notes').optional().isString()],
  validateRequest,
  asHandler(approveProfile)
);

router.put(
  '/reject/:profileId',
  [body('notes').notEmpty().withMessage('Notas de rejeição são obrigatórias')],
  validateRequest,
  asHandler(rejectProfile)
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
  asHandler(moderateContent)
);

export default router;

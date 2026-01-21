import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
} from '../controllers/roleController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';
import { asHandler } from '../utils/routeHelpers';

const router = Router();

router.use(authenticate as any);
router.use(authorize('ADMIN') as any);

router.get('/', asHandler(getAllRoles));
router.get('/:id', asHandler(getRole));
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('description').optional().isString(),
    body('permissionIds').optional().isArray(),
  ],
  validateRequest,
  asHandler(createRole)
);
router.put(
  '/:id',
  [
    body('name').optional().notEmpty(),
    body('description').optional().isString(),
    body('permissionIds').optional().isArray(),
  ],
  validateRequest,
  asHandler(updateRole)
);
router.delete('/:id', asHandler(deleteRole));
router.post(
  '/:id/permissions',
  [
    body('permissionIds').isArray().withMessage('permissionIds deve ser um array'),
  ],
  validateRequest,
  asHandler(assignPermissions)
);

export default router;

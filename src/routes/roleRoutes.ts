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

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllRoles);
router.get('/:id', getRole);
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('description').optional().isString(),
    body('permissionIds').optional().isArray(),
  ],
  validateRequest,
  createRole
);
router.put(
  '/:id',
  [
    body('name').optional().notEmpty(),
    body('description').optional().isString(),
    body('permissionIds').optional().isArray(),
  ],
  validateRequest,
  updateRole
);
router.delete('/:id', deleteRole);
router.post(
  '/:id/permissions',
  [
    body('permissionIds').isArray().withMessage('permissionIds deve ser um array'),
  ],
  validateRequest,
  assignPermissions
);

export default router;

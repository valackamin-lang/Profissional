import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
} from '../controllers/permissionController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllPermissions);
router.get('/:id', getPermission);
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('resource').notEmpty().withMessage('Recurso é obrigatório'),
    body('action').notEmpty().withMessage('Ação é obrigatória'),
    body('description').optional().isString(),
  ],
  validateRequest,
  createPermission
);
router.put(
  '/:id',
  [
    body('name').optional().notEmpty(),
    body('resource').optional().notEmpty(),
    body('action').optional().notEmpty(),
    body('description').optional().isString(),
  ],
  validateRequest,
  updatePermission
);
router.delete('/:id', deletePermission);

export default router;

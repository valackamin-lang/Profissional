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
import { asHandler } from '../utils/routeHelpers';

const router = Router();

router.use(authenticate as any);
router.use(authorize('ADMIN') as any);

router.get('/', asHandler(getAllPermissions));
router.get('/:id', asHandler(getPermission));
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('resource').notEmpty().withMessage('Recurso é obrigatório'),
    body('action').notEmpty().withMessage('Ação é obrigatória'),
    body('description').optional().isString(),
  ],
  validateRequest,
  asHandler(createPermission)
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
  asHandler(updatePermission)
);
router.delete('/:id', asHandler(deletePermission));

export default router;

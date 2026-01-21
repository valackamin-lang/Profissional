import { Router } from 'express';
import { body } from 'express-validator';
import {
  createMentorship,
  getMentorships,
  getMentorship,
  updateMentorship,
  deleteMentorship,
} from '../controllers/mentorshipController';
import {
  subscribeToMentorship,
  checkSubscription,
  getMySubscriptions,
  getMentorshipSubscribers,
  getAllMentorSubscribers,
} from '../controllers/mentorshipSubscriptionController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { asHandler } from '../utils/routeHelpers';

const router = Router();

router.get('/', authenticate as any, asHandler(getMentorships));
router.get('/subscriptions/me', authenticate as any, asHandler(getMySubscriptions));
router.get('/subscribers/all', authenticate as any, asHandler(getAllMentorSubscribers));

// Subscription routes with specific ID pattern
router.post('/:id/subscriptions', authenticate as any, asHandler(subscribeToMentorship));
router.get('/:id/subscriptions/me', authenticate as any, asHandler(checkSubscription));
router.get('/:mentorshipId/subscribers', authenticate as any, asHandler(getMentorshipSubscribers));

// CRUD routes
router.get('/:id', authenticate as any, asHandler(getMentorship));

router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('price').isNumeric().withMessage('Preço deve ser um número'),
    body('duration').isInt().withMessage('Duração deve ser um número inteiro'),
    body('maxStudents').optional().isInt(),
  ],
  validateRequest,
  asHandler(createMentorship)
);

router.put(
  '/:id',
  authenticate as any,
  [
    body('title').optional().notEmpty(),
    body('description').optional().notEmpty(),
    body('price').optional().isNumeric(),
    body('duration').optional().isInt(),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  ],
  validateRequest,
  asHandler(updateMentorship)
);

router.delete('/:id', authenticate as any, asHandler(deleteMentorship));

export default router;

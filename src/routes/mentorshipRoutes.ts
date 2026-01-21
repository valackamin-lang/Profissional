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

const router = Router();

router.get('/', authenticate, getMentorships);
router.get('/subscriptions/me', authenticate, getMySubscriptions);
router.get('/subscribers/all', authenticate, getAllMentorSubscribers);

// Subscription routes with specific ID pattern
router.post('/:id/subscriptions', authenticate, subscribeToMentorship);
router.get('/:id/subscriptions/me', authenticate, checkSubscription);
router.get('/:mentorshipId/subscribers', authenticate, getMentorshipSubscribers);

// CRUD routes
router.get('/:id', authenticate, getMentorship);

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
  createMentorship
);

router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().notEmpty(),
    body('description').optional().notEmpty(),
    body('price').optional().isNumeric(),
    body('duration').optional().isInt(),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  ],
  validateRequest,
  updateMentorship
);

router.delete('/:id', authenticate, deleteMentorship);

export default router;

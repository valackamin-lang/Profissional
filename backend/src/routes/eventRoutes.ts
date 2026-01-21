import { Router } from 'express';
import { body } from 'express-validator';
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController';
import {
  registerToEvent,
  checkRegistration,
  getMyRegistrations,
  getEventAttendees,
  getAllOrganizerAttendees,
} from '../controllers/eventRegistrationController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.get('/', authenticate as any, getEvents as any);
router.get('/registrations/me', authenticate as any, getMyRegistrations as any);
router.get('/attendees/all', authenticate as any, getAllOrganizerAttendees as any);

// Registration routes with specific ID pattern
router.post('/:id/registrations', authenticate as any, registerToEvent as any);
router.get('/:id/registrations/me', authenticate as any, checkRegistration as any);
router.get('/:eventId/attendees', authenticate as any, getEventAttendees as any);

// CRUD routes
router.get('/:id', authenticate as any, getEvent as any);

router.post(
  '/',
  authenticate as any,
  [
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('type').isIn(['WORKSHOP', 'WEBINAR', 'CONFERENCE']).withMessage('Tipo inválido'),
    body('eventDate').isISO8601().withMessage('Data do evento inválida'),
    body('price').optional().isNumeric(),
    body('maxAttendees').optional().isInt(),
  ],
  validateRequest,
  createEvent as any
);

router.put(
  '/:id',
  authenticate as any,
  [
    body('title').optional().notEmpty(),
    body('description').optional().notEmpty(),
    body('type').optional().isIn(['WORKSHOP', 'WEBINAR', 'CONFERENCE']),
    body('status').optional().isIn(['UPCOMING', 'LIVE', 'ENDED', 'CANCELLED']),
  ],
  validateRequest,
  updateEvent as any
);

router.delete('/:id', authenticate as any, deleteEvent as any);

export default router;

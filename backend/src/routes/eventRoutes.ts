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

router.get('/', authenticate, getEvents);
router.get('/registrations/me', authenticate, getMyRegistrations);
router.get('/attendees/all', authenticate, getAllOrganizerAttendees);

// Registration routes with specific ID pattern
router.post('/:id/registrations', authenticate, registerToEvent);
router.get('/:id/registrations/me', authenticate, checkRegistration);
router.get('/:eventId/attendees', authenticate, getEventAttendees);

// CRUD routes
router.get('/:id', authenticate, getEvent);

router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('type').isIn(['WORKSHOP', 'WEBINAR', 'CONFERENCE']).withMessage('Tipo inválido'),
    body('eventDate').isISO8601().withMessage('Data do evento inválida'),
    body('price').optional().isNumeric(),
    body('maxAttendees').optional().isInt(),
  ],
  validateRequest,
  createEvent
);

router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().notEmpty(),
    body('description').optional().notEmpty(),
    body('type').optional().isIn(['WORKSHOP', 'WEBINAR', 'CONFERENCE']),
    body('status').optional().isIn(['UPCOMING', 'LIVE', 'ENDED', 'CANCELLED']),
  ],
  validateRequest,
  updateEvent
);

router.delete('/:id', authenticate, deleteEvent);

export default router;

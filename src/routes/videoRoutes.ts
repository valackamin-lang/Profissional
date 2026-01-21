import { Router } from 'express';
import { body } from 'express-validator';
import {
  createEventVideo,
  getEventVideoLink,
} from '../controllers/videoController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

router.post(
  '/event',
  [
    body('eventId').notEmpty().withMessage('eventId é obrigatório'),
    body('videoType').isIn(['ZOOM', 'YOUTUBE']).withMessage('videoType deve ser ZOOM ou YOUTUBE'),
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('startTime').isISO8601().withMessage('startTime deve ser uma data válida'),
    body('duration').optional().isInt().withMessage('Duration deve ser um número'),
  ],
  validateRequest,
  createEventVideo
);

router.get('/event/:eventId', getEventVideoLink);

export default router;

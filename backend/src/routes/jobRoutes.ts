import { Router } from 'express';
import { body } from 'express-validator';
import {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
} from '../controllers/jobController';
import {
  applyToJob,
  getApplications,
  getApplication,
  updateApplicationStatus,
  getAllCompanyApplications,
  getMyApplications,
} from '../controllers/jobApplicationController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.get('/', authenticate, getJobs);
router.get('/applications/me', authenticate, getMyApplications);
router.get('/applications/all', authenticate, getAllCompanyApplications);
router.get('/applications/:id', authenticate, getApplication);
router.get('/:id', authenticate, getJob);

router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('company').notEmpty().withMessage('Empresa é obrigatória'),
    body('type').isIn(['INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT']).withMessage('Tipo inválido'),
    body('location').optional().isString(),
    body('requirements').optional().isString(),
    body('salaryMin').optional().isNumeric(),
    body('salaryMax').optional().isNumeric(),
    body('applicationDeadline').optional().isISO8601(),
  ],
  validateRequest,
  createJob
);

router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().notEmpty(),
    body('description').optional().notEmpty(),
    body('company').optional().notEmpty(),
    body('type').optional().isIn(['INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT']),
    body('status').optional().isIn(['OPEN', 'CLOSED', 'PAUSED']),
  ],
  validateRequest,
  updateJob
);

router.delete('/:id', authenticate, deleteJob);

// Application routes
router.post(
  '/:jobId/applications',
  authenticate,
  [
    body('coverLetter').optional().isString(),
    body('resume').optional().isString(),
  ],
  validateRequest,
  applyToJob
);

router.get('/:jobId/applications/:id', authenticate, getApplication);
router.get('/:jobId/applications', authenticate, getApplications);
router.put(
  '/applications/:id',
  authenticate,
  [
    body('status').isIn(['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED']).withMessage('Status inválido'),
    body('notes').optional().isString(),
  ],
  validateRequest,
  updateApplicationStatus
);

export default router;

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
import { asHandler } from '../utils/routeHelpers';

const router = Router();

router.get('/', authenticate as any, asHandler(getJobs));
router.get('/applications/me', authenticate as any, asHandler(getMyApplications));
router.get('/applications/all', authenticate as any, asHandler(getAllCompanyApplications));
router.get('/applications/:id', authenticate as any, asHandler(getApplication));
router.get('/:id', authenticate as any, asHandler(getJob));

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
  asHandler(createJob)
);

router.put(
  '/:id',
  authenticate as any,
  [
    body('title').optional().notEmpty(),
    body('description').optional().notEmpty(),
    body('company').optional().notEmpty(),
    body('type').optional().isIn(['INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT']),
    body('status').optional().isIn(['OPEN', 'CLOSED', 'PAUSED']),
  ],
  validateRequest,
  asHandler(updateJob)
);

router.delete('/:id', authenticate as any, asHandler(deleteJob));

// Application routes
router.post(
  '/:jobId/applications',
  authenticate as any,
  [
    body('coverLetter').optional().isString(),
    body('resume').optional().isString(),
  ],
  validateRequest,
  asHandler(applyToJob)
);

router.get('/:jobId/applications/:id', authenticate as any, asHandler(getApplication));
router.get('/:jobId/applications', authenticate as any, asHandler(getApplications));
router.put(
  '/applications/:id',
  authenticate as any,
  [
    body('status').isIn(['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED']).withMessage('Status inválido'),
    body('notes').optional().isString(),
  ],
  validateRequest,
  asHandler(updateApplicationStatus)
);

export default router;

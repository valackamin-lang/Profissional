import { Router } from 'express';
import {
  getAuditLogs,
  getAuditReport,
  getTransactionLogs,
} from '../controllers/auditController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/logs', getAuditLogs);
router.get('/report', getAuditReport);
router.get('/transactions', getTransactionLogs);

export default router;

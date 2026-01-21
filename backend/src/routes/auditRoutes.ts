import { Router } from 'express';
import {
  getAuditLogs,
  getAuditReport,
  getTransactionLogs,
} from '../controllers/auditController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate as any);
router.use(authorize('ADMIN') as any);

router.get('/logs', getAuditLogs as any);
router.get('/report', getAuditReport as any);
router.get('/transactions', getTransactionLogs as any);

export default router;

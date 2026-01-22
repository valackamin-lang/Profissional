import { Router } from 'express';
import {
  followProfile,
  unfollowProfile,
  checkFollow,
  getFollowers,
  getFollowing,
  getFollowCounts,
} from '../controllers/followController';
import { authenticate } from '../middleware/auth';
import { asHandler } from '../utils/routeHelpers';

const router = Router();

router.use(authenticate as any);

// Seguir um perfil
router.post('/:profileId', asHandler(followProfile));

// Deixar de seguir um perfil
router.delete('/:profileId', asHandler(unfollowProfile));

// Verificar se está seguindo
router.get('/:profileId/check', asHandler(checkFollow));

// Obter seguidores
router.get('/:profileId/followers', asHandler(getFollowers));

// Obter perfis que está seguindo
router.get('/:profileId/following', asHandler(getFollowing));

// Obter contadores
router.get('/:profileId/counts', asHandler(getFollowCounts));

export default router;

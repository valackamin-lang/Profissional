import { Router } from 'express';
import {
  createPost,
  getPosts,
  getPost,
  toggleLike,
  createComment,
  getComments,
  sharePost,
  deletePost,
} from '../controllers/postController';
import { authenticate } from '../middleware/auth';
import { uploadPostMedia } from '../config/upload';
import { asHandler } from '../utils/routeHelpers';

const router = Router();

// Criar post (com upload de mídia)
router.post('/', authenticate as any, uploadPostMedia, asHandler(createPost));

// Listar posts
router.get('/', authenticate as any, asHandler(getPosts));

// Obter post específico
router.get('/:id', authenticate as any, asHandler(getPost));

// Curtir/descurtir post
router.post('/:id/like', authenticate as any, asHandler(toggleLike));

// Comentar post
router.post('/:id/comments', authenticate as any, asHandler(createComment));

// Listar comentários
router.get('/:id/comments', authenticate as any, asHandler(getComments));

// Compartilhar post
router.post('/:id/share', authenticate as any, asHandler(sharePost));

// Deletar post
router.delete('/:id', authenticate as any, asHandler(deletePost));

export default router;

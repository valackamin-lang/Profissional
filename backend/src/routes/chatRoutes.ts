import { Router } from 'express';
import {
  getOrCreateChat,
  getChat,
  getChats,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { upload } from '../config/upload';
import { asHandler } from '../utils/routeHelpers';

const router = Router();

// Listar todos os chats do usuário (deve vir antes de /:chatId)
router.get('/', authenticate as any, asHandler(getChats));

// Obter ou criar chat com um usuário (deve vir antes de /:chatId)
router.get('/with/:participantId', authenticate as any, asHandler(getOrCreateChat));

// Obter mensagens de um chat (deve vir antes de /:chatId)
router.get('/:chatId/messages', authenticate as any, asHandler(getMessages));

// Obter chat específico (deve vir por último)
router.get('/:chatId', authenticate as any, asHandler(getChat));

// Enviar mensagem
router.post('/:chatId/messages', authenticate as any, upload.single('chatMedia'), asHandler(sendMessage));

// Marcar mensagens como lidas
router.put('/:chatId/read', authenticate as any, asHandler(markMessagesAsRead));

// Deletar mensagem
router.delete('/messages/:messageId', authenticate as any, asHandler(deleteMessage));

export default router;

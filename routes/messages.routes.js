import express from 'express';
import { sendMessage, markMessageAsSeen, getUserConversations, getMessagesBetweenUsers } from '../controllers/messages.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/conversations/:userId", authMiddleware, getUserConversations);
router.post('/', authMiddleware, sendMessage);
router.get('/:user1/:user2', authMiddleware, getMessagesBetweenUsers);
router.patch('/:messageId/seen', authMiddleware, markMessageAsSeen);

export default router;
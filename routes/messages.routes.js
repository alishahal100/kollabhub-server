import express from "express";

import {
  sendMessage,
  getMessagesBetweenUsers,
  getUserConversations,
} from "../controllers/messages.controller.js";
const router = express.Router();
import authMiddleware from "../middlewares/authMiddleware.js";


// ✅ Place specific routes before dynamic ones
router.get("/conversations/:userId",authMiddleware, getUserConversations);
router.get("/:user1/:user2",authMiddleware, getMessagesBetweenUsers);
router.post("/",authMiddleware, sendMessage);

export default router;

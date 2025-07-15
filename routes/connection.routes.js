import express from "express";
import {
  sendConnectionRequest,
  getReceivedRequests,
  getSentRequests,
  getAcceptedConnections,
  updateConnectionStatus,
} from "../controllers/connection.controller.js";

const router = express.Router();

router.post("/send", sendConnectionRequest);
router.get("/received/:userId", getReceivedRequests);
router.get("/sent/:userId", getSentRequests);
router.get("/accepted/:userId", getAcceptedConnections);
router.put("/:connectionId/status", updateConnectionStatus);

export default router;

import express from "express";
import {
  createCampaign,
  getAllCampaigns,
  getBrandCampaigns,
  getCampaignsByBrand,
  applyToCampaign,
  getAppliedCampaigns,
  updateCampaign,
  updateApplicationStatus,
  getCampaignById
} from "../controllers/campaign.controller.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/all", getAllCampaigns);
router.get("/brand/:userId", getCampaignsByBrand);

// Protected routes
router.post("/new", authMiddleware, createCampaign);
router.get("/campaigns/brand", authMiddleware, getBrandCampaigns);
router.post("/apply/:campaignId", authMiddleware, applyToCampaign);
router.get("/applied", authMiddleware, getAppliedCampaigns);
router.put("/edit/:campaignId", authMiddleware, updateCampaign);
router.get("/:campaignId", authMiddleware, getCampaignById);
router.put("/:campaignId/:status/:creatorId", authMiddleware, updateApplicationStatus);

export default router;

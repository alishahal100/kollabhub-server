import express from "express";
import { getCreators, getBrands } from "../controllers/userController.js";

const router = express.Router();

router.get("/creators", getCreators);
router.get("/brands", getBrands);

export default router;

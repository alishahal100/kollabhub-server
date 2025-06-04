import express from 'express';
import { handleOnboarding } from '../controllers/onboardingController.js';
import multer from 'multer';

const upload = multer();
const router = express.Router();

router.post(
  '/',
  upload.fields([
    { name: 'portfolio', maxCount: 5 },
    { name: 'logo', maxCount: 1 }
  ]),
  handleOnboarding
);

export default router;
// src/routes/userRoutes.ts
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile
} from '../../src/controllers/userController';
import { authMiddleware } from '../../src/middleware/auth';
import upload from '../../src/config/multer';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);

export default router;
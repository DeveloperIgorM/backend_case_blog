import { Router } from 'express';
import uploadImage from '../controllers/uploadController';
import { authMiddleware } from '../middleware/auth'; // CORRIGIDO PARA 'auth'

import upload from '../config/multer';

const router = Router();

router.post('/image', authMiddleware, upload.single('image'), uploadImage);

export default router;
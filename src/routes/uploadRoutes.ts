
import { Router } from 'express';
import { uploadImage } from '../../src/controllers/uploadController';
import { authenticateToken } from '../middleware/auth'; 

import  upload  from '../config/multer'
 
const router = Router();

// Rota para upload de imagem
router.post('/image', authenticateToken, upload.single('image'), uploadImage);

export default router;
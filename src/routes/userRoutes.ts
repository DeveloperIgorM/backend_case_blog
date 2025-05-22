// src/routes/userRoutes.ts
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getProfile,      // <--- Função existente
  updateProfile    // <--- Nova função para atualizar perfil
} from '../../src/controllers/userController';
import { authMiddleware } from '../../src/middleware/auth'; // Certifique-se de que este caminho está correto
import upload from '../../src/config/multer'; // <--- Importe o Multer para upload de avatar

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authMiddleware, getProfile);

// === NOVA ROTA: ATUALIZAR PERFIL ===
// Use upload.single('avatar') se você permitir que o usuário faça upload de uma nova imagem de avatar
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile); // 'avatar' é o nome do campo FormData

export default router;
// src/routes/articleRoutes.ts
import { Router } from 'express';
import {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  likeArticle,        
  checkIfLiked 
} from '../../src/controllers/articleController';
import { authMiddleware } from '../../src/middleware/auth'; 
import upload from '../../src/config/multer';

const router = Router();

// Rota para criar artigo (com upload de imagem)
router.post('/', authMiddleware, upload.single('image'), createArticle); // 'image' é o nome do campo FormData

router.get('/', getAllArticles);
router.get('/:id', getArticleById);

// Rota para atualizar artigo (com upload de imagem opcional)
router.put('/:id', authMiddleware, upload.single('image'), updateArticle); // 'image' é o nome do campo FormData

router.delete('/:id', authMiddleware, deleteArticle);

// === NOVAS ROTAS DE CURTIDAS ===
router.post('/:id/like', authMiddleware, likeArticle);
router.get('/:id/liked', authMiddleware, checkIfLiked);

export default router;
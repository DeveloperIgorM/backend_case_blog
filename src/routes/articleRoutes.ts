import express from "express";
import {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} from "../controllers/articleController";

import { authenticateToken } from "../../src/middleware/auth";

const router = express.Router();

router.post("/", authenticateToken, createArticle);
router.get("/", getAllArticles);
router.get("/:id", getArticleById);
router.put("/:id", authenticateToken, updateArticle);
router.delete("/:id", authenticateToken, deleteArticle);

export default router;

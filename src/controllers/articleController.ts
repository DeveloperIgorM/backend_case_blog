import { Request, Response } from 'express';
import db from '../config/db';

export const createArticle = async (req: Request, res: Response) => {
  const { titulo, conteudo } = req.body;
  const userId = req.user?.id;

  try {
    await db.query(
      'INSERT INTO articles (titulo, conteudo, autor_id, data_publicacao) VALUES (?, ?, ?, NOW())',
      [titulo, conteudo, userId]
    );

    res.status(201).json({ message: 'Artigo criado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar artigo' });
  }
};

export const getAllArticles = async (_req: Request, res: Response) => {
  const [rows] = await db.query('SELECT * FROM articles ORDER BY data_publicacao DESC');
  res.json(rows);
};

export const getArticleById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const [rows] = await db.query('SELECT * FROM articles WHERE id = ?', [id]);
  res.json(rows[0]);
};

export const updateArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, conteudo } = req.body;
  const userId = req.user?.id;

  await db.query(
    'UPDATE articles SET titulo = ?, conteudo = ?, data_alteracao = NOW() WHERE id = ? AND autor_id = ?',
    [titulo, conteudo, id, userId]
  );

  res.json({ message: 'Artigo atualizado' });
};

export const deleteArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  await db.query('DELETE FROM articles WHERE id = ? AND autor_id = ?', [id, userId]);
  res.json({ message: 'Artigo removido' });
};
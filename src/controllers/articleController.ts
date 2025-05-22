
import { Request, Response } from 'express';
import db from '../config/db';


export const createArticle = async (req: Request, res: Response) => {
  const { titulo, conteudo, image_url } = req.body; 
  const userId = req.user?.id; 

  // Verificando se o usuário está autenticado
  if (!userId) {
    return res.status(401).json({ message: 'Acesso não autorizado !Usuário não autenticado.' });
  }

  try {
    const [result]: any = await db.query( 
      'INSERT INTO articles (titulo, conteudo, image_url, autor_id, data_publicacao) VALUES (?, ?, ?, ?, NOW())', 
      [titulo, conteudo, image_url, userId] 
    );

    res.status(201).json({ message: 'Artigo criado com sucesso!', id: result.insertId }); 
  } catch (err: any) { 
    console.error('Erro ao criar artigo:', err); 
    res.status(500).json({ message: 'Erro interno ao criar artigo.' });
  }
};

export const getAllArticles = async (_req: Request, res: Response) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles ORDER BY data_publicacao DESC');
    res.status(200).json(rows); 
  } catch (err: any) {
    console.error('Erro ao buscar todos os artigos:', err);
    res.status(500).json({ message: 'Erro interno ao listar artigos.' });
  }
};

export const getArticleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [rows]: any = await db.query('SELECT * FROM articles WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Artigo não encontrado.' });
    }

    res.status(200).json(rows[0]); 
  } catch (err: any) {
    console.error(`Erro ao buscar artigo com ID ${id}:`, err);
    res.status(500).json({ message: 'Erro interno ao buscar artigo.' });
  }
};

export const updateArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, conteudo, image_url } = req.body;
  const userId = req.user?.id;

  // Verificando se o usuário está autenticado
  if (!userId) {
    return res.status(401).json({ message: 'Acesso não autorizado! Usuário não autenticado.' });
  }

  try {
    
    // Verificando se o artigo já existe e se o usuário logado é o autor
    const [articleRows]: any = await db.query('SELECT autor_id FROM articles WHERE id = ?', [id]);

    if (articleRows.length === 0) {
      return res.status(404).json({ message: 'Artigo não encontrado para atualização.' });
    }

    if (articleRows[0].autor_id !== userId) {
      // O usuário logado não é o autor do artigo
      return res.status(403).json({ message: 'Você não tem permissão para atualizar este artigo.' });
    }

   
    const [result]: any = await db.query(
      'UPDATE articles SET titulo = ?, conteudo = ?, image_url = ?, data_alteracao = NOW() WHERE id = ?', 
      [titulo, conteudo, image_url, id] 
    );

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: 'O artigo não foi encontrado.' });
    }

    res.status(200).json({ message: 'Artigo atualizado com sucesso!' });
  } catch (err: any) {
    console.error(`Erro ao atualizar artigo ${id}:`, err);
    res.status(500).json({ message: 'Erro interno ao atualizar artigo.' });
  }
};

export const deleteArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificando se o usuário está autenticado
  if (!userId) {
    return res.status(401).json({ message: 'Acesso não autorizado: Usuário não autenticado.' });
  }

  try {
    // Verificando se o artigo existe e se o usuário logado é o autor
    const [articleRows]: any = await db.query('SELECT autor_id FROM articles WHERE id = ?', [id]);

    if (articleRows.length === 0) {
      return res.status(404).json({ message: 'Artigo não encontrado para exclusão.' });
    }

    if (articleRows[0].autor_id !== userId) {
      // O usuário logado não é o autor do artigo
      return res.status(403).json({ message: 'Você não tem permissão para excluir este artigo.' });
    }

   
    const [result]: any = await db.query('DELETE FROM articles WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Artigo não encontrado ou já foi excluído.' });
    }

    res.status(200).json({ message: 'Artigo removido com sucesso!' });
  } catch (err: any) {
    console.error(`Erro ao deletar artigo ${id}:`, err);
    res.status(500).json({ message: 'Erro interno ao remover artigo.' });
  }
};
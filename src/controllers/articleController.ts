// src/controllers/articleController.ts
import { Request, Response } from 'express';
import db from '../config/db';

// IMPORTANTE: Adicione esta tipagem para auxiliar o TypeScript a reconhecer req.user
// Certifique-se de que seu types/express.d.ts está configurado corretamente
// Se estiver tendo problemas de tipagem, pode usar 'as any' para contornar temporariamente
// Ex: const userId = (req as any).user?.id;
// No entanto, o ideal é que a declaração em types/express.d.ts resolva isso.

export const createArticle = async (req: Request, res: Response) => {
  const { titulo, conteudo, image_url } = req.body; // <-- Adicionado image_url
  const userId = req.user?.id; // Usando a tipagem estendida de req.user

  // Validação: Verifique se o usuário está autenticado
  if (!userId) {
    return res.status(401).json({ message: 'Acesso não autorizado: Usuário não autenticado.' });
  }

  try {
    const [result]: any = await db.query( // Adicionei ': any' para o result para acesso a 'insertId'
      'INSERT INTO articles (titulo, conteudo, image_url, autor_id, data_publicacao) VALUES (?, ?, ?, ?, NOW())', // <-- Incluído image_url
      [titulo, conteudo, image_url, userId] // <-- Incluído image_url no array de valores
    );

    res.status(201).json({ message: 'Artigo criado com sucesso!', id: result.insertId }); // Retorna o ID do novo artigo
  } catch (err: any) { // Tipagem para o erro para poder acessar 'err.message' ou 'err.code'
    console.error('Erro ao criar artigo:', err); // Loga o erro completo para depuração
    // Aqui você pode adicionar lógica para erros específicos do banco de dados (ex: ER_DUP_ENTRY)
    res.status(500).json({ message: 'Erro interno ao criar artigo.' });
  }
};

export const getAllArticles = async (_req: Request, res: Response) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles ORDER BY data_publicacao DESC');
    res.status(200).json(rows); // Retorna 200 OK
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

    res.status(200).json(rows[0]); // Retorna 200 OK com o artigo
  } catch (err: any) {
    console.error(`Erro ao buscar artigo com ID ${id}:`, err);
    res.status(500).json({ message: 'Erro interno ao buscar artigo.' });
  }
};

export const updateArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, conteudo, image_url } = req.body; // <-- Adicionado image_url
  const userId = req.user?.id;

  // Validação: Verifique se o usuário está autenticado
  if (!userId) {
    return res.status(401).json({ message: 'Acesso não autorizado: Usuário não autenticado.' });
  }

  try {
    // 1. Verificar se o artigo existe e se o usuário logado é o autor
    const [articleRows]: any = await db.query('SELECT autor_id FROM articles WHERE id = ?', [id]);

    if (articleRows.length === 0) {
      return res.status(404).json({ message: 'Artigo não encontrado para atualização.' });
    }

    if (articleRows[0].autor_id !== userId) {
      // O usuário logado não é o autor do artigo
      return res.status(403).json({ message: 'Proibido: Você não tem permissão para atualizar este artigo.' });
    }

    // 2. Se tudo estiver ok, proceed com a atualização
    const [result]: any = await db.query(
      'UPDATE articles SET titulo = ?, conteudo = ?, image_url = ?, data_alteracao = NOW() WHERE id = ?', // <-- Incluído image_url
      [titulo, conteudo, image_url, id] // <-- Incluído image_url nos valores
    );

    // O affectedRows pode ser 0 se os dados enviados forem idênticos aos existentes
    // ou se, por algum motivo, a query não encontrou o artigo (mas já checamos acima)
    if (result.affectedRows === 0) {
      return res.status(200).json({ message: 'Nenhuma alteração foi necessária ou o artigo não foi encontrado.' });
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

  // Validação: Verifique se o usuário está autenticado
  if (!userId) {
    return res.status(401).json({ message: 'Acesso não autorizado: Usuário não autenticado.' });
  }

  try {
    // 1. Verificar se o artigo existe e se o usuário logado é o autor
    const [articleRows]: any = await db.query('SELECT autor_id FROM articles WHERE id = ?', [id]);

    if (articleRows.length === 0) {
      return res.status(404).json({ message: 'Artigo não encontrado para exclusão.' });
    }

    if (articleRows[0].autor_id !== userId) {
      // O usuário logado não é o autor do artigo
      return res.status(403).json({ message: 'Proibido: Você não tem permissão para excluir este artigo.' });
    }

    // 2. Se tudo estiver ok, procede com a exclusão
    const [result]: any = await db.query('DELETE FROM articles WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      // Isso é improvável de acontecer após a verificação de existência,
      // mas é uma boa prática ter uma fallback.
      return res.status(404).json({ message: 'Artigo não encontrado ou já foi excluído.' });
    }

    res.status(200).json({ message: 'Artigo removido com sucesso!' });
  } catch (err: any) {
    console.error(`Erro ao deletar artigo ${id}:`, err);
    res.status(500).json({ message: 'Erro interno ao remover artigo.' });
  }
};
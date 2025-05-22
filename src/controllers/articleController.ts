
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
    const query = `
      SELECT
          a.id,
          a.titulo,
          a.conteudo,
          a.image_url,
          a.autor_id,
          u.nome AS autor_nome,         
          u.avatar_url AS autor_avatar_url, 
          a.data_publicacao,
          a.data_alteracao,
          a.status,
          COUNT(l.id) AS curtidas_count 
      FROM
          articles a
      JOIN
          users u ON a.autor_id = u.id 
      LEFT JOIN
          likes l ON a.id = l.article_id 
      GROUP BY
          a.id, u.id, a.titulo, a.conteudo, a.image_url, a.autor_id, a.data_publicacao, a.data_alteracao, a.status
      ORDER BY
          a.data_publicacao DESC;
    `;
    const [rows] = await db.query(query);
    res.status(200).json(rows);
  } catch (err: any) {
    console.error('Erro ao buscar todos os artigos:', err);
    res.status(500).json({ message: 'Erro interno ao listar artigos.' });
  }
};

export const getArticleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT
          a.id,
          a.titulo,
          a.conteudo,
          a.image_url,
          a.autor_id,
          u.nome AS autor_nome,
          u.avatar_url AS autor_avatar_url,
          a.data_publicacao,
          a.data_alteracao,
          a.status,
          COUNT(l.id) AS curtidas_count
      FROM
          articles a
      JOIN
          users u ON a.autor_id = u.id
      LEFT JOIN
          likes l ON a.id = l.article_id
      WHERE
          a.id = ?
      GROUP BY
          a.id, u.id, a.titulo, a.conteudo, a.image_url, a.autor_id, a.data_publicacao, a.data_alteracao, a.status
      ORDER BY
          a.data_publicacao DESC;
    `;
    const [rows]: any = await db.query(query, [id]);

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
  const { titulo, conteudo } = req.body;
  const userId = req.user?.id;
  const newImageFile = req.file; 

  if (!userId) {
   
    if (newImageFile) {
      try {
        await fs.promises.unlink(path.resolve(__dirname, '..', '..', newImageFile.path));
      } catch (unlinkErr) {
        console.error('Erro ao remover arquivo após falha de autenticação:', unlinkErr);
      }
    }
    return res.status(401).json({ message: 'Acesso não autorizado! Usuário não autenticado.' });
  }

  try {
    const [articleRows]: any = await db.query('SELECT autor_id, image_url FROM articles WHERE id = ?', [id]);
    if (articleRows.length === 0) {
      if (newImageFile) { // Se um novo arquivo foi enviado mas o artigo não existe, remove-o
        await fs.promises.unlink(path.resolve(__dirname, '..', '..', newImageFile.path));
      }
      return res.status(404).json({ message: 'Artigo não encontrado para atualização.' });
    }
    const existingArticle = articleRows[0];

    if (existingArticle.autor_id !== userId) {
      if (newImageFile) { // Se um novo arquivo foi enviado mas o usuário não tem permissão, remove-o
        await fs.promises.unlink(path.resolve(__dirname, '..', '..', newImageFile.path));
      }
      return res.status(403).json({ message: 'Você não tem permissão para atualizar este artigo.' });
    }

    let finalImageUrl = existingArticle.image_url; // Por padrão, mantém a imagem existente
    if (newImageFile) { // Se um novo arquivo foi enviado
      const oldImagePath = existingArticle.image_url ? path.join(__dirname, '../../', existingArticle.image_url) : null;
      finalImageUrl = `uploads/${newImageFile.filename}`; 

      // Deletar a imagem antiga, se existir e for diferente da nova
      if (oldImagePath && fs.existsSync(oldImagePath)) {
        try {
          await fs.promises.unlink(oldImagePath);
        } catch (unlinkError) {
          console.warn('Erro ao deletar imagem antiga:', unlinkError);
        }
      }
    } else if (req.body.image_url === null || req.body.image_url === '') { 
        if (existingArticle.image_url) {
            try {
                const oldImagePath = path.join(__dirname, '../../', existingArticle.image_url);
                if (fs.existsSync(oldImagePath)) {
                    await fs.promises.unlink(oldImagePath);
                }
            } catch (unlinkError) {
                console.warn('Erro ao deletar imagem antiga na remoção explícita:', unlinkError);
            }
        }
        finalImageUrl = null;
    }


    const [result]: any = await db.query(
      'UPDATE articles SET titulo = ?, conteudo = ?, image_url = ?, data_alteracao = NOW() WHERE id = ?',
      [titulo, conteudo, finalImageUrl, id]
    );

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: 'O artigo não foi encontrado.' });
    }

    res.status(200).json({ message: 'Artigo atualizado com sucesso!' });
  } catch (err: any) {
    console.error(`Erro ao atualizar artigo ${id}:`, err);
    
    if (newImageFile) {
      try {
        await fs.promises.unlink(path.resolve(__dirname, '..', '..', newImageFile.path));
      } catch (unlinkErr) {
        console.error('Erro ao remover novo arquivo após falha na atualização:', unlinkErr);
      }
    }
    res.status(500).json({ message: 'Erro interno ao atualizar artigo.' });
  }
};

export const deleteArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Acesso não autorizado: Usuário não autenticado.' });
  }

  try {
    const [articleRows]: any = await db.query('SELECT autor_id, image_url FROM articles WHERE id = ?', [id]);
    if (articleRows.length === 0) {
      return res.status(404).json({ message: 'Artigo não encontrado para exclusão.' });
    }
    const existingArticle = articleRows[0];

    if (existingArticle.autor_id !== userId) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir este artigo.' });
    }

    // Deletar a imagem associada, se houver
    if (existingArticle.image_url) {
        try {
            const imagePath = path.join(__dirname, '../../', existingArticle.image_url);
            if (fs.existsSync(imagePath)) {
                await fs.promises.unlink(imagePath);
            }
        } catch (unlinkError) {
            console.warn('Erro ao deletar imagem do artigo:', unlinkError);
        }
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

export const likeArticle = async (req: Request, res: Response) => {
  const { id } = req.params; // ID do artigo
  const userId = req.user?.id; // ID do usuário logado, do authMiddleware

  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  try {
    // Verificar se o artigo existe
    const [articleCheck]: any = await db.query('SELECT id FROM articles WHERE id = ?', [id]);
    if (articleCheck.length === 0) {
      return res.status(404).json({ message: 'Artigo não encontrado.' });
    }

    // Tentar encontrar a curtida existente
    const [existingLikes]: any = await db.query(
      'SELECT id FROM likes WHERE article_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingLikes.length > 0) {
      // Se já existe, descurtir (remover)
      await db.query('DELETE FROM likes WHERE id = ?', [existingLikes[0].id]);
      return res.status(200).json({ message: 'Artigo descurtido com sucesso!', liked: false });
    } else {
      // Se não existe, curtir (inserir)
      await db.query('INSERT INTO likes (article_id, user_id) VALUES (?, ?)', [id, userId]);
      return res.status(201).json({ message: 'Artigo curtido com sucesso!', liked: true });
    }
  } catch (error) {
    console.error('Erro ao curtir/descurtir artigo:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const checkIfLiked = async (req: Request, res: Response) => {
  const { id } = req.params; // ID do artigo
  const userId = req.user?.id; // ID do usuário logado

  if (!userId) {
    return res.status(200).json({ liked: false }); // Não está logado, então não pode ter curtido
  }

  try {
    const [likes]: any = await db.query(
      'SELECT id FROM likes WHERE article_id = ? AND user_id = ?',
      [id, userId]
    );
    res.status(200).json({ liked: likes.length > 0 });
  } catch (error) {
    console.error('Erro ao verificar curtida:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
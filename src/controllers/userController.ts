// src/controllers/userController.ts
import { Request, Response } from 'express';
import db from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { unlink } from 'fs/promises'; // Para deletar avatar antigo
import path from 'path'; // Para construir caminhos de arquivo
import fs from 'fs'; // Importe 'fs' para fs.existsSync

const SECRET = process.env.JWT_SECRET || 'segredo';

// Extender a interface Request para adicionar 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        nome?: string;
      };
      file?: Express.Multer.File; // Para o upload de avatar
    }
  }
}

export const registerUser = async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    await db.query(
      'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, hashedPassword]
    );
    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(409).json({ message: 'Email já cadastrado.' });
    }
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  try {
    // Removido 'sobrenome' da query SELECT
    const [rows]: any = await db.query('SELECT id, nome, email, senha, avatar_url FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
    const user = rows[0];
    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(401).json({ message: 'Senha incorreta' });
    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, SECRET, { expiresIn: '1h' });
    // Removido 'sobrenome' do objeto user retornado
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, avatar_url: user.avatar_url } });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }
  try {
    // Removido 'sobrenome' da query SELECT
    const [rows]: any = await db.query('SELECT id, nome, email, avatar_url FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  // Removido 'sobrenome' da desestruturação do body
  const { nome, email, removeAvatar } = req.body;
  const newAvatarFile = req.file;

  if (!userId) {
    if (newAvatarFile) {
      try {
        // Caminho corrigido para garantir que sempre aponta para a pasta 'uploads' na raiz do projeto
        await unlink(path.resolve(__dirname, '..', '..', 'uploads', newAvatarFile.filename));
      } catch (unlinkErr) {
        console.error('Erro ao remover arquivo após falha de autenticação (updateProfile):', unlinkErr);
      }
    }
    return res.status(401).json({ message: 'Acesso não autorizado! Usuário não autenticado.' });
  }

  try {
    // Removido 'sobrenome' da query SELECT
    const [userRows]: any = await db.query('SELECT nome, email, avatar_url FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      if (newAvatarFile) {
        await unlink(path.resolve(__dirname, '..', '..', 'uploads', newAvatarFile.filename));
      }
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    const currentUser = userRows[0];

    let queryParts: string[] = [];
    let queryValues: any[] = [];
    let updatedFields: any = { ...currentUser };

    // Lógica para atualizar 'nome'
    if (nome !== undefined && nome !== currentUser.nome) {
      queryParts.push('nome = ?');
      queryValues.push(nome);
      updatedFields.nome = nome;
    }

    // A seção de 'sobrenome' foi completamente removida

    // Lógica para atualizar 'email'
    if (email !== undefined && email !== currentUser.email) {
      const [existingEmail]: any = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existingEmail.length > 0) {
        if (newAvatarFile) {
          await unlink(path.resolve(__dirname, '..', '..', 'uploads', newAvatarFile.filename));
        }
        return res.status(409).json({ message: 'Este email já está em uso por outro usuário.' });
      }
      queryParts.push('email = ?');
      queryValues.push(email);
      updatedFields.email = email;
    }

    // Lógica para atualizar 'avatar_url'
    let newAvatarUrl: string | null = currentUser.avatar_url;

    if (newAvatarFile) {
      // O Multer já salva o arquivo em 'uploads/', então o path do arquivo já virá com 'uploads/' ou apenas o nome do arquivo.
      // É crucial que `newAvatarFile.filename` seja apenas o nome do arquivo, e `uploads/` seja o diretório raiz.
      // O caminho completo no DB deve ser `uploads/nome-do-arquivo.ext`.
      newAvatarUrl = `uploads/${newAvatarFile.filename}`;
      
      const oldAvatarPath = currentUser.avatar_url ? path.join(__dirname, '../../', currentUser.avatar_url) : null;
      
      queryParts.push('avatar_url = ?');
      queryValues.push(newAvatarUrl);
      updatedFields.avatar_url = newAvatarUrl;

      // Deleta o avatar antigo se existir e não for o padrão
      if (oldAvatarPath && fs.existsSync(oldAvatarPath)) {
        try {
          await unlink(oldAvatarPath);
        } catch (unlinkError) {
          console.warn('Erro ao deletar avatar antigo:', unlinkError);
        }
      }
    } else if (removeAvatar === 'true') { // Se o frontend explicitamente pediu para remover o avatar
        if (currentUser.avatar_url) {
            const oldAvatarPath = path.join(__dirname, '../../', currentUser.avatar_url);
            if (fs.existsSync(oldAvatarPath)) {
                try {
                    await unlink(oldAvatarPath);
                } catch (unlinkErr) {
                    console.warn('Erro ao remover avatar antigo (requisição de remoção):', unlinkErr);
                }
            }
        }
        queryParts.push('avatar_url = ?');
        queryValues.push(null); // Define avatar_url como null no DB
        updatedFields.avatar_url = null;
    }


    // Se não há alterações a serem feitas, retorne uma mensagem
    if (queryParts.length === 0) {
      // Retorna o usuário atualizado mesmo que não haja alterações para garantir consistência
      return res.status(200).json({ message: 'Nenhuma alteração foi fornecida.', user: updatedFields });
    }

    // Construir e executar a query de atualização
    const updateQuery = `UPDATE users SET ${queryParts.join(', ')}, updated_at = NOW() WHERE id = ?`;
    queryValues.push(userId); // Adicione o userId ao final dos valores

    const [result]: any = await db.query(updateQuery, queryValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado para atualização.' });
    }

    // Busque o usuário atualizado novamente para garantir que os dados estão frescos do DB
    // Removido 'sobrenome' da query SELECT final
    const [finalUserRows]: any = await db.query('SELECT id, nome, email, avatar_url FROM users WHERE id = ?', [userId]);
    const finalUpdatedUser = finalUserRows[0];

    res.status(200).json({ message: 'Perfil atualizado com sucesso!', user: finalUpdatedUser });

  } catch (err: any) {
    console.error('Erro ao atualizar perfil do usuário:', err);
    if (newAvatarFile) { // Se um novo arquivo foi enviado e a operação falhou, remova-o
      try {
        await unlink(path.resolve(__dirname, '..', '..', 'uploads', newAvatarFile.filename));
      } catch (unlinkErr) {
        console.error('Erro ao remover novo arquivo após falha na atualização (updateProfile):', unlinkErr);
      }
    }
    res.status(500).json({ message: 'Erro interno ao atualizar perfil.' });
  }
};
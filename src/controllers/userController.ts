// src/controllers/UserController.ts
import { Request, Response } from 'express';
import db from '../config/db';
import bcrypt from 'bcrypt'; // Se for permitir a atualização de senha
import jwt from 'jsonwebtoken';
import { unlink } from 'fs/promises'; // Para deletar avatar antigo
import path from 'path'; // Para construir caminhos de arquivo

const SECRET = process.env.JWT_SECRET || 'segredo';

// Extender a interface Request para adicionar 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        nome?: string; // Se você quiser que o nome esteja no token também
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
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) { // Erro de chave duplicada (e.g., email)
      return res.status(409).json({ message: 'Email já cadastrado.' });
    }
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  try {
    const [rows]: any = await db.query('SELECT id, nome, email, senha, avatar_url FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
    const user = rows[0];
    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(401).json({ message: 'Senha incorreta' });
    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, SECRET, { expiresIn: '1h' });
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

// === NOVO ENDPOINT: ATUALIZAR PERFIL ===
export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { nome, email, senha } = req.body;
  const newAvatarFile = req.file;

  if (!userId) {
    if (newAvatarFile) { // Se um novo arquivo foi enviado e a operação falhou por auth
      try {
        await unlink(path.resolve(__dirname, '..', '..', newAvatarFile.path));
      } catch (unlinkErr) {
        console.error('Erro ao remover arquivo após falha de autenticação (updateProfile):', unlinkErr);
      }
    }
    return res.status(401).json({ message: 'Acesso não autorizado! Usuário não autenticado.' });
  }

  try {
    const [userRows]: any = await db.query('SELECT nome, email, senha, avatar_url FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      if (newAvatarFile) {
        await unlink(path.resolve(__dirname, '..', '..', newAvatarFile.path));
      }
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    const currentUser = userRows[0];

    let queryParts: string[] = [];
    let queryValues: any[] = [];

    if (nome !== undefined && nome !== currentUser.nome) { // Use 'undefined' para verificar se foi enviado
      queryParts.push('nome = ?');
      queryValues.push(nome);
    }
    if (email !== undefined && email !== currentUser.email) {
      const [existingEmail]: any = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existingEmail.length > 0) {
        if (newAvatarFile) {
          await unlink(path.resolve(__dirname, '..', '..', newAvatarFile.path));
        }
        return res.status(409).json({ message: 'Este email já está em uso por outro usuário.' });
      }
      queryParts.push('email = ?');
      queryValues.push(email);
    }
    if (senha) { // Se uma nova senha for fornecida
      const hashedPassword = await bcrypt.hash(senha, 10);
      queryParts.push('senha = ?');
      queryValues.push(hashedPassword);
    }

    let newAvatarUrl: string | null = currentUser.avatar_url;
    if (newAvatarFile) {
      const oldAvatarPath = currentUser.avatar_url ? path.join(__dirname, '../../', currentUser.avatar_url) : null;
      newAvatarUrl = `uploads/${newAvatarFile.filename}`;
      queryParts.push('avatar_url = ?');
      queryValues.push(newAvatarUrl);

      if (oldAvatarPath && fs.existsSync(oldAvatarPath)) {
        try {
          await unlink(oldAvatarPath);
        } catch (unlinkError) {
          console.warn('Erro ao deletar avatar antigo:', unlinkError);
        }
      }
    } else if (req.body.avatar_url === null || req.body.avatar_url === '') { // Se o frontend pediu para remover o avatar explicitamente
        if (currentUser.avatar_url) {
            const oldAvatarPath = path.join(__dirname, '../../', currentUser.avatar_url);
            if (fs.existsSync(oldAvatarPath)) {
                try {
                    await unlink(oldAvatarPath);
                } catch (unlinkErr) {
                    console.warn('Erro ao remover avatar antigo (null request):', unlinkErr);
                }
            }
        }
        queryParts.push('avatar_url = ?');
        queryValues.push(null);
        newAvatarUrl = null;
    }


    if (queryParts.length === 0) {
      return res.status(200).json({ message: 'Nenhuma alteração foi fornecida.' });
    }

    const updateQuery = `UPDATE users SET ${queryParts.join(', ')}, updated_at = NOW() WHERE id = ?`;
    queryValues.push(userId);

    const [result]: any = await db.query(updateQuery, queryValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado para atualização.' });
    }

    const updatedUser = {
      id: userId,
      nome: nome !== undefined ? nome : currentUser.nome,
      email: email !== undefined ? email : currentUser.email,
      avatar_url: newAvatarUrl
    };

    res.status(200).json({ message: 'Perfil atualizado com sucesso!', user: updatedUser });

  } catch (err: any) {
    console.error('Erro ao atualizar perfil do usuário:', err);
    if (newAvatarFile) { // Se um novo arquivo foi enviado e a operação falhou
      try {
        await unlink(path.resolve(__dirname, '..', '..', newAvatarFile.path));
      } catch (unlinkErr) {
        console.error('Erro ao remover novo arquivo após falha na atualização (updateProfile):', unlinkErr);
      }
    }
    res.status(500).json({ message: 'Erro interno ao atualizar perfil.' });
  }
};
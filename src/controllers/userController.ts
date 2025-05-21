import { Request, Response } from 'express';
import db from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'segredo';

export const registerUser = async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);

    await db.query(
      'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, hashedPassword]
    );

    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  try {
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

    const user = rows[0];

    const match = await bcrypt.compare(senha, user.senha);

    if (!match) return res.status(401).json({ message: 'Senha incorreta' });

    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
};
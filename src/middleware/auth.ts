// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Extender a interface Request para adicionar 'user'
declare global {
  namespace Express {
    interface Request {
      user?: { // Tipagem do objeto user que será adicionado ao req
        id: number;
        nome: string; // Adicione nome aqui
        email: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido ou formato inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não está definido nas variáveis de ambiente.');
    }
    // Assegure que o payload decodificado corresponde à tipagem do req.user
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: number; nome: string; email: string };
    req.user = { id: decoded.id, nome: decoded.nome, email: decoded.email }; // Popula req.user
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }
    return res.status(401).json({ message: 'Token inválido.' });
  }
};
// import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import articleRoutes from './routes/articleRoutes';
import express, { Application, Request, Response, NextFunction } from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas principais
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Tratamento de rota não encontrada (404)
app.use((req: Request, res: Response) => { // Importar Request, Response do 'express'
  res.status(404).json({ message: 'Rota não encontrada.' });
});

// Tratamento de erros globais (500)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => { // Importar NextFunction
  console.error(err.stack); // Loga o stack trace do erro para depuração
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
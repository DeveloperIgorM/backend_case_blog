
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, Request, Response, NextFunction } from 'express';

import userRoutes from './routes/userRoutes';
import articleRoutes from './routes/articleRoutes';
import uploadRoutes from './routes/uploadRoutes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Arquivos estáticos vão ficar na nesta pasta, para que as imagens possam ser acessadas via URL
app.use('/uploads', express.static('uploads')); 

// Rotas principais
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/uploads', uploadRoutes);

// Tratamento de rota
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});

// Tratamento de erros globais 
app.use((err: Error, req: Request, res: Response, next: NextFunction) => { 
  console.error(err.stack); 
  res.status(500).json({ message: 'Erro interno do servidor.' });
});


app.listen(PORT, () => {  
  console.log(`Servidor rodando na porta ${PORT}!`);
  console.log(`URL:http//localhost:${PORT}/api`)
});
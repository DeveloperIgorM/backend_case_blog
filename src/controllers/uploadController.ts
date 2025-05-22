
import { Request, Response } from 'express';
import { unlink } from 'fs/promises'; 
import path from 'path'; 

export const uploadImage = async (req: Request, res: Response) => {
  // O Multer anexa o arquivo em req.file
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo de imagem foi enviado.' });
  }

  // imagePath caminho relativo para o banco
  // imageUrl URL completa 
  const imageUrl = `<span class="math-inline">\{req\.protocol\}\://</span>{req.get('host')}/uploads/${req.file.filename}`;
  const imagePath = `uploads/${req.file.filename}`;

  try {
    res.status(200).json({  
      message: 'Upload de imagem realizado com sucesso!',
      fileName: req.file.filename,
      filePath: imagePath, 
      fileUrl: imageUrl,   
    });
  } catch (err: any) {
    if (req.file) {
      try {
        await unlink(path.resolve(__dirname, '..', '..', 'uploads', req.file.filename));
        console.warn(`Arquivo ${req.file.filename} removido devido a erro.`);
      } catch (unlinkErr) {
        console.error('Erro ao remover arquivo após falha no processamento:', unlinkErr);
      }
    }
    console.error('Erro no upload da imagem:', err);
    res.status(500).json({ message: 'Erro ao processar o upload da imagem.' });
  }
};
export default uploadImage; 
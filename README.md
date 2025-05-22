# Backend Blog API

Este é o backend da API para um sistema de blog completo, desenvolvido com Node.js, Express e TypeScript, utilizando MySQL/MariaDB como banco de dados. Ele fornece as funcionalidades de autenticação de usuários e operações CRUD (Criar, Ler, Atualizar, Deletar) para artigos, incluindo upload de imagens.

## 🚀 Tecnologias Utilizadas

- **Node.js:** Ambiente de execução JavaScript no servidor.  
- **Express.js:** Framework web para Node.js.  
- **TypeScript:** Linguagem de programação que adiciona tipagem estática ao JavaScript.  
- **MySQL / MariaDB:** Sistema de gerenciamento de banco de dados relacional.  
- **`mysql2`:** Driver MySQL para Node.js (com suporte a Promises).  
- **`bcrypt`:** Biblioteca para hashing de senhas.  
- **`jsonwebtoken` (JWT):** Para autenticação baseada em tokens.  
- **`multer`:** Middleware para lidar com `multipart/form-data` (upload de arquivos).  
- **`dotenv`:** Para carregar variáveis de ambiente.  
- **`cors`:** Para habilitar Cross-Origin Resource Sharing.

## 💻 Funcionalidades

  - **Autenticação de Usuário:**
  - Registro de novos usuários (hash de senha com bcrypt).
  - Login de usuários e geração de JWT.

- **Gestão de Artigos:**
  - Criação de artigos (protegido por autenticação, associado ao usuário logado).
  - Listagem de todos os artigos (público).
  - Visualização de artigo por ID (público).
  - Atualização de artigos (protegido por autenticação, apenas o autor pode atualizar).
  - Exclusão de artigos (protegido por autenticação, apenas o autor pode excluir).

- **Upload de Imagens:**
  - Endpoint dedicado para upload de imagens, salvando-as localmente no diretório `uploads/` do servidor.
  - O caminho da imagem é então armazenado na coluna `image_url` da tabela `articles` no banco de dados, associando-a ao artigo.

- **Tratamento de Erros Robustos:**
  - Middlewares para lidar com rotas não encontradas (404) e erros internos do servidor (500).
  - Mensagens de erro específicas para validações de dados e autorização.

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/en/download/) (versão LTS recomendada)  
- [npm](https://www.npmjs.com/get-npm) (vem com o Node.js)  
- [MySQL](https://dev.mysql.com/downloads/mysql/) ou [MariaDB](https://mariadb.org/download/)  
- [HeidiSQL](https://www.heidisql.com/download.php) (opcional, mas útil)

---

### Passos de Configuração

#### 1. Clone o Repositório

```bash
git clone https://github.com/DeveloperIgorM/backend_case_blog.git
cd backend_case_blog

```
#### 2. Instale as Dependências

```bash
npm install
```

### 3. Crie o Banco de Dados:
```bash
CREATE DATABASE controle_blog;

```
### Importe a Estrutura (Schema):

```bash
mysql -u seu_usuario -p controle_blog < dump.sql
```
Será solicitada a senha do seu usuário MySQL/MariaDB. Em ambientes locais, o usuário é root e a senha pode ser vazia ou a que você configurou.

#### Via HeidiSQL:

Conecte-se ao seu servidor.

Selecione o banco controle_blog.

Vá em Ferramentas → Executar arquivo SQL... e selecione o dump.sql.

#### 4. Variáveis de Ambiente

```bash
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_do_mysql
DB_NAME=controle_blog
JWT_SECRET=sua_chave_secreta_jwt
```

## ▶️ Como Rodar o Servidor

### Para iniciar o servidor com hot-reloading e TypeScript:

```bash
npm run dev
```
A aplicação estará disponível em: http://localhost:3000


## 🧪 Testando a API
### Use ferramentas como Postman, Insomnia ou Thunder Client (VS Code).

### Usuários (Autenticação)
#### Registrar usuário </br>
POST /api/users/register </br>

Body:

```json
{
  "nome": "Seu Nome",
  "email": "seu@email.com",
  "senha": "suasenha"
}
```

### Login de usuário </br>
POST /api/users/login </br>

Body:

```json
{
  "email": "seu@email.com",
  "senha": "suasenha"
}
```

### Upload de Imagens
#### Upload de imagem </br>
POST /api/upload/image </br>

Headers:

```makefile
Authorization: Bearer SEU_TOKEN_JWT

```

#### Body (form-data):

```makefile
Key: image
Value: (arquivo)
```

### Artigos
#### Criar artigo </br>
POST /api/articles </br>

Headers:

```makefile
Authorization: Bearer SEU_TOKEN_JWT
```
#### Body:

```json
{
  "titulo": "Título",
  "conteudo": "Conteúdo",
  "image_url": "uploads/imagem.png" 
}
```

#### Listar todos os artigos
GET /api/articles </br>

#### Buscar artigo por ID
GET /api/articles/:id </br>

#### Atualizar artigo
PUT /api/articles/:id </br>

Headers:

```makefile
Authorization: Bearer SEU_TOKEN_JWT

```
#### Body:

```json
{
  "titulo": "Novo título",
  "conteudo": "Novo conteúdo",
  "image_url": "uploads/nova_imagem.png" 
}
```

#### Deletar artigo </br>
DELETE /api/articles/:id </br>

Headers:

```makefile
Authorization: Bearer SEU_TOKEN_JWT
```

## 🫱🏾‍🫲🏾 Contribuição
Contribuições são bem-vindas!
Sinta-se à vontade para abrir issues ou pull requests.


## 📄 Licença
Este projeto está licenciado sob a Licença MIT.

# QRFleet

Sistema completo de gestão de frotas com QR Codes para acesso público às informações das viaturas.

## 🚀 Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** + **MySQL**
- **NextAuth** (Autenticação)
- **ShadCN UI** (Componentes)
- **TailwindCSS**
- **QRCode** (Geração de QR Codes)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- MySQL instalado e rodando
- phpMyAdmin (opcional, para gerenciamento do banco)

## 🔧 Instalação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="mysql://usuario:senha@localhost:3306/qrfleet"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-um-secret-aleatorio-aqui-com-openssl-rand-base64-32"
```

**Importante:** 
- Substitua `usuario` e `senha` pelas credenciais do seu MySQL
- Substitua `localhost:3306` se seu MySQL estiver em outro host/porta
- Gere um `NEXTAUTH_SECRET` aleatório (pode usar: `openssl rand -base64 32`)

### 3. Configurar Banco de Dados

#### Criar o banco de dados no MySQL:

```sql
CREATE DATABASE qrfleet;
```

Ou use o phpMyAdmin para criar o banco.

#### Gerar o cliente Prisma e criar as tabelas:

```bash
# Gerar o cliente Prisma
npm run db:generate

# Criar as tabelas no banco (recomendado para desenvolvimento)
npm run db:push

# OU usar migrations (recomendado para produção)
npm run db:migrate
```

### 4. Criar Primeiro Usuário Admin

Execute o script de seed para criar o usuário admin padrão:

```bash
npm run db:seed
```

**Credenciais padrão:**
- Email: `admin@qrfleet.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

### 5. Iniciar o Servidor

```bash
npm run dev
```

O sistema estará disponível em: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
QRFleet/
├── app/
│   ├── admin/              # Área administrativa
│   │   ├── viaturas/       # CRUD de viaturas
│   │   ├── documentos/     # CRUD de documentos
│   │   ├── eventos/        # CRUD de eventos
│   │   └── utilizadores/   # CRUD de utilizadores (apenas admin)
│   ├── api/                # API Routes
│   │   ├── viaturas/       # Endpoints de viaturas
│   │   ├── documentos/     # Endpoints de documentos
│   │   ├── eventos/        # Endpoints de eventos
│   │   ├── utilizadores/   # Endpoints de utilizadores
│   │   └── auth/           # NextAuth
│   ├── viatura/            # Páginas públicas (acessíveis via QR Code)
│   ├── login/              # Página de login
│   └── layout.tsx          # Layout principal
├── components/
│   └── ui/                 # Componentes ShadCN UI
├── lib/
│   ├── auth.ts             # Configuração NextAuth
│   ├── prisma.ts           # Cliente Prisma
│   ├── qrcode.ts           # Geração de QR Codes
│   └── utils.ts            # Utilitários
├── prisma/
│   ├── schema.prisma       # Schema do banco de dados
│   └── seed.ts             # Script de seed
└── types/
    └── next-auth.d.ts      # Tipos TypeScript para NextAuth
```

## 🗄️ Modelos de Banco de Dados

### Tabelas Principais

1. **viaturas**
   - Informações das viaturas (matrícula, modelo, marca, ano, foto, descrição)
   - QR Code gerado automaticamente

2. **documentos**
   - Documentos vinculados às viaturas (título, tipo, arquivo, data de vencimento)

3. **eventos**
   - Eventos/histórico das viaturas (manutenção, reparação, inspeção, etc.)
   - Tipos: MANUTENCAO, REPARACAO, INSPECAO, COMBUSTIVEL, OUTRO

4. **utilizadores**
   - Usuários do sistema (admin e editor)
   - Autenticação com NextAuth

5. **logs**
   - Logs de todas as ações realizadas no sistema

### Relacionamentos

- Viatura → Documentos (1:N)
- Viatura → Eventos (1:N)
- Viatura → Logs (1:N)
- Utilizador → Logs (1:N)

## 🔐 Autenticação

### Roles (Funções)

- **ADMIN**: Acesso total ao sistema, incluindo gestão de utilizadores
- **EDITOR**: Pode gerenciar viaturas, documentos e eventos, mas não utilizadores

### Middleware

O middleware protege automaticamente todas as rotas `/admin/*`, redirecionando usuários não autenticados para `/login`.

## 📡 Endpoints da API

### Viaturas
- `GET /api/viaturas` - Listar todas as viaturas
- `POST /api/viaturas` - Criar nova viatura (autenticado)
- `GET /api/viaturas/[id]` - Buscar viatura por ID
- `PUT /api/viaturas/[id]` - Atualizar viatura (autenticado)
- `DELETE /api/viaturas/[id]` - Deletar viatura (autenticado)
- `GET /api/viatura/[matricula]` - Buscar viatura por matrícula (público)

### Documentos
- `GET /api/documentos?viaturaId=xxx` - Listar documentos (opcional: filtrar por viatura)
- `POST /api/documentos` - Criar documento (autenticado)
- `GET /api/documentos/[id]` - Buscar documento
- `PUT /api/documentos/[id]` - Atualizar documento (autenticado)
- `DELETE /api/documentos/[id]` - Deletar documento (autenticado)

### Eventos
- `GET /api/eventos?viaturaId=xxx` - Listar eventos (opcional: filtrar por viatura)
- `POST /api/eventos` - Criar evento (autenticado)
- `GET /api/eventos/[id]` - Buscar evento
- `PUT /api/eventos/[id]` - Atualizar evento (autenticado)
- `DELETE /api/eventos/[id]` - Deletar evento (autenticado)

### Utilizadores
- `GET /api/utilizadores` - Listar utilizadores (apenas admin)
- `POST /api/utilizadores` - Criar utilizador (apenas admin)
- `GET /api/utilizadores/[id]` - Buscar utilizador
- `PUT /api/utilizadores/[id]` - Atualizar utilizador (admin ou próprio usuário)
- `DELETE /api/utilizadores/[id]` - Deletar utilizador (apenas admin)

## 🎯 Funcionalidades

### Área Administrativa (`/admin`)

1. **Dashboard** (`/admin`)
   - Estatísticas gerais (número de viaturas, documentos, eventos)

2. **Viaturas** (`/admin/viaturas`)
   - Listar todas as viaturas
   - Criar nova viatura (gera QR Code automaticamente)
   - Editar viatura
   - Deletar viatura
   - Visualizar QR Code

3. **Documentos** (`/admin/documentos`)
   - Listar todos os documentos
   - Criar documento vinculado a uma viatura
   - Editar documento
   - Deletar documento

4. **Eventos** (`/admin/eventos`)
   - Listar todos os eventos
   - Criar evento vinculado a uma viatura
   - Editar evento
   - Deletar evento

5. **Utilizadores** (`/admin/utilizadores`) - Apenas Admin
   - Listar utilizadores
   - Criar novo utilizador
   - Editar utilizador
   - Deletar utilizador

### Página Pública (`/viatura/[matricula]`)

Acessível via QR Code, mostra:
- Foto da viatura
- Informações (marca, modelo, matrícula, ano, descrição)
- Lista de documentos para download
- Histórico cronológico de eventos

### QR Code

- Gerado automaticamente ao criar uma viatura
- URL: `http://localhost:3000/viatura/[matricula]`
- Armazenado como Data URL no banco de dados
- Pode ser visualizado e baixado em `/admin/viaturas/[id]/qr`

## 🧪 Como Testar o Projeto

### 1. Inicializar o Sistema

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env (veja seção acima)

# 3. Criar banco de dados no MySQL
# (via phpMyAdmin ou linha de comando)

# 4. Gerar Prisma Client e criar tabelas
npm run db:generate
npm run db:push

# 5. Criar usuário admin
npm run db:seed

# 6. Iniciar servidor
npm run dev
```

### 2. Fazer Login

1. Acesse `http://localhost:3000`
2. Você será redirecionado para `/login`
3. Use as credenciais:
   - Email: `admin@qrfleet.com`
   - Senha: `admin123`

### 3. Criar uma Viatura

1. Após login, vá para `/admin/viaturas`
2. Clique em "Nova Viatura"
3. Preencha os dados:
   - Matrícula: `AB-12-CD`
   - Marca: `Toyota`
   - Modelo: `Corolla`
   - Ano: `2020`
   - Foto: URL de uma imagem (opcional)
   - Descrição: Descrição da viatura (opcional)
4. Clique em "Salvar"
5. O QR Code será gerado automaticamente!

### 4. Visualizar QR Code

1. Na lista de viaturas, clique no ícone de QR Code
2. Ou acesse `/admin/viaturas/[id]/qr`
3. Você pode baixar o QR Code clicando em "Download QR Code"

### 5. Adicionar Documentos

1. Vá para `/admin/documentos`
2. Clique em "Novo Documento"
3. Selecione a viatura
4. Preencha título, tipo, URL do arquivo
5. Salve

### 6. Adicionar Eventos

1. Vá para `/admin/eventos`
2. Clique em "Novo Evento"
3. Selecione a viatura
4. Preencha título, tipo, data, custo (opcional)
5. Salve

### 7. Acessar Página Pública

1. Escaneie o QR Code com seu celular
2. Ou acesse diretamente: `http://localhost:3000/viatura/[matricula]`
3. A página mostrará todas as informações, documentos e eventos

### 8. Criar Novo Utilizador (Admin)

1. Vá para `/admin/utilizadores`
2. Clique em "Novo Utilizador"
3. Preencha nome, email, senha e função (ADMIN ou EDITOR)
4. Salve

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa ESLint
- `npm run db:generate` - Gera Prisma Client
- `npm run db:push` - Sincroniza schema com banco (desenvolvimento)
- `npm run db:migrate` - Cria migration (produção)
- `npm run db:studio` - Abre Prisma Studio
- `npm run db:seed` - Executa script de seed

## 🔒 Segurança

- Todas as rotas `/admin/*` são protegidas por middleware
- Senhas são hasheadas com bcrypt
- NextAuth gerencia sessões de forma segura
- Validação de permissões (admin vs editor)

## 📄 Licença

Este projeto foi criado para uso interno.

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique se todas as dependências estão instaladas
2. Confirme que o MySQL está rodando
3. Verifique as variáveis de ambiente no `.env`
4. Confirme que o banco de dados foi criado e as tabelas foram geradas

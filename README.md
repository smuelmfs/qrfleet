# QRFleet

Sistema completo de gestão de frotas e equipamentos com QR Codes para acesso público às informações. Suporta veículos e máquinas com funcionalidades avançadas de importação, auditoria e multi-idioma.

## 🚀 Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** + **MySQL** (XAMPP/Local)
- **NextAuth** (Autenticação)
- **ShadCN UI** (Componentes)
- **TailwindCSS**
- **QRCode** (Geração de QR Codes)
- **xlsx** (Importação de planilhas Excel)
- **jsPDF** (Geração de PDFs)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- XAMPP ou MySQL instalado e rodando
- phpMyAdmin (opcional, para gerenciamento do banco)

## 🔧 Instalação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database (MySQL Local - XAMPP)
DATABASE_URL="mysql://root:@localhost:3306/qrfleet"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-um-secret-aleatorio-aqui-com-openssl-rand-base64-32"
```

**Importante:** 
- Para XAMPP, geralmente o usuário é `root` e a senha está vazia
- Substitua `localhost:3306` se seu MySQL estiver em outro host/porta
- Gere um `NEXTAUTH_SECRET` aleatório (pode usar: `openssl rand -base64 32`)

### 3. Configurar Banco de Dados

#### Iniciar MySQL (XAMPP)

1. Abra o XAMPP Control Panel
2. Inicie o serviço MySQL

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
│   ├── module-equipament/
│   │   └── admin/              # Área administrativa
│   │       ├── equipment/      # CRUD de equipamentos (veículos e máquinas)
│   │       │   ├── new/        # Criar novo equipamento
│   │       │   └── [id]/       # Editar equipamento
│   │       │       └── qr/     # Visualizar QR Code
│   │       ├── documents/      # Listagem de documentos
│   │       ├── events/          # Listagem de eventos
│   │       ├── users/           # CRUD de utilizadores (apenas admin)
│   │       ├── audit/           # Logs de auditoria (apenas admin)
│   │       └── profile/         # Perfil do usuário
│   ├── equipament-view/         # Páginas públicas (acessíveis via QR Code)
│   │   └── [matricula]/         # Visualização pública do equipamento
│   ├── api/                     # API Routes
│   │   ├── equipamentos/        # Endpoints de equipamentos
│   │   │   └── import-excel/     # Importação de planilhas Excel
│   │   ├── documentos/          # Endpoints de documentos
│   │   ├── eventos/             # Endpoints de eventos
│   │   ├── utilizadores/        # Endpoints de utilizadores
│   │   ├── auditoria/           # Endpoints de auditoria
│   │   └── auth/                # NextAuth
│   ├── modules/                  # Página de módulos
│   ├── login/                    # Página de login
│   └── layout.tsx                # Layout principal
├── components/
│   ├── ui/                       # Componentes ShadCN UI
│   │   └── pagination.tsx       # Componente de paginação
│   └── ConfirmDeleteDialog.tsx   # Dialog de confirmação de exclusão
├── contexts/
│   └── I18nContext.tsx           # Contexto de internacionalização
├── lib/
│   ├── auth.ts                  # Configuração NextAuth
│   ├── prisma.ts                # Cliente Prisma
│   ├── qrcode.ts                # Geração de QR Codes
│   ├── i18n.ts                  # Traduções (PT, EN, FR)
│   ├── audit.ts                 # Funções de auditoria
│   └── utils.ts                 # Utilitários
├── prisma/
│   ├── schema.prisma            # Schema do banco de dados
│   └── seed.ts                  # Script de seed
└── types/
    └── next-auth.d.ts           # Tipos TypeScript para NextAuth
```

## 🗄️ Modelos de Banco de Dados

### Tabelas Principais

1. **equipamentos** (anteriormente "viaturas")
   - Informações dos equipamentos (veículos e máquinas)
   - **Veículos**: matrícula, modelo, marca, ano, foto, descrição
   - **Máquinas**: parque, modelo, marca, ano, peso (tonnage), foto, descrição
   - QR Code gerado automaticamente
   - Configurações de visibilidade pública

2. **documentos**
   - Documentos vinculados aos equipamentos
   - Título, tipo, arquivo, data de vencimento
   - Configurações de visibilidade pública

3. **eventos**
   - Eventos/histórico dos equipamentos (manutenção, reparação, inspeção, etc.)
   - Tipos: MANUTENCAO, REPARACAO, INSPECAO, COMBUSTIVEL, OUTRO
   - Data, custo, descrição
   - Configurações de visibilidade pública

4. **utilizadores**
   - Usuários do sistema (admin e editor)
   - Autenticação com NextAuth
   - Roles: ADMIN, EDITOR

5. **auditoria**
   - Logs de todas as ações realizadas no sistema
   - Registra: CREATE, UPDATE, DELETE, LOGIN
   - Detalhes da ação, IP, User-Agent, timestamp

### Relacionamentos

- Equipamento → Documentos (1:N)
- Equipamento → Eventos (1:N)
- Equipamento → Auditoria (1:N)
- Utilizador → Auditoria (1:N)

## 🌍 Internacionalização (i18n)

O sistema suporta 3 idiomas:
- **Português (PT)** - Padrão
- **English (EN)**
- **Français (FR)**

As traduções são gerenciadas em `lib/i18n.ts` e o idioma é selecionado através do componente `LanguageToggle` no header.

## 🔐 Autenticação

### Roles (Funções)

- **ADMIN**: Acesso total ao sistema, incluindo:
  - Gestão de utilizadores
  - Visualização de logs de auditoria
  - Todas as funcionalidades de EDITOR

- **EDITOR**: Pode gerenciar equipamentos, documentos e eventos, mas não utilizadores ou auditoria

### Middleware

O middleware protege automaticamente todas as rotas `/module-equipament/admin/*`, redirecionando usuários não autenticados para `/login`.

## 📡 Endpoints da API

### Equipamentos
- `GET /api/equipamentos` - Listar todos os equipamentos
- `POST /api/equipamentos` - Criar novo equipamento (autenticado)
- `GET /api/equipamentos/[id]` - Buscar equipamento por ID
- `PUT /api/equipamentos/[id]` - Atualizar equipamento (autenticado)
- `DELETE /api/equipamentos/[id]` - Deletar equipamento (autenticado)
- `GET /api/equipamento/[matricula]` - Buscar equipamento por matrícula/parque (público)
- `POST /api/equipamentos/import-excel` - Importar equipamentos de planilha Excel (autenticado)

### Documentos
- `GET /api/documentos?equipamentoId=xxx` - Listar documentos (opcional: filtrar por equipamento)
- `POST /api/documentos` - Criar documento (autenticado)
- `GET /api/documentos/[id]` - Buscar documento
- `PUT /api/documentos/[id]` - Atualizar documento (autenticado)
- `DELETE /api/documentos/[id]` - Deletar documento (autenticado)

### Eventos
- `GET /api/eventos?equipamentoId=xxx` - Listar eventos (opcional: filtrar por equipamento)
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

### Auditoria
- `GET /api/auditoria` - Listar logs de auditoria (apenas admin)

## 🎯 Funcionalidades

### Área Administrativa (`/module-equipament/admin`)

1. **Equipamentos** (`/module-equipament/admin/equipment`)
   - Listar todos os equipamentos (veículos e máquinas)
   - Filtros avançados (tipo, marca, modelo, ano)
   - Busca por identificador, marca, modelo
   - Paginação configurável (10, 25, 50, 100 itens por página)
   - Criar novo equipamento
   - Importação em massa via Excel (formato: PARC, MARQUE, MODELE, TONNAGE, ANNEE)
   - Editar equipamento
   - Deletar equipamento
   - Visualizar e baixar QR Code (PDF)
   - Configurar visibilidade pública de informações, documentos e eventos

2. **Documentos** (`/module-equipament/admin/documents`)
   - Listar todos os documentos
   - Filtrar por equipamento
   - Busca por título, tipo, descrição
   - Paginação
   - Visualizar documentos vinculados a equipamentos
   - Configurar visibilidade pública

3. **Eventos** (`/module-equipament/admin/events`)
   - Listar todos os eventos
   - Filtrar por equipamento e tipo
   - Busca por título, descrição
   - Paginação
   - Visualizar eventos vinculados a equipamentos
   - Configurar visibilidade pública

4. **Utilizadores** (`/module-equipament/admin/users`) - Apenas Admin
   - Listar utilizadores
   - Criar novo utilizador
   - Editar utilizador
   - Deletar utilizador
   - Gerenciar roles (ADMIN/EDITOR)

5. **Auditoria** (`/module-equipament/admin/audit`) - Apenas Admin
   - Visualizar logs de todas as ações do sistema
   - Filtrar por ação, entidade, usuário
   - Detalhes traduzidos automaticamente
   - Informações de IP e User-Agent

6. **Perfil** (`/module-equipament/admin/profile`)
   - Atualizar informações pessoais
   - Alterar senha

### Página Pública (`/equipament-view/[matricula]`)

Acessível via QR Code, mostra:
- Foto do equipamento
- Informações básicas (marca, modelo, identificador, ano)
- Peso/tonnage (apenas para máquinas)
- Lista de documentos públicos para download
- Histórico cronológico de eventos públicos
- Interface responsiva e traduzida

### Importação de Excel

Funcionalidade para importar múltiplos equipamentos (máquinas) de uma planilha Excel:

**Formato esperado:**
- Colunas: `PARC`, `MARQUE`, `MODELE`, `TONNAGE` (opcional), `ANNEE`
- Validação automática de formato
- Criação automática de todos os registros válidos
- Geração automática de QR Codes
- Relatório de erros e sucessos

**Como usar:**
1. Acesse `/module-equipament/admin/equipment/new`
2. Selecione "Máquina" como tipo
3. Clique em "Importar do Excel"
4. Selecione o arquivo `.xlsx` ou `.xls`
5. O sistema validará e criará automaticamente todos os equipamentos

### QR Code

- Gerado automaticamente ao criar um equipamento
- URL: `http://localhost:3000/equipament-view/[matricula]` (veículos) ou `[parque]` (máquinas)
- Armazenado como Data URL no banco de dados
- Pode ser visualizado e baixado em PDF em `/module-equipament/admin/equipment/[id]/qr`
- PDF traduzido conforme idioma do usuário

### Visibilidade Pública

Cada equipamento permite configurar a visibilidade de:
- Informações básicas
- Documentos
- Eventos

Essas configurações controlam o que é exibido na página pública acessível via QR Code.

## 🧪 Como Testar o Projeto

### 1. Inicializar o Sistema

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env (veja seção acima)

# 3. Iniciar MySQL no XAMPP

# 4. Criar banco de dados no MySQL
# (via phpMyAdmin ou linha de comando)

# 5. Gerar Prisma Client e criar tabelas
npm run db:generate
npm run db:push

# 6. Criar usuário admin
npm run db:seed

# 7. Iniciar servidor
npm run dev
```

### 2. Fazer Login

1. Acesse `http://localhost:3000`
2. Você será redirecionado para `/login`
3. Use as credenciais:
   - Email: `admin@qrfleet.com`
   - Senha: `admin123`

### 3. Criar um Equipamento

#### Veículo:
1. Após login, vá para `/module-equipament/admin/equipment`
2. Clique em "Novo Equipamento"
3. Selecione "Veículo"
4. Preencha os dados:
   - Matrícula: `AB-12-CD`
   - Marca: `Toyota`
   - Modelo: `Corolla`
   - Ano: `2020`
   - Foto: URL de uma imagem (opcional)
   - Descrição: Descrição do veículo (opcional)
5. Clique em "Salvar"
6. O QR Code será gerado automaticamente!

#### Máquina:
1. Selecione "Máquina"
2. Preencha os dados:
   - Parque: `MAQ-001`
   - Marca: `Caterpillar`
   - Modelo: `320D`
   - Peso: `2T5` (opcional)
   - Ano: `2021`
   - Foto: URL de uma imagem (opcional)
   - Descrição: Descrição da máquina (opcional)
3. Clique em "Salvar"

### 4. Importar Equipamentos do Excel

1. Prepare uma planilha Excel com as colunas: `PARC`, `MARQUE`, `MODELE`, `TONNAGE` (opcional), `ANNEE`
2. Vá para `/module-equipament/admin/equipment/new`
3. Selecione "Máquina"
4. Clique em "Importar do Excel"
5. Selecione o arquivo
6. O sistema criará automaticamente todos os equipamentos válidos

### 5. Visualizar QR Code

1. Na lista de equipamentos, clique no ícone de QR Code
2. Ou acesse `/module-equipament/admin/equipment/[id]/qr`
3. Você pode baixar o QR Code em PDF clicando em "Download QR Code"

### 6. Configurar Visibilidade

1. Edite um equipamento
2. Vá para a aba "Visibilidade"
3. Configure o que será exibido publicamente:
   - Informações básicas
   - Documentos
   - Eventos
4. Clique em "Salvar Configurações"

### 7. Adicionar Documentos

1. Edite um equipamento
2. Vá para a aba "Documentos"
3. Clique em "Adicionar Documento"
4. Preencha título, tipo, URL do arquivo, data de vencimento
5. Configure a visibilidade pública
6. Salve

### 8. Adicionar Eventos

1. Edite um equipamento
2. Vá para a aba "Eventos"
3. Clique em "Adicionar Evento"
4. Preencha título, tipo, data, custo (opcional), descrição
5. Configure a visibilidade pública
6. Salve

### 9. Acessar Página Pública

1. Escaneie o QR Code com seu celular
2. Ou acesse diretamente: `http://localhost:3000/equipament-view/[matricula]` ou `[parque]`
3. A página mostrará todas as informações, documentos e eventos públicos configurados

### 10. Visualizar Auditoria (Admin)

1. Vá para `/module-equipament/admin/audit`
2. Visualize todos os logs de ações do sistema
3. Filtre por ação, entidade ou usuário

### 11. Gerenciar Usuários (Admin)

1. Vá para `/module-equipament/admin/users`
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
- `npm run add-user` - Adiciona novo usuário via CLI

## 🔒 Segurança

- Todas as rotas `/module-equipament/admin/*` são protegidas por middleware
- Senhas são hasheadas com bcrypt
- NextAuth gerencia sessões de forma segura
- Validação de permissões (admin vs editor)
- Auditoria completa de todas as ações
- Proteção CSRF através do NextAuth

## 📊 Funcionalidades Avançadas

### Paginação
- Todas as listagens suportam paginação
- Configurável: 10, 25, 50 ou 100 itens por página
- Navegação intuitiva com números de página
- Contador de resultados

### Filtros e Busca
- Filtros avançados em todas as listagens
- Busca em tempo real
- Combinação de múltiplos filtros
- Indicadores visuais de filtros ativos

### Responsividade
- Interface totalmente responsiva
- Layout adaptável para mobile, tablet e desktop
- Cards para mobile, tabelas para desktop

## 📄 Licença

Este projeto foi criado para uso interno.

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique se todas as dependências estão instaladas
2. Confirme que o MySQL (XAMPP) está rodando
3. Verifique as variáveis de ambiente no `.env`
4. Confirme que o banco de dados foi criado e as tabelas foram geradas
5. Verifique os logs do console para erros específicos

## 🔄 Changelog

### Versão Atual
- ✅ Suporte para veículos e máquinas
- ✅ Campo peso/tonnage para máquinas
- ✅ Importação em massa via Excel
- ✅ Sistema de auditoria completo
- ✅ Paginação em todas as listagens
- ✅ Internacionalização (PT, EN, FR)
- ✅ Configuração de visibilidade pública
- ✅ Gestão de usuários aprimorada
- ✅ Interface responsiva melhorada
- ✅ Geração de PDFs traduzidos

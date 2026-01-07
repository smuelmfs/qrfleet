# 🚀 Guia Rápido de Início

## ✅ Checklist antes de rodar

Siga estes passos na ordem:

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Instalar e Configurar XAMPP

1. **Baixe e instale XAMPP:** https://www.apachefriends.org/
2. **Abra o XAMPP Control Panel**
3. **Inicie o MySQL** (clique em "Start")
4. **Acesse phpMyAdmin:** http://localhost/phpmyadmin

### 3️⃣ Criar Banco de Dados

1. No phpMyAdmin, clique em **"Novo"** ou **"New"**
2. Nome do banco: `qrfleet`
3. Clique em **"Criar"**

### 4️⃣ Criar Arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com:

```env
DATABASE_URL="mysql://root@localhost:3306/qrfleet"
# URL base do sistema (use localhost em dev normal OU o domínio do ngrok)
# Exemplo dev local:  http://localhost:3000
# Exemplo com ngrok: https://SEU-SUBDOMINIO.ngrok-free.dev
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="qualquer-string-aleatoria-aqui-123456789"
```

**Nota:** XAMPP geralmente não tem senha no root. Se tiver senha, use: `mysql://root:SUA_SENHA@localhost:3306/qrfleet`

### 5️⃣ Configurar Prisma

```bash
# Gerar o cliente Prisma
npm run db:generate

# Criar as tabelas no banco
npm run db:push
```

### 6️⃣ Criar Usuário Admin

```bash
npm run db:seed
```

Isso criará um usuário admin com:
- **Email:** `admin@qrfleet.com`
- **Senha:** `admin123`

### 7️⃣ Iniciar o Servidor

```bash
npm run dev
```

### 8️⃣ Acessar o Sistema

Abra seu navegador em: **http://localhost:3000**

Você será redirecionado para `/login`

**Faça login com:**
- Email: `admin@qrfleet.com`
- Senha: `admin123`

## 🎯 Próximos Passos Após Login

1. **Criar uma Viatura:**
   - Vá em `/admin/viaturas`
   - Clique em "Nova Viatura"
   - Preencha os dados
   - O QR Code será gerado automaticamente!

2. **Visualizar QR Code:**
   - Na lista de viaturas, clique no ícone de QR Code
   - Ou acesse `/admin/viaturas/[id]/qr`

3. **Acessar Página Pública:**
   - Escaneie o QR Code
   - Ou acesse:
     - Em dev local: `http://localhost:3000/viatura/[matricula]`
     - Com ngrok: `https://SEU-SUBDOMINIO.ngrok-free.dev/viatura/[matricula]`

## ⚠️ Problemas Comuns

### Erro: "Cannot find module '@prisma/client'"
```bash
npm run db:generate
```

### Erro de conexão com MySQL
- Verifique se o MySQL está rodando
- Confirme as credenciais no `.env`
- Verifique se o banco `qrfleet` foi criado

### Erro: "NEXTAUTH_SECRET is missing"
- Certifique-se de que o arquivo `.env` existe
- Verifique se `NEXTAUTH_SECRET` está definido

### Erro ao fazer login
- Certifique-se de que executou `npm run db:seed`
- Verifique se o usuário foi criado no banco

## 📝 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor

# Banco de Dados
npm run db:generate      # Gerar Prisma Client
npm run db:push          # Sincronizar schema (dev)
npm run db:migrate       # Criar migration (prod)
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Criar usuário admin

# Build
npm run build            # Build para produção
npm run start            # Iniciar produção
```

## ✅ Tudo Pronto!

Se seguiu todos os passos, o sistema deve estar rodando perfeitamente! 🎉


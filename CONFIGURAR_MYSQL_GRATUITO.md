# 🗄️ Guia: Configurar MySQL Gratuito para Desenvolvimento

## 🚀 Opção 1: Railway (Recomendado)

### Passo 1: Criar conta no Railway
1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Database" → "MySQL"

### Passo 2: Obter string de conexão
1. Após criar o banco, clique nele
2. Vá na aba "Variables"
3. Copie a variável `DATABASE_URL` (formato: `mysql://user:password@host:port/database`)

### Passo 3: Configurar no projeto
1. Crie/edite o arquivo `.env` na raiz do projeto:
```env
DATABASE_URL="mysql://user:password@host:port/database"
NEXTAUTH_URL="https://seu-projeto.vercel.app"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

### Passo 4: Aplicar schema
```bash
npm run db:push
```

### Passo 5: Criar usuário admin
```bash
npm run db:seed
```

---

## 🆓 Opção 2: Aiven (Alternativa)

### Passo 1: Criar conta
1. Acesse: https://aiven.io
2. Crie conta gratuita
3. Crie um novo serviço "MySQL"
4. Escolha o plano gratuito

### Passo 2: Obter conexão
1. No dashboard, vá em "Overview"
2. Copie a "Connection string"
3. Use no `.env` como `DATABASE_URL`

---

## 🌐 Opção 3: db4free.net

### Passo 1: Criar conta
1. Acesse: https://www.db4free.net
2. Crie uma conta
3. Crie um novo banco de dados

### Passo 2: Configurar
- Host: `db4free.net`
- Port: `3306`
- Database: `seu_banco`
- User: `seu_usuario`
- Password: `sua_senha`

### String de conexão:
```env
DATABASE_URL="mysql://usuario:senha@db4free.net:3306/nome_do_banco"
```

---

## 📝 Configuração do .env

Crie um arquivo `.env` na raiz do projeto:

```env
# Database (substitua pela URL do seu banco MySQL)
DATABASE_URL="mysql://usuario:senha@host:port/database"

# NextAuth (para produção, use o domínio real)
NEXTAUTH_URL="https://seu-projeto.vercel.app"
# ou para desenvolvimento local:
# NEXTAUTH_URL="http://localhost:3000"

# Secret aleatório (gere com: openssl rand -base64 32)
NEXTAUTH_SECRET="sua-chave-secreta-aqui-123456789"
```

---

## 🔧 Após configurar o banco

1. **Gerar Prisma Client:**
```bash
npm run db:generate
```

2. **Aplicar schema:**
```bash
npm run db:push
```

3. **Criar usuário admin:**
```bash
npm run db:seed
```

4. **Iniciar servidor:**
```bash
npm run dev
```

---

## 🚀 Deploy no Vercel

1. **Conecte seu repositório GitHub ao Vercel**
2. **Configure as variáveis de ambiente no Vercel:**
   - `DATABASE_URL` → URL do seu MySQL
   - `NEXTAUTH_URL` → URL do seu projeto Vercel
   - `NEXTAUTH_SECRET` → Mesma chave secreta

3. **Deploy automático!**

---

## ⚠️ Importante

- **Railway**: Permite conexões externas, ideal para Vercel
- **db4free.net**: Pode ter limitações de conexões simultâneas
- **Aiven**: Tem tier gratuito limitado, mas funciona bem

---

## 🔐 Segurança

- **Nunca commite o arquivo `.env` no Git**
- Use variáveis de ambiente no Vercel
- Gere um `NEXTAUTH_SECRET` forte

---

## 📞 Suporte

Se tiver problemas:
1. Verifique se o banco aceita conexões externas
2. Confirme que a URL está correta
3. Teste a conexão localmente antes de fazer deploy


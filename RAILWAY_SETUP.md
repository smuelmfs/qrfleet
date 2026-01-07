# 🚂 Configuração Railway + Vercel

## 📋 Variáveis do Railway

O Railway fornece duas variáveis de conexão:

### 1. `MYSQL_PUBLIC_URL` ✅ **USE ESTA**
- **URL pública** - Acessível de fora do Railway
- **Use para:** Vercel, desenvolvimento local, qualquer conexão externa
- **Formato:** `mysql://root:senha@crossover.proxy.rlwy.net:38372/railway`

### 2. `MYSQL_URL` ❌ **NÃO USE**
- **URL interna** - Só funciona dentro da rede do Railway
- **Use para:** Apenas serviços rodando dentro do Railway
- **Formato:** `mysql://root:senha@mysql.railway.internal:3306/railway`

---

## 🔧 Configuração

### Para Desenvolvimento Local

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="mysql://root:IbbmqARtndJBmnfohEQpEwkwMKACAUpU@crossover.proxy.rlwy.net:38372/railway"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

### Para Vercel (Produção)

1. Acesse o dashboard do Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
DATABASE_URL = mysql://root:IbbmqARtndJBmnfohEQpEwkwMKACAUpU@crossover.proxy.rlwy.net:38372/railway
NEXTAUTH_URL = https://seu-projeto.vercel.app
NEXTAUTH_SECRET = mesma-chave-secreta-do-local
```

---

## ✅ Passos Após Configurar

1. **Gerar Prisma Client:**
```bash
npm run db:generate
```

2. **Aplicar Schema:**
```bash
npm run db:push
```

3. **Criar Usuário Admin:**
```bash
npm run db:seed
```

4. **Testar Localmente:**
```bash
npm run dev
```

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- **Nunca** commite o arquivo `.env` no Git
- Use variáveis de ambiente no Vercel
- Gere um `NEXTAUTH_SECRET` forte e único
- Mantenha a senha do banco segura

---

## 🐛 Troubleshooting

### Erro: "Can't reach database server"
- Verifique se está usando `MYSQL_PUBLIC_URL` (não `MYSQL_URL`)
- Confirme que a URL está correta
- Verifique se o banco está ativo no Railway

### Erro: "Access denied"
- Verifique usuário e senha na URL
- Confirme que o banco aceita conexões externas

### Erro no Vercel
- Verifique se as variáveis de ambiente estão configuradas
- Confirme que `NEXTAUTH_URL` aponta para o domínio correto do Vercel


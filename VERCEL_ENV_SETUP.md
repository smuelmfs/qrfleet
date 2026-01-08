# 🔧 Configuração de Variáveis de Ambiente no Vercel

## ⚠️ Problema: Login não funciona

Se o login não está funcionando no Vercel, verifique as seguintes variáveis de ambiente:

## 📋 Variáveis Obrigatórias

### 1. `DATABASE_URL`
```
mysql://root:senha@host:porta/database
```
**Exemplo:**
```
mysql://root:IbbmqARtndJBmnfohEQpEwkwMKACAUpU@crossover.proxy.rlwy.net:38372/railway
```

### 2. `NEXTAUTH_URL` ⚠️ **CRÍTICO**
**Deve ser exatamente o domínio do seu projeto Vercel**

**Exemplo:**
```
https://qrfleet.vercel.app
```

**OU se tiver domínio customizado:**
```
https://seu-dominio.com
```

⚠️ **IMPORTANTE:**
- **NÃO** use `http://localhost:3000` em produção
- **NÃO** use URLs com trailing slash (`/`)
- Use **HTTPS** (não HTTP)
- Use o domínio **exato** do Vercel

### 3. `NEXTAUTH_SECRET` ⚠️ **CRÍTICO**
**Deve ser uma string aleatória forte**

**Como gerar:**
```bash
openssl rand -base64 32
```

**OU use um gerador online:**
- https://generate-secret.vercel.app/32

**Exemplo:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

⚠️ **IMPORTANTE:**
- Use a **mesma** chave em desenvolvimento e produção (ou diferentes, mas consistentes)
- **Nunca** commite esta chave no Git
- Use pelo menos 32 caracteres

---

## 🔧 Como Configurar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as 3 variáveis:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
5. Selecione os ambientes: **Production**, **Preview**, **Development**
6. Clique em **Save**
7. **Redeploy** o projeto (ou faça um novo commit)

---

## ✅ Verificação

Após configurar, verifique:

1. **No Vercel Dashboard:**
   - Settings → Environment Variables
   - Confirme que as 3 variáveis estão lá
   - Confirme que estão habilitadas para Production

2. **No Console do Navegador (F12):**
   - Abra a aba Console
   - Tente fazer login
   - Veja se há erros no console

3. **No Vercel Logs:**
   - Vá em Deployments → Seu deployment → Logs
   - Procure por erros relacionados a NextAuth

---

## 🐛 Troubleshooting

### Erro: "NEXTAUTH_URL is not set"
- Configure `NEXTAUTH_URL` no Vercel
- Use o domínio exato do Vercel (com https://)

### Erro: "NEXTAUTH_SECRET is not set"
- Configure `NEXTAUTH_SECRET` no Vercel
- Gere uma chave forte (32+ caracteres)

### Login não redireciona
- Verifique se `NEXTAUTH_URL` está correto
- Verifique os logs do Vercel para erros

### "CredentialsSignin" error
- Verifique se o usuário existe no banco
- Verifique se a senha está correta
- Verifique se `DATABASE_URL` está correto

---

## 📝 Exemplo Completo

No Vercel, configure:

```
DATABASE_URL = mysql://root:senha@host:porta/database
NEXTAUTH_URL = https://qrfleet.vercel.app
NEXTAUTH_SECRET = sua-chave-secreta-aleatoria-aqui-32-caracteres-minimo
```

---

## 🔄 Após Configurar

1. **Redeploy** o projeto no Vercel
2. Aguarde o build completar
3. Teste o login novamente
4. Verifique os logs se ainda houver problemas


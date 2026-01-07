# 🔧 Resolver Problema XAMPP - Apache não inicia

## ⚠️ Problema
- MySQL está rodando ✅
- Apache não está rodando ❌
- phpMyAdmin não acessível (ERR_CONNECTION_REFUSED)

## ✅ Soluções

### Solução 1: Iniciar Apache no XAMPP Control Panel

1. **Abra o XAMPP Control Panel**
2. **Clique em "Start" no Apache**
3. Se der erro, veja a mensagem de erro

### Solução 2: Porta 80 em Uso

Se o Apache não iniciar, provavelmente a porta 80 está ocupada.

**Verificar o que está usando a porta 80:**
```powershell
netstat -ano | findstr :80
```

**Soluções:**

#### A) Parar o serviço que está usando a porta 80

Geralmente é:
- **IIS (Internet Information Services)**
- **Skype**
- **Outro servidor web**

**Parar IIS:**
```powershell
# Como Administrador
iisreset /stop
```

**Ou mudar a porta do Apache:**

1. Abra: `C:\xampp\apache\conf\httpd.conf`
2. Procure por: `Listen 80`
3. Mude para: `Listen 8080`
4. Salve
5. Reinicie o Apache

Depois acesse: http://localhost:8080/phpmyadmin

#### B) Mudar porta do Apache (Mais fácil)

1. No XAMPP Control Panel, clique em **"Config"** ao lado do Apache
2. Escolha **"httpd.conf"**
3. Procure por `Listen 80`
4. Mude para `Listen 8080`
5. Salve e feche
6. Reinicie o Apache

Acesse: http://localhost:8080/phpmyadmin

### Solução 3: Executar como Administrador

1. Feche o XAMPP Control Panel
2. Clique com botão direito no XAMPP Control Panel
3. Escolha **"Executar como administrador"**
4. Tente iniciar o Apache novamente

### Solução 4: Verificar Logs de Erro

1. No XAMPP Control Panel, clique em **"Logs"** ao lado do Apache
2. Veja qual é o erro
3. Copie a mensagem de erro

## 🚀 Alternativa: Usar MySQL sem phpMyAdmin

Se não conseguir fazer o Apache funcionar, você pode:

1. **Criar o banco via linha de comando:**
```bash
mysql -u root -e "CREATE DATABASE qrfleet;"
```

2. **Ou usar Prisma diretamente:**
```bash
npm run db:push
```

O Prisma criará as tabelas automaticamente se o banco existir, ou você pode criar o banco manualmente primeiro.

## ✅ Teste Rápido

Depois de iniciar o Apache:

1. Acesse: http://localhost/phpmyadmin
2. Se funcionar, crie o banco `qrfleet`
3. Configure o `.env`:
   ```env
   DATABASE_URL="mysql://root@localhost:3306/qrfleet"
   ```
4. Execute:
   ```bash
   npm run db:push
   ```


# Configuração de Variáveis de Ambiente

Este guia explica como configurar os arquivos `.env` para o backend e frontend funcionarem corretamente.

## 📁 Estrutura de Arquivos

```
PROFESSIONAL/
├── backend/
│   ├── .env                    # Arquivo de configuração (não versionado)
│   └── env.example.txt         # Exemplo de configuração
└── frontend/
    ├── .env.local              # Arquivo de configuração (não versionado)
    └── .env.example            # Exemplo de configuração
```

## 🔧 Backend (.env)

### Criar arquivo .env

```bash
cd backend
cp env.example.txt .env
```

### Editar .env

Abra o arquivo `.env` e configure as variáveis necessárias:

```env
# Server
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=forgetech_db
DB_USER=forgetech_user
DB_PASSWORD=forgetech_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=
# Nota: REDISUSER também é aceito como alias para REDIS_USER

# JWT (IMPORTANTE: Altere em produção!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-app-password

# ... outras configurações
```

### Como o Backend Carrega .env

O backend usa `dotenv` que carrega automaticamente o arquivo `.env` na raiz do diretório `backend/`:

```typescript
import dotenv from 'dotenv';
dotenv.config(); // Carrega .env automaticamente
```

## 🎨 Frontend (.env.local)

### Criar arquivo .env.local

```bash
cd frontend
cp .env.example .env.local
```

### Editar .env.local

```env
# API URL (Backend)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Importante:** No Next.js, apenas variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente.

### Como o Frontend Carrega .env.local

O Next.js carrega automaticamente arquivos `.env.local` na raiz do diretório `frontend/`. A ordem de prioridade é:

1. `.env.local` (maior prioridade, não versionado)
2. `.env.development` ou `.env.production` (baseado em NODE_ENV)
3. `.env` (menor prioridade)

## ✅ Verificação

### Backend

```bash
cd backend
node -e "require('dotenv').config(); console.log('API_URL:', process.env.API_URL)"
```

### Frontend

```bash
cd frontend
node -e "console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)"
```

## 🚀 Scripts de Inicialização

### Usando start.sh (Recomendado)

O script `start.sh` na raiz do projeto cria automaticamente os arquivos `.env` se não existirem:

```bash
./start.sh
```

### Manualmente

1. **Backend:**
   ```bash
   cd backend
   cp env.example.txt .env
   # Edite .env com suas configurações
   npm run dev
   ```

2. **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edite .env.local se necessário
   npm run dev
   ```

## 🔒 Segurança

### ⚠️ IMPORTANTE

- **NUNCA** commite arquivos `.env` ou `.env.local` no Git
- Use `.env.example` ou `env.example.txt` como templates
- Em produção, use variáveis de ambiente do sistema ou serviços como Vercel, Heroku, etc.

### Arquivos no .gitignore

Certifique-se de que o `.gitignore` contém:

```
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 🐛 Solução de Problemas

### Backend não carrega .env

1. Verifique se o arquivo está na raiz de `backend/`:
   ```bash
   ls -la backend/.env
   ```

2. Verifique se `dotenv` está instalado:
   ```bash
   cd backend && npm list dotenv
   ```

3. Verifique se `dotenv.config()` está sendo chamado antes de usar `process.env`

### Frontend não carrega .env.local

1. Verifique se o arquivo está na raiz de `frontend/`:
   ```bash
   ls -la frontend/.env.local
   ```

2. Reinicie o servidor de desenvolvimento:
   ```bash
   # Pare o servidor (Ctrl+C) e inicie novamente
   npm run dev
   ```

3. Verifique se a variável começa com `NEXT_PUBLIC_`:
   ```env
   # ✅ Correto
   NEXT_PUBLIC_API_URL=http://localhost:3001
   
   # ❌ Errado (não será exposta ao cliente)
   API_URL=http://localhost:3001
   ```

### Variáveis não aparecem

1. **Backend:** Reinicie o servidor após alterar `.env`
2. **Frontend:** Reinicie o servidor e limpe o cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

## 📝 Variáveis Importantes

### Backend

- `DB_*` - Configuração do banco de dados
- `REDIS_*` - Configuração do Redis (host, port, user, password)
- `JWT_SECRET` - Chave secreta para tokens JWT
- `SMTP_*` - Configuração de email
- `FRONTEND_URL` - URL do frontend (para CORS e links)

### Frontend

- `NEXT_PUBLIC_API_URL` - URL da API backend

## 🔄 Atualização

Se você atualizar `env.example.txt` ou `.env.example`, certifique-se de atualizar também seu arquivo `.env` ou `.env.local` com as novas variáveis.

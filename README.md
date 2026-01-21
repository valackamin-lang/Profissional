# FORGETECH Professional

Plataforma completa de gestão profissional com vagas, mentoria e eventos.

## Estrutura do Projeto

```
PROFESSIONAL/
├── backend/          # API Express.js + TypeScript
├── frontend/         # Next.js + React + TypeScript
├── shared/           # Types compartilhados
└── docker-compose.yml # PostgreSQL + Redis
```

## Tecnologias

### Backend
- Express.js + TypeScript
- PostgreSQL (Sequelize)
- Redis
- JWT Authentication
- OAuth2 (Google, LinkedIn)
- 2FA (TOTP)
- Stripe Integration
- Zoom/YouTube API

### Frontend
- Next.js 14+ (App Router)
- React + TypeScript
- Tailwind CSS
- React Query

## Configuração

### Pré-requisitos
- Node.js 18+ e npm
- Docker e Docker Compose
- Acesso ao Docker (usuário no grupo docker ou sudo)

### Instalação Rápida

1. **Execute o script de inicialização:**
   ```bash
   ./start.sh
   ```
   
   Este script irá:
   - Verificar Docker e npm
   - Criar arquivos .env se não existirem
   - Iniciar PostgreSQL e Redis
   - Instalar dependências

2. **Inicie os servidores de desenvolvimento:**
   ```bash
   ./start-dev.sh
   ```
   
   Ou manualmente:
   ```bash
   # Terminal 1 - Backend (porta 3001)
   cd backend && npm run dev
   
   # Terminal 2 - Frontend (porta 3000)
   cd frontend && npm run dev
   ```

### Instalação Manual

1. **Configure as variáveis de ambiente:**
   ```bash
   # Backend
   cp backend/env.example.txt backend/.env
   # Edite backend/.env com suas configurações
   
   # Frontend
   cp frontend/env.example.txt frontend/.env.local
   # Edite frontend/.env.local com suas configurações
   ```

2. **Inicie os serviços Docker:**
   ```bash
   docker-compose up -d
   ```

3. **Instale as dependências:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. **Inicie os servidores:**
   ```bash
   # Backend (porta 3001)
   cd backend
   npm run dev
   
   # Frontend (porta 3000)
   cd frontend
   npm run dev
   ```

### Popular banco de dados (Seeders)

Após iniciar os serviços, execute os seeders para popular o banco com dados iniciais:

```bash
cd backend
npm run seed
```

Isso criará:
- Roles e Permissions
- Usuário admin (admin@forgetech.com / admin123)
- Dados de exemplo (estudantes, mentor, parceiro, vagas, eventos, mentorias)

Ou execute seeders individuais:
```bash
npm run seed:roles    # Apenas roles e permissions
npm run seed:admin    # Apenas usuário admin
npm run seed:sample   # Apenas dados de exemplo
```

### Verificar se está funcionando

- Backend API: http://localhost:3001/health
- Frontend: http://localhost:3000
- Login Admin: admin@forgetech.com / admin123

## Funcionalidades

- ✅ Autenticação (JWT, OAuth2, 2FA)
- ✅ RBAC (Role-Based Access Control)
- ✅ Gestão de Perfis
- ✅ Motor de Vagas
- ✅ Feed Dinâmico
- ✅ Sistema de Notificações
- ✅ Integração Stripe
- ✅ Sistema de Comissões
- ✅ Integração de Vídeo (Zoom/YouTube)
- ✅ Moderação e Auditoria
- ✅ Dashboards por Role

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Obter usuário atual

### Perfis
- `GET /api/profiles/me` - Meu perfil
- `POST /api/profiles` - Criar perfil
- `PUT /api/profiles/:id` - Atualizar perfil

### Vagas
- `GET /api/jobs` - Listar vagas
- `POST /api/jobs` - Criar vaga
- `GET /api/jobs/:id` - Obter vaga
- `PUT /api/jobs/:id` - Atualizar vaga
- `POST /api/jobs/:jobId/applications` - Candidatar-se

### Feed
- `GET /api/feed` - Obter feed personalizado

### Notificações
- `GET /api/notifications` - Listar notificações
- `PUT /api/notifications/:id/read` - Marcar como lida

## Licença

ISC

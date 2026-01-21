#!/bin/bash

echo "🚀 Iniciando FORGETECH Professional..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando. Por favor, inicie o Docker primeiro.${NC}"
    echo "   Execute: sudo systemctl start docker (ou inicie o Docker Desktop)"
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm não encontrado. Instalando Node.js e npm...${NC}"
    echo "   Execute: sudo apt update && sudo apt install -y nodejs npm"
    exit 1
fi

# Criar arquivos .env se não existirem
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}📝 Criando backend/.env...${NC}"
    cp backend/env.example.txt backend/.env
    echo -e "${GREEN}✅ backend/.env criado. Por favor, edite com suas configurações.${NC}"
fi

if [ ! -f frontend/.env.local ]; then
    echo -e "${YELLOW}📝 Criando frontend/.env.local...${NC}"
    cp frontend/env.example.txt frontend/.env.local
    echo -e "${GREEN}✅ frontend/.env.local criado.${NC}"
fi

# Iniciar Docker Compose
echo -e "${GREEN}🐳 Iniciando PostgreSQL e Redis...${NC}"
docker-compose up -d

# Aguardar serviços ficarem prontos
echo -e "${YELLOW}⏳ Aguardando serviços ficarem prontos...${NC}"
sleep 5

# Verificar se os serviços estão rodando
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Serviços Docker iniciados com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao iniciar serviços Docker${NC}"
    exit 1
fi

# Instalar dependências do backend
echo -e "${GREEN}📦 Instalando dependências do backend...${NC}"
cd backend
if [ ! -d node_modules ]; then
    npm install
fi
cd ..

# Instalar dependências do frontend
echo -e "${GREEN}📦 Instalando dependências do frontend...${NC}"
cd frontend
if [ ! -d node_modules ]; then
    npm install
fi
cd ..

echo -e "${GREEN}✅ Tudo pronto!${NC}"
echo ""
echo "Para popular o banco de dados com dados iniciais:"
echo "  cd backend && npm run seed"
echo ""
echo "Para iniciar os servidores:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Ou execute: ./start-dev.sh para iniciar ambos em paralelo"

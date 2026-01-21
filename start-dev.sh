#!/bin/bash

echo "🚀 Iniciando servidores de desenvolvimento..."

# Verificar se os serviços Docker estão rodando
if ! docker-compose ps | grep -q "Up"; then
    echo "⚠️  Serviços Docker não estão rodando. Execute ./start.sh primeiro"
    exit 1
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Iniciar backend
echo "🔧 Iniciando backend na porta 3001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar um pouco antes de iniciar o frontend
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend na porta 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servidores iniciados!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar os servidores"

# Aguardar processos
wait

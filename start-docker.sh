#!/bin/bash

echo "🐳 Iniciando containers Docker..."

cd "$(dirname "$0")"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Tentando iniciar com sudo..."
    sudo docker-compose up -d
else
    echo "✅ Docker está acessível, iniciando containers..."
    docker-compose up -d
fi

# Aguardar um pouco
sleep 3

# Verificar status
echo ""
echo "📊 Status dos containers:"
if docker info > /dev/null 2>&1; then
    docker-compose ps
else
    sudo docker-compose ps
fi

echo ""
echo "✅ Containers iniciados!"
echo ""
echo "Para ver os logs:"
echo "  docker-compose logs -f"
echo ""
echo "Para parar:"
echo "  docker-compose down"

#!/bin/bash

echo "🚀 Iniciando Next.js em modo desenvolvimento..."

# Limpar cache do Next.js
if [ -d ".next" ]; then
  echo "🧹 Limpando cache..."
  rm -rf .next
fi

# Tentar iniciar em diferentes portas se necessário
PORT=3000
HOST="127.0.0.1"

echo "📡 Tentando iniciar em $HOST:$PORT..."

# Tentar com a porta padrão primeiro
npx next dev -H $HOST -p $PORT 2>&1 | tee dev.log

# Se falhar, tentar porta alternativa
if [ $? -ne 0 ]; then
  echo "⚠️  Porta $PORT falhou, tentando porta 3002..."
  PORT=3002
  npx next dev -H $HOST -p $PORT
fi

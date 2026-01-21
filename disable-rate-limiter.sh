#!/bin/bash
# Script para desabilitar rate limiter

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "❌ Arquivo .env não encontrado!"
  echo "💡 Copie o env.example.txt para .env primeiro:"
  echo "   cp env.example.txt .env"
  exit 1
fi

# Verificar se a variável já existe
if grep -q "DISABLE_RATE_LIMITER" .env; then
  # Atualizar valor existente
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's/^DISABLE_RATE_LIMITER=.*/DISABLE_RATE_LIMITER=true/' .env
  else
    # Linux
    sed -i 's/^DISABLE_RATE_LIMITER=.*/DISABLE_RATE_LIMITER=true/' .env
  fi
  echo "✅ Variável DISABLE_RATE_LIMITER atualizada para true"
else
  # Adicionar nova variável
  echo "" >> .env
  echo "# Rate Limiting (desabilitado para desenvolvimento)" >> .env
  echo "DISABLE_RATE_LIMITER=true" >> .env
  echo "✅ Variável DISABLE_RATE_LIMITER adicionada e definida como true"
fi

echo ""
echo "📝 Reinicie o servidor backend para aplicar as mudanças:"
echo "   npm run dev"

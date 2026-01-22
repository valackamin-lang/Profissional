#!/bin/bash

# Teste com o novo token do GPO

GPO_URL="https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken"
FRAME_TOKEN="8a056600-af2d-4a44-8e16-1cbe1e73fed8"
CALLBACK_URL="http://localhost:3001/api/gpo/callback"

echo "=== Teste com novo token ==="
echo "Token: $FRAME_TOKEN"
echo "URL: $GPO_URL"
echo ""

PAYLOAD='{
  "reference": "PAYTEST'$(date +%s)'",
  "amount": 1000,
  "token": "'"$FRAME_TOKEN"'",
  "callbackUrl": "'"$CALLBACK_URL"'",
  "qrCode": "PAYMENT",
  "mobile": "PAYMENT",
  "card": "AUTHORIZATION"
}'

echo "Payload enviado:"
echo "$PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$PAYLOAD"
echo ""
echo "=== Resposta da API ==="

RESPONSE=$(curl -s -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$PAYLOAD" \
  -w "\n%{http_code}" \
  --insecure 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Status HTTP: $HTTP_CODE"
echo ""

if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "201" ]]; then
    echo "✅ SUCESSO! Token válido!"
    echo ""
    echo "Resposta JSON:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
elif [[ "$HTTP_CODE" == "400" ]]; then
    echo "❌ Bad Request (400)"
    echo ""
    echo "Resposta:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    
    if echo "$BODY" | grep -q "invalid frame token"; then
        echo ""
        echo "⚠️  O token ainda está inválido. Verifique:"
        echo "   1. Se o token está correto"
        echo "   2. Se o token está ativo no painel do GPO"
        echo "   3. Se o token não expirou"
    fi
else
    echo "❌ Erro: $HTTP_CODE"
    echo ""
    echo "Resposta (primeiros 500 chars):"
    echo "$BODY" | head -c 500
    echo "..."
fi

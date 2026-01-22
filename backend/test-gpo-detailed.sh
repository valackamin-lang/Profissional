#!/bin/bash

# Teste detalhado da API GPO

GPO_URL="https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken"
FRAME_TOKEN="15093b96-9c88-95a5-4779-56da5f4d2f88"
CALLBACK_URL="http://localhost:3001/api/gpo/callback"

echo "=== Teste 1: Payload completo ==="
PAYLOAD1='{
  "reference": "PAYTEST001",
  "amount": 1000,
  "token": "'"$FRAME_TOKEN"'",
  "callbackUrl": "'"$CALLBACK_URL"'",
  "qrCode": "PAYMENT",
  "mobile": "PAYMENT",
  "card": "AUTHORIZATION"
}'

echo "Payload:"
echo "$PAYLOAD1" | jq '.'
echo ""
echo "Resposta:"
curl -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$PAYLOAD1" \
  -w "\nHTTP Status: %{http_code}\n" \
  --insecure 2>&1

echo -e "\n\n=== Teste 2: Sem cssUrl ==="
PAYLOAD2='{
  "reference": "PAYTEST002",
  "amount": 1000,
  "token": "'"$FRAME_TOKEN"'",
  "callbackUrl": "'"$CALLBACK_URL"'",
  "qrCode": "PAYMENT",
  "mobile": "PAYMENT",
  "card": "AUTHORIZATION"
}'

curl -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$PAYLOAD2" \
  -w "\nHTTP Status: %{http_code}\n" \
  --insecure 2>&1

echo -e "\n\n=== Teste 3: Verificar se precisa de autenticação ==="
echo "Tentando sem token:"
PAYLOAD3='{
  "reference": "PAYTEST003",
  "amount": 1000,
  "callbackUrl": "'"$CALLBACK_URL"'",
  "qrCode": "PAYMENT",
  "mobile": "PAYMENT",
  "card": "AUTHORIZATION"
}'

curl -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$PAYLOAD3" \
  -w "\nHTTP Status: %{http_code}\n" \
  --insecure 2>&1

echo -e "\n\n=== Teste 4: Verificar headers necessários ==="
echo "Tentando com Authorization header:"
curl -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $FRAME_TOKEN" \
  -d "$PAYLOAD1" \
  -w "\nHTTP Status: %{http_code}\n" \
  --insecure 2>&1

echo -e "\n\n=== Teste 5: Verificar se token vai no header ==="
curl -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-Frame-Token: $FRAME_TOKEN" \
  -d '{
    "reference": "PAYTEST005",
    "amount": 1000,
    "callbackUrl": "'"$CALLBACK_URL"'",
    "qrCode": "PAYMENT",
    "mobile": "PAYMENT",
    "card": "AUTHORIZATION"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  --insecure 2>&1

#!/bin/bash

# Teste diferentes formatos de reference

GPO_URL="https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken"
FRAME_TOKEN="8a056600-af2d-4a44-8e16-1cbe1e73fed8"
CALLBACK_URL="http://localhost:3001/api/gpo/callback"

echo "=== Testando diferentes formatos de reference ==="
echo ""

# Teste 1: Reference sem prefixo PAY
echo "Teste 1: Reference simples (sem PAY)"
PAYLOAD1='{
  "reference": "TEST001",
  "amount": 1000,
  "token": "'"$FRAME_TOKEN"'",
  "callbackUrl": "'"$CALLBACK_URL"'",
  "qrCode": "PAYMENT",
  "mobile": "PAYMENT",
  "card": "AUTHORIZATION"
}'

RESPONSE1=$(curl -s -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$PAYLOAD1" \
  -w "\n%{http_code}" \
  --insecure 2>&1)

HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | sed '$d')

echo "Status: $HTTP_CODE1"
echo "Resposta: $BODY1"
echo ""

# Teste 2: Reference com PAY (15 caracteres)
echo "Teste 2: Reference com PAY (15 chars)"
PAYLOAD2='{
  "reference": "PAY20250123123",
  "amount": 1000,
  "token": "'"$FRAME_TOKEN"'",
  "callbackUrl": "'"$CALLBACK_URL"'",
  "qrCode": "PAYMENT",
  "mobile": "PAYMENT",
  "card": "AUTHORIZATION"
}'

RESPONSE2=$(curl -s -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$PAYLOAD2" \
  -w "\n%{http_code}" \
  --insecure 2>&1)

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | sed '$d')

echo "Status: $HTTP_CODE2"
echo "Resposta: $BODY2"
echo ""

# Teste 3: Reference numérica
echo "Teste 3: Reference numérica"
PAYLOAD3='{
  "reference": "123456789012345",
  "amount": 1000,
  "token": "'"$FRAME_TOKEN"'",
  "callbackUrl": "'"$CALLBACK_URL"'",
  "qrCode": "PAYMENT",
  "mobile": "PAYMENT",
  "card": "AUTHORIZATION"
}'

RESPONSE3=$(curl -s -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$PAYLOAD3" \
  -w "\n%{http_code}" \
  --insecure 2>&1)

HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | sed '$d')

echo "Status: $HTTP_CODE3"
echo "Resposta: $BODY3"
echo ""

# Teste 4: Verificar se todos os campos são necessários
echo "Teste 4: Verificar campos obrigatórios"
PAYLOAD4='{
  "reference": "PAY20250123",
  "amount": 1000,
  "token": "'"$FRAME_TOKEN"'",
  "callbackUrl": "'"$CALLBACK_URL"'",
  "qrCode": "PAYMENT",
  "mobile": "PAYMENT",
  "card": "AUTHORIZATION"
}'

echo "Payload completo:"
echo "$PAYLOAD4" | python3 -m json.tool 2>/dev/null || echo "$PAYLOAD4"
echo ""

RESPONSE4=$(curl -s -X POST "$GPO_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$PAYLOAD4" \
  -w "\n%{http_code}" \
  --insecure 2>&1)

HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | sed '$d')

echo "Status: $HTTP_CODE4"
if [[ "$HTTP_CODE4" == "200" ]] || [[ "$HTTP_CODE4" == "201" ]]; then
    echo "✅ SUCESSO!"
    echo "Resposta:"
    echo "$BODY4" | python3 -m json.tool 2>/dev/null || echo "$BODY4"
else
    echo "Resposta:"
    echo "$BODY4" | python3 -m json.tool 2>/dev/null || echo "$BODY4"
fi

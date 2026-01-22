#!/bin/bash

# Script para testar a API do GPO usando curl

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Teste da API GPO ===${NC}\n"

# Carregar variáveis do .env se existir
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# URLs para testar
URLS=(
    "https://cerpagamentonline.emis.co.ao/online-payment-gateway/portal/frameToken"
    "https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken"
    "https://cerpagamentonline.emis.co.ao/online-payment-gateway/api/frameToken"
    "https://cerpagamentonline.emis.co.ao/online-payment-gateway/v1/frameToken"
)

# Token do frame (usar do .env ou padrão)
FRAME_TOKEN=${GPO_FRAME_TOKEN:-"15093b96-9c88-95a5-4779-56da5f4d2f88"}
CALLBACK_URL=${GPO_CALLBACK_URL:-"http://localhost:3001/api/gpo/callback"}

# Payload de teste
PAYLOAD=$(cat <<EOF
{
  "reference": "PAYTEST001",
  "amount": 1000,
  "token": "$FRAME_TOKEN",
  "callbackUrl": "$CALLBACK_URL",
  "qrCode": "PAYMENT",
  "mobile": "PAYMENT",
  "card": "AUTHORIZATION"
}
EOF
)

echo -e "${YELLOW}Token usado:${NC} $FRAME_TOKEN"
echo -e "${YELLOW}Callback URL:${NC} $CALLBACK_URL"
echo -e "${YELLOW}Payload:${NC}"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo -e "\n${YELLOW}=== Testando URLs ===${NC}\n"

for URL in "${URLS[@]}"; do
    echo -e "${GREEN}Testando:${NC} $URL"
    echo -e "${YELLOW}Método: POST${NC}\n"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$PAYLOAD" \
        --insecure 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    echo -e "${YELLOW}Status HTTP:${NC} $HTTP_CODE"
    
    if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "201" ]]; then
        echo -e "${GREEN}✅ SUCESSO!${NC}"
        echo -e "${YELLOW}Resposta:${NC}"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    elif [[ "$HTTP_CODE" == "405" ]]; then
        echo -e "${RED}❌ Method Not Allowed${NC}"
        echo -e "${YELLOW}Resposta (primeiros 500 chars):${NC}"
        echo "$BODY" | head -c 500
        echo -e "\n..."
    elif [[ "$HTTP_CODE" == "404" ]]; then
        echo -e "${RED}❌ Not Found${NC}"
    elif [[ "$HTTP_CODE" == "401" ]] || [[ "$HTTP_CODE" == "403" ]]; then
        echo -e "${RED}❌ Unauthorized/Forbidden${NC}"
        echo -e "${YELLOW}Resposta:${NC}"
        echo "$BODY" | head -c 500
        echo -e "\n..."
    else
        echo -e "${RED}❌ Erro: $HTTP_CODE${NC}"
        echo -e "${YELLOW}Resposta (primeiros 500 chars):${NC}"
        echo "$BODY" | head -c 500
        echo -e "\n..."
    fi
    
    echo -e "\n${YELLOW}---${NC}\n"
done

echo -e "${YELLOW}=== Testando métodos HTTP diferentes ===${NC}\n"

# Testar GET também
TEST_URL="https://cerpagamentonline.emis.co.ao/online-payment-gateway/portal/frameToken"
echo -e "${GREEN}Testando GET em:${NC} $TEST_URL"
GET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$TEST_URL" \
    -H "Accept: application/json" \
    --insecure 2>&1)

GET_HTTP_CODE=$(echo "$GET_RESPONSE" | tail -n1)
GET_BODY=$(echo "$GET_RESPONSE" | sed '$d')

echo -e "${YELLOW}Status HTTP (GET):${NC} $GET_HTTP_CODE"
echo -e "${YELLOW}Resposta (primeiros 300 chars):${NC}"
echo "$GET_BODY" | head -c 300
echo -e "\n..."

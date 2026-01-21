# Desabilitar Rate Limiter

Para desabilitar o rate limiter temporariamente durante o desenvolvimento:

## Opção 1: Usar o script (Recomendado)

```bash
cd backend
./disable-rate-limiter.sh
```

## Opção 2: Manualmente

1. Abra o arquivo `.env` no diretório `backend`
2. Adicione ou modifique a linha:
   ```
   DISABLE_RATE_LIMITER=true
   ```
3. Salve o arquivo
4. Reinicie o servidor backend

## Reabilitar Rate Limiter

Para reabilitar o rate limiter:

1. Abra o arquivo `.env`
2. Altere para:
   ```
   DISABLE_RATE_LIMITER=false
   ```
3. Ou remova a linha completamente
4. Reinicie o servidor backend

## Nota

⚠️ **IMPORTANTE**: Nunca deixe `DISABLE_RATE_LIMITER=true` em produção! Isso remove todas as proteções contra ataques de força bruta e DDoS.

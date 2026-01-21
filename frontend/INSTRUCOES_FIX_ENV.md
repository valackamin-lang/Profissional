# 🔧 Instruções para Corrigir Problema de .env.local

## Problema
O Next.js está tentando ler `.env.local` mas o arquivo tem permissões incorretas (criado com sudo).

## Solução Rápida

Execute este comando no terminal:

```bash
cd frontend
sudo rm -f .env .env.local
```

Ou use o script criado:

```bash
cd frontend
./limpar-env.sh
```

## Depois de Remover

Você **NÃO precisa** criar os arquivos `.env` novamente! O projeto está configurado para usar variáveis de ambiente diretamente nos scripts.

### Para Desenvolvimento

```bash
npm run dev
```

O script já inclui `NEXT_PUBLIC_API_URL=http://localhost:3001` automaticamente.

### Para Build

```bash
npm run build
```

## Verificação

Depois de remover, verifique:

```bash
ls -la .env* 2>&1
```

Se não mostrar nenhum arquivo, está correto!

## Se Ainda Tiver Problemas

1. Verifique permissões do diretório:
   ```bash
   ls -ld .
   ```

2. Se necessário, corrija as permissões:
   ```bash
   sudo chown -R $USER:$USER .
   ```

3. Tente novamente:
   ```bash
   npm run build
   ```

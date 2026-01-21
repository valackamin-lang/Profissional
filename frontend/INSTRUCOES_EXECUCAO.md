# Instruções para Executar o Frontend

## Problema Atual
O Next.js está retornando erro `EPERM` ao tentar escutar em qualquer porta.

## Passos para Diagnosticar

### 1. Testar se Node.js consegue escutar em portas

```bash
cd frontend
node test-server.js
```

Se este servidor simples funcionar, o problema é específico do Next.js.
Se também falhar, o problema é de permissões do sistema.

### 2. Tentar portas diferentes

```bash
# Porta 8080
npx next dev -H 127.0.0.1 -p 8080

# Porta 4000
npx next dev -H 127.0.0.1 -p 4000

# Porta 5000
npx next dev -H 127.0.0.1 -p 5000
```

### 3. Verificar processos Node.js travados

```bash
ps aux | grep node
# Se houver processos, matar:
pkill -9 node
```

### 4. Limpar tudo e tentar novamente

```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### 5. Verificar AppArmor (se estiver em Kali Linux)

```bash
sudo systemctl status apparmor
# Se estiver ativo e bloqueando, pode precisar desabilitar temporariamente
```

## Solução Alternativa: Build e Start

Se o modo dev não funcionar, tente build + start:

```bash
cd frontend
npm run build
npm run start
```

O modo de produção pode ter menos restrições.

## Se Nada Funcionar

O problema pode ser específico do ambiente/sandbox. Neste caso:

1. Execute fora do ambiente restrito
2. Use Docker para o frontend também
3. Use uma VM ou container isolado

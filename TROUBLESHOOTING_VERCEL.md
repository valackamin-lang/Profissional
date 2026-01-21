# Troubleshooting - Erro 500 no Vercel

## Erro: FUNCTION_INVOCATION_FAILED

Este erro geralmente ocorre quando há problemas no código server-side do Next.js.

## 🔍 Possíveis Causas e Soluções

### 1. Variáveis de Ambiente Não Configuradas

**Problema:** O Vercel não tem acesso às variáveis de ambiente necessárias.

**Solução:**
1. Acesse o painel do Vercel: https://vercel.com/dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.com
NODE_ENV=production
```

**Importante:** Variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente. Use apenas para valores públicos.

### 2. Uso de APIs do Navegador no Server-Side

**Problema:** Código tentando usar `localStorage`, `window`, ou `document` durante o Server-Side Rendering (SSR).

**Solução:** Sempre verifique se está no cliente antes de usar APIs do navegador:

```typescript
// ❌ ERRADO
const token = localStorage.getItem('token');

// ✅ CORRETO
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
}
```

### 3. Imports de Módulos Client-Only

**Problema:** Importando módulos que só funcionam no cliente em componentes server-side.

**Solução:** Use `'use client'` no topo dos arquivos que precisam de APIs do navegador:

```typescript
'use client';

import { useState } from 'react';
// ... resto do código
```

### 4. Problemas com Dependências

**Problema:** Dependências incompatíveis ou não instaladas.

**Solução:**
1. Verifique se todas as dependências estão no `package.json`
2. Execute `npm install` localmente
3. Verifique se não há conflitos de versão

### 5. Timeout de Função

**Problema:** Funções serverless excedendo o tempo limite.

**Solução:** O arquivo `vercel.json` foi criado para aumentar o timeout. Se necessário, ajuste:

```json
{
  "functions": {
    "src/app/**/*.tsx": {
      "maxDuration": 30
    }
  }
}
```

### 6. Erros de Build

**Problema:** O build está falhando silenciosamente.

**Solução:**
1. Execute localmente: `npm run build`
2. Verifique se há erros de TypeScript ou lint
3. Corrija todos os erros antes de fazer deploy

## 🔧 Checklist de Verificação

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] `NEXT_PUBLIC_API_URL` aponta para o backend correto
- [ ] Todos os arquivos que usam `localStorage`/`window` têm `'use client'`
- [ ] Build local funciona sem erros (`npm run build`)
- [ ] Não há imports de módulos client-only em componentes server-side
- [ ] Dependências estão atualizadas e compatíveis

## 📝 Como Verificar Logs no Vercel

1. Acesse o painel do Vercel
2. Vá em **Deployments**
3. Clique no deployment que falhou
4. Vá em **Functions** → veja os logs de erro
5. Procure por mensagens de erro específicas

## 🚀 Deploy Correto

1. **Configure variáveis de ambiente no Vercel:**
   ```
   NEXT_PUBLIC_API_URL=https://seu-backend.herokuapp.com
   ```

2. **Certifique-se de que o backend está acessível:**
   - O backend deve estar rodando e acessível publicamente
   - CORS deve estar configurado para aceitar requisições do domínio do Vercel

3. **Faça o deploy:**
   ```bash
   git add .
   git commit -m "Fix: Correções para Vercel"
   git push
   ```

## 🔗 Links Úteis

- [Documentação do Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentação do Next.js - Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Next.js - Client Components](https://nextjs.org/docs/getting-started/react-essentials#client-components)

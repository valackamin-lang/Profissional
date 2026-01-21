# 🔧 Solução para Erro 500 no Vercel

## ❌ Erro: FUNCTION_INVOCATION_FAILED (500)

Este erro geralmente ocorre por uma das seguintes razões:

## ✅ Soluções Aplicadas

### 1. ✅ Código Corrigido
- ✅ `AuthContext.tsx` - Melhor tratamento de erros
- ✅ `api.ts` - Uso correto de variáveis de ambiente
- ✅ CORS atualizado para aceitar domínios do Vercel
- ✅ `vercel.json` criado para configuração de timeout

### 2. 🔑 Configuração Necessária no Vercel

**PASSO CRÍTICO:** Configure a variável de ambiente no Vercel:

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Adicione:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://seu-backend.com` (URL pública do seu backend)
   - **Environments:** Marque todas (Production, Preview, Development)
6. Clique em **Save**
7. **IMPORTANTE:** Faça um novo deploy após adicionar a variável

### 3. 🌐 Configuração do Backend (CORS)

O backend foi atualizado para aceitar requisições do Vercel. Certifique-se de que:

1. O backend está rodando e acessível publicamente
2. O CORS está configurado (já foi atualizado no código)
3. Teste a URL do backend:
   ```bash
   curl https://seu-backend.com/api/health
   ```

### 4. 📋 Checklist Rápido

- [ ] Variável `NEXT_PUBLIC_API_URL` configurada no Vercel
- [ ] Backend está acessível publicamente
- [ ] CORS permite requisições do domínio do Vercel
- [ ] Build local funciona: `cd frontend && npm run build`
- [ ] Novo deploy feito após configurar variáveis

### 5. 🔍 Como Verificar o Erro Específico

1. Vercel Dashboard → **Deployments**
2. Clique no deployment que falhou
3. Vá em **Functions** → veja os logs
4. Procure por:
   - `NEXT_PUBLIC_API_URL is not defined`
   - `Cannot read property 'getItem' of undefined` (localStorage)
   - Erros de conexão com o backend

### 6. 🚀 Deploy Após Correções

```bash
cd frontend
git add .
git commit -m "Fix: Correções para Vercel - variáveis de ambiente e CORS"
git push
```

## ⚠️ Problemas Comuns

### Problema 1: "NEXT_PUBLIC_API_URL is undefined"
**Solução:** Configure a variável no Vercel (veja passo 2 acima)

### Problema 2: "CORS error"
**Solução:** O CORS já foi atualizado. Certifique-se de que o backend está rodando.

### Problema 3: "Cannot connect to backend"
**Solução:** 
- Verifique se a URL do backend está correta
- Teste a URL: `curl https://seu-backend.com/api/health`
- Verifique se o backend aceita requisições HTTPS

## 📞 Próximos Passos

1. **Configure `NEXT_PUBLIC_API_URL` no Vercel** (CRÍTICO)
2. **Faça um novo deploy**
3. **Verifique os logs** se ainda houver erro
4. **Teste a aplicação** no domínio do Vercel

## 🔗 Arquivos Modificados

- ✅ `frontend/src/lib/api.ts` - Uso correto de variáveis de ambiente
- ✅ `frontend/src/contexts/AuthContext.tsx` - Melhor tratamento de erros
- ✅ `backend/src/middleware/cors.ts` - Suporte para domínios do Vercel
- ✅ `frontend/vercel.json` - Configuração de timeout
- ✅ `TROUBLESHOOTING_VERCEL.md` - Documentação completa

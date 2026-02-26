# Configuração Resend para Envio de Emails

Este guia explica como configurar o Resend para envio de emails na aplicação.

## 🚀 Por que Resend?

O Resend é um serviço moderno de email que oferece:

## 📝 Configuração Básica

### Passo 1: Criar Conta no Resend

1. Acesse [https://resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Vá em **API Keys** no dashboard
4. Crie uma nova API key
5. **Copie a API key** (ela só aparece uma vez!)

### Passo 2: Configurar no .env

No arquivo `backend/.env`, adicione:

```env
RESEND_API_KEY=re_sua_api_key_aqui
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Importante:**
  - **Desenvolvimento**: Use `onboarding@resend.dev` (domínio padrão do Resend)
  - **Produção**: Configure um domínio verificado (ex: `noreply@seudominio.com`)

### Passo 3: Verificar Domínio (Opcional para Produção)

Para usar um domínio personalizado em produção:

1. No dashboard do Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Adicione seu domínio (ex: `seudominio.com`)
4. Configure os registros DNS conforme instruções
5. Aguarde a verificação (pode levar alguns minutos)
6. Atualize `RESEND_FROM_EMAIL` para usar seu domínio

## 🔧 Uso na Aplicação

O sistema já está configurado para usar Resend automaticamente. Basta configurar as variáveis de ambiente:

```env
RESEND_API_KEY=re_aTyZy4mH_CYWyiszfeSFjo5nC5D4wNaqz
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## 📧 Tipos de Email Enviados

O sistema envia os seguintes emails via Resend:

1. **Verificação de Email** - Quando usuário se registra
2. **Recuperação de Senha** - Quando usuário solicita reset
3. **Notificações** - Notificações do sistema (vagas, eventos, etc.)

## 🐛 Solução de Problemas

### Erro: "Invalid API key"

**Solução:** Verifique se `RESEND_API_KEY` está correto no arquivo `.env`

### Erro: "Domain not verified"

**Solução:** 

### Email não chega

**Solução:**
1. Verifique a pasta de spam
2. Verifique os logs do backend
3. Verifique o dashboard do Resend para ver o status do envio
4. Certifique-se de que o domínio está verificado (se usar domínio personalizado)

## 📊 Monitoramento

O Resend oferece um dashboard completo com:

Acesse: [https://resend.com/emails](https://resend.com/emails)

## 💰 Planos e Limites

### Plano Gratuito

### Planos Pagos

## 🔒 Segurança


## 📚 Recursos


## ✅ Checklist


## 🎯 Migração de SMTP para Resend

Se você estava usando SMTP antes:

1. **Instale o Resend**: `npm install resend`
2. **Configure as variáveis de ambiente** (veja acima)
3. **Remova as variáveis SMTP** do `.env` (ou comente)
4. **Teste o envio** criando uma nova conta

O código já foi atualizado para usar Resend automaticamente quando `RESEND_API_KEY` estiver configurado.


Arquivo obsoleto: a aplicação agora utiliza SMTP (nodemailer) para envio de e-mails. Consulte CONFIGURACAO_SMTP.md para detalhes.
---

**Nota:** O sistema ainda suporta SMTP como fallback, mas Resend é recomendado para produção devido à sua confiabilidade e facilidade de uso.

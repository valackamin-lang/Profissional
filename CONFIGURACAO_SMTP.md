# Configuração SMTP para Envio de Emails

Este guia explica como configurar o envio de emails para verificação de conta e notificações.

## ⚠️ Problema Comum: Erro de Autenticação Gmail

Se você receber o erro:
```
Invalid login: 535-5.7.8 Username and Password not accepted
```

Isso significa que você precisa usar uma **"App Password" (Senha de Aplicativo)** do Gmail, não sua senha normal.

---

## 📧 Configuração para Gmail

### Passo 1: Ativar Autenticação de 2 Fatores

1. Acesse [Google Account Security](https://myaccount.google.com/security)
2. Ative a **Autenticação de 2 fatores** (2FA)
3. Siga as instruções para configurar

### Passo 2: Gerar App Password (Senha de Aplicativo)

1. Ainda em [Google Account Security](https://myaccount.google.com/security)
2. Role até **"Senhas de app"** ou **"App passwords"**
3. Clique em **"Senhas de app"**
4. Selecione:
   - **App**: "Mail"
   - **Device**: "Other (Custom name)"
   - **Nome**: "FORGETECH Professional"
5. Clique em **"Gerar"**
6. **Copie a senha gerada** (16 caracteres, sem espaços)

### Passo 3: Configurar no .env

No arquivo `backend/.env`, configure:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Importante:**
- Use o **email completo** em `SMTP_USER`
- Use a **App Password gerada** (não sua senha normal) em `SMTP_PASSWORD`
- A App Password tem 16 caracteres
- **Espaços são removidos automaticamente** pelo sistema, então você pode colocar com ou sem espaços

### Como as Credenciais São Processadas:

O sistema automaticamente:
1. Remove espaços em branco do início e fim (`trim()`)
2. Remove todos os espaços da senha (App Passwords podem vir com espaços)
3. Valida que as credenciais não estão vazias
4. Passa as credenciais limpas para o nodemailer

**Exemplo de como você pode configurar:**

```env
# Com espaços (serão removidos automaticamente)
SMTP_PASSWORD=abcd efgh ijkl mnop

# Sem espaços (também funciona)
SMTP_PASSWORD=abcdefghijklmnop

# Ambos resultam em: abcdefghijklmnop
```

### Exemplo Completo:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@forgetech.com
SMTP_PASSWORD=abcd efgh ijkl mnop
```

---

## 📧 Outros Provedores de Email

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu-email@outlook.com
SMTP_PASSWORD=sua-senha
```

### Yahoo Mail

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=seu-email@yahoo.com
SMTP_PASSWORD=sua-app-password
```

**Nota:** Yahoo também requer App Password.

### SendGrid (Recomendado para Produção)

1. Crie conta em [SendGrid](https://sendgrid.com)
2. Gere uma API Key
3. Configure:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=sua-api-key-do-sendgrid
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASSWORD=sua-senha-mailgun
```

### Amazon SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=sua-access-key-id
SMTP_PASSWORD=sua-secret-access-key
```

---

## 🔧 Configuração Avançada

### Porta 465 (SSL)

Se preferir usar SSL na porta 465:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-app-password
```

O sistema detecta automaticamente se deve usar SSL baseado na porta.

### Verificação de Conexão

Para testar se a configuração está correta, você pode:

1. Criar uma conta de teste
2. Verificar os logs do backend
3. Se houver erro, verifique:
   - Se as credenciais estão corretas
   - Se a App Password foi gerada corretamente
   - Se o firewall não está bloqueando a porta

---

## 🐛 Solução de Problemas

### Erro: "Invalid login: 535-5.7.8"

**Solução:** Use uma App Password do Gmail, não sua senha normal.

### Erro: "Connection timeout"

**Solução:** 
- Verifique se `SMTP_HOST` está correto
- Verifique se a porta não está bloqueada pelo firewall
- Tente usar porta 465 com SSL

### Erro: "Authentication failed"

**Solução:**
- Verifique se `SMTP_USER` é o email completo
- Verifique se `SMTP_PASSWORD` está correto (sem espaços extras)
- Para Gmail, certifique-se de usar App Password

### Email não chega

**Solução:**
- Verifique a pasta de spam
- Verifique os logs do backend para erros
- Teste com outro provedor de email
- Verifique se `FRONTEND_URL` está correto no `.env`

---

## 📝 Variáveis de Ambiente Completas

```env
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-app-password

# URL do Frontend (usado nos links de verificação)
FRONTEND_URL=http://localhost:3000
```

---

## ✅ Teste Rápido

Após configurar, teste criando uma nova conta. Você deve:

1. Ver nos logs: `✅ Email de verificação enviado para seu-email@exemplo.com`
2. Receber o email na caixa de entrada (ou spam)
3. Clicar no link para verificar

Se não receber o email, verifique os logs do backend para erros específicos.

---

## 🔒 Segurança

- **Nunca** commite o arquivo `.env` no Git
- Use variáveis de ambiente em produção
- Para produção, considere usar serviços como SendGrid ou Mailgun
- Rotacione senhas regularmente

---

## 📚 Recursos Adicionais

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [SendGrid Setup Guide](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)

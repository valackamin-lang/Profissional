# Solução para Timeout de Email em Produção

## Problema

Em produção, o envio de emails estava dando timeout, enquanto localmente funcionava normalmente. Isso geralmente acontece por:

1. **Conexões mais lentas em produção** - Servidores de produção podem ter latência maior
2. **Firewall bloqueando portas SMTP** - Portas 587/465 podem estar bloqueadas
3. **Timeout padrão muito curto** - O nodemailer usa timeout padrão que pode não ser suficiente
4. **Problemas de DNS/Conectividade** - Resolução de DNS ou conectividade de rede

## Soluções Implementadas

### 1. Configurações de Timeout Aumentadas

Adicionamos configurações explícitas de timeout no nodemailer:

```typescript
connectionTimeout: 60000,  // 60 segundos para estabelecer conexão
socketTimeout: 60000,      // 60 segundos para operações de socket
greetingTimeout: 30000,    // 30 segundos para greeting do servidor
```

### 2. Connection Pooling

Habilitamos connection pooling para melhor performance:

```typescript
pool: true,              // Usar connection pooling
maxConnections: 5,      // Máximo de conexões simultâneas
maxMessages: 100,        // Máximo de mensagens por conexão
rateDelta: 1000,        // Intervalo entre tentativas (ms)
rateLimit: 14,          // Limite de mensagens por rateDelta
```

### 3. Timeout Adicional no Envio

Adicionamos um timeout adicional de 60 segundos no envio de cada email usando `Promise.race()`:

```typescript
const sendEmailPromise = transporter.sendMail({...});
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Timeout ao enviar email')), 60000);
});
await Promise.race([sendEmailPromise, timeoutPromise]);
```

### 4. Melhor Tratamento de Erros

Melhoramos o tratamento de erros para identificar especificamente problemas de timeout:

- `ETIMEDOUT` - Timeout de conexão
- `ESOCKETTIMEDOUT` - Timeout de socket
- Mensagens de erro mais descritivas
- Dicas específicas para produção

## Verificações em Produção

### 1. Verificar Portas SMTP

Certifique-se de que as portas SMTP estão acessíveis:

```bash
# Teste de conectividade
telnet smtp.gmail.com 587
# ou
nc -zv smtp.gmail.com 587
```

### 2. Verificar Firewall

Em produção, verifique se o firewall não está bloqueando as portas SMTP:

- **Porta 587** (TLS/STARTTLS) - Recomendada
- **Porta 465** (SSL) - Alternativa
- **Porta 25** - Geralmente bloqueada por ISPs

### 3. Configurações de Rede

Se estiver usando Docker ou serviços cloud (Vercel, Railway, etc.):

- Verifique se as portas SMTP estão permitidas nas configurações de rede
- Alguns serviços cloud bloqueiam conexões SMTP por padrão
- Considere usar serviços de email dedicados (SendGrid, Mailgun, etc.)

### 4. Variáveis de Ambiente

Certifique-se de que as variáveis de ambiente estão configuradas corretamente em produção:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-app-password
```

**Importante**: Para Gmail, use uma **App Password**, não sua senha normal!

## Alternativas para Produção

Se o problema persistir, considere usar serviços de email dedicados:

### SendGrid (Recomendado)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=sua-api-key-do-sendgrid
```

**Vantagens**:
- Mais confiável em produção
- Melhor deliverability
- Analytics e tracking
- Não bloqueado por firewalls

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

## Teste de Conectividade

Para testar se a conexão SMTP está funcionando:

```bash
# Teste básico de conectividade
telnet smtp.gmail.com 587

# Ou usando openssl
openssl s_client -connect smtp.gmail.com:587 -starttls smtp
```

## Logs e Debugging

Os logs agora incluem informações mais detalhadas sobre erros de timeout:

```
Timeout ao enviar email: A conexão com o servidor SMTP demorou muito.
💡 Dica: Em produção, verifique se a porta SMTP não está bloqueada pelo firewall.
💡 Dica: Tente usar porta 465 (SSL) ou verifique conectividade de rede.
```

## Checklist para Produção

- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Portas SMTP (587/465) acessíveis
- [ ] Firewall configurado para permitir SMTP
- [ ] App Password do Gmail configurada (se usar Gmail)
- [ ] Teste de conectividade bem-sucedido
- [ ] Logs verificados para erros
- [ ] Considerar serviço de email dedicado (SendGrid, Mailgun)

## Próximos Passos

1. **Teste em produção** após fazer deploy das alterações
2. **Monitore os logs** para identificar erros específicos
3. **Se o problema persistir**, considere migrar para SendGrid ou Mailgun
4. **Configure alertas** para monitorar falhas de envio de email

## Referências

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [SendGrid SMTP Setup](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)
- [CONFIGURACAO_SMTP.md](./CONFIGURACAO_SMTP.md)

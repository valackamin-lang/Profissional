# Análise IDOR - Sistema de Chat

## 🔍 Resumo da Análise

Análise completa dos endpoints de chat para identificar vulnerabilidades IDOR (Insecure Direct Object Reference).

**Status Geral**: ✅ **SEGURO** - Todos os endpoints verificam adequadamente a autorização do usuário.

---

## 📋 Endpoints Analisados

### 1. `GET /api/chat/with/:participantId` - getOrCreateChat

**Status**: ✅ **SEGURO** (Melhorado)

**Código**:
```typescript
const { participantId } = req.params;
// Validar se o participante existe
const participantProfile = await Profile.findByPk(participantId);
if (!participantProfile) {
  throw new AppError('Participante não encontrado', 404);
}

// Não permitir criar chat consigo mesmo
if (participantId === profile.id) {
  throw new AppError('Não é possível criar um chat consigo mesmo', 400);
}

// Verifica se chat já existe entre os dois participantes
let chat = await Chat.findOne({
  where: {
    [Op.or]: [
      { participant1Id: profile.id, participant2Id: participantId },
      { participant1Id: participantId, participant2Id: profile.id },
    ],
  },
});
```

**Análise**:
- ✅ Verifica que o chat é entre `profile.id` (usuário autenticado) e `participantId`
- ✅ Não permite acessar chats de outros usuários
- ✅ **MELHORADO**: Valida se `participantId` existe antes de criar chat
- ✅ **MELHORADO**: Não permite criar chat consigo mesmo

**Severidade**: 🟢 **NENHUMA** - Bem protegido e melhorado

---

### 2. `GET /api/chat/:chatId` - getChat

**Status**: ✅ **SEGURO**

**Código**:
```typescript
const chat = await Chat.findOne({
  where: {
    id: chatId,
    [Op.or]: [
      { participant1Id: profile.id },
      { participant2Id: profile.id },
    ],
  },
});
```

**Análise**:
- ✅ **PROTEGIDO**: Verifica que o usuário autenticado é participante do chat
- ✅ Não permite acessar chats de outros usuários
- ✅ Retorna 404 se o chat não existir ou o usuário não for participante

**Teste de IDOR**:
```bash
# Tentativa de acessar chat de outro usuário
GET /api/chat/123e4567-e89b-12d3-a456-426614174000
# Resultado: 404 - "Chat não encontrado ou acesso negado" ✅
```

**Severidade**: 🟢 **NENHUMA** - Bem protegido

---

### 3. `GET /api/chat` - getChats

**Status**: ✅ **SEGURO**

**Código**:
```typescript
const chats = await Chat.findAll({
  where: {
    [Op.or]: [
      { participant1Id: profile.id },
      { participant2Id: profile.id },
    ],
  },
});
```

**Análise**:
- ✅ **PROTEGIDO**: Lista apenas chats onde o usuário é participante
- ✅ Não expõe chats de outros usuários
- ✅ Filtro aplicado na query do banco de dados

**Severidade**: 🟢 **NENHUMA** - Bem protegido

---

### 4. `GET /api/chat/:chatId/messages` - getMessages

**Status**: ✅ **SEGURO**

**Código**:
```typescript
// Verificar se usuário pertence ao chat
const chat = await Chat.findOne({
  where: {
    id: chatId,
    [Op.or]: [
      { participant1Id: profile.id },
      { participant2Id: profile.id },
    ],
  },
});

if (!chat) {
  throw new AppError('Chat não encontrado ou acesso negado', 404);
}

// Buscar mensagens apenas se pertencer ao chat
const { count, rows: messages } = await Message.findAndCountAll({
  where: { chatId },
  // ...
});
```

**Análise**:
- ✅ **PROTEGIDO**: Verifica que o usuário pertence ao chat ANTES de buscar mensagens
- ✅ Não permite acessar mensagens de chats de outros usuários
- ✅ Retorna 404 se não for participante

**Teste de IDOR**:
```bash
# Tentativa de acessar mensagens de chat de outro usuário
GET /api/chat/123e4567-e89b-12d3-a456-426614174000/messages
# Resultado: 404 - "Chat não encontrado ou acesso negado" ✅
```

**Severidade**: 🟢 **NENHUMA** - Bem protegido

---

### 5. `POST /api/chat/:chatId/messages` - sendMessage

**Status**: ✅ **SEGURO**

**Código**:
```typescript
// Verificar se usuário pertence ao chat
const chat = await Chat.findOne({
  where: {
    id: chatId,
    [Op.or]: [
      { participant1Id: profile.id },
      { participant2Id: profile.id },
    ],
  },
});

if (!chat) {
  throw new AppError('Chat não encontrado ou acesso negado', 404);
}

// Criar mensagem apenas se pertencer ao chat
const message = await Message.create({
  chatId,
  senderId: profile.id, // ✅ Sempre usa o profile.id do usuário autenticado
  // ...
});
```

**Análise**:
- ✅ **PROTEGIDO**: Verifica que o usuário pertence ao chat ANTES de enviar mensagem
- ✅ `senderId` sempre usa `profile.id` do usuário autenticado (não pode ser manipulado)
- ✅ Não permite enviar mensagens em chats de outros usuários

**Teste de IDOR**:
```bash
# Tentativa de enviar mensagem em chat de outro usuário
POST /api/chat/123e4567-e89b-12d3-a456-426614174000/messages
{
  "content": "Mensagem maliciosa",
  "senderId": "outro-user-id"  # ❌ Seria ignorado, usa profile.id
}
# Resultado: 404 - "Chat não encontrado ou acesso negado" ✅
```

**Severidade**: 🟢 **NENHUMA** - Bem protegido

---

### 6. `PUT /api/chat/:chatId/read` - markMessagesAsRead

**Status**: ✅ **SEGURO**

**Código**:
```typescript
// Verificar se usuário pertence ao chat
const chat = await Chat.findOne({
  where: {
    id: chatId,
    [Op.or]: [
      { participant1Id: profile.id },
      { participant2Id: profile.id },
    ],
  },
});

if (!chat) {
  throw new AppError('Chat não encontrado ou acesso negado', 404);
}

// Marcar mensagens como lidas apenas se pertencer ao chat
await Message.update(
  { readAt: new Date() },
  {
    where: {
      chatId,
      senderId: { [Op.ne]: profile.id }, // ✅ Apenas mensagens de outros
      readAt: null as any,
    },
  }
);
```

**Análise**:
- ✅ **PROTEGIDO**: Verifica que o usuário pertence ao chat ANTES de marcar como lida
- ✅ Não permite marcar mensagens como lidas em chats de outros usuários
- ✅ Filtra apenas mensagens de outros participantes (não marca próprias mensagens)

**Severidade**: 🟢 **NENHUMA** - Bem protegido

---

### 7. `DELETE /api/chat/messages/:messageId` - deleteMessage

**Status**: ✅ **SEGURO** (Melhorado)

**Código**:
```typescript
const { messageId } = req.params;
const message = await Message.findByPk(messageId);
if (!message) {
  throw new AppError('Mensagem não encontrada', 404);
}

// Verificar se usuário pertence ao chat da mensagem
const chat = await Chat.findOne({
  where: {
    id: message.chatId,
    [Op.or]: [
      { participant1Id: profile.id },
      { participant2Id: profile.id },
    ],
  },
});

if (!chat) {
  throw new AppError('Chat não encontrado ou acesso negado', 404);
}

// Verificar se é o remetente
if (message.senderId !== profile.id) {
  throw new AppError('Acesso negado: apenas o remetente pode deletar a mensagem', 403);
}

await message.destroy();
```

**Análise**:
- ✅ Verifica que o usuário é o remetente da mensagem
- ✅ **MELHORADO**: Verifica se o usuário pertence ao chat antes de deletar
- ✅ Dupla verificação: participação no chat + ownership da mensagem

**Severidade**: 🟢 **NENHUMA** - Bem protegido e melhorado

---

## 🔒 Proteções Implementadas

### ✅ Verificação de Participação em Chat

Todos os endpoints que acessam um `chatId` verificam se o usuário é participante:
```typescript
const chat = await Chat.findOne({
  where: {
    id: chatId,
    [Op.or]: [
      { participant1Id: profile.id },
      { participant2Id: profile.id },
    ],
  },
});
```

### ✅ Verificação de Remetente

O endpoint `deleteMessage` verifica se o usuário é o remetente:
```typescript
if (message.senderId !== profile.id) {
  throw new AppError('Acesso negado', 403);
}
```

### ✅ Uso de profile.id do Token

O `senderId` sempre usa `profile.id` do usuário autenticado, não pode ser manipulado via body:
```typescript
const message = await Message.create({
  chatId,
  senderId: profile.id, // ✅ Sempre do token, não do body
  // ...
});
```

---

## 📊 Tabela de Vulnerabilidades

| Endpoint | Método | IDOR? | Severidade | Notas |
|----------|--------|-------|------------|-------|
| `/api/chat/with/:participantId` | GET | ✅ Não | 🟢 Nenhuma | Melhorado - valida participantId e previne chat consigo mesmo |
| `/api/chat/:chatId` | GET | ✅ Não | 🟢 Nenhuma | Bem protegido |
| `/api/chat` | GET | ✅ Não | 🟢 Nenhuma | Bem protegido |
| `/api/chat/:chatId/messages` | GET | ✅ Não | 🟢 Nenhuma | Bem protegido |
| `/api/chat/:chatId/messages` | POST | ✅ Não | 🟢 Nenhuma | Bem protegido |
| `/api/chat/:chatId/read` | PUT | ✅ Não | 🟢 Nenhuma | Bem protegido |
| `/api/chat/messages/:messageId` | DELETE | ✅ Não | 🟢 Nenhuma | Melhorado - verifica participação no chat |

---

## 🎯 Melhorias Implementadas

### ✅ Correções Aplicadas

1. **Melhorado `deleteMessage`**:
   - ✅ Adicionada verificação de que o usuário pertence ao chat
   - ✅ Dupla verificação: participação no chat + ownership da mensagem
   - ✅ Mensagem de erro mais descritiva

2. **Melhorado `getOrCreateChat`**:
   - ✅ Validação de que o `participantId` existe antes de criar chat
   - ✅ Prevenção de criar chat consigo mesmo
   - ✅ Mensagens de erro mais descritivas

---

## ✅ Conclusão

**Status Geral**: ✅ **SEGURO**

O sistema de chat está **bem protegido contra IDOR**. Todos os endpoints principais verificam adequadamente:
- ✅ Participação do usuário no chat
- ✅ Ownership de mensagens
- ✅ Autorização antes de operações

**Todas as melhorias foram implementadas**: O sistema está completamente protegido contra IDOR com verificações duplas onde necessário.

---

**Data da Análise**: 2024
**Analista**: AI Security Review

# Análise de Rotas que Podem Alterar Role do Usuário

## 🔍 Resumo da Análise

Após análise completa do código, **NÃO foi encontrado nenhum endpoint que permita alterar `roleId` diretamente**, exceto através de endpoints de admin que requerem autenticação e autorização adequadas.

---

## ✅ Endpoints Analisados

### 1. `/api/auth/register` - Registro de Usuário

**Status**: ✅ **CORRIGIDO**

- **Antes**: Permitia criar conta com qualquer role, incluindo ADMIN
- **Agora**: Apenas `STUDENT`, `MENTOR`, `PARTNER` são permitidas
- **Proteção**: Whitelist + validação no express-validator

**Campos aceitos do body**:
- ✅ `email` - validado
- ✅ `password` - validado (min 6 caracteres)
- ✅ `roleName` - validado contra whitelist

**Campos do User criados**:
- ✅ `email` - do body
- ✅ `password` - hasheado do body
- ✅ `roleId` - derivado de `roleName` (validado)
- ✅ Outros campos usam valores padrão do modelo

**Mass Assignment**: ✅ **PROTEGIDO** - Apenas campos necessários são usados

---

### 2. `/api/profiles/:id` (PUT) - Atualizar Perfil

**Status**: ✅ **SEGURO**

**Campos aceitos do body**:
- ✅ `firstName` - opcional
- ✅ `lastName` - opcional
- ✅ `bio` - opcional
- ✅ `companyName` - opcional
- ✅ `companyDocument` - opcional
- ✅ Uploads de arquivos (avatar, resume, portfolio, logo)

**Campos do Profile atualizados**:
- ✅ Apenas campos do Profile são atualizados
- ✅ **NÃO atualiza campos do User** (incluindo `roleId`)
- ✅ Profile não tem campo `roleId` ou `userId` editável

**Autorização**:
- ✅ Usuário só pode atualizar seu próprio perfil
- ✅ Admin pode atualizar qualquer perfil
- ✅ Verificação de ownership implementada

**Mass Assignment**: ✅ **PROTEGIDO** - Whitelist de campos permitidos

---

### 3. `/api/admin/users/:targetUserId/status` (PUT) - Atualizar Status do Usuário

**Status**: ✅ **SEGURO**

**Campos aceitos do body**:
- ✅ `isActive` - apenas este campo

**Campos do User atualizados**:
- ✅ Apenas `isActive` é atualizado
- ✅ **NÃO atualiza `roleId`**

**Autorização**:
- ✅ Apenas ADMIN pode acessar
- ✅ Middleware `authorize('ADMIN')` protege a rota
- ✅ Admin não pode desativar a si mesmo

**Mass Assignment**: ✅ **PROTEGIDO** - Apenas `isActive` é aceito

---

### 4. Endpoints de OAuth

**Status**: ✅ **SEGURO**

- ✅ Criam usuários com role padrão `STUDENT`
- ✅ Não permitem especificar role
- ✅ Não atualizam role de usuários existentes

---

## 🔒 Endpoints que NÃO Existem (Bom!)

### ❌ Não há endpoint público para alterar roleId

Não foi encontrado nenhum endpoint que permita:
- Alterar `roleId` diretamente
- Alterar `roleName` de um usuário
- Promover usuário para ADMIN via API pública

**Isso é BOM!** Significa que a única forma de alterar roles é através de:
1. Endpoints de admin (protegidos)
2. Seeders/scripts (apenas em desenvolvimento)
3. Acesso direto ao banco de dados (requer acesso privilegiado)

---

## ⚠️ Possíveis Vulnerabilidades de Mass Assignment

### 1. updateProfile - Verificação Adicional

**Status**: ✅ **SEGURO**

O código usa whitelist explícita:
```typescript
const { firstName, lastName, bio, companyName, companyDocument } = req.body;
// Apenas estes campos são extraídos e usados
```

**Campos que NÃO podem ser manipulados**:
- ❌ `userId` - não está no body, vem do token
- ❌ `type` - não está no body
- ❌ `approvalStatus` - não está no body
- ❌ `roleId` - não existe no Profile

### 2. updateUserStatus - Verificação Adicional

**Status**: ✅ **SEGURO**

```typescript
const { isActive } = req.body;
targetUser.isActive = isActive !== undefined ? isActive : true;
// Apenas isActive é atualizado
```

**Campos que NÃO podem ser manipulados**:
- ❌ `roleId` - não está no body
- ❌ `email` - não está no body
- ❌ `password` - não está no body
- ❌ `isEmailVerified` - não está no body

---

## 📋 Checklist de Segurança

| Endpoint | Pode alterar roleId? | Mass Assignment Protegido? | Autorização Adequada? |
|----------|---------------------|----------------------------|----------------------|
| `/api/auth/register` | ✅ Não (whitelist) | ✅ Sim | ✅ N/A (público) |
| `/api/profiles/:id` (PUT) | ✅ Não (Profile não tem roleId) | ✅ Sim | ✅ Sim |
| `/api/admin/users/:id/status` | ✅ Não | ✅ Sim | ✅ Sim (ADMIN) |
| OAuth endpoints | ✅ Não | ✅ Sim | ✅ N/A |

---

## 🎯 Conclusão

### ✅ Pontos Positivos

1. **Nenhum endpoint público permite alterar roleId**
2. **Mass assignment está protegido** - apenas campos necessários são usados
3. **Whitelist de campos** em todos os endpoints de update
4. **Autorização adequada** - verificação de ownership/admin em todos os endpoints

### ⚠️ Recomendações

1. **Criar endpoint de admin para alterar roles** (se necessário):
   ```typescript
   // Exemplo de endpoint seguro para admin alterar role
   PUT /api/admin/users/:targetUserId/role
   // Requer: ADMIN
   // Body: { roleId: string }
   // Validação: Não permitir alterar para ADMIN (ou apenas super-admin)
   ```

2. **Adicionar validação explícita** em todos os endpoints:
   ```typescript
   // Rejeitar explicitamente campos não permitidos
   const allowedFields = ['firstName', 'lastName', 'bio'];
   const bodyFields = Object.keys(req.body);
   const invalidFields = bodyFields.filter(f => !allowedFields.includes(f));
   if (invalidFields.length > 0) {
     throw new AppError(`Campos não permitidos: ${invalidFields.join(', ')}`, 400);
   }
   ```

3. **Adicionar testes automatizados** para verificar:
   - Tentativas de mass assignment
   - Tentativas de alterar roleId
   - Tentativas de criar conta admin

---

## 🔐 Status Final

**VULNERABILIDADE DE ALTERAÇÃO DE ROLE**: ✅ **NÃO ENCONTRADA**

- ✅ Nenhum endpoint permite alterar `roleId` diretamente
- ✅ Mass assignment está protegido
- ✅ Autorização adequada em todos os endpoints
- ✅ Whitelist de campos em todos os updates

**Única vulnerabilidade encontrada e corrigida**: Criação de conta admin via registro (já corrigida).

---

**Data da Análise**: 2024
**Analista**: AI Security Review

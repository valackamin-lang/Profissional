# 🔴 VULNERABILIDADE CRÍTICA - Criação de Conta Admin

## Problema Identificado

O endpoint de registro (`/api/auth/register`) permite que qualquer pessoa crie uma conta com role **ADMIN** simplesmente enviando `roleName: 'ADMIN'` no body da requisição.

### Código Vulnerável

**Arquivo**: `backend/src/controllers/authController.ts` - Linha 19-32

```typescript
const { email, password, roleName = 'STUDENT' } = req.body;

// Get role - criar se não existir
let role = await Role.findOne({ where: { name: roleName } });
if (!role) {
  if (roleName === 'STUDENT') {
    role = await Role.create({ name: 'STUDENT', ... });
  } else {
    throw new AppError(`Role '${roleName}' não encontrada...`, 404);
  }
}
```

### Exploração

Um atacante pode criar uma conta admin fazendo:

```bash
POST /api/auth/register
{
  "email": "hacker@evil.com",
  "password": "password123",
  "roleName": "ADMIN"  # ❌ VULNERABILIDADE!
}
```

Se a role ADMIN existir no banco (o que é provável após rodar os seeders), o sistema criará um usuário admin!

### Impacto

- 🔴 **CRÍTICO**: Qualquer pessoa pode se tornar administrador
- 🔴 **CRÍTICO**: Acesso total ao sistema
- 🔴 **CRÍTICO**: Pode deletar/modificar qualquer dado
- 🔴 **CRÍTICO**: Pode criar outros admins

---

## Mass Assignment

### Status: ✅ PROTEGIDO

O código usa apenas os campos necessários no `User.create()`:

```typescript
const user = await User.create({
  email,
  password: hashedPassword,
  roleId: role.id,
});
```

**Campos do User que NÃO podem ser manipulados**:
- ✅ `isEmailVerified` - protegido
- ✅ `emailVerificationToken` - protegido
- ✅ `twoFactorEnabled` - protegido
- ✅ `twoFactorSecret` - protegido
- ✅ `refreshToken` - protegido
- ✅ `isActive` - protegido

**Problema**: Apenas `roleName` pode ser manipulado, mas isso é suficiente para comprometer o sistema.

---

## Correção Necessária

### Solução 1: Whitelist de Roles Permitidas (RECOMENDADO)

```typescript
// Whitelist de roles que podem ser criadas via registro público
const ALLOWED_REGISTRATION_ROLES = ['STUDENT', 'MENTOR', 'PARTNER'];

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, roleName = 'STUDENT' } = req.body;

    // ✅ VALIDAÇÃO: Bloquear roles privilegiadas
    if (!ALLOWED_REGISTRATION_ROLES.includes(roleName)) {
      throw new AppError(`Role '${roleName}' não pode ser criada via registro público. Use STUDENT, MENTOR ou PARTNER.`, 403);
    }

    // ... resto do código
  }
}
```

### Solução 2: Remover roleName do Body (ALTERNATIVA)

```typescript
// Sempre usar STUDENT como padrão, ignorar roleName do body
const { email, password } = req.body;
const roleName = 'STUDENT'; // Forçar sempre STUDENT

// Ou permitir apenas STUDENT e MENTOR via validação
```

### Solução 3: Validação no Express-Validator (RECOMENDADO)

```typescript
// Em authRoutes.ts
body('roleName')
  .optional()
  .isIn(['STUDENT', 'MENTOR', 'PARTNER'])
  .withMessage('Role inválida. Apenas STUDENT, MENTOR ou PARTNER são permitidas'),
```

---

## Correção Implementada

Vou implementar a **Solução 1 + Solução 3** (whitelist + validação).

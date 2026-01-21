# Seeders - FORGETECH Professional

Este documento descreve os seeders disponíveis para popular o banco de dados com dados iniciais.

## Como executar

### Executar todos os seeders
```bash
cd backend
npm run seed
```

### Executar seeders individuais
```bash
# Apenas roles e permissions
npm run seed:roles

# Apenas usuário admin
npm run seed:admin

# Apenas dados de exemplo
npm run seed:sample
```

## Seeders disponíveis

### 1. Roles e Permissions (`01-roles-permissions.ts`)

Cria as roles e permissões do sistema:
- **STUDENT**: Estudante/Profissional
- **MENTOR**: Mentor
- **PARTNER**: Empresa Parceira
- **ADMIN**: Administrador

E todas as permissões necessárias para cada role.

### 2. Admin User (`02-admin-user.ts`)

Cria o usuário administrador inicial:
- **Email**: admin@forgetech.com
- **Password**: admin123
- **Role**: ADMIN
- **Status**: Aprovado

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

### 3. Sample Data (`03-sample-data.ts`)

Cria dados de exemplo para testes:

#### Usuários:
- **3 Estudantes**:
  - student1@example.com / student123
  - student2@example.com / student123
  - student3@example.com / student123

- **1 Mentor**:
  - mentor@example.com / mentor123

- **1 Parceiro**:
  - partner@example.com / partner123

#### Conteúdo:
- **2 Vagas de emprego** (criadas pelo parceiro)
- **2 Eventos** (workshop e webinar)
- **2 Mentorias** (criadas pelo mentor)

Todos os itens são automaticamente adicionados ao feed.

## Estrutura dos Seeders

```
backend/src/seeders/
├── 01-roles-permissions.ts  # Roles e permissões
├── 02-admin-user.ts         # Usuário admin
├── 03-sample-data.ts        # Dados de exemplo
└── index.ts                 # Orquestrador principal
```

## Ordem de execução

Os seeders devem ser executados nesta ordem:
1. Roles e Permissions (cria a estrutura de permissões)
2. Admin User (cria o usuário admin)
3. Sample Data (cria dados de exemplo que dependem das roles)

O comando `npm run seed` executa todos na ordem correta.

## Notas

- Os seeders usam `findOrCreate`, então podem ser executados múltiplas vezes sem duplicar dados
- Os seeders verificam se os dados já existem antes de criar
- Todos os seeders incluem logs detalhados do processo

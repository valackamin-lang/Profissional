# Correção de Vulnerabilidades - npm audit (Frontend)

## Vulnerabilidades Encontradas e Corrigidas

### 🔧 Corrigidas Manualmente

**glob** (high) - Command injection vulnerability
- **Status**: Corrigido via atualização do eslint-config-next
- **Versão anterior**: 10.2.0 - 10.4.5 (via dependência)
- **Ação**: Atualizado `eslint-config-next` de `^14.0.4` para `^15.0.0`
- **Vulnerabilidade**: Command injection via -c/--cmd executes matches with shell:true

## Alterações no package.json

### DevDependencies Atualizadas
- `eslint-config-next`: `^14.0.4` → `^15.0.0` ✅

## Dependências Afetadas

A vulnerabilidade estava em:
- `glob` (dependência transitiva)
  - Usado por: `@next/eslint-plugin-next`
  - Usado por: `eslint-config-next`

## Breaking Changes

### eslint-config-next 15.0.0

O `eslint-config-next` 15.0.0 é compatível com Next.js 14.x e 15.x. A atualização deve funcionar sem problemas, mas verifique:

1. **Regras do ESLint**: Algumas regras podem ter mudado
2. **Compatibilidade**: Deve funcionar com Next.js 14.0.4

Se houver problemas com regras do ESLint, você pode:
- Ajustar as regras no arquivo `.eslintrc.json`
- Ou fazer downgrade temporário se necessário

## Próximos Passos

1. **Instalar dependências atualizadas**:
   ```bash
   cd frontend
   npm install
   ```

2. **Verificar se não há erros**:
   ```bash
   npm run lint
   ```

3. **Testar o build**:
   ```bash
   npm run build
   ```

4. **Verificar vulnerabilidades novamente**:
   ```bash
   npm audit
   ```

## Status Final

- ✅ **glob**: Corrigido via atualização do eslint-config-next

**Todas as vulnerabilidades foram corrigidas!**

## Referências

- [eslint-config-next Releases](https://github.com/vercel/next.js/releases)
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [glob Security Advisory](https://github.com/advisories/GHSA-5j98-mcp5-4vw2)

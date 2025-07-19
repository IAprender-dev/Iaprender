# 🤝 Guia de Contribuição - IAprender

Obrigado por considerar contribuir para o IAprender! Este documento descreve o processo para contribuir com o projeto.

## 📋 Sumário

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Funcionalidades](#sugerir-funcionalidades)

## 📖 Código de Conduta

Este projeto adere ao Código de Conduta da Contributor Covenant. Ao participar, você deve seguir este código.

## 🚀 Como Contribuir

### Tipos de Contribuição

- 🐛 **Correção de Bugs**: Correções para problemas existentes
- ✨ **Novas Funcionalidades**: Implementação de novas features
- 📚 **Documentação**: Melhorias na documentação
- 🧪 **Testes**: Adição ou melhoria de testes
- 🎨 **UI/UX**: Melhorias na interface do usuário
- ⚡ **Performance**: Otimizações de performance

### Workflow de Contribuição

1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Crie** uma branch para sua feature
4. **Implemente** suas mudanças
5. **Teste** suas mudanças
6. **Commit** seguindo os padrões
7. **Push** para seu fork
8. **Abra** um Pull Request

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- PostgreSQL 13+
- Redis (opcional para desenvolvimento)
- Git

### Configuração Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/IAprender.git
cd IAprender

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Configure o banco de dados
npm run db:setup

# 5. Execute os testes
npm test

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

### Configuração com Docker

```bash
# Inicie todos os serviços
docker-compose -f docker-compose.dev.yml up -d

# Acesse a aplicação
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# Adminer: http://localhost:8080
```

## 💻 Padrões de Código

### Estrutura de Pastas

```
IAprender/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # React hooks customizados
│   │   └── lib/           # Utilitários
├── server/                 # Backend Node.js
│   ├── modules/           # Módulos de negócio
│   ├── repositories/      # Camada de dados
│   ├── services/          # Serviços externos
│   ├── middleware/        # Middleware Express
│   └── utils/             # Utilitários
└── shared/                 # Código compartilhado
```

### Convenções de Nomenclatura

- **Arquivos**: PascalCase para componentes, camelCase para utilitários
- **Variáveis**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Funções**: camelCase
- **Classes**: PascalCase
- **Interfaces**: PascalCase com prefixo 'I' opcional

### TypeScript

- Use TypeScript em todos os novos arquivos
- Defina tipos explícitos quando necessário
- Evite `any`, prefira `unknown`
- Use interfaces para objetos complexos

```typescript
// ✅ Bom
interface UserCreateRequest {
  name: string;
  email: string;
  userType: 'admin' | 'teacher' | 'student';
}

// ❌ Evite
function createUser(data: any) {
  // ...
}
```

### React/Frontend

- Use componentes funcionais com hooks
- Implemente TypeScript em todos os componentes
- Use React Query para estado do servidor
- Siga as convenções do shadcn/ui

```tsx
// ✅ Bom
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  // ...
}
```

### Backend/API

- Use Repository Pattern para acesso a dados
- Implemente validação com Zod
- Use middleware para concerns transversais
- Estruture respostas de forma consistente

```typescript
// ✅ Bom
export class UserController {
  public async createUser(req: AuthenticatedRequest, res: Response) {
    const validationResult = this.validator.validateCreate(req.body);
    if (!validationResult.valid) {
      throw AppErrors.badRequest(validationResult.errors.join(', '));
    }
    // ...
  }
}
```

### Banco de Dados

- Use migrations para mudanças de schema
- Nomeie tabelas e colunas em snake_case
- Sempre adicione índices apropriados
- Use foreign keys para manter integridade

## 📝 Padrões de Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Mudanças de formatação
- `refactor`: Refatoração de código
- `test`: Adição ou modificação de testes
- `chore`: Tarefas de manutenção

### Exemplos

```bash
feat(auth): adicionar autenticação com MFA

fix(api): corrigir validação de CPF

docs(readme): atualizar instruções de instalação

test(user): adicionar testes para UserService
```

## 🔍 Pull Request Process

### Checklist para PR

- [ ] **Testes**: Todos os testes passam
- [ ] **Linting**: Código segue os padrões
- [ ] **Tipos**: TypeScript compila sem erros
- [ ] **Documentação**: Documentação atualizada se necessário
- [ ] **Changelog**: Mudanças documentadas
- [ ] **Breaking Changes**: Identificadas e documentadas

### Template de PR

```markdown
## 📋 Descrição

Breve descrição das mudanças implementadas.

## 🔧 Tipo de Mudança

- [ ] 🐛 Correção de bug
- [ ] ✨ Nova funcionalidade
- [ ] 💥 Breaking change
- [ ] 📚 Documentação
- [ ] 🧪 Testes

## 🧪 Como Testar

1. Faça checkout desta branch
2. Execute `npm install`
3. Execute `npm test`
4. Teste manualmente...

## 📸 Screenshots (se aplicável)

## ✅ Checklist

- [ ] Meu código segue os padrões do projeto
- [ ] Realizei self-review do código
- [ ] Adicionei comentários em código complexo
- [ ] Atualizei a documentação
- [ ] Meus commits seguem o padrão Conventional Commits
- [ ] Adicionei testes que cobrem minhas mudanças
- [ ] Todos os testes passam localmente
```

## 🐛 Reportar Bugs

### Antes de Reportar

1. Verifique se o bug já foi reportado
2. Teste na versão mais recente
3. Colete informações do ambiente

### Template de Bug Report

```markdown
## 🐛 Descrição do Bug

Descrição clara e concisa do bug.

## 🔄 Passos para Reproduzir

1. Vá para '...'
2. Clique em '...'
3. Role para baixo até '...'
4. Veja o erro

## ✅ Comportamento Esperado

Descrição do que deveria acontecer.

## 📸 Screenshots

Se aplicável, adicione screenshots.

## 🖥️ Informações do Ambiente

- OS: [e.g. Windows 10, macOS 11.6]
- Browser: [e.g. Chrome 96, Firefox 94]
- Node.js: [e.g. 18.12.0]
- npm: [e.g. 8.19.2]

## 📋 Contexto Adicional

Qualquer informação adicional sobre o problema.
```

## 💡 Sugerir Funcionalidades

### Template de Feature Request

```markdown
## 🚀 Funcionalidade Proposta

Descrição clara da funcionalidade desejada.

## 🎯 Problema que Resolve

Descreva o problema que esta funcionalidade resolveria.

## 💡 Solução Proposta

Descrição detalhada de como a funcionalidade funcionaria.

## 🔄 Alternativas Consideradas

Outras soluções que você considerou.

## 📋 Contexto Adicional

Screenshots, mockups, ou qualquer informação adicional.
```

## 🏆 Reconhecimento

Contribuidores serão reconhecidos:

- No arquivo [AUTHORS.md](AUTHORS.md)
- Nas release notes
- No README principal

## 📞 Contato

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/IAprender/issues)
- **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/IAprender/discussions)
- **Email**: contribuicoes@iaprender.com.br

## 📚 Recursos Úteis

- [Documentação do React](https://reactjs.org/docs)
- [Documentação do Node.js](https://nodejs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Conventional Commits](https://www.conventionalcommits.org)
- [GitHub Flow](https://guides.github.com/introduction/flow)

---

**Obrigado por contribuir com o IAprender! 🎓**
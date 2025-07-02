# 🔐 Configuração de Segurança de Usuários - IAverse

## Estrutura de Segurança Implementada

### 1. **Controle de Criação de Usuários**

#### AWS Cognito - Configurações de Segurança:
```
User Pool Settings:
- Sign-up: DISABLED (apenas admin cria usuários)
- Email verification: REQUIRED
- Password policy: Strong (8+ chars, maiúscula, número, símbolo)
- Account recovery: Email only
- MFA: Optional (recomendado para admins)
```

#### Domínios de Email Autorizados:
```
Padrões aceitos:
- @prefeitura.cidade.gov.br
- @educacao.cidade.gov.br  
- @escola.cidade.edu.br
- @estudante.cidade.edu.br
```

### 2. **Hierarquia de Grupos e Permissões**

| Grupo | Precedência | Acesso | Limitações |
|-------|-------------|--------|------------|
| **Admin** | 0 | Sistema completo | Auditoria total |
| **GestorMunicipal** | 1 | Rede municipal | Apenas seu município |
| **Diretor** | 2 | Escola específica | Apenas sua escola |
| **Professor** | 3 | Ferramentas pedagógicas | Turmas atribuídas |
| **Aluno** | 4 | Aprendizado | Próprio perfil apenas |

### 3. **Processo de Criação Segura**

#### Fluxo Administrativo:
```
1. VALIDAÇÃO PRÉVIA
   ✓ Verificar se usuário já existe
   ✓ Validar email institucional
   ✓ Confirmar autorização do gestor

2. CRIAÇÃO NO COGNITO
   ✓ Username = email institucional
   ✓ Senha temporária gerada
   ✓ Grupo atribuído conforme hierarquia
   ✓ Email de verificação enviado

3. PRIMEIRO ACESSO
   ✓ Login com credenciais temporárias
   ✓ Forçar mudança de senha
   ✓ Aceitar termos de uso
   ✓ Ativar conta na base local

4. MONITORAMENTO
   ✓ Log de criação registrado
   ✓ Notificação ao gestor superior
   ✓ Auditoria de primeiro acesso
```

### 4. **Validações de Segurança**

#### No Backend (routes.ts):
```javascript
// Validação de domínio institucional
const authorizedDomains = [
  '@prefeitura.cidade.gov.br',
  '@educacao.cidade.gov.br',
  '@escola.cidade.edu.br',
  '@estudante.cidade.edu.br'
];

// Validação de hierarquia
const canCreateUser = (creatorRole, targetRole) => {
  const hierarchy = {
    admin: ['admin', 'municipal_manager', 'school_director', 'teacher', 'student'],
    municipal_manager: ['school_director', 'teacher', 'student'],
    school_director: ['teacher', 'student'],
    teacher: ['student']
  };
  return hierarchy[creatorRole]?.includes(targetRole);
};
```

#### Middleware de Autenticação:
```javascript
const authenticateAndValidate = (req, res, next) => {
  // 1. Verificar sessão válida
  // 2. Validar token Cognito
  // 3. Verificar grupo/role
  // 4. Registrar acesso no audit log
};
```

### 5. **Políticas de Senha e Acesso**

#### Política de Senha:
```
- Mínimo 8 caracteres
- Ao menos 1 maiúscula
- Ao menos 1 número
- Ao menos 1 símbolo especial
- Não pode ser reutilizada (últimas 5)
- Expiração: 90 dias (opcional)
```

#### Política de Sessão:
```
- Timeout: 8 horas de inatividade
- Logout automático: fim do dia letivo
- Múltiplas sessões: permitido (máx 3)
- IP tracking: habilitado
```

### 6. **Auditoria e Monitoramento**

#### Logs Obrigatórios:
```
- Criação de usuários
- Mudanças de grupo/permissão  
- Tentativas de login falhadas
- Acessos fora do horário
- Alterações de dados sensíveis
```

#### Alertas Automáticos:
```
- 3+ tentativas de login falhadas
- Acesso de IP não autorizado
- Criação de usuário admin
- Mudança de permissão crítica
```

## 🚀 Implementação Prática

### 1. **Configurar AWS Cognito**
```bash
# Configurações via AWS Console:
1. User Pool → Sign-up → Disable
2. Policies → Password → Strong
3. MFA → Optional
4. Attributes → Email required
5. Groups → Criar hierarquia
```

### 2. **Processo Operacional Diário**

#### Para Criar Gestor Municipal:
```
1. AWS Console → Users → Create user
2. Email: secretario@educacao.cidade.gov.br
3. Group: GestorMunicipal
4. Send credentials via secure email
```

#### Para Criar Diretor:
```
1. Login como GestorMunicipal
2. Interface IAverse → Criar Usuário
3. Email: diretor@escola.cidade.edu.br
4. Aprovação automática (gestor pode criar diretor)
```

#### Para Criar Professor:
```
1. Login como Diretor
2. Interface IAverse → Criar Usuário  
3. Email: professor@escola.cidade.edu.br
4. Aprovação automática (diretor pode criar professor)
```

#### Para Criar Aluno:
```
1. Login como Professor ou Diretor
2. Interface IAverse → Criar Usuário
3. Email: aluno@estudante.cidade.edu.br
4. Aprovação automática
```

### 3. **Monitoramento Contínuo**

#### Dashboard de Segurança:
- Usuários ativos por escola
- Tentativas de acesso não autorizado
- Contas inativas (> 30 dias)
- Mudanças de permissão recentes

#### Relatórios Mensais:
- Auditoria de acessos
- Revisão de permissões
- Usuários para desativação
- Estatísticas de uso

## ✅ Benefícios Desta Abordagem

1. **Segurança Máxima**: Controle total sobre criação de usuários
2. **Rastreabilidade**: Auditoria completa de todas as ações
3. **Hierarquia Clara**: Cada nível só pode criar subordinados
4. **Escalabilidade**: Funciona para 1 escola ou 1000 escolas
5. **Compliance**: Atende requisitos educacionais de segurança
6. **Eficiência**: Processo automatizado após configuração inicial

Esta estrutura garante que apenas pessoas autorizadas tenham acesso ao sistema, com permissões apropriadas ao seu nível hierárquico.
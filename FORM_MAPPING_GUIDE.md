# 📋 GUIA COMPLETO DO SISTEMA DE MAPEAMENTO DE FORMULÁRIOS - IAPRENDER

## 🎯 Visão Geral

O Sistema de Mapeamento de Formulários é uma solução centralizada e automatizada para conectar formulários frontend com endpoints do backend, incluindo validações Zod, controle de permissões e estados padronizados.

### ✨ Principais Benefícios

- **Configuração Centralizada**: Todos os formulários mapeados em um local
- **Validação Automática**: Schemas Zod carregados dinamicamente
- **Controle de Permissões**: Verificação automática por role de usuário
- **Estados Padronizados**: Loading, success, error consistentes
- **Validações Brasileiras**: CPF, CNPJ, CEP, telefone integradas
- **Cache Inteligente**: Invalidação automática de queries relacionadas

## 🗂️ Estrutura de Arquivos

```
client/src/
├── lib/
│   └── mapeamento-forms.js       # Configuração central dos formulários
├── hooks/
│   └── useFormMapping.ts         # Hook customizado principal
├── schemas/
│   ├── auth.ts                   # Schemas de autenticação
│   ├── usuario.ts                # Schemas de usuários
│   ├── escola.ts                 # Schemas de escolas
│   ├── contrato.ts               # Schemas de contratos
│   └── ...                       # Outros schemas por domínio
└── examples/
    └── FormMappingExample.tsx    # Exemplos de uso
```

## ⚙️ Configuração Central

### FORM_MAPPING

```javascript
export const FORM_MAPPING = {
  'form-usuario-criar': { 
    endpoint: '/api/usuarios', 
    method: 'POST',
    schema: 'usuarioSchema',
    requiredRole: ['admin', 'gestor']
  },
  'form-escola-editar': { 
    endpoint: '/api/municipal/schools/:id', 
    method: 'PATCH',
    schema: 'escolaUpdateSchema',
    requiredRole: ['admin', 'gestor']
  }
  // ... mais formulários
};
```

### SCHEMA_MAPPING

```javascript
export const SCHEMA_MAPPING = {
  usuarioSchema: () => import('../schemas/usuario').then(m => m.usuarioSchema),
  escolaSchema: () => import('../schemas/escola').then(m => m.escolaSchema)
  // ... carregamento dinâmico de schemas
};
```

### ROLE_PERMISSIONS

```javascript
export const ROLE_PERMISSIONS = {
  admin: ['*'], // Acesso total
  gestor: ['form-usuario-criar', 'form-escola-criar', /*...*/],
  diretor: ['form-aluno-criar', 'form-professor-criar'],
  professor: ['form-plano-aula', 'form-material-didatico'],
  aluno: ['form-usuario-perfil']
};
```

## 🎣 Hook Principal: useFormMapping

### Uso Básico

```typescript
import { useFormMapping } from '@/hooks/useFormMapping';

const MyForm = () => {
  const {
    form,
    handleSubmit,
    isLoading,
    errors,
    hasPermission
  } = useFormMapping({
    formId: 'form-usuario-criar',
    defaultValues: { name: '', email: '' },
    onSuccess: (data) => console.log('Sucesso!', data),
    invalidateQueries: ['/api/usuarios']
  });

  if (!hasPermission) {
    return <div>Acesso negado</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input {...form.register('name')} />
      <input {...form.register('email')} />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
};
```

### Hooks Especializados

```typescript
// Para formulários de criação
const { form, handleSubmit } = useCreateForm('form-usuario');

// Para formulários de edição com ID
const { form, handleSubmit } = useEditForm('form-usuario', userId);
```

## 🛡️ Sistema de Validação Brasileira

### Hook de Validação

```typescript
import { useBrazilianValidation } from '@/hooks/useFormMapping';

const MyForm = () => {
  const { validateCPF, formatCPF, validatePhone, formatPhone } = useBrazilianValidation();

  // Validação em tempo real
  const cpfValidation = (value) => 
    !value || validateCPF(value) || 'CPF inválido';

  return (
    <input
      {...form.register('document', { validate: cpfValidation })}
      onChange={(e) => {
        e.target.value = formatCPF(e.target.value);
      }}
    />
  );
};
```

### Validações Disponíveis

| Função | Descrição | Exemplo |
|--------|-----------|---------|
| `validateCPF(cpf)` | Valida CPF com dígitos verificadores | `validateCPF('123.456.789-09')` |
| `validateCNPJ(cnpj)` | Valida CNPJ empresarial | `validateCNPJ('11.222.333/0001-81')` |
| `validateCEP(cep)` | Valida formato CEP | `validateCEP('01234-567')` |
| `validatePhone(phone)` | Valida telefone brasileiro com DDD | `validatePhone('(11) 99999-9999')` |
| `formatCPF(cpf)` | Formata CPF automaticamente | `'12345678909' → '123.456.789-09'` |
| `formatCNPJ(cnpj)` | Formata CNPJ automaticamente | `'11222333000181' → '11.222.333/0001-81'` |
| `formatCEP(cep)` | Formata CEP automaticamente | `'01234567' → '01234-567'` |
| `formatPhone(phone)` | Formata telefone automaticamente | `'11999999999' → '(11) 99999-9999'` |

## 📝 Schemas Zod Padronizados

### Schema de Usuário

```typescript
// /client/src/schemas/usuario.ts
export const usuarioSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase(),
  document: z
    .string()
    .optional()
    .refine((doc) => !doc || validateCPF(doc), 'CPF inválido'),
  phone: z
    .string()
    .optional()
    .refine((phone) => !phone || validatePhone(phone), 'Telefone inválido')
});
```

### Schema de Escola

```typescript
// /client/src/schemas/escola.ts
export const escolaSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome muito longo'),
  codigo_inep: z
    .string()
    .length(8, 'Código INEP deve ter 8 dígitos')
    .regex(/^\d+$/, 'Código INEP deve conter apenas números'),
  tipo_escola: z
    .enum(['municipal', 'estadual', 'federal', 'privada']),
  cep: z
    .string()
    .optional()
    .refine((cep) => !cep || validateCEP(cep), 'CEP inválido')
});
```

## 🔧 Utilitários do FormUtils

### Métodos Disponíveis

```javascript
import { FormUtils } from '@/lib/mapeamento-forms';

// Obter configuração do formulário
const config = FormUtils.getFormConfig('form-usuario-criar');

// Verificar permissões
const hasPermission = FormUtils.hasPermission('form-usuario-criar', 'gestor');

// Construir endpoint com parâmetros
const endpoint = FormUtils.buildEndpoint('form-usuario-editar', { id: 123 });
// Resultado: '/api/usuarios/123'

// Carregar schema dinamicamente
const schema = await FormUtils.getSchema('usuarioSchema');

// Obter timeout apropriado
const timeout = FormUtils.getTimeout('form-ai-config'); // 60000ms para IA
```

## 📱 Exemplos Práticos

### 1. Formulário de Criação Simples

```typescript
const CreateUserForm = () => {
  const { form, handleSubmit, isLoading } = useCreateForm('form-usuario', {
    defaultValues: { name: '', email: '', tipo_usuario: 'aluno' },
    onSuccess: () => {
      toast({ title: 'Usuário criado com sucesso!' });
    },
    invalidateQueries: ['/api/usuarios']
  });

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormField label="Nome" error={form.formState.errors.name?.message}>
        <Input {...form.register('name')} disabled={isLoading} />
      </FormField>
      
      <FormField label="Email" error={form.formState.errors.email?.message}>
        <Input {...form.register('email')} type="email" disabled={isLoading} />
      </FormField>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Criando...' : 'Criar Usuário'}
      </Button>
    </FormContainer>
  );
};
```

### 2. Formulário de Edição com ID

```typescript
const EditSchoolForm = ({ schoolId }: { schoolId: number }) => {
  const { form, handleSubmit, isLoading } = useEditForm('form-escola', schoolId, {
    defaultValues: { nome: '', codigo_inep: '', tipo_escola: 'municipal' },
    invalidateQueries: ['/api/municipal/schools', `/api/municipal/schools/${schoolId}`]
  });

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormField label="Nome da Escola">
        <Input {...form.register('nome')} disabled={isLoading} />
      </FormField>
      
      <FormField label="Código INEP">
        <Input {...form.register('codigo_inep')} maxLength={8} disabled={isLoading} />
      </FormField>
      
      <Button type="submit" disabled={isLoading}>
        Salvar Alterações
      </Button>
    </FormContainer>
  );
};
```

### 3. Formulário com Validação Brasileira

```typescript
const UserProfileForm = () => {
  const { form, handleSubmit } = useFormMapping({
    formId: 'form-usuario-perfil',
    defaultValues: { name: '', phone: '', document: '' }
  });
  
  const { validateCPF, formatCPF, formatPhone } = useBrazilianValidation();

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FormField label="CPF">
        <Input
          {...form.register('document', {
            validate: (value) => !value || validateCPF(value) || 'CPF inválido'
          })}
          onChange={(e) => {
            e.target.value = formatCPF(e.target.value);
          }}
          placeholder="000.000.000-00"
        />
      </FormField>
      
      <FormField label="Telefone">
        <Input
          {...form.register('phone')}
          onChange={(e) => {
            e.target.value = formatPhone(e.target.value);
          }}
          placeholder="(11) 99999-9999"
        />
      </FormField>
    </FormContainer>
  );
};
```

## 🔄 Estados de Formulário

### Estados Disponíveis

```typescript
import { FORM_STATES } from '@/lib/mapeamento-forms';

// Estados padronizados
FORM_STATES.IDLE        // 'idle' - Estado inicial
FORM_STATES.LOADING     // 'loading' - Enviando dados
FORM_STATES.SUCCESS     // 'success' - Operação bem-sucedida
FORM_STATES.ERROR       // 'error' - Erro na operação
FORM_STATES.VALIDATING  // 'validating' - Validando dados
```

### Uso dos Estados

```typescript
const MyForm = () => {
  const { customFormState, setFormState, isLoading } = useFormMapping({
    formId: 'form-usuario-criar'
  });

  useEffect(() => {
    if (customFormState === FORM_STATES.SUCCESS) {
      // Lógica pós-sucesso
      setTimeout(() => {
        setFormState(FORM_STATES.IDLE);
      }, 2000);
    }
  }, [customFormState]);

  return (
    <div>
      {customFormState === FORM_STATES.SUCCESS && (
        <Alert>Operação realizada com sucesso!</Alert>
      )}
      {/* Formulário */}
    </div>
  );
};
```

## ⚡ Configurações de Timeout

### Timeouts por Tipo

```javascript
export const FORM_TIMEOUTS = {
  default: 30000,   // 30 segundos - Operações padrão
  upload: 120000,   // 2 minutos - Upload de arquivos
  ai: 60000,        // 1 minuto - Operações de IA
  auth: 15000       // 15 segundos - Autenticação
};
```

### Uso Automático

O sistema detecta automaticamente o tipo de formulário e aplica o timeout apropriado:

- `form-*-upload`: 2 minutos
- `form-ai-*`: 1 minuto  
- `form-auth-*`: 15 segundos
- Outros: 30 segundos

## 🚀 Melhores Práticas

### 1. Nomeação de Formulários

```javascript
// ✅ Bom: Padrão consistente
'form-entidade-acao'
'form-usuario-criar'
'form-escola-editar'
'form-contrato-desativar'

// ❌ Evitar: Inconsistência
'createUser'
'editSchool'
'deleteContract'
```

### 2. Organização de Schemas

```typescript
// ✅ Bom: Um arquivo por domínio
/schemas/usuario.ts    // usuarioSchema, usuarioUpdateSchema, perfilSchema
/schemas/escola.ts     // escolaSchema, escolaUpdateSchema
/schemas/auth.ts       // loginSchema, registerSchema

// ❌ Evitar: Tudo em um arquivo
/schemas/index.ts      // Todos os schemas misturados
```

### 3. Invalidação de Cache

```typescript
// ✅ Bom: Invalidar queries relacionadas
invalidateQueries: [
  '/api/usuarios',                    // Lista principal
  `/api/usuarios/${userId}`,          // Item específico
  '/api/municipal/stats'              // Estatísticas relacionadas
]

// ❌ Evitar: Não invalidar cache
invalidateQueries: []
```

### 4. Tratamento de Erros

```typescript
// ✅ Bom: Callbacks específicos
const { form, handleSubmit } = useFormMapping({
  formId: 'form-usuario-criar',
  onSuccess: (data) => {
    toast({ title: 'Usuário criado!', variant: 'default' });
    router.push('/usuarios');
  },
  onError: (error) => {
    console.error('Erro ao criar usuário:', error);
    toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  }
});
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Schema não encontrado
```
Erro: Schema 'usuarioSchema' não encontrado
```
**Solução**: Verificar se o schema está exportado e mapeado corretamente:

```typescript
// schemas/usuario.ts
export const usuarioSchema = z.object({...});

// mapeamento-forms.js
usuarioSchema: () => import('../schemas/usuario').then(m => m.usuarioSchema)
```

#### 2. Permissão negada
```
Erro: Usuário não tem permissão para acessar o formulário
```
**Solução**: Verificar se o role do usuário está na lista `requiredRole`:

```javascript
'form-usuario-criar': {
  requiredRole: ['admin', 'gestor'], // Adicionar role necessário
  // ...
}
```

#### 3. Endpoint não encontrado
```
Erro: Configuração não encontrada para o formulário
```
**Solução**: Verificar se o formId está mapeado em `FORM_MAPPING`:

```javascript
// Adicionar em FORM_MAPPING
'form-meu-formulario': {
  endpoint: '/api/minha-rota',
  method: 'POST'
}
```

## 📚 Recursos Adicionais

### Documentação Relacionada
- [Sistema de Templates UI](./FORM_TEMPLATE_GUIDE.md)
- [Validações Brasileiras](./BRAZILIAN_VALIDATION.md)
- [Controle de Acesso](./ACCESS_CONTROL.md)

### Próximas Implementações
- [ ] Sistema de auto-save
- [ ] Validação assíncrona de campos únicos
- [ ] Upload de arquivos integrado
- [ ] Cache de formulários offline
- [ ] Analytics de uso de formulários

---

*Última atualização: 10 de Julho de 2025*
*Versão: 1.0.0*
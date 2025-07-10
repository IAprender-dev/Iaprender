# 📋 **Guia do FormGenerator - IAprender**

## **Visão Geral**

O FormGenerator é um sistema completo para criação dinâmica de formulários HTML com integração automática ao sistema de autenticação e validação do IAprender. Permite gerar formulários complexos através de configurações JSON simples.

## **Características Principais**

### ✅ **Integração Completa**
- **AuthManager**: Verificação automática de autenticação
- **FormHandler**: Envio seguro com retry automático
- **Validação Brasileira**: CPF, CNPJ, telefone, CEP com máscaras
- **TypeScript**: Tipagem completa para maior segurança

### ✅ **Tipos de Campo Suportados**
- `text` - Campo de texto simples
- `email` - Email com validação automática
- `password` - Campo de senha
- `tel` - Telefone com máscara brasileira
- `date` - Seletor de data
- `select` - Lista de seleção
- `textarea` - Área de texto
- `number` - Campos numéricos
- `cpf` - CPF com máscara e validação
- `cnpj` - CNPJ com máscara e validação
- `cep` - CEP com máscara

### ✅ **Recursos Avançados**
- **Classes CSS Customizáveis**: Estilização flexível
- **Feedback Visual**: Mensagens de sucesso e erro
- **Reset Automático**: Botão opcional para limpar formulário
- **Validação em Tempo Real**: Feedback imediato ao usuário
- **Máscaras Brasileiras**: Aplicação automática de formatação
- **Responsivo**: Design adaptável a diferentes telas

## **Como Usar**

### **1. Importação Básica**

```typescript
import { createFormGenerator, FormConfig } from '../utils/formGenerator';
import { CONFIGURACOES_FORMULARIOS } from '../utils/formConfigs';
```

### **2. Criar FormGenerator**

```typescript
// Em HTML/JavaScript
const formGenerator = createFormGenerator('container-id');

// Em React
useEffect(() => {
  const formGenerator = createFormGenerator('container-id');
  
  return () => {
    formGenerator.destroy();
  };
}, []);
```

### **3. Configuração Básica**

```typescript
const config: FormConfig = {
  id: 'meu-formulario',
  title: 'Título do Formulário',
  description: 'Descrição opcional',
  endpoint: '/api/endpoint',
  method: 'POST',
  submitText: 'Enviar',
  showReset: true,
  fields: [
    {
      name: 'nome',
      label: 'Nome',
      type: 'text',
      required: true,
      placeholder: 'Digite seu nome'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true
    }
  ],
  onSuccess: (response) => {
    console.log('Sucesso:', response);
  },
  onError: (error) => {
    console.error('Erro:', error);
  }
};

const formHandler = formGenerator.generate(config);
```

### **4. Usando Configurações Predefinidas**

```typescript
import { CONFIGURACOES_FORMULARIOS } from '../utils/formConfigs';

// Formulário de cadastro de usuário
const formHandler = formGenerator.generate(CONFIGURACOES_FORMULARIOS.CADASTRO_USUARIO);

// Formulário de matrícula de aluno
const formHandler = formGenerator.generate(CONFIGURACOES_FORMULARIOS.MATRICULA_ALUNO);

// Formulário de contato
const formHandler = formGenerator.generate(CONFIGURACOES_FORMULARIOS.CONTATO);
```

## **Configurações Predefinidas Disponíveis**

### **📚 Educacionais**
- `CADASTRO_USUARIO` - Cadastro completo de usuários
- `CADASTRO_ESCOLA` - Registro de instituições de ensino
- `MATRICULA_ALUNO` - Matrícula de novos alunos
- `CADASTRO_PROFESSOR` - Registro de professores

### **🔧 Suporte e Feedback**
- `CONTATO` - Formulário de contato geral
- `RELATORIO_PROBLEMA` - Reporte de bugs e problemas
- `AVALIACAO_SATISFACAO` - Pesquisa de satisfação

## **Exemplos Práticos**

### **Exemplo 1: Formulário Simples de Contato**

```typescript
const contatoConfig: FormConfig = {
  id: 'contato-simples',
  title: 'Entre em Contato',
  endpoint: '/api/contato',
  fields: [
    {
      name: 'nome',
      label: 'Seu Nome',
      type: 'text',
      required: true
    },
    {
      name: 'email',
      label: 'Seu Email',
      type: 'email',
      required: true
    },
    {
      name: 'mensagem',
      label: 'Mensagem',
      type: 'textarea',
      required: true,
      rows: 5
    }
  ]
};
```

### **Exemplo 2: Formulário com Validação Brasileira**

```typescript
const empresaConfig: FormConfig = {
  id: 'cadastro-empresa',
  title: 'Cadastro de Empresa',
  endpoint: '/api/empresas',
  fields: [
    {
      name: 'razao_social',
      label: 'Razão Social',
      type: 'text',
      required: true
    },
    {
      name: 'cnpj',
      label: 'CNPJ',
      type: 'cnpj',
      required: true
    },
    {
      name: 'telefone',
      label: 'Telefone',
      type: 'tel',
      required: true
    },
    {
      name: 'cep',
      label: 'CEP',
      type: 'cep',
      required: true
    }
  ]
};
```

### **Exemplo 3: Formulário com Estilização Customizada**

```typescript
const formCustomizado: FormConfig = {
  id: 'form-customizado',
  title: 'Formulário Elegante',
  endpoint: '/api/dados',
  classes: {
    container: 'max-w-4xl mx-auto p-8 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl shadow-xl',
    form: 'space-y-8',
    field: 'mb-8',
    label: 'block text-lg font-semibold text-purple-800 mb-3',
    input: 'w-full px-6 py-4 text-lg border-2 border-purple-300 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-200 transition-all duration-300',
    button: 'w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl py-4 px-8 rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 font-bold shadow-lg'
  },
  fields: [
    // campos do formulário...
  ]
};
```

### **Exemplo 4: Formulário com Validação Customizada**

```typescript
const loginConfig: FormConfig = {
  id: 'login-form',
  title: 'Fazer Login',
  endpoint: '/api/auth/login',
  fields: [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      validation: 'required|email'
    },
    {
      name: 'password',
      label: 'Senha',
      type: 'password',
      required: true,
      validation: 'required|minLength:8'
    },
    {
      name: 'remember',
      label: 'Lembrar de mim',
      type: 'checkbox'
    }
  ]
};
```

## **Integrações Avançadas**

### **Em Componentes React**

```tsx
import React, { useEffect, useRef } from 'react';
import { createFormGenerator } from '../utils/formGenerator';
import { FORM_CADASTRO_USUARIO } from '../utils/formConfigs';

const CadastroComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const formGeneratorRef = useRef<FormGenerator | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      formGeneratorRef.current = createFormGenerator('cadastro-container');
      
      const config = {
        ...FORM_CADASTRO_USUARIO,
        onSuccess: (response) => {
          // Lógica de sucesso customizada
          console.log('Usuário cadastrado:', response);
          // Redirect, toast, etc.
        }
      };
      
      formGeneratorRef.current.generate(config);
    }

    return () => {
      formGeneratorRef.current?.destroy();
    };
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div ref={containerRef} id="cadastro-container"></div>
    </div>
  );
};
```

### **Em Páginas HTML**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Formulário Dinâmico</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="form-container" class="container mx-auto py-8"></div>
  
  <script type="module">
    import { createFormGenerator } from './utils/formGenerator.js';
    import { FORM_CONTATO } from './utils/formConfigs.js';
    
    const formGenerator = createFormGenerator('form-container');
    formGenerator.generate(FORM_CONTATO);
  </script>
</body>
</html>
```

## **Validações Disponíveis**

### **Validações Automáticas por Tipo**
- `email` → Validação de formato de email
- `cpf` → Validação de CPF brasileiro
- `cnpj` → Validação de CNPJ brasileiro
- `tel` → Validação de telefone brasileiro
- `cep` → Validação de CEP brasileiro

### **Validações Customizadas**
```typescript
{
  name: 'campo',
  label: 'Campo',
  type: 'text',
  validation: 'required|minLength:3|maxLength:50'
}
```

**Regras disponíveis:**
- `required` - Campo obrigatório
- `minLength:N` - Mínimo de N caracteres
- `maxLength:N` - Máximo de N caracteres
- `email` - Formato de email válido
- `cpf` - CPF brasileiro válido
- `cnpj` - CNPJ brasileiro válido
- `phone` - Telefone brasileiro válido
- `cep` - CEP brasileiro válido

## **Máscaras Automáticas**

O FormGenerator aplica automaticamente máscaras brasileiras:

- **CPF**: `000.000.000-00`
- **CNPJ**: `00.000.000/0000-00`
- **Telefone**: `(00) 00000-0000` ou `(00) 0000-0000`
- **CEP**: `00000-000`

## **Estados e Eventos**

### **Estados do Formulário**
- `IDLE` - Formulário pronto para uso
- `LOADING` - Enviando dados
- `SUCCESS` - Envio realizado com sucesso
- `ERROR` - Erro no envio

### **Eventos Customizados**
```typescript
const config: FormConfig = {
  // ...
  onSuccess: (response) => {
    // Executado quando o formulário é enviado com sucesso
    console.log('Dados enviados:', response);
    showSuccessToast('Formulário enviado!');
  },
  onError: (error) => {
    // Executado quando há erro no envio
    console.error('Erro no envio:', error);
    showErrorToast(error.message);
  },
  onValidationError: (errors) => {
    // Executado quando há erros de validação
    console.log('Erros de validação:', errors);
  }
};
```

## **Métodos do FormGenerator**

```typescript
const formGenerator = createFormGenerator('container-id');

// Gerar formulário
const formHandler = formGenerator.generate(config);

// Verificar autenticação
const isAuth = formHandler.isAuthenticated();

// Atualizar estado de autenticação
formHandler.refreshAuthState();

// Resetar formulário
formHandler.reset();

// Obter estado atual
const state = formHandler.getState();

// Destruir formulário
formGenerator.destroy();
```

## **Exemplos de CSS Customizado**

### **Tema Escuro**
```typescript
classes: {
  container: 'max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl',
  form: 'space-y-6',
  label: 'block text-sm font-medium text-gray-200 mb-2',
  input: 'w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
  button: 'w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
}
```

### **Tema Moderno**
```typescript
classes: {
  container: 'max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100',
  form: 'space-y-8',
  field: 'relative',
  label: 'block text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide',
  input: 'w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-all duration-300 bg-gray-50 focus:bg-white',
  button: 'w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 font-bold shadow-lg'
}
```

## **Tratamento de Erros**

O FormGenerator inclui tratamento robusto de erros:

### **Erros de Autenticação**
- Verifica automaticamente se o usuário está logado
- Desabilita formulário se não autenticado
- Mostra mensagem "Login Necessário"

### **Erros de Validação**
- Validação em tempo real nos campos
- Mensagens específicas por campo
- Destaque visual nos campos com erro

### **Erros de Envio**
- Retry automático com backoff exponencial
- Renovação de token em caso de erro 401
- Mensagens de erro contextualizadas

## **Performance e Otimização**

### **Boas Práticas**
- Use `destroy()` para limpar eventos quando não precisar mais do formulário
- Reutilize configurações em variáveis para evitar recriação
- Use configurações predefinidas sempre que possível
- Aplique validação no frontend E backend

### **Exemplo de Cleanup em React**
```tsx
useEffect(() => {
  const formGenerator = createFormGenerator('container-id');
  const formHandler = formGenerator.generate(config);
  
  return () => {
    formGenerator.destroy(); // Limpa eventos e elementos
  };
}, []);
```

## **Troubleshooting**

### **Problema: Formulário não aparece**
- Verifique se o container existe no DOM
- Confirme se o ID do container está correto
- Verifique erros no console do navegador

### **Problema: Validação não funciona**
- Confirme se os tipos de campo estão corretos
- Verifique se as regras de validação estão bem formatadas
- Teste a validação individual de cada campo

### **Problema: Envio falha**
- Verifique se o usuário está autenticado
- Confirme se o endpoint está correto
- Teste a conectividade com o backend

### **Problema: Máscaras não aplicam**
- Verifique se o tipo do campo está correto (`cpf`, `cnpj`, `tel`, `cep`)
- Confirme se o JavaScript está carregado completamente
- Teste individualmente cada tipo de máscara

---

**Versão**: 1.0.0 - Sistema de Formulários Dinâmicos  
**Data**: 10 de Julho de 2025  
**Compatibilidade**: JavaScript ES6+, TypeScript 4.0+, React 17+
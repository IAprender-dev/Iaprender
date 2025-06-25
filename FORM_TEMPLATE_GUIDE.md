# IAverse Form Template System - Guia de Uso

Este documento descreve como usar o sistema de templates de formulários padronizado do IAverse.

## Estrutura dos Templates

### Cores e Esquemas Visuais

O sistema inclui 5 esquemas de cores predefinidos:

- **Primary** (Azul/Roxo): Para formulários principais e cadastros
- **Secondary** (Roxo/Índigo): Para configurações e preferências  
- **Success** (Verde/Esmeralda): Para confirmações e aprovações
- **Warning** (Amarelo/Laranja): Para alertas e notificações
- **Danger** (Vermelho/Rosa): Para exclusões e ações críticas

### Componentes Disponíveis

#### FormContainer
Container principal do formulário com backdrop blur e sombras.
```tsx
<FormContainer className="custom-class">
  {/* conteúdo do formulário */}
</FormContainer>
```

#### FormHeader
Cabeçalho com título e descrição.
```tsx
<FormHeader
  title="Título do Formulário"
  description="Descrição explicativa"
  colorScheme="primary"
/>
```

#### FormSection
Seção do formulário com ícone e agrupamento visual.
```tsx
<FormSection title="Dados Pessoais" icon="user" colorScheme="primary">
  {/* campos da seção */}
</FormSection>
```

#### FormField
Campo individual com label e helper text.
```tsx
<FormField label="Nome Completo" required helper="Digite seu nome completo">
  <TemplateInput placeholder="Ex: João Silva" icon="user" />
</FormField>
```

#### TemplateInput
Campo de entrada com ícone e estilização.
```tsx
<TemplateInput
  placeholder="Digite aqui..."
  icon="user"
  type="text"
  value={value}
  onChange={handleChange}
  colorScheme="primary"
/>
```

#### TemplateSelect
Seletor dropdown com ícone.
```tsx
<TemplateSelect
  placeholder="Selecione uma opção"
  icon="role"
  value={value}
  onValueChange={handleChange}
  colorScheme="primary"
>
  <SelectItem value="option1">Opção 1</SelectItem>
  <SelectItem value="option2">Opção 2</SelectItem>
</TemplateSelect>
```

#### TemplateTextarea
Área de texto multilinha.
```tsx
<TemplateTextarea
  placeholder="Digite sua mensagem..."
  value={value}
  onChange={handleChange}
  rows={4}
  colorScheme="primary"
/>
```

#### TemplateDatePicker
Seletor de data com formatação brasileira.
```tsx
<TemplateDatePicker
  placeholder="Selecione a data"
  value={date}
  onChange={setDate}
  colorScheme="primary"
/>
```

#### TemplateCheckbox
Checkbox estilizado.
```tsx
<TemplateCheckbox
  label="Aceito os termos"
  checked={checked}
  onChange={setChecked}
  colorScheme="primary"
/>
```

#### TemplateButton
Botão com variantes e tamanhos.
```tsx
<TemplateButton
  variant="primary"
  size="lg"
  type="submit"
  onClick={handleClick}
>
  Salvar
</TemplateButton>
```

### Layouts e Grids

#### FormGrid
Sistema de grid responsivo.
```tsx
<FormGrid columns={2} gap={4}>
  <FormField label="Nome">
    <TemplateInput placeholder="Nome" />
  </FormField>
  <FormField label="Sobrenome">
    <TemplateInput placeholder="Sobrenome" />
  </FormField>
</FormGrid>
```

#### FormActions
Área de ações do formulário.
```tsx
<FormActions align="between">
  <TemplateButton variant="outline">Cancelar</TemplateButton>
  <TemplateButton variant="primary">Salvar</TemplateButton>
</FormActions>
```

## Ícones Disponíveis

- `user`: Dados pessoais
- `email`: Email e comunicação
- `phone`: Telefone e contato
- `address`: Endereço e localização
- `education`: Educação e cursos
- `role`: Função e cargo
- `academic`: Acadêmico
- `calendar`: Data e hora

## Exemplo de Uso Completo

```tsx
import React, { useState } from 'react';
import {
  FormContainer,
  FormHeader,
  FormSection,
  FormField,
  FormGrid,
  FormActions,
  TemplateInput,
  TemplateSelect,
  TemplateButton
} from '@/components/ui/form-template';

export const ExampleForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  return (
    <FormContainer>
      <div className="p-8">
        <FormHeader
          title="Novo Cadastro"
          description="Preencha os dados abaixo"
          colorScheme="primary"
        />

        <div className="space-y-6">
          <FormSection title="Dados Básicos" icon="user" colorScheme="primary">
            <FormGrid columns={2}>
              <FormField label="Nome" required>
                <TemplateInput
                  placeholder="Digite o nome"
                  icon="user"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </FormField>

              <FormField label="Email" required>
                <TemplateInput
                  placeholder="Digite o email"
                  icon="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </FormField>
            </FormGrid>

            <FormField label="Função" required>
              <TemplateSelect
                placeholder="Selecione a função"
                icon="role"
                value={formData.role}
                onValueChange={(value) => setFormData({...formData, role: value})}
              >
                <SelectItem value="student">Aluno</SelectItem>
                <SelectItem value="teacher">Professor</SelectItem>
              </TemplateSelect>
            </FormField>
          </FormSection>

          <FormActions align="between">
            <TemplateButton variant="outline">
              Cancelar
            </TemplateButton>
            <TemplateButton variant="primary" type="submit">
              Salvar
            </TemplateButton>
          </FormActions>
        </div>
      </div>
    </FormContainer>
  );
};
```

## Diretrizes de Design

### Cores
- Use **primary** para formulários principais
- Use **secondary** para configurações
- Use **success** para confirmações
- Use **warning** para alertas
- Use **danger** para ações perigosas

### Tipografia
- Títulos: 3xl, bold, gradiente
- Labels: sm, bold, uppercase, tracking-wide
- Placeholders: slate-600
- Helper text: sm, slate-500

### Espaçamento
- Seções: space-y-6
- Campos: space-y-4  
- Grid gap: 4
- Padding interno: p-8

### Efeitos Visuais
- Backdrop blur em containers
- Sombras em cards e botões
- Transições suaves (300ms)
- Hover effects com scale
- Focus rings coloridos

## Integração com Formulários Existentes

Para aplicar o template a um formulário existente:

1. Importe os componentes do template
2. Substitua inputs por TemplateInput
3. Agrupe campos em FormSection
4. Use FormGrid para layouts
5. Aplique o esquema de cores apropriado
6. Configure FormActions para botões

## Customização

Todos os componentes aceitam `className` para customizações específicas.
As cores podem ser ajustadas através das variáveis CSS no arquivo `form-templates.css`.
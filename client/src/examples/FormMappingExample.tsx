/**
 * EXEMPLO DE USO DO SISTEMA DE MAPEAMENTO DE FORMULÁRIOS
 * 
 * Este componente demonstra como usar o sistema de mapeamento
 * para criar formulários padronizados e automatizados.
 */

import React from 'react';
import { useFormMapping, useCreateForm, useBrazilianValidation } from '@/hooks/useFormMapping';
import { FormContainer, FormHeader, FormSection, FormField } from '@/components/ui/form-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, User, School, Building } from 'lucide-react';

// Exemplo 1: Formulário de Criação de Usuário
const CreateUserExample = () => {
  const {
    form,
    handleSubmit,
    isLoading,
    isSuccess,
    errors,
    formConfig
  } = useCreateForm('form-usuario', {
    defaultValues: {
      name: '',
      email: '',
      tipo_usuario: 'aluno',
      phone: '',
      document: ''
    },
    onSuccess: (data) => {
      console.log('Usuário criado com sucesso:', data);
    },
    invalidateQueries: ['/api/usuarios']
  });

  const { validateCPF, formatCPF, formatPhone } = useBrazilianValidation();

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>Criar Usuário</CardTitle>
        </div>
        <CardDescription>
          Formulário automatizado usando o sistema de mapeamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormContainer onSubmit={handleSubmit}>
          <FormSection title="Dados Pessoais">
            <FormField
              label="Nome Completo"
              error={errors.name?.message}
              required
            >
              <Input
                {...form.register('name')}
                placeholder="Digite o nome completo"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="Email"
              error={errors.email?.message}
              required
            >
              <Input
                {...form.register('email')}
                type="email"
                placeholder="usuario@exemplo.com"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="Tipo de Usuário"
              error={errors.tipo_usuario?.message}
              required
            >
              <Select
                onValueChange={(value) => form.setValue('tipo_usuario', value)}
                defaultValue={form.getValues('tipo_usuario')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="diretor">Diretor</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="aluno">Aluno</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </FormSection>

          <FormSection title="Contato">
            <FormField
              label="Telefone"
              error={errors.phone?.message}
            >
              <Input
                {...form.register('phone', {
                  onChange: (e) => {
                    e.target.value = formatPhone(e.target.value);
                  }
                })}
                placeholder="(11) 99999-9999"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="CPF"
              error={errors.document?.message}
            >
              <Input
                {...form.register('document', {
                  validate: (value) => !value || validateCPF(value) || 'CPF inválido',
                  onChange: (e) => {
                    e.target.value = formatCPF(e.target.value);
                  }
                })}
                placeholder="000.000.000-00"
                disabled={isLoading}
              />
            </FormField>
          </FormSection>

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Usuário'
              )}
            </Button>

            {isSuccess && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Criado!</span>
              </div>
            )}
          </div>
        </FormContainer>

        {/* Informações de Debug */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
          <div className="font-semibold mb-2">Configuração do Formulário:</div>
          <div>Endpoint: <Badge variant="outline">{formConfig?.endpoint}</Badge></div>
          <div>Método: <Badge variant="outline">{formConfig?.method}</Badge></div>
          <div>Schema: <Badge variant="outline">{formConfig?.schema}</Badge></div>
        </div>
      </CardContent>
    </Card>
  );
};

// Exemplo 2: Formulário de Escola com Validação Avançada
const CreateSchoolExample = () => {
  const {
    form,
    handleSubmit,
    isLoading,
    errors,
    hasPermission
  } = useCreateForm('form-escola', {
    defaultValues: {
      nome: '',
      codigo_inep: '',
      tipo_escola: 'municipal',
      telefone: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    onSuccess: () => {
      form.reset();
    },
    invalidateQueries: ['/api/municipal/schools']
  });

  const { formatPhone, formatCEP, validateCEP } = useBrazilianValidation();

  if (!hasPermission) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            <span>Você não tem permissão para criar escolas</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <School className="h-5 w-5" />
          <CardTitle>Criar Escola</CardTitle>
        </div>
        <CardDescription>
          Cadastro de nova instituição de ensino
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormContainer onSubmit={handleSubmit}>
          <FormSection title="Informações Básicas">
            <FormField
              label="Nome da Escola"
              error={errors.nome?.message}
              required
            >
              <Input
                {...form.register('nome')}
                placeholder="Nome completo da escola"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="Código INEP"
              error={errors.codigo_inep?.message}
              required
            >
              <Input
                {...form.register('codigo_inep')}
                placeholder="00000000"
                maxLength={8}
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="Tipo de Escola"
              error={errors.tipo_escola?.message}
              required
            >
              <Select
                onValueChange={(value) => form.setValue('tipo_escola', value)}
                defaultValue={form.getValues('tipo_escola')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="estadual">Estadual</SelectItem>
                  <SelectItem value="federal">Federal</SelectItem>
                  <SelectItem value="privada">Privada</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </FormSection>

          <FormSection title="Contato">
            <FormField
              label="Telefone"
              error={errors.telefone?.message}
            >
              <Input
                {...form.register('telefone', {
                  onChange: (e) => {
                    e.target.value = formatPhone(e.target.value);
                  }
                })}
                placeholder="(11) 99999-9999"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="Email"
              error={errors.email?.message}
            >
              <Input
                {...form.register('email')}
                type="email"
                placeholder="contato@escola.edu.br"
                disabled={isLoading}
              />
            </FormField>
          </FormSection>

          <FormSection title="Endereço">
            <FormField
              label="CEP"
              error={errors.cep?.message}
            >
              <Input
                {...form.register('cep', {
                  validate: (value) => !value || validateCEP(value) || 'CEP inválido',
                  onChange: (e) => {
                    e.target.value = formatCEP(e.target.value);
                  }
                })}
                placeholder="00000-000"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="Endereço"
              error={errors.endereco?.message}
            >
              <Input
                {...form.register('endereco')}
                placeholder="Rua, número, bairro"
                disabled={isLoading}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Cidade"
                error={errors.cidade?.message}
              >
                <Input
                  {...form.register('cidade')}
                  placeholder="Cidade"
                  disabled={isLoading}
                />
              </FormField>

              <FormField
                label="Estado"
                error={errors.estado?.message}
              >
                <Input
                  {...form.register('estado')}
                  placeholder="UF"
                  maxLength={2}
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </FormSection>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando Escola...
              </>
            ) : (
              'Criar Escola'
            )}
          </Button>
        </FormContainer>
      </CardContent>
    </Card>
  );
};

// Exemplo 3: Demonstração de Edição com ID
const EditUserExample = ({ userId }: { userId: number }) => {
  const {
    form,
    handleSubmit,
    isLoading,
    errors
  } = useFormMapping({
    formId: 'form-usuario-editar',
    params: { id: userId },
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    },
    onSuccess: (data) => {
      console.log('Usuário atualizado:', data);
    },
    invalidateQueries: ['/api/usuarios', `/api/usuarios/${userId}`]
  });

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Editar Usuário #{userId}</CardTitle>
        <CardDescription>
          Formulário de edição automatizado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormContainer onSubmit={handleSubmit}>
          <FormField
            label="Nome"
            error={errors.name?.message}
          >
            <Input
              {...form.register('name')}
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Email"
            error={errors.email?.message}
          >
            <Input
              {...form.register('email')}
              type="email"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Telefone"
            error={errors.phone?.message}
          >
            <Input
              {...form.register('phone')}
              disabled={isLoading}
            />
          </FormField>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </FormContainer>
      </CardContent>
    </Card>
  );
};

// Componente Principal de Demonstração
export const FormMappingExample = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sistema de Mapeamento de Formulários</h1>
        <p className="text-gray-600">
          Demonstrações de como usar o sistema automatizado de formulários
        </p>
      </div>

      <Tabs defaultValue="usuario" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usuario">Criar Usuário</TabsTrigger>
          <TabsTrigger value="escola">Criar Escola</TabsTrigger>
          <TabsTrigger value="editar">Editar Usuário</TabsTrigger>
        </TabsList>

        <TabsContent value="usuario" className="mt-6">
          <div className="flex justify-center">
            <CreateUserExample />
          </div>
        </TabsContent>

        <TabsContent value="escola" className="mt-6">
          <div className="flex justify-center">
            <CreateSchoolExample />
          </div>
        </TabsContent>

        <TabsContent value="editar" className="mt-6">
          <div className="flex justify-center">
            <EditUserExample userId={1} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Documentação */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            <CardTitle>Como Usar</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Import do Hook</h4>
            <code className="bg-gray-100 p-2 rounded text-sm block">
              {`import { useFormMapping, useCreateForm } from '@/hooks/useFormMapping';`}
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Configurar o Formulário</h4>
            <code className="bg-gray-100 p-2 rounded text-sm block">
              {`const { form, handleSubmit, isLoading } = useCreateForm('form-usuario');`}
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Usar nos Componentes</h4>
            <code className="bg-gray-100 p-2 rounded text-sm block">
              {`<FormContainer onSubmit={handleSubmit}>
  <Input {...form.register('name')} />
  <Button type="submit">Enviar</Button>
</FormContainer>`}
            </code>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Benefícios</h4>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Configuração centralizada de endpoints</li>
              <li>• Validação automática com Zod</li>
              <li>• Invalidação de cache automática</li>
              <li>• Estados de loading/erro padronizados</li>
              <li>• Validações brasileiras integradas</li>
              <li>• Controle de permissões por role</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormMappingExample;
/**
 * EXEMPLOS DE USO DO FORMHANDLER UNIVERSAL
 * 
 * Este componente demonstra como usar a classe FormHandler
 * para gerenciar formulários HTML tradicionais.
 */

import React, { useEffect, useRef } from 'react';
import { FormHandler, createFormHandler, createMappedFormHandler } from '@/utils/formHandler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code2, FileText, Settings, User } from 'lucide-react';

// Exemplo 1: Formulário Básico com Validação
const BasicFormExample = () => {
  const formHandlerRef = useRef<FormHandler | null>(null);

  useEffect(() => {
    formHandlerRef.current = createFormHandler('basic-form', {
      endpoint: '/api/usuarios',
      method: 'POST',
      showLoading: true,
      validateOnSubmit: true,
      autoReset: true,
      onSuccess: (response) => {
        console.log('✅ Usuário criado:', response);
        alert('Usuário criado com sucesso!');
      },
      onError: (error) => {
        console.error('❌ Erro:', error);
      },
      customValidation: (data) => {
        const errors: Record<string, string> = {};
        
        if (data.password !== data.confirmPassword) {
          errors.confirmPassword = 'As senhas não coincidem';
        }
        
        return Object.keys(errors).length > 0 ? errors : null;
      },
      debug: true
    });

    return () => {
      formHandlerRef.current?.destroy();
    };
  }, []);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>FormHandler Básico</CardTitle>
        </div>
        <CardDescription>
          Formulário HTML com validação automática e envio para API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="basic-form" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu nome completo"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="document" className="block text-sm font-medium mb-1">
              CPF
            </label>
            <input
              type="text"
              id="document"
              name="document"
              data-validation="cpf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              data-validation="phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label htmlFor="tipo_usuario" className="block text-sm font-medium mb-1">
              Tipo de Usuário *
            </label>
            <select
              id="tipo_usuario"
              name="tipo_usuario"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="admin">Administrador</option>
              <option value="gestor">Gestor</option>
              <option value="diretor">Diretor</option>
              <option value="professor">Professor</option>
              <option value="aluno">Aluno</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Senha *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirmar Senha *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite a senha novamente"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar Usuário
          </button>
        </form>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
          <div className="font-semibold mb-2">Funcionalidades Ativas:</div>
          <div className="space-y-1">
            <div>• Validação automática de CPF e telefone</div>
            <div>• Validação customizada (confirmação de senha)</div>
            <div>• Estados de loading automático</div>
            <div>• Reset automático após sucesso</div>
            <div>• Retry automático em caso de falha de rede</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Exemplo 2: Formulário com Mapeamento Integrado
const MappedFormExample = () => {
  const formHandlerRef = useRef<FormHandler | null>(null);

  useEffect(() => {
    try {
      formHandlerRef.current = createMappedFormHandler('form-escola-criar', {
        onSuccess: (response) => {
          console.log('✅ Escola criada:', response);
          alert('Escola criada com sucesso!');
        },
        onError: (error) => {
          console.error('❌ Erro ao criar escola:', error);
        },
        debug: true
      });
    } catch (error) {
      console.error('Erro ao criar FormHandler mapeado:', error);
    }

    return () => {
      formHandlerRef.current?.destroy();
    };
  }, []);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>FormHandler Mapeado</CardTitle>
        </div>
        <CardDescription>
          Formulário usando configuração do sistema de mapeamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-escola-criar" className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium mb-1">
              Nome da Escola *
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              required
              minLength={3}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo da escola"
            />
          </div>

          <div>
            <label htmlFor="codigo_inep" className="block text-sm font-medium mb-1">
              Código INEP *
            </label>
            <input
              type="text"
              id="codigo_inep"
              name="codigo_inep"
              required
              pattern="^\d{8}$"
              maxLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12345678"
            />
          </div>

          <div>
            <label htmlFor="tipo_escola" className="block text-sm font-medium mb-1">
              Tipo de Escola *
            </label>
            <select
              id="tipo_escola"
              name="tipo_escola"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="municipal">Municipal</option>
              <option value="estadual">Estadual</option>
              <option value="federal">Federal</option>
              <option value="privada">Privada</option>
            </select>
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium mb-1">
              Telefone
            </label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              data-validation="phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contato@escola.edu.br"
            />
          </div>

          <div>
            <label htmlFor="cep" className="block text-sm font-medium mb-1">
              CEP
            </label>
            <input
              type="text"
              id="cep"
              name="cep"
              data-validation="cep"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00000-000"
            />
          </div>

          <div>
            <label htmlFor="endereco" className="block text-sm font-medium mb-1">
              Endereço
            </label>
            <input
              type="text"
              id="endereco"
              name="endereco"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rua, número, bairro"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cidade" className="block text-sm font-medium mb-1">
                Cidade
              </label>
              <input
                type="text"
                id="cidade"
                name="cidade"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cidade"
              />
            </div>
            <div>
              <label htmlFor="estado" className="block text-sm font-medium mb-1">
                Estado
              </label>
              <input
                type="text"
                id="estado"
                name="estado"
                maxLength={2}
                pattern="^[A-Z]{2}$"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SP"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar Escola
          </button>
        </form>

        <div className="mt-4 p-3 bg-green-50 rounded-lg text-xs">
          <div className="font-semibold mb-2">Configuração Automática:</div>
          <div className="space-y-1">
            <div>• Endpoint: <Badge variant="outline">/api/municipal/schools</Badge></div>
            <div>• Método: <Badge variant="outline">POST</Badge></div>
            <div>• Timeout: <Badge variant="outline">30s</Badge></div>
            <div>• Permissões: <Badge variant="outline">admin, gestor</Badge></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Exemplo 3: Formulário com Configuração Avançada
const AdvancedFormExample = () => {
  const formHandlerRef = useRef<FormHandler | null>(null);

  useEffect(() => {
    const handler = createFormHandler('advanced-form', {
      endpoint: '/api/advanced-operation',
      method: 'PATCH',
      timeout: 60000, // 1 minuto
      retries: 5,
      showLoading: true,
      validateOnSubmit: true,
      autoReset: false,
      onSuccess: (response) => {
        console.log('✅ Operação avançada concluída:', response);
        
        // Lógica customizada pós-sucesso
        const successMessage = document.createElement('div');
        successMessage.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
        successMessage.innerHTML = `
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span>Operação realizada com sucesso! ID: ${response.id}</span>
          </div>
        `;
        
        const form = document.getElementById('advanced-form');
        if (form) {
          form.insertBefore(successMessage, form.firstChild);
        }
      },
      onError: (error) => {
        console.error('❌ Erro na operação avançada:', error);
      },
      onValidationError: (errors) => {
        console.warn('⚠️ Erros de validação:', errors);
      },
      customValidation: (data) => {
        const errors: Record<string, string> = {};
        
        // Validação customizada complexa
        if (data.priority === 'high' && !data.approval_code) {
          errors.approval_code = 'Código de aprovação obrigatório para prioridade alta';
        }
        
        if (data.start_date && data.end_date) {
          const start = new Date(data.start_date);
          const end = new Date(data.end_date);
          if (start >= end) {
            errors.end_date = 'Data fim deve ser posterior à data início';
          }
        }
        
        return Object.keys(errors).length > 0 ? errors : null;
      },
      debug: true
    });

    // Adicionar regras de validação dinâmicas
    handler.addValidationRule('budget', {
      required: true,
      custom: (value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
          return 'Orçamento deve ser um número positivo';
        }
        if (num > 1000000) {
          return 'Orçamento não pode ser superior a R$ 1.000.000,00';
        }
        return null;
      }
    });

    formHandlerRef.current = handler;

    return () => {
      handler.destroy();
    };
  }, []);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          <CardTitle>FormHandler Avançado</CardTitle>
        </div>
        <CardDescription>
          Formulário com configurações avançadas e validações customizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="advanced-form" className="space-y-4">
          <div>
            <label htmlFor="project_name" className="block text-sm font-medium mb-1">
              Nome do Projeto *
            </label>
            <input
              type="text"
              id="project_name"
              name="project_name"
              required
              minLength={5}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome do projeto"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium mb-1">
              Prioridade *
            </label>
            <select
              id="priority"
              name="priority"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>

          <div>
            <label htmlFor="approval_code" className="block text-sm font-medium mb-1">
              Código de Aprovação
              <span className="text-xs text-gray-500">(obrigatório para prioridade alta)</span>
            </label>
            <input
              type="text"
              id="approval_code"
              name="approval_code"
              pattern="^[A-Z0-9]{6,10}$"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC123"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium mb-1">
                Data Início
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium mb-1">
                Data Fim
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium mb-1">
              Orçamento (R$) *
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              step="0.01"
              min="0"
              max="1000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o projeto..."
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Executar Operação Avançada
          </button>
        </form>

        <div className="mt-4 p-3 bg-purple-50 rounded-lg text-xs">
          <div className="font-semibold mb-2">Recursos Avançados:</div>
          <div className="space-y-1">
            <div>• Timeout customizado: 60 segundos</div>
            <div>• Retry automático: até 5 tentativas</div>
            <div>• Validação customizada para prioridade alta</div>
            <div>• Validação de datas (início < fim)</div>
            <div>• Validação de orçamento com limites</div>
            <div>• Mensagem de sucesso customizada</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Principal
export const FormHandlerExample = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">FormHandler Universal</h1>
        <p className="text-gray-600">
          Utilitário JavaScript para gerenciar formulários HTML com validação automática
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="mapped">Mapeado</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <div className="flex justify-center">
            <BasicFormExample />
          </div>
        </TabsContent>

        <TabsContent value="mapped" className="mt-6">
          <div className="flex justify-center">
            <MappedFormExample />
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <div className="flex justify-center">
            <AdvancedFormExample />
          </div>
        </TabsContent>
      </Tabs>

      {/* Documentação */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Como Usar o FormHandler</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Importar e Criar Instância</h4>
            <code className="bg-gray-100 p-2 rounded text-sm block">
              {`import { createFormHandler } from '@/utils/formHandler';

const handler = createFormHandler('meu-form', {
  endpoint: '/api/endpoint',
  method: 'POST',
  onSuccess: (data) => console.log('Sucesso!', data)
});`}
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. HTML com Atributos de Validação</h4>
            <code className="bg-gray-100 p-2 rounded text-sm block">
              {`<form id="meu-form">
  <input name="cpf" data-validation="cpf" />
  <input name="email" type="email" required />
  <button type="submit">Enviar</button>
</form>`}
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Validações Disponíveis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Atributos HTML:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• <code>required</code> - Campo obrigatório</li>
                  <li>• <code>minlength</code> - Tamanho mínimo</li>
                  <li>• <code>maxlength</code> - Tamanho máximo</li>
                  <li>• <code>pattern</code> - Regex customizado</li>
                  <li>• <code>type="email"</code> - Validação de email</li>
                </ul>
              </div>
              <div>
                <strong>Validações Brasileiras:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• <code>data-validation="cpf"</code></li>
                  <li>• <code>data-validation="cnpj"</code></li>
                  <li>• <code>data-validation="phone"</code></li>
                  <li>• <code>data-validation="cep"</code></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Recursos Principais</h4>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Validação automática baseada em atributos HTML</li>
              <li>• Validações brasileiras (CPF, CNPJ, telefone, CEP)</li>
              <li>• Estados de loading automático</li>
              <li>• Retry automático em falhas de rede</li>
              <li>• Integração com sistema de mapeamento</li>
              <li>• Renovação automática de token</li>
              <li>• Validações customizadas</li>
              <li>• Feedback visual de erros</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormHandlerExample;
/**
 * EXEMPLOS DE USO DO SISTEMA DE VALIDAÇÃO UNIVERSAL
 * 
 * Este componente demonstra como usar o sistema de validação
 * em diferentes cenários com formulários HTML.
 */

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Shield, Code2 } from 'lucide-react';
import { 
  validateForm, 
  addRealTimeValidation, 
  addAutoFormatting,
  validateAndDisplayErrors,
  clearFormErrors,
  validateObject,
  validators,
  formatters
} from '@/utils/validation';

// Exemplo 1: Validação Básica com Atributos HTML
const BasicValidationExample = () => {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      addRealTimeValidation(formRef.current);
      addAutoFormatting(formRef.current);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formRef.current) {
      const isValid = validateAndDisplayErrors(formRef.current);
      
      if (isValid) {
        alert('✅ Formulário válido! Dados podem ser enviados.');
      } else {
        alert('❌ Corrija os erros antes de continuar.');
      }
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Validação Básica</CardTitle>
        </div>
        <CardDescription>
          Validação usando atributos data-validate no HTML
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              data-validate="required|minLength:2|maxLength:100"
              data-label="Nome completo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu nome completo"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <input
              type="text"
              id="email"
              name="email"
              data-validate="required|email"
              data-label="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="cpf" className="block text-sm font-medium mb-1">
              CPF *
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              data-validate="required|cpf"
              data-format="cpf"
              data-label="CPF"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium mb-1">
              Telefone
            </label>
            <input
              type="text"
              id="telefone"
              name="telefone"
              data-validate="telefone"
              data-format="telefone"
              data-label="Telefone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>

          <div>
            <label htmlFor="idade" className="block text-sm font-medium mb-1">
              Idade *
            </label>
            <input
              type="number"
              id="idade"
              name="idade"
              data-validate="required|min:18|max:120"
              data-label="Idade"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="18"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium mb-1">
              Senha *
            </label>
            <input
              type="password"
              id="senha"
              name="senha"
              data-validate="required|minLength:8"
              data-label="Senha"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Validar Formulário
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs">
          <div className="font-semibold mb-2">Validações Ativas:</div>
          <div className="space-y-1">
            <div>• <Badge variant="outline">required</Badge> - Campos obrigatórios</div>
            <div>• <Badge variant="outline">email</Badge> - Formato de email válido</div>
            <div>• <Badge variant="outline">cpf</Badge> - CPF com algoritmo verificador</div>
            <div>• <Badge variant="outline">telefone</Badge> - Telefone com DDD brasileiro</div>
            <div>• <Badge variant="outline">min/max</Badge> - Valores numéricos limitados</div>
            <div>• <Badge variant="outline">minLength/maxLength</Badge> - Tamanho do texto</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Exemplo 2: Validação Programática com Objeto
const ProgrammaticValidationExample = () => {
  const [validationResults, setValidationResults] = React.useState<any[]>([]);

  const testValidations = () => {
    const testData = {
      nome: 'João Silva',
      email: 'joao@email.com',
      cpf: '123.456.789-09',
      telefone: '(11) 99999-9999',
      idade: 25,
      senha: 'minhasenha123'
    };

    const rules = {
      nome: { required: true, minLength: 2, maxLength: 100 },
      email: { required: true, email: true },
      cpf: { required: true, cpf: true },
      telefone: { telefone: true },
      idade: { required: true, min: 18, max: 120 },
      senha: { required: true, minLength: 8 }
    };

    const errors = validateObject(testData, rules);
    
    const results = Object.keys(testData).map(field => ({
      field,
      value: testData[field as keyof typeof testData],
      isValid: !errors.find(error => error.field === field),
      error: errors.find(error => error.field === field)?.message
    }));

    setValidationResults(results);
  };

  const testBrazilianValidators = () => {
    const tests = [
      { validator: 'CPF', value: '123.456.789-09', valid: validators.cpf('123.456.789-09') },
      { validator: 'CPF', value: '111.111.111-11', valid: validators.cpf('111.111.111-11') },
      { validator: 'CNPJ', value: '11.222.333/0001-81', valid: validators.cnpj('11.222.333/0001-81') },
      { validator: 'Telefone', value: '(11) 99999-9999', valid: validators.telefone('(11) 99999-9999') },
      { validator: 'Telefone', value: '(99) 99999-9999', valid: validators.telefone('(99) 99999-9999') },
      { validator: 'CEP', value: '01234-567', valid: validators.cep('01234-567') },
      { validator: 'Email', value: 'usuario@dominio.com', valid: validators.email('usuario@dominio.com') },
      { validator: 'Email', value: 'email-inválido', valid: validators.email('email-inválido') }
    ];

    const results = tests.map(test => ({
      field: test.validator,
      value: test.value,
      isValid: test.valid,
      error: test.valid ? null : `${test.validator} inválido`
    }));

    setValidationResults(results);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          <CardTitle>Validação Programática</CardTitle>
        </div>
        <CardDescription>
          Teste de validações usando JavaScript/TypeScript
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={testValidations}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Testar Objeto
            </button>
            <button
              onClick={testBrazilianValidators}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Testar Brasileiros
            </button>
          </div>

          {validationResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Resultados dos Testes:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {validationResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.isValid
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {result.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">{result.field}</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        <strong>Valor:</strong> <code className="bg-gray-100 px-1 rounded">{result.value}</code>
                      </div>
                      {result.error && (
                        <div className="text-red-600">
                          <strong>Erro:</strong> {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-lg text-xs">
            <div className="font-semibold mb-2">Uso Programático:</div>
            <pre className="text-xs overflow-x-auto">
{`import { validateObject, validators } from '@/utils/validation';

// Validar objeto completo
const errors = validateObject(data, rules);

// Validar campo individual
const isValidCPF = validators.cpf('123.456.789-09');

// Formatação automática
const formatted = formatters.cpf('12345678909');`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Exemplo 3: Formatação Automática
const FormattingExample = () => {
  const [formattedValues, setFormattedValues] = React.useState({
    cpf: '',
    cnpj: '',
    telefone: '',
    cep: '',
    currency: ''
  });

  const handleInputChange = (field: string, value: string) => {
    let formatted = value;
    
    switch (field) {
      case 'cpf':
        formatted = formatters.cpf(value);
        break;
      case 'cnpj':
        formatted = formatters.cnpj(value);
        break;
      case 'telefone':
        formatted = formatters.telefone(value);
        break;
      case 'cep':
        formatted = formatters.cep(value);
        break;
      case 'currency':
        formatted = formatters.currency(value);
        break;
    }

    setFormattedValues(prev => ({
      ...prev,
      [field]: formatted
    }));
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <CardTitle>Formatação Automática</CardTitle>
        </div>
        <CardDescription>
          Teste de formatadores brasileiros em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">CPF</label>
            <input
              type="text"
              value={formattedValues.cpf}
              onChange={(e) => handleInputChange('cpf', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite apenas números"
              maxLength={14}
            />
            <div className="text-xs text-gray-500 mt-1">
              Digite: 12345678909 → Resultado: {formattedValues.cpf}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CNPJ</label>
            <input
              type="text"
              value={formattedValues.cnpj}
              onChange={(e) => handleInputChange('cnpj', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite apenas números"
              maxLength={18}
            />
            <div className="text-xs text-gray-500 mt-1">
              Digite: 11222333000181 → Resultado: {formattedValues.cnpj}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              type="text"
              value={formattedValues.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite apenas números"
              maxLength={15}
            />
            <div className="text-xs text-gray-500 mt-1">
              Digite: 11999999999 → Resultado: {formattedValues.telefone}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CEP</label>
            <input
              type="text"
              value={formattedValues.cep}
              onChange={(e) => handleInputChange('cep', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite apenas números"
              maxLength={9}
            />
            <div className="text-xs text-gray-500 mt-1">
              Digite: 01234567 → Resultado: {formattedValues.cep}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Moeda (R$)</label>
            <input
              type="text"
              value={formattedValues.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite centavos (ex: 1234 = R$ 12,34)"
            />
            <div className="text-xs text-gray-500 mt-1">
              Digite: 123456 → Resultado: {formattedValues.currency}
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg text-xs">
            <div className="font-semibold mb-2">Como Usar nos Formulários:</div>
            <pre className="text-xs">
{`<input 
  data-format="cpf"
  data-validate="required|cpf" 
  maxLength={14}
/>`}
            </pre>
            <div className="mt-2">
              Use o atributo <code className="bg-gray-200 px-1 rounded">data-format</code> 
              para ativar formatação automática.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Principal
export const ValidationExample = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sistema de Validação Universal</h1>
        <p className="text-gray-600">
          Sistema completo de validação para formulários HTML e React
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Validação HTML</TabsTrigger>
          <TabsTrigger value="programmatic">Programática</TabsTrigger>
          <TabsTrigger value="formatting">Formatação</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <div className="flex justify-center">
            <BasicValidationExample />
          </div>
        </TabsContent>

        <TabsContent value="programmatic" className="mt-6">
          <div className="flex justify-center">
            <ProgrammaticValidationExample />
          </div>
        </TabsContent>

        <TabsContent value="formatting" className="mt-6">
          <div className="flex justify-center">
            <FormattingExample />
          </div>
        </TabsContent>
      </Tabs>

      {/* Documentação de Referência */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Referência Rápida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Validações Disponíveis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Básicas:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• <code>required</code> - Campo obrigatório</li>
                  <li>• <code>email</code> - Email válido</li>
                  <li>• <code>minLength:X</code> - Tamanho mínimo</li>
                  <li>• <code>maxLength:X</code> - Tamanho máximo</li>
                  <li>• <code>min:X</code> - Valor mínimo</li>
                  <li>• <code>max:X</code> - Valor máximo</li>
                  <li>• <code>pattern:regex</code> - Expressão regular</li>
                </ul>
              </div>
              <div>
                <strong>Brasileiras:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• <code>cpf</code> - CPF com dígitos verificadores</li>
                  <li>• <code>cnpj</code> - CNPJ com dígitos verificadores</li>
                  <li>• <code>telefone</code> - Telefone com DDD brasileiro</li>
                  <li>• <code>cep</code> - CEP com 8 dígitos</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Formatadores Disponíveis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <ul className="space-y-1">
                  <li>• <code>data-format="cpf"</code></li>
                  <li>• <code>data-format="cnpj"</code></li>
                  <li>• <code>data-format="telefone"</code></li>
                  <li>• <code>data-format="cep"</code></li>
                  <li>• <code>data-format="currency"</code></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Recursos Principais</h4>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Validação em tempo real (on blur)</li>
              <li>• Formatação automática durante digitação</li>
              <li>• Validações brasileiras com algoritmos oficiais</li>
              <li>• Feedback visual de erros</li>
              <li>• Integração com React e formulários HTML</li>
              <li>• Validação programática de objetos</li>
              <li>• Mensagens de erro personalizáveis</li>
              <li>• Suporte a validações customizadas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationExample;
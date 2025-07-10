import React, { useEffect, useRef, useState } from 'react';
import { FormGenerator, createFormGenerator } from '../utils/formGenerator';
import { formConfigs, getFormConfig, getAvailableFormTypes } from '../config/forms';

/**
 * EXEMPLO TAREFA 5.2 - CONFIGURAÇÕES DE FORMULÁRIOS
 * 
 * Demonstra o uso das configurações específicas criadas no Passo 5.2
 */

const FormulariosTarefa5Example: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const formGeneratorRef = useRef<FormGenerator | null>(null);
  const [activeForm, setActiveForm] = useState<string>('escola');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      formGeneratorRef.current = createFormGenerator('form-tarefa5-container');
      generateForm(activeForm);
    }

    return () => {
      formGeneratorRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (formGeneratorRef.current) {
      generateForm(activeForm);
    }
  }, [activeForm]);

  const generateForm = (formType: string) => {
    if (!formGeneratorRef.current) return;

    setIsLoading(true);

    try {
      const config = getFormConfig(formType as keyof typeof formConfigs);
      
      // Personaliza callbacks para demonstração
      const configWithCallbacks = {
        ...config,
        onSuccess: (response: any) => {
          console.log(`✅ ${config.title} enviado com sucesso:`, response);
          alert(`${config.title} enviado com sucesso!`);
          setIsLoading(false);
        },
        onError: (error: Error) => {
          console.error(`❌ Erro no ${config.title}:`, error);
          alert(`Erro no ${config.title}: ${error.message}`);
          setIsLoading(false);
        }
      };

      formGeneratorRef.current.generate(configWithCallbacks);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao gerar formulário:', error);
      setIsLoading(false);
    }
  };

  const handleFormChange = (formType: string) => {
    setActiveForm(formType);
  };

  const availableFormTypes = getAvailableFormTypes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TAREFA 5.2 - Configurações de Formulários
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Sistema completo de formulários dinâmicos para o IAprender com configurações específicas 
            para escola, aluno, professor, diretor e gestor municipal.
          </p>
        </div>

        {/* Controles de Navegação */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Selecione o Formulário</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {availableFormTypes.map((formType) => {
              const config = getFormConfig(formType as keyof typeof formConfigs);
              const isActive = activeForm === formType;
              
              return (
                <button
                  key={formType}
                  onClick={() => handleFormChange(formType)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-center ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  disabled={isLoading}
                >
                  <div className="font-semibold text-sm mb-1">
                    {config.title?.replace('Cadastro de ', '') || formType}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {formType}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-lg">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Gerando formulário...
            </div>
          </div>
        )}

        {/* Container do Formulário */}
        <div ref={containerRef} id="form-tarefa5-container" className="mb-8"></div>

        {/* Informações Técnicas */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Características Implementadas</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Funcionalidades do Sistema */}
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">
                🎯 Funcionalidades do Sistema
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>5 Formulários Configurados:</strong> escola, aluno, professor, diretor, gestor</li>
                <li>• <strong>Validação Brasileira:</strong> CPF, CNPJ, telefone, CEP automáticos</li>
                <li>• <strong>Campos Especializados:</strong> select com opções específicas por contexto</li>
                <li>• <strong>Integração AuthManager:</strong> autenticação automática</li>
                <li>• <strong>Feedback Visual:</strong> mensagens de sucesso e erro</li>
                <li>• <strong>Reset Automático:</strong> botão para limpar formulários</li>
              </ul>
            </div>

            {/* Validações Implementadas */}
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3">
                ✅ Validações Implementadas
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>Campos Obrigatórios:</strong> marcados com asterisco</li>
                <li>• <strong>Formatos Brasileiros:</strong> CPF, telefone, CEP</li>
                <li>• <strong>Email Válido:</strong> formato RFC compliant</li>
                <li>• <strong>Código INEP:</strong> 8 dígitos obrigatórios</li>
                <li>• <strong>Datas:</strong> validação de formato e lógica</li>
                <li>• <strong>Seleções:</strong> opções predefinidas por contexto</li>
              </ul>
            </div>

            {/* Recursos Técnicos */}
            <div>
              <h3 className="text-lg font-semibold text-purple-600 mb-3">
                🔧 Recursos Técnicos
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>TypeScript:</strong> tipagem completa e segura</li>
                <li>• <strong>Configuração JSON:</strong> fácil manutenção</li>
                <li>• <strong>Máscaras Automáticas:</strong> formatação em tempo real</li>
                <li>• <strong>Estados do Brasil:</strong> lista completa de UFs</li>
                <li>• <strong>Séries Escolares:</strong> infantil ao ensino médio</li>
                <li>• <strong>Sistema Modular:</strong> reutilização de componentes</li>
              </ul>
            </div>
          </div>

          {/* Exemplo de Código */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Exemplo de Uso no Código
            </h3>
            <pre className="bg-gray-100 p-6 rounded-lg text-sm overflow-x-auto border">
{`import { createFormGenerator } from '../utils/formGenerator';
import { getFormConfig } from '../config/forms';

// Criar gerador de formulário
const formGenerator = createFormGenerator('container-id');

// Obter configuração específica
const config = getFormConfig('escola');

// Personalizar callbacks
const customConfig = {
  ...config,
  onSuccess: (response) => {
    console.log('Escola cadastrada:', response);
    alert('Escola cadastrada com sucesso!');
  },
  onError: (error) => {
    console.error('Erro:', error);
    alert(\`Erro: \${error.message}\`);
  }
};

// Gerar formulário
const formHandler = formGenerator.generate(customConfig);`}
            </pre>
          </div>

          {/* Estrutura de Dados */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Formulários Disponíveis na Configuração
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {availableFormTypes.map((formType) => {
                const config = getFormConfig(formType as keyof typeof formConfigs);
                return (
                  <div key={formType} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {config.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {config.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      <strong>Endpoint:</strong> {config.endpoint}<br/>
                      <strong>Campos:</strong> {config.fields.length} campos configurados
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dados Técnicos */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6">Especificações Técnicas</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Arquivos Criados</h3>
              <ul className="text-sm space-y-1">
                <li>• <code>/client/src/config/forms.ts</code></li>
                <li>• <code>/client/src/examples/FormulariosTarefa5Example.tsx</code></li>
                <li>• Integração com FormGenerator existente</li>
                <li>• Configurações TypeScript completas</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Tipos Suportados</h3>
              <ul className="text-sm space-y-1">
                <li>• <code>text</code> - Campos de texto</li>
                <li>• <code>email</code> - Email com validação</li>
                <li>• <code>cpf</code> - CPF com máscara</li>
                <li>• <code>tel</code> - Telefone brasileiro</li>
                <li>• <code>cep</code> - CEP com máscara</li>
                <li>• <code>date</code> - Seletor de data</li>
                <li>• <code>select</code> - Lista de opções</li>
                <li>• <code>textarea</code> - Área de texto</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Funcionalidades</h3>
              <ul className="text-sm space-y-1">
                <li>• Validação em tempo real</li>
                <li>• Máscaras automáticas brasileiras</li>
                <li>• Integração com autenticação</li>
                <li>• Feedback visual imediato</li>
                <li>• Configuração via JSON</li>
                <li>• TypeScript type-safe</li>
                <li>• Reset automático</li>
                <li>• Design responsivo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulariosTarefa5Example;
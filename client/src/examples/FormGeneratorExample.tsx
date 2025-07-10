import React, { useEffect, useRef } from 'react';
import { FormGenerator, createFormGenerator, FormConfig } from '../utils/formGenerator';

/**
 * EXEMPLO DO GERADOR DE FORMULÁRIOS DINÂMICOS
 * 
 * Demonstra como usar o FormGenerator para criar formulários
 * dinamicamente com validação e autenticação integradas
 */

const FormGeneratorExample: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const formGeneratorRef = useRef<FormGenerator | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Inicializa o FormGenerator
      formGeneratorRef.current = createFormGenerator('form-generator-container');

      // Exemplo 1: Formulário de Cadastro de Usuário
      generateUserForm();
    }

    return () => {
      formGeneratorRef.current?.destroy();
    };
  }, []);

  const generateUserForm = () => {
    if (!formGeneratorRef.current) return;

    const userFormConfig: FormConfig = {
      id: 'user-registration-form',
      title: 'Cadastro de Usuário',
      description: 'Preencha os dados para criar uma nova conta no sistema',
      endpoint: '/api/usuarios',
      method: 'POST',
      submitText: 'Cadastrar Usuário',
      resetText: 'Limpar Formulário',
      showReset: true,
      debug: true,
      fields: [
        {
          name: 'nome',
          label: 'Nome Completo',
          type: 'text',
          required: true,
          placeholder: 'Digite seu nome completo',
          autocomplete: 'name'
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          placeholder: 'usuario@exemplo.com',
          autocomplete: 'email'
        },
        {
          name: 'documento',
          label: 'CPF',
          type: 'cpf',
          required: true,
          placeholder: '000.000.000-00'
        },
        {
          name: 'telefone',
          label: 'Telefone',
          type: 'tel',
          required: true,
          placeholder: '(11) 99999-9999'
        },
        {
          name: 'data_nascimento',
          label: 'Data de Nascimento',
          type: 'date',
          required: true
        },
        {
          name: 'tipo_usuario',
          label: 'Tipo de Usuário',
          type: 'select',
          required: true,
          options: [
            { value: 'professor', text: 'Professor' },
            { value: 'aluno', text: 'Aluno' },
            { value: 'diretor', text: 'Diretor' },
            { value: 'gestor', text: 'Gestor' }
          ]
        },
        {
          name: 'endereco',
          label: 'Endereço',
          type: 'textarea',
          placeholder: 'Digite seu endereço completo',
          rows: 3
        },
        {
          name: 'cep',
          label: 'CEP',
          type: 'cep',
          placeholder: '00000-000'
        }
      ],
      onSuccess: (response) => {
        console.log('✅ Usuário cadastrado:', response);
        alert('Usuário cadastrado com sucesso!');
      },
      onError: (error) => {
        console.error('❌ Erro no cadastro:', error);
        alert(`Erro no cadastro: ${error.message}`);
      }
    };

    formGeneratorRef.current.generate(userFormConfig);
  };

  const generateEscoleForm = () => {
    if (!formGeneratorRef.current) return;

    const escolaFormConfig: FormConfig = {
      id: 'school-registration-form',
      title: 'Cadastro de Escola',
      description: 'Dados da instituição de ensino',
      endpoint: '/api/escolas',
      method: 'POST',
      submitText: 'Cadastrar Escola',
      showReset: true,
      fields: [
        {
          name: 'nome',
          label: 'Nome da Escola',
          type: 'text',
          required: true,
          placeholder: 'Nome da instituição'
        },
        {
          name: 'codigo_inep',
          label: 'Código INEP',
          type: 'text',
          required: true,
          placeholder: '12345678'
        },
        {
          name: 'tipo_escola',
          label: 'Tipo de Escola',
          type: 'select',
          required: true,
          options: [
            { value: 'municipal', text: 'Municipal' },
            { value: 'estadual', text: 'Estadual' },
            { value: 'federal', text: 'Federal' },
            { value: 'particular', text: 'Particular' }
          ]
        },
        {
          name: 'telefone',
          label: 'Telefone',
          type: 'tel',
          required: true
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true
        },
        {
          name: 'endereco',
          label: 'Endereço Completo',
          type: 'textarea',
          required: true,
          rows: 4
        },
        {
          name: 'cidade',
          label: 'Cidade',
          type: 'text',
          required: true
        },
        {
          name: 'estado',
          label: 'Estado',
          type: 'select',
          required: true,
          options: [
            { value: 'SP', text: 'São Paulo' },
            { value: 'RJ', text: 'Rio de Janeiro' },
            { value: 'MG', text: 'Minas Gerais' },
            { value: 'RS', text: 'Rio Grande do Sul' },
            { value: 'PR', text: 'Paraná' },
            { value: 'SC', text: 'Santa Catarina' },
            { value: 'BA', text: 'Bahia' },
            { value: 'GO', text: 'Goiás' },
            { value: 'ES', text: 'Espírito Santo' },
            { value: 'PE', text: 'Pernambuco' }
          ]
        }
      ],
      onSuccess: (response) => {
        console.log('✅ Escola cadastrada:', response);
        alert('Escola cadastrada com sucesso!');
      }
    };

    formGeneratorRef.current.generate(escolaFormConfig);
  };

  const generateContatoForm = () => {
    if (!formGeneratorRef.current) return;

    const contatoFormConfig: FormConfig = {
      id: 'contact-form',
      title: 'Fale Conosco',
      description: 'Entre em contato com nossa equipe',
      endpoint: '/api/contato',
      method: 'POST',
      submitText: 'Enviar Mensagem',
      fields: [
        {
          name: 'nome',
          label: 'Seu Nome',
          type: 'text',
          required: true,
          placeholder: 'Como você se chama?'
        },
        {
          name: 'email',
          label: 'Seu Email',
          type: 'email',
          required: true,
          placeholder: 'Seu melhor email'
        },
        {
          name: 'assunto',
          label: 'Assunto',
          type: 'select',
          required: true,
          options: [
            { value: 'suporte', text: 'Suporte Técnico' },
            { value: 'vendas', text: 'Vendas' },
            { value: 'parceria', text: 'Parceria' },
            { value: 'sugestao', text: 'Sugestão' },
            { value: 'reclamacao', text: 'Reclamação' },
            { value: 'outros', text: 'Outros' }
          ]
        },
        {
          name: 'mensagem',
          label: 'Sua Mensagem',
          type: 'textarea',
          required: true,
          placeholder: 'Conte-nos como podemos ajudar...',
          rows: 6
        },
        {
          name: 'telefone',
          label: 'Telefone (opcional)',
          type: 'tel',
          placeholder: 'Para contato urgente'
        }
      ],
      classes: {
        container: 'max-w-lg mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg',
        form: 'space-y-4',
        button: 'w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 font-medium shadow-md'
      },
      onSuccess: () => {
        alert('Mensagem enviada com sucesso! Retornaremos em breve.');
      }
    };

    formGeneratorRef.current.generate(contatoFormConfig);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Gerador de Formulários Dinâmicos
        </h1>

        {/* Botões para alternar entre formulários */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={generateUserForm}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cadastro de Usuário
          </button>
          <button
            onClick={generateEscoleForm}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Cadastro de Escola
          </button>
          <button
            onClick={generateContatoForm}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Fale Conosco
          </button>
        </div>

        {/* Container onde o formulário será gerado */}
        <div ref={containerRef} id="form-generator-container" className="mb-8"></div>

        {/* Informações sobre o FormGenerator */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Sobre o FormGenerator</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Recursos Implementados</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>Integração com AuthManager:</strong> Verificação automática de autenticação</li>
                <li>• <strong>Validação Brasileira:</strong> CPF, CNPJ, telefone, CEP com máscaras</li>
                <li>• <strong>Tipos de Campo:</strong> Text, email, select, textarea, date, number</li>
                <li>• <strong>Estilização Flexível:</strong> Classes CSS customizáveis</li>
                <li>• <strong>Feedback Visual:</strong> Mensagens de sucesso e erro</li>
                <li>• <strong>Reset Automático:</strong> Botão opcional para limpar formulário</li>
                <li>• <strong>TypeScript:</strong> Tipagem completa para maior segurança</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">Casos de Uso</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>Formulários Administrativos:</strong> Cadastro de usuários, escolas</li>
                <li>• <strong>Formulários de Contato:</strong> Suporte, vendas, parcerias</li>
                <li>• <strong>Formulários Educacionais:</strong> Matrícula, avaliação, feedback</li>
                <li>• <strong>Dashboards Dinâmicos:</strong> Configuração baseada em dados</li>
                <li>• <strong>Prototipagem Rápida:</strong> Criação ágil de interfaces</li>
                <li>• <strong>Formulários Condicionais:</strong> Campos que mudam baseado em seleção</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">Exemplo de Código</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { createFormGenerator } from '../utils/formGenerator';

const formGenerator = createFormGenerator('container-id');

const config = {
  id: 'meu-form',
  title: 'Meu Formulário',
  endpoint: '/api/endpoint',
  fields: [
    {
      name: 'nome',
      label: 'Nome',
      type: 'text',
      required: true
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
  }
};

const formHandler = formGenerator.generate(config);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormGeneratorExample;
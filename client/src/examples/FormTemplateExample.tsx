/**
 * EXEMPLO DE SISTEMA DE TEMPLATES DE FORMULÁRIOS
 * 
 * Demonstra o uso do sistema de geração de formulários
 * com templates HTML modernos.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FormTemplate, 
  Code2, 
  Download, 
  Eye, 
  Settings, 
  Users,
  School,
  Mail,
  UserCheck,
  Plus
} from 'lucide-react';
import { formGenerator, getPresetConfigs, generatePresetForm } from '@/utils/formGenerator';

// Interface para configuração de formulário
interface FormPreview {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  presetKey: string;
  category: string;
  features: string[];
}

// Lista de formulários disponíveis
const availableForms: FormPreview[] = [
  {
    id: 'usuario-criar',
    name: 'Criar Usuário',
    description: 'Formulário completo para cadastro de novos usuários no sistema',
    icon: Users,
    presetKey: 'usuario-criar',
    category: 'Gestão',
    features: [
      'Validação de CPF',
      'Força da senha',
      'Tipos de usuário',
      'Formatação automática'
    ]
  },
  {
    id: 'escola-criar',
    name: 'Criar Escola',
    description: 'Cadastro de escolas com validação INEP e auto-complete de endereço',
    icon: School,
    presetKey: 'escola-criar',
    category: 'Educacional',
    features: [
      'Código INEP',
      'Auto-complete CEP',
      'Tipos de escola',
      'Validação de endereço'
    ]
  },
  {
    id: 'contato',
    name: 'Formulário de Contato',
    description: 'Interface de contato com categorização de assuntos',
    icon: Mail,
    presetKey: 'contato',
    category: 'Comunicação',
    features: [
      'Categorias de assunto',
      'Validação de email',
      'Contador de caracteres',
      'Reset automático'
    ]
  },
  {
    id: 'professor-perfil',
    name: 'Perfil do Professor',
    description: 'Atualização de dados profissionais para professores',
    icon: UserCheck,
    presetKey: 'professor-perfil',
    category: 'Perfil',
    features: [
      'Dados profissionais',
      'Disciplinas',
      'Biografia',
      'Campos protegidos'
    ]
  }
];

// Componente principal
export const FormTemplateExample = () => {
  const [selectedForm, setSelectedForm] = useState<string>('usuario-criar');
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Gerar HTML do formulário selecionado
  const generateFormHtml = async (formKey: string) => {
    setIsGenerating(true);
    
    try {
      // Simular delay para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const html = generatePresetForm(formKey);
      setGeneratedHtml(html);
      
      // Criar URL para preview
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
    } catch (error) {
      console.error('Erro ao gerar formulário:', error);
      setGeneratedHtml('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Gerar formulário inicial
  useEffect(() => {
    generateFormHtml(selectedForm);
  }, [selectedForm]);

  // Baixar HTML gerado
  const downloadHtml = () => {
    if (!generatedHtml) return;
    
    const form = availableForms.find(f => f.presetKey === selectedForm);
    const filename = `${form?.id || 'formulario'}.html`;
    
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  // Copiar código para clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml);
      alert('✅ Código copiado para área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const selectedFormData = availableForms.find(f => f.presetKey === selectedForm);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <FormTemplate className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Sistema de Templates de Formulários</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Gerador automático de formulários HTML modernos com validação brasileira,
          formatação automática e design responsivo.
        </p>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">Gerador</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Código</TabsTrigger>
        </TabsList>

        {/* Aba Gerador */}
        <TabsContent value="generator" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Lista de Formulários */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Formulários Disponíveis
                  </CardTitle>
                  <CardDescription>
                    Selecione um formulário para gerar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableForms.map((form) => {
                    const IconComponent = form.icon;
                    return (
                      <div
                        key={form.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedForm === form.presetKey
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedForm(form.presetKey)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            selectedForm === form.presetKey
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm">{form.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {form.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {form.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {form.features.slice(0, 2).map((feature, index) => (
                                <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                                  {feature}
                                </Badge>
                              ))}
                              {form.features.length > 2 && (
                                <Badge variant="secondary" className="text-xs px-2 py-0">
                                  +{form.features.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Detalhes do Formulário Selecionado */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedFormData && <selectedFormData.icon className="h-6 w-6 text-blue-600" />}
                      <div>
                        <CardTitle>{selectedFormData?.name}</CardTitle>
                        <CardDescription>{selectedFormData?.description}</CardDescription>
                      </div>
                    </div>
                    <Badge>{selectedFormData?.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Recursos */}
                  <div>
                    <h4 className="font-semibold mb-3">Recursos Incluídos</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedFormData?.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuração do Formulário */}
                  <div>
                    <h4 className="font-semibold mb-3">Configuração</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">ID:</span> {selectedForm}
                        </div>
                        <div>
                          <span className="font-medium">Método:</span> POST
                        </div>
                        <div>
                          <span className="font-medium">Validação:</span> Em tempo real
                        </div>
                        <div>
                          <span className="font-medium">Formatação:</span> Automática
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => generateFormHtml(selectedForm)}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Gerar Formulário
                        </>
                      )}
                    </Button>
                    
                    {generatedHtml && (
                      <>
                        <Button variant="outline" onClick={downloadHtml}>
                          <Download className="h-4 w-4 mr-2" />
                          Baixar HTML
                        </Button>
                        <Button variant="outline" onClick={copyToClipboard}>
                          <Code2 className="h-4 w-4 mr-2" />
                          Copiar Código
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Aba Preview */}
        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  <CardTitle>Preview do Formulário</CardTitle>
                </div>
                <Badge variant="outline">{selectedFormData?.name}</Badge>
              </div>
              <CardDescription>
                Visualização em tempo real do formulário gerado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={previewUrl}
                    className="w-full h-[600px]"
                    title="Preview do Formulário"
                  ></iframe>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] border border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <FormTemplate className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {isGenerating ? 'Gerando preview...' : 'Selecione um formulário para visualizar'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Código */}
        <TabsContent value="code" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  <CardTitle>Código HTML Gerado</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadHtml}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
              <CardDescription>
                HTML completo pronto para uso com validação e formatação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedHtml ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="font-medium">Tamanho:</span> {(generatedHtml.length / 1024).toFixed(1)} KB
                      </div>
                      <div>
                        <span className="font-medium">Linhas:</span> {generatedHtml.split('\n').length}
                      </div>
                      <div>
                        <span className="font-medium">Campos:</span> {selectedFormData?.features.length || 0}
                      </div>
                    </div>
                  </div>
                  
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-[500px] overflow-y-auto">
                    <code>{generatedHtml}</code>
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] border border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Code2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {isGenerating ? 'Gerando código...' : 'Gere um formulário para ver o código'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recursos Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos Técnicos Incluídos</CardTitle>
          <CardDescription>
            Funcionalidades automáticas em todos os formulários gerados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-600">Validação</h4>
              <ul className="space-y-1 text-sm">
                <li>• Validação em tempo real (on blur)</li>
                <li>• Algoritmos oficiais CPF/CNPJ</li>
                <li>• DDDs brasileiros válidos</li>
                <li>• Feedback visual de erros</li>
                <li>• Mensagens personalizadas</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">Formatação</h4>
              <ul className="space-y-1 text-sm">
                <li>• CPF: 000.000.000-00</li>
                <li>• CNPJ: 00.000.000/0000-00</li>
                <li>• Telefone: (11) 99999-9999</li>
                <li>• CEP: 00000-000</li>
                <li>• Posição do cursor preservada</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-purple-600">UX/UI</h4>
              <ul className="space-y-1 text-sm">
                <li>• Design responsivo</li>
                <li>• Animações suaves</li>
                <li>• Estados de loading</li>
                <li>• Navegação por Enter</li>
                <li>• Auto-focus inteligente</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-red-600">Integração</h4>
              <ul className="space-y-1 text-sm">
                <li>• Sistema de mapeamento</li>
                <li>• FormHandler automático</li>
                <li>• Callbacks customizáveis</li>
                <li>• Rate limiting</li>
                <li>• Retry automático</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-orange-600">Automação</h4>
              <ul className="space-y-1 text-sm">
                <li>• Auto-complete CEP (ViaCEP)</li>
                <li>• Indicador força da senha</li>
                <li>• Contador de caracteres</li>
                <li>• Progress bar opcional</li>
                <li>• Redirecionamento automático</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-teal-600">Acessibilidade</h4>
              <ul className="space-y-1 text-sm">
                <li>• Labels semânticos</li>
                <li>• ARIA attributes</li>
                <li>• Navegação por teclado</li>
                <li>• Alto contraste</li>
                <li>• Screen reader friendly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormTemplateExample;
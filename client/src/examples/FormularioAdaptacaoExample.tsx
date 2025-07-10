/**
 * EXEMPLO DE ADAPTAÇÃO DE FORMULÁRIOS - IAPRENDER
 * 
 * Demonstra a adaptação dos formulários críticos identificados
 * no mapeamento para o novo sistema de templates
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  School, 
  UserCircle, 
  FileText, 
  Download, 
  Eye, 
  Code,
  CheckCircle,
  AlertTriangle,
  Rocket
} from 'lucide-react';
import { formGenerator } from '@/utils/formGenerator';

export const FormularioAdaptacaoExample = () => {
  const [formularioEscolaHTML, setFormularioEscolaHTML] = useState('');
  const [formularioDiretorHTML, setFormularioDiretorHTML] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dados fictícios de contratos para demonstração
  const contractsData = [
    { id: 1, name: 'Contrato Municipal SP - 2024', description: 'Prefeitura de São Paulo' },
    { id: 2, name: 'Secretaria de Educação RJ', description: 'Estado do Rio de Janeiro' },
    { id: 3, name: 'IFMG - Campus Bambuí', description: 'Instituto Federal de Minas Gerais' }
  ];

  // Gerar formulários ao carregar o componente
  useEffect(() => {
    gerarFormularios();
  }, []);

  const gerarFormularios = async () => {
    setIsLoading(true);
    
    try {
      // Configurar opções dinâmicas para contratos
      const configEscola = formGenerator.getPresetConfigs()['escola-criar'];
      const configDiretor = formGenerator.getPresetConfigs()['diretor-criar'];
      
      // Atualizar opções de contrato dinamicamente
      const contractOptions = contractsData.map(contract => ({
        value: contract.id.toString(),
        label: `${contract.name} - ${contract.description}`
      }));
      
      // Encontrar e atualizar o campo contractId
      const contractFieldEscola = configEscola.fields.find(f => f.id === 'contractId');
      const contractFieldDiretor = configDiretor.fields.find(f => f.id === 'contractId');
      
      if (contractFieldEscola) contractFieldEscola.options = contractOptions;
      if (contractFieldDiretor) contractFieldDiretor.options = contractOptions;

      // Gerar HTML dos formulários
      const htmlEscola = formGenerator.generateForm(configEscola);
      const htmlDiretor = formGenerator.generateForm(configDiretor);
      
      setFormularioEscolaHTML(htmlEscola);
      setFormularioDiretorHTML(htmlDiretor);
      
    } catch (error) {
      console.error('Erro ao gerar formulários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar formulário como arquivo HTML
  const salvarFormulario = async (tipo: 'escola' | 'diretor') => {
    const config = tipo === 'escola' 
      ? formGenerator.getPresetConfigs()['escola-criar']
      : formGenerator.getPresetConfigs()['diretor-criar'];
    
    try {
      const filename = await formGenerator.saveFormToFile(config, `${tipo}-criar.html`);
      alert(`Formulário salvo como: ${filename}`);
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
      alert('Erro ao salvar formulário');
    }
  };

  // Baixar HTML como arquivo
  const baixarHTML = (html: string, filename: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Demonstrar integração com dados reais
  const demonstrarIntegracao = () => {
    alert(`
🚀 DEMONSTRAÇÃO DE INTEGRAÇÃO

1. Os formulários adaptados usam os mesmos endpoints:
   • Escola: POST /api/municipal/schools
   • Diretor: POST /api/municipal/directors

2. Validações integradas:
   • CNPJ brasileiro com algoritmo Mod 11
   • CEP com auto-complete via ViaCEP
   • Telefone com DDDs válidos ANATEL
   • Senha forte com indicador visual

3. Dados dinâmicos:
   • Contratos carregados do backend
   • Estados brasileiros pré-configurados
   • Validação server-side mantida

4. UX melhorada:
   • Navegação por Enter entre campos
   • Formatação automática em tempo real
   • Estados de loading claros
   • Feedback visual de validação

✅ Pronto para substituir os formulários atuais!
    `);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Rocket className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Adaptação de Formulários</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Formulários críticos adaptados do sistema atual para o novo sistema de templates moderno.
          Compare o antes e depois da modernização.
        </p>
      </div>

      {/* Status da adaptação */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <CardTitle className="text-green-700">Fase 1 - Formulários Críticos</CardTitle>
              <CardDescription>
                Os 2 formulários mais importantes foram adaptados com sucesso
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <School className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-700">Criar Escola</h4>
                <p className="text-sm text-green-600">Formulário municipal adaptado</p>
              </div>
              <Badge className="bg-green-100 text-green-700">✅ Adaptado</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <UserCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-700">Criar Diretor</h4>
                <p className="text-sm text-green-600">Gestão de recursos humanos</p>
              </div>
              <Badge className="bg-green-100 text-green-700">✅ Adaptado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="escola" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="escola">Formulário de Escola</TabsTrigger>
          <TabsTrigger value="diretor">Formulário de Diretor</TabsTrigger>
        </TabsList>

        {/* Aba Formulário de Escola */}
        <TabsContent value="escola" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <School className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Formulário: Criar Escola</CardTitle>
                    <CardDescription>
                      Formulário modernizado para cadastro de escolas municipais
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => salvarFormulario('escola')}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button 
                    onClick={() => baixarHTML(formularioEscolaHTML, 'escola-criar.html')}
                    variant="outline"
                    size="sm"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    HTML
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Características do formulário */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">11 Campos</h4>
                  <p className="text-sm text-gray-600">Dados completos da escola</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">4 Seções</h4>
                  <p className="text-sm text-gray-600">Organizadas logicamente</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">7 Validações</h4>
                  <p className="text-sm text-gray-600">Específicas brasileiras</p>
                </div>
              </div>

              {/* Recursos implementados */}
              <div className="space-y-4">
                <h4 className="font-medium">Recursos Implementados:</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Auto-complete de CEP via ViaCEP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Validação de código INEP (8 dígitos)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Formatação automática de CNPJ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Estados brasileiros pré-configurados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Validação de capacidade (alunos/professores)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Contratos dinâmicos do backend</span>
                  </div>
                </div>
              </div>

              {/* Preview do HTML (primeiras linhas) */}
              {formularioEscolaHTML && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Preview do Código:</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-40">
                    {formularioEscolaHTML.substring(0, 800)}...
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Formulário de Diretor */}
        <TabsContent value="diretor" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Formulário: Criar Diretor</CardTitle>
                    <CardDescription>
                      Formulário modernizado para cadastro de diretores escolares
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => salvarFormulario('diretor')}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button 
                    onClick={() => baixarHTML(formularioDiretorHTML, 'diretor-criar.html')}
                    variant="outline"
                    size="sm"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    HTML
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Características do formulário */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">7 Campos</h4>
                  <p className="text-sm text-gray-600">Dados do diretor</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">3 Seções</h4>
                  <p className="text-sm text-gray-600">Dados, Acesso, Vinculação</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">6 Validações</h4>
                  <p className="text-sm text-gray-600">Segurança avançada</p>
                </div>
              </div>

              {/* Recursos implementados */}
              <div className="space-y-4">
                <h4 className="font-medium">Recursos Implementados:</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Validação de email único no sistema</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Indicador de força da senha</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Formatação de telefone brasileiro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Confirmação de senha obrigatória</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Vinculação a contrato específico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Política de senha empresarial</span>
                  </div>
                </div>
              </div>

              {/* Preview do HTML (primeiras linhas) */}
              {formularioDiretorHTML && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Preview do Código:</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-40">
                    {formularioDiretorHTML.substring(0, 800)}...
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações finais */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-700">Próximos Passos</CardTitle>
          <CardDescription>
            Como integrar os formulários adaptados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Button 
              onClick={demonstrarIntegracao}
              className="w-full"
              size="lg"
            >
              <Eye className="h-5 w-5 mr-2" />
              Demonstrar Integração
            </Button>
            <Button 
              onClick={gerarFormularios}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              <Rocket className="h-5 w-5 mr-2" />
              {isLoading ? 'Regenerando...' : 'Regenerar Formulários'}
            </Button>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">Como Implementar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-600">
              <li>Baixe os arquivos HTML gerados</li>
              <li>Substitua os formulários inline no SchoolManagementNew.tsx</li>
              <li>Mantenha as mutations e handlers existentes</li>
              <li>Teste a integração com dados reais</li>
              <li>Valide as validações server-side</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormularioAdaptacaoExample;
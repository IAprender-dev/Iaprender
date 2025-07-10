/**
 * VISUALIZAÇÃO DO MAPEAMENTO DE FORMULÁRIOS
 * 
 * Interface para visualizar todos os formulários existentes
 * e o plano de adaptação ao novo sistema de templates
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  FileText,
  Users,
  School,
  Settings,
  Brain,
  UserCheck,
  Target,
  Calendar,
  BarChart3,
  Download
} from 'lucide-react';
import { 
  todosFormularios,
  estatisticasFormularios,
  planoAdaptacao,
  FormularioUtils,
  FormularioExistente
} from '@/utils/formulariosMapeamento';

// Ícones por categoria
const iconesCategoria = {
  'Autenticação': Users,
  'Gestão Municipal': School,
  'Educacional': FileText,
  'Perfil': UserCheck,
  'IA': Brain,
  'Configuração': Settings,
  'Gestão Alunos': Users
};

// Cores por status
const coresStatus = {
  'ATIVO': { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', icon: CheckCircle },
  'PRECISA_ADAPTACAO': { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', icon: AlertTriangle },
  'LEGADO': { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', icon: XCircle }
};

// Cores por prioridade
const coresPrioridade = {
  'ALTA': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500' },
  'MEDIA': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-500' },
  'BAIXA': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' }
};

export const FormulariosMapeamentoVisualizacao = () => {
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState('todas');

  // Filtrar formulários
  const formulariosFiltrados = todosFormularios.filter(form => {
    const matchTexto = form.nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                      form.componente.toLowerCase().includes(filtroTexto.toLowerCase());
    const matchCategoria = filtroCategoria === 'todas' || form.categoria === filtroCategoria;
    const matchStatus = filtroStatus === 'todos' || form.status === filtroStatus;
    const matchPrioridade = filtroPrioridade === 'todas' || form.prioridade === filtroPrioridade;
    
    return matchTexto && matchCategoria && matchStatus && matchPrioridade;
  });

  // Função para baixar relatório
  const baixarRelatorio = () => {
    const relatorio = FormularioUtils.gerarRelatorioAdaptacao();
    const blob = new Blob([relatorio], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-adaptacao-formularios.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Renderizar card de formulário
  const renderFormularioCard = (form: FormularioExistente) => {
    const statusConfig = coresStatus[form.status];
    const prioridadeConfig = coresPrioridade[form.prioridade];
    const IconeCategoria = iconesCategoria[form.categoria] || FileText;
    const IconeStatus = statusConfig.icon;

    return (
      <Card key={form.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <IconeCategoria className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">{form.nome}</CardTitle>
                <CardDescription className="text-sm">
                  {form.componente}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                <IconeStatus className="h-3 w-3 mr-1" />
                {form.status.replace('_', ' ')}
              </Badge>
              <Badge className={`${prioridadeConfig.bg} ${prioridadeConfig.text} ${prioridadeConfig.border}`}>
                {form.prioridade}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações técnicas */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Endpoint:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {form.metodo} {form.endpoint}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Template:</span>
              <span className="text-blue-600">{form.templateSugerido}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Roles:</span>
              <div className="flex gap-1">
                {form.rolesPermitidas.slice(0, 3).map((role, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
                {form.rolesPermitidas.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{form.rolesPermitidas.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Campos obrigatórios */}
          <div>
            <h5 className="font-medium text-sm mb-2">Campos Obrigatórios:</h5>
            <div className="flex flex-wrap gap-1">
              {form.camposObrigatorios.map((campo, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {campo}
                </Badge>
              ))}
            </div>
          </div>

          {/* Validações específicas */}
          <div>
            <h5 className="font-medium text-sm mb-2">Validações:</h5>
            <div className="flex flex-wrap gap-1">
              {form.validacoesEspecificas.map((validacao, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {validacao.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Observações */}
          {form.observacoes && (
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-blue-700">
                <strong>Observação:</strong> {form.observacoes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Target className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Mapeamento de Formulários</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Identificação e plano de adaptação para modernizar todos os formulários existentes
          no sistema IAprender com o novo sistema de templates.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="formularios">Todos Formulários</TabsTrigger>
          <TabsTrigger value="adaptacao">Plano de Adaptação</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Formulários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticasFormularios.total}</div>
                <p className="text-xs text-gray-500">Identificados no projeto</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Precisam Adaptação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {estatisticasFormularios.porStatus.PRECISA_ADAPTACAO}
                </div>
                <p className="text-xs text-gray-500">Aguardando modernização</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {estatisticasFormularios.porPrioridade.ALTA}
                </div>
                <p className="text-xs text-gray-500">Críticos para sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Já Funcionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {estatisticasFormularios.porStatus.ATIVO}
                </div>
                <p className="text-xs text-gray-500">Prontos para uso</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo por categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>
                Formulários organizados por área funcional do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(estatisticasFormularios.porCategoria).map(([categoria, count]) => {
                  const IconeCategoria = iconesCategoria[categoria] || FileText;
                  return (
                    <div key={categoria} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <IconeCategoria className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{categoria}</p>
                        <p className="text-sm text-gray-500">{count} formulários</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Todos Formulários */}
        <TabsContent value="formularios" className="mt-6">
          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Nome ou componente..."
                      value={filtroTexto}
                      onChange={(e) => setFiltroTexto(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="todas">Todas as categorias</option>
                    {Object.keys(estatisticasFormularios.porCategoria).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="todos">Todos os status</option>
                    <option value="ATIVO">Ativo</option>
                    <option value="PRECISA_ADAPTACAO">Precisa Adaptação</option>
                    <option value="LEGADO">Legado</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridade</label>
                  <select
                    value={filtroPrioridade}
                    onChange={(e) => setFiltroPrioridade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="todas">Todas as prioridades</option>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Média</option>
                    <option value="BAIXA">Baixa</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de formulários */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {formulariosFiltrados.length} formulário(s) encontrado(s)
              </h3>
              <Button onClick={baixarRelatorio} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {formulariosFiltrados.map(renderFormularioCard)}
            </div>
          </div>
        </TabsContent>

        {/* Aba Plano de Adaptação */}
        <TabsContent value="adaptacao" className="mt-6">
          <div className="space-y-6">
            {/* FASE 1 - Críticos */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <CardTitle className="text-red-700">FASE 1 - Formulários Críticos</CardTitle>
                    <CardDescription>
                      {planoAdaptacao.fase1_criticos.length} formulários de alta prioridade que precisam ser adaptados primeiro
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-4">
                  {planoAdaptacao.fase1_criticos.map(renderFormularioCard)}
                </div>
              </CardContent>
            </Card>

            {/* FASE 2 - Importantes */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <CardTitle className="text-yellow-700">FASE 2 - Formulários Importantes</CardTitle>
                    <CardDescription>
                      {planoAdaptacao.fase2_importantes.length} formulários de média prioridade para segunda fase
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-4">
                  {planoAdaptacao.fase2_importantes.map(renderFormularioCard)}
                </div>
              </CardContent>
            </Card>

            {/* FASE 3 - Opcionais */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <CardTitle className="text-green-700">FASE 3 - Formulários Opcionais</CardTitle>
                    <CardDescription>
                      {planoAdaptacao.fase3_opcionais.length} formulários de baixa prioridade para fase final
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-4">
                  {planoAdaptacao.fase3_opcionais.map(renderFormularioCard)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Estatísticas */}
        <TabsContent value="estatisticas" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Status dos Formulários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(estatisticasFormularios.porStatus).map(([status, count]) => {
                  const statusConfig = coresStatus[status as keyof typeof coresStatus];
                  const percentage = (count / estatisticasFormularios.total * 100).toFixed(1);
                  
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${statusConfig.text}`}>
                          {status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${statusConfig.bg.replace('bg-', 'bg-').replace('-100', '-500')}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Priorização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(estatisticasFormularios.porPrioridade).map(([prioridade, count]) => {
                  const prioridadeConfig = coresPrioridade[prioridade as keyof typeof coresPrioridade];
                  const percentage = (count / estatisticasFormularios.total * 100).toFixed(1);
                  
                  return (
                    <div key={prioridade} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${prioridadeConfig.text}`}>
                          Prioridade {prioridade}
                        </span>
                        <span className="text-sm text-gray-500">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${prioridadeConfig.bg.replace('bg-', 'bg-').replace('-100', '-500')}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormulariosMapeamentoVisualizacao;
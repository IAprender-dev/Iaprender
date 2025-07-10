import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileText, Activity, PenTool, Lightbulb } from "lucide-react";

export default function TeacherDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-amber-600" />
              Dashboard do Professor
            </h1>
            <p className="text-slate-600 mt-2">Ferramentas pedagógicas com IA avançada</p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 px-4 py-2">
            <Activity className="h-4 w-4 mr-2" />
            Sistema Ativo
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Turmas</span>
                <Users className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">4</div>
              <p className="text-amber-100">Sob sua responsabilidade</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Alunos</span>
                <Users className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">85</div>
              <p className="text-orange-100">Total de estudantes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Planos</span>
                <FileText className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-red-100">Planos de aula criados</p>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-800">Login AWS Cognito realizado com sucesso!</h3>
                <p className="text-amber-600">
                  Você foi autenticado como <strong>Professor</strong> e redirecionado automaticamente para este dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IA Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-6 w-6 text-amber-600" />
                Planos de Aula IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Crie planos de aula personalizados com IA.</p>
              <Button className="w-full bg-amber-600 hover:bg-amber-700">
                Criar Plano
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-orange-600" />
                Atividades Interativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Gere atividades e exercícios automaticamente.</p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Criar Atividade
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-red-600" />
                Gestão de Turmas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Acompanhe o progresso dos seus alunos.</p>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Ver Turmas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-purple-600" />
                Correção Automática
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">IA para correção de atividades e provas.</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Corrigir Atividades
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Material Didático
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Recursos educacionais e conteúdos BNCC.</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Biblioteca Digital
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-green-600" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Relatórios de desempenho e engajamento.</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
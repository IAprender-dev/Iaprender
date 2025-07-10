import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, Activity, Calendar, BarChart3 } from "lucide-react";

export default function SchoolDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <GraduationCap className="h-10 w-10 text-emerald-600" />
              Dashboard do Diretor
            </h1>
            <p className="text-slate-600 mt-2">Gestão completa da sua escola</p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 px-4 py-2">
            <Activity className="h-4 w-4 mr-2" />
            Sistema Ativo
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Alunos</span>
                <Users className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">150</div>
              <p className="text-emerald-100">Matriculados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Professores</span>
                <GraduationCap className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-teal-100">Corpo docente</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Turmas</span>
                <BookOpen className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-cyan-100">Ativas este ano</p>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-800">Login AWS Cognito realizado com sucesso!</h3>
                <p className="text-emerald-600">
                  Você foi autenticado como <strong>Diretor Escolar</strong> e redirecionado automaticamente para este dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-emerald-600" />
                Gestão de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Matrículas, frequência e desempenho.</p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Gerenciar Alunos
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-teal-600" />
                Corpo Docente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Professores e coordenação pedagógica.</p>
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                Gerenciar Professores
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-cyan-600" />
                Currículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Disciplinas, horários e planejamento.</p>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                Gestão Acadêmica
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Calendário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Eventos, reuniões e atividades.</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Ver Calendário
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Desempenho e indicadores escolares.</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Relatórios
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-orange-600" />
                Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Atividades e estatísticas em tempo real.</p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Dashboard Escolar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
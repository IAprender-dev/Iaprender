import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, School, FileText, Activity, Users, Building2, LogOut } from "lucide-react";
import iaprenderLogo from "@assets/iaprender-logo.png";

export default function GestorDashboard() {
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header com Logo */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo e Marca IAprender */}
            <div className="flex items-center space-x-4">
              <img 
                src={iaprenderLogo} 
                alt="IAprender Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">IAprender</h1>
                <p className="text-sm text-slate-600">Plataforma Educacional IA</p>
              </div>
            </div>

            {/* Botão de Logout */}
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-600 hover:text-red-600 hover:border-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <UserCheck className="h-10 w-10 text-indigo-600" />
              Dashboard do Gestor
            </h2>
            <p className="text-slate-600 mt-2">Gestão educacional completa da sua empresa</p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 px-4 py-2">
            <Activity className="h-4 w-4 mr-2" />
            Sistema Ativo
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Escolas</span>
                <School className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-indigo-100">Sob sua gestão</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Diretores</span>
                <Users className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-purple-100">Equipe administrativa</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Professores</span>
                <Building2 className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-pink-100">Corpo docente</p>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-indigo-800">Login AWS Cognito realizado com sucesso!</h3>
                <p className="text-indigo-600">
                  Você foi autenticado como <strong>Gestor Municipal</strong> e redirecionado automaticamente para este dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-6 w-6 text-indigo-600" />
                Gestão de Escolas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Gerencie as escolas sob sua responsabilidade.</p>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Acessar Escolas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                Gestão de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Administre diretores, professores e alunos.</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Gerenciar Usuários
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-pink-600" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Visualize relatórios e estatísticas.</p>
              <Button className="w-full bg-pink-600 hover:bg-pink-700">
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-green-600" />
                Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Acompanhe atividades em tempo real.</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Dashboard Executivo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
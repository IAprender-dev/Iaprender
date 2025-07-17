import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  Building,
  Settings,
  Activity,
  BarChart3,
  LogOut,
  Bot,
  Brain,
} from "lucide-react";
import { Link } from "wouter";
import iaprenderLogo from "@assets/iaprender-logo.png";

export default function AdminMaster() {
  const handleLogout = () => {
    // Limpar dados de autenticação e redirecionar
    localStorage.removeItem("auth_token");
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                <p className="text-sm text-slate-600">
                  Plataforma Educacional IA
                </p>
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
              <Shield className="h-10 w-10 text-blue-600" />
              Dashboard Administrativo
            </h2>
            <p className="text-slate-600 mt-2">
              Controle total do sistema IAprender
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 px-4 py-2"
          >
            <Activity className="h-4 w-4 mr-2" />
            Sistema Ativo
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Empresas</span>
                <Building className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5</div>
              <p className="text-blue-100">Instituições ativas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Usuários</span>
                <Users className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">14</div>
              <p className="text-green-100">Total no sistema</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Escolas</span>
                <Building className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">9</div>
              <p className="text-purple-100">Instituições cadastradas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Contratos</span>
                <BarChart3 className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">6</div>
              <p className="text-orange-100">Contratos ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Login AWS Cognito realizado com sucesso!
                </h3>
                <p className="text-green-600">
                  Você foi autenticado como <strong>Administrador</strong> e
                  redirecionado automaticamente para este dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Link href="/central-ia">
            <Button className="h-24 w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-lg">
              <div className="flex flex-col items-center space-y-2">
                <Bot className="h-8 w-8" />
                <span>Central IA</span>
              </div>
            </Button>
          </Link>

          <Link href="/ai-preferences">
            <Button className="h-24 w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-lg">
              <div className="flex flex-col items-center space-y-2">
                <Brain className="h-8 w-8" />
                <span>Config IA</span>
              </div>
            </Button>
          </Link>



          <Button className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg">
            <div className="flex flex-col items-center space-y-2">
              <Users className="h-8 w-8" />
              <span>Gerenciar Usuários</span>
            </div>
          </Button>

          <Button className="h-24 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg">
            <div className="flex flex-col items-center space-y-2">
              <Building className="h-8 w-8" />
              <span>Gerenciar Empresas</span>
            </div>
          </Button>

          <Button className="h-24 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold text-lg">
            <div className="flex flex-col items-center space-y-2">
              <Settings className="h-8 w-8" />
              <span>Configurações</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

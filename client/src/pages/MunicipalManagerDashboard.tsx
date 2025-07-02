import { Users, School, BarChart3, Settings, Bell, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function MunicipalManagerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <School className="h-8 w-8 text-emerald-600" />
                <h1 className="text-2xl font-bold text-gray-900">IAverse</h1>
              </div>
              <span className="text-gray-500">|</span>
              <h2 className="text-xl font-semibold text-gray-700">Gestão Municipal</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 transform translate-x-1/2 -translate-y-1/2"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">Gestor Municipal</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-medium text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Bem-vindo, {user?.firstName}!
            </h3>
            <p className="text-gray-600 text-lg">
              Gerencie a educação municipal com ferramentas de IA avançadas
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <School className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Escolas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">47</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Professores</p>
                <p className="text-2xl font-bold text-gray-900">1,284</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Alunos</p>
                <p className="text-2xl font-bold text-gray-900">28,547</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Uso de IA (mês)</p>
                <p className="text-2xl font-bold text-gray-900">15,642</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gestão de Escolas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <School className="h-5 w-5 text-emerald-600 mr-2" />
                Gestão de Escolas
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <a href="/municipal/schools" className="block p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Listar Escolas</h4>
                  <p className="text-sm text-gray-500 mt-1">Visualize todas as escolas da rede municipal</p>
                </a>
                <a href="/municipal/schools/create" className="block p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Cadastrar Nova Escola</h4>
                  <p className="text-sm text-gray-500 mt-1">Adicione uma nova escola à rede</p>
                </a>
                <a href="/municipal/reports" className="block p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Relatórios Educacionais</h4>
                  <p className="text-sm text-gray-500 mt-1">Acompanhe métricas e desempenho</p>
                </a>
              </div>
            </div>
          </div>

          {/* Ferramentas de IA */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                Ferramentas de IA
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <a href="/municipal/ai/analytics" className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Analytics Municipal</h4>
                  <p className="text-sm text-gray-500 mt-1">Análise de dados educacionais com IA</p>
                </a>
                <a href="/municipal/ai/planning" className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Planejamento Estratégico</h4>
                  <p className="text-sm text-gray-500 mt-1">IA para planejamento educacional</p>
                </a>
                <a href="/municipal/ai/management" className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Gestão de Recursos</h4>
                  <p className="text-sm text-gray-500 mt-1">Otimização com inteligência artificial</p>
                </a>
              </div>
            </div>
          </div>

          {/* Configurações e Administração */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 text-purple-600 mr-2" />
                Administração
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <a href="/municipal/users" className="block p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Gestão de Usuários</h4>
                  <p className="text-sm text-gray-500 mt-1">Gerencie professores e diretores</p>
                </a>
                <a href="/municipal/permissions" className="block p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Permissões e Acesso</h4>
                  <p className="text-sm text-gray-500 mt-1">Configure níveis de acesso</p>
                </a>
                <a href="/municipal/settings" className="block p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Configurações Gerais</h4>
                  <p className="text-sm text-gray-500 mt-1">Ajustes da plataforma municipal</p>
                </a>
              </div>
            </div>
          </div>

          {/* Notificações e Comunicação */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="h-5 w-5 text-orange-600 mr-2" />
                Comunicação
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <a href="/municipal/notifications" className="block p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Central de Notificações</h4>
                  <p className="text-sm text-gray-500 mt-1">Gerencie comunicações da rede</p>
                </a>
                <a href="/municipal/announcements" className="block p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Comunicados Oficiais</h4>
                  <p className="text-sm text-gray-500 mt-1">Envie avisos para toda a rede</p>
                </a>
                <a href="/municipal/messages" className="block p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                  <h4 className="font-medium text-gray-900">Mensagens Diretas</h4>
                  <p className="text-sm text-gray-500 mt-1">Comunicação direta com escolas</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
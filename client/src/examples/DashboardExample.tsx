import React, { useState, useEffect } from 'react';
import { BarChart3, Users, UserCheck, Building, TrendingUp, 
         Bell, RefreshCw, Download, Settings, LogOut } from 'lucide-react';

/**
 * EXEMPLO DASHBOARD REACT - TAREFA 6
 * 
 * Demonstração do dashboard implementado em React com todas as funcionalidades
 */

const DashboardExample: React.FC = () => {
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalEscolas: 0,
    taxaAprovacao: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [recentData, setRecentData] = useState<any[]>([]);
  const [user] = useState({
    nome: 'Administrador Sistema',
    tipo_usuario: 'admin',
    email: 'admin@iaprender.com'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    // Simular carregamento de dados
    setTimeout(() => {
      setStats({
        totalAlunos: 1247,
        totalProfessores: 89,
        totalEscolas: 12,
        taxaAprovacao: 94
      });
      
      setRecentData([
        {
          tipo: 'Aluno',
          nome: 'Ana Silva Santos',
          info: 'Matrícula: 2024001',
          status: 'Ativo',
          data: '10/07/2025'
        },
        {
          tipo: 'Professor',
          nome: 'Carlos Eduardo Ferreira',
          info: 'Disciplina: Matemática',
          status: 'Ativo',
          data: '09/07/2025'
        },
        {
          tipo: 'Escola',
          nome: 'EMEF João Paulo II',
          info: 'INEP: 12345678',
          status: 'Ativa',
          data: '08/07/2025'
        }
      ]);
      
      setIsLoading(false);
    }, 1500);
  };

  const getTypeBadgeClass = (tipo: string) => {
    const classes = {
      'Aluno': 'bg-blue-100 text-blue-800',
      'Professor': 'bg-green-100 text-green-800',
      'Escola': 'bg-purple-100 text-purple-800',
      'Diretor': 'bg-orange-100 text-orange-800',
      'Gestor': 'bg-red-100 text-red-800'
    };
    
    return classes[tipo as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      'Ativo': 'bg-green-100 text-green-800',
      'Ativa': 'bg-green-100 text-green-800',
      'Inativo': 'bg-red-100 text-red-800',
      'Inativa': 'bg-red-100 text-red-800',
      'Pendente': 'bg-yellow-100 text-yellow-800'
    };
    
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  const filteredData = selectedFilter === 'all' 
    ? recentData 
    : recentData.filter(item => item.tipo.toLowerCase() === selectedFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">IAprender Dashboard</h1>
                <p className="text-sm text-gray-600">Sistema Educacional Inteligente</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="block text-sm font-medium text-gray-900">{user.nome}</span>
                  <span className="block text-xs text-gray-500">
                    {user.tipo_usuario === 'admin' ? 'Administrador' : user.tipo_usuario}
                  </span>
                </div>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              
              <button className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Total de Alunos</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {isLoading ? (
                    <span className="animate-pulse">-</span>
                  ) : (
                    stats.totalAlunos.toLocaleString()
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Total de Professores</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {isLoading ? (
                    <span className="animate-pulse">-</span>
                  ) : (
                    stats.totalProfessores
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+8%</span>
              <span className="text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Total de Escolas</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {isLoading ? (
                    <span className="animate-pulse">-</span>
                  ) : (
                    stats.totalEscolas
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+5%</span>
              <span className="text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Taxa de Aprovação</h3>
                <p className="text-3xl font-bold text-emerald-600 mt-2">
                  {isLoading ? (
                    <span className="animate-pulse">-</span>
                  ) : (
                    `${stats.taxaAprovacao}%`
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+3%</span>
              <span className="text-gray-500 ml-2">vs mês anterior</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-6 mb-8 border border-white/20">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-yellow-500" />
            Ações Rápidas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <Building className="w-6 h-6" />
              </div>
              <span className="font-medium">Cadastrar Escola</span>
            </button>

            <button className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6" />
              </div>
              <span className="font-medium">Cadastrar Aluno</span>
            </button>

            <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="font-medium">Cadastrar Professor</span>
            </button>

            <button className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-300 transform hover:scale-105 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="font-medium">Gerar Relatório</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-gray-600" />
                Dados Recentes
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={loadDashboardData}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </button>
                <select 
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todos os Dados</option>
                  <option value="aluno">Alunos</option>
                  <option value="professor">Professores</option>
                  <option value="escola">Escolas</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  </div>
                  <span className="ml-3 text-gray-500">Carregando dados...</span>
                </div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Informação</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(item.tipo)}`}>
                            {item.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.info}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6">Dashboard IAprender - TAREFA 6</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Funcionalidades</h3>
              <ul className="text-sm space-y-1">
                <li>• Dashboard HTML completo em /client/src/dashboard.html</li>
                <li>• Script JavaScript em /client/src/dashboard.js</li>
                <li>• Integração com FormGenerator e AuthManager</li>
                <li>• Gráficos Chart.js interativos</li>
                <li>• Sistema de modais para formulários</li>
                <li>• Notificações toast automáticas</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Design System</h3>
              <ul className="text-sm space-y-1">
                <li>• Glassmorphism com backdrop-blur</li>
                <li>• Gradientes e animações CSS</li>
                <li>• Lucide Icons integrados</li>
                <li>• Tailwind CSS responsivo</li>
                <li>• Loading states animados</li>
                <li>• Sistema de badges coloridos</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Integrações</h3>
              <ul className="text-sm space-y-1">
                <li>• Autenticação AWS Cognito</li>
                <li>• Formulários dinâmicos configuráveis</li>
                <li>• Sistema de hierarquia de usuários</li>
                <li>• API REST endpoints</li>
                <li>• Geração de relatórios</li>
                <li>• Filtros e busca em tempo real</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardExample;
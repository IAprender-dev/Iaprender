import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  User, 
  LogOut, 
  Users, 
  BarChart3, 
  Star,
  GraduationCap,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  FileText,
  Building,
  Shield
} from 'lucide-react';
import alverseLogo from '@/assets/aiverse-logo-new.png';

export default function SecretaryDashboard() {
  const { user, logout } = useAuth();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/secretary/dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/secretary/dashboard-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Fetch recent notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/secretary/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/secretary/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });

  // Get current date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        {/* Main Dashboard Container */}
        <div className="flex h-screen bg-slate-50">
          {/* Left Sidebar - Profile Summary */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg">
            {/* Profile Header */}
            <div className="p-6 border-b border-slate-200">
              <Card className="mb-6 border border-slate-200 bg-white shadow-sm">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-20 w-20 border-2 border-slate-200">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-xl font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-sm text-slate-600 mb-2">{user?.email}</p>
                    <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                      <Shield className="h-3 w-3 mr-1" />
                      Secretaria
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Navigation and Actions */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                <Link href="/secretary/users">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium h-12">
                    <Users className="h-5 w-5 mr-2" />
                    Gestão de Usuários
                  </Button>
                </Link>
                
                <div className="grid gap-3">
                  <Button variant="outline" className="w-full justify-start h-11 border-slate-300 hover:bg-slate-50">
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Relatórios e Análises
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start h-11 border-slate-300 hover:bg-slate-50">
                    <MessageSquare className="h-4 w-4 mr-3" />
                    Central de Notificações
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start h-11 border-slate-300 hover:bg-slate-50">
                    <Building className="h-4 w-4 mr-3" />
                    Configurações da Escola
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                      <img src={alverseLogo} alt="Alverse" className="h-8 w-8 object-contain" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-slate-900">Dashboard da Secretaria</h1>
                      <p className="text-sm text-slate-600 capitalize">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={logout}
                      size="sm"
                      className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
              {/* Welcome Section */}
              <Card className="mb-8 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 text-white border-0 shadow-2xl transform hover:scale-[1.02] transition-all duration-500">
                <CardContent className="p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">{getGreeting()}, {user?.firstName}!</h2>
                        <p className="text-white/90 text-xl font-medium mb-6">Central administrativa da instituição</p>
                        <div className="flex items-center gap-8 mt-4">
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <Users className="h-5 w-5" />
                            <span className="font-bold">{statsLoading ? '...' : stats?.totalStudents || 0} Alunos</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <GraduationCap className="h-5 w-5" />
                            <span className="font-bold">{statsLoading ? '...' : stats?.totalTeachers || 0} Professores</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <MessageSquare className="h-5 w-5" />
                            <span className="font-bold">{statsLoading ? '...' : stats?.pendingNotifications || 0} Pendentes</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 mb-2 px-4 py-2 text-base font-bold shadow-lg">
                          <Star className="h-4 w-4 mr-2" />
                          Admin
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-blue-200 shadow-lg">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Total de Alunos</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {statsLoading ? '...' : stats?.totalStudents || 0}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">+5%</div>
                        <div className="text-xs text-slate-500">este mês</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-green-200 shadow-lg">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Total de Professores</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {statsLoading ? '...' : stats?.totalTeachers || 0}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">+2</div>
                        <div className="text-xs text-slate-500">novos</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-amber-200 shadow-lg">
                          <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Notificações Pendentes</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {statsLoading ? '...' : stats?.pendingNotifications || 0}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-amber-600">
                          {statsLoading ? '...' : Math.round((stats?.pendingNotifications || 0) / (stats?.totalNotifications || 1) * 100)}%
                        </div>
                        <div className="text-xs text-slate-500">pendente</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-purple-200 shadow-lg">
                          <Star className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Satisfação Média</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {statsLoading ? '...' : `${stats?.averageSatisfaction || 0}/5`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">★★★★☆</div>
                        <div className="text-xs text-slate-500">avaliação</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Notifications */}
              <Card className="mb-8 border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-amber-200 shadow-lg">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Notificações Recentes</CardTitle>
                        <p className="text-sm text-slate-600">Comunicações importantes dos professores</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-50">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {notificationsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications && notifications.length > 0 ? (
                    <div className="space-y-4">
                      {notifications.slice(0, 5).map((notification: any) => (
                        <div key={notification.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-all duration-200 hover:shadow-md">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                notification.priority === 'urgent' ? 'bg-red-100' :
                                notification.priority === 'high' ? 'bg-orange-100' :
                                'bg-blue-100'
                              }`}>
                                <AlertTriangle className={`h-4 w-4 ${
                                  notification.priority === 'urgent' ? 'text-red-600' :
                                  notification.priority === 'high' ? 'text-orange-600' :
                                  'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <span className="font-mono text-sm text-blue-600 font-medium">
                                  {notification.sequentialNumber}
                                </span>
                                <Badge className={`ml-2 ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <span className="text-sm text-slate-500">
                              {new Date(notification.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <span className="font-medium text-slate-700">Professor:</span>
                              <p className="text-slate-600">{notification.teacherName}</p>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Aluno:</span>
                              <p className="text-slate-600">{notification.studentName}</p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <span className="font-medium text-slate-700 text-sm">Mensagem:</span>
                            <p className="text-slate-600 text-sm">{notification.message}</p>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <span className="text-xs text-slate-500">
                              {new Date(notification.notificationDate).toLocaleString('pt-BR')}
                            </span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-slate-300 hover:bg-slate-50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Marcar Lida
                              </Button>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                Responder
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                      <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhuma notificação</h3>
                      <p>Não há notificações recentes para exibir</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/secretary/users">
                  <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-purple-200 shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 mb-1">Gestão de Usuários</h3>
                          <p className="text-sm text-slate-600">Cadastrar e gerenciar alunos e professores</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-green-200 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Relatórios</h3>
                        <p className="text-sm text-slate-600">Análises e métricas da instituição</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-blue-200 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Building className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Configurações</h3>
                        <p className="text-sm text-slate-600">Configurar a escola e sistema</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
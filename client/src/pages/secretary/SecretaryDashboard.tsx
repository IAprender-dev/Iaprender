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

  // Fetch users data for cards
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/secretary/users'],
    queryFn: async () => {
      const response = await fetch('/api/secretary/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Calculate real stats from users data
  const realStats = usersData ? {
    totalStudents: usersData.filter((u: any) => u.role === 'student').length,
    totalTeachers: usersData.filter((u: any) => u.role === 'teacher').length,
    activeUsers: usersData.filter((u: any) => u.status === 'active').length,
    pendingUsers: usersData.filter((u: any) => u.status === 'pending').length,
    recentUsers: usersData.filter((u: any) => {
      const createdAt = new Date(u.createdAt);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return createdAt > lastWeek;
    }).length
  } : null;

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
                  
                  <Link href="/secretary/notifications">
                    <Button variant="outline" className="w-full justify-start h-11 border-slate-300 hover:bg-slate-50">
                      <MessageSquare className="h-4 w-4 mr-3" />
                      Central de Notificações
                    </Button>
                  </Link>
                  
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
                            <span className="font-bold">{usersLoading ? '...' : realStats?.totalStudents || 0} Alunos</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <GraduationCap className="h-5 w-5" />
                            <span className="font-bold">{usersLoading ? '...' : realStats?.totalTeachers || 0} Professores</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <MessageSquare className="h-5 w-5" />
                            <span className="font-bold">{statsLoading ? '...' : stats?.pendingNotifications || 0} Notificações</span>
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

              {/* Enhanced Stats Cards with Real Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Students Card */}
                <Card className="border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                          +{realStats?.recentUsers || 0} novos
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Total de Alunos</p>
                      <p className="text-4xl font-black text-slate-900">
                        {usersLoading ? (
                          <div className="h-10 bg-blue-200 rounded animate-pulse"></div>
                        ) : (
                          realStats?.totalStudents || 0
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {realStats?.activeUsers || 0} ativos de {(realStats?.totalStudents || 0) + (realStats?.totalTeachers || 0)} total
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Teachers Card */}
                <Card className="border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        <GraduationCap className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          {Math.round(((realStats?.totalTeachers || 0) / ((realStats?.totalStudents || 0) + (realStats?.totalTeachers || 0)) * 100) || 0)}% equipe
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Total de Professores</p>
                      <p className="text-4xl font-black text-slate-900">
                        {usersLoading ? (
                          <div className="h-10 bg-green-200 rounded animate-pulse"></div>
                        ) : (
                          realStats?.totalTeachers || 0
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Proporção: {realStats?.totalStudents && realStats?.totalTeachers ? Math.round(realStats.totalStudents / realStats.totalTeachers) : 0} alunos/professor
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Approvals Card */}
                <Card className="border-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        <AlertTriangle className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                          realStats?.pendingUsers === 0 ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100'
                        }`}>
                          {realStats?.pendingUsers === 0 ? 'Em dia' : 'Atenção'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Aprovações Pendentes</p>
                      <p className="text-4xl font-black text-slate-900">
                        {usersLoading ? (
                          <div className="h-10 bg-amber-200 rounded animate-pulse"></div>
                        ) : (
                          realStats?.pendingUsers || 0
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Aguardando aprovação da secretaria
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications Card */}
                <Card className="border-0 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        <MessageSquare className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                          {statsLoading ? '...' : Math.round((stats?.pendingNotifications || 0) / (stats?.totalNotifications || 1) * 100)}% pendente
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Notificações</p>
                      <p className="text-4xl font-black text-slate-900">
                        {statsLoading ? (
                          <div className="h-10 bg-purple-200 rounded animate-pulse"></div>
                        ) : (
                          stats?.pendingNotifications || 0
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Comunicações dos professores
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Users and Notifications */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Recent Users */}
                <Card className="border-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <CardHeader className="border-b border-slate-100/50 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                          Usuários Recentes
                        </CardTitle>
                        <p className="text-sm text-slate-600">Últimos cadastros na plataforma</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {usersLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-white/70 rounded-xl animate-pulse">
                            <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : usersData && usersData.length > 0 ? (
                      <div className="space-y-3">
                        {usersData.slice(0, 5).map((user: any) => (
                          <div key={user.id} className="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-all duration-200 border border-slate-200/50">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                              user.role === 'teacher' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            }`}>
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-xs ${
                                  user.role === 'teacher' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                }`}>
                                  {user.role === 'teacher' ? 'Professor' : 'Aluno'}
                                </Badge>
                                <Badge className={`text-xs ${
                                  user.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                  user.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                  'bg-gray-100 text-gray-700 border-gray-200'
                                }`}>
                                  {user.status === 'active' ? 'Ativo' : user.status === 'pending' ? 'Pendente' : 'Inativo'}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">
                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum usuário</h3>
                        <p>Não há usuários cadastrados</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Notifications */}
                <Card className="border-0 bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <CardHeader className="border-b border-slate-100/50 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                          <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                            Notificações Recentes
                          </CardTitle>
                          <p className="text-sm text-slate-600">Comunicações dos professores</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-slate-300 hover:bg-white/70">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Todas
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {notificationsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 bg-white/70 rounded-xl animate-pulse">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifications && notifications.length > 0 ? (
                      <div className="space-y-3">
                        {notifications.slice(0, 4).map((notification: any) => (
                          <div key={notification.id} className="p-4 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-all duration-200 border border-slate-200/50">
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${
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
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                                    {notification.sequentialNumber}
                                  </span>
                                  <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                    {notification.priority.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium text-slate-900 mb-1">
                                  {notification.teacherName} → {notification.studentName}
                                </p>
                                <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-xs text-slate-500">
                                    {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                                      Responder
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhuma notificação</h3>
                        <p>Não há notificações recentes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

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
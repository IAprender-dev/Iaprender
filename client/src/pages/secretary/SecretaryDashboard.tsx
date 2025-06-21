import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  GraduationCap, 
  MessageSquare, 
  BarChart3, 
  Star, 
  TrendingUp, 
  UserPlus,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  School
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function SecretaryDashboard() {
  const { user } = useAuth();

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-600';
      case 'read': return 'text-green-600';
      case 'resolved': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dashboard Secretaria - IAverse</title>
      </Helmet>

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard da Secretaria</h1>
              <p className="text-gray-600">Visão geral da instituição e gestão administrativa</p>
            </div>
            <div className="flex items-center gap-2">
              <School className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Bem-vinda, {user?.firstName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Alunos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats?.totalStudents || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Professores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats?.totalTeachers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Notificações Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats?.pendingNotifications || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Satisfação Média</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : `${stats?.averageSatisfaction || 0}/5`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
            <TabsTrigger value="users">Gestão de Usuários</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfação</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notificações Recebidas
                </CardTitle>
                <CardDescription>
                  Notificações enviadas por professores e comunicações importantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification: any) => (
                      <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-blue-600 font-medium">
                              {notification.sequentialNumber}
                            </span>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority.toUpperCase()}
                            </Badge>
                            <span className={`text-sm font-medium ${getStatusColor(notification.status)}`}>
                              {notification.status === 'sent' && <Clock className="h-4 w-4 inline mr-1" />}
                              {notification.status === 'read' && <CheckCircle className="h-4 w-4 inline mr-1" />}
                              {notification.status}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(notification.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Professor:</span>
                            <p className="text-gray-600">{notification.teacherName}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Aluno:</span>
                            <p className="text-gray-600">{notification.studentName}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Tipo:</span>
                            <p className="text-gray-600">{notification.notificationType}</p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className="font-medium text-gray-700 text-sm">Assunto:</span>
                          <p className="text-gray-800 font-medium">{notification.subject}</p>
                        </div>
                        
                        <div className="mb-3">
                          <span className="font-medium text-gray-700 text-sm">Mensagem:</span>
                          <p className="text-gray-600 text-sm">{notification.message}</p>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="text-xs text-gray-500">
                            Data da ocorrência: {new Date(notification.notificationDate).toLocaleString('pt-BR')}
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Marcar como Lida
                            </Button>
                            <Button size="sm">
                              Responder
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma notificação recebida</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análises da Instituição
                </CardTitle>
                <CardDescription>
                  Métricas e indicadores de performance da escola
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Performance Acadêmica</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">Taxa de Aprovação</span>
                        <span className="text-lg font-bold text-green-600">85%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium">Média Geral</span>
                        <span className="text-lg font-bold text-blue-600">7.3</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm font-medium">Taxa de Frequência</span>
                        <span className="text-lg font-bold text-yellow-600">92%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Indicadores Operacionais</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm font-medium">Alunos por Professor</span>
                        <span className="text-lg font-bold text-purple-600">28</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                        <span className="text-sm font-medium">Utilização de Salas</span>
                        <span className="text-lg font-bold text-indigo-600">78%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                        <span className="text-sm font-medium">Eventos este Mês</span>
                        <span className="text-lg font-bold text-pink-600">12</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestão de Usuários
                  </CardTitle>
                  <CardDescription>
                    Cadastrar, editar e gerenciar alunos e professores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full justify-start" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar Novo Aluno
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar Novo Professor
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Gerenciar Usuários Existentes
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Relatórios de Usuários
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usuários Pendentes de Aprovação</CardTitle>
                  <CardDescription>
                    Novos cadastros aguardando validação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">João Silva</p>
                        <p className="text-sm text-gray-600">Professor - Matemática</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Maria Santos</p>
                        <p className="text-sm text-gray-600">Aluna - 8º Ano</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="satisfaction">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Índice de Satisfação
                </CardTitle>
                <CardDescription>
                  Feedback de alunos e pais sobre a instituição
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">4.2</p>
                    <p className="text-sm text-gray-600">Ensino</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">4.0</p>
                    <p className="text-sm text-gray-600">Instalações</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">4.5</p>
                    <p className="text-sm text-gray-600">Comunicação</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">4.3</p>
                    <p className="text-sm text-gray-600">Geral</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Comentários Recentes</h3>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1,2,3,4,5].map((star) => (
                            <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">- Pai/Mãe de Ana Clara</span>
                      </div>
                      <p className="text-sm text-gray-700">"Excelente qualidade de ensino. Professores muito dedicados."</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1,2,3,4].map((star) => (
                            <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <Star className="h-4 w-4 text-gray-300" />
                        </div>
                        <span className="text-sm text-gray-600">- Pedro Santos (Aluno)</span>
                      </div>
                      <p className="text-sm text-gray-700">"Gosto muito da escola, mas as instalações poderiam ser melhoradas."</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
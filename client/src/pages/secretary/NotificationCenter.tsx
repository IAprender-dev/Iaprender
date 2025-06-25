import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { 
  MessageSquare,
  Send,
  Eye,
  Archive,
  Reply,
  Filter,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  ArrowLeft,
  Mail,
  Phone,
  User,
  Calendar,
  Trash2,
  Edit,
  RefreshCw,
  Bell
} from 'lucide-react';

interface NotificationData {
  id: number;
  sequentialNumber: string;
  senderId: number;
  senderName: string;
  recipientType: string;
  title: string;
  message: string;
  type: 'behavior' | 'academic' | 'administrative' | 'communication';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'read' | 'archived';
  studentId?: number;
  studentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  requiresResponse: boolean;
  responseText?: string;
  respondedAt?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTab, setSelectedTab] = useState('received');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newNotification, setNewNotification] = useState({
    recipientType: 'all_teachers',
    selectedRecipients: [] as number[],
    title: '',
    message: '',
    type: 'communication' as const,
    priority: 'medium' as const,
    requiresResponse: false
  });

  // Fetch notifications
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['/api/notifications/secretary'],
    enabled: !!user
  });

  // Fetch users for recipient selection
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      });
      if (!response.ok) throw new Error('Failed to send notification');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Notificação enviada com sucesso!",
      });
      setNewNotification({
        recipientType: 'all_teachers',
        selectedRecipients: [],
        title: '',
        message: '',
        type: 'communication',
        priority: 'medium',
        requiresResponse: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/secretary'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar notificação",
        variant: "destructive"
      });
    }
  });

  // Update notification status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/notifications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/secretary'] });
      toast({
        title: "Sucesso",
        description: "Status da notificação atualizado!",
      });
    }
  });

  const handleSendNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: "Erro",
        description: "Por favor, preencha título e mensagem",
        variant: "destructive"
      });
      return;
    }

    sendNotificationMutation.mutate({
      ...newNotification,
      recipientIds: newNotification.selectedRecipients
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'read': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'behavior': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'academic': return <User className="h-4 w-4 text-blue-600" />;
      case 'administrative': return <Users className="h-4 w-4 text-purple-600" />;
      case 'communication': return <MessageSquare className="h-4 w-4 text-green-600" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications?.filter((notification: NotificationData) => {
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.studentName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab type
    let matchesTab = true;
    if (selectedTab === 'received') {
      matchesTab = notification.senderId !== user?.id;
    } else if (selectedTab === 'sent') {
      matchesTab = notification.senderId === user?.id;
    }
    // For 'all', show all notifications
    
    return matchesPriority && matchesStatus && matchesSearch && matchesTab;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/secretary">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Central de Notificações</h1>
                <p className="text-gray-600">Gerencie comunicações com professores e estudantes</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => refetch()} size="sm" variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recebidas
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviadas
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Todas
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova
            </TabsTrigger>
          </TabsList>

          {/* Received Notifications Tab */}
          <TabsContent value="received" className="space-y-6">
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando notificações...</p>
                  </CardContent>
                </Card>
              ) : filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação recebida</h3>
                    <p className="text-gray-600">
                      Ainda não há notificações recebidas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification: NotificationData) => (
                  <Card key={notification.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-slate-900 mb-1">{notification.title}</h3>
                                  <p className="text-sm text-slate-600 mb-2">
                                    De: {notification.senderName} • {notification.sequentialNumber}
                                  </p>
                                  <p className="text-sm text-slate-700 mb-3">{notification.message}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex gap-2">
                                    <Badge className={getPriorityColor(notification.priority)}>
                                      {notification.priority}
                                    </Badge>
                                    <Badge className={getStatusColor(notification.status)}>
                                      {notification.status}
                                    </Badge>
                                  </div>
                                  <span className="text-sm text-slate-500">
                                    {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {notification.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate({
                                      id: notification.id,
                                      status: 'read'
                                    })}
                                    className="gap-2"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Marcar como Lida
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({
                                    id: notification.id,
                                    status: 'archived'
                                  })}
                                  className="gap-2"
                                >
                                  <Archive className="h-4 w-4" />
                                  Arquivar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Sent Notifications Tab */}
          <TabsContent value="sent" className="space-y-6">
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando notificações...</p>
                  </CardContent>
                </Card>
              ) : filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação enviada</h3>
                    <p className="text-gray-600">
                      Ainda não foram enviadas notificações.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification: NotificationData) => (
                  <Card key={notification.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Send className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-slate-900 mb-1">{notification.title}</h3>
                                  <p className="text-sm text-slate-600 mb-2">
                                    Para: {notification.recipientType} • {notification.sequentialNumber}
                                  </p>
                                  <p className="text-sm text-slate-700 mb-3">{notification.message}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex gap-2">
                                    <Badge className={getPriorityColor(notification.priority)}>
                                      {notification.priority}
                                    </Badge>
                                    <Badge className={getStatusColor(notification.status)}>
                                      {notification.status}
                                    </Badge>
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      Enviada
                                    </Badge>
                                  </div>
                                  <span className="text-sm text-slate-500">
                                    {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* All Notifications Tab */}
          <TabsContent value="all" className="space-y-6">
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando notificações...</p>
                  </CardContent>
                </Card>
              ) : filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação encontrada</h3>
                    <p className="text-gray-600">
                      {notifications?.length === 0 
                        ? "Ainda não há notificações registradas." 
                        : "Tente ajustar os filtros para encontrar notificações."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification: NotificationData) => (
                  <Card key={notification.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${notification.senderId === user?.id ? 'bg-green-100' : 'bg-slate-100'}`}>
                              {notification.senderId === user?.id ? 
                                <Send className="h-4 w-4 text-green-600" /> : 
                                getTypeIcon(notification.type)
                              }
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-slate-900 mb-1">{notification.title}</h3>
                                  <p className="text-sm text-slate-600 mb-2">
                                    {notification.senderId === user?.id ? 
                                      `Para: ${notification.recipientType}` : 
                                      `De: ${notification.senderName}`
                                    } • {notification.sequentialNumber}
                                  </p>
                                  <p className="text-sm text-slate-700 mb-3">{notification.message}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex gap-2">
                                    <Badge className={getPriorityColor(notification.priority)}>
                                      {notification.priority}
                                    </Badge>
                                    <Badge className={getStatusColor(notification.status)}>
                                      {notification.status}
                                    </Badge>
                                    {notification.senderId === user?.id && (
                                      <Badge className="bg-green-100 text-green-800 border-green-200">
                                        Enviada
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-sm text-slate-500">
                                    {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                              
                              {notification.senderId !== user?.id && (
                                <div className="flex gap-2">
                                  {notification.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateStatusMutation.mutate({
                                        id: notification.id,
                                        status: 'read'
                                      })}
                                      className="gap-2"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Marcar como Lida
                                    </Button>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatusMutation.mutate({
                                      id: notification.id,
                                      status: 'archived'
                                    })}
                                    className="gap-2"
                                  >
                                    <Archive className="h-4 w-4" />
                                    Arquivar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Send New Notification Tab */}
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Enviar Nova Notificação
                </CardTitle>
                <CardDescription>
                  Comunique-se com professores e estudantes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-800">Destinatários</Label>
                    <Select 
                      value={newNotification.recipientType} 
                      onValueChange={(value) => setNewNotification({ ...newNotification, recipientType: value, selectedRecipients: [] })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione os destinatários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_teachers">Todos os Professores</SelectItem>
                        <SelectItem value="all_students">Todos os Estudantes</SelectItem>
                        <SelectItem value="selected_teachers">Professores Selecionados</SelectItem>
                        <SelectItem value="selected_students">Estudantes Selecionados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-800">Prioridade</Label>
                    <Select 
                      value={newNotification.priority} 
                      onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setNewNotification({ ...newNotification, priority: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Título da Notificação</Label>
                  <Input
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="Digite o título da notificação"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Mensagem</Label>
                  <Textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Digite a mensagem da notificação"
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => setNewNotification({
                      recipientType: 'all_teachers',
                      selectedRecipients: [],
                      title: '',
                      message: '',
                      type: 'communication',
                      priority: 'medium',
                      requiresResponse: false
                    })}
                  >
                    Limpar Formulário
                  </Button>
                  <Button
                    onClick={handleSendNotification}
                    disabled={!newNotification.recipientType || !newNotification.title || !newNotification.message || sendNotificationMutation.isPending}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                    {sendNotificationMutation.isPending ? 'Enviando...' : 'Enviar Notificação'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
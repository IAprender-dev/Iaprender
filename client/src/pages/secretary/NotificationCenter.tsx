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

  // Fetch notifications with proper secretary endpoint
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['/api/secretary/notifications'],
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
      case 'urgent': return 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200/60 shadow-sm';
      case 'high': return 'bg-gradient-to-r from-orange-50 to-amber-100 text-orange-800 border border-orange-200/60 shadow-sm';
      case 'medium': return 'bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 border border-blue-200/60 shadow-sm';
      case 'low': return 'bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 border border-emerald-200/60 shadow-sm';
      default: return 'bg-gradient-to-r from-slate-50 to-gray-100 text-slate-700 border border-slate-200/60 shadow-sm';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-800 border border-amber-200/60 shadow-sm';
      case 'read': return 'bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 border border-emerald-200/60 shadow-sm';
      case 'archived': return 'bg-gradient-to-r from-slate-50 to-gray-100 text-slate-600 border border-slate-200/60 shadow-sm';
      default: return 'bg-gradient-to-r from-slate-50 to-gray-100 text-slate-600 border border-slate-200/60 shadow-sm';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'behavior': return <AlertTriangle className="h-4 w-4 text-red-600 drop-shadow-sm" />;
      case 'academic': return <User className="h-4 w-4 text-indigo-600 drop-shadow-sm" />;
      case 'administrative': return <Users className="h-4 w-4 text-purple-600 drop-shadow-sm" />;
      case 'communication': return <MessageSquare className="h-4 w-4 text-emerald-600 drop-shadow-sm" />;
      default: return <MessageSquare className="h-4 w-4 text-slate-500 drop-shadow-sm" />;
    }
  };

  const filteredNotifications = (notifications || []).filter((notification: NotificationData) => {
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
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/secretary">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-slate-100/60 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Central de Notificações
                </h1>
                <p className="text-slate-600">Gerencie comunicações com professores e estudantes</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => refetch()} 
                size="sm" 
                variant="outline" 
                className="gap-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
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
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-sm">
            <TabsTrigger 
              value="received" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Bell className="h-4 w-4" />
              Recebidas
            </TabsTrigger>
            <TabsTrigger 
              value="sent" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700 data-[state=active]:to-slate-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Send className="h-4 w-4" />
              Enviadas
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-700 data-[state=active]:to-gray-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <MessageSquare className="h-4 w-4" />
              Todas
            </TabsTrigger>
            <TabsTrigger 
              value="send" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Nova
            </TabsTrigger>
          </TabsList>

          {/* Received Notifications Tab */}
          <TabsContent value="received" className="space-y-6">
            <div className="space-y-4">
              {isLoading ? (
                <Card className="bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardContent className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Carregando notificações...</p>
                  </CardContent>
                </Card>
              ) : filteredNotifications.length === 0 ? (
                <Card className="bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardContent className="text-center py-12">
                    <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <Bell className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Nenhuma notificação recebida</h3>
                    <p className="text-slate-500">
                      Ainda não há notificações recebidas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification: NotificationData) => (
                  <Card key={notification.id} className="bg-white/70 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                              {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 pr-4">
                                  <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
                                    {notification.title}
                                  </h3>
                                  <p className="text-sm text-slate-600 mb-2 font-medium">
                                    De: <span className="text-indigo-600">{notification.senderName}</span> • 
                                    <span className="text-slate-500 ml-1">{notification.sequentialNumber}</span>
                                  </p>
                                  <p className="text-sm text-slate-700 mb-4 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-200/30">
                                    {notification.message}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-3 min-w-max">
                                  <div className="flex gap-2 flex-wrap justify-end">
                                    <Badge className={getPriorityColor(notification.priority)}>
                                      {notification.priority === 'urgent' ? 'Urgente' : 
                                       notification.priority === 'high' ? 'Alta' : 
                                       notification.priority === 'medium' ? 'Média' : 'Baixa'}
                                    </Badge>
                                    <Badge className={getStatusColor(notification.status)}>
                                      {notification.status === 'pending' ? 'Pendente' :
                                       notification.status === 'read' ? 'Lida' : 'Arquivada'}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
                                    {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex gap-3 pt-2 border-t border-slate-200/40">
                                {notification.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate({
                                      id: notification.id,
                                      status: 'read'
                                    })}
                                    className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
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
                                  className="gap-2 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200"
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
                      {(notifications || []).length === 0 
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
            <Card className="bg-white/70 backdrop-blur-sm border border-slate-200/50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/40">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                    <Plus className="h-5 w-5 text-amber-600" />
                  </div>
                  Enviar Nova Notificação
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Comunique-se com professores e estudantes de forma eficiente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      Destinatários
                    </Label>
                    <Select 
                      value={newNotification.recipientType} 
                      onValueChange={(value) => setNewNotification({ ...newNotification, recipientType: value, selectedRecipients: [] })}
                    >
                      <SelectTrigger className="h-12 bg-white/80 border-slate-400 hover:border-slate-500 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-slate-800">
                        <SelectValue placeholder="Selecione os destinatários" className="text-slate-800 placeholder:text-slate-600" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-300 shadow-lg">
                        <SelectItem value="all_teachers" className="text-slate-800 font-medium hover:bg-slate-100">👨‍🏫 Todos os Professores</SelectItem>
                        <SelectItem value="all_students" className="text-slate-800 font-medium hover:bg-slate-100">🎓 Todos os Estudantes</SelectItem>
                        <SelectItem value="selected_teachers" className="text-slate-800 font-medium hover:bg-slate-100">✓ Professores Selecionados</SelectItem>
                        <SelectItem value="selected_students" className="text-slate-800 font-medium hover:bg-slate-100">✓ Estudantes Selecionados</SelectItem>
                        <SelectItem value="admin" className="text-slate-800 font-medium hover:bg-slate-100">⚙️ Administração</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Prioridade
                    </Label>
                    <Select 
                      value={newNotification.priority} 
                      onValueChange={(value: string) => setNewNotification({ ...newNotification, priority: value as 'low' | 'medium' | 'high' | 'urgent' })}
                    >
                      <SelectTrigger className="h-12 bg-white/80 border-slate-400 hover:border-slate-500 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 text-slate-800">
                        <SelectValue className="text-slate-800 placeholder:text-slate-600" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-300 shadow-lg">
                        <SelectItem value="low" className="text-slate-800 font-medium hover:bg-slate-100">🟢 Baixa</SelectItem>
                        <SelectItem value="medium" className="text-slate-800 font-medium hover:bg-slate-100">🔵 Média</SelectItem>
                        <SelectItem value="high" className="text-slate-800 font-medium hover:bg-slate-100">🟠 Alta</SelectItem>
                        <SelectItem value="urgent" className="text-slate-800 font-medium hover:bg-slate-100">🔴 Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Título da Notificação
                  </Label>
                  <Input
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="Digite um título claro e descritivo"
                    className="h-12 bg-white/80 border-slate-400 hover:border-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-slate-600 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Edit className="h-4 w-4 text-emerald-600" />
                    Mensagem
                  </Label>
                  <Textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Digite a mensagem detalhada da notificação..."
                    rows={6}
                    className="resize-none bg-white/80 border-slate-400 hover:border-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 placeholder:text-slate-600 text-slate-800 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200/60">
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
                    className="h-12 px-6 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Formulário
                  </Button>
                  <Button
                    onClick={handleSendNotification}
                    disabled={!newNotification.recipientType || !newNotification.title || !newNotification.message || sendNotificationMutation.isPending}
                    className="h-12 px-8 gap-2 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Send className="h-4 w-4" />
                    {sendNotificationMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </>
                    ) : (
                      'Enviar Notificação'
                    )}
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
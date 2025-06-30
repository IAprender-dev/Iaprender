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
import { apiRequest } from '@/lib/queryClient';
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
  Building2,
  User,
  Calendar,
  Trash2,
  Edit,
  RefreshCw,
  Bell,
  School,
  UserCheck
} from 'lucide-react';

interface NotificationData {
  id: number;
  sequentialNumber: string;
  senderId: number;
  senderName: string;
  recipientId?: number;
  recipientType: string;
  title: string;
  message: string;
  type: 'administrative' | 'communication' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'read' | 'archived';
  requiresResponse: boolean;
  responseText?: string;
  respondedAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface School {
  id: number;
  nomeEscola: string;
  nomeDiretor: string;
  email: string;
}

export default function SMENotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch notifications for secretary
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/secretary/notifications'],
    enabled: !!user
  });

  // Fetch schools for recipient selection
  const { data: schools = [] } = useQuery({
    queryKey: ['/api/escolas'],
    enabled: !!user
  });

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/notifications', data);
    },
    onSuccess: () => {
      toast({
        title: "Notificação enviada",
        description: "A notificação foi enviada com sucesso."
      });
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar notificação",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/notifications'] });
    }
  });

  // Archive notification mutation
  const archiveNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/archive`);
    },
    onSuccess: () => {
      toast({
        title: "Notificação arquivada",
        description: "A notificação foi arquivada com sucesso."
      });
      refetch();
    }
  });

  // Respond to notification mutation
  const respondNotificationMutation = useMutation({
    mutationFn: async ({ notificationId, response }: { notificationId: number; response: string }) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/respond`, { response });
    },
    onSuccess: () => {
      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi enviada com sucesso."
      });
      refetch();
    }
  });

  // Filter notifications
  const filteredNotifications = (notifications as NotificationData[]).filter((notification: NotificationData) => {
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

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
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'read': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const [newNotification, setNewNotification] = useState({
    recipientType: '',
    recipientId: '',
    title: '',
    message: '',
    type: 'administrative' as const,
    priority: 'medium' as const,
    requiresResponse: false
  });

  const handleCreateNotification = () => {
    if (!newNotification.recipientType || !newNotification.title || !newNotification.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    createNotificationMutation.mutate({
      ...newNotification,
      recipientId: newNotification.recipientId ? parseInt(newNotification.recipientId) : null
    });
  };

  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/40">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/panel.sme">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-slate-100/60 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Central de Notificações SME
                </h1>
                <p className="text-slate-600">Comunicação com administradores gerais e escolas</p>
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

      <main className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-300 focus:border-green-500 text-slate-900 font-medium placeholder:text-slate-800 placeholder:font-medium"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 border-green-300 focus:border-green-500 text-slate-900 font-medium">
                <SelectValue placeholder="Status" className="placeholder:text-slate-800 placeholder:font-medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="archived">Arquivadas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40 border-green-300 focus:border-green-500 text-slate-900 font-medium">
                <SelectValue placeholder="Prioridade" className="placeholder:text-slate-800 placeholder:font-medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-4 w-4" />
                  Nova Notificação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Nova Notificação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipientType">Destinatário *</Label>
                      <Select 
                        value={newNotification.recipientType} 
                        onValueChange={(value) => setNewNotification({...newNotification, recipientType: value, recipientId: ''})}
                      >
                        <SelectTrigger className="text-slate-900 font-medium">
                          <SelectValue placeholder="Selecione o tipo" className="placeholder:text-slate-800 placeholder:font-medium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin_general">Administradores Gerais</SelectItem>
                          <SelectItem value="school">Escola Específica</SelectItem>
                          <SelectItem value="all_schools">Todas as Escolas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newNotification.recipientType === 'school' && (
                      <div>
                        <Label htmlFor="recipientId">Escola *</Label>
                        <Select 
                          value={newNotification.recipientId} 
                          onValueChange={(value) => setNewNotification({...newNotification, recipientId: value})}
                        >
                          <SelectTrigger className="text-slate-900 font-medium">
                            <SelectValue placeholder="Selecione a escola" className="placeholder:text-slate-800 placeholder:font-medium" />
                          </SelectTrigger>
                          <SelectContent>
                            {(schools as School[]).map((school: School) => (
                              <SelectItem key={school.id} value={school.id.toString()}>
                                {school.nomeEscola}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select 
                        value={newNotification.priority} 
                        onValueChange={(value: any) => setNewNotification({...newNotification, priority: value})}
                      >
                        <SelectTrigger className="text-slate-900 font-medium">
                          <SelectValue className="placeholder:text-slate-800 placeholder:font-medium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select 
                        value={newNotification.type} 
                        onValueChange={(value: any) => setNewNotification({...newNotification, type: value})}
                      >
                        <SelectTrigger className="text-slate-900 font-medium">
                          <SelectValue className="placeholder:text-slate-800 placeholder:font-medium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrative">Administrativo</SelectItem>
                          <SelectItem value="communication">Comunicado</SelectItem>
                          <SelectItem value="system">Sistema</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                      placeholder="Digite o título da notificação"
                      className="text-slate-900 font-medium placeholder:text-slate-800 placeholder:font-medium"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem *</Label>
                    <Textarea
                      id="message"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                      placeholder="Digite a mensagem da notificação"
                      rows={4}
                      className="text-slate-900 font-medium placeholder:text-slate-800 placeholder:font-medium"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresResponse"
                      checked={newNotification.requiresResponse}
                      onChange={(e) => setNewNotification({...newNotification, requiresResponse: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="requiresResponse">Exige resposta</Label>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateNotification}
                      disabled={createNotificationMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {createNotificationMutation.isPending ? 'Enviando...' : 'Enviar Notificação'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Carregando notificações...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="border-2 border-green-300 shadow-lg">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma notificação encontrada</h3>
                <p className="text-slate-600">Não há notificações que correspondam aos filtros selecionados.</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification: NotificationData) => (
              <Card key={notification.id} className="border-2 border-green-300 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                          {notification.priority === 'urgent' && 'Urgente'}
                          {notification.priority === 'high' && 'Alta'}
                          {notification.priority === 'medium' && 'Média'}
                          {notification.priority === 'low' && 'Baixa'}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(notification.status)}>
                          {notification.status === 'pending' && 'Pendente'}
                          {notification.status === 'read' && 'Lida'}
                          {notification.status === 'archived' && 'Arquivada'}
                        </Badge>
                        <span className="text-sm text-slate-500">#{notification.sequentialNumber}</span>
                      </div>
                      <CardTitle className="text-lg text-slate-900">{notification.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-slate-600">
                        <User className="h-4 w-4" />
                        De: {notification.senderName}
                        <Calendar className="h-4 w-4 ml-2" />
                        {formatDate(notification.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {notification.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Marcar como lida
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => archiveNotificationMutation.mutate(notification.id)}
                        className="gap-1"
                      >
                        <Archive className="h-4 w-4" />
                        Arquivar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 mb-4">{notification.message}</p>
                  
                  {notification.responseText && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-green-800 mb-2">Resposta:</h4>
                      <p className="text-green-700">{notification.responseText}</p>
                      {notification.respondedAt && (
                        <p className="text-sm text-green-600 mt-2">
                          Respondido em: {formatDate(notification.respondedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {notification.requiresResponse && !notification.responseText && (
                    <div className="border-t pt-4">
                      {respondingTo === notification.id ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Digite sua resposta..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            rows={3}
                            className="text-slate-900 font-medium placeholder:text-slate-800 placeholder:font-medium"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (responseText.trim()) {
                                  respondNotificationMutation.mutate({
                                    notificationId: notification.id,
                                    response: responseText
                                  });
                                  setResponseText('');
                                  setRespondingTo(null);
                                }
                              }}
                              disabled={!responseText.trim() || respondNotificationMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Enviar Resposta
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRespondingTo(notification.id)}
                          className="gap-1"
                        >
                          <Reply className="h-4 w-4" />
                          Responder
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Send, 
  Bell,
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Filter,
  Search,
  Plus,
  Eye,
  Reply,
  Archive,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

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

export default function TeacherNotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('received');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newNotification, setNewNotification] = useState({
    recipientType: '',
    recipientId: '',
    title: '',
    message: '',
    type: 'communication' as const,
    priority: 'medium' as const,
    requiresResponse: false
  });

  // Fetch notifications para professores
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      console.log('Sending notification:', notificationData);
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Notification send error:', errorData);
        throw new Error(`Failed to send notification: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Notification sent successfully:', data);
      toast({
        title: "Notificação enviada",
        description: "A notificação foi enviada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setNewNotification({
        recipientType: '',
        recipientId: '',
        title: '',
        message: '',
        type: 'communication',
        priority: 'medium',
        requiresResponse: false
      });
    },
    onError: (error) => {
      console.error('Notification send error:', error);
      toast({
        title: "Erro",
        description: `Não foi possível enviar a notificação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update notification status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/notifications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Status atualizado",
        description: "O status da notificação foi atualizado.",
      });
    },
  });

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async ({ id, responseText }: { id: number; responseText: string }) => {
      const response = await fetch(`/api/notifications/${id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText }),
      });
      if (!response.ok) throw new Error('Failed to submit response');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setSelectedNotification(null);
      setResponseText('');
      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi enviada com sucesso.",
      });
    },
  });

  const handleSendNotification = () => {
    sendNotificationMutation.mutate(newNotification);
  };

  const handleMarkAsRead = (notificationId: number) => {
    updateStatusMutation.mutate({ id: notificationId, status: 'read' });
  };

  const handleArchive = (notificationId: number) => {
    updateStatusMutation.mutate({ id: notificationId, status: 'archived' });
  };

  const handleSubmitResponse = () => {
    if (selectedNotification && responseText.trim()) {
      submitResponseMutation.mutate({ 
        id: selectedNotification.id, 
        responseText: responseText.trim() 
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'read': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'behavior': return <AlertTriangle className="h-4 w-4" />;
      case 'academic': return <Users className="h-4 w-4" />;
      case 'administrative': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getRecipientOptions = () => {
    return [
      { value: 'admin', label: 'Secretaria' },
      { value: 'student', label: 'Alunos' },
    ];
  };

  const filteredNotifications = notifications?.filter((notification: NotificationData) => {
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-600" />
            <span className="ml-2 text-slate-600">Carregando notificações...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/professor">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Central de Notificações</h1>
                <p className="text-slate-600">Gerencie suas notificações e comunicações</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recebidas ({filteredNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Nova
            </TabsTrigger>
          </TabsList>

          {/* Received Notifications Tab */}
          <TabsContent value="received" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros e Pesquisa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Pesquisar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Título, remetente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="read">Lida</SelectItem>
                        <SelectItem value="archived">Arquivada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={() => {
                        setFilterPriority('all');
                        setFilterStatus('all');
                        setSearchTerm('');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
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
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="gap-2"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Marcar como Lida
                                  </Button>
                                )}
                                
                                {notification.requiresResponse && !notification.responseText && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedNotification(notification)}
                                    className="gap-2"
                                  >
                                    <Reply className="h-4 w-4" />
                                    Responder
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleArchive(notification.id)}
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

          {/* Send Notification Tab */}
          <TabsContent value="send" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nova Notificação
                </CardTitle>
                <CardDescription>
                  Envie uma notificação para outros usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Destinatário</Label>
                    <Select 
                      value={newNotification.recipientType} 
                      onValueChange={(value) => setNewNotification({...newNotification, recipientType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o destinatário" />
                      </SelectTrigger>
                      <SelectContent>
                        {getRecipientOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Prioridade</Label>
                    <Select 
                      value={newNotification.priority} 
                      onValueChange={(value) => setNewNotification({...newNotification, priority: value as any})}
                    >
                      <SelectTrigger>
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

                <div>
                  <Label>Título</Label>
                  <Input
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    placeholder="Digite o título da notificação"
                  />
                </div>

                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    placeholder="Digite a mensagem da notificação"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    onClick={handleSendNotification}
                    disabled={!newNotification.recipientType || !newNotification.title || !newNotification.message || sendNotificationMutation.isPending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendNotificationMutation.isPending ? "Enviando..." : "Enviar Notificação"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Response Dialog */}
      {selectedNotification && (
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Responder Notificação</DialogTitle>
              <DialogDescription>
                Responda à notificação: {selectedNotification.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Sua Resposta</Label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Digite sua resposta..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedNotification(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim() || submitResponseMutation.isPending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitResponseMutation.isPending ? "Enviando..." : "Enviar Resposta"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
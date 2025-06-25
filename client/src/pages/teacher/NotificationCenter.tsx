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
  RefreshCw,
  Edit,
  User,
  GraduationCap,
  School
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
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  
  const [newNotification, setNewNotification] = useState({
    recipientType: 'secretary',
    selectedRecipients: [] as number[],
    title: '',
    message: '',
    type: 'communication' as const,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    requiresResponse: false
  });

  // Fetch notifications
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
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to send notification: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Notificação enviada",
        description: "A notificação foi enviada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setNewNotification({
        recipientType: 'secretary',
        selectedRecipients: [],
        title: '',
        message: '',
        type: 'communication',
        priority: 'medium',
        requiresResponse: false
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
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
        title: "✅ Status atualizado",
        description: "O status da notificação foi atualizado.",
      });
    },
  });

  // Respond to notification mutation
  const respondNotificationMutation = useMutation({
    mutationFn: async ({ id, responseText }: { id: number; responseText: string }) => {
      const response = await fetch(`/api/notifications/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText }),
      });
      if (!response.ok) throw new Error('Failed to submit response');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "✅ Resposta enviada",
        description: "Sua resposta foi enviada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Erro",
        description: `Não foi possível enviar a resposta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSendNotification = () => {
    if (!newNotification.recipientType || !newNotification.title || !newNotification.message) {
      toast({
        title: "❌ Campos obrigatórios",
        description: "Preencha o destinatário, título e mensagem.",
        variant: "destructive",
      });
      return;
    }
    sendNotificationMutation.mutate(newNotification);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400';
      case 'high': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400';
      case 'medium': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400';
      case 'low': return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-400';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-400';
      case 'read': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400';
      case 'archived': return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-400';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-400';
    }
  };

  const filteredNotifications = notifications?.filter((notification: NotificationData) => {
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por tipo de tab
    let matchesTab = true;
    if (selectedTab === 'received') {
      matchesTab = notification.senderId !== user?.id;
    } else if (selectedTab === 'sent') {
      matchesTab = notification.senderId === user?.id;
    }
    
    return matchesPriority && matchesStatus && matchesSearch && matchesTab;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin border-t-blue-600"></div>
            <Bell className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Carregando Notificações</h3>
            <p className="text-sm text-slate-600">Aguarde um momento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/professor">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 bg-white/80 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Central de Notificações
                </h1>
                <p className="text-slate-600 mt-1 font-medium">Gerencie suas comunicações institucionais</p>
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
              {filteredNotifications.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardContent className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto">
                        <Bell className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Nenhuma notificação recebida</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Ainda não há notificações recebidas. Novas comunicações aparecerão aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification: NotificationData) => (
                  <Card key={notification.id} className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/95">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center shadow-md">
                              <MessageSquare className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2 leading-tight">
                                  {notification.title}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{notification.senderName}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{notification.sequentialNumber}</span>
                                  </div>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200/60">
                                  <p className="text-slate-700 leading-relaxed text-sm">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3 min-w-max ml-4">
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
                                  {notification.requiresResponse && (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400">
                                      Requer Resposta
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-slate-500 font-medium">
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

                              {notification.requiresResponse && !notification.responseText && notification.senderId !== user?.id && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                      onClick={() => {
                                        setRespondingTo(notification.id);
                                        setResponseText('');
                                      }}
                                    >
                                      <Reply className="h-4 w-4" />
                                      Responder
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Responder Notificação</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium text-slate-700">Título Original:</Label>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border">{notification.title}</p>
                                      </div>
                                      <div>
                                        <Label htmlFor="responseText" className="text-sm font-medium text-slate-700">Sua Resposta:</Label>
                                        <Textarea
                                          id="responseText"
                                          value={respondingTo === notification.id ? responseText : ''}
                                          onChange={(e) => setResponseText(e.target.value)}
                                          placeholder="Digite sua resposta..."
                                          className="mt-1"
                                          rows={4}
                                        />
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => {
                                            setRespondingTo(null);
                                            setResponseText('');
                                          }}
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          type="button"
                                          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                                          disabled={!responseText.trim() || respondNotificationMutation.isPending}
                                          onClick={() => {
                                            if (responseText.trim()) {
                                              respondNotificationMutation.mutate({
                                                id: notification.id,
                                                responseText: responseText.trim()
                                              });
                                              setRespondingTo(null);
                                              setResponseText('');
                                            }
                                          }}
                                        >
                                          {respondNotificationMutation.isPending ? 'Enviando...' : 'Enviar Resposta'}
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {notification.responseText && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                  <div className="flex items-start gap-2">
                                    <Reply className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-800">Resposta enviada:</p>
                                      <p className="text-sm text-blue-700">{notification.responseText}</p>
                                      {notification.respondedAt && (
                                        <p className="text-xs text-blue-600 mt-1">
                                          Respondido em: {new Date(notification.respondedAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
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
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Sent Notifications Tab */}
          <TabsContent value="sent" className="space-y-6">
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardContent className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto">
                        <Send className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Nenhuma notificação enviada</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Ainda não há notificações enviadas. Use a aba "Nova" para enviar uma comunicação.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification: NotificationData) => (
                  <Card key={notification.id} className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/95">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center shadow-md">
                            <Send className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-slate-900 mb-2 leading-tight">
                                {notification.title}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">Para: {notification.recipientType}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{notification.sequentialNumber}</span>
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200/60">
                                <p className="text-slate-700 leading-relaxed text-sm">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 min-w-max ml-4">
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
                              <div className="text-right">
                                <span className="text-xs text-slate-500 font-medium">
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
              {filteredNotifications.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardContent className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Nenhuma notificação</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Ainda não há notificações. Novas comunicações aparecerão aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification: NotificationData) => (
                  <Card key={notification.id} className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/95">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center shadow-md">
                            <MessageSquare className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-slate-900 mb-2 leading-tight">
                                {notification.title}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">
                                    {notification.senderId === user?.id ? 'Para: ' : 'De: '}{notification.senderName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{notification.sequentialNumber}</span>
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200/60">
                                <p className="text-slate-700 leading-relaxed text-sm">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 min-w-max ml-4">
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
                              <div className="text-right">
                                <span className="text-xs text-slate-500 font-medium">
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
          <TabsContent value="send" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  Nova Notificação
                </CardTitle>
                <CardDescription className="text-slate-200 mt-2">
                  Envie uma nova comunicação para a secretaria ou estudantes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Destinatário
                    </Label>
                    <Select 
                      value={newNotification.recipientType} 
                      onValueChange={(value) => setNewNotification({ ...newNotification, recipientType: value })}
                    >
                      <SelectTrigger className="h-12 bg-white/80 border-slate-400 hover:border-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                        <SelectValue placeholder="Selecione o destinatário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="secretary">Secretaria</SelectItem>
                        <SelectItem value="all_students">Todos os Estudantes</SelectItem>
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
                      onValueChange={(value: any) => setNewNotification({ ...newNotification, priority: value })}
                    >
                      <SelectTrigger className="h-12 bg-white/80 border-slate-400 hover:border-slate-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 transition-all duration-200">
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

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                    Título
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

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="requiresResponse"
                      checked={newNotification.requiresResponse}
                      onChange={(e) => setNewNotification({ 
                        ...newNotification, 
                        requiresResponse: e.target.checked 
                      })}
                      className="w-4 h-4 text-amber-600 bg-white border-amber-300 rounded focus:ring-amber-500 focus:ring-2"
                    />
                    <Label 
                      htmlFor="requiresResponse" 
                      className="text-sm font-semibold text-amber-800 cursor-pointer flex items-center gap-2"
                    >
                      <Reply className="h-4 w-4 text-amber-600" />
                      Esta notificação requer resposta do destinatário
                    </Label>
                  </div>
                  {newNotification.requiresResponse && (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      💡 O destinatário verá um botão "Responder" e poderá enviar uma resposta que será direcionada para você.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200/60">
                  <Button 
                    variant="outline"
                    onClick={() => setNewNotification({
                      recipientType: 'secretary',
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
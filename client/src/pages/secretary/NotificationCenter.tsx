import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  RefreshCw
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
    title: '',
    message: '',
    type: 'communication' as const,
    priority: 'medium' as const,
    selectedRecipients: [] as string[],
    requiresResponse: false
  });

  // Fetch all notifications
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['/api/secretary/notifications/all'],
    queryFn: async () => {
      const response = await fetch('/api/secretary/notifications/all');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });

  // Fetch users for recipient selection
  const { data: students } = useQuery({
    queryKey: ['/api/secretary/students'],
    queryFn: async () => {
      const response = await fetch('/api/secretary/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['/api/secretary/teachers'],
    queryFn: async () => {
      const response = await fetch('/api/secretary/teachers');
      if (!response.ok) throw new Error('Failed to fetch teachers');
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
    onSuccess: () => {
      toast({
        title: "Notificação enviada",
        description: "A notificação foi enviada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/notifications/all'] });
      setNewNotification({
        recipientType: 'all_teachers',
        title: '',
        message: '',
        type: 'communication',
        priority: 'medium',
        selectedRecipients: [],
        requiresResponse: false
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação.",
        variant: "destructive",
      });
    },
  });

  // Update notification status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/secretary/notifications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/notifications/all'] });
      toast({
        title: "Status atualizado",
        description: "O status da notificação foi atualizado.",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/secretary/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/notifications/all'] });
      toast({
        title: "Notificação excluída",
        description: "A notificação foi excluída com sucesso.",
      });
    },
  });

  const handleSendNotification = () => {
    sendNotificationMutation.mutate(newNotification);
  };

  const handleRecipientChange = (recipients: string[]) => {
    setNewNotification({ ...newNotification, selectedRecipients: recipients });
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
      case 'academic': return <User className="h-4 w-4" />;
      case 'administrative': return <MessageSquare className="h-4 w-4" />;
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
              <Link href="/secretary">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Central de Notificações</h1>
                <p className="text-slate-600">Gerencie todas as notificações da instituição</p>
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recebidas ({filteredNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Nova
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Estatísticas
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
                        placeholder="Título, remetente, aluno..."
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
                                  {notification.studentName && (
                                    <p className="text-sm text-slate-600 mb-2">
                                      Aluno: {notification.studentName}
                                    </p>
                                  )}
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
                              <p className="text-slate-700 mb-4">{notification.message}</p>
                              
                              {/* Contact Info */}
                              {(notification.parentEmail || notification.parentPhone) && (
                                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                                  <p className="text-sm font-medium text-slate-700 mb-2">Contato dos Responsáveis:</p>
                                  <div className="flex gap-4 text-sm text-slate-600">
                                    {notification.parentEmail && (
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        {notification.parentEmail}
                                      </div>
                                    )}
                                    {notification.parentPhone && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        {notification.parentPhone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Response Section */}
                              {notification.requiresResponse && (
                                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                  <p className="text-sm font-medium text-blue-800 mb-1">
                                    <Clock className="h-4 w-4 inline mr-1" />
                                    Requer Resposta
                                  </p>
                                  {notification.responseText && (
                                    <div className="mt-2">
                                      <p className="text-sm text-blue-700 font-medium">Resposta:</p>
                                      <p className="text-sm text-blue-600">{notification.responseText}</p>
                                      <p className="text-xs text-blue-500 mt-1">
                                        Respondido em: {new Date(notification.respondedAt!).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2">
                                {notification.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate({ id: notification.id, status: 'read' })}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Marcar como Lida
                                  </Button>
                                )}
                                {notification.status !== 'archived' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatusMutation.mutate({ id: notification.id, status: 'archived' })}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Archive className="h-4 w-4 mr-1" />
                                    Arquivar
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Excluir
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir Notificação</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Enviar Nova Notificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="recipient-type">Destinatário</Label>
                    <Select
                      value={newNotification.recipientType}
                      onValueChange={(value) => setNewNotification({ 
                        ...newNotification, 
                        recipientType: value,
                        selectedRecipients: [] // Reset selected recipients when type changes
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_teachers">Todos os Professores</SelectItem>
                        <SelectItem value="all_students">Todos os Alunos</SelectItem>
                        <SelectItem value="all_teachers_students">Todos os Alunos e Professores</SelectItem>
                        <SelectItem value="selected_students">Alunos Selecionados</SelectItem>
                        <SelectItem value="selected_teachers">Professores Selecionados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={newNotification.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                        setNewNotification({ ...newNotification, priority: value })}
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

                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value: 'behavior' | 'academic' | 'administrative' | 'communication') => 
                        setNewNotification({ ...newNotification, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="communication">Comunicação</SelectItem>
                        <SelectItem value="academic">Acadêmico</SelectItem>
                        <SelectItem value="behavior">Comportamento</SelectItem>
                        <SelectItem value="administrative">Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(newNotification.recipientType === 'selected_students' || newNotification.recipientType === 'selected_teachers') && (
                    <div className="md:col-span-2">
                      <Label>
                        {newNotification.recipientType === 'selected_students' ? 'Selecionar Alunos' : 'Selecionar Professores'}
                      </Label>
                      <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                        {newNotification.recipientType === 'selected_students' ? (
                          students?.map((student: any) => (
                            <div key={student.id} className="flex items-center space-x-2 mb-2">
                              <input
                                type="checkbox"
                                id={`student-${student.id}`}
                                checked={newNotification.selectedRecipients.includes(student.id.toString())}
                                onChange={(e) => {
                                  const recipients = [...newNotification.selectedRecipients];
                                  if (e.target.checked) {
                                    recipients.push(student.id.toString());
                                  } else {
                                    const index = recipients.indexOf(student.id.toString());
                                    if (index > -1) recipients.splice(index, 1);
                                  }
                                  handleRecipientChange(recipients);
                                }}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`student-${student.id}`} className="text-sm">
                                {student.firstName} {student.lastName}
                                {student.isMinor && student.parentEmail && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    (Responsáveis: {student.parentEmail})
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))
                        ) : (
                          teachers?.map((teacher: any) => (
                            <div key={teacher.id} className="flex items-center space-x-2 mb-2">
                              <input
                                type="checkbox"
                                id={`teacher-${teacher.id}`}
                                checked={newNotification.selectedRecipients.includes(teacher.id.toString())}
                                onChange={(e) => {
                                  const recipients = [...newNotification.selectedRecipients];
                                  if (e.target.checked) {
                                    recipients.push(teacher.id.toString());
                                  } else {
                                    const index = recipients.indexOf(teacher.id.toString());
                                    if (index > -1) recipients.splice(index, 1);
                                  }
                                  handleRecipientChange(recipients);
                                }}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`teacher-${teacher.id}`} className="text-sm">
                                {teacher.firstName} {teacher.lastName}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {newNotification.selectedRecipients.length} selecionado(s)
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Título da notificação"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    placeholder="Digite a mensagem da notificação..."
                    rows={4}
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  />
                </div>

                {/* Information about automatic parent notification */}
                {(newNotification.recipientType === 'all_students' || newNotification.recipientType === 'selected_students') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Notificação automática aos responsáveis</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Os responsáveis de alunos menores de idade serão automaticamente notificados 
                          via email e telefone cadastrados.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires-response"
                    checked={newNotification.requiresResponse}
                    onChange={(e) => setNewNotification({ ...newNotification, requiresResponse: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="requires-response">Esta notificação requer resposta</Label>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setNewNotification({
                      recipientType: 'all_teachers',
                      title: '',
                      message: '',
                      type: 'communication',
                      priority: 'medium',
                      selectedRecipients: [],
                      requiresResponse: false
                    })}
                  >
                    Limpar
                  </Button>
                  <Button
                    onClick={handleSendNotification}
                    disabled={
                      !newNotification.title || 
                      !newNotification.message || 
                      sendNotificationMutation.isPending ||
                      ((newNotification.recipientType === 'selected_students' || newNotification.recipientType === 'selected_teachers') && 
                       newNotification.selectedRecipients.length === 0)
                    }
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendNotificationMutation.isPending ? 'Enviando...' : 'Enviar Notificação'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Notificações</p>
                      <p className="text-3xl font-bold text-gray-900">{notifications?.length || 0}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendentes</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {notifications?.filter((n: NotificationData) => n.status === 'pending').length || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Lidas</p>
                      <p className="text-3xl font-bold text-green-600">
                        {notifications?.filter((n: NotificationData) => n.status === 'read').length || 0}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Urgentes</p>
                      <p className="text-3xl font-bold text-red-600">
                        {notifications?.filter((n: NotificationData) => n.priority === 'urgent').length || 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Bell, 
  Search, 
  Filter,
  Send,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Eye,
  EyeOff,
  Reply,
  MoreVertical,
  Trash2,
  Star,
  Archive
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import iaprenderLogo from "@assets/IAprender_1750262377399.png";

interface Notification {
  id: number;
  notificationNumber: string;
  senderName: string;
  senderRole: "secretary" | "teacher";
  recipientName: string;
  recipientRole: string;
  notificationType: string;
  priority: "low" | "medium" | "high";
  subject: string;
  message: string;
  response?: string;
  status: "sent" | "read" | "responded";
  notificationDate: Date;
  responseDate?: Date;
  isRead: boolean;
}

export default function StudentNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNewNotification, setShowNewNotification] = useState(false);
  const [responseText, setResponseText] = useState("");

  // Scroll to top animation on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Form state for new notification
  const [newNotification, setNewNotification] = useState({
    recipientRole: "secretary",
    recipientName: "",
    notificationType: "general",
    priority: "medium" as "low" | "medium" | "high",
    subject: "",
    message: ""
  });

  // Fetch notifications for student
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications/student', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/notifications/student/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return data.map((notif: any) => ({
        ...notif,
        notificationDate: new Date(notif.notificationDate),
        responseDate: notif.responseDate ? new Date(notif.responseDate) : undefined
      }));
    },
    enabled: !!user?.id
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/student'] });
    }
  });

  // Send response to notification
  const respondMutation = useMutation({
    mutationFn: async ({ notificationId, response }: { notificationId: number; response: string }) => {
      const res = await fetch(`/api/notifications/${notificationId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      if (!res.ok) throw new Error('Failed to send response');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/student'] });
      setResponseText("");
      toast({ title: "Resposta enviada com sucesso!" });
    }
  });

  // Send new notification
  const sendNotificationMutation = useMutation({
    mutationFn: async (notification: any) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notification,
          senderRole: "student",
          senderName: `${user?.firstName} ${user?.lastName}`,
          recipientName: notification.recipientRole === "secretary" ? "Secretaria" : notification.recipientName
        })
      });
      if (!response.ok) throw new Error('Failed to send notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/student'] });
      setShowNewNotification(false);
      setNewNotification({
        recipientRole: "secretary",
        recipientName: "",
        notificationType: "general",
        priority: "medium",
        subject: "",
        message: ""
      });
      toast({ title: "Notificação enviada com sucesso!" });
    }
  });

  // Filter notifications
  const filteredNotifications = notifications.filter((notif: Notification) => {
    const matchesSearch = notif.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || notif.notificationType === filterType;
    const matchesPriority = filterPriority === "all" || notif.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || notif.status === filterStatus;
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "read": return <Eye className="h-4 w-4" />;
      case "responded": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const unreadCount = notifications.filter((notif: Notification) => !notif.isRead).length;

  return (
    <>
      <Helmet>
        <title>Central de Notificações | IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/student/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <img 
                    src={iaprenderLogo} 
                    alt="IAprender Logo" 
                    className="h-8 w-8 object-contain"
                  />
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      IAprender
                    </h1>
                    <p className="text-sm text-slate-600">Central de Notificações</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Dialog open={showNewNotification} onOpenChange={setShowNewNotification}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <Send className="h-4 w-4 mr-2" />
                      Nova Notificação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Enviar Nova Notificação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Destinatário</Label>
                          <Select 
                            value={newNotification.recipientRole} 
                            onValueChange={(value) => setNewNotification({...newNotification, recipientRole: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="secretary">Secretaria</SelectItem>
                              <SelectItem value="teacher">Professor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Prioridade</Label>
                          <Select 
                            value={newNotification.priority} 
                            onValueChange={(value) => setNewNotification({...newNotification, priority: value as "low" | "medium" | "high"})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Assunto</Label>
                        <Input
                          value={newNotification.subject}
                          onChange={(e) => setNewNotification({...newNotification, subject: e.target.value})}
                          placeholder="Digite o assunto da notificação"
                        />
                      </div>
                      
                      <div>
                        <Label>Mensagem</Label>
                        <Textarea
                          value={newNotification.message}
                          onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                          placeholder="Digite sua mensagem..."
                          rows={4}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => sendNotificationMutation.mutate(newNotification)}
                        disabled={!newNotification.subject || !newNotification.message || sendNotificationMutation.isPending}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {sendNotificationMutation.isPending ? "Enviando..." : "Enviar Notificação"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Bell className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-600">Total</p>
                    <p className="text-lg font-bold text-orange-800">{notifications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <EyeOff className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Não Lidas</p>
                    <p className="text-lg font-bold text-blue-800">{unreadCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Respondidas</p>
                    <p className="text-lg font-bold text-green-800">
                      {notifications.filter((n: Notification) => n.status === "responded").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600">Prioridade Alta</p>
                    <p className="text-lg font-bold text-purple-800">
                      {notifications.filter((n: Notification) => n.priority === "high").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar notificações..."
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
                      <SelectItem value="sent">Não Lida</SelectItem>
                      <SelectItem value="read">Lida</SelectItem>
                      <SelectItem value="responded">Respondida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="academic">Acadêmica</SelectItem>
                      <SelectItem value="behavioral">Comportamental</SelectItem>
                      <SelectItem value="attendance">Presença</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notificações ({filteredNotifications.length})</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-slate-600 mt-2">Carregando notificações...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Nenhuma notificação encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification: Notification) => (
                    <Card 
                      key={notification.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        !notification.isRead ? 'border-orange-200 bg-orange-50/50' : 'border-slate-200'
                      }`}
                      onClick={() => {
                        setSelectedNotification(notification);
                        if (!notification.isRead) {
                          markAsReadMutation.mutate(notification.id);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority === "high" ? "Alta" : 
                                 notification.priority === "medium" ? "Média" : "Baixa"}
                              </Badge>
                              <Badge variant="outline">
                                {notification.notificationNumber}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                de {notification.senderName}
                              </span>
                            </div>
                            <h3 className={`font-semibold mb-1 ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                              {notification.subject}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{notification.notificationDate.toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(notification.status)}
                                <span className="capitalize">{notification.status}</span>
                              </div>
                            </div>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Notification Detail Dialog */}
        {selectedNotification && (
          <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedNotification.subject}</span>
                  <Badge className={getPriorityColor(selectedNotification.priority)}>
                    {selectedNotification.priority === "high" ? "Alta" : 
                     selectedNotification.priority === "medium" ? "Média" : "Baixa"}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>De: {selectedNotification.senderName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{selectedNotification.notificationDate.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">Mensagem:</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>
                
                {selectedNotification.response && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Sua Resposta:</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{selectedNotification.response}</p>
                      {selectedNotification.responseDate && (
                        <p className="text-xs text-slate-500 mt-2">
                          Respondido em: {selectedNotification.responseDate.toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </>
                )}
                
                {selectedNotification.status !== "responded" && (
                  <>
                    <Separator />
                    <div>
                      <Label htmlFor="response">Responder:</Label>
                      <Textarea
                        id="response"
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Digite sua resposta..."
                        rows={3}
                        className="mt-2"
                      />
                      <Button
                        onClick={() => respondMutation.mutate({ 
                          notificationId: selectedNotification.id, 
                          response: responseText 
                        })}
                        disabled={!responseText.trim() || respondMutation.isPending}
                        className="mt-2 bg-orange-600 hover:bg-orange-700"
                      >
                        {respondMutation.isPending ? "Enviando..." : "Enviar Resposta"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
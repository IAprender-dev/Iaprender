import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, History } from "lucide-react";

function NotificationHistory() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/teacher/notifications/history'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/notifications/history');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando histórico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Notificações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications && notifications.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification: any) => (
              <div key={notification.id} className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{notification.sequentialNumber}</span>
                    <Badge className={getPriorityColor(notification.priority)}>
                      {notification.priority}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h4 className="font-medium mb-1">{notification.subject}</h4>
                <p className="text-sm text-gray-600 mb-2">Aluno: {notification.studentName}</p>
                <p className="text-sm text-gray-700">{notification.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nenhuma notificação enviada ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function NotificationSender() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notificationType, setNotificationType] = useState("performance");
  const [studentName, setStudentName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [notificationDate, setNotificationDate] = useState("");
  const [notificationTime, setNotificationTime] = useState("");
  const [isSending, setIsSending] = useState(false);

  const notificationTypes = {
    performance: "Relatório de Desempenho",
    behavior: "Questão Comportamental", 
    attendance: "Frequência e Presença",
    academic: "Questão Acadêmica",
    health: "Questão de Saúde",
    general: "Comunicação Geral"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim() || !subject.trim() || !message.trim() || !notificationDate || !notificationTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios incluindo data e hora.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const notificationDateTime = new Date(`${notificationDate}T${notificationTime}`);
      
      const response = await fetch('/api/teacher/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationType,
          studentName: studentName.trim(),
          subject: subject.trim(),
          message: message.trim(),
          priority,
          notificationDate: notificationDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar notificação');
      }

      const result = await response.json();
      
      toast({
        title: "Notificação enviada!",
        description: `Notificação ${result.sequentialNumber} enviada para a secretaria com sucesso.`,
      });
      
      // Reset form
      setStudentName("");
      setSubject("");
      setMessage("");
      setPriority("normal");
      setNotificationDate("");
      setNotificationTime("");
      setNotificationType("performance");
      
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a notificação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="notificationType">Tipo de Notificação</Label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(notificationTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="studentName">Nome do Aluno *</Label>
          <Input
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Nome completo do aluno"
            required
          />
        </div>

        <div>
          <Label htmlFor="subject">Assunto *</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Assunto da notificação"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="notificationDate">Data da Ocorrência *</Label>
            <Input
              id="notificationDate"
              type="date"
              value={notificationDate}
              onChange={(e) => setNotificationDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="notificationTime">Hora da Ocorrência *</Label>
            <Input
              id="notificationTime"
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="message">Mensagem/Relato *</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreva detalhadamente a situação, comportamento ou informação relevante..."
            className="min-h-[120px]"
            required
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Informações do Remetente</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Professor(a):</span> {user?.firstName} {user?.lastName}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user?.email}
            </div>
            <div>
              <span className="font-medium">Data/Hora Atual:</span> {new Date().toLocaleString('pt-BR')}
            </div>
            {notificationDate && notificationTime && (
              <div>
                <span className="font-medium">Data/Hora da Ocorrência:</span> {new Date(`${notificationDate}T${notificationTime}`).toLocaleString('pt-BR')}
              </div>
            )}
            <div>
              <span className="font-medium">Tipo:</span> {notificationTypes[notificationType as keyof typeof notificationTypes]}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSending} className="bg-blue-600 hover:bg-blue-700">
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Notificação
              </>
            )}
          </Button>
        </div>
      </form>
      
      <NotificationHistory />
    </div>
  );
}
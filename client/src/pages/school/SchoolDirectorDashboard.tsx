import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  School, 
  Users, 
  UserCheck, 
  UserX, 
  Mail, 
  BookOpen, 
  BarChart3, 
  ShieldCheck, 
  Settings,
  Plus,
  Eye,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  GraduationCap,
  Building,
  Monitor,
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  Send,
  Download
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "wouter";

interface SchoolStats {
  totalLicenses: number;
  usedLicenses: number;
  totalClasses: number;
  totalTeachers: number;
  totalStudents: number;
  pendingApprovals: number;
  activeInvitations: number;
  monthlyTokenUsage: number;
  tokenLimit: number;
}

interface SchoolClass {
  id: number;
  className: string;
  grade: string;
  section: string;
  academicYear: string;
  maxStudents: number;
  currentStudents: number;
  allocatedLicenses: number;
  usedLicenses: number;
  coordinatorName?: string;
  isActive: boolean;
}

interface PendingApproval {
  id: number;
  userName: string;
  userEmail: string;
  requestedRole: string;
  className?: string;
  requestedAt: string;
  parentalConsent: boolean;
  parentName?: string;
  parentEmail?: string;
  documentsSubmitted: any;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  className?: string;
  status: string;
  sentAt: string;
  expiresAt: string;
}

interface SchoolReport {
  id: number;
  reportType: string;
  title: string;
  description: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
}

export default function SchoolDirectorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data para demonstração
  const schoolStats: SchoolStats = {
    totalLicenses: 150,
    usedLicenses: 98,
    totalClasses: 12,
    totalTeachers: 18,
    totalStudents: 342,
    pendingApprovals: 3,
    activeInvitations: 2,
    monthlyTokenUsage: 15750,
    tokenLimit: 25000,
  };

  const schoolClasses: SchoolClass[] = [
    {
      id: 1,
      className: "1º Ano A",
      grade: "1",
      section: "A",
      academicYear: "2025",
      maxStudents: 30,
      currentStudents: 28,
      allocatedLicenses: 15,
      usedLicenses: 12,
      coordinatorName: "Prof. Maria Silva",
      isActive: true,
    },
    {
      id: 2,
      className: "2º Ano B",
      grade: "2",
      section: "B",
      academicYear: "2025",
      maxStudents: 30,
      currentStudents: 25,
      allocatedLicenses: 12,
      usedLicenses: 10,
      coordinatorName: "Prof. João Santos",
      isActive: true,
    },
    {
      id: 3,
      className: "3º Ano C",
      grade: "3",
      section: "C",
      academicYear: "2025",
      maxStudents: 28,
      currentStudents: 26,
      allocatedLicenses: 14,
      usedLicenses: 11,
      coordinatorName: "Prof. Ana Costa",
      isActive: true,
    },
  ];

  const pendingApprovals: PendingApproval[] = [
    {
      id: 1,
      userName: "Pedro Oliveira",
      userEmail: "pedro.oliveira@gmail.com",
      requestedRole: "teacher",
      className: "4º Ano A",
      requestedAt: "2025-06-29T10:30:00Z",
      parentalConsent: false,
      documentsSubmitted: { diploma: true, background_check: true },
    },
    {
      id: 2,
      userName: "Carla Mendes",
      userEmail: "carla.mendes@yahoo.com",
      requestedRole: "coordinator",
      requestedAt: "2025-06-28T14:20:00Z",
      parentalConsent: false,
      documentsSubmitted: { diploma: true, background_check: false },
    },
    {
      id: 3,
      userName: "Lucas Silva",
      userEmail: "lucas.silva@hotmail.com",
      requestedRole: "student",
      className: "2º Ano B",
      requestedAt: "2025-06-27T16:45:00Z",
      parentalConsent: true,
      parentName: "Maria Silva",
      parentEmail: "maria.silva@gmail.com",
      documentsSubmitted: { birth_certificate: true, medical_records: true },
    },
  ];

  const invitations: Invitation[] = [
    {
      id: 1,
      email: "prof.matematica@escola.com",
      role: "teacher",
      className: "5º Ano A",
      status: "pending",
      sentAt: "2025-06-30T09:00:00Z",
      expiresAt: "2025-07-07T09:00:00Z",
    },
    {
      id: 2,
      email: "coord.pedagogico@escola.com",
      role: "coordinator",
      status: "accepted",
      sentAt: "2025-06-28T11:30:00Z",
      expiresAt: "2025-07-05T11:30:00Z",
    },
  ];

  const reports: SchoolReport[] = [
    {
      id: 1,
      reportType: "usage",
      title: "Relatório de Uso de IA - Dezembro 2025",
      description: "Análise do uso de ferramentas de IA por turma e professor",
      createdAt: "2025-06-30T08:00:00Z",
      periodStart: "2025-06-01T00:00:00Z",
      periodEnd: "2025-06-30T23:59:59Z",
    },
    {
      id: 2,
      reportType: "pedagogical",
      title: "Relatório Pedagógico - 2º Trimestre",
      description: "Análise de desempenho e engajamento dos alunos",
      createdAt: "2025-06-29T16:30:00Z",
      periodStart: "2025-04-01T00:00:00Z",
      periodEnd: "2025-06-30T23:59:59Z",
    },
    {
      id: 3,
      reportType: "compliance",
      title: "Relatório de Conformidade LGPD",
      description: "Verificação de compliance com regulamentações",
      createdAt: "2025-06-25T14:15:00Z",
      periodStart: "2025-06-01T00:00:00Z",
      periodEnd: "2025-06-30T23:59:59Z",
    },
  ];

  const licenseUsagePercentage = (schoolStats.usedLicenses / schoolStats.totalLicenses) * 100;
  const tokenUsagePercentage = (schoolStats.monthlyTokenUsage / schoolStats.tokenLimit) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <School className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Diretor de Escola</h1>
                  <p className="text-sm text-gray-500">Gestão Pedagógica e Administrativa</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Diretor</p>
              </div>
              <Avatar>
                <AvatarImage src={user?.profileImage} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Licenças Escolares</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.usedLicenses}/{schoolStats.totalLicenses}</div>
              <Progress value={licenseUsagePercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {licenseUsagePercentage.toFixed(1)}% utilizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">
                {schoolStats.totalStudents} alunos total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovações Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{schoolStats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando revisão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uso de Tokens IA</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(schoolStats.monthlyTokenUsage / 1000).toFixed(1)}K</div>
              <Progress value={tokenUsagePercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {tokenUsagePercentage.toFixed(1)}% do limite mensal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="classes">Turmas</TabsTrigger>
            <TabsTrigger value="approvals">Aprovações</TabsTrigger>
            <TabsTrigger value="invitations">Convites</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Atividades Recentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Professor aprovado</p>
                        <p className="text-xs text-gray-500">Prof. Maria Silva - 5º Ano A</p>
                      </div>
                      <span className="text-xs text-gray-400">2h atrás</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Convite enviado</p>
                        <p className="text-xs text-gray-500">prof.joao@escola.com - 3º Ano B</p>
                      </div>
                      <span className="text-xs text-gray-400">4h atrás</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Relatório gerado</p>
                        <p className="text-xs text-gray-500">Uso de IA - Dezembro 2025</p>
                      </div>
                      <span className="text-xs text-gray-400">1d atrás</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Ações Rápidas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="h-20 flex-col space-y-2"
                      variant="outline"
                      onClick={() => setActiveTab("invitations")}
                    >
                      <Mail className="h-6 w-6" />
                      <span className="text-sm">Enviar Convite</span>
                    </Button>
                    
                    <Button 
                      className="h-20 flex-col space-y-2"
                      variant="outline"
                      onClick={() => setActiveTab("classes")}
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-sm">Nova Turma</span>
                    </Button>
                    
                    <Button 
                      className="h-20 flex-col space-y-2"
                      variant="outline"
                      onClick={() => setActiveTab("approvals")}
                    >
                      <UserCheck className="h-6 w-6" />
                      <span className="text-sm">Aprovações</span>
                    </Button>
                    
                    <Button 
                      className="h-20 flex-col space-y-2"
                      variant="outline"
                      onClick={() => setActiveTab("reports")}
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-sm">Relatórios</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gestão de Turmas</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schoolClasses.map((schoolClass) => (
                <Card key={schoolClass.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{schoolClass.className}</span>
                      <Badge variant={schoolClass.isActive ? "default" : "secondary"}>
                        {schoolClass.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {schoolClass.grade}º Ano - Turma {schoolClass.section}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Alunos:</span>
                        <span>{schoolClass.currentStudents}/{schoolClass.maxStudents}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Licenças:</span>
                        <span>{schoolClass.usedLicenses}/{schoolClass.allocatedLicenses}</span>
                      </div>
                      <Progress 
                        value={(schoolClass.usedLicenses / schoolClass.allocatedLicenses) * 100} 
                        className="h-2"
                      />
                      {schoolClass.coordinatorName && (
                        <p className="text-xs text-gray-500">
                          Coordenador: {schoolClass.coordinatorName}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <h2 className="text-xl font-semibold">Aprovações Pendentes</h2>
            
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {approval.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{approval.userName}</h3>
                          <p className="text-sm text-gray-500">{approval.userEmail}</p>
                          <p className="text-xs text-gray-400">
                            Solicitação: {approval.requestedRole} 
                            {approval.className && ` - ${approval.className}`}
                          </p>
                          {approval.parentalConsent && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Menor de idade - Responsável: {approval.parentName}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Invitation Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Convite</CardTitle>
                  <CardDescription>
                    Convide professores ou coordenadores para sua escola
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="professor@email.com" />
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Professor</SelectItem>
                        <SelectItem value="coordinator">Coordenador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="class">Turma (Opcional)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Convite
                  </Button>
                </CardContent>
              </Card>

              {/* Sent Invitations */}
              <Card>
                <CardHeader>
                  <CardTitle>Convites Enviados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{invitation.email}</p>
                          <p className="text-xs text-gray-500">
                            {invitation.role} {invitation.className && `- ${invitation.className}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            Enviado em {new Date(invitation.sentAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            invitation.status === 'accepted' ? 'default' :
                            invitation.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {invitation.status === 'accepted' ? 'Aceito' :
                           invitation.status === 'pending' ? 'Pendente' : 'Expirado'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Relatórios Escolares</h2>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tipo:</span>
                        <Badge variant="outline">{report.reportType}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Período:</span>
                        <span>{new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Criado:</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <h2 className="text-xl font-semibold">Configurações da Escola</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Limites de IA</CardTitle>
                  <CardDescription>
                    Configure os limites de uso de IA por faixa etária
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>1º ao 3º Ano (6-8 anos)</Label>
                    <Input type="number" placeholder="10" />
                    <p className="text-xs text-gray-500 mt-1">Conversas por dia</p>
                  </div>
                  
                  <div>
                    <Label>4º ao 6º Ano (9-11 anos)</Label>
                    <Input type="number" placeholder="20" />
                    <p className="text-xs text-gray-500 mt-1">Conversas por dia</p>
                  </div>
                  
                  <div>
                    <Label>7º ao 9º Ano (12-14 anos)</Label>
                    <Input type="number" placeholder="30" />
                    <p className="text-xs text-gray-500 mt-1">Conversas por dia</p>
                  </div>
                  
                  <Button className="w-full">Salvar Configurações</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Segurança e Monitoramento</CardTitle>
                  <CardDescription>
                    Configure alertas e monitoramento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Alertas de uso excessivo</Label>
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Filtro de conteúdo</Label>
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Log de conversas</Label>
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Notificações para pais</Label>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                  
                  <Button className="w-full">Salvar Configurações</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
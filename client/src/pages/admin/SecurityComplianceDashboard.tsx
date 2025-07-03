import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  Users, 
  Database, 
  Lock,
  Eye,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SecurityComplianceDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [filterRisk, setFilterRisk] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch compliance status
  const { data: complianceData, isLoading: complianceLoading } = useQuery({
    queryKey: ["/api/admin/security/compliance-status"],
  });

  // Fetch audit logs
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/admin/security/audit-logs"],
  });

  // Fetch privacy requests
  const { data: privacyData, isLoading: privacyLoading } = useQuery({
    queryKey: ["/api/admin/security/privacy-requests"],
  });

  // Fetch risk assessment
  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ["/api/admin/security/risk-assessment"],
  });

  // Fetch data classification
  const { data: classificationData, isLoading: classificationLoading } = useQuery({
    queryKey: ["/api/admin/security/data-classification"],
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (params: { reportType: string; period: string; includeDetails: boolean }) => {
      return await apiRequest("/api/admin/security/generate-report", "POST", params);
    },
    onSuccess: () => {
      toast({
        title: "Relatório Iniciado",
        description: "O relatório está sendo gerado e será enviado por email quando concluído.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'certified':
      case 'active':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
      case 'in_progress':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  if (complianceLoading || auditLoading || privacyLoading || riskLoading || classificationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium">Carregando Dashboard de Segurança...</span>
        </div>
      </div>
    );
  }

  const compliance = complianceData?.compliance;
  const auditLogs = auditData?.logs || [];
  const privacyRequests = privacyData?.requests || [];
  const riskAssessment = riskData?.assessment;
  const dataClassification = classificationData?.classification;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-600 to-pink-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Segurança & Compliance</h1>
                <p className="text-sm text-gray-500">Governança, LGPD e Auditoria</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => generateReportMutation.mutate({ reportType: 'security_audit', period: '30d', includeDetails: true })}
                disabled={generateReportMutation.isPending}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {generateReportMutation.isPending ? "Gerando..." : "Gerar Relatório"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">LGPD Compliance</p>
                  <p className="text-3xl font-bold text-green-600">{compliance?.lgpd?.score}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: {compliance?.lgpd?.status === 'compliant' ? 'Conforme' : 'Em adequação'}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FileCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Security Score</p>
                  <p className="text-3xl font-bold text-blue-600">{compliance?.security?.score}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Nível: {compliance?.security?.status === 'excellent' ? 'Excelente' : 'Bom'}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Risco Geral</p>
                  <p className="text-3xl font-bold text-orange-600">{riskAssessment?.riskScore}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Nível: {riskAssessment?.overallRisk === 'low' ? 'Baixo' : 'Médio'}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dados Classificados</p>
                  <p className="text-3xl font-bold text-purple-600">{dataClassification?.summary?.classificationRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {dataClassification?.summary?.classified} de {dataClassification?.summary?.totalRecords}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
            <TabsTrigger value="privacy">LGPD</TabsTrigger>
            <TabsTrigger value="risks">Riscos</TabsTrigger>
            <TabsTrigger value="classification">Dados</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LGPD Requirements */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileCheck className="h-5 w-5 text-green-600" />
                    <span>Requisitos LGPD</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {compliance?.lgpd?.requirements?.map((req: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(req.status)}
                        <div>
                          <p className="font-medium text-sm">{req.name}</p>
                          <p className="text-xs text-gray-500">{req.details}</p>
                        </div>
                      </div>
                      <Badge className={req.status === 'compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {req.status === 'compliant' ? 'Conforme' : 'Parcial'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Security Controls */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    <span>Controles de Segurança</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {compliance?.security?.controls?.map((control: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{control.name}</span>
                        <Badge className="bg-green-100 text-green-800">{control.coverage}%</Badge>
                      </div>
                      <Progress value={control.coverage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Certifications */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>Certificações e Conformidade</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {compliance?.certifications?.map((cert: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{cert.name}</h3>
                        {getStatusIcon(cert.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {cert.status === 'certified' ? `Expira em: ${cert.expiryDate}` : `Esperado: ${cert.expectedDate}`}
                      </p>
                      <Badge className={cert.status === 'certified' ? 'bg-green-100 text-green-800 mt-2' : 'bg-yellow-100 text-yellow-800 mt-2'}>
                        {cert.status === 'certified' ? 'Certificado' : 'Em Progresso'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span>Logs de Auditoria</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Buscar logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Select value={filterRisk} onValueChange={setFilterRisk}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="high">Alto Risco</SelectItem>
                        <SelectItem value="medium">Médio Risco</SelectItem>
                        <SelectItem value="low">Baixo Risco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs
                    .filter((log: any) => filterRisk === 'all' || log.riskLevel === filterRisk)
                    .filter((log: any) => searchTerm === '' || 
                      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      log.userId.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((log: any) => (
                      <div key={log.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Badge className={getRiskColor(log.riskLevel)}>
                              {log.riskLevel === 'high' ? 'Alto' : log.riskLevel === 'medium' ? 'Médio' : 'Baixo'} Risco
                            </Badge>
                            <span className="font-medium">{log.action.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          <span className="text-sm text-gray-500">{log.timestamp}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Usuário:</span> {log.userId}
                          </div>
                          <div>
                            <span className="font-medium">IP:</span> {log.ipAddress}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> 
                            <Badge className={log.status === 'success' ? 'bg-green-100 text-green-800 ml-2' : 'bg-red-100 text-red-800 ml-2'}>
                              {log.status === 'success' ? 'Sucesso' : 'Falha'}
                            </Badge>
                          </div>
                        </div>
                        {log.details && (
                          <div className="mt-3 p-2 bg-white rounded text-sm">
                            <strong>Detalhes:</strong> {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span>Solicitações LGPD</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {privacyRequests.map((request: any) => (
                    <div key={request.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">
                            {request.type === 'data_portability' ? 'Portabilidade de Dados' :
                             request.type === 'data_deletion' ? 'Exclusão de Dados' :
                             'Retificação de Dados'}
                          </h3>
                          <p className="text-sm text-gray-600">{request.userEmail}</p>
                        </div>
                        <Badge className={
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {request.status === 'completed' ? 'Concluído' :
                           request.status === 'in_progress' ? 'Em Andamento' :
                           'Pendente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{request.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Solicitado:</span> {request.requestDate}
                        </div>
                        <div>
                          <span className="font-medium">Prazo:</span> {request.dueDate || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Responsável:</span> {request.assignedTo}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Threats */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span>Ameaças Identificadas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskAssessment?.threats?.map((threat: any) => (
                    <div key={threat.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{threat.threat}</h3>
                        <Badge className={getRiskColor(threat.riskLevel)}>
                          {threat.riskLevel === 'high' ? 'Alto' : threat.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Categoria: {threat.category}</p>
                      <p className="text-sm text-gray-700 mb-2">{threat.mitigation}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Status: {threat.status === 'monitoring' ? 'Monitorando' : 'Mitigado'}</span>
                        {threat.lastDetected && <span>Último: {threat.lastDetected}</span>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Vulnerabilities */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span>Vulnerabilidades</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskAssessment?.vulnerabilities?.map((vuln: any) => (
                    <div key={vuln.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{vuln.category}</h3>
                        <Badge className={getRiskColor(vuln.severity)}>
                          {vuln.severity === 'high' ? 'Alta' : vuln.severity === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{vuln.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Status: {vuln.status === 'scheduled' ? 'Agendado' : 'Corrigido'}</span>
                        {vuln.fixDate && <span>Correção: {vuln.fixDate}</span>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Classification Tab */}
          <TabsContent value="classification" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data Categories */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    <span>Classificação por Categoria</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dataClassification?.categories?.map((category: any) => (
                    <div key={category.level} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{category.label}</h3>
                        <Badge className="bg-blue-100 text-blue-800">
                          {category.percentage}%
                        </Badge>
                      </div>
                      <Progress value={category.percentage} className="h-2 mb-3" />
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Registros:</strong> {category.count.toLocaleString()}</p>
                        <p><strong>Retenção:</strong> {category.retentionPeriod}</p>
                        <p><strong>Acesso:</strong> {category.accessControls}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pending Classification */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span>Classificação Pendente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dataClassification?.pendingClassification?.map((item: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{item.table}</h3>
                        <Badge className={getRiskColor(item.priority)}>
                          {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.records.toLocaleString()} registros aguardando classificação
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
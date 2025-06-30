import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  ArrowLeft, Coins, Users, Building2, Plus, Minus, 
  TrendingUp, AlertCircle, CheckCircle, Clock,
  CreditCard, Settings, BarChart3, RefreshCw
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import iAprenderLogo from "@assets/IAprender_1750262377399.png";

export default function TokenManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const tokenData = {
    totalTokens: 500000,
    usedTokens: 127500,
    remainingTokens: 372500,
    monthlyLimit: 500000,
    schools: 45,
    activeTeachers: 1250,
    avgTokensPerTeacher: 102,
    topSchools: [
      { name: "EMEF João Silva", tokens: 15450, percentage: 12.1 },
      { name: "EMEF Maria Santos", tokens: 12300, percentage: 9.6 },
      { name: "EMEF Pedro Costa", tokens: 10800, percentage: 8.5 },
    ]
  };

  const [formData, setFormData] = useState({
    allocationType: "",
    targetSchool: "",
    tokenAmount: "",
    expirationDate: "",
    description: "",
    priority: "normal"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Tokens alocados com sucesso!",
        description: `${formData.tokenAmount} tokens foram distribuídos para ${formData.targetSchool || 'todas as escolas'}.`,
      });
      
      // Reset form
      setFormData({
        allocationType: "",
        targetSchool: "",
        tokenAmount: "",
        expirationDate: "",
        description: "",
        priority: "normal"
      });
    } catch (error) {
      toast({
        title: "Erro na alocação",
        description: "Não foi possível alocar os tokens. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Gerenciamento de Tokens | Panel SME</title>
        <meta name="description" content="Gestão e distribuição de tokens IA para escolas municipais" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xl border-b border-orange-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <Link href="/panel.sme">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-900 hover:bg-orange-50">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <div className="h-8 w-px bg-orange-200 mx-2"></div>
                <div className="relative">
                  <img src={iAprenderLogo} alt="IAprender" className="h-12 w-12 rounded-xl shadow-lg" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">
                    Gerenciamento de Tokens
                  </h1>
                  <p className="text-orange-600 text-sm font-medium">Distribuição e controle de tokens IA</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 text-sm font-semibold">
                  <Coins className="h-4 w-4 mr-2" />
                  {tokenData.remainingTokens.toLocaleString()} disponíveis
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Token Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 border-amber-200 bg-amber-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-amber-500 shadow-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 font-bold">
                    {((tokenData.usedTokens / tokenData.totalTokens) * 100).toFixed(1)}% usado
                  </Badge>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 mb-1">
                    {tokenData.totalTokens.toLocaleString()}
                  </p>
                  <p className="text-slate-600 font-semibold">Total de Tokens</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-green-500 shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 font-bold">
                    Disponível
                  </Badge>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 mb-1">
                    {tokenData.remainingTokens.toLocaleString()}
                  </p>
                  <p className="text-slate-600 font-semibold">Tokens Restantes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-blue-500 shadow-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 font-bold">
                    {tokenData.schools} escolas
                  </Badge>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 mb-1">
                    {Math.round(tokenData.usedTokens / tokenData.schools).toLocaleString()}
                  </p>
                  <p className="text-slate-600 font-semibold">Média por Escola</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-purple-500 shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 font-bold">
                    {tokenData.activeTeachers} ativos
                  </Badge>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 mb-1">
                    {tokenData.avgTokensPerTeacher}
                  </p>
                  <p className="text-slate-600 font-semibold">Média por Professor</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Token Allocation Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <Settings className="h-6 w-6" />
                    Alocar Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 bg-orange-50">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="allocationType" className="text-sm font-semibold text-orange-800">
                          Tipo de Alocação
                        </Label>
                        <Select
                          value={formData.allocationType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, allocationType: value }))}
                        >
                          <SelectTrigger className="border-slate-300 focus:border-orange-500">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="escola-especifica">Escola Específica</SelectItem>
                            <SelectItem value="todas-escolas">Todas as Escolas</SelectItem>
                            <SelectItem value="grupo-escolas">Grupo de Escolas</SelectItem>
                            <SelectItem value="emergencia">Emergência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="targetSchool" className="text-sm font-semibold text-orange-800">
                          Escola de Destino
                        </Label>
                        <Select
                          value={formData.targetSchool}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, targetSchool: value }))}
                          disabled={formData.allocationType === 'todas-escolas'}
                        >
                          <SelectTrigger className="border-slate-300 focus:border-orange-500">
                            <SelectValue placeholder="Selecione a escola" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="emef-joao-silva">EMEF João Silva</SelectItem>
                            <SelectItem value="emef-maria-santos">EMEF Maria Santos</SelectItem>
                            <SelectItem value="emef-pedro-costa">EMEF Pedro Costa</SelectItem>
                            <SelectItem value="emef-ana-oliveira">EMEF Ana Oliveira</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tokenAmount" className="text-sm font-semibold text-orange-800">
                          Quantidade de Tokens
                        </Label>
                        <div className="relative">
                          <Input
                            id="tokenAmount"
                            type="number"
                            placeholder="Ex: 10000"
                            value={formData.tokenAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, tokenAmount: e.target.value }))}
                            className="border-slate-300 focus:border-orange-500 pl-10"
                          />
                          <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expirationDate" className="text-sm font-semibold text-orange-800">
                          Data de Expiração
                        </Label>
                        <div className="relative">
                          <Input
                            id="expirationDate"
                            type="date"
                            value={formData.expirationDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                            className="border-slate-300 focus:border-orange-500 pl-10"
                          />
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority" className="text-sm font-semibold text-orange-800">
                          Prioridade
                        </Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger className="border-slate-300 focus:border-orange-500">
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="critica">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold text-orange-800">
                        Descrição/Justificativa
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Descreva o motivo da alocação de tokens..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="border-slate-300 focus:border-orange-500 min-h-[100px]"
                      />
                    </div>

                    <Separator className="my-6" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Tokens disponíveis: {tokenData.remainingTokens.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({
                            allocationType: "",
                            targetSchool: "",
                            tokenAmount: "",
                            expirationDate: "",
                            description: "",
                            priority: "normal"
                          })}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          Limpar
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading || !formData.allocationType || !formData.tokenAmount}
                          className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Alocar Tokens
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Usage Statistics */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <BarChart3 className="h-5 w-5" />
                    Top Escolas - Uso de Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-orange-50">
                  <div className="space-y-4">
                    {tokenData.topSchools.map((school, index) => (
                      <div key={school.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-amber-100 text-amber-800' : index === 1 ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{school.name}</p>
                            <p className="text-xs text-slate-600">{school.percentage}% do total</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{school.tokens.toLocaleString()}</p>
                          <p className="text-xs text-slate-600">tokens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <TrendingUp className="h-5 w-5" />
                    Estatísticas Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-orange-50">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700 font-medium">Taxa de Utilização</span>
                      <span className="font-bold text-slate-900">
                        {((tokenData.usedTokens / tokenData.totalTokens) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700 font-medium">Tokens por Dia</span>
                      <span className="font-bold text-slate-900">4,250</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700 font-medium">Economia Estimada</span>
                      <span className="font-bold text-green-600">R$ 12,450</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700 font-medium">Próxima Renovação</span>
                      <span className="font-bold text-slate-900">12 dias</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
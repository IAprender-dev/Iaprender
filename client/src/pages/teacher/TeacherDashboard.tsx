import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { 
  Bot, Calendar, PenTool, Pencil, Newspaper, Search, 
  FileText, Calculator, Send, BarChart3, 
  GraduationCap, Zap, ArrowRight, User, Sparkles
} from "lucide-react";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";

export default function TeacherDashboard() {
  const { user } = useAuth();
  
  // Buscar dados de tokens
  const { data: tokenData } = useQuery({
    queryKey: ['/api/tokens/status'],
    queryFn: async () => {
      const response = await fetch('/api/tokens/status');
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    },
  });

  const tokenUsagePercentage = tokenData 
    ? Math.round((tokenData.currentUsage / tokenData.monthlyLimit) * 100)
    : 0;

  const mainTools = [
    {
      title: "Central de Inteligências",
      description: "Acesse ChatGPT, Claude e outras IAs",
      icon: Bot,
      href: "/central-ia",
      gradient: "from-purple-500 to-indigo-600",
      bgGradient: "from-purple-50 to-indigo-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      textColor: "text-purple-700"
    },
    {
      title: "Planejamento de Aulas",
      description: "Crie planos de aula detalhados",
      icon: Calendar,
      href: "/professor/ferramentas/planejamento-aula",
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-50",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700"
    }
  ];

  const tools = [
    {
      title: "Gerador de Atividades",
      description: "Crie exercícios personalizados",
      icon: PenTool,
      href: "/professor/ferramentas/gerador-atividades",
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Redações",
      description: "Analise e corrija redações",
      icon: Pencil,
      href: "/professor/redacoes",
      gradient: "from-rose-500 to-pink-600",
      bgGradient: "from-rose-50 to-pink-50",
      borderColor: "border-rose-200"
    },
    {
      title: "Notícias & Podcasts",
      description: "Conteúdo educacional atualizado",
      icon: Newspaper,
      href: "/professor/noticias-podcasts",
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-200"
    },
    {
      title: "Análise de Documentos",
      description: "Transforme PDFs em conteúdo",
      icon: Search,
      href: "/professor/ferramentas/analisar-documentos",
      gradient: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-50 to-purple-50",
      borderColor: "border-indigo-200"
    },
    {
      title: "Resumos Didáticos",
      description: "Resumos e conteúdos educacionais",
      icon: FileText,
      href: "/professor/ferramentas/materiais-didaticos",
      gradient: "from-teal-500 to-cyan-600",
      bgGradient: "from-teal-50 to-cyan-50",
      borderColor: "border-teal-200"
    },
    {
      title: "Calculadora de Notas",
      description: "Gerencie e calcule notas",
      icon: Calculator,
      href: "/professor/calculadora",
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-50 to-purple-50",
      borderColor: "border-violet-200"
    },
    {
      title: "Notificações",
      description: "Envie alertas para secretaria",
      icon: Send,
      href: "/professor/notificacoes",
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50",
      borderColor: "border-green-200"
    },
    {
      title: "Análise de Desempenho",
      description: "Estatísticas e relatórios",
      icon: BarChart3,
      href: "/professor/analises",
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50",
      borderColor: "border-orange-200"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard do Professor | IAprender</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Barra de Boas-vindas */}
              <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <GraduationCap className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold mb-2">
                          Olá, {user?.firstName}! 👋
                        </h1>
                        <p className="text-white/90 text-lg">
                          Pronto para transformar o ensino com inteligência artificial?
                        </p>
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center space-x-4">
                      <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <Sparkles className="h-8 w-8 text-yellow-300" />
                      </div>
                      <div className="text-right">
                        <div className="text-white/80 text-sm">Sistema</div>
                        <div className="font-semibold">Atualizado</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Barra de Consumo de Tokens */}
              <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Uso de Tokens</h3>
                        <p className="text-sm text-slate-600">
                          {tokenData ? `${tokenData.currentUsage.toLocaleString()} de ${tokenData.monthlyLimit.toLocaleString()} tokens utilizados` : 'Carregando...'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{tokenUsagePercentage}%</div>
                      <div className="text-sm text-slate-500">
                        {tokenData ? `${tokenData.remainingTokens.toLocaleString()} restantes` : '---'}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={tokenUsagePercentage} 
                    className="h-3 bg-slate-100"
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>0</span>
                    <span>{tokenData ? tokenData.monthlyLimit.toLocaleString() : '---'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Botões Principais - 2 Colunas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mainTools.map((tool, index) => (
                  <Link key={index} href={tool.href}>
                    <Card className={`group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 ${tool.borderColor} bg-gradient-to-br ${tool.bgGradient} overflow-hidden`}>
                      <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div className={`p-4 bg-gradient-to-r ${tool.gradient} rounded-2xl shadow-lg group-hover:scale-105 transition-transform`}>
                            <tool.icon className="h-10 w-10 text-white" />
                          </div>
                          <ArrowRight className={`h-6 w-6 ${tool.iconColor} group-hover:translate-x-1 transition-transform`} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-2xl ${tool.textColor} mb-3`}>
                            {tool.title}
                          </h3>
                          <p className="text-slate-600 text-base leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Ferramentas - 2 Linhas com 4 Botões cada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {tools.map((tool, index) => (
                  <Link key={index} href={tool.href}>
                    <Card className={`group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border ${tool.borderColor} bg-gradient-to-br ${tool.bgGradient} h-full`}>
                      <CardContent className="p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 bg-gradient-to-r ${tool.gradient} rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
                            <tool.icon className="h-6 w-6 text-white" />
                          </div>
                          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 mb-2 text-lg">
                            {tool.title}
                          </h4>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Rodapé com informações úteis */}
              <Card className="bg-slate-50 border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Conta: {user?.role === 'teacher' ? 'Professor' : 'Usuário'}</p>
                        <p className="text-sm text-slate-600">Logado como {user?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Última atualização</p>
                      <p className="font-medium text-slate-900">Agora mesmo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
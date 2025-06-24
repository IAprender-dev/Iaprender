import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>Dashboard de Análises | Professor | IAprender</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Page Header */}
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-red-500/5 rounded-3xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-lg shadow-orange-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl blur-lg opacity-20"></div>
                        <div className="relative bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4">
                          <Brain className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 bg-clip-text text-transparent">
                          Dashboard de Análises
                        </h1>
                        <p className="text-slate-600 text-lg mt-2 max-w-2xl">
                          Análises avançadas de desempenho e estatísticas educacionais
                        </p>
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center space-x-4">
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl px-4 py-3 border border-orange-200">
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-orange-700 font-medium text-sm">Em Desenvolvimento</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Content */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-orange-50/30">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-xl">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <Brain className="h-6 w-6" />
                    Análises Inteligentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center py-16">
                    <Brain className="h-24 w-24 text-orange-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                      Dashboard de Análises em Desenvolvimento
                    </h3>
                    <p className="text-slate-600 text-lg mb-6 max-w-2xl mx-auto">
                      Estamos desenvolvendo análises avançadas com inteligência artificial para fornecer insights detalhados sobre o desempenho dos seus alunos, tendências de aprendizagem e recomendações personalizadas.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-2">Análise de Desempenho</h4>
                        <p className="text-sm text-orange-700">Relatórios detalhados sobre o progresso individual e da turma</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-2">Tendências de Aprendizagem</h4>
                        <p className="text-sm text-orange-700">Identificação de padrões e oportunidades de melhoria</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-2">Recomendações IA</h4>
                        <p className="text-sm text-orange-700">Sugestões personalizadas baseadas em dados</p>
                      </div>
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
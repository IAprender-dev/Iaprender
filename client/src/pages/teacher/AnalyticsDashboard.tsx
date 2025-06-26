import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Brain, ArrowLeft } from "lucide-react";
import iAprenderLogo from "@assets/IAprender_1750262377399.png";

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>Dashboard de Análises | Professor | IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo e navegação */}
              <div className="flex items-center space-x-4">
                <Link href="/professor">
                  <Button size="sm" className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <img src={iAprenderLogo} alt="IAprender" className="h-8 w-8" />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">IAprender</h2>
                    <p className="text-sm text-slate-600">Dashboard de Análises</p>
                  </div>
                </div>
              </div>
              
              {/* User info */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-600">Professor</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto p-6">
          {/* Page Header */}
          <div className="relative mb-12">
            <div className="relative bg-white rounded-3xl p-8 border-2 border-pink-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="relative bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-pink-800">
                      Dashboard de Análises
                    </h1>
                    <p className="text-slate-700 text-lg mt-2 max-w-2xl">
                      Análises avançadas de desempenho e estatísticas educacionais
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-pink-50 rounded-xl px-4 py-3 border border-pink-200">
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                    <span className="text-pink-700 font-medium text-sm">Em Desenvolvimento</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Content */}
          <Card className="bg-white border-2 border-pink-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-t-xl">
              <CardTitle className="text-xl flex items-center gap-3">
                <Brain className="h-6 w-6" />
                Análises Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center py-16">
                <Brain className="h-24 w-24 text-pink-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-800 mb-4">
                  Dashboard de Análises em Desenvolvimento
                </h3>
                <p className="text-slate-700 text-lg mb-6 max-w-2xl mx-auto">
                  Estamos desenvolvendo análises avançadas com inteligência artificial para fornecer insights detalhados sobre o desempenho dos seus alunos, tendências de aprendizagem e recomendações personalizadas.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="bg-pink-50 p-6 rounded-xl border border-pink-200">
                    <h4 className="font-semibold text-pink-800 mb-2">Análise de Desempenho</h4>
                    <p className="text-sm text-pink-700">Relatórios detalhados sobre o progresso individual e da turma</p>
                  </div>
                  <div className="bg-pink-50 p-6 rounded-xl border border-pink-200">
                    <h4 className="font-semibold text-pink-800 mb-2">Tendências de Aprendizagem</h4>
                    <p className="text-sm text-pink-700">Identificação de padrões e oportunidades de melhoria</p>
                  </div>
                  <div className="bg-pink-50 p-6 rounded-xl border border-pink-200">
                    <h4 className="font-semibold text-pink-800 mb-2">Recomendações IA</h4>
                    <p className="text-sm text-pink-700">Sugestões personalizadas baseadas em dados</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
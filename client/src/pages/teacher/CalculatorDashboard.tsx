import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import GradeCalculator from "@/components/teacher/GradeCalculator";
import { Calculator, ArrowLeft, Home } from "lucide-react";
import iAprenderLogo from "@assets/IAprender_1750262377399.png";

export default function CalculatorDashboard() {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>Calculadora de Notas | Professor | IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo e navegação */}
              <div className="flex items-center space-x-4">
                <Link href="/professor">
                  <Button size="sm" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <img src={iAprenderLogo} alt="IAprender" className="h-8 w-8" />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">IAprender</h2>
                    <p className="text-sm text-slate-600">Calculadora de Notas</p>
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
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-lg shadow-blue-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4">
                      <Calculator className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Calculadora de Notas
                    </h1>
                    <p className="text-slate-600 text-lg mt-2 max-w-2xl">
                      Gerencie e calcule as notas dos seus alunos de forma eficiente
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-3 border border-blue-200">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 font-medium text-sm">Calculadora Ativa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculator */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl">
              <CardTitle className="text-xl flex items-center gap-3">
                <Calculator className="h-6 w-6" />
                Gestão de Notas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <GradeCalculator />
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
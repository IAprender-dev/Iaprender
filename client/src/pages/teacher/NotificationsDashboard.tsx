import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import NotificationSender from "@/components/teacher/NotificationSender";
import { Send, ArrowLeft } from "lucide-react";
import iAprenderLogo from "@assets/IAprender_1750262377399.png";

export default function NotificationsDashboard() {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>Notificações de Comportamento | Professor | IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo e navegação */}
              <div className="flex items-center space-x-4">
                <Link href="/professor">
                  <Button size="sm" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <img src={iAprenderLogo} alt="IAprender" className="h-8 w-8" />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">IAprender</h2>
                    <p className="text-sm text-slate-600">Notificações de Comportamento</p>
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
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl blur-lg opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4">
                      <Send className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                      Notificações de Comportamento
                    </h1>
                    <p className="text-slate-600 text-lg mt-2 max-w-2xl">
                      Envie notificações importantes para a secretaria da escola
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl px-4 py-3 border border-emerald-200">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-700 font-medium text-sm">Sistema Ativo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/30">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-t-xl">
              <CardTitle className="text-xl flex items-center gap-3">
                <Send className="h-6 w-6" />
                Enviar Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <NotificationSender />
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
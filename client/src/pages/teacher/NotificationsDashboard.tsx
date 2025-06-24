import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotificationSender from "@/components/teacher/NotificationSender";
import { Send } from "lucide-react";

export default function NotificationsDashboard() {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>Notificações de Comportamento | Professor | IAprender</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
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
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  Bell, 
  Download, 
  Heart, 
  Wifi, 
  Clock,
  Star,
  Settings,
  ChevronRight,
  Users,
  MessageSquare,
  FileText,
  Globe,
  ClipboardList,
  ImageIcon,
  Search
} from "lucide-react";
import { Link } from "wouter";

interface WelcomeCardProps {
  notifications?: number;
  downloads?: number;
  favorites?: number;
  onlineStudents?: number;
}

export function WelcomeCard({ 
  downloads = 12, 
  favorites = 8,
  onlineStudents = 24 
}: WelcomeCardProps) {
  const { user } = useAuth();
  const { data: notificationData } = useNotifications();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const notifications = notificationData?.unreadCount || 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const quickActions = [
    {
      icon: <Bell className="h-4 w-4" />,
      label: "Notificações",
      count: notifications,
      color: "bg-blue-500",
      action: () => console.log("Abrir notificações")
    },
    {
      icon: <Download className="h-4 w-4" />,
      label: "Downloads",
      count: downloads,
      color: "bg-green-500",
      action: () => console.log("Abrir downloads")
    },
    {
      icon: <Heart className="h-4 w-4" />,
      label: "Favoritos",
      count: favorites,
      color: "bg-red-500",
      action: () => console.log("Abrir favoritos")
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Online",
      count: onlineStudents,
      color: "bg-emerald-500",
      action: () => console.log("Ver alunos online")
    }
  ];

  return (
    <Card className="relative overflow-hidden border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30"></div>
      
      {/* Subtle background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-4 right-4 w-24 h-24 bg-blue-100/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-4 w-20 h-20 bg-indigo-100/30 rounded-full blur-2xl"></div>
      </div>

      <CardContent className="relative z-10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Greeting Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                  {getGreeting()}, {user?.firstName}!
                </h2>
                <p className="text-slate-600 text-sm md:text-base font-medium">
                  Central Tecnológica de Educação IA
                </p>
              </div>
              
              {/* System Status */}
              <div className="hidden md:flex items-center gap-2 bg-white/60 border border-slate-200 rounded-xl px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <Wifi className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-700 font-semibold">ONLINE</span>
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-600" />
                  <span className="text-xs text-slate-700 font-mono font-medium">{formatTime()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 rounded-2xl p-4 backdrop-blur-sm border-2 border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800 font-bold text-sm">Central de Controle</h3>
                <Settings className="h-4 w-4 text-slate-600" />
              </div>
              
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full flex items-center justify-between p-3 bg-white/80 hover:bg-white/90 border border-slate-200 rounded-xl transition-all duration-200 group shadow-sm hover:shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${action.color} rounded-lg shadow-sm`}>
                        {action.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-slate-800 text-sm font-semibold">{action.label}</p>
                        <p className="text-slate-600 text-xs font-medium">
                          {action.count} {action.count === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold"
                      >
                        {action.count}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Launch */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-slate-600 text-xs mb-3 font-medium">Criação Rápida</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/professor/ferramentas/planejamento-aula">
                    <Button 
                      size="sm" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                    >
                      <ClipboardList className="h-3 w-3 mr-1" />
                      Planos
                    </Button>
                  </Link>
                  <Link href="/professor/ferramentas/gerador-atividades">
                    <Button 
                      size="sm" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Atividades
                    </Button>
                  </Link>
                  <Link href="/professor/ferramentas/imagem-educacional">
                    <Button 
                      size="sm" 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm"
                    >
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Imagens
                    </Button>
                  </Link>
                  <Link href="/professor/ferramentas/analisar-documentos">
                    <Button 
                      size="sm" 
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm"
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Análise
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span className="font-medium">Conectado à rede global IAprender.ai</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-500" />
                <span className="font-medium">Plano Premium Ativo</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
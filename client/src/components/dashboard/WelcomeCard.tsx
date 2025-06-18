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
  Cpu, 
  Wifi, 
  Battery, 
  Clock,
  Zap,
  Star,
  TrendingUp,
  Activity,
  Settings,
  ChevronRight,
  Users,
  MessageSquare,
  FileText,
  Globe
} from "lucide-react";

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
  const [systemStatus, setSystemStatus] = useState("online");
  
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
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-4 right-4 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-400/10 rounded-full blur-xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-cyan-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      <CardContent className="relative z-10 p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Greeting Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {getGreeting()}, {user?.firstName}!
                </h2>
                <p className="text-blue-100 text-sm md:text-base">
                  Central Tecnológica de Educação IA
                </p>
              </div>
              
              {/* System Status */}
              <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <Wifi className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">ONLINE</span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-300" />
                  <span className="text-xs text-blue-300 font-mono">{formatTime()}</span>
                </div>
              </div>
            </div>

            {/* System Performance Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-blue-200">
                <span>Performance do Sistema</span>
                <span>98% Otimizado</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full w-[98%] relative">
                  <div className="absolute right-0 top-0 w-2 h-2 bg-blue-300 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>

            {/* Tech Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-bold">99.2%</span>
                </div>
                <p className="text-xs text-blue-200">Uptime</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-bold">2.1s</span>
                </div>
                <p className="text-xs text-blue-200">Resp. Time</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                  <Cpu className="h-4 w-4" />
                  <span className="text-sm font-bold">85%</span>
                </div>
                <p className="text-xs text-blue-200">CPU Usage</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">Central de Controle</h3>
                <Settings className="h-4 w-4 text-blue-300" />
              </div>
              
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${action.color} rounded-lg`}>
                        {action.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{action.label}</p>
                        <p className="text-blue-200 text-xs">
                          {action.count} {action.count === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className="bg-white/10 text-white border-0 text-xs"
                      >
                        {action.count}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Launch */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-blue-200 text-xs mb-2">Acesso Rápido</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat IA
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10 text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Criar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>Conectado à rede global IA</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400" />
                <span>Plano Premium Ativo</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Battery className="h-3 w-3 text-green-400" />
              <span>Sistema otimizado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
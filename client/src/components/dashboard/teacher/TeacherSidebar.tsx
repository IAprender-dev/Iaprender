import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  Bot,
  Calendar,
  PenTool,
  Search,
  FileText,
  Calculator,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeacherSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TeacherSidebar({ isOpen, onClose }: TeacherSidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/professor",
      active: location === "/professor",
      color: "text-slate-600"
    },
    {
      name: "Central de IA",
      icon: Bot,
      href: "/central-ia",
      active: location === "/central-ia",
      color: "text-violet-600"
    },
    {
      name: "Planejamento",
      icon: Calendar,
      href: "/professor/ferramentas/planejamento-aula",
      active: location.includes("/planejamento"),
      color: "text-emerald-600"
    },
    {
      name: "Atividades",
      icon: PenTool,
      href: "/professor/ferramentas/gerador-atividades",
      active: location.includes("/atividades"),
      color: "text-blue-600"
    },
    {
      name: "Documentos",
      icon: Search,
      href: "/professor/ferramentas/analisar-documentos",
      active: location.includes("/documentos"),
      color: "text-indigo-600"
    },
    {
      name: "Materiais",
      icon: FileText,
      href: "/professor/ferramentas/materiais-didaticos",
      active: location.includes("/materiais"),
      color: "text-green-600"
    },
    {
      name: "Calculadora",
      icon: Calculator,
      href: "/professor/calculadora",
      active: location.includes("/calculadora"),
      color: "text-violet-600"
    },
    {
      name: "Relatórios",
      icon: BarChart3,
      href: "/professor/analises",
      active: location.includes("/analises"),
      color: "text-orange-600"
    },
    {
      name: "Notificações",
      icon: Bell,
      href: "/professor/notificacoes",
      active: location.includes("/notificacoes"),
      color: "text-blue-600"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-72 bg-white/95 backdrop-blur-md border-r border-slate-200/60 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/60">
          <h2 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Menu Principal
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 cursor-pointer",
                item.active
                  ? "bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200"
                  : "hover:bg-slate-50 hover:scale-105"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  item.active ? "bg-white shadow-sm" : "bg-slate-100"
                )}>
                  <item.icon className={cn("h-5 w-5", item.active ? item.color : "text-slate-500")} />
                </div>
                <span className={cn(
                  "font-medium",
                  item.active ? "text-slate-900" : "text-slate-600"
                )}>
                  {item.name}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200/60 bg-white/50">
          <div className="space-y-2">
            <Link href="/professor/configuracoes" onClick={onClose}>
              <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-slate-500" />
                </div>
                <span className="font-medium text-slate-600">Configurações</span>
              </div>
            </Link>
            
            <button 
              onClick={() => { logout(); onClose(); }}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition-colors w-full text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <LogOut className="h-4 w-4 text-red-500" />
              </div>
              <span className="font-medium text-red-600">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
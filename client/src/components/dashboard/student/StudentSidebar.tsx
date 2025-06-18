import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import {
  Bot,
  MessageSquare,
  Mic,
  Languages,
  BookOpen,
  Calendar,
  User,
  LogOut
} from "lucide-react";
import iaprenderLogo from "@assets/iaprender-logo.png";

export default function StudentSidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      name: "Central de Inteligências",
      icon: <Bot className="h-4 w-4" />,
      href: "/central-ia",
      active: location === "/central-ia"
    },
    {
      name: "Tutor por Texto",
      icon: <MessageSquare className="h-4 w-4" />,
      href: "/aluno/tutor-ia",
      active: location === "/aluno/tutor-ia"
    },
    {
      name: "Tutor por Voz",
      icon: <Mic className="h-4 w-4" />,
      href: "/aluno/tutor-voz",
      active: location === "/aluno/tutor-voz"
    },
    {
      name: "Tradutor Escolar",
      icon: <Languages className="h-4 w-4" />,
      href: "/student/translator",
      active: location === "/student/translator"
    },
    {
      name: "Cursos",
      icon: <BookOpen className="h-4 w-4" />,
      href: "/student/courses",
      active: location === "/student/courses"
    },
    {
      name: "Planejamento",
      icon: <Calendar className="h-4 w-4" />,
      href: "/aluno/planejamento",
      active: location === "/aluno/planejamento"
    },
    {
      name: "Meu Perfil",
      icon: <User className="h-4 w-4" />,
      href: "/student/profile",
      active: location === "/student/profile"
    }
  ];

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-neutral-200 h-screen overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white p-4 border-b border-neutral-200">
        <Link href="/" className="flex items-center space-x-3">
          <img src={iaprenderLogo} alt="IAprender" className="w-8 h-8" />
          <span className="text-2xl font-bold text-gray-900">IAprender</span>
        </Link>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                  item.active 
                    ? "bg-primary-50 text-primary" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>

              </Link>
            </li>
          ))}
        </ul>
        
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <ul className="space-y-1">
            <li>
              <button 
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
                onClick={() => {
                  logout();
                  window.location.href = '/';
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-3">Sair</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
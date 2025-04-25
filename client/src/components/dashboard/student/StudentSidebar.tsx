import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Medal,
  Calendar,
  FileText,
  Settings,
  Bot,
  Users
} from "lucide-react";

export default function StudentSidebar() {
  const [location] = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      href: "/aluno/dashboard",
      active: location === "/aluno/dashboard"
    },
    {
      name: "Meus Cursos",
      icon: <BookOpen className="h-4 w-4" />,
      href: "/aluno/cursos",
      active: location === "/aluno/cursos"
    },
    {
      name: "Atividades",
      icon: <CheckSquare className="h-4 w-4" />,
      href: "/aluno/atividades",
      active: location === "/aluno/atividades",
      badge: 4
    },
    {
      name: "Conquistas",
      icon: <Medal className="h-4 w-4" />,
      href: "/aluno/conquistas",
      active: location === "/aluno/conquistas"
    },
    {
      name: "Assistente IA",
      icon: <Bot className="h-4 w-4" />,
      href: "/aluno/assistente",
      active: location === "/aluno/assistente"
    },
    {
      name: "Calendário",
      icon: <Calendar className="h-4 w-4" />,
      href: "/aluno/calendario",
      active: location === "/aluno/calendario"
    },
    {
      name: "Notas",
      icon: <FileText className="h-4 w-4" />,
      href: "/aluno/notas",
      active: location === "/aluno/notas"
    },
    {
      name: "Comunidade",
      icon: <Users className="h-4 w-4" />,
      href: "/aluno/comunidade",
      active: location === "/aluno/comunidade"
    }
  ];

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-neutral-200 h-screen overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white p-4 border-b border-neutral-200">
        <Link href="/" className="flex items-center">
          <span className="text-primary text-2xl font-bold font-heading">
            i<span className="text-[#34C759]">Aula</span>
          </span>
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
                {item.badge && (
                  <span className="ml-auto bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/aluno/configuracoes"
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                  location === "/aluno/configuracoes" 
                    ? "bg-primary-50 text-primary" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
                )}
              >
                <Settings className="h-4 w-4" />
                <span className="ml-3">Configurações</span>
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="rounded-md bg-primary-50 p-4">
            <h3 className="text-sm font-medium text-primary mb-2">Precisa de ajuda?</h3>
            <p className="text-xs text-neutral-600 mb-3">
              Nosso assistente IA está aqui para ajudar com suas dúvidas.
            </p>
            <Link href="/aluno/assistente">
              <button className="w-full bg-primary text-white text-xs font-medium px-3 py-2 rounded-md hover:bg-primary-600">
                Abrir Assistente
              </button>
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}
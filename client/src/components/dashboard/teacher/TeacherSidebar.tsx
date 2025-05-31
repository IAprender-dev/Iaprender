import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Users,
  FileText,
  Settings,
  Bot,
  Wand2,
  Search,
  ImageIcon,
  LogOut,
  BellRing,
  Mail,
  GraduationCap,
  CheckSquare,
  ClipboardList,
  Lightbulb,
  FileEdit,
  PenTool,
  ListChecks,
  BookOpenCheck
} from "lucide-react";
import iaverseLogo from "@/assets/IAverse.png";

export default function TeacherSidebar() {
  const [location] = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/professor/dashboard",
      active: location === "/professor/dashboard"
    },
    {
      name: "Cursos",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/professor/cursos",
      active: location === "/professor/cursos"
    },
    {
      name: "Planejamento",
      icon: <CalendarDays className="h-5 w-5" />,
      href: "/professor/planejamento",
      active: location === "/professor/planejamento"
    },
    {
      name: "Alunos",
      icon: <Users className="h-5 w-5" />,
      href: "/professor/alunos",
      active: location === "/professor/alunos"
    },
    {
      name: "IA Assistente",
      icon: <Bot className="h-5 w-5" />,
      href: "/central-ia",
      active: location === "/central-ia",
      badge: "Novo"
    },
    {
      name: "Materiais",
      icon: <FileText className="h-5 w-5" />,
      href: "/professor/materiais",
      active: location === "/professor/materiais"
    }
  ];

  const teacherTools = [
    {
      name: "Criar Imagem Educacional",
      icon: <ImageIcon className="h-5 w-5" />,
      href: "/professor/ferramentas/imagem-educacional",
      active: location === "/professor/ferramentas/imagem-educacional"
    },
    {
      name: "Gerador de Atividades",
      icon: <FileEdit className="h-5 w-5" />,
      href: "/professor/ferramentas/gerador-atividades",
      active: location === "/professor/ferramentas/gerador-atividades"
    },
    {
      name: "Resumos Didáticos IA",
      icon: <BookOpenCheck className="h-5 w-5" />,
      href: "/professor/ferramentas/materiais-didaticos",
      active: location === "/professor/ferramentas/materiais-didaticos"
    },
    {
      name: "Resumos BNCC",
      icon: <GraduationCap className="h-5 w-5" />,
      href: "/professor/ferramentas/resumos-bncc",
      active: location === "/professor/ferramentas/resumos-bncc"
    },

    {
      name: "Planejamento de Aula",
      icon: <ClipboardList className="h-5 w-5" />,
      href: "/professor/ferramentas/planejamento-aula",
      active: location === "/professor/ferramentas/planejamento-aula"
    },
    {
      name: "Modelos de Planejamento",
      icon: <ListChecks className="h-5 w-5" />,
      href: "/professor/ferramentas/modelos-planejamento",
      active: location === "/professor/ferramentas/modelos-planejamento"
    }
  ];

  const aiTools = [
    {
      name: "ChatGPT",
      icon: <Wand2 className="h-5 w-5" />,
      href: "/professor/ferramentas/chatgpt",
      active: location === "/professor/ferramentas/chatgpt"
    },
    {
      name: "Claude",
      icon: <Bot className="h-5 w-5" />,
      href: "/professor/ferramentas/claude",
      active: location === "/professor/ferramentas/claude"
    },
    {
      name: "Perplexity",
      icon: <Search className="h-5 w-5" />,
      href: "/professor/ferramentas/perplexity",
      active: location === "/professor/ferramentas/perplexity"
    },
    {
      name: "Todas as Ferramentas",
      icon: <Lightbulb className="h-5 w-5" />,
      href: "/professor/ferramentas",
      active: location === "/professor/ferramentas" && 
              !location.includes("/professor/ferramentas/")
    }
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen bg-blue-900 w-64">
      {/* Logo e cabeçalho */}
      <div className="px-6 py-6 bg-blue-950">
        <Link href="/" className="flex items-center space-x-3">
          <img src={iaverseLogo} alt="IAverse" className="w-8 h-8" />
          <span className="text-white text-2xl font-bold">IAverse</span>
        </Link>
      </div>
      
      {/* Container dos menus com scroll */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        {/* Menu principal */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-4 px-3">
            Principal
          </h3>
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    item.active 
                      ? "bg-blue-800 text-white" 
                      : "text-blue-100 hover:bg-blue-800/60 hover:text-white"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center h-9 w-9 rounded-lg mr-3",
                    item.active ? "bg-blue-700" : "bg-blue-800/40"
                  )}>
                    {item.icon}
                  </span>
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Menu de IA tools visível apenas na página de ferramentas */}
        {location.startsWith("/professor/ferramentas") && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-4 px-3">
              Ferramentas de IA
            </h3>
            <ul className="space-y-1.5">
              {aiTools.map((tool) => (
                <li key={tool.name}>
                  <Link 
                    href={tool.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      tool.active 
                        ? "bg-blue-800 text-white" 
                        : "text-blue-100 hover:bg-blue-800/60 hover:text-white"
                    )}
                  >
                    <span className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-lg mr-3",
                      tool.active ? "bg-blue-700" : "bg-blue-800/40"
                    )}>
                      {tool.icon}
                    </span>
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
      
      {/* Footer do sidebar */}
      <div className="border-t border-blue-800 p-4">
        <Link 
          href="/professor/configuracoes"
          className={cn(
            "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            location === "/professor/configuracoes" 
              ? "bg-blue-800 text-white" 
              : "text-blue-100 hover:bg-blue-800/60 hover:text-white"
          )}
        >
          <span className={cn(
            "flex items-center justify-center h-8 w-8 rounded-lg mr-3",
            location === "/professor/configuracoes" ? "bg-blue-700" : "bg-blue-800/40"
          )}>
            <Settings className="h-5 w-5" />
          </span>
          Configurações
        </Link>
        
        <Link 
          href="/logout"
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors text-blue-100 hover:bg-blue-800/60 hover:text-white mt-2"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-lg mr-3 bg-blue-800/40">
            <LogOut className="h-5 w-5" />
          </span>
          Sair
        </Link>
      </div>
    </aside>
  );
}
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
  Search
} from "lucide-react";

export default function TeacherSidebar() {
  const [location] = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      href: "/professor/dashboard",
      active: location === "/professor/dashboard"
    },
    {
      name: "Cursos",
      icon: <BookOpen className="h-4 w-4" />,
      href: "/professor/cursos",
      active: location === "/professor/cursos"
    },
    {
      name: "Planejamento",
      icon: <CalendarDays className="h-4 w-4" />,
      href: "/professor/planejamento",
      active: location === "/professor/planejamento"
    },
    {
      name: "Alunos",
      icon: <Users className="h-4 w-4" />,
      href: "/professor/alunos",
      active: location === "/professor/alunos"
    },
    {
      name: "Ferramentas IA",
      icon: <Bot className="h-4 w-4" />,
      href: "/professor/ferramentas",
      active: location === "/professor/ferramentas",
      badge: "Novo"
    },
    {
      name: "Materiais",
      icon: <FileText className="h-4 w-4" />,
      href: "/professor/materiais",
      active: location === "/professor/materiais"
    }
  ];

  const aiTools = [
    {
      name: "ChatGPT",
      icon: <Wand2 className="h-4 w-4" />,
      href: "/professor/ferramentas/chatgpt",
      active: location === "/professor/ferramentas/chatgpt"
    },
    {
      name: "Gemini",
      icon: <Bot className="h-4 w-4" />,
      href: "/professor/ferramentas/gemini",
      active: location === "/professor/ferramentas/gemini"
    },
    {
      name: "Gerador de Imagens",
      icon: <FileText className="h-4 w-4" />,
      href: "/professor/ferramentas/imagens",
      active: location === "/professor/ferramentas/imagens"
    },
    {
      name: "Perplexity",
      icon: <Search className="h-4 w-4" />,
      href: "/professor/ferramentas/perplexity",
      active: location === "/professor/ferramentas/perplexity"
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
        
        {location.startsWith("/professor/ferramentas") && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Ferramentas de IA
            </h3>
            <ul className="space-y-1">
              {aiTools.map((tool) => (
                <li key={tool.name}>
                  <Link 
                    href={tool.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                      tool.active 
                        ? "bg-primary-50 text-primary" 
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
                    )}
                  >
                    {tool.icon}
                    <span className="ml-3">{tool.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/professor/configuracoes"
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                  location === "/professor/configuracoes" 
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
            <h3 className="text-sm font-medium text-primary mb-2">Espaço do Professor</h3>
            <p className="text-xs text-neutral-600 mb-3">
              Explore nossas ferramentas de IA para criar materiais, planejar aulas e gerar conteúdos educacionais.
            </p>
            <Link href="/professor/ferramentas">
              <button className="w-full bg-primary text-white text-xs font-medium px-3 py-2 rounded-md hover:bg-primary-600">
                Explorar Ferramentas
              </button>
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}
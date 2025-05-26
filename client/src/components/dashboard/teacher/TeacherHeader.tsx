import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Menu, X, Bell } from "lucide-react";
import iaverseLogo from "@/assets/IAverse.png";

export default function TeacherHeader() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center space-x-3">
              <img src={iaverseLogo} alt="IAverse" className="w-8 h-8" />
              <span className="text-2xl font-bold text-gray-900">IAverse</span>
            </Link>
            <div className="hidden lg:ml-10 lg:flex lg:space-x-8">
              <Link
                href="/professor/dashboard"
                className={`${
                  location === "/professor/dashboard"
                    ? "text-primary border-b-2 border-primary"
                    : "text-neutral-600 hover:text-primary"
                } px-3 py-5 text-sm font-medium`}
              >
                Início
              </Link>
              <Link
                href="/professor/cursos"
                className={`${
                  location === "/professor/cursos"
                    ? "text-primary border-b-2 border-primary"
                    : "text-neutral-600 hover:text-primary"
                } px-3 py-5 text-sm font-medium`}
              >
                Cursos
              </Link>
              <Link
                href="/professor/planejamento"
                className={`${
                  location === "/professor/planejamento"
                    ? "text-primary border-b-2 border-primary"
                    : "text-neutral-600 hover:text-primary"
                } px-3 py-5 text-sm font-medium`}
              >
                Planejamento
              </Link>
              <Link
                href="/professor/alunos"
                className={`${
                  location === "/professor/alunos"
                    ? "text-primary border-b-2 border-primary"
                    : "text-neutral-600 hover:text-primary"
                } px-3 py-5 text-sm font-medium`}
              >
                Alunos
              </Link>
              <Link
                href="/professor/ferramentas"
                className={`${
                  location === "/professor/ferramentas"
                    ? "text-primary border-b-2 border-primary"
                    : "text-neutral-600 hover:text-primary"
                } px-3 py-5 text-sm font-medium`}
              >
                Ferramentas IA
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {/* Notification Bell */}
            <div className="flex-shrink-0 relative mr-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-neutral-700 hover:text-primary hover:bg-neutral-100"
                aria-label="Ver notificações"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
            </div>
            
            {/* User Menu (Desktop) */}
            <div className="hidden md:block relative flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="rounded-full w-10 h-10 p-0 text-neutral-700 hover:text-primary hover:bg-neutral-100"
                    aria-label="Abrir menu de usuário"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/professor/perfil" className="cursor-pointer w-full">
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/professor/configuracoes" className="cursor-pointer w-full">
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-500 focus:text-red-500" 
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="text-neutral-700 hover:text-primary hover:bg-neutral-100"
                aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/professor/dashboard"
              className={`${
                location === "/professor/dashboard"
                  ? "bg-primary-50 text-primary"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
              } block px-3 py-2 text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              Início
            </Link>
            <Link
              href="/professor/cursos"
              className={`${
                location === "/professor/cursos"
                  ? "bg-primary-50 text-primary"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
              } block px-3 py-2 text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              Cursos
            </Link>
            <Link
              href="/professor/planejamento"
              className={`${
                location === "/professor/planejamento"
                  ? "bg-primary-50 text-primary"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
              } block px-3 py-2 text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              Planejamento
            </Link>
            <Link
              href="/professor/alunos"
              className={`${
                location === "/professor/alunos"
                  ? "bg-primary-50 text-primary"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
              } block px-3 py-2 text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              Alunos
            </Link>
            <Link
              href="/professor/ferramentas"
              className={`${
                location === "/professor/ferramentas"
                  ? "bg-primary-50 text-primary"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-primary"
              } block px-3 py-2 text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              Ferramentas IA
            </Link>
            
            <div className="pt-4 pb-3 border-t border-neutral-200">
              <div className="flex items-center px-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full w-10 h-10 bg-primary flex items-center justify-center text-white">
                    <User className="h-5 w-5" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-neutral-800">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/professor/perfil"
                  className="block px-3 py-2 text-base font-medium text-neutral-600 hover:text-primary hover:bg-neutral-50"
                  onClick={() => setIsOpen(false)}
                >
                  Perfil
                </Link>
                <Link
                  href="/professor/configuracoes"
                  className="block px-3 py-2 text-base font-medium text-neutral-600 hover:text-primary hover:bg-neutral-50"
                  onClick={() => setIsOpen(false)}
                >
                  Configurações
                </Link>
                <button
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-500 hover:bg-neutral-50"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
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
import { User, LogOut, Menu, X } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";

export default function Header() {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleLoginClick = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const handleRegisterClick = () => {
    setAuthMode("register");
    setShowAuthModal(true);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    
    if (user.role === "teacher") {
      return "/professor/dashboard";
    } else if (user.role === "student") {
      return "/aluno/dashboard";
    } else {
      return "/admin/dashboard";
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-primary text-2xl font-bold font-heading">
                i<span className="text-[#34C759]">Aula</span>
              </span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                href="/#recursos"
                className={`${
                  location === "/#recursos"
                    ? "text-primary"
                    : "text-neutral-600 hover:text-primary"
                } px-3 py-2 text-sm font-medium`}
              >
                Recursos
              </Link>
              <Link
                href="/#beneficios"
                className={`${
                  location === "/#beneficios"
                    ? "text-primary"
                    : "text-neutral-600 hover:text-primary"
                } px-3 py-2 text-sm font-medium`}
              >
                Benefícios
              </Link>
              <Link
                href="/cursos"
                className={`${
                  location === "/cursos"
                    ? "text-primary"
                    : "text-neutral-600 hover:text-primary"
                } px-3 py-2 text-sm font-medium`}
              >
                Cursos
              </Link>
              <Link
                href="/#seguranca"
                className={`${
                  location === "/#seguranca"
                    ? "text-primary"
                    : "text-neutral-600 hover:text-primary"
                } px-3 py-2 text-sm font-medium`}
              >
                Segurança
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:flex md:items-center">
              {isAuthenticated ? (
                <div className="flex items-center">
                  <Link href={getDashboardLink()} className="mr-4">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="rounded-full w-10 h-10 p-0"
                        aria-label="Abrir menu de usuário"
                      >
                        {user?.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={`${user.firstName} ${user.lastName}`} 
                            className="rounded-full w-8 h-8 object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
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
                        <Link href={getDashboardLink()} className="cursor-pointer w-full">
                          Dashboard
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
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-neutral-600 hover:text-primary" 
                    onClick={handleLoginClick}
                  >
                    Login
                  </Button>
                  <Button 
                    className="ml-4 bg-primary hover:bg-primary/90"
                    onClick={handleRegisterClick}
                  >
                    Registrar
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
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
              href="/#recursos"
              className="text-neutral-600 hover:bg-neutral-50 hover:text-primary block px-3 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Recursos
            </Link>
            <Link
              href="/#beneficios"
              className="text-neutral-600 hover:bg-neutral-50 hover:text-primary block px-3 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Benefícios
            </Link>
            <Link
              href="/cursos"
              className="text-neutral-600 hover:bg-neutral-50 hover:text-primary block px-3 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Cursos
            </Link>
            <Link
              href="/#seguranca"
              className="text-neutral-600 hover:bg-neutral-50 hover:text-primary block px-3 py-2 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Segurança
            </Link>
            <div className="pt-4 pb-3 border-t border-neutral-200">
              {isAuthenticated ? (
                <>
                  <Link
                    href={getDashboardLink()}
                    className="block px-3 py-2 text-base font-medium text-neutral-600 hover:text-primary hover:bg-neutral-50"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
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
                </>
              ) : (
                <>
                  <button
                    className="block w-full text-left px-3 py-2 text-base font-medium text-neutral-600 hover:text-primary hover:bg-neutral-50"
                    onClick={() => {
                      handleLoginClick();
                      setIsOpen(false);
                    }}
                  >
                    Login
                  </button>
                  <button
                    className="block w-full text-left px-3 py-2 mt-1 text-base font-medium text-neutral-600 hover:text-primary hover:bg-neutral-50"
                    onClick={() => {
                      handleRegisterClick();
                      setIsOpen(false);
                    }}
                  >
                    Registrar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        authMode={authMode}
        setAuthMode={setAuthMode}
      />
    </nav>
  );
}

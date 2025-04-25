import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "./types";
import { apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const res = await apiRequest('POST', '/api/auth/login', { email, password });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo(a) ${userData.firstName}!`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Falha no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const res = await apiRequest('POST', '/api/auth/register', userData);
      
      if (res.ok) {
        const registeredUser = await res.json();
        setUser(registeredUser);
        toast({
          title: "Registro bem-sucedido",
          description: `Bem-vindo(a) ${registeredUser.firstName}!`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Falha no registro",
        description: error.message || "Não foi possível criar sua conta",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível desconectar a sessão",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

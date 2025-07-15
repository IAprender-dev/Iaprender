import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";

// Tipos básicos
export type User = {
  id: number;
  email: string;
  username: string;
  nome?: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "teacher" | "student" | "municipal_manager" | "school_director";
  status: "active" | "inactive" | "suspended" | "blocked";
  contractId?: number | null;
  schoolYear?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  createdAt: string;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "teacher" | "student";
  status?: "active" | "inactive" | "suspended" | "blocked";
  username?: string;
};

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  directLoginMutation: UseMutationResult<User, Error, LoginData>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Query para buscar o usuário atual
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User, Error>({
    queryKey: ["/api/auth/me"],
    queryFn: async ({ signal }) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return null as any; // Sem token, usuário não autenticado
        }

        const response = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal,
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token inválido, remover do localStorage
            localStorage.removeItem("token");
            return null as any;
          }
          throw new Error("Failed to fetch user");
        }
        
        const data = await response.json();
        return data.user;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Request aborted');
          return null as any;
        }
        throw err;
      }
    },
  });

  // Mutation para login seguro
  const loginMutation = useMutation<User, Error, LoginData>({
    mutationFn: async (credentials) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na autenticação");
      }

      // Salvar token no localStorage
      localStorage.setItem("token", data.token);
      
      return data.user;
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${userData.nome || userData.email}!`,
      });
      
      // Redirect based on user role
      if (userData.role === 'admin') {
        setLocation('/admin/master'); // Admin users redirected to master dashboard
      } else if (userData.role === 'municipal_manager') {
        setLocation('/gestor/dashboard'); // Municipal managers redirected to gestor dashboard
      } else if (userData.role === 'school_director') {
        setLocation('/school/dashboard'); // School directors redirected to school dashboard
      } else if (userData.role === 'teacher') {
        setLocation('/professor');
      } else if (userData.role === 'student') {
        setLocation('/student/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para login direto com Cognito
  const directLoginMutation = useMutation<User, Error, LoginData>({
    mutationFn: async (credentials) => {
      const response = await fetch("/api/auth/hybrid-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na autenticação");
      }

      // Salvar token no localStorage
      localStorage.setItem("token", data.token);
      
      return data.user;
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({
        title: "Login direto bem-sucedido",
        description: `Bem-vindo, ${userData.nome || userData.email}!`,
      });
      
      // Redirect based on user role
      if (userData.role === 'admin') {
        setLocation('/admin/master');
      } else if (userData.role === 'municipal_manager') {
        setLocation('/gestor/dashboard');
      } else if (userData.role === 'school_director') {
        setLocation('/school/dashboard');
      } else if (userData.role === 'teacher') {
        setLocation('/professor');
      } else if (userData.role === 'student') {
        setLocation('/student/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login direto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para registro
  const registerMutation = useMutation<User, Error, RegisterData>({
    mutationFn: async (userData) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Registration failed" }));
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({
        title: "Registro bem-sucedido",
        description: `Bem-vindo, ${userData.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          // Não falha se retornar 200, mesmo com body empty
          if (res.status === 200 || res.ok) {
            return;
          }
          throw new Error("Logout failed");
        }
      } catch (error) {
        // Se o logout falhar no servidor, limpa localmente mesmo assim
        console.log("Logout failed on server, clearing local session");
        return;
      }
    },
    onSuccess: () => {
      // Limpar token do localStorage
      localStorage.removeItem("token");
      queryClient.setQueryData(["/api/auth/me"], null);
      // Redireciona para a landing page
      setLocation("/");
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
    },
    onError: (error: Error) => {
      // Mesmo com erro, fazer logout local
      localStorage.removeItem("token");
      queryClient.setQueryData(["/api/auth/me"], null);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado.",
      });
      setLocation("/");
    },
  });

  // Função auxiliar para logout
  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const updateUser = (userData: Partial<User>) => {
    queryClient.setQueryData(['/api/auth/me'], (oldData: User | undefined) => {
      if (oldData) {
        return { ...oldData, ...userData };
      }
      return oldData;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        directLoginMutation,
        registerMutation,
        logoutMutation,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
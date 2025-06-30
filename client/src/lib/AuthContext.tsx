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
  firstName: string;
  lastName: string;
  role: "admin" | "teacher" | "student";
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
        const response = await apiRequest("GET", "/api/auth/me", undefined, { 
          signal 
        } as RequestInit);
        
        if (!response.ok) {
          if (response.status === 401) {
            return null as any; // Retorna null em caso de não autenticado
          }
          throw new Error("Failed to fetch user");
        }
        return await response.json();
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Request aborted');
          return null as any;
        }
        throw err;
      }
    },
  });

  // Mutation para login
  const loginMutation = useMutation<User, Error, LoginData>({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${userData.firstName}!`,
      });
      
      // Redirect based on user role
      if (userData.role === 'admin') {
        setLocation('/admin/master'); // Admin users redirected to master dashboard
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
      const res = await apiRequest("POST", "/api/auth/logout");
      if (!res.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      // Redireciona para a landing page
      setLocation("/");
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
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
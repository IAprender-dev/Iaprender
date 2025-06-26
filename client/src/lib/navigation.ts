import { User } from "@/lib/AuthContext";

/**
 * Retorna a rota do dashboard apropriado baseado no papel do usuário
 */
export function getDashboardRoute(user: User | null): string {
  if (!user) {
    return "/";
  }

  switch (user.role) {
    case "teacher":
      return "/professor";
    case "student":
      return "/student/dashboard";
    case "admin":
      return "/secretary";
    default:
      return "/student/dashboard";
  }
}

/**
 * Retorna o nome do dashboard baseado no papel do usuário
 */
export function getDashboardName(user: User | null): string {
  if (!user) {
    return "Dashboard";
  }

  switch (user.role) {
    case "teacher":
      return "Dashboard do Professor";
    case "student":
      return "Dashboard do Aluno";
    case "admin":
      return "Dashboard da Secretaria";
    default:
      return "Dashboard";
  }
}
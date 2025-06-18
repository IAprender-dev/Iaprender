import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data: any): { notifications: Notification[], unreadCount: number } => {
      const notifications = data || [];
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;
      
      return {
        notifications,
        unreadCount
      };
    }
  });
}
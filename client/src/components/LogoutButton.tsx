import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogoutButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  showText?: boolean;
  text?: string;
  onLogoutStart?: () => void;
  onLogoutComplete?: () => void;
  onLogoutError?: (error: string) => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = '',
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  showText = true,
  text = 'Sair',
  onLogoutStart,
  onLogoutComplete,
  onLogoutError
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    onLogoutStart?.();

    try {
      console.log('🚪 Iniciando logout via componente LogoutButton...');

      // 1. Tentar usar AuthManager global se disponível
      if (window.auth && typeof window.auth.logout === 'function') {
        console.log('📡 Usando AuthManager global para logout...');
        await window.auth.logout();
        return;
      }

      // 2. Fallback para logout manual se AuthManager não estiver disponível
      console.log('🔄 Executando logout manual (AuthManager não encontrado)...');
      
      // Tentar fazer logout no servidor
      const token = localStorage.getItem('auth_token') || 
                   localStorage.getItem('cognito_token') || 
                   localStorage.getItem('authToken');

      if (token) {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('✅ Logout no servidor concluído');
          } else {
            console.warn('⚠️ Erro no logout do servidor:', response.status);
          }
        } catch (error) {
          console.warn('⚠️ Erro na requisição de logout:', error);
        }
      }

      // Limpar todos os dados de autenticação
      const keysToRemove = [
        'auth_token', 'cognito_token', 'access_token', 'id_token', 
        'refresh_token', 'user_data', 'auth_user', 'cognito_user',
        'sistema_token', 'jwt_token', 'authToken', 'user_info', 'userInfo'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Limpar cookies de autenticação
      document.cookie.split(";").forEach(c => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
        if (name.includes('auth') || name.includes('cognito') || name.includes('token')) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      });

      // Disparar evento de logout
      window.dispatchEvent(new CustomEvent('auth:logout', {
        detail: { 
          timestamp: new Date().toISOString(),
          source: 'LogoutButton'
        }
      }));

      console.log('✅ Logout manual concluído');

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
        duration: 2000
      });

      onLogoutComplete?.();

      // Redirecionar para página inicial
      setTimeout(() => {
        window.location.replace('/');
      }, 500);

    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro no logout",
        description: "Houve um erro ao fazer logout. Redirecionando...",
        variant: "destructive",
        duration: 3000
      });

      onLogoutError?.(errorMessage);

      // Mesmo com erro, limpar e redirecionar
      setTimeout(() => {
        window.location.replace('/');
      }, 1500);

    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`${className} ${isLoggingOut ? 'opacity-70' : ''}`}
      title="Fazer logout do sistema"
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        showIcon && <LogOut className="h-4 w-4" />
      )}
      {showText && (
        <span className={showIcon ? 'ml-2' : ''}>
          {isLoggingOut ? 'Saindo...' : text}
        </span>
      )}
    </Button>
  );
};

export default LogoutButton;
/**
 * Hook customizado para integração com API externa
 * Gerencia estado e operações da API externa com React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalApiService, type ExternalUser } from '@/services/externalApi';
import { useToast } from '@/hooks/use-toast';

export function useExternalUsers() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['external-users'],
    queryFn: () => externalApiService.listarUsuarios(),
    retry: 2,
    retryDelay: 1000,
    onError: (error: Error) => {
      console.error('Erro ao carregar usuários da API externa:', error);
      toast({
        title: "Erro na API Externa",
        description: error.message || "Falha ao carregar usuários",
        variant: "destructive"
      });
    }
  });
}

export function useExternalUser(id: string) {
  return useQuery({
    queryKey: ['external-user', id],
    queryFn: () => externalApiService.buscarUsuario(id),
    enabled: !!id,
    retry: 2,
    retryDelay: 1000
  });
}

export function useCreateExternalUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userData: Partial<ExternalUser>) => 
      externalApiService.criarUsuario(userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['external-users'] });
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro ao Criar Usuário",
        description: error.message || "Falha ao criar usuário",
        variant: "destructive"
      });
    }
  });
}

export function useUpdateExternalUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: Partial<ExternalUser> }) => 
      externalApiService.atualizarUsuario(id, userData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['external-users'] });
      queryClient.invalidateQueries({ queryKey: ['external-user', variables.id] });
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro ao Atualizar Usuário",
        description: error.message || "Falha ao atualizar usuário",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteExternalUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => externalApiService.deletarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-users'] });
      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro ao Remover Usuário",
        description: error.message || "Falha ao remover usuário",
        variant: "destructive"
      });
    }
  });
}

export function useExternalApiHealth() {
  return useQuery({
    queryKey: ['external-api-health'],
    queryFn: () => externalApiService.verificarConectividade(),
    refetchInterval: 30000, // Verificar a cada 30 segundos
    retry: 1,
    retryDelay: 2000
  });
}
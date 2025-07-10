/**
 * HOOK CUSTOMIZADO PARA MAPEAMENTO DE FORMULÁRIOS
 * 
 * Hook que integra o sistema de mapeamento de formulários com React Hook Form,
 * React Query e validações Zod de forma automatizada.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { FormUtils, FORM_STATES } from '@/lib/mapeamento-forms';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UseFormMappingOptions {
  formId: string;
  params?: Record<string, any>;
  defaultValues?: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  invalidateQueries?: string[];
}

export const useFormMapping = ({
  formId,
  params = {},
  defaultValues = {},
  onSuccess,
  onError,
  invalidateQueries = []
}: UseFormMappingOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [schema, setSchema] = useState(null);

  // Obter configuração do formulário
  const formConfig = FormUtils.getFormConfig(formId);
  
  if (!formConfig) {
    throw new Error(`Configuração não encontrada para o formulário: ${formId}`);
  }

  // Verificar permissões
  const hasPermission = FormUtils.hasPermission(formId, user?.role);
  
  if (!hasPermission) {
    throw new Error(`Usuário não tem permissão para acessar o formulário: ${formId}`);
  }

  // Carregar schema de validação de forma assíncrona
  const loadSchema = useCallback(async () => {
    if (!formConfig.schema) return null;
    
    try {
      const loadedSchema = await FormUtils.getSchema(formConfig.schema);
      setSchema(loadedSchema);
      return loadedSchema;
    } catch (error) {
      console.error(`Erro ao carregar schema ${formConfig.schema}:`, error);
      return null;
    }
  }, [formConfig.schema]);

  // Configurar React Hook Form
  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode: 'onChange'
  });

  // Configurar mutação
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      setFormState(FORM_STATES.LOADING);
      
      const endpoint = FormUtils.buildEndpoint(formId, params);
      const timeout = FormUtils.getTimeout(formId);
      
      return apiRequest(endpoint, {
        method: formConfig.method,
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(timeout),
      });
    },
    onSuccess: (data) => {
      setFormState(FORM_STATES.SUCCESS);
      
      // Invalidar queries relacionadas
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
      
      // Mostrar toast de sucesso
      toast({
        title: "Sucesso!",
        description: "Operação realizada com sucesso.",
        variant: "default",
      });
      
      // Callback personalizado de sucesso
      onSuccess?.(data);
      
      // Redirecionamento automático se configurado
      if (formConfig.redirectOnSuccess) {
        window.location.href = formConfig.redirectOnSuccess;
      }
    },
    onError: (error) => {
      setFormState(FORM_STATES.ERROR);
      
      // Mostrar toast de erro
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      
      // Callback personalizado de erro
      onError?.(error);
    },
  });

  // Handler para submit do formulário
  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  // Carregar schema na inicialização
  useState(() => {
    loadSchema();
  });

  return {
    // React Hook Form
    form,
    register: form.register,
    handleSubmit: onSubmit,
    formState: form.formState,
    errors: form.formState.errors,
    
    // Mutation
    mutation,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    
    // Estado customizado
    customFormState: formState,
    setFormState,
    
    // Configuração
    formConfig,
    hasPermission,
    
    // Utilitários
    reset: form.reset,
    setValue: form.setValue,
    getValues: form.getValues,
    clearErrors: form.clearErrors,
    
    // Schema
    schema,
    loadSchema,
  };
};

// Hook especializado para formulários de criação
export const useCreateForm = (formId: string, options: Omit<UseFormMappingOptions, 'formId'> = {}) => {
  return useFormMapping({
    formId: `${formId}-criar`,
    ...options
  });
};

// Hook especializado para formulários de edição
export const useEditForm = (formId: string, id: string | number, options: Omit<UseFormMappingOptions, 'formId' | 'params'> = {}) => {
  return useFormMapping({
    formId: `${formId}-editar`,
    params: { id },
    ...options
  });
};

// Hook para validação brasileira
export const useBrazilianValidation = () => {
  const validateCPF = useCallback((cpf: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Calcula os dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    return digit1 === parseInt(cleanCPF[9]) && digit2 === parseInt(cleanCPF[10]);
  }, []);

  const validateCNPJ = useCallback((cnpj: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Calcula primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights1[i];
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;
    
    // Calcula segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights2[i];
    }
    let digit2 = sum % 11;
    digit2 = digit2 < 2 ? 0 : 11 - digit2;
    
    return digit1 === parseInt(cleanCNPJ[12]) && digit2 === parseInt(cleanCNPJ[13]);
  }, []);

  const validateCEP = useCallback((cep: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '');
    
    // Verifica se tem 8 dígitos
    return cleanCEP.length === 8;
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos (com DDD)
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;
    
    // Lista de DDDs válidos no Brasil
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '63', // TO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '83', // PB
      '84', // RN
      '85', '88', // CE
      '86', '89', // PI
      '91', '93', '94', // PA
      '92', '97', // AM
      '95', // RR
      '96', // AP
      '98', '99' // MA
    ];
    
    const ddd = cleanPhone.substring(0, 2);
    return validDDDs.includes(ddd);
  }, []);

  const formatCPF = useCallback((cpf: string): string => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }, []);

  const formatCNPJ = useCallback((cnpj: string): string => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }, []);

  const formatCEP = useCallback((cep: string): string => {
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  }, []);

  const formatPhone = useCallback((phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }, []);

  return {
    validateCPF,
    validateCNPJ,
    validateCEP,
    validatePhone,
    formatCPF,
    formatCNPJ,
    formatCEP,
    formatPhone,
  };
};

export default useFormMapping;
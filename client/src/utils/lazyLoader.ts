/**
 * SISTEMA DE LAZY LOADING AVANÇADO - IAPRENDER
 * 
 * Carregamento sob demanda de formulários, componentes e recursos
 */

import { formCache } from './cache';

interface LazyLoadOptions {
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  preload: boolean;
}

interface LoadedModule<T> {
  module: T;
  timestamp: number;
  size: number;
}

class LazyLoader {
  private loadedModules = new Map<string, LoadedModule<any>>();
  private loadingPromises = new Map<string, Promise<any>>();
  private preloadQueue: string[] = [];
  private isPreloading = false;

  /**
   * Carregar formulário sob demanda
   */
  async loadForm(formType: string, options: Partial<LazyLoadOptions> = {}): Promise<any> {
    const config: LazyLoadOptions = {
      retryAttempts: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      preload: false,
      ...options
    };

    const cacheKey = `lazy_form_${formType}`;

    // Verificar cache primeiro
    if (config.cacheEnabled) {
      const cached = formCache.getFormConfig(formType);
      if (cached) {
        console.log(`📦 Formulário ${formType} carregado do cache`);
        return cached;
      }
    }

    // Verificar se já está sendo carregado
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Iniciar carregamento
    const loadPromise = this.loadFormWithRetry(formType, config);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      
      // Armazenar em cache
      if (config.cacheEnabled) {
        formCache.setFormConfig(formType, result);
      }

      // Armazenar módulo carregado
      this.loadedModules.set(cacheKey, {
        module: result,
        timestamp: Date.now(),
        size: JSON.stringify(result).length
      });

      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Carregar formulário com retry
   */
  private async loadFormWithRetry(formType: string, config: LazyLoadOptions): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Carregando formulário ${formType} (tentativa ${attempt})`);
        return await this.fetchFormConfig(formType);
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Erro ao carregar ${formType} (tentativa ${attempt}):`, error);
        
        if (attempt < config.retryAttempts) {
          await this.delay(config.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Falha ao carregar formulário ${formType} após ${config.retryAttempts} tentativas: ${lastError?.message}`);
  }

  /**
   * Buscar configuração do formulário
   */
  private async fetchFormConfig(formType: string): Promise<any> {
    // Simular busca de configuração (substituir por chamada real à API)
    const configs = await this.getFormConfigurations();
    
    const config = configs[formType];
    if (!config) {
      throw new Error(`Configuração não encontrada para formulário: ${formType}`);
    }

    return config;
  }

  /**
   * Obter configurações de formulários
   */
  private async getFormConfigurations(): Promise<Record<string, any>> {
    // Cache de configurações base
    const cached = formCache.get('all_form_configs');
    if (cached) {
      return cached;
    }

    // Configurações dos formulários (pode vir de API)
    const configs = {
      'usuario': {
        title: 'Cadastro de Usuário',
        fields: [
          { name: 'nome', type: 'text', required: true, label: 'Nome Completo' },
          { name: 'email', type: 'email', required: true, label: 'Email' },
          { name: 'cpf', type: 'cpf', required: true, label: 'CPF' },
          { name: 'telefone', type: 'tel', required: true, label: 'Telefone' },
          { name: 'data_nascimento', type: 'date', required: false, label: 'Data de Nascimento' }
        ],
        validation: {
          cpf: 'required|cpf',
          email: 'required|email',
          telefone: 'required|phone'
        }
      },
      'escola': {
        title: 'Cadastro de Escola',
        fields: [
          { name: 'nome', type: 'text', required: true, label: 'Nome da Escola' },
          { name: 'cnpj', type: 'cnpj', required: true, label: 'CNPJ' },
          { name: 'codigo_inep', type: 'text', required: true, label: 'Código INEP' },
          { name: 'tipo', type: 'select', required: true, label: 'Tipo de Escola',
            options: ['Municipal', 'Estadual', 'Federal', 'Particular'] },
          { name: 'endereco', type: 'text', required: true, label: 'Endereço' },
          { name: 'cep', type: 'cep', required: true, label: 'CEP' }
        ],
        validation: {
          cnpj: 'required|cnpj',
          codigo_inep: 'required|numeric|length:8',
          cep: 'required|cep'
        }
      },
      'aluno': {
        title: 'Matrícula de Aluno',
        fields: [
          { name: 'nome', type: 'text', required: true, label: 'Nome do Aluno' },
          { name: 'cpf', type: 'cpf', required: false, label: 'CPF do Aluno' },
          { name: 'data_nascimento', type: 'date', required: true, label: 'Data de Nascimento' },
          { name: 'serie', type: 'select', required: true, label: 'Série',
            options: ['1º Ano EF', '2º Ano EF', '3º Ano EF', '4º Ano EF', '5º Ano EF',
                     '6º Ano EF', '7º Ano EF', '8º Ano EF', '9º Ano EF',
                     '1º Ano EM', '2º Ano EM', '3º Ano EM'] },
          { name: 'turno', type: 'select', required: true, label: 'Turno',
            options: ['Manhã', 'Tarde', 'Noite', 'Integral'] },
          { name: 'nome_responsavel', type: 'text', required: true, label: 'Nome do Responsável' },
          { name: 'telefone_responsavel', type: 'tel', required: true, label: 'Telefone do Responsável' }
        ],
        validation: {
          cpf: 'cpf',
          telefone_responsavel: 'required|phone'
        }
      },
      'professor': {
        title: 'Cadastro de Professor',
        fields: [
          { name: 'nome', type: 'text', required: true, label: 'Nome Completo' },
          { name: 'cpf', type: 'cpf', required: true, label: 'CPF' },
          { name: 'email', type: 'email', required: true, label: 'Email' },
          { name: 'telefone', type: 'tel', required: true, label: 'Telefone' },
          { name: 'disciplinas', type: 'multiselect', required: true, label: 'Disciplinas',
            options: ['Matemática', 'Português', 'História', 'Geografia', 'Ciências',
                     'Física', 'Química', 'Biologia', 'Inglês', 'Educação Física',
                     'Arte', 'Filosofia', 'Sociologia'] },
          { name: 'formacao', type: 'textarea', required: true, label: 'Formação Acadêmica' },
          { name: 'data_admissao', type: 'date', required: true, label: 'Data de Admissão' }
        ],
        validation: {
          cpf: 'required|cpf',
          email: 'required|email',
          telefone: 'required|phone'
        }
      },
      'contato': {
        title: 'Formulário de Contato',
        fields: [
          { name: 'nome', type: 'text', required: true, label: 'Nome' },
          { name: 'email', type: 'email', required: true, label: 'Email' },
          { name: 'telefone', type: 'tel', required: false, label: 'Telefone' },
          { name: 'assunto', type: 'select', required: true, label: 'Assunto',
            options: ['Dúvida Geral', 'Suporte Técnico', 'Solicitação de Recurso', 'Reclamação', 'Sugestão'] },
          { name: 'mensagem', type: 'textarea', required: true, label: 'Mensagem' }
        ],
        validation: {
          email: 'required|email',
          telefone: 'phone'
        }
      }
    };

    // Cache por 1 hora
    formCache.set('all_form_configs', configs, 60 * 60 * 1000);

    return configs;
  }

  /**
   * Precarregar formulários comuns
   */
  async preloadCommonForms(): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    
    const commonForms = ['usuario', 'escola', 'aluno'];
    
    try {
      console.log('🚀 Iniciando preload de formulários comuns...');
      
      const preloadPromises = commonForms.map(formType => 
        this.loadForm(formType, { preload: true }).catch(error => {
          console.warn(`Falha no preload de ${formType}:`, error);
          return null;
        })
      );

      await Promise.all(preloadPromises);
      console.log('✅ Preload de formulários concluído');
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Adicionar formulário à fila de preload
   */
  addToPreloadQueue(formType: string): void {
    if (!this.preloadQueue.includes(formType)) {
      this.preloadQueue.push(formType);
    }
  }

  /**
   * Processar fila de preload
   */
  async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    try {
      while (this.preloadQueue.length > 0) {
        const formType = this.preloadQueue.shift()!;
        try {
          await this.loadForm(formType, { preload: true });
          console.log(`✅ Preload concluído: ${formType}`);
        } catch (error) {
          console.warn(`❌ Falha no preload: ${formType}`, error);
        }
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Verificar se um formulário está carregado
   */
  isLoaded(formType: string): boolean {
    return this.loadedModules.has(`lazy_form_${formType}`);
  }

  /**
   * Limpar módulos carregados
   */
  clearLoaded(): void {
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }

  /**
   * Obter estatísticas de carregamento
   */
  getStats(): {
    loadedCount: number;
    totalSize: number;
    averageLoadTime: number;
    cacheHitRate: number;
  } {
    const loaded = Array.from(this.loadedModules.values());
    const totalSize = loaded.reduce((sum, module) => sum + module.size, 0);
    
    return {
      loadedCount: loaded.length,
      totalSize,
      averageLoadTime: 0, // Pode ser implementado com métricas
      cacheHitRate: 0 // Pode ser implementado com contadores
    };
  }

  /**
   * Utilitário para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===== HOOK REACT PARA LAZY LOADING =====
import React from 'react';

export function useLazyForm(formType: string) {
  const [config, setConfig] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadForm = React.useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const formConfig = await lazyLoader.loadForm(formType);
      setConfig(formConfig);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [formType, loading]);

  React.useEffect(() => {
    // Verificar se já está carregado
    if (lazyLoader.isLoaded(formType)) {
      const cached = formCache.getFormConfig(formType);
      if (cached) {
        setConfig(cached);
        return;
      }
    }

    // Carregar se necessário
    loadForm();
  }, [formType, loadForm]);

  return { config, loading, error, reload: loadForm };
}

// ===== INSTÂNCIA GLOBAL =====
export const lazyLoader = new LazyLoader();

// ===== UTILITÁRIOS DE COMPONENTE =====
interface LazyFormWrapperProps {
  formType: string;
  fallback?: React.ReactNode;
  children: (config: any) => React.ReactNode;
}

export const LazyFormWrapper: React.FC<LazyFormWrapperProps> = ({ formType, fallback, children }) => {
  const { config, loading, error } = useLazyForm(formType);

  if (loading) {
    return fallback || React.createElement('div', { className: 'flex items-center justify-center p-8' },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }),
      React.createElement('span', { className: 'ml-2 text-gray-600' }, 'Carregando formulário...')
    );
  }

  if (error) {
    return React.createElement('div', { className: 'text-center p-8 text-red-600' },
      React.createElement('p', {}, `Erro ao carregar formulário: ${error.message}`),
      React.createElement('button', {
        onClick: () => window.location.reload(),
        className: 'mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
      }, 'Tentar Novamente')
    );
  }

  if (!config) {
    return fallback || React.createElement('div', {}, 'Formulário não encontrado');
  }

  return React.createElement(React.Fragment, {}, children(config));
};

export default LazyLoader;
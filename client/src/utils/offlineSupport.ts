/**
 * SISTEMA DE SUPORTE OFFLINE - IAPRENDER
 * 
 * Sincronização automática e armazenamento local para funcionamento offline
 */

import { formCache } from './cache';

interface OfflineQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingItems: number;
  syncInProgress: boolean;
}

class OfflineManager {
  private syncQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private readonly STORAGE_KEY = 'iaprender_offline_queue';
  private readonly FORM_STORAGE_KEY = 'iaprender_offline_forms';
  private syncStatusCallbacks: ((status: SyncStatus) => void)[] = [];

  constructor() {
    this.loadQueueFromStorage();
    this.setupOnlineDetection();
    this.setupPeriodicSync();
  }

  /**
   * Configurar detecção de conectividade
   */
  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Conectividade restaurada');
      this.isOnline = true;
      this.notifyStatusChange();
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📡 Modo offline ativado');
      this.isOnline = false;
      this.notifyStatusChange();
    });
  }

  /**
   * Configurar sincronização periódica
   */
  private setupPeriodicSync(): void {
    // Tentar sincronizar a cada 30 segundos quando online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  /**
   * Salvar dados offline
   */
  async saveOffline(
    action: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any,
    options: { immediate?: boolean; maxRetries?: number } = {}
  ): Promise<string> {
    const queueItem: OfflineQueueItem = {
      id: this.generateId(),
      action,
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3
    };

    this.syncQueue.push(queueItem);
    this.saveQueueToStorage();
    this.notifyStatusChange();

    console.log(`💾 Dados salvos offline: ${action} ${endpoint}`);

    // Tentar sincronizar imediatamente se online
    if (this.isOnline && (options.immediate || this.syncQueue.length === 1)) {
      this.processSyncQueue();
    }

    return queueItem.id;
  }

  /**
   * Salvar formulário offline
   */
  saveFormOffline(formId: string, formData: any, formType: string): void {
    const offlineForms = this.getOfflineForms();
    
    offlineForms[formId] = {
      data: formData,
      type: formType,
      timestamp: Date.now(),
      synced: false
    };

    localStorage.setItem(this.FORM_STORAGE_KEY, JSON.stringify(offlineForms));
    console.log(`📝 Formulário salvo offline: ${formType} (${formId})`);
  }

  /**
   * Recuperar formulários offline
   */
  getOfflineForms(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.FORM_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Erro ao carregar formulários offline:', error);
      return {};
    }
  }

  /**
   * Processar fila de sincronização
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.notifyStatusChange();

    console.log(`🔄 Iniciando sincronização de ${this.syncQueue.length} itens`);

    const itemsToProcess = [...this.syncQueue];
    const successfulItems: string[] = [];

    for (const item of itemsToProcess) {
      try {
        await this.syncItem(item);
        successfulItems.push(item.id);
        console.log(`✅ Sincronizado: ${item.action} ${item.endpoint}`);
      } catch (error) {
        console.warn(`❌ Falha na sincronização: ${item.action} ${item.endpoint}`, error);
        
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          console.error(`🚨 Item removido da fila após ${item.maxRetries} tentativas:`, item);
          successfulItems.push(item.id); // Remove from queue
        }
      }
    }

    // Remover itens sincronizados da fila
    this.syncQueue = this.syncQueue.filter(item => !successfulItems.includes(item.id));
    this.saveQueueToStorage();

    this.syncInProgress = false;
    this.notifyStatusChange();

    console.log(`🎯 Sincronização concluída. ${successfulItems.length} itens processados`);
  }

  /**
   * Sincronizar item individual
   */
  private async syncItem(item: OfflineQueueItem): Promise<void> {
    const response = await fetch(item.endpoint, {
      method: this.getHttpMethod(item.action),
      headers: {
        'Content-Type': 'application/json',
        // Adicionar headers de autenticação se disponível
        ...(this.getAuthHeaders())
      },
      body: item.action !== 'delete' ? JSON.stringify(item.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obter método HTTP baseado na ação
   */
  private getHttpMethod(action: string): string {
    switch (action) {
      case 'create': return 'POST';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
      default: return 'POST';
    }
  }

  /**
   * Obter headers de autenticação
   */
  private getAuthHeaders(): Record<string, string> {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }

  /**
   * Carregar fila do localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        console.log(`📂 Carregados ${this.syncQueue.length} itens da fila offline`);
      }
    } catch (error) {
      console.warn('Erro ao carregar fila offline:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Salvar fila no localStorage
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.warn('Erro ao salvar fila offline:', error);
    }
  }

  /**
   * Gerar ID único
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notificar mudança de status
   */
  private notifyStatusChange(): void {
    const status: SyncStatus = {
      isOnline: this.isOnline,
      lastSync: Date.now(),
      pendingItems: this.syncQueue.length,
      syncInProgress: this.syncInProgress
    };

    this.syncStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.warn('Erro no callback de status:', error);
      }
    });
  }

  /**
   * Registrar callback de mudança de status
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncStatusCallbacks.push(callback);
    
    // Retornar função para cancelar inscrição
    return () => {
      const index = this.syncStatusCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncStatusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Forçar sincronização
   */
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    } else {
      throw new Error('Não é possível sincronizar offline');
    }
  }

  /**
   * Limpar dados offline
   */
  clearOfflineData(): void {
    this.syncQueue = [];
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.FORM_STORAGE_KEY);
    this.notifyStatusChange();
    console.log('🗑️ Dados offline limpos');
  }

  /**
   * Obter status atual
   */
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSync: Date.now(),
      pendingItems: this.syncQueue.length,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Verificar se há dados pendentes
   */
  hasPendingData(): boolean {
    return this.syncQueue.length > 0 || Object.keys(this.getOfflineForms()).length > 0;
  }
}

// ===== HOOK REACT PARA OFFLINE =====
import React from 'react';

export function useOfflineStatus() {
  const [status, setStatus] = React.useState<SyncStatus>(offlineManager.getStatus());

  React.useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const saveOffline = React.useCallback(
    (action: 'create' | 'update' | 'delete', endpoint: string, data: any) => {
      return offlineManager.saveOffline(action, endpoint, data);
    },
    []
  );

  const forcSync = React.useCallback(() => {
    return offlineManager.forcSync();
  }, []);

  return {
    ...status,
    saveOffline,
    forcSync,
    hasPendingData: offlineManager.hasPendingData()
  };
}

// ===== HOOK PARA FORMULÁRIOS OFFLINE =====
export function useOfflineForm(formId: string, formType: string) {
  const [savedData, setSavedData] = React.useState<any>(null);
  const [lastSaved, setLastSaved] = React.useState<number | null>(null);

  // Carregar dados salvos na inicialização
  React.useEffect(() => {
    const offlineForms = offlineManager.getOfflineForms();
    const formData = offlineForms[formId];
    
    if (formData && formData.type === formType) {
      setSavedData(formData.data);
      setLastSaved(formData.timestamp);
    }
  }, [formId, formType]);

  const saveLocally = React.useCallback((data: any) => {
    offlineManager.saveFormOffline(formId, data, formType);
    setSavedData(data);
    setLastSaved(Date.now());
  }, [formId, formType]);

  const clearLocal = React.useCallback(() => {
    const offlineForms = offlineManager.getOfflineForms();
    delete offlineForms[formId];
    localStorage.setItem('iaprender_offline_forms', JSON.stringify(offlineForms));
    setSavedData(null);
    setLastSaved(null);
  }, [formId]);

  return {
    savedData,
    lastSaved,
    saveLocally,
    clearLocal,
    hasSavedData: savedData !== null
  };
}

// ===== COMPONENTE DE STATUS OFFLINE =====
export const OfflineStatusIndicator: React.FC = () => {
  const { isOnline, pendingItems, syncInProgress } = useOfflineStatus();

  if (isOnline && pendingItems === 0) {
    return null; // Não mostrar quando online e sem dados pendentes
  }

  return React.createElement('div', {
    className: `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${
      isOnline ? 'bg-blue-600' : 'bg-red-600'
    }`
  },
    React.createElement('div', { className: 'flex items-center space-x-2' },
      syncInProgress 
        ? React.createElement('div', { className: 'animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' })
        : React.createElement('div', { className: `w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}` }),
      React.createElement('span', {},
        syncInProgress 
          ? 'Sincronizando...' 
          : isOnline 
            ? pendingItems > 0 
              ? `${pendingItems} itens pendentes`
              : 'Online'
            : 'Modo offline'
      )
    )
  );
};

// ===== INSTÂNCIA GLOBAL =====
export const offlineManager = new OfflineManager();

export default OfflineManager;
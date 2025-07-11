/**
 * EXEMPLO COMPLETO - COGNITO SYNC SERVICE
 * 
 * Demonstração das funcionalidades do serviço de sincronização AWS Cognito
 */

import CognitoSyncService from '../services/CognitoSyncService';

/**
 * 1. EXEMPLO: VERIFICAR STATUS DO SERVIÇO
 */
async function exemploVerificarStatus() {
  console.log('🔍 1. VERIFICANDO STATUS DO SERVIÇO');
  
  try {
    const syncService = new CognitoSyncService();
    
    // Testar conectividade com AWS Cognito
    const connectionTest = await syncService.testConnection();
    console.log('📊 Teste de Conexão:', connectionTest);
    
    // Obter estatísticas atuais
    const statistics = await syncService.getSyncStatistics();
    console.log('📊 Estatísticas:', statistics);
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
  }
}

/**
 * 2. EXEMPLO: EXECUTAR SINCRONIZAÇÃO COMPLETA
 */
async function exemploSincronizacaoCompleta() {
  console.log('🔄 2. EXECUTANDO SINCRONIZAÇÃO COMPLETA');
  
  try {
    const syncService = new CognitoSyncService();
    
    // Executar sincronização
    const result = await syncService.syncUsers();
    
    console.log('📊 Resultado da Sincronização:');
    console.log('- Sucesso:', result.success);
    console.log('- Usuários Cognito encontrados:', result.statistics.cognito_users_found);
    console.log('- Usuários locais encontrados:', result.statistics.local_users_found);
    console.log('- Usuários criados:', result.statistics.users_created);
    console.log('- Usuários atualizados:', result.statistics.users_updated);
    console.log('- Usuários desativados:', result.statistics.users_deactivated);
    console.log('- Erros:', result.statistics.errors);
    
    if (result.operations.length > 0) {
      console.log('📝 Operações realizadas:');
      result.operations.forEach(op => {
        console.log(`  - ${op.operation}: ${op.email} (${op.message})`);
      });
    }
    
    if (result.errors.length > 0) {
      console.log('⚠️ Erros encontrados:');
      result.errors.forEach(error => {
        console.log(`  - ${error.email || error.cognito_id}: ${error.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

/**
 * 3. EXEMPLO: USAR VIA REQUISIÇÕES HTTP
 */
function exemploRequisitionsHTTP() {
  console.log('🌐 3. EXEMPLOS DE REQUISIÇÕES HTTP');
  
  console.log(`
## ENDPOINTS DISPONÍVEIS:

### 1. Health Check (Público)
GET http://localhost:5000/api/cognito-sync/health

### 2. Status do Serviço (Público)
GET http://localhost:5000/api/cognito-sync/status

### 3. Estatísticas (Requer Autenticação)
GET http://localhost:5000/api/cognito-sync/statistics
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN

### 4. Teste de Conexão (Requer Autenticação)
GET http://localhost:5000/api/cognito-sync/test-connection
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN

### 5. Executar Sincronização (Requer Autenticação)
POST http://localhost:5000/api/cognito-sync/sync
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

### 6. Sincronização Completa com Paginação (Requer Autenticação)
POST http://localhost:5000/api/cognito-sync/sync-all
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

## EXEMPLOS CURL:

# Health Check
curl http://localhost:5000/api/cognito-sync/health

# Status
curl http://localhost:5000/api/cognito-sync/status

# Sincronização padrão (com token)
curl -X POST http://localhost:5000/api/cognito-sync/sync \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json"

# Sincronização completa com paginação (com token) - NOVO!
curl -X POST http://localhost:5000/api/cognito-sync/sync-all \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json"

# Estatísticas (com token)
curl http://localhost:5000/api/cognito-sync/statistics \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
  `);
}

/**
 * 4. EXEMPLO: INTEGRAÇÃO COM SISTEMA FRONTEND
 */
function exemploIntegracaoFrontend() {
  console.log('⚛️ 4. EXEMPLO DE INTEGRAÇÃO FRONTEND');
  
  console.log(`
## JAVASCRIPT/TYPESCRIPT FRONTEND:

\`\`\`typescript
// Hook React para sincronização Cognito
import { useState, useEffect } from 'react';

interface SyncStatus {
  healthy: boolean;
  cognitoUsers: number;
  localUsers: number;
  syncNeeded: boolean;
  lastSync?: string;
}

export function useCognitoSync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/cognito-sync/status');
      const data = await response.json();
      
      setStatus({
        healthy: data.status === 'healthy',
        cognitoUsers: data.services.sync_statistics.data?.cognito_users || 0,
        localUsers: data.services.sync_statistics.data?.local_users || 0,
        syncNeeded: data.services.sync_statistics.data?.sync_needed || false
      });
    } catch (err) {
      setError('Erro ao verificar status');
    }
  };

  const executeSync = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/cognito-sync/sync', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        await checkStatus(); // Atualizar status após sincronização
      } else {
        setError('Sincronização parcialmente falhada');
      }
      
      return result;
    } catch (err) {
      setError('Erro na sincronização');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check a cada 30s
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    loading,
    error,
    checkStatus,
    executeSync
  };
}

// Componente React
function CognitoSyncDashboard() {
  const { status, loading, error, executeSync } = useCognitoSync();

  if (!status) return <div>Carregando status...</div>;

  return (
    <div className="cognito-sync-dashboard">
      <h2>Sincronização AWS Cognito</h2>
      
      <div className="status-cards">
        <div className="card">
          <h3>Status</h3>
          <span className={\`badge \${status.healthy ? 'success' : 'warning'}\`}>
            {status.healthy ? 'Saudável' : 'Atenção Necessária'}
          </span>
        </div>
        
        <div className="card">
          <h3>Usuários Cognito</h3>
          <p>{status.cognitoUsers}</p>
        </div>
        
        <div className="card">
          <h3>Usuários Locais</h3>
          <p>{status.localUsers}</p>
        </div>
        
        <div className="card">
          <h3>Sincronização</h3>
          <p>{status.syncNeeded ? 'Necessária' : 'Em Dia'}</p>
        </div>
      </div>
      
      <div className="actions">
        <button 
          onClick={executeSync} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Sincronizando...' : 'Executar Sincronização'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}
\`\`\`
  `);
}

/**
 * 5. EXEMPLO: MIDDLEWARE EXPRESS PERSONALIZADO
 */
function exemploMiddlewareExpress() {
  console.log('🔧 5. EXEMPLO DE MIDDLEWARE EXPRESS');
  
  console.log(`
## MIDDLEWARE PARA AUTO-SINCRONIZAÇÃO:

\`\`\`typescript
import { Request, Response, NextFunction } from 'express';
import CognitoSyncService from '../services/CognitoSyncService';

interface SyncRequest extends Request {
  cognitoSync?: CognitoSyncService;
}

// Middleware para adicionar instância do sync service
export function cognitoSyncMiddleware(req: SyncRequest, res: Response, next: NextFunction) {
  req.cognitoSync = new CognitoSyncService();
  next();
}

// Middleware para auto-sincronização em rotas específicas
export function autoSyncMiddleware(options: { intervalMinutes?: number } = {}) {
  const intervalMs = (options.intervalMinutes || 60) * 60 * 1000; // Default: 1 hora
  let lastSync = 0;
  
  return async (req: SyncRequest, res: Response, next: NextFunction) => {
    const now = Date.now();
    
    if (now - lastSync > intervalMs) {
      try {
        console.log('🔄 Executando auto-sincronização...');
        const syncService = req.cognitoSync || new CognitoSyncService();
        
        // Sincronização em background (não bloqueia a requisição)
        syncService.syncUsers().then(result => {
          console.log('✅ Auto-sincronização concluída:', result.statistics);
        }).catch(error => {
          console.error('❌ Erro na auto-sincronização:', error);
        });
        
        lastSync = now;
      } catch (error) {
        console.error('❌ Erro ao iniciar auto-sincronização:', error);
      }
    }
    
    next();
  };
}

// Uso no Express app
app.use('/api/admin', cognitoSyncMiddleware);
app.use('/api/admin', autoSyncMiddleware({ intervalMinutes: 30 }));
\`\`\`
  `);
}

/**
 * 6. EXEMPLO: MONITORAMENTO E ALERTAS
 */
function exemploMonitoramentoAlertas() {
  console.log('📊 6. EXEMPLO DE MONITORAMENTO E ALERTAS');
  
  console.log(`
## SISTEMA DE MONITORAMENTO:

\`\`\`typescript
class CognitoSyncMonitor {
  private syncService: CognitoSyncService;
  private alertThresholds = {
    maxErrors: 5,
    maxSyncDifference: 10,
    maxSyncTimeMinutes: 60
  };

  constructor() {
    this.syncService = new CognitoSyncService();
  }

  async checkHealth(): Promise<HealthReport> {
    const status = await this.syncService.getSyncStatistics();
    const connection = await this.syncService.testConnection();
    
    const alerts = [];
    
    // Verificar diferença entre usuários
    const userDifference = Math.abs(status.statistics.cognito_users - status.statistics.local_users);
    if (userDifference > this.alertThresholds.maxSyncDifference) {
      alerts.push({
        level: 'warning',
        message: \`Diferença de \${userDifference} usuários entre Cognito e banco local\`,
        action: 'Executar sincronização manual'
      });
    }
    
    // Verificar conectividade
    if (!connection.success) {
      alerts.push({
        level: 'error',
        message: 'Falha na conexão com AWS Cognito',
        action: 'Verificar credenciais AWS e permissões'
      });
    }
    
    return {
      timestamp: new Date().toISOString(),
      status: alerts.length === 0 ? 'healthy' : alerts.some(a => a.level === 'error') ? 'error' : 'warning',
      statistics: status.statistics,
      connection: connection.success,
      alerts
    };
  }

  async startMonitoring(intervalMinutes: number = 15) {
    console.log(\`🔍 Iniciando monitoramento (a cada \${intervalMinutes} minutos)\`);
    
    setInterval(async () => {
      try {
        const health = await this.checkHealth();
        
        if (health.alerts.length > 0) {
          console.warn('⚠️ Alertas encontrados:', health.alerts);
          // Aqui você pode integrar com sistemas de notificação:
          // - Slack
          // - Email
          // - Discord
          // - SMS
        }
        
        // Log de status
        console.log(\`📊 Status: \${health.status} | Cognito: \${health.statistics.cognito_users} | Local: \${health.statistics.local_users}\`);
        
      } catch (error) {
        console.error('❌ Erro no monitoramento:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Inicializar monitoramento
const monitor = new CognitoSyncMonitor();
monitor.startMonitoring(15); // A cada 15 minutos
\`\`\`
  `);
}

/**
 * FUNÇÃO PRINCIPAL - EXECUTAR TODOS OS EXEMPLOS
 */
export async function executarExemplosCognitoSync() {
  console.log('🚀 COGNITO SYNC SERVICE - EXEMPLOS COMPLETOS');
  console.log('='.repeat(60));
  
  await exemploVerificarStatus();
  console.log('\\n' + '='.repeat(60));
  
  await exemploSincronizacaoCompleta();
  console.log('\\n' + '='.repeat(60));
  
  exemploRequisitionsHTTP();
  console.log('\\n' + '='.repeat(60));
  
  exemploIntegracaoFrontend();
  console.log('\\n' + '='.repeat(60));
  
  exemploMiddlewareExpress();
  console.log('\\n' + '='.repeat(60));
  
  exemploMonitoramentoAlertas();
  console.log('\\n' + '='.repeat(60));
  
  console.log('✅ Todos os exemplos foram demonstrados!');
}

// Exportar para uso individual
export {
  exemploVerificarStatus,
  exemploSincronizacaoCompleta,
  exemploRequisitionsHTTP,
  exemploIntegracaoFrontend,
  exemploMiddlewareExpress,
  exemploMonitoramentoAlertas
};

export default CognitoSyncService;
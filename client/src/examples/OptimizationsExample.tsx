/**
 * EXEMPLO COMPLETO DE OTIMIZAÇÕES - IAPRENDER
 * 
 * Demonstração de todas as otimizações de performance implementadas
 */

import React, { useState, useEffect } from 'react';
import { 
  debounce, 
  useAdvancedSearch, 
  PerformantSearchField,
  usePerformanceMonitor,
  PerformanceMonitor,
  memoizer 
} from '../utils/performance';
import { useLazyForm, LazyFormWrapper, lazyLoader } from '../utils/lazyLoader';
import { useOfflineStatus, OfflineStatusIndicator, useOfflineForm } from '../utils/offlineSupport';
import { globalCache, formCache, useCachedData } from '../utils/cache';

// Dados de exemplo para demonstração
const exemploUsuarios = [
  { id: 1, nome: 'João Silva', email: 'joao@escola.com', tipo: 'Professor', escola: 'EMEF João XXIII' },
  { id: 2, nome: 'Maria Santos', email: 'maria@gestao.com', tipo: 'Gestor', escola: 'Secretaria Municipal' },
  { id: 3, nome: 'Pedro Oliveira', email: 'pedro@escola.com', tipo: 'Diretor', escola: 'EMEF São José' },
  { id: 4, nome: 'Ana Costa', email: 'ana@escola.com', tipo: 'Professor', escola: 'EMEF Maria Clara' },
  { id: 5, nome: 'Carlos Ferreira', email: 'carlos@aluno.com', tipo: 'Aluno', escola: 'EMEF João XXIII' },
  { id: 6, nome: 'Lucia Pereira', email: 'lucia@escola.com', tipo: 'Professor', escola: 'EMEF São José' },
  { id: 7, nome: 'Roberto Lima', email: 'roberto@gestao.com', tipo: 'Gestor', escola: 'Secretaria Estadual' },
  { id: 8, nome: 'Fernanda Souza', email: 'fernanda@aluno.com', tipo: 'Aluno', escola: 'EMEF Maria Clara' }
];

// ===== COMPONENTE PRINCIPAL =====
const OptimizationsExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cache' | 'lazy' | 'offline' | 'performance'>('cache');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Otimizações IAprender
          </h1>
          <p className="text-gray-600">
            Demonstração completa de cache, lazy loading, suporte offline e performance
          </p>
        </div>

        {/* Indicador de Status Offline */}
        <OfflineStatusIndicator />

        {/* Navegação por Abas */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { key: 'cache', label: '📦 Sistema de Cache', desc: 'Cache em memória e localStorage' },
                { key: 'lazy', label: '🚀 Lazy Loading', desc: 'Carregamento sob demanda' },
                { key: 'offline', label: '📡 Suporte Offline', desc: 'Sincronização automática' },
                { key: 'performance', label: '⚡ Performance', desc: 'Debounce e otimizações' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div>{tab.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{tab.desc}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="space-y-6">
          {activeTab === 'cache' && <CacheExample />}
          {activeTab === 'lazy' && <LazyLoadingExample />}
          {activeTab === 'offline' && <OfflineExample />}
          {activeTab === 'performance' && <PerformanceExample />}
        </div>
      </div>
    </div>
  );
};

// ===== EXEMPLO DE CACHE =====
const CacheExample: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [cacheKey, setCacheKey] = useState('exemplo_usuario_1');
  const [cacheValue, setCacheValue] = useState('');

  // Função simulada para buscar dados
  const fetchUserData = async (userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
    return { id: userId, nome: 'Usuário Exemplo', email: 'usuario@exemplo.com', timestamp: Date.now() };
  };

  // Hook de cache personalizado
  const { data: userData, loading, error, refresh } = useCachedData(
    `user_${cacheKey}`,
    () => fetchUserData(cacheKey),
    5 * 60 * 1000 // 5 minutos TTL
  );

  useEffect(() => {
    const updateStats = () => {
      setStats({
        global: globalCache.getStats(),
        form: formCache.getStats()
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const testCache = () => {
    // Testar diferentes operações de cache
    globalCache.set('teste_string', 'Valor de teste', 30000);
    formCache.setFormConfig('teste', { campos: ['nome', 'email'] });
    formCache.setUserData('user123', { nome: 'João', role: 'admin' });
    
    setStats({
      global: globalCache.getStats(),
      form: formCache.getStats()
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controles de Cache */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Controles de Cache</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chave do Cache
            </label>
            <input
              type="text"
              value={cacheKey}
              onChange={(e) => setCacheKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="exemplo_usuario_1"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Buscar Dados'}
            </button>
            
            <button
              onClick={testCache}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Testar Cache
            </button>
            
            <button
              onClick={() => {
                globalCache.clear();
                formCache.clear();
                setStats({ global: globalCache.getStats(), form: formCache.getStats() });
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Limpar Cache
            </button>
          </div>

          {/* Resultado dos Dados */}
          {userData && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-medium text-green-800">Dados Carregados:</h4>
              <pre className="text-sm text-green-700 mt-1">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-800">Erro:</h4>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas do Cache */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Estatísticas do Cache</h3>
        
        {stats && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Cache Global</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="font-medium text-blue-800">Memória</div>
                  <div className="text-blue-600">{stats.global.memorySize} itens</div>
                </div>
                <div className="p-3 bg-green-50 rounded-md">
                  <div className="font-medium text-green-800">Total</div>
                  <div className="text-green-600">{stats.global.totalItems} itens</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-md">
                  <div className="font-medium text-yellow-800">localStorage</div>
                  <div className="text-yellow-600">{Math.round(stats.global.localStorageSize / 1024)} KB</div>
                </div>
                <div className="p-3 bg-red-50 rounded-md">
                  <div className="font-medium text-red-800">Expirados</div>
                  <div className="text-red-600">{stats.global.expiredItems} itens</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Cache de Formulários</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-purple-50 rounded-md">
                  <div className="font-medium text-purple-800">Memória</div>
                  <div className="text-purple-600">{stats.form.memorySize} itens</div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-md">
                  <div className="font-medium text-indigo-800">Total</div>
                  <div className="text-indigo-600">{stats.form.totalItems} itens</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== EXEMPLO DE LAZY LOADING =====
const LazyLoadingExample: React.FC = () => {
  const [selectedForm, setSelectedForm] = useState<string>('usuario');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const updateStats = () => {
      setStats(lazyLoader.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const preloadForms = async () => {
    await lazyLoader.preloadCommonForms();
    setStats(lazyLoader.getStats());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controles de Lazy Loading */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Lazy Loading de Formulários</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Formulário
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="usuario">👤 Usuário</option>
              <option value="escola">🏫 Escola</option>
              <option value="aluno">👨‍🎓 Aluno</option>
              <option value="professor">👨‍🏫 Professor</option>
              <option value="contato">📧 Contato</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={preloadForms}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Precarregar Comuns
            </button>
            
            <button
              onClick={() => {
                lazyLoader.clearLoaded();
                setStats(lazyLoader.getStats());
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Limpar Cache
            </button>
          </div>

          {/* Estatísticas */}
          {stats && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">Estatísticas de Loading</h4>
              <div className="text-sm space-y-1">
                <div>📦 Formulários carregados: <span className="font-mono">{stats.loadedCount}</span></div>
                <div>💾 Tamanho total: <span className="font-mono">{Math.round(stats.totalSize / 1024)} KB</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demonstração do Formulário */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Formulário Carregado</h3>
        
        <LazyFormWrapper 
          formType={selectedForm}
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando formulário...</span>
            </div>
          }
        >
          {(config) => (
            <div>
              <h4 className="font-medium text-gray-800 mb-3">{config.title}</h4>
              <div className="space-y-3">
                {config.fields.map((field: any, index: number) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-md">
                    <div className="font-medium text-sm text-gray-700">{field.label}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Tipo: {field.type} | Obrigatório: {field.required ? 'Sim' : 'Não'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-700">
                  ✅ Formulário carregado com sucesso via lazy loading
                </div>
              </div>
            </div>
          )}
        </LazyFormWrapper>
      </div>
    </div>
  );
};

// ===== EXEMPLO DE SUPORTE OFFLINE =====
const OfflineExample: React.FC = () => {
  const offlineStatus = useOfflineStatus();
  const { savedData, saveLocally, clearLocal, hasSavedData } = useOfflineForm('exemplo_form', 'usuario');
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '' });

  const simulateOfflineAction = () => {
    offlineStatus.saveOffline('create', '/api/usuarios', {
      nome: 'João Exemplo',
      email: 'joao@exemplo.com',
      tipo: 'Professor'
    });
  };

  const saveFormLocally = () => {
    saveLocally(formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status e Controles */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Status de Conectividade</h3>
        
        <div className="space-y-4">
          {/* Indicador de Status */}
          <div className={`p-4 rounded-lg border-l-4 ${
            offlineStatus.isOnline 
              ? 'bg-green-50 border-green-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                offlineStatus.isOnline ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <div>
                <h4 className={`font-medium ${
                  offlineStatus.isOnline ? 'text-green-800' : 'text-red-800'
                }`}>
                  {offlineStatus.isOnline ? 'Online' : 'Offline'}
                </h4>
                <p className={`text-sm ${
                  offlineStatus.isOnline ? 'text-green-600' : 'text-red-600'
                }`}>
                  {offlineStatus.syncInProgress 
                    ? 'Sincronizando dados...' 
                    : `${offlineStatus.pendingItems} itens pendentes`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="space-y-2">
            <button
              onClick={simulateOfflineAction}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Simular Ação Offline
            </button>
            
            {offlineStatus.isOnline && offlineStatus.pendingItems > 0 && (
              <button
                onClick={offlineStatus.forcSync}
                disabled={offlineStatus.syncInProgress}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {offlineStatus.syncInProgress ? 'Sincronizando...' : 'Forçar Sincronização'}
              </button>
            )}
          </div>

          {/* Informações de Debug */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="font-medium text-gray-800 mb-2">Debug Info</h4>
            <div className="text-sm space-y-1 font-mono">
              <div>Online: {offlineStatus.isOnline.toString()}</div>
              <div>Pendentes: {offlineStatus.pendingItems}</div>
              <div>Sincronizando: {offlineStatus.syncInProgress.toString()}</div>
              <div>Dados salvos: {offlineStatus.hasPendingData.toString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário Offline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Formulário com Suporte Offline</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({...formData, telefone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o telefone"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={saveFormLocally}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Salvar Localmente
            </button>
            
            {hasSavedData && (
              <button
                onClick={clearLocal}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Limpar Local
              </button>
            )}
          </div>

          {/* Dados Salvos */}
          {savedData && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-medium text-yellow-800">Dados Salvos Localmente:</h4>
              <pre className="text-sm text-yellow-700 mt-1">
                {JSON.stringify(savedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== EXEMPLO DE PERFORMANCE =====
const PerformanceExample: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const { startMeasurement, endMeasurement, getAverageTime } = usePerformanceMonitor('search');
  
  // Busca com debounce
  const searchResults = useAdvancedSearch(exemploUsuarios, searchTerm, {
    searchFields: ['nome', 'email', 'tipo', 'escola'],
    debounceMs: 300,
    useCache: true
  });

  // Medir performance da busca
  useEffect(() => {
    if (searchTerm) {
      startMeasurement();
      // Simular conclusão da busca
      setTimeout(() => {
        const duration = endMeasurement();
        setPerformanceStats({
          lastSearchTime: duration,
          averageSearchTime: getAverageTime(),
          totalStats: PerformanceMonitor.getAllStats()
        });
      }, 100);
    }
  }, [searchResults.filteredItems]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Campo de Busca */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Busca com Debounce e Cache</h3>
        
        <PerformantSearchField
          placeholder="Pesquisar usuários..."
          value={searchTerm}
          onChange={setSearchTerm}
          showResultCount={true}
          resultCount={searchResults.resultCount}
          className="mb-4"
        />

        {/* Indicador de Loading */}
        {searchResults.isSearching && (
          <div className="flex items-center text-blue-600 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Pesquisando...
          </div>
        )}

        {/* Resultados */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {searchResults.filteredItems.map((usuario) => (
            <div key={usuario.id} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{usuario.nome}</h4>
                  <p className="text-sm text-gray-600">{usuario.email}</p>
                  <p className="text-sm text-gray-500">{usuario.escola}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  usuario.tipo === 'Admin' ? 'bg-red-100 text-red-800' :
                  usuario.tipo === 'Gestor' ? 'bg-blue-100 text-blue-800' :
                  usuario.tipo === 'Diretor' ? 'bg-green-100 text-green-800' :
                  usuario.tipo === 'Professor' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {usuario.tipo}
                </span>
              </div>
            </div>
          ))}
          
          {searchResults.filteredItems.length === 0 && searchTerm && !searchResults.isSearching && (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário encontrado para "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas de Performance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Performance</h3>
        
        {performanceStats && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">Busca Atual</h4>
              <div className="text-sm space-y-1">
                <div>Termo: <span className="font-mono">"{searchResults.searchTerm}"</span></div>
                <div>Resultados: <span className="font-mono">{searchResults.resultCount}</span></div>
                <div>Tempo: <span className="font-mono">{performanceStats.lastSearchTime.toFixed(2)}ms</span></div>
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-medium text-green-800 mb-2">Média Global</h4>
              <div className="text-sm space-y-1">
                <div>Tempo médio: <span className="font-mono">{performanceStats.averageSearchTime.toFixed(2)}ms</span></div>
                <div>Cache: <span className="font-mono">{memoizer.getStats().size} itens</span></div>
                <div>Cache hits: <span className="font-mono">{memoizer.getStats().totalHits}</span></div>
              </div>
            </div>

            {/* Estatísticas Detalhadas */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">Estatísticas Detalhadas</h4>
              <div className="text-xs space-y-1 font-mono">
                {Object.entries(performanceStats.totalStats).map(([key, stats]: [string, any]) => (
                  <div key={key}>
                    {key}: {stats.average.toFixed(1)}ms (×{stats.count})
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                PerformanceMonitor.getAllStats();
                memoizer.clear();
                setPerformanceStats(null);
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Limpar Estatísticas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizationsExample;
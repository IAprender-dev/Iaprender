/**
 * DASHBOARD IAPRENDER - SISTEMA EDUCACIONAL
 * 
 * Script principal do dashboard com integração completa aos formulários
 * e sistema de autenticação
 */

// Estado global do dashboard
const dashboardState = {
  user: null,
  charts: {},
  formGenerators: {},
  data: {
    alunos: [],
    professores: [],
    escolas: [],
    stats: {}
  },
  isLoading: false
};

/**
 * Inicialização do Dashboard
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🎯 Inicializando Dashboard IAprender...');
    
    // Verificar autenticação
    await checkAuthentication();
    
    // Carregar dados iniciais
    await loadDashboardData();
    
    // Inicializar gráficos
    initializeCharts();
    
    // Configurar formulários nos modais
    initializeFormModals();
    
    console.log('✅ Dashboard inicializado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro na inicialização do dashboard:', error);
    showToast('Erro ao carregar dashboard', 'error');
    
    // Redirecionar para login se não autenticado
    if (error.message?.includes('authentication')) {
      redirectToLogin();
    }
  }
});

/**
 * Verificar autenticação do usuário
 */
async function checkAuthentication() {
  try {
    // Verificar se AuthManager está disponível
    if (typeof window.auth === 'undefined') {
      throw new Error('Sistema de autenticação não carregado');
    }
    
    // Verificar se usuário está autenticado
    if (!window.auth.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }
    
    // Obter dados do usuário
    const userData = await window.auth.getCurrentUser();
    dashboardState.user = userData;
    
    // Atualizar interface com dados do usuário
    updateUserInterface(userData);
    
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    throw new Error('authentication failed');
  }
}

/**
 * Atualizar interface com dados do usuário
 */
function updateUserInterface(user) {
  const userNameElement = document.getElementById('user-name');
  const userTypeElement = document.getElementById('user-type');
  
  if (userNameElement && user.nome) {
    userNameElement.textContent = user.nome;
  }
  
  if (userTypeElement && user.tipo_usuario) {
    const tipoFormatado = formatUserType(user.tipo_usuario);
    userTypeElement.textContent = tipoFormatado;
  }
}

/**
 * Formatar tipo de usuário para exibição
 */
function formatUserType(tipo) {
  const tipos = {
    'admin': 'Administrador',
    'gestor': 'Gestor Municipal',
    'diretor': 'Diretor',
    'professor': 'Professor',
    'aluno': 'Aluno'
  };
  
  return tipos[tipo] || tipo;
}

/**
 * Carregar dados do dashboard
 */
async function loadDashboardData() {
  try {
    dashboardState.isLoading = true;
    showLoadingState();
    
    // Carregar estatísticas
    await loadStatistics();
    
    // Carregar dados recentes
    await loadRecentData();
    
    dashboardState.isLoading = false;
    hideLoadingState();
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    dashboardState.isLoading = false;
    showToast('Erro ao carregar dados do dashboard', 'error');
  }
}

/**
 * Carregar estatísticas
 */
async function loadStatistics() {
  try {
    // Simular dados (em produção, viria da API)
    const stats = {
      totalAlunos: Math.floor(Math.random() * 500) + 100,
      totalProfessores: Math.floor(Math.random() * 50) + 20,
      totalEscolas: Math.floor(Math.random() * 10) + 5,
      taxaAprovacao: Math.floor(Math.random() * 20) + 80
    };
    
    // Atualizar interface
    updateStatistics(stats);
    
    // Salvar no estado
    dashboardState.data.stats = stats;
    
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    throw error;
  }
}

/**
 * Atualizar estatísticas na interface
 */
function updateStatistics(stats) {
  const elements = {
    'total-alunos': stats.totalAlunos,
    'total-professores': stats.totalProfessores,
    'total-escolas': stats.totalEscolas,
    'taxa-aprovacao': `${stats.taxaAprovacao}%`
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      // Animação de contagem
      animateCounter(element, value);
    }
  });
}

/**
 * Animação de contagem para números
 */
function animateCounter(element, finalValue) {
  const isPercentage = typeof finalValue === 'string' && finalValue.includes('%');
  const numericValue = isPercentage ? parseInt(finalValue) : finalValue;
  
  let currentValue = 0;
  const increment = Math.ceil(numericValue / 30);
  
  const timer = setInterval(() => {
    currentValue += increment;
    
    if (currentValue >= numericValue) {
      currentValue = numericValue;
      clearInterval(timer);
    }
    
    element.textContent = isPercentage ? `${currentValue}%` : currentValue;
  }, 50);
}

/**
 * Carregar dados recentes
 */
async function loadRecentData() {
  try {
    // Simular dados recentes (em produção, viria da API)
    const recentData = generateMockRecentData();
    
    // Atualizar tabela
    updateDataTable(recentData);
    
  } catch (error) {
    console.error('Erro ao carregar dados recentes:', error);
    throw error;
  }
}

/**
 * Gerar dados mock para demonstração
 */
function generateMockRecentData() {
  const data = [];
  
  // Adicionar alguns alunos
  for (let i = 0; i < 5; i++) {
    data.push({
      tipo: 'Aluno',
      nome: `Aluno ${i + 1}`,
      info: `Matrícula: 2024${String(i + 1).padStart(3, '0')}`,
      status: 'Ativo',
      data: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    });
  }
  
  // Adicionar alguns professores
  for (let i = 0; i < 3; i++) {
    data.push({
      tipo: 'Professor',
      nome: `Professor ${i + 1}`,
      info: `Disciplina: ${['Matemática', 'Português', 'Ciências'][i]}`,
      status: 'Ativo',
      data: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    });
  }
  
  // Adicionar algumas escolas
  for (let i = 0; i < 2; i++) {
    data.push({
      tipo: 'Escola',
      nome: `Escola ${i + 1}`,
      info: `INEP: 1234567${i}`,
      status: 'Ativa',
      data: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    });
  }
  
  return data.sort((a, b) => new Date(b.data) - new Date(a.data));
}

/**
 * Atualizar tabela de dados
 */
function updateDataTable(data) {
  const tableContainer = document.getElementById('data-table');
  
  if (!data || data.length === 0) {
    tableContainer.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
        <p>Nenhum dado encontrado</p>
      </div>
    `;
    return;
  }
  
  const tableHTML = `
    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Informação</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        ${data.map(item => `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(item.tipo)}">
                ${item.tipo}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.nome}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.info}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}">
                ${item.status}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.data}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  tableContainer.innerHTML = tableHTML;
  
  // Reinicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * Obter classe CSS para badge de tipo
 */
function getTypeBadgeClass(tipo) {
  const classes = {
    'Aluno': 'bg-blue-100 text-blue-800',
    'Professor': 'bg-green-100 text-green-800',
    'Escola': 'bg-purple-100 text-purple-800',
    'Diretor': 'bg-orange-100 text-orange-800',
    'Gestor': 'bg-red-100 text-red-800'
  };
  
  return classes[tipo] || 'bg-gray-100 text-gray-800';
}

/**
 * Obter classe CSS para badge de status
 */
function getStatusBadgeClass(status) {
  const classes = {
    'Ativo': 'bg-green-100 text-green-800',
    'Ativa': 'bg-green-100 text-green-800',
    'Inativo': 'bg-red-100 text-red-800',
    'Inativa': 'bg-red-100 text-red-800',
    'Pendente': 'bg-yellow-100 text-yellow-800'
  };
  
  return classes[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Inicializar gráficos
 */
function initializeCharts() {
  try {
    // Gráfico de matrículas
    initMatriculasChart();
    
    // Gráfico de distribuição por série
    initSeriesChart();
    
  } catch (error) {
    console.error('Erro ao inicializar gráficos:', error);
  }
}

/**
 * Inicializar gráfico de matrículas
 */
function initMatriculasChart() {
  const ctx = document.getElementById('chart-matriculas');
  if (!ctx) return;
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Matrículas',
        data: [65, 78, 90, 81, 96, 105],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
  
  dashboardState.charts.matriculas = chart;
}

/**
 * Inicializar gráfico de séries
 */
function initSeriesChart() {
  const ctx = document.getElementById('chart-series');
  if (!ctx) return;
  
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'],
      datasets: [{
        data: [30, 25, 20, 15, 10],
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#8B5CF6',
          '#F59E0B',
          '#EF4444'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
  
  dashboardState.charts.series = chart;
}

/**
 * Inicializar formulários nos modais
 */
function initializeFormModals() {
  try {
    // Verificar se FormGenerator está disponível
    if (typeof createFormGenerator === 'undefined') {
      console.warn('FormGenerator não encontrado. Modais de formulário não serão funcionais.');
      return;
    }
    
    // Verificar se configurações estão disponíveis
    if (typeof formConfigs === 'undefined') {
      console.warn('Configurações de formulário não encontradas.');
      return;
    }
    
    // Inicializar formulário de escola
    initEscolaForm();
    
    // Inicializar formulário de aluno
    initAlunoForm();
    
    // Inicializar formulário de professor
    initProfessorForm();
    
  } catch (error) {
    console.error('Erro ao inicializar formulários:', error);
  }
}

/**
 * Inicializar formulário de escola
 */
function initEscolaForm() {
  try {
    const generator = createFormGenerator('form-escola-container');
    const config = {
      ...formConfigs.escola,
      onSuccess: (response) => {
        console.log('✅ Escola cadastrada:', response);
        showToast('Escola cadastrada com sucesso!', 'success');
        closeModal('modal-escola');
        refreshData();
      },
      onError: (error) => {
        console.error('❌ Erro no cadastro da escola:', error);
        showToast(`Erro: ${error.message}`, 'error');
      }
    };
    
    generator.generate(config);
    dashboardState.formGenerators.escola = generator;
    
  } catch (error) {
    console.error('Erro ao inicializar formulário de escola:', error);
  }
}

/**
 * Inicializar formulário de aluno
 */
function initAlunoForm() {
  try {
    const generator = createFormGenerator('form-aluno-container');
    const config = {
      ...formConfigs.aluno,
      onSuccess: (response) => {
        console.log('✅ Aluno cadastrado:', response);
        showToast('Aluno cadastrado com sucesso!', 'success');
        closeModal('modal-aluno');
        refreshData();
      },
      onError: (error) => {
        console.error('❌ Erro no cadastro do aluno:', error);
        showToast(`Erro: ${error.message}`, 'error');
      }
    };
    
    generator.generate(config);
    dashboardState.formGenerators.aluno = generator;
    
  } catch (error) {
    console.error('Erro ao inicializar formulário de aluno:', error);
  }
}

/**
 * Inicializar formulário de professor
 */
function initProfessorForm() {
  try {
    const generator = createFormGenerator('form-professor-container');
    const config = {
      ...formConfigs.professor,
      onSuccess: (response) => {
        console.log('✅ Professor cadastrado:', response);
        showToast('Professor cadastrado com sucesso!', 'success');
        closeModal('modal-professor');
        refreshData();
      },
      onError: (error) => {
        console.error('❌ Erro no cadastro do professor:', error);
        showToast(`Erro: ${error.message}`, 'error');
      }
    };
    
    generator.generate(config);
    dashboardState.formGenerators.professor = generator;
    
  } catch (error) {
    console.error('Erro ao inicializar formulário de professor:', error);
  }
}

/**
 * Abrir modal
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Foco no modal para acessibilidade
    modal.focus();
  }
}

/**
 * Fechar modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

/**
 * Logout do usuário
 */
function handleLogout() {
  try {
    if (window.auth && typeof window.auth.logout === 'function') {
      window.auth.logout();
    } else {
      // Fallback manual
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      redirectToLogin();
    }
  } catch (error) {
    console.error('Erro no logout:', error);
    redirectToLogin();
  }
}

/**
 * Redirecionar para login
 */
function redirectToLogin() {
  window.location.href = '/login.html';
}

/**
 * Atualizar dados
 */
async function refreshData() {
  try {
    showToast('Atualizando dados...', 'info');
    await loadDashboardData();
    showToast('Dados atualizados com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    showToast('Erro ao atualizar dados', 'error');
  }
}

/**
 * Filtrar dados por tipo
 */
function filterData() {
  const filter = document.getElementById('data-filter').value;
  
  if (filter === 'all') {
    loadRecentData();
  } else {
    // Implementar filtro específico
    const filteredData = dashboardState.data.all?.filter(item => 
      item.tipo.toLowerCase() === filter
    ) || [];
    updateDataTable(filteredData);
  }
}

/**
 * Gerar relatório
 */
function generateReport() {
  const reportType = document.getElementById('report-type').value;
  const reportPeriod = document.getElementById('report-period').value;
  
  try {
    showToast('Gerando relatório...', 'info');
    
    // Simular geração de relatório
    setTimeout(() => {
      showToast(`Relatório de ${reportType} (${reportPeriod} dias) gerado com sucesso!`, 'success');
      closeModal('modal-relatorio');
      
      // Em produção, aqui faria o download do arquivo
      console.log(`Relatório gerado: ${reportType} - ${reportPeriod} dias`);
    }, 2000);
    
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    showToast('Erro ao gerar relatório', 'error');
  }
}

/**
 * Mostrar estado de carregamento
 */
function showLoadingState() {
  const stats = ['total-alunos', 'total-professores', 'total-escolas', 'taxa-aprovacao'];
  
  stats.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '<span class="loading-pulse">-</span>';
    }
  });
}

/**
 * Esconder estado de carregamento
 */
function hideLoadingState() {
  // Estado já é atualizado pela função updateStatistics
}

/**
 * Sistema de notificações toast
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info'
  };
  
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };
  
  toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform translate-x-full transition-transform duration-300`;
  toast.innerHTML = `
    <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Inicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Animação de entrada
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Remover automaticamente após 5 segundos
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.transform = 'translateX(full)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

/**
 * Fechar modais quando clicar fora
 */
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
    const modals = ['modal-escola', 'modal-aluno', 'modal-professor', 'modal-relatorio'];
    modals.forEach(modalId => {
      if (!e.target.querySelector(`#${modalId}`)) {
        closeModal(modalId);
      }
    });
  }
});

/**
 * Fechar modais com tecla ESC
 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modals = ['modal-escola', 'modal-aluno', 'modal-professor', 'modal-relatorio'];
    modals.forEach(closeModal);
  }
});

// Exportar funções globais necessárias
window.openModal = openModal;
window.closeModal = closeModal;
window.handleLogout = handleLogout;
window.refreshData = refreshData;
window.filterData = filterData;
window.generateReport = generateReport;
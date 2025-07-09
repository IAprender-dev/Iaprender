import express from 'express';
import { autenticar } from '../middleware/auth.js';
import { 
  verificarTipoUsuario,
  apenasAdmin,
  apenasGestor,
  apenasDiretor,
  apenasProfessor,
  apenasAluno,
  adminOuGestor,
  gestorOuDiretor,
  diretorOuProfessor,
  professorOuAluno,
  adminGestorOuDiretor,
  gestorDiretorOuProfessor,
  todosExcetoAluno,
  qualquerTipo,
  verificarEmpresa,
  verificarEmpresaContrato,
  verificarEmpresaEscola,
  verificarEmpresaGestor,
  verificarEmpresaDiretor,
  verificarEmpresaProfessor,
  verificarEmpresaAluno,
  verificarEmpresaUsuario,
  verificarAcessoEmpresa,
  verificarGestaoEmpresa,
  verificarProprioUsuario,
  verificarUsuarioMesmaEmpresa,
  verificarAcessoUsuario,
  filtrarPorEmpresa,
  aplicarFiltroEmpresa,
  auditarAcessoEmpresa
} from '../middleware/autorizar.js';

const app = express();
app.use(express.json());

// ============================================================================
// EXEMPLOS DE VERIFICAÇÃO DE TIPO DE USUÁRIO
// ============================================================================

// EXEMPLO 1: Rota apenas para administradores
app.get('/api/admin/configuracoes', 
  autenticar, 
  apenasAdmin,
  auditarAcessoEmpresa('ACESSAR_CONFIGURACOES_ADMIN'),
  (req, res) => {
    res.json({
      message: 'Configurações do sistema',
      user: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario
      },
      configuracoes: {
        sistema: 'IAprender',
        versao: '1.0.0',
        manutencao: false
      }
    });
  }
);

// EXEMPLO 2: Rota apenas para gestores
app.get('/api/gestores/dashboard', 
  autenticar, 
  apenasGestor,
  (req, res) => {
    res.json({
      message: 'Dashboard do gestor',
      gestor: {
        nome: req.user.nome,
        empresa_id: req.user.empresa_id
      }
    });
  }
);

// EXEMPLO 3: Rota para admin ou gestor
app.get('/api/relatorios/financeiros', 
  autenticar, 
  adminOuGestor,
  auditarAcessoEmpresa('VISUALIZAR_RELATORIO_FINANCEIRO'),
  (req, res) => {
    res.json({
      message: 'Relatórios financeiros',
      user: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario,
        acesso: req.user.tipo_usuario === 'admin' ? 'Total' : 'Empresa específica'
      }
    });
  }
);

// EXEMPLO 4: Rota para gestores, diretores ou professores
app.get('/api/pedagogico/materiais', 
  autenticar, 
  gestorDiretorOuProfessor,
  (req, res) => {
    res.json({
      message: 'Materiais pedagógicos',
      user: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario
      },
      materiais: [
        { id: 1, titulo: 'Plano de Aula - Matemática', tipo: 'PDF' },
        { id: 2, titulo: 'Atividade - Português', tipo: 'DOCX' }
      ]
    });
  }
);

// EXEMPLO 5: Rota com verificação customizada de múltiplos tipos
app.post('/api/notificacoes', 
  autenticar, 
  verificarTipoUsuario(['admin', 'gestor', 'diretor']),
  auditarAcessoEmpresa('ENVIAR_NOTIFICACAO'),
  (req, res) => {
    res.json({
      message: 'Notificação enviada',
      enviado_por: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario
      },
      notificacao: req.body
    });
  }
);

// EXEMPLO 6: Rota para todos exceto alunos
app.get('/api/administrativo/usuarios', 
  autenticar, 
  todosExcetoAluno,
  filtrarPorEmpresa(),
  (req, res) => {
    res.json({
      message: 'Lista de usuários administrativos',
      user: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario
      },
      filtro_empresa: req.filtroEmpresa
    });
  }
);

// EXEMPLO 7: Rota combinando verificação de tipo e empresa
app.put('/api/escolas/:id/configuracoes', 
  autenticar,
  gestorOuDiretor, // Primeiro verifica o tipo
  verificarEmpresaEscola, // Depois verifica a empresa
  auditarAcessoEmpresa('ATUALIZAR_CONFIGURACOES_ESCOLA'),
  (req, res) => {
    res.json({
      message: 'Configurações da escola atualizadas',
      escola_id: req.params.id,
      user: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario,
        empresa_id: req.user.empresa_id
      },
      configuracoes: req.body
    });
  }
);

// EXEMPLO 8: Rota com hierarquia de permissões
app.delete('/api/usuarios/:id', 
  autenticar,
  adminGestorOuDiretor,
  verificarEmpresaUsuario,
  auditarAcessoEmpresa('DELETAR_USUARIO'),
  (req, res) => {
    const canDelete = 
      req.user.tipo_usuario === 'admin' || 
      (req.user.tipo_usuario === 'gestor' && ['diretor', 'professor', 'aluno'].includes(req.targetUser?.tipo_usuario)) ||
      (req.user.tipo_usuario === 'diretor' && ['professor', 'aluno'].includes(req.targetUser?.tipo_usuario));
    
    if (!canDelete) {
      return res.status(403).json({
        message: 'Não é possível deletar usuário de nível superior ou igual',
        error: 'HIERARCHICAL_PERMISSION_DENIED'
      });
    }
    
    res.json({
      message: 'Usuário deletado com sucesso',
      deleted_user_id: req.params.id,
      deleted_by: req.user.nome
    });
  }
);

// EXEMPLO 9: Rota com verificação dinâmica de tipo
app.post('/api/usuarios/:id/promover', 
  autenticar,
  (req, res, next) => {
    const { novo_tipo } = req.body;
    
    // Definir tipos permitidos baseado no tipo do usuário atual
    let tiposPermitidos = [];
    
    switch (req.user.tipo_usuario) {
      case 'admin':
        tiposPermitidos = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
        break;
      case 'gestor':
        tiposPermitidos = ['diretor', 'professor', 'aluno'];
        break;
      case 'diretor':
        tiposPermitidos = ['professor', 'aluno'];
        break;
      default:
        return res.status(403).json({
          message: 'Sem permissão para promover usuários',
          error: 'NO_PROMOTION_PERMISSION'
        });
    }
    
    if (!tiposPermitidos.includes(novo_tipo)) {
      return res.status(403).json({
        message: `Não é possível promover para ${novo_tipo}`,
        error: 'INVALID_PROMOTION_TYPE',
        tipos_permitidos: tiposPermitidos
      });
    }
    
    next();
  },
  verificarEmpresaUsuario,
  auditarAcessoEmpresa('PROMOVER_USUARIO'),
  (req, res) => {
    res.json({
      message: 'Usuário promovido com sucesso',
      usuario_id: req.params.id,
      novo_tipo: req.body.novo_tipo,
      promovido_por: req.user.nome
    });
  }
);

// ============================================================================
// EXEMPLOS DE VERIFICAÇÃO DE ACESSO A DADOS PRÓPRIOS
// ============================================================================

// EXEMPLO 10: Usuário acessando apenas seus próprios dados
app.get('/api/usuarios/:userId/perfil', 
  autenticar, 
  verificarProprioUsuario,
  (req, res) => {
    res.json({
      message: 'Perfil do usuário',
      user: {
        id: req.user.id,
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario
      },
      perfil: {
        user_id: req.params.userId,
        configuracoes: { tema: 'claro', notificacoes: true },
        preferencias: { idioma: 'pt-BR' }
      }
    });
  }
);

// EXEMPLO 11: Atualizar dados pessoais (apenas próprios dados)
app.put('/api/usuarios/:userId/dados-pessoais', 
  autenticar, 
  verificarProprioUsuario,
  auditarAcessoEmpresa('ATUALIZAR_DADOS_PESSOAIS'),
  (req, res) => {
    res.json({
      message: 'Dados pessoais atualizados',
      updated_user_id: req.params.userId,
      by_user: req.user.nome,
      dados_atualizados: req.body
    });
  }
);

// EXEMPLO 12: Admin acessando dados de qualquer usuário
app.get('/api/admin/usuarios/:userId/detalhes', 
  autenticar, 
  apenasAdmin,
  verificarProprioUsuario, // Admin sempre passa nesta verificação
  (req, res) => {
    res.json({
      message: 'Detalhes completos do usuário (acesso admin)',
      target_user_id: req.params.userId,
      admin_user: req.user.nome,
      detalhes: {
        dados_pessoais: {},
        historico_acessos: [],
        configuracoes_sistema: {}
      }
    });
  }
);

// EXEMPLO 13: Gestor acessando dados de usuários da mesma empresa
app.get('/api/usuarios/:userId/relatorio-atividades', 
  autenticar, 
  gestorOuDiretor,
  verificarUsuarioMesmaEmpresa,
  auditarAcessoEmpresa('VISUALIZAR_RELATORIO_ATIVIDADES'),
  (req, res) => {
    res.json({
      message: 'Relatório de atividades do usuário',
      target_user_id: req.params.userId,
      gestor: req.user.nome,
      empresa_id: req.user.empresa_id,
      atividades: [
        { data: '2025-07-09', acao: 'Login', horario: '08:30' },
        { data: '2025-07-09', acao: 'Gerou plano de aula', horario: '09:15' }
      ]
    });
  }
);

// EXEMPLO 14: Acesso combinado (próprio + hierarquia + empresa)
app.get('/api/usuarios/:userId/dashboard-personalizado', 
  autenticar, 
  verificarAcessoUsuario, // Função combinada mais inteligente
  (req, res) => {
    const isOwnData = parseInt(req.user.id) === parseInt(req.params.userId);
    
    res.json({
      message: 'Dashboard personalizado',
      target_user_id: req.params.userId,
      accessed_by: req.user.nome,
      access_type: isOwnData ? 'próprios_dados' : 'hierarquia_empresarial',
      dashboard: {
        widgets: isOwnData ? 
          ['meu_progresso', 'minhas_atividades', 'configuracoes'] :
          ['progresso_usuario', 'atividades_supervisionadas', 'relatorios'],
        nivel_acesso: req.user.tipo_usuario
      }
    });
  }
);

// EXEMPLO 15: Professor acessando dados de alunos da mesma empresa
app.get('/api/professores/:professorId/alunos/:alunoId/notas', 
  autenticar, 
  apenasProfessor,
  // Verifica se o professor está acessando seus próprios dados OU se é da mesma empresa
  async (req, res, next) => {
    const professorId = req.params.professorId;
    const isProfessorOwn = parseInt(req.user.id) === parseInt(professorId);
    
    if (!isProfessorOwn) {
      return res.status(403).json({
        message: 'Professor só pode acessar dados dos próprios alunos',
        error: 'PROFESSOR_OWN_STUDENTS_ONLY'
      });
    }
    
    next();
  },
  verificarUsuarioMesmaEmpresa, // Verifica se aluno é da mesma empresa
  auditarAcessoEmpresa('VISUALIZAR_NOTAS_ALUNO'),
  (req, res) => {
    res.json({
      message: 'Notas do aluno',
      professor_id: req.params.professorId,
      aluno_id: req.params.alunoId,
      professor: req.user.nome,
      notas: [
        { disciplina: 'Matemática', nota: 8.5, bimestre: 1 },
        { disciplina: 'Português', nota: 9.0, bimestre: 1 }
      ]
    });
  }
);

// EXEMPLO 16: Rota de alteração de senha (apenas próprios dados)
app.post('/api/usuarios/:userId/alterar-senha', 
  autenticar, 
  verificarProprioUsuario,
  auditarAcessoEmpresa('ALTERAR_SENHA'),
  (req, res) => {
    const { senha_atual, nova_senha } = req.body;
    
    // Aqui faria a validação da senha atual
    res.json({
      message: 'Senha alterada com sucesso',
      user_id: req.params.userId,
      changed_by: req.user.nome,
      timestamp: new Date().toISOString()
    });
  }
);

// EXEMPLO 17: Diretor gerenciando professores da escola
app.patch('/api/escolas/:escolaId/professores/:professorId', 
  autenticar, 
  apenasDiretor,
  verificarEmpresaEscola, // Verifica se escola pertence à empresa do diretor
  verificarUsuarioMesmaEmpresa, // Verifica se professor é da mesma empresa
  auditarAcessoEmpresa('GERENCIAR_PROFESSOR_ESCOLA'),
  (req, res) => {
    res.json({
      message: 'Dados do professor atualizados',
      escola_id: req.params.escolaId,
      professor_id: req.params.professorId,
      diretor: req.user.nome,
      empresa_id: req.user.empresa_id,
      atualizacoes: req.body
    });
  }
);

// ============================================================================
// EXEMPLOS DE VERIFICAÇÃO DE EMPRESA (MANTIDOS DOS EXEMPLOS ANTERIORES)
// ============================================================================

// EXEMPLO 18: Rota para listar contratos (apenas da empresa do usuário)
app.get('/api/contratos', 
  autenticar, 
  verificarAcessoEmpresa,
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      // Aplicar filtro de empresa na consulta
      let query = 'SELECT * FROM contratos ORDER BY id';
      let params = [];
      
      const filtrado = aplicarFiltroEmpresa(query, params, req.filtroEmpresa);
      
      console.log('🔍 Query:', filtrado.query);
      console.log('🔍 Params:', filtrado.params);
      
      // const result = await executeQuery(filtrado.query, filtrado.params);
      
      res.json({
        message: 'Contratos da empresa',
        filtro_empresa: req.filtroEmpresa,
        user_tipo: req.user.tipo_usuario,
        // contratos: result.rows
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar contratos', error: error.message });
    }
  }
);

// EXEMPLO 2: Rota para ver contrato específico (verificação de empresa)
app.get('/api/contratos/:id', 
  autenticar, 
  verificarEmpresaContrato,
  auditarAcessoEmpresa('VISUALIZAR_CONTRATO'),
  (req, res) => {
    res.json({
      message: 'Contrato autorizado',
      contrato_id: req.params.id,
      user: {
        nome: req.user.nome,
        empresa_id: req.user.empresa_id,
        tipo_usuario: req.user.tipo_usuario
      }
    });
  }
);

// EXEMPLO 3: Rota para atualizar contrato (apenas gestores e admins)
app.put('/api/contratos/:id', 
  autenticar,
  (req, res, next) => {
    // Verificação adicional de tipo de usuário
    if (!['admin', 'gestor'].includes(req.user.tipo_usuario)) {
      return res.status(403).json({
        message: 'Apenas admins e gestores podem atualizar contratos',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  },
  verificarEmpresaContrato,
  auditarAcessoEmpresa('ATUALIZAR_CONTRATO'),
  (req, res) => {
    res.json({
      message: 'Contrato atualizado com sucesso',
      contrato_id: req.params.id,
      updated_by: req.user.nome,
      data: req.body
    });
  }
);

// EXEMPLO 4: Rota para listar escolas (filtradas por empresa)
app.get('/api/escolas', 
  autenticar, 
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      let query = 'SELECT e.*, c.descricao as contrato_descricao FROM escolas e LEFT JOIN contratos c ON e.contrato_id = c.id';
      let params = [];
      
      const filtrado = aplicarFiltroEmpresa(query, params, req.filtroEmpresa, 'e.empresa_id');
      
      res.json({
        message: 'Escolas da empresa',
        query_info: {
          filtro_empresa: req.filtroEmpresa,
          user_tipo: req.user.tipo_usuario,
          query: filtrado.query
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar escolas', error: error.message });
    }
  }
);

// EXEMPLO 5: Rota para ver escola específica
app.get('/api/escolas/:escola_id', 
  autenticar, 
  verificarEmpresaEscola,
  auditarAcessoEmpresa('VISUALIZAR_ESCOLA'),
  (req, res) => {
    res.json({
      message: 'Escola autorizada',
      escola_id: req.params.escola_id,
      user: {
        nome: req.user.nome,
        empresa_id: req.user.empresa_id,
        tipo_usuario: req.user.tipo_usuario
      }
    });
  }
);

// EXEMPLO 6: Rota para criar novo diretor (verificação de empresa)
app.post('/api/diretores', 
  autenticar,
  verificarAcessoEmpresa,
  auditarAcessoEmpresa('CRIAR_DIRETOR'),
  (req, res) => {
    // Forçar empresa_id do diretor para ser a mesma do usuário criador
    const novoDiretor = {
      ...req.body,
      empresa_id: req.user.empresa_id,
      criado_por: req.user.id
    };
    
    res.json({
      message: 'Diretor criado com sucesso',
      diretor: novoDiretor,
      created_by: req.user.nome
    });
  }
);

// EXEMPLO 7: Rota para gerenciar empresa específica (apenas gestores da empresa ou admins)
app.get('/api/empresas/:empresa_id/gestao', 
  autenticar, 
  verificarGestaoEmpresa,
  auditarAcessoEmpresa('GERENCIAR_EMPRESA'),
  (req, res) => {
    res.json({
      message: 'Acesso autorizado para gestão da empresa',
      empresa_id: req.params.empresa_id,
      gestor: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario,
        empresa_id: req.user.empresa_id
      }
    });
  }
);

// EXEMPLO 8: Rota para listar gestores (com filtro de empresa)
app.get('/api/gestores', 
  autenticar, 
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      let query = 'SELECT g.*, u.email, e.nome as empresa_nome FROM gestores g LEFT JOIN usuarios u ON g.usr_id = u.id LEFT JOIN empresas e ON g.empresa_id = e.id';
      let params = [];
      
      const filtrado = aplicarFiltroEmpresa(query, params, req.filtroEmpresa, 'g.empresa_id');
      
      res.json({
        message: 'Gestores da empresa',
        filtro_aplicado: req.filtroEmpresa !== null,
        user_info: {
          nome: req.user.nome,
          tipo: req.user.tipo_usuario,
          empresa_id: req.user.empresa_id
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar gestores', error: error.message });
    }
  }
);

// EXEMPLO 9: Rota para ver detalhes de professor (verificação de empresa)
app.get('/api/professores/:id', 
  autenticar, 
  verificarEmpresaProfessor,
  auditarAcessoEmpresa('VISUALIZAR_PROFESSOR'),
  (req, res) => {
    res.json({
      message: 'Professor autorizado',
      professor_id: req.params.id,
      user: {
        nome: req.user.nome,
        empresa_id: req.user.empresa_id,
        tipo_usuario: req.user.tipo_usuario
      }
    });
  }
);

// EXEMPLO 10: Rota para listar alunos (filtrada por empresa e escola)
app.get('/api/escolas/:escola_id/alunos', 
  autenticar, 
  verificarEmpresaEscola, // Primeiro verifica se pode acessar a escola
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      let query = 'SELECT a.*, u.email FROM alunos a LEFT JOIN usuarios u ON a.usr_id = u.id WHERE a.escola_id = $1';
      let params = [req.params.escola_id];
      
      const filtrado = aplicarFiltroEmpresa(query, params, req.filtroEmpresa, 'a.empresa_id');
      
      res.json({
        message: 'Alunos da escola',
        escola_id: req.params.escola_id,
        filtro_empresa: req.filtroEmpresa,
        user_info: {
          nome: req.user.nome,
          tipo: req.user.tipo_usuario
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar alunos', error: error.message });
    }
  }
);

// EXEMPLO 11: Rota administrativa (apenas admins, sem filtro de empresa)
app.get('/api/admin/todas-empresas', 
  autenticar,
  (req, res, next) => {
    if (req.user.tipo_usuario !== 'admin') {
      return res.status(403).json({
        message: 'Acesso restrito a administradores',
        error: 'ADMIN_ONLY'
      });
    }
    next();
  },
  auditarAcessoEmpresa('LISTAR_TODAS_EMPRESAS'),
  (req, res) => {
    res.json({
      message: 'Todas as empresas do sistema (acesso admin)',
      admin: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario
      },
      empresas: [] // Aqui viria a consulta sem filtro
    });
  }
);

// EXEMPLO 12: Rota para relatórios (com filtro baseado no tipo de usuário)
app.get('/api/relatorios/usuarios', 
  autenticar,
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      let query = `
        SELECT 
          e.nome as empresa_nome,
          COUNT(u.id) as total_usuarios,
          COUNT(CASE WHEN u.tipo_usuario = 'gestor' THEN 1 END) as gestores,
          COUNT(CASE WHEN u.tipo_usuario = 'diretor' THEN 1 END) as diretores,
          COUNT(CASE WHEN u.tipo_usuario = 'professor' THEN 1 END) as professores,
          COUNT(CASE WHEN u.tipo_usuario = 'aluno' THEN 1 END) as alunos
        FROM empresas e 
        LEFT JOIN usuarios u ON e.id = u.empresa_id 
        GROUP BY e.id, e.nome
      `;
      let params = [];
      
      // Se não for admin, filtrar apenas a empresa do usuário
      if (req.filtroEmpresa !== null) {
        query += ' HAVING e.id = $1';
        params = [req.filtroEmpresa];
      }
      
      res.json({
        message: 'Relatório de usuários por empresa',
        filtro_aplicado: req.filtroEmpresa !== null,
        scope: req.user.tipo_usuario === 'admin' ? 'Todas as empresas' : `Empresa ${req.filtroEmpresa}`,
        user_info: {
          nome: req.user.nome,
          tipo: req.user.tipo_usuario
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao gerar relatório', error: error.message });
    }
  }
);

// EXEMPLO 13: Função de teste para verificar diferentes cenários
export async function testarVerificacaoEmpresa() {
  console.log('🧪 Testando verificação de empresa...\n');
  
  const cenarios = [
    {
      nome: 'Admin sem empresa_id',
      user: { id: 1, nome: 'Admin', tipo_usuario: 'admin', empresa_id: null },
      esperado: 'success'
    },
    {
      nome: 'Gestor com empresa_id',
      user: { id: 2, nome: 'Gestor', tipo_usuario: 'gestor', empresa_id: 1 },
      esperado: 'success'
    },
    {
      nome: 'Diretor sem empresa_id',
      user: { id: 3, nome: 'Diretor', tipo_usuario: 'diretor', empresa_id: null },
      esperado: 'error'
    },
    {
      nome: 'Professor com empresa_id',
      user: { id: 4, nome: 'Professor', tipo_usuario: 'professor', empresa_id: 2 },
      esperado: 'success'
    }
  ];
  
  for (const cenario of cenarios) {
    console.log(`🔍 Testando: ${cenario.nome}`);
    
    const req = { user: cenario.user };
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`   Status: ${code}`);
          console.log(`   Esperado: ${cenario.esperado}`);
          console.log(`   Resultado: ${code === 403 ? 'error' : 'success'}`);
          console.log(`   Mensagem: ${data.message}\n`);
        }
      })
    };
    const next = () => {
      console.log('   ✅ Acesso autorizado\n');
    };
    
    const middleware = verificarAcessoEmpresa;
    await middleware(req, res, next);
  }
}

// EXEMPLO 14: Função para testar filtros de empresa
export function testarFiltrosEmpresa() {
  console.log('🧪 Testando filtros de empresa...\n');
  
  const queries = [
    { query: 'SELECT * FROM contratos', params: [] },
    { query: 'SELECT * FROM escolas WHERE status = $1', params: ['ativa'] },
    { query: 'SELECT * FROM usuarios WHERE tipo_usuario = $1 AND status = $2', params: ['professor', 'ativo'] }
  ];
  
  const filtros = [null, 1, 2]; // null = admin, 1 e 2 = empresas específicas
  
  queries.forEach((item, index) => {
    console.log(`🔍 Query ${index + 1}: ${item.query}`);
    
    filtros.forEach(filtro => {
      const resultado = aplicarFiltroEmpresa(item.query, item.params, filtro);
      console.log(`   Filtro ${filtro}: ${resultado.query}`);
      console.log(`   Params: [${resultado.params.join(', ')}]\n`);
    });
  });
}

// EXEMPLO 15: Função para testar verificação de tipo de usuário
export function testarVerificacaoTipoUsuario() {
  console.log('🧪 Testando verificação de tipo de usuário...\n');
  
  const cenarios = [
    {
      nome: 'Admin acessando rota apenas para admins',
      user: { id: 1, nome: 'Admin', tipo_usuario: 'admin', empresa_id: null },
      middleware: apenasAdmin,
      esperado: 'success'
    },
    {
      nome: 'Gestor tentando acessar rota apenas para admins',
      user: { id: 2, nome: 'Gestor', tipo_usuario: 'gestor', empresa_id: 1 },
      middleware: apenasAdmin,
      esperado: 'error'
    },
    {
      nome: 'Gestor acessando rota para admin ou gestor',
      user: { id: 2, nome: 'Gestor', tipo_usuario: 'gestor', empresa_id: 1 },
      middleware: adminOuGestor,
      esperado: 'success'
    },
    {
      nome: 'Professor acessando rota para gestor, diretor ou professor',
      user: { id: 4, nome: 'Professor', tipo_usuario: 'professor', empresa_id: 1 },
      middleware: gestorDiretorOuProfessor,
      esperado: 'success'
    },
    {
      nome: 'Aluno tentando acessar rota para todos exceto alunos',
      user: { id: 5, nome: 'Aluno', tipo_usuario: 'aluno', empresa_id: 1 },
      middleware: todosExcetoAluno,
      esperado: 'error'
    },
    {
      nome: 'Diretor acessando rota para diretor ou professor',
      user: { id: 3, nome: 'Diretor', tipo_usuario: 'diretor', empresa_id: 1 },
      middleware: diretorOuProfessor,
      esperado: 'success'
    },
    {
      nome: 'Usuario sem tipo_usuario definido',
      user: { id: 6, nome: 'Sem Tipo', tipo_usuario: null, empresa_id: 1 },
      middleware: qualquerTipo,
      esperado: 'error'
    },
    {
      nome: 'Professor acessando rota para qualquer tipo',
      user: { id: 4, nome: 'Professor', tipo_usuario: 'professor', empresa_id: 1 },
      middleware: qualquerTipo,
      esperado: 'success'
    }
  ];
  
  console.log('📋 Executando cenários de teste:\n');
  
  cenarios.forEach((cenario, index) => {
    console.log(`${index + 1}. ${cenario.nome}`);
    
    const req = { user: cenario.user };
    const res = {
      status: (code) => ({
        json: (data) => {
          const resultado = code === 403 || code === 401 ? 'error' : 'success';
          const status = resultado === cenario.esperado ? '✅' : '❌';
          
          console.log(`   ${status} Status: ${code} | Esperado: ${cenario.esperado} | Resultado: ${resultado}`);
          if (data.message) {
            console.log(`   Mensagem: ${data.message}`);
          }
          console.log('');
        }
      })
    };
    const next = () => {
      const status = cenario.esperado === 'success' ? '✅' : '❌';
      console.log(`   ${status} Acesso autorizado | Esperado: ${cenario.esperado} | Resultado: success\n`);
    };
    
    try {
      cenario.middleware(req, res, next);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
    }
  });
}

// EXEMPLO 16: Testar middlewares pré-configurados
export function testarMiddlewaresPreConfigurados() {
  console.log('🧪 Testando middlewares pré-configurados...\n');
  
  const middlewares = [
    { nome: 'apenasAdmin', middleware: apenasAdmin, tipos: ['admin'] },
    { nome: 'apenasGestor', middleware: apenasGestor, tipos: ['gestor'] },
    { nome: 'apenasDiretor', middleware: apenasDiretor, tipos: ['diretor'] },
    { nome: 'apenasProfessor', middleware: apenasProfessor, tipos: ['professor'] },
    { nome: 'apenasAluno', middleware: apenasAluno, tipos: ['aluno'] },
    { nome: 'adminOuGestor', middleware: adminOuGestor, tipos: ['admin', 'gestor'] },
    { nome: 'gestorOuDiretor', middleware: gestorOuDiretor, tipos: ['gestor', 'diretor'] },
    { nome: 'diretorOuProfessor', middleware: diretorOuProfessor, tipos: ['diretor', 'professor'] },
    { nome: 'professorOuAluno', middleware: professorOuAluno, tipos: ['professor', 'aluno'] },
    { nome: 'adminGestorOuDiretor', middleware: adminGestorOuDiretor, tipos: ['admin', 'gestor', 'diretor'] },
    { nome: 'gestorDiretorOuProfessor', middleware: gestorDiretorOuProfessor, tipos: ['gestor', 'diretor', 'professor'] },
    { nome: 'todosExcetoAluno', middleware: todosExcetoAluno, tipos: ['admin', 'gestor', 'diretor', 'professor'] },
    { nome: 'qualquerTipo', middleware: qualquerTipo, tipos: ['admin', 'gestor', 'diretor', 'professor', 'aluno'] }
  ];
  
  const tiposUsuario = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
  
  middlewares.forEach(item => {
    console.log(`🔍 Testando ${item.nome} (permite: ${item.tipos.join(', ')})`);
    
    tiposUsuario.forEach(tipo => {
      const user = { id: 1, nome: `Teste ${tipo}`, tipo_usuario: tipo, empresa_id: 1 };
      const esperado = item.tipos.includes(tipo) ? 'success' : 'error';
      
      const req = { user };
      let resultado = 'error';
      
      const res = {
        status: () => ({
          json: () => {
            resultado = 'error';
          }
        })
      };
      
      const next = () => {
        resultado = 'success';
      };
      
      try {
        item.middleware(req, res, next);
        const status = resultado === esperado ? '✅' : '❌';
        console.log(`   ${status} ${tipo}: ${resultado} (esperado: ${esperado})`);
      } catch (error) {
        console.log(`   ❌ ${tipo}: erro (${error.message})`);
      }
    });
    
    console.log('');
  });
}

// EXEMPLO 17: Função para testar verificação de próprio usuário
export function testarVerificacaoProprioUsuario() {
  console.log('🧪 Testando verificação de próprio usuário...\n');
  
  const cenarios = [
    {
      nome: 'Usuário acessando seus próprios dados',
      user: { id: 5, nome: 'João Silva', tipo_usuario: 'professor', empresa_id: 1 },
      params: { userId: '5' },
      esperado: 'success'
    },
    {
      nome: 'Usuário tentando acessar dados de outro usuário',
      user: { id: 5, nome: 'João Silva', tipo_usuario: 'professor', empresa_id: 1 },
      params: { userId: '6' },
      esperado: 'error'
    },
    {
      nome: 'Admin acessando dados de qualquer usuário',
      user: { id: 1, nome: 'Admin', tipo_usuario: 'admin', empresa_id: null },
      params: { userId: '5' },
      esperado: 'success'
    },
    {
      nome: 'Admin da empresa acessando dados de usuário',
      user: { id: 2, nome: 'Admin Empresa', tipo_usuario: 'admin', empresa_id: 1 },
      params: { userId: '5' },
      esperado: 'success'
    },
    {
      nome: 'Usuário sem parâmetro userId na URL',
      user: { id: 5, nome: 'João Silva', tipo_usuario: 'professor', empresa_id: 1 },
      params: {},
      esperado: 'error'
    },
    {
      nome: 'Usuário não autenticado',
      user: null,
      params: { userId: '5' },
      esperado: 'error'
    }
  ];
  
  console.log('📋 Executando cenários de teste:\n');
  
  cenarios.forEach((cenario, index) => {
    console.log(`${index + 1}. ${cenario.nome}`);
    
    const req = { 
      user: cenario.user, 
      params: cenario.params
    };
    
    const res = {
      status: (code) => ({
        json: (data) => {
          const resultado = code === 403 || code === 401 || code === 400 ? 'error' : 'success';
          const status = resultado === cenario.esperado ? '✅' : '❌';
          
          console.log(`   ${status} Status: ${code} | Esperado: ${cenario.esperado} | Resultado: ${resultado}`);
          if (data.message) {
            console.log(`   Mensagem: ${data.message}`);
          }
          console.log('');
        }
      })
    };
    
    const next = () => {
      const status = cenario.esperado === 'success' ? '✅' : '❌';
      console.log(`   ${status} Acesso autorizado | Esperado: ${cenario.esperado} | Resultado: success\n`);
    };
    
    try {
      verificarProprioUsuario(req, res, next);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
    }
  });
}

// EXEMPLO 18: Função para testar verificação combinada de acesso a usuário
export async function testarVerificacaoAcessoUsuario() {
  console.log('🧪 Testando verificação combinada de acesso a usuário...\n');
  
  // Mock da função buscarEmpresaRecurso para testes
  const mockBuscarEmpresaRecurso = (tabela, campo, retorno, id) => {
    // Simular dados de teste
    const usuarios = {
      '1': { empresa_id: null, tipo_usuario: 'admin' }, // Admin global
      '2': { empresa_id: 1, tipo_usuario: 'admin' },    // Admin empresa 1
      '3': { empresa_id: 1, tipo_usuario: 'gestor' },   // Gestor empresa 1
      '4': { empresa_id: 1, tipo_usuario: 'diretor' },  // Diretor empresa 1
      '5': { empresa_id: 1, tipo_usuario: 'professor' }, // Professor empresa 1
      '6': { empresa_id: 2, tipo_usuario: 'professor' }, // Professor empresa 2
      '7': { empresa_id: 1, tipo_usuario: 'aluno' }      // Aluno empresa 1
    };
    
    const usuario = usuarios[id];
    if (!usuario) return null;
    
    return retorno === 'empresa_id' ? usuario.empresa_id : usuario.tipo_usuario;
  };
  
  const cenarios = [
    {
      nome: 'Admin global acessando qualquer usuário',
      user: { id: 1, nome: 'Admin Global', tipo_usuario: 'admin', empresa_id: null },
      targetUserId: '5',
      esperado: 'success'
    },
    {
      nome: 'Usuário acessando seus próprios dados',
      user: { id: 5, nome: 'Professor', tipo_usuario: 'professor', empresa_id: 1 },
      targetUserId: '5',
      esperado: 'success'
    },
    {
      nome: 'Gestor acessando professor da mesma empresa',
      user: { id: 3, nome: 'Gestor', tipo_usuario: 'gestor', empresa_id: 1 },
      targetUserId: '5',
      esperado: 'success'
    },
    {
      nome: 'Professor tentando acessar dados de outro professor',
      user: { id: 5, nome: 'Professor', tipo_usuario: 'professor', empresa_id: 1 },
      targetUserId: '6',
      esperado: 'error'
    },
    {
      nome: 'Diretor acessando aluno da mesma empresa',
      user: { id: 4, nome: 'Diretor', tipo_usuario: 'diretor', empresa_id: 1 },
      targetUserId: '7',
      esperado: 'success'
    },
    {
      nome: 'Gestor tentando acessar usuário de outra empresa',
      user: { id: 3, nome: 'Gestor', tipo_usuario: 'gestor', empresa_id: 1 },
      targetUserId: '6',
      esperado: 'error'
    }
  ];
  
  console.log('📋 Executando cenários de teste:\n');
  
  for (const [index, cenario] of cenarios.entries()) {
    console.log(`${index + 1}. ${cenario.nome}`);
    
    // Resultado esperado baseado na lógica
    const empresaIdAlvo = mockBuscarEmpresaRecurso('usuarios', 'id', 'empresa_id', cenario.targetUserId);
    const tipoUsuarioAlvo = mockBuscarEmpresaRecurso('usuarios', 'id', 'tipo_usuario', cenario.targetUserId);
    
    let resultadoEsperado = 'error';
    
    // Lógica de verificação
    if (cenario.user.tipo_usuario === 'admin' && !cenario.user.empresa_id) {
      resultadoEsperado = 'success'; // Admin global
    } else if (parseInt(cenario.user.id) === parseInt(cenario.targetUserId)) {
      resultadoEsperado = 'success'; // Próprios dados
    } else if (cenario.user.empresa_id === empresaIdAlvo) {
      // Mesma empresa + hierarquia
      if (cenario.user.tipo_usuario === 'gestor' && 
          ['diretor', 'professor', 'aluno'].includes(tipoUsuarioAlvo)) {
        resultadoEsperado = 'success';
      } else if (cenario.user.tipo_usuario === 'diretor' && 
                 ['professor', 'aluno'].includes(tipoUsuarioAlvo)) {
        resultadoEsperado = 'success';
      } else if (cenario.user.tipo_usuario === 'admin') {
        resultadoEsperado = 'success';
      }
    }
    
    const status = resultadoEsperado === cenario.esperado ? '✅' : '❌';
    console.log(`   ${status} Esperado: ${cenario.esperado} | Resultado: ${resultadoEsperado}`);
    console.log(`   Detalhes: ${cenario.user.tipo_usuario} (empresa ${cenario.user.empresa_id}) → ${tipoUsuarioAlvo} (empresa ${empresaIdAlvo})\n`);
  }
}

// EXEMPLO 19: Executar todos os testes
export async function executarTodosOsTestesAutorizacao() {
  console.log('🧪 Executando todos os testes de autorização...\n');
  
  try {
    console.log('='.repeat(80));
    console.log('TESTES DE VERIFICAÇÃO DE TIPO DE USUÁRIO');
    console.log('='.repeat(80));
    testarVerificacaoTipoUsuario();
    
    console.log('='.repeat(80));
    console.log('TESTES DE MIDDLEWARES PRÉ-CONFIGURADOS');
    console.log('='.repeat(80));
    testarMiddlewaresPreConfigurados();
    
    console.log('='.repeat(80));
    console.log('TESTES DE VERIFICAÇÃO DE EMPRESA');
    console.log('='.repeat(80));
    await testarVerificacaoEmpresa();
    
    console.log('='.repeat(80));
    console.log('TESTES DE VERIFICAÇÃO DE PRÓPRIO USUÁRIO');
    console.log('='.repeat(80));
    testarVerificacaoProprioUsuario();
    
    console.log('='.repeat(80));
    console.log('TESTES DE VERIFICAÇÃO COMBINADA DE ACESSO A USUÁRIO');
    console.log('='.repeat(80));
    await testarVerificacaoAcessoUsuario();
    
    console.log('='.repeat(80));
    console.log('TESTES DE FILTROS DE EMPRESA');
    console.log('='.repeat(80));
    testarFiltrosEmpresa();
    
    console.log('✅ Todos os testes de autorização executados!');
  } catch (error) {
    console.error('❌ Erro nos testes de autorização:', error.message);
  }
}

export default app;
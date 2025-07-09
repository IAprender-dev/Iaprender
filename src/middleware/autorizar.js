import { executeQuery } from '../config/database.js';

// Função para verificar tipo de usuário
export const verificarTipoUsuario = (tiposPermitidos) => {
  return (req, res, next) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user) {
        return res.status(401).json({
          message: 'Usuário não autenticado',
          error: 'USER_NOT_AUTHENTICATED'
        });
      }

      // Verificar se tipo_usuario existe
      if (!req.user.tipo_usuario) {
        return res.status(403).json({
          message: 'Tipo de usuário não definido',
          error: 'USER_TYPE_UNDEFINED'
        });
      }

      // Normalizar tipos permitidos para array
      const tipos = Array.isArray(tiposPermitidos) ? tiposPermitidos : [tiposPermitidos];

      // Verificar se o tipo do usuário está nos tipos permitidos
      if (!tipos.includes(req.user.tipo_usuario)) {
        console.log(`❌ Acesso negado: ${req.user.nome} (${req.user.tipo_usuario}) tentou acessar recurso que requer ${tipos.join(' ou ')}`);
        
        return res.status(403).json({
          message: `Acesso restrito a: ${tipos.join(', ')}`,
          error: 'INSUFFICIENT_USER_TYPE',
          user_type: req.user.tipo_usuario,
          required_types: tipos
        });
      }

      console.log(`✅ Tipo autorizado: ${req.user.nome} (${req.user.tipo_usuario}) - requer ${tipos.join(' ou ')}`);
      next();

    } catch (error) {
      console.error('❌ Erro na verificação de tipo de usuário:', error.message);
      return res.status(500).json({
        message: 'Erro interno na verificação de tipo de usuário',
        error: 'USER_TYPE_VERIFICATION_ERROR'
      });
    }
  };
};

// Middlewares pré-configurados para tipos específicos
export const apenasAdmin = verificarTipoUsuario(['admin']);
export const apenasGestor = verificarTipoUsuario(['gestor']);
export const apenasDiretor = verificarTipoUsuario(['diretor']);
export const apenasProfessor = verificarTipoUsuario(['professor']);
export const apenasAluno = verificarTipoUsuario(['aluno']);

// Middlewares para combinações comuns
export const adminOuGestor = verificarTipoUsuario(['admin', 'gestor']);
export const gestorOuDiretor = verificarTipoUsuario(['gestor', 'diretor']);
export const diretorOuProfessor = verificarTipoUsuario(['diretor', 'professor']);
export const professorOuAluno = verificarTipoUsuario(['professor', 'aluno']);
export const adminGestorOuDiretor = verificarTipoUsuario(['admin', 'gestor', 'diretor']);
export const gestorDiretorOuProfessor = verificarTipoUsuario(['gestor', 'diretor', 'professor']);
export const todosExcetoAluno = verificarTipoUsuario(['admin', 'gestor', 'diretor', 'professor']);
export const qualquerTipo = verificarTipoUsuario(['admin', 'gestor', 'diretor', 'professor', 'aluno']);

// Função para verificar acesso baseado em empresa
export const verificarEmpresa = (options = {}) => {
  return async (req, res, next) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user) {
        return res.status(401).json({
          message: 'Usuário não autenticado',
          error: 'USER_NOT_AUTHENTICATED'
        });
      }

      // Verificar se o usuário possui empresa_id
      if (!req.user.empresa_id) {
        // Admin pode acessar recursos de qualquer empresa
        if (req.user.tipo_usuario === 'admin') {
          console.log(`✅ Admin ${req.user.nome} tem acesso total (sem empresa_id)`);
          return next();
        }
        
        return res.status(403).json({
          message: 'Usuário não possui empresa vinculada',
          error: 'NO_COMPANY_ASSIGNED'
        });
      }

      // Se não há validação de recurso específico, liberar acesso
      if (!options.validarRecurso) {
        console.log(`✅ Acesso liberado para empresa ${req.user.empresa_id}`);
        return next();
      }

      // Validar acesso ao recurso específico
      const recursoId = options.extrairRecursoId ? 
        options.extrairRecursoId(req) : 
        req.params.id || req.params.recurso_id;

      if (!recursoId) {
        return res.status(400).json({
          message: 'ID do recurso não informado',
          error: 'RESOURCE_ID_MISSING'
        });
      }

      // Buscar empresa_id do recurso
      const empresaIdRecurso = await buscarEmpresaRecurso(
        options.tabela, 
        options.campoId || 'id',
        options.campoEmpresa || 'empresa_id',
        recursoId
      );

      if (!empresaIdRecurso) {
        return res.status(404).json({
          message: `${options.nomeRecurso || 'Recurso'} não encontrado`,
          error: 'RESOURCE_NOT_FOUND'
        });
      }

      // Admin pode acessar recursos de qualquer empresa
      if (req.user.tipo_usuario === 'admin') {
        console.log(`✅ Admin ${req.user.nome} acessando recurso da empresa ${empresaIdRecurso}`);
        return next();
      }

      // Verificar se user.empresa_id == recurso.empresa_id
      if (req.user.empresa_id !== empresaIdRecurso) {
        console.log(`❌ Acesso negado: usuário empresa ${req.user.empresa_id} vs recurso empresa ${empresaIdRecurso}`);
        return res.status(403).json({
          message: `Acesso negado: ${options.nomeRecurso || 'recurso'} pertence a outra empresa`,
          error: 'COMPANY_ACCESS_DENIED'
        });
      }

      console.log(`✅ Acesso autorizado: ${req.user.nome} (empresa ${req.user.empresa_id})`);
      next();

    } catch (error) {
      console.error('❌ Erro na verificação de empresa:', error.message);
      return res.status(500).json({
        message: 'Erro interno na verificação de acesso',
        error: 'COMPANY_VERIFICATION_ERROR'
      });
    }
  };
};

// Função auxiliar para buscar empresa_id de um recurso
async function buscarEmpresaRecurso(tabela, campoId, campoEmpresa, recursoId) {
  try {
    const query = `SELECT ${campoEmpresa} FROM ${tabela} WHERE ${campoId} = $1`;
    const result = await executeQuery(query, [recursoId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0][campoEmpresa];
  } catch (error) {
    console.error(`❌ Erro ao buscar empresa do recurso na tabela ${tabela}:`, error.message);
    throw error;
  }
}

// Middleware específico para contratos
export const verificarEmpresaContrato = verificarEmpresa({
  validarRecurso: true,
  tabela: 'contratos',
  campoId: 'id',
  campoEmpresa: 'empresa_id',
  nomeRecurso: 'contrato'
});

// Middleware específico para escolas
export const verificarEmpresaEscola = verificarEmpresa({
  validarRecurso: true,
  tabela: 'escolas',
  campoId: 'id',
  campoEmpresa: 'empresa_id',
  nomeRecurso: 'escola',
  extrairRecursoId: (req) => req.params.escola_id || req.params.id
});

// Middleware específico para gestores
export const verificarEmpresaGestor = verificarEmpresa({
  validarRecurso: true,
  tabela: 'gestores',
  campoId: 'id',
  campoEmpresa: 'empresa_id',
  nomeRecurso: 'gestor'
});

// Middleware específico para diretores
export const verificarEmpresaDiretor = verificarEmpresa({
  validarRecurso: true,
  tabela: 'diretores',
  campoId: 'id',
  campoEmpresa: 'empresa_id',
  nomeRecurso: 'diretor'
});

// Middleware específico para professores
export const verificarEmpresaProfessor = verificarEmpresa({
  validarRecurso: true,
  tabela: 'professores',
  campoId: 'id',
  campoEmpresa: 'empresa_id',
  nomeRecurso: 'professor'
});

// Middleware específico para alunos
export const verificarEmpresaAluno = verificarEmpresa({
  validarRecurso: true,
  tabela: 'alunos',
  campoId: 'id',
  campoEmpresa: 'empresa_id',
  nomeRecurso: 'aluno'
});

// Middleware específico para usuários (via empresa_id direta)
export const verificarEmpresaUsuario = verificarEmpresa({
  validarRecurso: true,
  tabela: 'usuarios',
  campoId: 'id',
  campoEmpresa: 'empresa_id',
  nomeRecurso: 'usuário'
});

// Middleware para verificar acesso a empresa específica (sem recurso)
export const verificarAcessoEmpresa = verificarEmpresa({
  validarRecurso: false
});

// Middleware para verificar se usuário pode gerenciar uma empresa específica
export const verificarGestaoEmpresa = (req, res, next) => {
  const empresaId = parseInt(req.params.empresa_id);
  
  if (!req.user) {
    return res.status(401).json({
      message: 'Usuário não autenticado',
      error: 'USER_NOT_AUTHENTICATED'
    });
  }

  // Admin pode gerenciar qualquer empresa
  if (req.user.tipo_usuario === 'admin') {
    console.log(`✅ Admin ${req.user.nome} pode gerenciar empresa ${empresaId}`);
    return next();
  }

  // Gestor pode gerenciar apenas sua própria empresa
  if (req.user.tipo_usuario === 'gestor' && req.user.empresa_id === empresaId) {
    console.log(`✅ Gestor ${req.user.nome} pode gerenciar sua empresa ${empresaId}`);
    return next();
  }

  console.log(`❌ Acesso negado: usuário ${req.user.nome} não pode gerenciar empresa ${empresaId}`);
  return res.status(403).json({
    message: 'Acesso negado para gerenciar esta empresa',
    error: 'COMPANY_MANAGEMENT_DENIED'
  });
};

// Middleware para filtrar consultas por empresa do usuário
export const filtrarPorEmpresa = (options = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuário não autenticado',
        error: 'USER_NOT_AUTHENTICATED'
      });
    }

    // Admin pode ver todos os dados
    if (req.user.tipo_usuario === 'admin') {
      req.filtroEmpresa = null; // Sem filtro
      console.log(`✅ Admin ${req.user.nome}: sem filtro de empresa`);
    } else {
      // Outros usuários veem apenas dados da sua empresa
      req.filtroEmpresa = req.user.empresa_id;
      console.log(`✅ Usuário ${req.user.nome}: filtro empresa ${req.user.empresa_id}`);
    }

    next();
  };
};

// Função para aplicar filtro de empresa em queries
export const aplicarFiltroEmpresa = (query, params, filtroEmpresa, campoEmpresa = 'empresa_id') => {
  if (filtroEmpresa === null) {
    // Admin: sem filtro
    return { query, params };
  }

  // Adicionar filtro WHERE ou AND
  const temWhere = query.toLowerCase().includes('where');
  const operador = temWhere ? 'AND' : 'WHERE';
  
  const queryFiltrada = `${query} ${operador} ${campoEmpresa} = $${params.length + 1}`;
  const paramsFiltrados = [...params, filtroEmpresa];

  return {
    query: queryFiltrada,
    params: paramsFiltrados
  };
};

// Middleware para log de auditoria de acesso
export const auditarAcessoEmpresa = (acao) => {
  return async (req, res, next) => {
    try {
      const empresaId = req.user?.empresa_id || 'N/A';
      const usuarioId = req.user?.id || 'N/A';
      const recursoId = req.params.id || req.params.empresa_id || 'N/A';
      
      console.log(`📋 AUDITORIA - Ação: ${acao}`);
      console.log(`   Usuário: ${req.user?.nome} (ID: ${usuarioId})`);
      console.log(`   Empresa: ${empresaId}`);
      console.log(`   Recurso: ${recursoId}`);
      console.log(`   IP: ${req.ip}`);
      console.log(`   User-Agent: ${req.get('User-Agent')}`);
      
      // Aqui você pode salvar no banco de dados se necessário
      // await executeQuery(
      //   'INSERT INTO audit_logs (usuario_id, empresa_id, acao, recurso_id, ip, user_agent, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      //   [usuarioId, empresaId, acao, recursoId, req.ip, req.get('User-Agent')]
      // );
      
      next();
    } catch (error) {
      console.error('❌ Erro na auditoria:', error.message);
      // Não bloquear o acesso por erro de auditoria
      next();
    }
  };
};

export default {
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
  filtrarPorEmpresa,
  aplicarFiltroEmpresa,
  auditarAcessoEmpresa
};
import { Usuario } from '../models/Usuario.js';
import { autenticar } from '../middleware/auth.js';
import { 
  verificarTipoUsuario, 
  verificarProprioUsuario, 
  verificarAcessoUsuario,
  verificarEmpresa,
  apenasAdmin,
  adminOuGestor,
  qualquerTipo
} from '../middleware/autorizar.js';

/**
 * Controller de Usuários
 * Gerencia todas as operações relacionadas aos usuários do sistema
 * Integra modelo Usuario com middlewares de autenticação e autorização
 */
export class UsuarioController {

  // ============================================================================
  // MÉTODOS AUXILIARES E FORMATAÇÃO DE RESPOSTA
  // ============================================================================

  /**
   * Formato padrão de resposta da API
   * @param {Object} res - Objeto response do Express
   * @param {number} statusCode - Código de status HTTP
   * @param {Object} data - Dados da resposta
   * @param {string} message - Mensagem da resposta
   */
  static sendResponse(res, statusCode, data, message = null) {
    const response = {
      success: statusCode < 400,
      timestamp: new Date().toISOString(),
      ...(message && { message }),
      ...(data && { data })
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Trata erros do controller de forma padronizada
   * @param {Object} res - Objeto response do Express
   * @param {Error} error - Erro a ser tratado
   * @param {string} context - Contexto onde ocorreu o erro
   */
  static handleError(res, error, context = '') {
    console.error(`❌ Erro no UsuarioController ${context}:`, error);
    
    // Erros específicos do modelo Usuario
    if (error.code === 'VALIDATION_ERROR') {
      return this.sendResponse(res, 400, null, `Dados inválidos: ${error.errors?.join(', ') || error.message}`);
    }

    if (error.code === 'USER_NOT_FOUND') {
      return this.sendResponse(res, 404, null, 'Usuário não encontrado');
    }

    if (error.code === 'EMAIL_ALREADY_EXISTS') {
      return this.sendResponse(res, 409, null, 'Email já está em uso');
    }

    if (error.code === 'COGNITO_SUB_ALREADY_EXISTS') {
      return this.sendResponse(res, 409, null, 'Usuário Cognito já está cadastrado');
    }

    // Erros de autorização
    if (error.code === 'USER_NOT_AUTHENTICATED') {
      return this.sendResponse(res, 401, null, 'Usuário não autenticado');
    }

    if (error.code === 'INSUFFICIENT_USER_TYPE') {
      return this.sendResponse(res, 403, null, 'Permissão insuficiente para esta operação');
    }

    if (error.code === 'COMPANY_ACCESS_DENIED') {
      return this.sendResponse(res, 403, null, 'Acesso negado aos dados desta empresa');
    }

    // Erros de banco de dados PostgreSQL
    if (error.code === '23505') { // Violação de unicidade
      return this.sendResponse(res, 409, null, 'Registro já existe (dados duplicados)');
    }
    
    if (error.code === '23503') { // Violação de chave estrangeira
      return this.sendResponse(res, 400, null, 'Referência inválida (empresa/contrato não existe)');
    }
    
    // Erro genérico
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erro interno do servidor';
      
    this.sendResponse(res, 500, null, message);
  }

  /**
   * Valida campos obrigatórios
   * @param {Object} data - Dados a serem validados
   * @param {Array} requiredFields - Lista de campos obrigatórios
   */
  static validateRequiredFields(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      const error = new Error(`Campos obrigatórios faltando: ${missing.join(', ')}`);
      error.code = 'VALIDATION_ERROR';
      error.errors = missing.map(field => `${field} é obrigatório`);
      throw error;
    }
  }

  // ============================================================================
  // ENDPOINTS PRINCIPAIS DO CRUD
  // ============================================================================

  /**
   * GET /api/usuarios/:id - Busca usuário por ID
   * Middlewares: autenticar, verificarAcessoUsuario
   */
  static async buscarPorId(req, res) {
    try {
      console.log('🔍 UsuarioController.buscarPorId - ID:', req.params.id);

      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return this.sendResponse(res, 400, null, 'ID do usuário inválido');
      }

      const usuario = await Usuario.findById(parseInt(id));
      
      if (!usuario) {
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      // Retornar dados limpos via toJSON()
      this.sendResponse(res, 200, usuario.toJSON(), 'Usuário encontrado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'buscarPorId');
    }
  }

  /**
   * GET /api/usuarios/email/:email - Busca usuário por email
   * Middlewares: autenticar, adminOuGestor
   */
  static async buscarPorEmail(req, res) {
    try {
      console.log('🔍 UsuarioController.buscarPorEmail - Email:', req.params.email);

      const { email } = req.params;
      
      if (!email || !email.includes('@')) {
        return this.sendResponse(res, 400, null, 'Email inválido');
      }

      const usuario = await Usuario.findByEmail(email);
      
      if (!usuario) {
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      this.sendResponse(res, 200, usuario.toJSON(), 'Usuário encontrado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'buscarPorEmail');
    }
  }

  /**
   * GET /api/usuarios/cognito/:sub - Busca usuário por Cognito Sub
   * Middlewares: autenticar, adminOuGestor
   */
  static async buscarPorCognitoSub(req, res) {
    try {
      console.log('🔍 UsuarioController.buscarPorCognitoSub - Sub:', req.params.sub);

      const { sub } = req.params;
      
      if (!sub) {
        return this.sendResponse(res, 400, null, 'Cognito Sub inválido');
      }

      const usuario = await Usuario.findByCognitoSub(sub);
      
      if (!usuario) {
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      this.sendResponse(res, 200, usuario.toJSON(), 'Usuário encontrado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'buscarPorCognitoSub');
    }
  }

  /**
   * GET /api/usuarios - Lista usuários com filtros e paginação
   * Middlewares: autenticar, adminOuGestor, verificarEmpresa (opcional)
   */
  static async listarUsuarios(req, res) {
    try {
      console.log('📋 UsuarioController.listarUsuarios - Query:', req.query);

      const {
        page = 1,
        limit = 10,
        tipo_usuario,
        empresa_id,
        status = 'ativo',
        search,
        orderBy = 'nome',
        orderDirection = 'ASC'
      } = req.query;

      // Filtros baseados no usuário logado
      const filters = { status };
      
      // Se não for admin, filtrar por empresa do usuário
      if (req.user.tipo_usuario !== 'admin' && req.user.empresa_id) {
        filters.empresa_id = req.user.empresa_id;
      } else if (empresa_id) {
        filters.empresa_id = parseInt(empresa_id);
      }

      if (tipo_usuario) {
        filters.tipo_usuario = tipo_usuario;
      }

      if (search) {
        filters.search = search;
      }

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100), // Máximo 100 por página
        orderBy,
        orderDirection: orderDirection.toUpperCase()
      };

      const resultado = await Usuario.findAll(filters, options);

      this.sendResponse(res, 200, {
        usuarios: resultado.usuarios.map(u => u.toJSON()),
        pagination: {
          page: options.page,
          limit: options.limit,
          total: resultado.total,
          pages: Math.ceil(resultado.total / options.limit)
        }
      }, 'Usuários listados com sucesso');

    } catch (error) {
      this.handleError(res, error, 'listarUsuarios');
    }
  }

  /**
   * POST /api/usuarios - Cria novo usuário
   * Middlewares: autenticar, adminOuGestor
   */
  static async criarUsuario(req, res) {
    try {
      console.log('📝 UsuarioController.criarUsuario - Dados:', req.body);

      // Validar campos obrigatórios
      this.validateRequiredFields(req.body, [
        'cognito_sub', 'email', 'nome', 'tipo_usuario'
      ]);

      const dadosUsuario = {
        ...req.body,
        // Se não for admin, forçar empresa do usuário logado
        empresa_id: req.user.tipo_usuario === 'admin' 
          ? req.body.empresa_id 
          : req.user.empresa_id
      };

      const usuario = await Usuario.criar(dadosUsuario);

      this.sendResponse(res, 201, usuario.toJSON(), 'Usuário criado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'criarUsuario');
    }
  }

  /**
   * PATCH /api/usuarios/:id - Atualiza usuário
   * Middlewares: autenticar, verificarAcessoUsuario
   */
  static async atualizarUsuario(req, res) {
    try {
      console.log('📝 UsuarioController.atualizarUsuario - ID:', req.params.id, 'Dados:', req.body);

      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return this.sendResponse(res, 400, null, 'ID do usuário inválido');
      }

      // Campos que não podem ser alterados
      const camposProtegidos = ['id', 'cognito_sub', 'criado_em', 'atualizado_em'];
      const dadosLimpos = { ...req.body };
      
      camposProtegidos.forEach(campo => delete dadosLimpos[campo]);

      // Se não for admin, não pode alterar empresa_id ou tipo_usuario
      if (req.user.tipo_usuario !== 'admin') {
        delete dadosLimpos.empresa_id;
        delete dadosLimpos.tipo_usuario;
        delete dadosLimpos.status;
      }

      const usuario = await Usuario.atualizar(parseInt(id), dadosLimpos);

      this.sendResponse(res, 200, usuario.toJSON(), 'Usuário atualizado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'atualizarUsuario');
    }
  }

  /**
   * DELETE /api/usuarios/:id - Remove usuário
   * Middlewares: autenticar, apenasAdmin
   */
  static async removerUsuario(req, res) {
    try {
      console.log('🗑️ UsuarioController.removerUsuario - ID:', req.params.id);

      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return this.sendResponse(res, 400, null, 'ID do usuário inválido');
      }

      const sucesso = await Usuario.deletar(parseInt(id));

      if (sucesso) {
        this.sendResponse(res, 200, null, 'Usuário removido com sucesso');
      } else {
        this.sendResponse(res, 404, null, 'Usuário não encontrado para remoção');
      }

    } catch (error) {
      this.handleError(res, error, 'removerUsuario');
    }
  }

  // ============================================================================
  // ENDPOINTS ESPECÍFICOS E UTILITÁRIOS
  // ============================================================================

  /**
   * GET /api/usuarios/me - Perfil do usuário logado
   * Middlewares: autenticar
   */
  static async meuPerfil(req, res) {
    try {
      console.log('👤 UsuarioController.meuPerfil - User:', req.user.id);

      const usuario = await Usuario.findById(req.user.id);
      
      if (!usuario) {
        return this.sendResponse(res, 404, null, 'Perfil do usuário não encontrado');
      }

      this.sendResponse(res, 200, usuario.toJSON(), 'Perfil obtido com sucesso');

    } catch (error) {
      this.handleError(res, error, 'meuPerfil');
    }
  }

  /**
   * GET /api/usuarios/perfil - Perfil completo com dados específicos do tipo
   * Middlewares: autenticar
   * Retorna dados do req.user + informações específicas do tipo (professor, aluno, etc.)
   */
  static async obterPerfil(req, res) {
    try {
      console.log('👤 UsuarioController.obterPerfil - User:', req.user.id, 'Tipo:', req.user.tipo_usuario);

      // Dados básicos do usuário do token JWT
      const perfilBasico = {
        id: req.user.id,
        sub: req.user.sub,
        nome: req.user.nome,
        email: req.user.email,
        tipo_usuario: req.user.tipo_usuario,
        empresa_id: req.user.empresa_id,
        groups: req.user.groups || [],
        exp: req.user.exp,
        iat: req.user.iat
      };

      // Buscar dados completos do usuário no banco
      const usuarioCompleto = await Usuario.findById(req.user.id);
      
      if (!usuarioCompleto) {
        return this.sendResponse(res, 404, null, 'Dados do usuário não encontrados no banco');
      }

      // Dados base do perfil
      const perfilCompleto = {
        ...perfilBasico,
        ...usuarioCompleto.toJSON(),
        dadosEspecificos: {}
      };

      // Buscar dados específicos baseados no tipo de usuário
      try {
        switch (req.user.tipo_usuario) {
          case 'professor':
            const { Professor } = await import('../models/Professor.js');
            const dadosProfessor = await Professor.findByUserId(req.user.id);
            if (dadosProfessor) {
              perfilCompleto.dadosEspecificos = {
                tipo: 'professor',
                professor_id: dadosProfessor.id,
                escola_id: dadosProfessor.escola_id,
                disciplinas: dadosProfessor.disciplinas,
                formacao: dadosProfessor.formacao,
                data_admissao: dadosProfessor.data_admissao,
                status: dadosProfessor.status
              };
            }
            break;

          case 'aluno':
            const { Aluno } = await import('../models/Aluno.js');
            const dadosAluno = await Aluno.findByUserId(req.user.id);
            if (dadosAluno) {
              perfilCompleto.dadosEspecificos = {
                tipo: 'aluno',
                aluno_id: dadosAluno.id,
                escola_id: dadosAluno.escola_id,
                matricula: dadosAluno.matricula,
                turma: dadosAluno.turma,
                serie: dadosAluno.serie,
                turno: dadosAluno.turno,
                nome_responsavel: dadosAluno.nome_responsavel,
                contato_responsavel: dadosAluno.contato_responsavel,
                data_matricula: dadosAluno.data_matricula,
                status: dadosAluno.status
              };
            }
            break;

          case 'diretor':
            const { Diretor } = await import('../models/Diretor.js');
            const dadosDiretor = await Diretor.findByUserId(req.user.id);
            if (dadosDiretor) {
              perfilCompleto.dadosEspecificos = {
                tipo: 'diretor',
                diretor_id: dadosDiretor.id,
                escola_id: dadosDiretor.escola_id,
                cargo: dadosDiretor.cargo,
                data_inicio: dadosDiretor.data_inicio,
                status: dadosDiretor.status
              };
            }
            break;

          case 'gestor':
            const { Gestor } = await import('../models/Gestor.js');
            const dadosGestor = await Gestor.findByUserId(req.user.id);
            if (dadosGestor) {
              perfilCompleto.dadosEspecificos = {
                tipo: 'gestor',
                gestor_id: dadosGestor.id,
                cargo: dadosGestor.cargo,
                data_admissao: dadosGestor.data_admissao,
                status: dadosGestor.status
              };
            }
            break;

          case 'admin':
            perfilCompleto.dadosEspecificos = {
              tipo: 'admin',
              descricao: 'Administrador do sistema',
              permissoes: [
                'Gestão completa de usuários',
                'Gestão de empresas e contratos',
                'Acesso a estatísticas globais',
                'Configurações do sistema'
              ],
              acesso_total: true
            };
            break;

          default:
            perfilCompleto.dadosEspecificos = {
              tipo: req.user.tipo_usuario,
              descricao: 'Tipo de usuário sem dados específicos definidos'
            };
        }

        // Buscar dados da empresa se existir
        if (req.user.empresa_id) {
          const { Empresa } = await import('../models/Empresa.js');
          const empresa = await Empresa.findById(req.user.empresa_id);
          if (empresa) {
            perfilCompleto.empresa = {
              id: empresa.id,
              nome: empresa.nome,
              cnpj: empresa.cnpj,
              cidade: empresa.cidade,
              estado: empresa.estado
            };
          }
        }

        // Adicionar timestamp e metadata
        perfilCompleto.metadata = {
          ultimo_acesso: new Date().toISOString(),
          versao_perfil: '1.0',
          fonte_dados: 'jwt_token_e_banco_local',
          dados_especificos_carregados: Object.keys(perfilCompleto.dadosEspecificos).length > 0
        };

        console.log(`✅ Perfil completo carregado para ${req.user.tipo_usuario}: ${req.user.nome}`);
        
        this.sendResponse(res, 200, perfilCompleto, 'Perfil completo obtido com sucesso');

      } catch (modelError) {
        console.warn(`⚠️ Erro ao carregar dados específicos do ${req.user.tipo_usuario}:`, modelError.message);
        
        // Retornar perfil básico mesmo se dados específicos falharem
        perfilCompleto.dadosEspecificos = {
          tipo: req.user.tipo_usuario,
          erro: 'Dados específicos não puderam ser carregados',
          detalhes: modelError.message
        };

        this.sendResponse(res, 200, perfilCompleto, 'Perfil obtido com dados básicos (dados específicos indisponíveis)');
      }

    } catch (error) {
      this.handleError(res, error, 'obterPerfil');
    }
  }

  /**
   * PATCH /api/usuarios/me - Atualiza perfil do usuário logado
   * Middlewares: autenticar
   */
  static async atualizarMeuPerfil(req, res) {
    try {
      console.log('📝 UsuarioController.atualizarMeuPerfil - User:', req.user.id, 'Dados:', req.body);

      // Campos que o usuário pode alterar no próprio perfil
      const camposPermitidos = [
        'nome', 'telefone', 'endereco', 'cidade', 'estado', 
        'data_nascimento', 'configuracoes'
      ];
      
      const dadosLimpos = {};
      camposPermitidos.forEach(campo => {
        if (req.body[campo] !== undefined) {
          dadosLimpos[campo] = req.body[campo];
        }
      });

      if (Object.keys(dadosLimpos).length === 0) {
        return this.sendResponse(res, 400, null, 'Nenhum campo válido fornecido para atualização');
      }

      const usuario = await Usuario.atualizar(req.user.id, dadosLimpos);

      this.sendResponse(res, 200, usuario.toJSON(), 'Perfil atualizado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'atualizarMeuPerfil');
    }
  }

  /**
   * POST /api/usuarios/:id/ultimo-login - Atualiza último login
   * Middlewares: autenticar, verificarProprioUsuario
   */
  static async atualizarUltimoLogin(req, res) {
    try {
      console.log('🕒 UsuarioController.atualizarUltimoLogin - ID:', req.params.id);

      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return this.sendResponse(res, 400, null, 'ID do usuário inválido');
      }

      const usuario = await Usuario.findById(parseInt(id));
      if (!usuario) {
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      await usuario.updateLastLogin();

      this.sendResponse(res, 200, null, 'Último login atualizado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'atualizarUltimoLogin');
    }
  }

  /**
   * GET /api/usuarios/empresa/:empresaId - Lista usuários por empresa
   * Middlewares: autenticar, verificarEmpresa
   */
  static async listarPorEmpresa(req, res) {
    try {
      console.log('🏢 UsuarioController.listarPorEmpresa - Empresa:', req.params.empresaId);

      const { empresaId } = req.params;
      
      if (!empresaId || isNaN(parseInt(empresaId))) {
        return this.sendResponse(res, 400, null, 'ID da empresa inválido');
      }

      const usuarios = await Usuario.findByEmpresa(parseInt(empresaId));

      this.sendResponse(res, 200, {
        usuarios: usuarios.map(u => u.toJSON()),
        total: usuarios.length
      }, 'Usuários da empresa listados com sucesso');

    } catch (error) {
      this.handleError(res, error, 'listarPorEmpresa');
    }
  }

  /**
   * GET /api/usuarios/stats - Estatísticas dos usuários
   * Middlewares: autenticar, adminOuGestor
   */
  static async estatisticas(req, res) {
    try {
      console.log('📊 UsuarioController.estatisticas');

      const stats = await Usuario.getStats();

      this.sendResponse(res, 200, stats, 'Estatísticas obtidas com sucesso');

    } catch (error) {
      this.handleError(res, error, 'estatisticas');
    }
  }

  // ============================================================================
  // MÉTODOS DE SINCRONIZAÇÃO COM COGNITO
  // ============================================================================

  /**
   * POST /api/usuarios/sincronizar - Sincroniza usuário com Cognito
   * Middlewares: autenticar, adminOuGestor
   */
  static async sincronizarComCognito(req, res) {
    try {
      console.log('🔄 UsuarioController.sincronizarComCognito - Dados:', req.body);

      this.validateRequiredFields(req.body, ['cognito_sub', 'email', 'nome']);

      const { sincronizarUsuario } = await import('../middleware/autorizar.js');
      const usuario = await sincronizarUsuario(req.body);

      this.sendResponse(res, 200, usuario.toJSON(), 'Usuário sincronizado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'sincronizarComCognito');
    }
  }
}

export default UsuarioController;
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
   * PATCH /api/usuarios/perfil - Atualizar perfil completo com validações
   * Middlewares: autenticar
   * Valida permissões e atualiza apenas campos permitidos para cada tipo de usuário
   */
  static async atualizarPerfil(req, res) {
    try {
      console.log('✏️ UsuarioController.atualizarPerfil - User:', req.user.id, 'Tipo:', req.user.tipo_usuario);

      // Buscar usuário atual
      const usuarioAtual = await Usuario.findById(req.user.id);
      
      if (!usuarioAtual) {
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      // Definir campos permitidos por tipo de usuário
      const camposPermitidos = this._getCamposPermitidos(req.user.tipo_usuario);
      console.log(`🔒 Campos permitidos para ${req.user.tipo_usuario}:`, camposPermitidos);

      // Filtrar apenas campos permitidos dos dados recebidos
      const dadosParaAtualizar = {};
      const camposEnviados = Object.keys(req.body);
      const camposNaoPermitidos = [];

      camposEnviados.forEach(campo => {
        if (camposPermitidos.includes(campo)) {
          dadosParaAtualizar[campo] = req.body[campo];
        } else {
          camposNaoPermitidos.push(campo);
        }
      });

      // Log de campos não permitidos (sem bloquear a operação)
      if (camposNaoPermitidos.length > 0) {
        console.warn(`⚠️ Campos não permitidos ignorados para ${req.user.tipo_usuario}:`, camposNaoPermitidos);
      }

      // Validar se há dados para atualizar
      if (Object.keys(dadosParaAtualizar).length === 0) {
        return this.sendResponse(res, 400, null, 'Nenhum campo válido fornecido para atualização');
      }

      // Validações específicas
      const validationErrors = this._validarDadosAtualizacao(dadosParaAtualizar, usuarioAtual);
      if (validationErrors.length > 0) {
        return this.sendResponse(res, 400, { errors: validationErrors }, 'Dados inválidos para atualização');
      }

      // Atualizar dados principais do usuário
      console.log('📝 Atualizando dados principais:', Object.keys(dadosParaAtualizar));
      const usuarioAtualizado = await Usuario.update(req.user.id, dadosParaAtualizar);

      if (!usuarioAtualizado) {
        return this.sendResponse(res, 500, null, 'Erro ao atualizar perfil');
      }

      // Atualizar dados específicos se fornecidos
      const resultadoEspecificos = await this._atualizarDadosEspecificos(req.user, req.body);

      // Construir resposta com perfil atualizado
      const perfilAtualizado = await this._construirPerfilCompleto(usuarioAtualizado, req.user.tipo_usuario);

      // Log da operação
      console.log(`✅ Perfil atualizado com sucesso para ${req.user.tipo_usuario}: ${usuarioAtualizado.nome}`);

      // Preparar resposta detalhada
      const resposta = {
        usuario: perfilAtualizado,
        atualizacoes: {
          campos_atualizados: Object.keys(dadosParaAtualizar),
          campos_ignorados: camposNaoPermitidos,
          dados_especificos: resultadoEspecificos
        },
        metadata: {
          atualizado_em: new Date().toISOString(),
          atualizado_por: req.user.id,
          tipo_usuario: req.user.tipo_usuario
        }
      };

      this.sendResponse(res, 200, resposta, 'Perfil atualizado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'atualizarPerfil');
    }
  }

  /**
   * Retorna campos permitidos para atualização por tipo de usuário
   */
  static _getCamposPermitidos(tipoUsuario) {
    const camposBasicos = ['nome', 'telefone', 'endereco', 'cidade', 'estado', 'data_nascimento'];
    
    const permissoesPorTipo = {
      admin: [
        ...camposBasicos,
        'email', // Admin pode alterar email
        'documento',
        'tipo_usuario', // Admin pode alterar tipo
        'empresa_id', // Admin pode alterar empresa
        'status'
      ],
      gestor: [
        ...camposBasicos,
        'documento'
        // Gestor não pode alterar email, tipo_usuario ou empresa_id
      ],
      diretor: [
        ...camposBasicos
        // Diretor não pode alterar dados sensíveis
      ],
      professor: [
        ...camposBasicos
        // Professor só pode alterar dados pessoais básicos
      ],
      aluno: [
        'nome', 'telefone', 'endereco', 'cidade', 'estado'
        // Aluno tem permissões mais limitadas
      ]
    };

    return permissoesPorTipo[tipoUsuario] || camposBasicos;
  }

  /**
   * Valida dados de atualização
   */
  static _validarDadosAtualizacao(dados, usuarioAtual) {
    const erros = [];

    // Validar email se fornecido
    if (dados.email && dados.email !== usuarioAtual.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dados.email)) {
        erros.push('Email deve ter formato válido');
      }
    }

    // Validar telefone se fornecido
    if (dados.telefone) {
      const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!telefoneRegex.test(dados.telefone)) {
        erros.push('Telefone deve ter formato (XX) XXXXX-XXXX');
      }
    }

    // Validar documento se fornecido
    if (dados.documento) {
      // CPF: 11 dígitos, CNPJ: 14 dígitos
      const docLimpo = dados.documento.replace(/\D/g, '');
      if (docLimpo.length !== 11 && docLimpo.length !== 14) {
        erros.push('Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)');
      }
    }

    // Validar data de nascimento se fornecida
    if (dados.data_nascimento) {
      const data = new Date(dados.data_nascimento);
      if (isNaN(data.getTime()) || data > new Date()) {
        erros.push('Data de nascimento deve ser válida e não futura');
      }
    }

    // Validar tipo_usuario se fornecido (apenas admin pode alterar)
    if (dados.tipo_usuario) {
      const tiposValidos = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
      if (!tiposValidos.includes(dados.tipo_usuario)) {
        erros.push('Tipo de usuário deve ser: admin, gestor, diretor, professor ou aluno');
      }
    }

    // Validar empresa_id se fornecido
    if (dados.empresa_id && dados.empresa_id !== null) {
      if (!Number.isInteger(Number(dados.empresa_id)) || Number(dados.empresa_id) <= 0) {
        erros.push('ID da empresa deve ser um número inteiro positivo');
      }
    }

    return erros;
  }

  /**
   * Atualiza dados específicos do tipo de usuário se fornecidos
   */
  static async _atualizarDadosEspecificos(user, dadosRecebidos) {
    const resultado = {
      atualizou: false,
      tipo: user.tipo_usuario,
      campos: [],
      erro: null
    };

    try {
      // Verificar se há dados específicos para atualizar
      const camposEspecificos = this._extrairCamposEspecificos(user.tipo_usuario, dadosRecebidos);
      
      if (Object.keys(camposEspecificos).length === 0) {
        return resultado;
      }

      switch (user.tipo_usuario) {
        case 'professor':
          if (camposEspecificos.disciplinas || camposEspecificos.formacao) {
            const { Professor } = await import('../models/Professor.js');
            const professor = await Professor.findByUserId(user.id);
            if (professor) {
              await Professor.update(professor.id, camposEspecificos);
              resultado.atualizou = true;
              resultado.campos = Object.keys(camposEspecificos);
            }
          }
          break;

        case 'aluno':
          if (camposEspecificos.nome_responsavel || camposEspecificos.contato_responsavel) {
            const { Aluno } = await import('../models/Aluno.js');
            const aluno = await Aluno.findByUserId(user.id);
            if (aluno) {
              await Aluno.update(aluno.id, camposEspecificos);
              resultado.atualizou = true;
              resultado.campos = Object.keys(camposEspecificos);
            }
          }
          break;

        case 'diretor':
          // Diretores geralmente não podem alterar cargo ou escola
          // Apenas dados pessoais através dos campos básicos
          break;

        case 'gestor':
          // Gestores geralmente não podem alterar cargo
          // Apenas dados pessoais através dos campos básicos
          break;
      }

    } catch (error) {
      console.warn(`⚠️ Erro ao atualizar dados específicos do ${user.tipo_usuario}:`, error.message);
      resultado.erro = error.message;
    }

    return resultado;
  }

  /**
   * Extrai campos específicos do tipo de usuário dos dados recebidos
   */
  static _extrairCamposEspecificos(tipoUsuario, dados) {
    const camposEspecificos = {};

    switch (tipoUsuario) {
      case 'professor':
        if (dados.disciplinas) camposEspecificos.disciplinas = dados.disciplinas;
        if (dados.formacao) camposEspecificos.formacao = dados.formacao;
        break;
      
      case 'aluno':
        if (dados.nome_responsavel) camposEspecificos.nome_responsavel = dados.nome_responsavel;
        if (dados.contato_responsavel) camposEspecificos.contato_responsavel = dados.contato_responsavel;
        break;
    }

    return camposEspecificos;
  }

  /**
   * Constrói perfil completo após atualização
   */
  static async _construirPerfilCompleto(usuario, tipoUsuario) {
    const perfil = usuario.toJSON();

    // Adicionar dados específicos se existirem
    try {
      switch (tipoUsuario) {
        case 'professor':
          const { Professor } = await import('../models/Professor.js');
          const professor = await Professor.findByUserId(usuario.id);
          if (professor) {
            perfil.dadosEspecificos = {
              disciplinas: professor.disciplinas,
              formacao: professor.formacao,
              escola_id: professor.escola_id
            };
          }
          break;

        case 'aluno':
          const { Aluno } = await import('../models/Aluno.js');
          const aluno = await Aluno.findByUserId(usuario.id);
          if (aluno) {
            perfil.dadosEspecificos = {
              matricula: aluno.matricula,
              turma: aluno.turma,
              nome_responsavel: aluno.nome_responsavel,
              contato_responsavel: aluno.contato_responsavel
            };
          }
          break;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar dados específicos após atualização:', error.message);
    }

    return perfil;
  }

  /**
   * GET /api/usuarios - Listar usuários com filtros e paginação
   * Middlewares: autenticar, adminOuGestor, verificarEmpresa
   * Lista usuários da mesma empresa com filtros por tipo e paginação
   */
  static async listarUsuarios(req, res) {
    try {
      console.log('📋 UsuarioController.listarUsuarios - User:', req.user.id, 'Empresa:', req.user.empresa_id);

      // Extrair parâmetros de paginação
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Máximo 100 registros
      const offset = (page - 1) * limit;

      console.log(`📄 Paginação: page=${page}, limit=${limit}, offset=${offset}`);

      // Extrair filtros
      const filtros = this._extrairFiltros(req.query, req.user);
      console.log('🔍 Filtros aplicados:', filtros);

      // Buscar usuários com filtros
      const { usuarios, total } = await this._buscarUsuariosComFiltros(filtros, limit, offset);

      // Enriquecer dados dos usuários se solicitado
      const incluirDadosEspecificos = req.query.include_dados_especificos === 'true';
      let usuariosEnriquecidos = usuarios;

      if (incluirDadosEspecificos) {
        console.log('🔄 Enriquecendo dados específicos dos usuários...');
        usuariosEnriquecidos = await this._enriquecerDadosEspecificos(usuarios);
      }

      // Calcular metadados de paginação
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      // Preparar resposta
      const resposta = {
        usuarios: usuariosEnriquecidos,
        paginacao: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
          nextPage: hasNext ? page + 1 : null,
          prevPage: hasPrev ? page - 1 : null
        },
        filtros_aplicados: filtros,
        metadata: {
          empresa_id: req.user.empresa_id,
          solicitado_por: req.user.id,
          tipo_solicitante: req.user.tipo_usuario,
          timestamp: new Date().toISOString(),
          dados_especificos_incluidos: incluirDadosEspecificos
        }
      };

      console.log(`✅ Listagem concluída: ${usuarios.length} usuários encontrados de ${total} total`);
      this.sendResponse(res, 200, resposta, `${usuarios.length} usuários encontrados`);

    } catch (error) {
      this.handleError(res, error, 'listarUsuarios');
    }
  }

  /**
   * Extrai e valida filtros da query string
   */
  static _extrairFiltros(query, user) {
    const filtros = {};

    // Filtro por empresa (obrigatório para gestores)
    if (user.tipo_usuario === 'admin' && query.empresa_id) {
      filtros.empresa_id = parseInt(query.empresa_id);
    } else if (user.empresa_id) {
      filtros.empresa_id = user.empresa_id; // Força empresa do usuário
    }

    // Filtro por tipo de usuário
    if (query.tipo_usuario) {
      const tiposValidos = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
      const tiposFiltro = Array.isArray(query.tipo_usuario) 
        ? query.tipo_usuario 
        : query.tipo_usuario.split(',');
      
      filtros.tipo_usuario = tiposFiltro.filter(tipo => tiposValidos.includes(tipo.trim()));
    }

    // Filtro por status
    if (query.status) {
      const statusValidos = ['ativo', 'inativo', 'pendente', 'bloqueado'];
      if (statusValidos.includes(query.status)) {
        filtros.status = query.status;
      }
    }

    // Filtro por busca textual (nome ou email)
    if (query.busca && query.busca.trim()) {
      filtros.busca = query.busca.trim();
    }

    // Filtro por data de criação
    if (query.data_inicio) {
      const dataInicio = new Date(query.data_inicio);
      if (!isNaN(dataInicio.getTime())) {
        filtros.data_inicio = dataInicio;
      }
    }

    if (query.data_fim) {
      const dataFim = new Date(query.data_fim);
      if (!isNaN(dataFim.getTime())) {
        filtros.data_fim = dataFim;
      }
    }

    // Ordenação
    const ordenacaoValida = ['nome', 'email', 'tipo_usuario', 'criado_em', 'ultimo_login'];
    if (query.ordem_por && ordenacaoValida.includes(query.ordem_por)) {
      filtros.ordem_por = query.ordem_por;
      filtros.ordem_direcao = query.ordem_direcao === 'desc' ? 'DESC' : 'ASC';
    } else {
      filtros.ordem_por = 'nome';
      filtros.ordem_direcao = 'ASC';
    }

    return filtros;
  }

  /**
   * Busca usuários aplicando filtros e paginação
   */
  static async _buscarUsuariosComFiltros(filtros, limit, offset) {
    try {
      // Construir WHERE clause
      const condicoes = [];
      const parametros = [];
      let paramIndex = 1;

      // Filtro por empresa
      if (filtros.empresa_id) {
        condicoes.push(`empresa_id = $${paramIndex}`);
        parametros.push(filtros.empresa_id);
        paramIndex++;
      }

      // Filtro por tipo de usuário
      if (filtros.tipo_usuario && filtros.tipo_usuario.length > 0) {
        const placeholders = filtros.tipo_usuario.map(() => `$${paramIndex++}`);
        condicoes.push(`tipo_usuario IN (${placeholders.join(', ')})`);
        parametros.push(...filtros.tipo_usuario);
      }

      // Filtro por status
      if (filtros.status) {
        condicoes.push(`status = $${paramIndex}`);
        parametros.push(filtros.status);
        paramIndex++;
      }

      // Filtro por busca textual
      if (filtros.busca) {
        condicoes.push(`(nome ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        parametros.push(`%${filtros.busca}%`);
        paramIndex++;
      }

      // Filtro por data de criação
      if (filtros.data_inicio) {
        condicoes.push(`criado_em >= $${paramIndex}`);
        parametros.push(filtros.data_inicio);
        paramIndex++;
      }

      if (filtros.data_fim) {
        condicoes.push(`criado_em <= $${paramIndex}`);
        parametros.push(filtros.data_fim);
        paramIndex++;
      }

      // Construir query principal
      const whereClause = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
      const orderClause = `ORDER BY ${filtros.ordem_por} ${filtros.ordem_direcao}`;

      const queryUsuarios = `
        SELECT id, cognito_sub, email, nome, telefone, endereco, cidade, estado, 
               documento, tipo_usuario, empresa_id, status, ultimo_login, criado_em, atualizado_em
        FROM usuarios 
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      parametros.push(limit, offset);

      // Query para contar total
      const queryTotal = `
        SELECT COUNT(*) as total
        FROM usuarios 
        ${whereClause}
      `;

      const parametrosTotal = parametros.slice(0, -2); // Remove limit e offset

      console.log('🔍 Query usuários:', queryUsuarios);
      console.log('📊 Parâmetros:', parametros);

      // Importar função de banco
      const { executeQuery } = await import('../config/database.js');

      // Executar queries
      const [resultUsuarios, resultTotal] = await Promise.all([
        executeQuery(queryUsuarios, parametros),
        executeQuery(queryTotal, parametrosTotal)
      ]);

      return {
        usuarios: resultUsuarios.rows,
        total: parseInt(resultTotal.rows[0].total)
      };

    } catch (error) {
      console.error('❌ Erro ao buscar usuários com filtros:', error);
      throw error;
    }
  }

  /**
   * Enriquece dados dos usuários com informações específicas
   */
  static async _enriquecerDadosEspecificos(usuarios) {
    try {
      const usuariosEnriquecidos = [];

      for (const usuario of usuarios) {
        const usuarioEnriquecido = { ...usuario };

        // Adicionar dados específicos baseados no tipo
        try {
          switch (usuario.tipo_usuario) {
            case 'professor':
              const { Professor } = await import('../models/Professor.js');
              const professor = await Professor.findByUserId(usuario.id);
              if (professor) {
                usuarioEnriquecido.dados_especificos = {
                  disciplinas: professor.disciplinas,
                  formacao: professor.formacao,
                  escola_id: professor.escola_id,
                  data_admissao: professor.data_admissao
                };
              }
              break;

            case 'aluno':
              const { Aluno } = await import('../models/Aluno.js');
              const aluno = await Aluno.findByUserId(usuario.id);
              if (aluno) {
                usuarioEnriquecido.dados_especificos = {
                  matricula: aluno.matricula,
                  turma: aluno.turma,
                  serie: aluno.serie,
                  nome_responsavel: aluno.nome_responsavel,
                  contato_responsavel: aluno.contato_responsavel
                };
              }
              break;

            case 'diretor':
              const { Diretor } = await import('../models/Diretor.js');
              const diretor = await Diretor.findByUserId(usuario.id);
              if (diretor) {
                usuarioEnriquecido.dados_especificos = {
                  escola_id: diretor.escola_id,
                  cargo: diretor.cargo,
                  data_inicio: diretor.data_inicio
                };
              }
              break;

            case 'gestor':
              const { Gestor } = await import('../models/Gestor.js');
              const gestor = await Gestor.findByUserId(usuario.id);
              if (gestor) {
                usuarioEnriquecido.dados_especificos = {
                  cargo: gestor.cargo,
                  data_admissao: gestor.data_admissao
                };
              }
              break;

            default:
              usuarioEnriquecido.dados_especificos = null;
          }
        } catch (modelError) {
          console.warn(`⚠️ Erro ao carregar dados específicos para usuário ${usuario.id}:`, modelError.message);
          usuarioEnriquecido.dados_especificos = null;
        }

        usuariosEnriquecidos.push(usuarioEnriquecido);
      }

      return usuariosEnriquecidos;

    } catch (error) {
      console.error('❌ Erro ao enriquecer dados específicos:', error);
      return usuarios; // Retorna dados básicos em caso de erro
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
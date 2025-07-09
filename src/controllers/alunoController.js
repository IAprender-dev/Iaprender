/**
 * CONTROLLER DE ALUNOS - SISTEMA DE GESTÃO EDUCACIONAL IAPRENDER
 * 
 * Este controller gerencia todas as operações relacionadas aos alunos
 * do sistema educacional, implementando controle de acesso hierárquico
 * e validações de segurança enterprise-level.
 * 
 * HIERARQUIA DE ACESSO:
 * - Admin: Controle total de todos os alunos
 * - Gestor: Gerencia alunos da própria empresa
 * - Diretor: Acesso aos alunos da própria escola
 * - Professor: Visualização dos alunos das escolas vinculadas
 * - Aluno: Acesso apenas aos próprios dados
 */

import { Aluno } from '../models/Aluno.js';
import { Escola } from '../models/Escola.js';
import { Empresa } from '../models/Empresa.js';

export class AlunoController {
  
  /**
   * GET /api/alunos
   * Listar alunos com filtros e paginação
   */
  static async listarAlunos(req, res) {
    try {
      const usuarioLogado = req.user;
      const {
        page = 1,
        limit = 20,
        escola_id,
        empresa_id,
        turma,
        serie,
        turno,
        status = 'ativo',
        search,
        orderBy = 'nome',
        orderDirection = 'ASC'
      } = req.query;

      // Validar parâmetros de paginação
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      // Construir filtros baseados no usuário logado
      const filtros = await AlunoController._construirFiltrosUsuario(usuarioLogado, {
        escola_id: escola_id ? parseInt(escola_id) : undefined,
        empresa_id: empresa_id ? parseInt(empresa_id) : undefined,
        turma,
        serie,
        turno,
        status,
        search
      });

      // Validar campos de ordenação
      const camposOrdenacao = ['nome', 'matricula', 'turma', 'serie', 'data_matricula', 'criado_em'];
      const orderByFinal = camposOrdenacao.includes(orderBy) ? orderBy : 'nome';
      const orderDirFinal = ['ASC', 'DESC'].includes(orderDirection.toUpperCase()) ? orderDirection.toUpperCase() : 'ASC';

      // Buscar alunos
      const { alunos, total } = await Aluno.findAll({
        filtros,
        limit: limitNum,
        offset,
        orderBy: orderByFinal,
        orderDirection: orderDirFinal
      });

      // Enriquecer dados dos alunos
      const alunosEnriquecidos = await Promise.all(
        alunos.map(aluno => AlunoController._enriquecerDadosAluno(aluno))
      );

      // Calcular metadados de paginação
      const totalPages = Math.ceil(total / limitNum);
      const hasNext = pageNum < totalPages;
      const hasPrev = pageNum > 1;

      // Log de auditoria
      console.log(`📋 Alunos listados:`, {
        usuario: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        filtros_aplicados: filtros,
        total_encontrados: total,
        page: pageNum,
        limit: limitNum,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: `${total} aluno(s) encontrado(s)`,
        data: alunosEnriquecidos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext,
          hasPrev
        },
        filtros_aplicados: filtros,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao listar alunos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/alunos/:id
   * Buscar aluno específico por ID
   */
  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.user;

      // Validar ID numérico
      const alunoId = parseInt(id);
      if (!alunoId || alunoId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID do aluno deve ser um número válido',
          timestamp: new Date().toISOString()
        });
      }

      // Buscar aluno
      const aluno = await Aluno.findById(alunoId);
      if (!aluno) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar permissões de acesso
      const temAcesso = await AlunoController._verificarAcessoAluno(usuarioLogado, aluno);
      if (!temAcesso) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este aluno',
          timestamp: new Date().toISOString()
        });
      }

      // Enriquecer dados do aluno
      const alunoCompleto = await AlunoController._enriquecerDadosAluno(aluno);

      // Log de auditoria
      console.log(`📖 Aluno consultado:`, {
        aluno_id: alunoId,
        usuario: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        empresa_usuario: usuarioLogado.empresa_id,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Aluno encontrado com sucesso',
        data: alunoCompleto,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao buscar aluno por ID:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/alunos
   * Criar novo aluno no sistema
   */
  static async criarAluno(req, res) {
    try {
      const usuarioLogado = req.user;
      const dadosAluno = req.body;

      // Validar campos obrigatórios
      const camposObrigatorios = ['nome', 'escola_id', 'empresa_id', 'turma', 'serie'];
      const camposFaltando = camposObrigatorios.filter(campo => !dadosAluno[campo]);
      
      if (camposFaltando.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios faltando',
          campos_faltando: camposFaltando,
          timestamp: new Date().toISOString()
        });
      }

      // Verificar permissões de criação
      const podeCrear = await AlunoController._verificarPermissaoCriacao(usuarioLogado, dadosAluno);
      if (!podeCrear.permitido) {
        return res.status(403).json({
          success: false,
          message: podeCrear.motivo,
          timestamp: new Date().toISOString()
        });
      }

      // Validar escola e empresa
      const validacaoEntidades = await AlunoController._validarEscolaEmpresa(dadosAluno.escola_id, dadosAluno.empresa_id);
      if (!validacaoEntidades.valido) {
        return res.status(400).json({
          success: false,
          message: validacaoEntidades.erro,
          timestamp: new Date().toISOString()
        });
      }

      // Aplicar empresa automaticamente para gestores/diretores
      if (['gestor', 'diretor'].includes(usuarioLogado.tipo_usuario) && usuarioLogado.empresa_id) {
        dadosAluno.empresa_id = usuarioLogado.empresa_id;
      }

      // Gerar matrícula automaticamente se não fornecida
      if (!dadosAluno.matricula) {
        dadosAluno.matricula = await AlunoController._gerarMatricula(dadosAluno.escola_id);
      }

      // Preparar dados para criação
      const dadosCompletos = {
        ...dadosAluno,
        status: dadosAluno.status || 'ativo',
        data_matricula: dadosAluno.data_matricula || new Date(),
        turno: dadosAluno.turno || 'manhã'
      };

      // Criar aluno
      const novoAluno = await Aluno.create(dadosCompletos);

      // Enriquecer dados do aluno criado
      const alunoCompleto = await AlunoController._enriquecerDadosAluno(novoAluno);

      // Log de auditoria
      console.log(`✅ Aluno criado:`, {
        aluno_id: novoAluno.id,
        nome: novoAluno.nome,
        matricula: novoAluno.matricula,
        criado_por: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        escola_id: dadosCompletos.escola_id,
        empresa_id: dadosCompletos.empresa_id,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Aluno criado com sucesso',
        data: alunoCompleto,
        metadata: {
          criado_por: usuarioLogado.id,
          tipo_criador: usuarioLogado.tipo_usuario,
          escola_atribuida: dadosCompletos.escola_id,
          empresa_atribuida: dadosCompletos.empresa_id,
          matricula_gerada: !req.body.matricula
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao criar aluno:', error);
      
      // Tratar erros específicos
      if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          message: 'Matrícula já existe no sistema',
          error: 'Matrícula deve ser única',
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * PUT /api/alunos/:id
   * Atualizar dados de aluno específico
   */
  static async atualizarAluno(req, res) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.user;
      const dadosAtualizacao = req.body;

      // Validar ID numérico
      const alunoId = parseInt(id);
      if (!alunoId || alunoId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID do aluno deve ser um número válido',
          timestamp: new Date().toISOString()
        });
      }

      // Buscar aluno existente
      const alunoExistente = await Aluno.findById(alunoId);
      if (!alunoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar permissões de edição
      const podeEditar = await AlunoController._verificarPermissaoEdicao(usuarioLogado, alunoExistente);
      if (!podeEditar.permitido) {
        return res.status(403).json({
          success: false,
          message: podeEditar.motivo,
          timestamp: new Date().toISOString()
        });
      }

      // Filtrar campos permitidos baseado no tipo de usuário
      const camposPermitidos = AlunoController._filtrarCamposPermitidos(usuarioLogado, dadosAtualizacao);

      // Validar mudanças de escola/empresa se houver
      if (camposPermitidos.escola_id || camposPermitidos.empresa_id) {
        const escolaId = camposPermitidos.escola_id || alunoExistente.escola_id;
        const empresaId = camposPermitidos.empresa_id || alunoExistente.empresa_id;
        
        const validacaoEntidades = await AlunoController._validarEscolaEmpresa(escolaId, empresaId);
        if (!validacaoEntidades.valido) {
          return res.status(400).json({
            success: false,
            message: validacaoEntidades.erro,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Atualizar aluno
      const alunoAtualizado = await Aluno.update(alunoId, camposPermitidos);

      // Enriquecer dados do aluno atualizado
      const alunoCompleto = await AlunoController._enriquecerDadosAluno(alunoAtualizado);

      // Log de auditoria
      console.log(`✏️ Aluno atualizado:`, {
        aluno_id: alunoId,
        campos_alterados: Object.keys(camposPermitidos),
        atualizado_por: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Aluno atualizado com sucesso',
        data: alunoCompleto,
        metadata: {
          campos_atualizados: Object.keys(camposPermitidos),
          atualizado_por: usuarioLogado.id,
          tipo_editor: usuarioLogado.tipo_usuario
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar aluno:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/alunos/:id/completo
   * Obter dados completos do aluno com escola e responsável
   */
  static async obterAluno(req, res) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.user;

      // Validar ID numérico
      const alunoId = parseInt(id);
      if (!alunoId || alunoId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID do aluno deve ser um número válido',
          timestamp: new Date().toISOString()
        });
      }

      // Buscar aluno
      const aluno = await Aluno.findById(alunoId);
      if (!aluno) {
        return res.status(404).json({
          success: false,
          message: 'Aluno não encontrado',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar permissões de acesso
      const temAcesso = await AlunoController._verificarAcessoAluno(usuarioLogado, aluno);
      if (!temAcesso) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a este aluno',
          timestamp: new Date().toISOString()
        });
      }

      // Obter dados completos do aluno com enriquecimento
      const alunoCompleto = await AlunoController._obterDadosCompletos(aluno);

      // Log de auditoria
      console.log(`📋 Dados completos do aluno consultados:`, {
        aluno_id: alunoId,
        aluno_nome: aluno.nome,
        usuario: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        empresa_usuario: usuarioLogado.empresa_id,
        incluiu_escola: !!alunoCompleto.escola,
        incluiu_empresa: !!alunoCompleto.empresa,
        incluiu_responsavel: !!alunoCompleto.responsavel,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Dados completos do aluno obtidos com sucesso',
        data: alunoCompleto,
        metadata: {
          consultado_por: usuarioLogado.id,
          tipo_usuario: usuarioLogado.tipo_usuario,
          dados_incluidos: {
            aluno_basico: true,
            escola: !!alunoCompleto.escola,
            empresa: !!alunoCompleto.empresa,
            responsavel: !!alunoCompleto.responsavel,
            historico_academico: !!alunoCompleto.historico_academico
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao obter dados completos do aluno:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/alunos/stats
   * Obter estatísticas de alunos
   */
  static async obterEstatisticas(req, res) {
    try {
      const usuarioLogado = req.user;

      // Construir filtros baseados no usuário
      const filtrosUsuario = await AlunoController._construirFiltrosUsuario(usuarioLogado, {});

      // Obter estatísticas
      const stats = await Aluno.getStats(filtrosUsuario);

      // Log de auditoria
      console.log(`📊 Estatísticas de alunos consultadas:`, {
        usuario: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        filtros_aplicados: filtrosUsuario,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: stats,
        filtros_aplicados: filtrosUsuario,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de alunos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ============================================================================

  /**
   * Verificar se usuário tem acesso a um aluno específico
   */
  static async _verificarAcessoAluno(usuario, aluno) {
    // Admin tem acesso a tudo
    if (usuario.tipo_usuario === 'admin') {
      return true;
    }

    // Gestor apenas da própria empresa
    if (usuario.tipo_usuario === 'gestor') {
      return usuario.empresa_id === aluno.empresa_id;
    }

    // Diretor apenas alunos da própria escola
    if (usuario.tipo_usuario === 'diretor') {
      const { Diretor } = await import('../models/Diretor.js');
      const diretor = await Diretor.findByUserId(usuario.id);
      return diretor && diretor.escola_id === aluno.escola_id;
    }

    // Professor apenas alunos das escolas vinculadas
    if (usuario.tipo_usuario === 'professor') {
      const { Professor } = await import('../models/Professor.js');
      const professor = await Professor.findByUserId(usuario.id);
      return professor && professor.escola_id === aluno.escola_id;
    }

    // Aluno apenas próprios dados
    if (usuario.tipo_usuario === 'aluno') {
      const alunoUsuario = await Aluno.findByUserId(usuario.id);
      return alunoUsuario && alunoUsuario.id === aluno.id;
    }

    return false;
  }

  /**
   * Verificar permissões de criação de aluno
   */
  static async _verificarPermissaoCriacao(usuario, dadosAluno) {
    // Apenas admin, gestor e diretor podem criar alunos
    if (!['admin', 'gestor', 'diretor'].includes(usuario.tipo_usuario)) {
      return {
        permitido: false,
        motivo: 'Apenas administradores, gestores e diretores podem criar alunos'
      };
    }

    // Gestor só pode criar alunos da própria empresa
    if (usuario.tipo_usuario === 'gestor') {
      if (!usuario.empresa_id) {
        return {
          permitido: false,
          motivo: 'Gestor deve estar vinculado a uma empresa'
        };
      }

      if (dadosAluno.empresa_id && dadosAluno.empresa_id !== usuario.empresa_id) {
        return {
          permitido: false,
          motivo: 'Gestor só pode criar alunos da própria empresa'
        };
      }
    }

    // Diretor só pode criar alunos da própria escola
    if (usuario.tipo_usuario === 'diretor') {
      const { Diretor } = await import('../models/Diretor.js');
      const diretor = await Diretor.findByUserId(usuario.id);
      
      if (!diretor) {
        return {
          permitido: false,
          motivo: 'Diretor deve estar vinculado a uma escola'
        };
      }

      if (dadosAluno.escola_id && dadosAluno.escola_id !== diretor.escola_id) {
        return {
          permitido: false,
          motivo: 'Diretor só pode criar alunos da própria escola'
        };
      }
    }

    return { permitido: true };
  }

  /**
   * Verificar permissões de edição de aluno
   */
  static async _verificarPermissaoEdicao(usuario, aluno) {
    // Admin pode editar qualquer aluno
    if (usuario.tipo_usuario === 'admin') {
      return { permitido: true };
    }

    // Gestor apenas alunos da própria empresa
    if (usuario.tipo_usuario === 'gestor') {
      if (usuario.empresa_id !== aluno.empresa_id) {
        return {
          permitido: false,
          motivo: 'Gestor só pode editar alunos da própria empresa'
        };
      }
      return { permitido: true };
    }

    // Diretor apenas alunos da própria escola
    if (usuario.tipo_usuario === 'diretor') {
      const { Diretor } = await import('../models/Diretor.js');
      const diretor = await Diretor.findByUserId(usuario.id);
      
      if (!diretor || diretor.escola_id !== aluno.escola_id) {
        return {
          permitido: false,
          motivo: 'Diretor só pode editar alunos da própria escola'
        };
      }
      return { permitido: true };
    }

    // Aluno apenas próprios dados
    if (usuario.tipo_usuario === 'aluno') {
      const alunoUsuario = await Aluno.findByUserId(usuario.id);
      if (!alunoUsuario || alunoUsuario.id !== aluno.id) {
        return {
          permitido: false,
          motivo: 'Aluno só pode editar próprios dados'
        };
      }
      return { permitido: true };
    }

    return {
      permitido: false,
      motivo: 'Sem permissão para editar alunos'
    };
  }

  /**
   * Filtrar campos permitidos para edição baseado no tipo de usuário
   */
  static _filtrarCamposPermitidos(usuario, dados) {
    const camposComuns = ['nome', 'nome_responsavel', 'contato_responsavel', 'turma', 'serie', 'turno'];
    
    // Admin pode alterar tudo
    if (usuario.tipo_usuario === 'admin') {
      return dados;
    }

    // Gestor pode alterar quase tudo exceto empresa_id
    if (usuario.tipo_usuario === 'gestor') {
      const { empresa_id, ...dadosSemEmpresa } = dados;
      return dadosSemEmpresa;
    }

    // Diretor pode alterar dados acadêmicos e de contato
    if (usuario.tipo_usuario === 'diretor') {
      const camposPermitidos = {};
      [...camposComuns, 'status'].forEach(campo => {
        if (dados[campo] !== undefined) {
          camposPermitidos[campo] = dados[campo];
        }
      });
      return camposPermitidos;
    }

    // Aluno apenas dados de contato do responsável
    if (usuario.tipo_usuario === 'aluno') {
      const camposPermitidos = {};
      ['nome_responsavel', 'contato_responsavel'].forEach(campo => {
        if (dados[campo] !== undefined) {
          camposPermitidos[campo] = dados[campo];
        }
      });
      return camposPermitidos;
    }

    return {};
  }

  /**
   * Construir filtros baseados no usuário logado
   */
  static async _construirFiltrosUsuario(usuario, filtrosRequisicao) {
    const filtros = { ...filtrosRequisicao };

    // Admin pode ver tudo
    if (usuario.tipo_usuario === 'admin') {
      return filtros;
    }

    // Gestor apenas da própria empresa
    if (usuario.tipo_usuario === 'gestor' && usuario.empresa_id) {
      filtros.empresa_id = usuario.empresa_id;
      return filtros;
    }

    // Diretor apenas da própria escola
    if (usuario.tipo_usuario === 'diretor') {
      const { Diretor } = await import('../models/Diretor.js');
      const diretor = await Diretor.findByUserId(usuario.id);
      if (diretor) {
        filtros.escola_id = diretor.escola_id;
      }
      return filtros;
    }

    // Professor apenas alunos das escolas vinculadas
    if (usuario.tipo_usuario === 'professor') {
      const { Professor } = await import('../models/Professor.js');
      const professor = await Professor.findByUserId(usuario.id);
      if (professor) {
        filtros.escola_id = professor.escola_id;
      }
      return filtros;
    }

    // Aluno apenas próprios dados
    if (usuario.tipo_usuario === 'aluno') {
      const aluno = await Aluno.findByUserId(usuario.id);
      if (aluno) {
        filtros.id = aluno.id;
      }
      return filtros;
    }

    return filtros;
  }

  /**
   * Validar se escola e empresa existem e são compatíveis
   */
  static async _validarEscolaEmpresa(escolaId, empresaId) {
    try {
      // Verificar se empresa existe
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        return {
          valido: false,
          erro: 'Empresa não encontrada'
        };
      }

      // Verificar se escola existe
      const escola = await Escola.findById(escolaId);
      if (!escola) {
        return {
          valido: false,
          erro: 'Escola não encontrada'
        };
      }

      // Verificar se escola pertence à empresa
      if (escola.empresa_id !== empresaId) {
        return {
          valido: false,
          erro: 'Escola não pertence à empresa especificada'
        };
      }

      return { valido: true };
    } catch (error) {
      return {
        valido: false,
        erro: 'Erro ao validar escola e empresa'
      };
    }
  }

  /**
   * Gerar matrícula automaticamente
   */
  static async _gerarMatricula(escolaId) {
    try {
      const ano = new Date().getFullYear();
      const ultimoAluno = await Aluno.findLastByEscola(escolaId);
      
      let proximoNumero = 1;
      if (ultimoAluno && ultimoAluno.matricula) {
        const numeroAtual = parseInt(ultimoAluno.matricula.slice(-3));
        proximoNumero = numeroAtual + 1;
      }

      return `${ano}${escolaId.toString().padStart(2, '0')}${proximoNumero.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar matrícula:', error);
      const timestamp = Date.now().toString().slice(-6);
      return `${new Date().getFullYear()}${timestamp}`;
    }
  }

  /**
   * Obter dados completos do aluno com todas as informações relacionadas
   */
  static async _obterDadosCompletos(aluno) {
    try {
      const dadosCompletos = {
        // Dados básicos do aluno
        id: aluno.id,
        nome: aluno.nome,
        matricula: aluno.matricula,
        turma: aluno.turma,
        serie: aluno.serie,
        turno: aluno.turno,
        data_matricula: aluno.data_matricula,
        status: aluno.status,
        escola_id: aluno.escola_id,
        empresa_id: aluno.empresa_id,
        criado_em: aluno.criado_em
      };

      // Dados do responsável
      dadosCompletos.responsavel = {
        nome: aluno.nome_responsavel || null,
        contato: aluno.contato_responsavel || null,
        parentesco: aluno.parentesco_responsavel || 'Responsável',
        endereco: aluno.endereco_responsavel || null,
        documento: aluno.documento_responsavel || null
      };

      // Buscar dados da escola
      if (aluno.escola_id) {
        try {
          const escola = await Escola.findById(aluno.escola_id);
          if (escola) {
            dadosCompletos.escola = {
              id: escola.id,
              nome: escola.nome,
              codigo_inep: escola.codigo_inep,
              tipo_escola: escola.tipo_escola,
              telefone: escola.telefone,
              email: escola.email,
              endereco: escola.endereco,
              cidade: escola.cidade,
              estado: escola.estado,
              status: escola.status,
              diretor: null // Será preenchido abaixo
            };

            // Buscar diretor da escola
            try {
              const { Diretor } = await import('../models/Diretor.js');
              const diretor = await Diretor.findByEscolaId(escola.id);
              if (diretor) {
                dadosCompletos.escola.diretor = {
                  id: diretor.id,
                  nome: diretor.nome,
                  cargo: diretor.cargo,
                  data_inicio: diretor.data_inicio
                };
              }
            } catch (err) {
              console.log('ℹ️ Diretor não encontrado para a escola:', escola.id);
            }
          }
        } catch (err) {
          console.error('❌ Erro ao buscar dados da escola:', err);
          dadosCompletos.escola = null;
        }
      }

      // Buscar dados da empresa
      if (aluno.empresa_id) {
        try {
          const empresa = await Empresa.findById(aluno.empresa_id);
          if (empresa) {
            dadosCompletos.empresa = {
              id: empresa.id,
              nome: empresa.nome,
              cnpj: empresa.cnpj,
              telefone: empresa.telefone,
              email_contato: empresa.email_contato,
              cidade: empresa.cidade,
              estado: empresa.estado,
              logo: empresa.logo
            };
          }
        } catch (err) {
          console.error('❌ Erro ao buscar dados da empresa:', err);
          dadosCompletos.empresa = null;
        }
      }

      // Buscar histórico acadêmico (notas, frequência, observações)
      try {
        dadosCompletos.historico_academico = {
          ano_letivo: new Date().getFullYear(),
          situacao: aluno.status === 'ativo' ? 'Matriculado' : 'Inativo',
          data_ultima_atualizacao: aluno.atualizado_em || aluno.criado_em,
          observacoes: aluno.observacoes || null,
          necessidades_especiais: aluno.necessidades_especiais || null
        };
      } catch (err) {
        console.error('❌ Erro ao construir histórico acadêmico:', err);
        dadosCompletos.historico_academico = null;
      }

      // Estatísticas de acesso (para auditoria)
      dadosCompletos.metadata = {
        total_acessos: 1, // Seria consultado de uma tabela de logs
        ultimo_acesso: new Date().toISOString(),
        dados_completos: true,
        versao_dados: '2.0'
      };

      return dadosCompletos;

    } catch (error) {
      console.error('❌ Erro ao obter dados completos do aluno:', error);
      // Retornar pelo menos os dados básicos em caso de erro
      return {
        ...aluno,
        responsavel: {
          nome: aluno.nome_responsavel || null,
          contato: aluno.contato_responsavel || null
        },
        escola: null,
        empresa: null,
        historico_academico: null,
        metadata: {
          dados_completos: false,
          erro: 'Erro ao enriquecer dados'
        }
      };
    }
  }

  /**
   * Enriquecer dados do aluno com informações relacionadas
   */
  static async _enriquecerDadosAluno(aluno) {
    try {
      const dadosEnriquecidos = { ...aluno };

      // Buscar dados da escola
      if (aluno.escola_id) {
        const escola = await Escola.findById(aluno.escola_id);
        if (escola) {
          dadosEnriquecidos.escola = {
            id: escola.id,
            nome: escola.nome,
            codigo_inep: escola.codigo_inep,
            tipo_escola: escola.tipo_escola,
            cidade: escola.cidade,
            estado: escola.estado
          };
        }
      }

      // Buscar dados da empresa
      if (aluno.empresa_id) {
        const empresa = await Empresa.findById(aluno.empresa_id);
        if (empresa) {
          dadosEnriquecidos.empresa = {
            id: empresa.id,
            nome: empresa.nome,
            cnpj: empresa.cnpj,
            cidade: empresa.cidade,
            estado: empresa.estado
          };
        }
      }

      return dadosEnriquecidos;
    } catch (error) {
      console.error('Erro ao enriquecer dados do aluno:', error);
      return aluno;
    }
  }
}
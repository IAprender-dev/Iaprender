/**
 * CONTROLLER DE ESCOLAS - SISTEMA DE GESTÃO EDUCACIONAL IAPRENDER
 * 
 * Este controller gerencia todas as operações relacionadas às escolas
 * do sistema educacional, implementando controle de acesso hierárquico
 * e validações de segurança enterprise-level.
 * 
 * HIERARQUIA DE ACESSO:
 * - Admin: Controle total de todas as escolas
 * - Gestor: Gerencia escolas da própria empresa
 * - Diretor: Acesso apenas à própria escola
 * - Professor: Visualização da escola vinculada
 * - Aluno: Visualização da escola vinculada
 */

import { Escola } from '../models/Escola.js';
import { Empresa } from '../models/Empresa.js';
import { Contrato } from '../models/Contrato.js';

export class EscolaController {
  
  /**
   * GET /api/escolas/:id
   * Buscar escola específica por ID
   */
  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.user;

      // Validar ID numérico
      const escolaId = parseInt(id);
      if (!escolaId || escolaId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID da escola deve ser um número válido',
          timestamp: new Date().toISOString()
        });
      }

      // Buscar escola
      const escola = await Escola.findById(escolaId);
      if (!escola) {
        return res.status(404).json({
          success: false,
          message: 'Escola não encontrada',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar permissões de acesso
      const temAcesso = await EscolaController._verificarAcessoEscola(usuarioLogado, escola);
      if (!temAcesso) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a esta escola',
          timestamp: new Date().toISOString()
        });
      }

      // Enriquecer dados da escola
      const escolaCompleta = await EscolaController._enriquecerDadosEscola(escola);

      // Log de auditoria
      console.log(`📖 Escola consultada:`, {
        escola_id: escolaId,
        usuario: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        empresa_usuario: usuarioLogado.empresa_id,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Escola encontrada com sucesso',
        data: escolaCompleta,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao buscar escola por ID:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/escolas
   * Listar escolas com filtros e paginação
   */
  static async listarEscolas(req, res) {
    try {
      const usuarioLogado = req.user;
      const {
        page = 1,
        limit = 20,
        empresa_id,
        contrato_id,
        tipo_escola,
        status = 'ativo',
        search,
        estado,
        cidade,
        orderBy = 'nome',
        orderDirection = 'ASC'
      } = req.query;

      // Validar paginação
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      // Construir filtros baseados no usuário
      const filtros = await EscolaController._construirFiltrosUsuario(usuarioLogado, {
        empresa_id,
        contrato_id,
        tipo_escola,
        status,
        search,
        estado,
        cidade
      });

      // Buscar escolas com filtros
      const { escolas, total } = await Escola.findAllWithFilters(filtros, {
        limit: limitNum,
        offset,
        orderBy,
        orderDirection: orderDirection.toUpperCase()
      });

      // Enriquecer dados das escolas
      const escolasEnriquecidas = await Promise.all(
        escolas.map(escola => EscolaController._enriquecerDadosEscola(escola))
      );

      // Calcular metadados de paginação
      const totalPages = Math.ceil(total / limitNum);
      const hasNext = pageNum < totalPages;
      const hasPrev = pageNum > 1;

      // Log de auditoria
      console.log(`📋 Escolas listadas:`, {
        usuario: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        filtros_aplicados: filtros,
        total_encontradas: total,
        page: pageNum,
        limit: limitNum,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: `${total} escola(s) encontrada(s)`,
        data: escolasEnriquecidas,
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
      console.error('❌ Erro ao listar escolas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/escolas
   * Criar nova escola no sistema
   */
  static async criarEscola(req, res) {
    try {
      const usuarioLogado = req.user;
      const dadosEscola = req.body;

      // Validar campos obrigatórios
      const camposObrigatorios = ['nome', 'codigo_inep', 'tipo_escola', 'contrato_id', 'empresa_id'];
      const camposFaltando = camposObrigatorios.filter(campo => !dadosEscola[campo]);
      
      if (camposFaltando.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios faltando',
          campos_faltando: camposFaltando,
          timestamp: new Date().toISOString()
        });
      }

      // Verificar permissões de criação
      const podeCrear = await EscolaController._verificarPermissaoCriacao(usuarioLogado, dadosEscola);
      if (!podeCrear.permitido) {
        return res.status(403).json({
          success: false,
          message: podeCrear.motivo,
          timestamp: new Date().toISOString()
        });
      }

      // Validar empresa e contrato
      const validacaoEntidades = await EscolaController._validarEmpresaContrato(dadosEscola.empresa_id, dadosEscola.contrato_id);
      if (!validacaoEntidades.valido) {
        return res.status(400).json({
          success: false,
          message: validacaoEntidades.erro,
          timestamp: new Date().toISOString()
        });
      }

      // Aplicar empresa automaticamente para gestores
      if (usuarioLogado.tipo_usuario === 'gestor' && usuarioLogado.empresa_id) {
        dadosEscola.empresa_id = usuarioLogado.empresa_id;
      }

      // Preparar dados para criação
      const dadosCompletos = {
        ...dadosEscola,
        status: dadosEscola.status || 'ativo',
        criado_por: usuarioLogado.id
      };

      // Criar escola
      const novaEscola = await Escola.create(dadosCompletos);

      // Enriquecer dados da escola criada
      const escolaCompleta = await EscolaController._enriquecerDadosEscola(novaEscola);

      // Log de auditoria
      console.log(`✅ Escola criada:`, {
        escola_id: novaEscola.id,
        nome: novaEscola.nome,
        codigo_inep: novaEscola.codigo_inep,
        criado_por: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        empresa_id: dadosCompletos.empresa_id,
        contrato_id: dadosCompletos.contrato_id,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Escola criada com sucesso',
        data: escolaCompleta,
        metadata: {
          criado_por: usuarioLogado.id,
          tipo_criador: usuarioLogado.tipo_usuario,
          empresa_atribuida: dadosCompletos.empresa_id,
          contrato_vinculado: dadosCompletos.contrato_id
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao criar escola:', error);
      
      // Tratar erros específicos
      if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          message: 'Código INEP já existe no sistema',
          error: 'Código INEP deve ser único',
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
   * PUT /api/escolas/:id
   * Atualizar dados de escola específica
   */
  static async atualizarEscola(req, res) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.user;
      const dadosAtualizacao = req.body;

      // Validar ID numérico
      const escolaId = parseInt(id);
      if (!escolaId || escolaId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID da escola deve ser um número válido',
          timestamp: new Date().toISOString()
        });
      }

      // Buscar escola existente
      const escolaExistente = await Escola.findById(escolaId);
      if (!escolaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Escola não encontrada',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar permissões de edição
      const podeEditar = await EscolaController._verificarPermissaoEdicao(usuarioLogado, escolaExistente);
      if (!podeEditar.permitido) {
        return res.status(403).json({
          success: false,
          message: podeEditar.motivo,
          timestamp: new Date().toISOString()
        });
      }

      // Filtrar campos permitidos baseado no tipo de usuário
      const camposPermitidos = EscolaController._filtrarCamposPermitidos(usuarioLogado, dadosAtualizacao);

      // Validar mudanças de empresa/contrato se houver
      if (camposPermitidos.empresa_id || camposPermitidos.contrato_id) {
        const empresaId = camposPermitidos.empresa_id || escolaExistente.empresa_id;
        const contratoId = camposPermitidos.contrato_id || escolaExistente.contrato_id;
        
        const validacaoEntidades = await EscolaController._validarEmpresaContrato(empresaId, contratoId);
        if (!validacaoEntidades.valido) {
          return res.status(400).json({
            success: false,
            message: validacaoEntidades.erro,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Atualizar escola
      const escolaAtualizada = await Escola.update(escolaId, camposPermitidos);

      // Enriquecer dados da escola atualizada
      const escolaCompleta = await EscolaController._enriquecerDadosEscola(escolaAtualizada);

      // Log de auditoria
      console.log(`✏️ Escola atualizada:`, {
        escola_id: escolaId,
        campos_alterados: Object.keys(camposPermitidos),
        atualizado_por: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Escola atualizada com sucesso',
        data: escolaCompleta,
        metadata: {
          campos_atualizados: Object.keys(camposPermitidos),
          atualizado_por: usuarioLogado.id,
          tipo_editor: usuarioLogado.tipo_usuario
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar escola:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * DELETE /api/escolas/:id
   * Remover escola do sistema (apenas admin)
   */
  static async removerEscola(req, res) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.user;

      // Validar ID numérico
      const escolaId = parseInt(id);
      if (!escolaId || escolaId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID da escola deve ser um número válido',
          timestamp: new Date().toISOString()
        });
      }

      // Buscar escola existente
      const escola = await Escola.findById(escolaId);
      if (!escola) {
        return res.status(404).json({
          success: false,
          message: 'Escola não encontrada',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar dependências (diretores, professores, alunos)
      const dependencias = await EscolaController._verificarDependenciasEscola(escolaId);
      if (dependencias.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Não é possível excluir a escola "${escola.nome}" pois possui dependências`,
          dependencias: dependencias,
          timestamp: new Date().toISOString()
        });
      }

      // Remover escola
      await Escola.delete(escolaId);

      // Log de auditoria
      console.log(`🗑️ Escola removida:`, {
        escola_id: escolaId,
        nome: escola.nome,
        codigo_inep: escola.codigo_inep,
        removido_por: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: `Escola "${escola.nome}" removida com sucesso`,
        metadata: {
          escola_removida: {
            id: escolaId,
            nome: escola.nome,
            codigo_inep: escola.codigo_inep
          },
          removido_por: usuarioLogado.id,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao remover escola:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/escolas/stats
   * Obter estatísticas de escolas
   */
  static async obterEstatisticas(req, res) {
    try {
      const usuarioLogado = req.user;

      // Construir filtros baseados no usuário
      const filtrosUsuario = await EscolaController._construirFiltrosUsuario(usuarioLogado, {});

      // Obter estatísticas
      const stats = await Escola.getStats(filtrosUsuario);

      // Log de auditoria
      console.log(`📊 Estatísticas de escolas consultadas:`, {
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
      console.error('❌ Erro ao obter estatísticas de escolas:', error);
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
   * Verificar se usuário tem acesso a uma escola específica
   */
  static async _verificarAcessoEscola(usuario, escola) {
    // Admin tem acesso a tudo
    if (usuario.tipo_usuario === 'admin') {
      return true;
    }

    // Gestor apenas da própria empresa
    if (usuario.tipo_usuario === 'gestor') {
      return usuario.empresa_id === escola.empresa_id;
    }

    // Diretor apenas da própria escola
    if (usuario.tipo_usuario === 'diretor') {
      // Verificar se o diretor está vinculado a esta escola
      const { Diretor } = await import('../models/Diretor.js');
      const diretor = await Diretor.findByUserId(usuario.id);
      return diretor && diretor.escola_id === escola.id;
    }

    // Professor/Aluno apenas da escola vinculada
    if (usuario.tipo_usuario === 'professor') {
      const { Professor } = await import('../models/Professor.js');
      const professor = await Professor.findByUserId(usuario.id);
      return professor && professor.escola_id === escola.id;
    }

    if (usuario.tipo_usuario === 'aluno') {
      const { Aluno } = await import('../models/Aluno.js');
      const aluno = await Aluno.findByUserId(usuario.id);
      return aluno && aluno.escola_id === escola.id;
    }

    return false;
  }

  /**
   * Verificar permissões de criação de escola
   */
  static async _verificarPermissaoCriacao(usuario, dadosEscola) {
    // Apenas admin e gestor podem criar escolas
    if (!['admin', 'gestor'].includes(usuario.tipo_usuario)) {
      return {
        permitido: false,
        motivo: 'Apenas administradores e gestores podem criar escolas'
      };
    }

    // Gestor só pode criar escolas da própria empresa
    if (usuario.tipo_usuario === 'gestor') {
      if (!usuario.empresa_id) {
        return {
          permitido: false,
          motivo: 'Gestor deve estar vinculado a uma empresa'
        };
      }

      if (dadosEscola.empresa_id && dadosEscola.empresa_id !== usuario.empresa_id) {
        return {
          permitido: false,
          motivo: 'Gestor só pode criar escolas da própria empresa'
        };
      }
    }

    return { permitido: true };
  }

  /**
   * Verificar permissões de edição de escola
   */
  static async _verificarPermissaoEdicao(usuario, escola) {
    // Admin pode editar qualquer escola
    if (usuario.tipo_usuario === 'admin') {
      return { permitido: true };
    }

    // Gestor apenas escolas da própria empresa
    if (usuario.tipo_usuario === 'gestor') {
      if (usuario.empresa_id !== escola.empresa_id) {
        return {
          permitido: false,
          motivo: 'Gestor só pode editar escolas da própria empresa'
        };
      }
      return { permitido: true };
    }

    // Diretor apenas dados básicos da própria escola
    if (usuario.tipo_usuario === 'diretor') {
      const { Diretor } = await import('../models/Diretor.js');
      const diretor = await Diretor.findByUserId(usuario.id);
      
      if (!diretor || diretor.escola_id !== escola.id) {
        return {
          permitido: false,
          motivo: 'Diretor só pode editar dados da própria escola'
        };
      }
      return { permitido: true };
    }

    return {
      permitido: false,
      motivo: 'Sem permissão para editar escolas'
    };
  }

  /**
   * Filtrar campos permitidos para edição baseado no tipo de usuário
   */
  static _filtrarCamposPermitidos(usuario, dados) {
    const camposComuns = ['nome', 'telefone', 'email', 'endereco', 'cidade'];
    
    // Admin pode alterar tudo
    if (usuario.tipo_usuario === 'admin') {
      return dados;
    }

    // Gestor pode alterar quase tudo exceto empresa_id
    if (usuario.tipo_usuario === 'gestor') {
      const { empresa_id, ...dadosSemEmpresa } = dados;
      return dadosSemEmpresa;
    }

    // Diretor apenas dados básicos
    if (usuario.tipo_usuario === 'diretor') {
      const camposPermitidos = {};
      camposComuns.forEach(campo => {
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

    // Professor/Aluno apenas da escola vinculada
    if (usuario.tipo_usuario === 'professor') {
      const { Professor } = await import('../models/Professor.js');
      const professor = await Professor.findByUserId(usuario.id);
      if (professor) {
        filtros.escola_id = professor.escola_id;
      }
      return filtros;
    }

    if (usuario.tipo_usuario === 'aluno') {
      const { Aluno } = await import('../models/Aluno.js');
      const aluno = await Aluno.findByUserId(usuario.id);
      if (aluno) {
        filtros.escola_id = aluno.escola_id;
      }
      return filtros;
    }

    return filtros;
  }

  /**
   * Validar se empresa e contrato existem e são compatíveis
   */
  static async _validarEmpresaContrato(empresaId, contratoId) {
    try {
      // Verificar se empresa existe
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        return {
          valido: false,
          erro: 'Empresa não encontrada'
        };
      }

      // Verificar se contrato existe
      const contrato = await Contrato.findById(contratoId);
      if (!contrato) {
        return {
          valido: false,
          erro: 'Contrato não encontrado'
        };
      }

      // Verificar se contrato pertence à empresa
      if (contrato.empresa_id !== empresaId) {
        return {
          valido: false,
          erro: 'Contrato não pertence à empresa especificada'
        };
      }

      return { valido: true };
    } catch (error) {
      return {
        valido: false,
        erro: 'Erro ao validar empresa e contrato'
      };
    }
  }

  /**
   * Enriquecer dados da escola com informações relacionadas
   */
  static async _enriquecerDadosEscola(escola, incluirContadores = false) {
    try {
      const dadosEnriquecidos = { ...escola };

      // Buscar dados da empresa
      if (escola.empresa_id) {
        const empresa = await Empresa.findById(escola.empresa_id);
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

      // Buscar dados do contrato
      if (escola.contrato_id) {
        const contrato = await Contrato.findById(escola.contrato_id);
        if (contrato) {
          dadosEnriquecidos.contrato = {
            id: contrato.id,
            descricao: contrato.descricao,
            numero_licencas: contrato.numero_licencas,
            valor_total: contrato.valor_total,
            data_inicio: contrato.data_inicio,
            data_fim: contrato.data_fim,
            status: contrato.status
          };
        }
      }

      // Incluir contadores se solicitado
      if (incluirContadores) {
        dadosEnriquecidos.contadores = await EscolaController._obterContadoresEscola(escola.id);
      }

      return dadosEnriquecidos;
    } catch (error) {
      console.error('Erro ao enriquecer dados da escola:', error);
      return escola;
    }
  }

  /**
   * Verificar dependências da escola antes da exclusão
   */
  static async _verificarDependenciasEscola(escolaId) {
    const dependencias = [];

    try {
      // Verificar diretores
      const { Diretor } = await import('../models/Diretor.js');
      const diretores = await Diretor.findByEscolaId(escolaId);
      if (diretores.length > 0) {
        dependencias.push({
          tipo: 'diretores',
          quantidade: diretores.length,
          detalhes: `${diretores.length} diretor(es) vinculado(s)`
        });
      }

      // Verificar professores
      const { Professor } = await import('../models/Professor.js');
      const professores = await Professor.findByEscolaId(escolaId);
      if (professores.length > 0) {
        dependencias.push({
          tipo: 'professores',
          quantidade: professores.length,
          detalhes: `${professores.length} professor(es) vinculado(s)`
        });
      }

      // Verificar alunos
      const { Aluno } = await import('../models/Aluno.js');
      const alunos = await Aluno.findByEscolaId(escolaId);
      if (alunos.length > 0) {
        dependencias.push({
          tipo: 'alunos',
          quantidade: alunos.length,
          detalhes: `${alunos.length} aluno(s) vinculado(s)`
        });
      }

    } catch (error) {
      console.error('Erro ao verificar dependências da escola:', error);
    }

    return dependencias;
  }

  /**
   * Obter contadores de alunos e professores da escola
   */
  static async _obterContadoresEscola(escolaId) {
    try {
      const contadores = {
        total_alunos: 0,
        total_professores: 0,
        total_diretores: 0,
        alunos_ativos: 0,
        professores_ativos: 0,
        diretores_ativos: 0
      };

      // Contar diretores
      try {
        const { Diretor } = await import('../models/Diretor.js');
        const diretores = await Diretor.findByEscolaId(escolaId);
        contadores.total_diretores = diretores.length;
        contadores.diretores_ativos = diretores.filter(d => d.status === 'ativo').length;
      } catch (error) {
        console.log('Modelo Diretor não disponível:', error.message);
      }

      // Contar professores
      try {
        const { Professor } = await import('../models/Professor.js');
        const professores = await Professor.findByEscolaId(escolaId);
        contadores.total_professores = professores.length;
        contadores.professores_ativos = professores.filter(p => p.status === 'ativo').length;
      } catch (error) {
        console.log('Modelo Professor não disponível:', error.message);
      }

      // Contar alunos
      try {
        const { Aluno } = await import('../models/Aluno.js');
        const alunos = await Aluno.findByEscolaId(escolaId);
        contadores.total_alunos = alunos.length;
        contadores.alunos_ativos = alunos.filter(a => a.status === 'ativo').length;
      } catch (error) {
        console.log('Modelo Aluno não disponível:', error.message);
      }

      return contadores;
    } catch (error) {
      console.error('Erro ao obter contadores da escola:', error);
      return {
        total_alunos: 0,
        total_professores: 0,
        total_diretores: 0,
        alunos_ativos: 0,
        professores_ativos: 0,
        diretores_ativos: 0
      };
    }
  }

  /**
   * GET /api/escolas/:id/detalhes
   * Obter escola com dados completos incluindo contadores
   */
  static async obterEscola(req, res) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.user;

      // Validar ID numérico
      const escolaId = parseInt(id);
      if (!escolaId || escolaId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID da escola deve ser um número válido',
          timestamp: new Date().toISOString()
        });
      }

      // Buscar escola
      const escola = await Escola.findById(escolaId);
      if (!escola) {
        return res.status(404).json({
          success: false,
          message: 'Escola não encontrada',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar permissões de acesso
      const temAcesso = await EscolaController._verificarAcessoEscola(usuarioLogado, escola);
      if (!temAcesso) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a esta escola',
          timestamp: new Date().toISOString()
        });
      }

      // Enriquecer dados da escola com contadores
      const escolaCompleta = await EscolaController._enriquecerDadosEscola(escola, true);

      // Log de auditoria
      console.log(`📊 Escola com detalhes consultada:`, {
        escola_id: escolaId,
        nome: escola.nome,
        usuario: `${usuarioLogado.id} (${usuarioLogado.tipo_usuario})`,
        empresa_usuario: usuarioLogado.empresa_id,
        contadores_incluidos: true,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Dados completos da escola obtidos com sucesso',
        data: escolaCompleta,
        metadata: {
          incluiu_contadores: true,
          consultado_por: usuarioLogado.id,
          tipo_usuario: usuarioLogado.tipo_usuario,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao obter escola com detalhes:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
      });
    }
  }
}
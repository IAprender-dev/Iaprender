import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { CognitoJWTVerifier } from '../services/CognitoJWTVerifier.js';
import { db } from '../db.js';
import { usuarios } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  nome: string;
  username: string;
  role: string;
  tipo_usuario: string;
  empresa_id: number | null;
  status: string;
  groups: string[];
  ultimoLogin?: Date;
  tentativasLogin?: number;
  bloqueado?: boolean;
}

export interface RequisicaoAutenticada extends Request {
  usuario?: UsuarioAutenticado;
  contextoSeguranca?: {
    ipAddress: string;
    userAgent: string;
    timestamp: number;
    scoreRisco: number;
  };
}

/**
 * Middleware de Autenticação Unificado
 * 
 * Características:
 * - Mensagens em português brasileiro
 * - Rate limiting inteligente
 * - Controle de acesso hierárquico
 * - Log de segurança
 * - Verificação de tokens JWT do AWS Cognito
 */
export class AuthMiddlewareUnified {
  private verificadorJWT: CognitoJWTVerifier;
  private limitadores: Map<string, any>;
  private tentativasLogin: Map<string, number>;
  private ipsBloquedos: Set<string>;

  constructor() {
    this.verificadorJWT = new CognitoJWTVerifier();
    this.limitadores = new Map();
    this.tentativasLogin = new Map();
    this.ipsBloquedos = new Set();
    
    this.configurarLimitadores();
    this.iniciarLimpezaSeguranca();
  }

  private configurarLimitadores() {
    // Limitador para tentativas de login
    this.limitadores.set('login', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 tentativas
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        sucesso: false,
        erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        codigo: 'LIMITE_LOGIN_EXCEDIDO'
      },
      keyGenerator: (req) => `${req.ip}-${req.headers['user-agent']}`
    }));

    // Limitador para APIs em geral
    this.limitadores.set('api', rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 100, // máximo 100 requisições
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        sucesso: false,
        erro: 'Limite de requisições excedido. Tente novamente em 1 minuto.',
        codigo: 'LIMITE_API_EXCEDIDO'
      }
    }));

    // Limitador para operações administrativas
    this.limitadores.set('admin', rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 20, // máximo 20 operações administrativas
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        sucesso: false,
        erro: 'Limite de operações administrativas excedido. Tente novamente em 5 minutos.',
        codigo: 'LIMITE_ADMIN_EXCEDIDO'
      }
    }));
  }

  private iniciarLimpezaSeguranca() {
    // Limpar dados de segurança a cada hora
    setInterval(() => {
      this.tentativasLogin.clear();
      this.ipsBloquedos.clear();
      console.log('🧹 Limpeza de dados de segurança realizada');
    }, 60 * 60 * 1000); // 1 hora
  }

  private calcularScoreRisco(ip: string, userAgent: string): number {
    let score = 0;

    // Verificar tentativas de login
    const tentativas = this.tentativasLogin.get(ip) || 0;
    score += tentativas * 20;

    // Verificar user agent suspeito
    if (!userAgent || userAgent.includes('bot') || userAgent.includes('curl')) {
      score += 30;
    }

    // Verificar IP bloqueado
    if (this.ipsBloquedos.has(ip)) {
      score += 50;
    }

    return Math.min(score, 100);
  }

  private async logarEventoSeguranca(evento: string, contexto: any, detalhes: any = {}) {
    const logEntry = {
      evento,
      timestamp: new Date().toISOString(),
      ip: contexto.ipAddress,
      userAgent: contexto.userAgent,
      scoreRisco: contexto.scoreRisco,
      detalhes
    };

    // Em produção, enviar para CloudWatch, Elasticsearch, etc.
    console.log('🔒 Evento de Segurança:', JSON.stringify(logEntry, null, 2));
  }

  private async buscarUsuarioLocal(cognitoSub: string) {
    try {
      const [usuario] = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.cognitoSub, cognitoSub))
        .limit(1);
      
      return usuario;
    } catch (erro) {
      console.error('Erro ao buscar usuário local:', erro);
      return null;
    }
  }

  private async atualizarUltimoLogin(cognitoSub: string) {
    try {
      await db
        .update(usuarios)
        .set({ updatedAt: new Date() })
        .where(eq(usuarios.cognitoSub, cognitoSub));
    } catch (erro) {
      console.error('Erro ao atualizar último login:', erro);
    }
  }

  /**
   * Middleware principal de autenticação
   */
  autenticar = async (req: RequisicaoAutenticada, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.connection.remoteAddress || 'desconhecido';
      const userAgent = req.headers['user-agent'] || 'desconhecido';
      const scoreRisco = this.calcularScoreRisco(ip, userAgent);

      // Criar contexto de segurança
      req.contextoSeguranca = {
        ipAddress: ip,
        userAgent,
        timestamp: Date.now(),
        scoreRisco
      };

      // Verificar score de risco alto
      if (scoreRisco > 80) {
        await this.logarEventoSeguranca('ACESSO_BLOQUEADO_RISCO_ALTO', req.contextoSeguranca);
        return res.status(403).json({
          sucesso: false,
          erro: 'Acesso bloqueado por motivos de segurança',
          codigo: 'BLOQUEADO_SEGURANCA'
        });
      }

      // Verificar header de autorização
      const headerAuth = req.headers.authorization;
      
      if (!headerAuth || !headerAuth.startsWith('Bearer ')) {
        await this.logarEventoSeguranca('TOKEN_AUSENTE', req.contextoSeguranca);
        return res.status(401).json({
          sucesso: false,
          erro: 'Token de autenticação não fornecido',
          codigo: 'TOKEN_AUSENTE'
        });
      }

      const token = headerAuth.substring(7); // Remove 'Bearer '
      
      // Validar formato do token
      const partesToken = token.split('.');
      if (partesToken.length !== 3) {
        await this.logarEventoSeguranca('TOKEN_FORMATO_INVALIDO', req.contextoSeguranca);
        return res.status(401).json({
          sucesso: false,
          erro: 'Formato de token inválido',
          codigo: 'TOKEN_FORMATO_INVALIDO'
        });
      }

      // Verificar token no AWS Cognito
      const resultadoVerificacao = await this.verificadorJWT.verifyToken(token);
      
      if (!resultadoVerificacao.success || !resultadoVerificacao.user) {
        await this.logarEventoSeguranca('VERIFICACAO_TOKEN_FALHOU', req.contextoSeguranca, {
          erro: resultadoVerificacao.error
        });
        
        // Incrementar tentativas de login
        const tentativas = this.tentativasLogin.get(ip) || 0;
        this.tentativasLogin.set(ip, tentativas + 1);
        
        // Bloquear IP após 5 tentativas
        if (tentativas >= 5) {
          this.ipsBloquedos.add(ip);
        }
        
        return res.status(401).json({
          sucesso: false,
          erro: resultadoVerificacao.error || 'Token inválido',
          codigo: 'TOKEN_INVALIDO'
        });
      }

      // Extrair informações do usuário
      const infoUsuario = this.verificadorJWT.extractUserInfo(resultadoVerificacao.user);
      
      // Verificar se usuário existe no banco local
      const usuarioLocal = await this.buscarUsuarioLocal(infoUsuario.id);
      
      if (!usuarioLocal) {
        await this.logarEventoSeguranca('USUARIO_NAO_ENCONTRADO', req.contextoSeguranca, {
          usuarioId: infoUsuario.id
        });
        return res.status(401).json({
          sucesso: false,
          erro: 'Usuário não encontrado no sistema',
          codigo: 'USUARIO_NAO_ENCONTRADO'
        });
      }

      // Verificar se usuário está ativo
      if (usuarioLocal.status !== 'ativo') {
        await this.logarEventoSeguranca('USUARIO_INATIVO', req.contextoSeguranca, {
          usuarioId: infoUsuario.id,
          status: usuarioLocal.status
        });
        return res.status(403).json({
          sucesso: false,
          erro: 'Usuário inativo',
          codigo: 'USUARIO_INATIVO'
        });
      }

      // Atualizar último login
      await this.atualizarUltimoLogin(infoUsuario.id);

      // Limpar tentativas de login bem-sucedidas
      this.tentativasLogin.delete(ip);

      // Adicionar informações do usuário à requisição
      req.usuario = infoUsuario;

      await this.logarEventoSeguranca('AUTENTICACAO_SUCESSO', req.contextoSeguranca, {
        usuarioId: infoUsuario.id,
        tipoUsuario: infoUsuario.tipo_usuario
      });

      next();
    } catch (erro: any) {
      console.error('❌ Erro na autenticação:', erro);
      
      await this.logarEventoSeguranca('ERRO_AUTENTICACAO', req.contextoSeguranca!, {
        erro: erro.message
      });
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno na autenticação',
        codigo: 'ERRO_INTERNO'
      });
    }
  };

  /**
   * Middleware para verificar roles específicos
   */
  exigirRole = (rolesPermitidos: string | string[]) => {
    const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
    
    return async (req: RequisicaoAutenticada, res: Response, next: NextFunction) => {
      if (!req.usuario) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Usuário não autenticado',
          codigo: 'NAO_AUTENTICADO'
        });
      }

      if (!roles.includes(req.usuario.role)) {
        await this.logarEventoSeguranca('PERMISSAO_INSUFICIENTE', req.contextoSeguranca!, {
          usuarioId: req.usuario.id,
          rolesNecessarios: roles,
          roleUsuario: req.usuario.role
        });
        
        return res.status(403).json({
          sucesso: false,
          erro: 'Permissões insuficientes',
          codigo: 'PERMISSAO_INSUFICIENTE',
          necessario: roles,
          atual: req.usuario.role
        });
      }

      next();
    };
  };

  /**
   * Middleware para verificar grupos específicos
   */
  exigirGrupo = (gruposPermitidos: string | string[]) => {
    const grupos = Array.isArray(gruposPermitidos) ? gruposPermitidos : [gruposPermitidos];
    
    return async (req: RequisicaoAutenticada, res: Response, next: NextFunction) => {
      if (!req.usuario) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Usuário não autenticado',
          codigo: 'NAO_AUTENTICADO'
        });
      }

      const temGrupoNecessario = grupos.some(grupo => req.usuario!.groups.includes(grupo));
      
      if (!temGrupoNecessario) {
        await this.logarEventoSeguranca('ACESSO_GRUPO_NEGADO', req.contextoSeguranca!, {
          usuarioId: req.usuario.id,
          gruposNecessarios: grupos,
          gruposUsuario: req.usuario.groups
        });
        
        return res.status(403).json({
          sucesso: false,
          erro: 'Acesso negado para este grupo',
          codigo: 'ACESSO_GRUPO_NEGADO',
          necessario: grupos,
          atual: req.usuario.groups
        });
      }

      next();
    };
  };

  /**
   * Middleware para operações administrativas
   */
  exigirAdmin = () => {
    return this.exigirRole(['admin', 'AdminMaster', 'Administrador']);
  };

  /**
   * Middleware para gestores ou superior
   */
  exigirGestorOuSuperior = () => {
    return this.exigirRole(['admin', 'AdminMaster', 'Administrador', 'gestor', 'GestorMunicipal']);
  };

  /**
   * Middleware para diretores ou superior
   */
  exigirDiretorOuSuperior = () => {
    return this.exigirRole(['admin', 'AdminMaster', 'Administrador', 'gestor', 'GestorMunicipal', 'diretor', 'Diretor']);
  };

  /**
   * Obter limitador de taxa por tipo
   */
  obterLimitador(tipo: string) {
    return this.limitadores.get(tipo);
  }

  /**
   * Middleware para aplicar rate limiting
   */
  aplicarLimitador = (tipo: string) => {
    const limitador = this.limitadores.get(tipo);
    if (!limitador) {
      throw new Error(`Limitador '${tipo}' não encontrado`);
    }
    return limitador;
  };
}

// Instância singleton
const authMiddleware = new AuthMiddlewareUnified();

export default authMiddleware;
export { authMiddleware };
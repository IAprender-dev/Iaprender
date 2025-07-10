import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * DASHBOARD CONTROLLER - SISTEMA IAPRENDER
 * 
 * Controlador para fornecer dados estatísticos e recentes para o dashboard
 */

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    empresa_id?: number;
    tipo_usuario: string;
    email: string;
    nome: string;
  };
}

class DashboardController {
  /**
   * Obter estatísticas do dashboard
   */
  async obterEstatisticas(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const empresaId = req.user.empresa_id;
      const tipoUsuario = req.user.tipo_usuario;

      console.log(`📊 Carregando estatísticas para usuário ${userId} (${tipoUsuario})`);

      // Construir filtro baseado no tipo de usuário
      let whereClause = '';
      const params: any[] = [];
      
      if (tipoUsuario !== 'admin' && empresaId) {
        whereClause = 'WHERE empresa_id = $1';
        params.push(empresaId);
      }

      // Buscar estatísticas usando SQL direto (fallback gracioso se tabelas não existirem)
      let stats = {
        alunos: 0,
        professores: 0,
        escolas: 0,
        usuarios: 0
      };

      try {
        const results = await Promise.all([
          // Tentar contar alunos
          db.execute(sql.raw(`SELECT COUNT(*) as count FROM alunos ${whereClause}`, params))
            .catch(() => ({ rows: [{ count: 0 }] })),
          
          // Tentar contar professores  
          db.execute(sql.raw(`SELECT COUNT(*) as count FROM professores ${whereClause}`, params))
            .catch(() => ({ rows: [{ count: 0 }] })),
          
          // Tentar contar escolas
          db.execute(sql.raw(`SELECT COUNT(*) as count FROM escolas ${whereClause}`, params))
            .catch(() => ({ rows: [{ count: 0 }] })),
          
          // Tentar contar usuários
          db.execute(sql.raw(`SELECT COUNT(*) as count FROM usuarios ${whereClause}`, params))
            .catch(() => ({ rows: [{ count: 0 }] }))
        ]);

        stats = {
          alunos: Number(results[0].rows?.[0]?.count || 0),
          professores: Number(results[1].rows?.[0]?.count || 0),
          escolas: Number(results[2].rows?.[0]?.count || 0),
          usuarios: Number(results[3].rows?.[0]?.count || 0)
        };
      } catch (error) {
        console.warn('⚠️ Erro ao buscar estatísticas, usando valores padrão:', error);
      }

      // Resposta de sucesso
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          totais: stats,
          usuario: {
            tipo: this.formatarTipoUsuario(tipoUsuario),
            empresa_id: empresaId,
            tem_filtro_empresa: tipoUsuario !== 'admin'
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter dados recentes do dashboard
   */
  async obterDadosRecentes(req: AuthenticatedRequest, res: Response) {
    try {
      const empresaId = req.user.empresa_id;
      const tipoUsuario = req.user.tipo_usuario;

      // Dados mock para demonstração (será substituído por dados reais quando tabelas estiverem prontas)
      const dadosRecentes = [
        {
          id: 1,
          tipo: 'aluno',
          nome: 'João Silva',
          acao: 'Matrícula realizada',
          data: new Date().toISOString(),
          status: 'ativo'
        },
        {
          id: 2,
          tipo: 'professor',
          nome: 'Maria Santos',
          acao: 'Perfil atualizado',
          data: new Date(Date.now() - 3600000).toISOString(), // 1h atrás
          status: 'ativo'
        },
        {
          id: 3,
          tipo: 'escola',
          nome: 'EMEF João Paulo II',
          acao: 'Cadastro criado',
          data: new Date(Date.now() - 7200000).toISOString(), // 2h atrás
          status: 'ativo'
        }
      ];

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          recentes: dadosRecentes,
          total: dadosRecentes.length
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter dados recentes:', error);
      res.status(500).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter dados de gráficos
   */
  async obterDadosGraficos(req: AuthenticatedRequest, res: Response) {
    try {
      // Dados demo para gráficos
      const dadosGraficos = {
        matriculas_mes: [
          { mes: 'Jan', valor: 45 },
          { mes: 'Fev', valor: 38 },
          { mes: 'Mar', valor: 52 },
          { mes: 'Abr', valor: 41 },
          { mes: 'Mai', valor: 47 },
          { mes: 'Jun', valor: 55 }
        ],
        distribuicao_series: [
          { serie: '1º Ano', quantidade: 120, cor: '#3b82f6' },
          { serie: '2º Ano', quantidade: 98, cor: '#10b981' },
          { serie: '3º Ano', quantidade: 87, cor: '#f59e0b' },
          { serie: '4º Ano', quantidade: 92, cor: '#ef4444' },
          { serie: '5º Ano', quantidade: 78, cor: '#8b5cf6' }
        ]
      };

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: dadosGraficos
      });

    } catch (error) {
      console.error('❌ Erro ao obter dados de gráficos:', error);
      res.status(500).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter resumo da atividade do usuário
   */
  async obterResumoAtividade(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const tipoUsuario = req.user.tipo_usuario;

      // Resumo de atividade baseado no tipo de usuário
      const atividade = {
        hoje: {
          logins: 3,
          acoes: 12,
          tempo_online: '2h 35min'
        },
        semana: {
          dias_ativos: 5,
          total_acoes: 87,
          media_diaria: '1h 45min'
        },
        mes: {
          dias_ativos: 22,
          total_acoes: 342,
          crescimento: '+15%'
        }
      };

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          usuario_tipo: this.formatarTipoUsuario(tipoUsuario),
          atividade,
          ultima_atualizacao: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter resumo de atividade:', error);
      res.status(500).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Formatar tipo de usuário para exibição
   */
  private formatarTipoUsuario(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'admin': 'Administrador',
      'gestor': 'Gestor Municipal',
      'diretor': 'Diretor Escolar',
      'professor': 'Professor',
      'aluno': 'Aluno'
    };
    
    return tipos[tipo] || tipo;
  }

  /**
   * Health check do dashboard
   */
  async healthCheck(req: Request, res: Response) {
    try {
      // Verificar conexão com banco (simples)
      await db.execute(sql`SELECT 1 as test`);
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: 'connected',
          api: 'operational'
        }
      });

    } catch (error) {
      console.error('❌ Health check falhou:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      });
    }
  }
}

export default new DashboardController();
import { escolas } from '@shared/schema';
import { BaseRepository } from '../models/BaseRepository';
import { InferModel } from 'drizzle-orm';
import { AppErrors } from '../middleware/errorHandler';

type School = InferModel<typeof escolas, 'select'>;
type SchoolInsert = InferModel<typeof escolas, 'insert'>;

export interface SchoolWithRelations extends School {
  empresa?: any;
  contrato?: any;
  totalAlunos?: number;
  totalProfessores?: number;
  totalTurmas?: number;
}

export class SchoolRepository extends BaseRepository<typeof escolas, SchoolInsert, School> {
  constructor() {
    super(escolas, 'escolas');
  }

  /**
   * Find school by code
   */
  public async findByCode(codigo: string): Promise<School | null> {
    return this.findOne({ codigo });
  }

  /**
   * Find schools by empresa
   */
  public async findByEmpresa(
    empresaId: number,
    options: any = {}
  ): Promise<School[]> {
    return this.findAll({ empresaId }, options);
  }

  /**
   * Find schools by contrato
   */
  public async findByContrato(
    contratoId: number,
    options: any = {}
  ): Promise<School[]> {
    return this.findAll({ contratoId }, options);
  }

  /**
   * Find active schools
   */
  public async findActiveSchools(
    filters?: any,
    options: any = {}
  ): Promise<School[]> {
    return this.findAll({
      ...filters,
      status: 'ativo'
    }, options);
  }

  /**
   * Soft delete school
   */
  public async softDelete(id: number): Promise<boolean> {
    const updated = await this.update(id, {
      status: 'inativo',
      deletedAt: new Date()
    });
    return !!updated;
  }

  /**
   * Get school with statistics
   */
  public async findWithStats(id: number): Promise<SchoolWithRelations | null> {
    const query = `
      SELECT 
        e.*,
        emp.nome as empresa_nome,
        c.nome as contrato_nome,
        COUNT(DISTINCT a.id) as total_alunos,
        COUNT(DISTINCT p.id) as total_professores,
        COUNT(DISTINCT t.id) as total_turmas
      FROM escolas e
      LEFT JOIN empresas emp ON e.empresa_id = emp.id
      LEFT JOIN contratos c ON e.contrato_id = c.id
      LEFT JOIN alunos a ON e.id = a.escola_id AND a.status = 'ativo'
      LEFT JOIN professores p ON e.id = p.escola_id AND p.status = 'ativo'
      LEFT JOIN turmas t ON e.id = t.escola_id AND t.ativo = true
      WHERE e.id = $1
      GROUP BY e.id, emp.nome, c.nome
    `;

    const results = await this.raw<SchoolWithRelations>(query, [id]);
    
    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      ...row,
      totalAlunos: parseInt(row.totalAlunos as any) || 0,
      totalProfessores: parseInt(row.totalProfessores as any) || 0,
      totalTurmas: parseInt(row.totalTurmas as any) || 0
    };
  }

  /**
   * Get schools summary by empresa
   */
  public async getSchoolsSummaryByEmpresa(empresaId: number): Promise<any[]> {
    const query = `
      SELECT 
        e.id,
        e.nome,
        e.codigo,
        e.tipo_ensino,
        e.status,
        COUNT(DISTINCT a.id) as alunos_ativos,
        COUNT(DISTINCT p.id) as professores_ativos,
        COUNT(DISTINCT t.id) as turmas_ativas,
        COALESCE(SUM(t.licencas_alocadas), 0) as licencas_totais,
        COUNT(DISTINCT CASE WHEN a.status = 'ativo' THEN a.id END) as licencas_usadas
      FROM escolas e
      LEFT JOIN alunos a ON e.id = a.escola_id
      LEFT JOIN professores p ON e.id = p.escola_id AND p.status = 'ativo'
      LEFT JOIN turmas t ON e.id = t.escola_id AND t.ativo = true
      WHERE e.empresa_id = $1 AND e.status = 'ativo'
      GROUP BY e.id
      ORDER BY e.nome
    `;

    return this.raw(query, [empresaId]);
  }

  /**
   * Update school configuration
   */
  public async updateConfiguration(
    id: number,
    configuration: any
  ): Promise<School | null> {
    const school = await this.findById(id);
    if (!school) {
      return null;
    }

    const mergedConfig = {
      ...school.configuracoes,
      ...configuration
    };

    return this.update(id, {
      configuracoes: mergedConfig
    });
  }

  /**
   * Get schools needing attention
   */
  public async getSchoolsNeedingAttention(empresaId?: number): Promise<any[]> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (empresaId) {
      whereClause += ' AND e.empresa_id = $1';
      params.push(empresaId);
    }

    const query = `
      WITH school_metrics AS (
        SELECT 
          e.id,
          e.nome,
          COUNT(DISTINCT a.id) as total_alunos,
          COUNT(DISTINCT CASE WHEN a.ultimo_acesso >= NOW() - INTERVAL '7 days' THEN a.id END) as alunos_ativos_7d,
          COUNT(DISTINCT p.id) as total_professores,
          COUNT(DISTINCT CASE WHEN p.ultimo_acesso >= NOW() - INTERVAL '7 days' THEN p.id END) as professores_ativos_7d,
          COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - a.ultimo_acesso)) / 86400), 999) as dias_sem_acesso_medio
        FROM escolas e
        LEFT JOIN alunos a ON e.id = a.escola_id AND a.status = 'ativo'
        LEFT JOIN professores p ON e.id = p.escola_id AND p.status = 'ativo'
        ${whereClause}
        GROUP BY e.id
      )
      SELECT 
        *,
        CASE 
          WHEN dias_sem_acesso_medio > 30 THEN 'critical'
          WHEN dias_sem_acesso_medio > 14 THEN 'warning'
          WHEN (alunos_ativos_7d::float / NULLIF(total_alunos, 0)) < 0.5 THEN 'warning'
          ELSE 'ok'
        END as attention_level
      FROM school_metrics
      WHERE dias_sem_acesso_medio > 14 
         OR (alunos_ativos_7d::float / NULLIF(total_alunos, 0)) < 0.5
      ORDER BY dias_sem_acesso_medio DESC
    `;

    return this.raw(query, params);
  }

  /**
   * Get license usage by school
   */
  public async getLicenseUsage(schoolId: number): Promise<{
    total: number;
    used: number;
    available: number;
    byClass: any[];
  }> {
    const query = `
      SELECT 
        t.id as turma_id,
        t.nome as turma_nome,
        t.licencas_alocadas,
        COUNT(a.id) as licencas_usadas
      FROM turmas t
      LEFT JOIN alunos a ON t.id = a.turma_id AND a.status = 'ativo'
      WHERE t.escola_id = $1 AND t.ativo = true
      GROUP BY t.id
    `;

    const byClass = await this.raw(query, [schoolId]);
    
    const total = byClass.reduce((sum, cls) => sum + (cls.licencas_alocadas || 0), 0);
    const used = byClass.reduce((sum, cls) => sum + parseInt(cls.licencas_usadas), 0);

    return {
      total,
      used,
      available: total - used,
      byClass
    };
  }
}
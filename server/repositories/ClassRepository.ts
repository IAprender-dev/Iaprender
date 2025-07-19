import { turmas } from '@shared/schema';
import { BaseRepository } from '../models/BaseRepository';
import { InferModel } from 'drizzle-orm';

type Class = InferModel<typeof turmas, 'select'>;
type ClassInsert = InferModel<typeof turmas, 'insert'>;

export interface ClassWithRelations extends Class {
  escola?: any;
  professor?: any;
  totalAlunos?: number;
  alunosAtivos?: number;
  licencasDisponiveis?: number;
}

export class ClassRepository extends BaseRepository<typeof turmas, ClassInsert, Class> {
  constructor() {
    super(turmas, 'turmas');
  }

  /**
   * Find classes by school
   */
  public async findBySchool(
    escolaId: number,
    options: any = {}
  ): Promise<Class[]> {
    return this.findAll({ escolaId }, options);
  }

  /**
   * Find classes by teacher
   */
  public async findByTeacher(
    professorId: number,
    options: any = {}
  ): Promise<Class[]> {
    return this.findAll({ professorId }, options);
  }

  /**
   * Find active classes
   */
  public async findActiveClasses(
    filters?: any,
    options: any = {}
  ): Promise<Class[]> {
    return this.findAll({
      ...filters,
      ativo: true
    }, options);
  }

  /**
   * Get class with statistics
   */
  public async findWithStats(id: number): Promise<ClassWithRelations | null> {
    const query = `
      SELECT 
        t.*,
        e.nome as escola_nome,
        p.nome as professor_nome,
        COUNT(DISTINCT a.id) as total_alunos,
        COUNT(DISTINCT CASE WHEN a.status = 'ativo' THEN a.id END) as alunos_ativos,
        t.licencas_alocadas - COUNT(DISTINCT CASE WHEN a.status = 'ativo' THEN a.id END) as licencas_disponiveis
      FROM turmas t
      LEFT JOIN escolas e ON t.escola_id = e.id
      LEFT JOIN professores p ON t.professor_id = p.id
      LEFT JOIN alunos a ON t.id = a.turma_id
      WHERE t.id = $1
      GROUP BY t.id, e.nome, p.nome
    `;

    const results = await this.raw<ClassWithRelations>(query, [id]);
    
    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      ...row,
      totalAlunos: parseInt(row.totalAlunos as any) || 0,
      alunosAtivos: parseInt(row.alunosAtivos as any) || 0,
      licencasDisponiveis: parseInt(row.licencasDisponiveis as any) || 0
    };
  }

  /**
   * Update class licenses
   */
  public async updateLicenses(
    id: number,
    licencasAlocadas: number
  ): Promise<Class | null> {
    return this.update(id, { licencasAlocadas });
  }

  /**
   * Assign teacher to class
   */
  public async assignTeacher(
    id: number,
    professorId: number
  ): Promise<Class | null> {
    return this.update(id, { professorId });
  }

  /**
   * Get classes summary by school
   */
  public async getClassesSummaryBySchool(escolaId: number): Promise<any[]> {
    const query = `
      SELECT 
        t.id,
        t.nome,
        t.serie,
        t.turma,
        t.turno,
        t.ano_letivo,
        t.max_alunos,
        t.licencas_alocadas,
        p.nome as professor_nome,
        COUNT(DISTINCT a.id) as total_alunos,
        COUNT(DISTINCT CASE WHEN a.status = 'ativo' THEN a.id END) as alunos_ativos,
        COUNT(DISTINCT CASE WHEN a.ultimo_acesso >= NOW() - INTERVAL '7 days' THEN a.id END) as alunos_ativos_7d
      FROM turmas t
      LEFT JOIN professores p ON t.professor_id = p.id
      LEFT JOIN alunos a ON t.id = a.turma_id
      WHERE t.escola_id = $1 AND t.ativo = true
      GROUP BY t.id, p.nome
      ORDER BY t.serie, t.turma
    `;

    return this.raw(query, [escolaId]);
  }

  /**
   * Get license allocation summary
   */
  public async getLicenseAllocationSummary(escolaId: number): Promise<{
    totalAllocated: number;
    totalUsed: number;
    byGrade: any[];
    byShift: any[];
  }> {
    const byGradeQuery = `
      SELECT 
        t.serie,
        SUM(t.licencas_alocadas) as licencas_alocadas,
        COUNT(DISTINCT CASE WHEN a.status = 'ativo' THEN a.id END) as licencas_usadas
      FROM turmas t
      LEFT JOIN alunos a ON t.id = a.turma_id
      WHERE t.escola_id = $1 AND t.ativo = true
      GROUP BY t.serie
      ORDER BY t.serie
    `;

    const byShiftQuery = `
      SELECT 
        t.turno,
        SUM(t.licencas_alocadas) as licencas_alocadas,
        COUNT(DISTINCT CASE WHEN a.status = 'ativo' THEN a.id END) as licencas_usadas
      FROM turmas t
      LEFT JOIN alunos a ON t.id = a.turma_id
      WHERE t.escola_id = $1 AND t.ativo = true
      GROUP BY t.turno
      ORDER BY t.turno
    `;

    const [byGrade, byShift] = await Promise.all([
      this.raw(byGradeQuery, [escolaId]),
      this.raw(byShiftQuery, [escolaId])
    ]);

    const totalAllocated = byGrade.reduce(
      (sum, g) => sum + parseInt(g.licencas_alocadas), 
      0
    );
    const totalUsed = byGrade.reduce(
      (sum, g) => sum + parseInt(g.licencas_usadas), 
      0
    );

    return {
      totalAllocated,
      totalUsed,
      byGrade,
      byShift
    };
  }

  /**
   * Check if class has available slots
   */
  public async hasAvailableSlots(classId: number): Promise<boolean> {
    const query = `
      SELECT 
        t.max_alunos,
        COUNT(a.id) as current_students
      FROM turmas t
      LEFT JOIN alunos a ON t.id = a.turma_id AND a.status = 'ativo'
      WHERE t.id = $1
      GROUP BY t.id
    `;

    const result = await this.raw<any>(query, [classId]);
    
    if (result.length === 0) {
      return false;
    }

    const { max_alunos, current_students } = result[0];
    return parseInt(current_students) < max_alunos;
  }

  /**
   * Get class activity summary
   */
  public async getActivitySummary(
    classId: number,
    days: number = 30
  ): Promise<any> {
    const query = `
      WITH daily_activity AS (
        SELECT 
          DATE(al.created_at) as activity_date,
          COUNT(DISTINCT al.user_id) as active_users,
          COUNT(*) as total_activities
        FROM access_logs al
        JOIN alunos a ON al.user_id = a.user_id
        WHERE a.turma_id = $1 
          AND al.created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(al.created_at)
      )
      SELECT 
        activity_date,
        active_users,
        total_activities
      FROM daily_activity
      ORDER BY activity_date DESC
    `;

    return this.raw(query, [classId]);
  }
}
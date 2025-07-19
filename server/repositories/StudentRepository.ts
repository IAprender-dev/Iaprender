import { alunos } from '@shared/schema';
import { BaseRepository } from '../models/BaseRepository';
import { InferModel } from 'drizzle-orm';
import { AppErrors } from '../middleware/errorHandler';

type Student = InferModel<typeof alunos, 'select'>;
type StudentInsert = InferModel<typeof alunos, 'insert'>;

export interface StudentWithRelations extends Student {
  escola?: any;
  turma?: any;
  responsavel?: any;
  ultimoAcesso?: Date;
  totalDocumentos?: number;
  mediaDesempenho?: number;
}

export class StudentRepository extends BaseRepository<typeof alunos, StudentInsert, Student> {
  constructor() {
    super(alunos, 'alunos');
  }

  /**
   * Find student by matricula
   */
  public async findByMatricula(
    matricula: string,
    escolaId?: number
  ): Promise<Student | null> {
    const conditions: any = { matricula };
    if (escolaId) {
      conditions.escolaId = escolaId;
    }
    return this.findOne(conditions);
  }

  /**
   * Find students by school
   */
  public async findBySchool(
    escolaId: number,
    options: any = {}
  ): Promise<Student[]> {
    return this.findAll({ escolaId }, options);
  }

  /**
   * Find students by class
   */
  public async findByClass(
    turmaId: number,
    options: any = {}
  ): Promise<Student[]> {
    return this.findAll({ turmaId }, options);
  }

  /**
   * Find students by responsible
   */
  public async findByResponsible(
    nomeResponsavel: string,
    options: any = {}
  ): Promise<Student[]> {
    return this.findAll({
      nomeResponsavel: { ilike: `%${nomeResponsavel}%` }
    }, options);
  }

  /**
   * Create student with validation
   */
  public async createStudent(data: StudentInsert): Promise<Student> {
    // Check if matricula already exists in school
    const existing = await this.findByMatricula(data.matricula, data.escolaId);
    if (existing) {
      throw AppErrors.conflict('Student with this registration number already exists in this school');
    }

    // Check if class has available slots
    if (data.turmaId) {
      const hasSlots = await this.checkClassAvailability(data.turmaId);
      if (!hasSlots) {
        throw AppErrors.conflict('Class is full');
      }
    }

    return this.create({
      ...data,
      status: 'ativo',
      dataMatricula: data.dataMatricula || new Date()
    });
  }

  /**
   * Transfer student to another class
   */
  public async transferStudent(
    studentId: number,
    newTurmaId: number,
    transferData: {
      motivo: string;
      observacoes?: string;
      transferidoPor: string;
    }
  ): Promise<Student | null> {
    // Check if new class has slots
    const hasSlots = await this.checkClassAvailability(newTurmaId);
    if (!hasSlots) {
      throw AppErrors.conflict('Target class is full');
    }

    // Get current student data
    const student = await this.findById(studentId);
    if (!student) {
      return null;
    }

    // Create transfer record (would be in a separate transfers table)
    await this.raw(`
      INSERT INTO transferencias_alunos (
        aluno_id, turma_origem_id, turma_destino_id, 
        data_transferencia, motivo, observacoes, transferido_por
      ) VALUES ($1, $2, $3, NOW(), $4, $5, $6)
    `, [
      studentId,
      student.turmaId,
      newTurmaId,
      transferData.motivo,
      transferData.observacoes,
      transferData.transferidoPor
    ]);

    // Update student
    return this.update(studentId, {
      turmaId: newTurmaId,
      dataUltimaTransferencia: new Date()
    });
  }

  /**
   * Get student with complete information
   */
  public async findWithRelations(id: number): Promise<StudentWithRelations | null> {
    const query = `
      SELECT 
        a.*,
        e.nome as escola_nome,
        t.nome as turma_nome,
        t.serie,
        t.turno,
        u.ultimo_login as ultimo_acesso,
        COUNT(DISTINCT d.id) as total_documentos,
        AVG(av.nota) as media_desempenho
      FROM alunos a
      LEFT JOIN escolas e ON a.escola_id = e.id
      LEFT JOIN turmas t ON a.turma_id = t.id
      LEFT JOIN usuarios u ON a.user_id = u.id
      LEFT JOIN documentos d ON a.id = d.aluno_id
      LEFT JOIN avaliacoes av ON a.id = av.aluno_id
      WHERE a.id = $1
      GROUP BY a.id, e.nome, t.nome, t.serie, t.turno, u.ultimo_login
    `;

    const results = await this.raw<StudentWithRelations>(query, [id]);
    
    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      ...row,
      totalDocumentos: parseInt(row.totalDocumentos as any) || 0,
      mediaDesempenho: parseFloat(row.mediaDesempenho as any) || 0
    };
  }

  /**
   * Get students needing attention
   */
  public async getStudentsNeedingAttention(
    escolaId: number,
    criteria: {
      daysWithoutAccess?: number;
      minPerformance?: number;
      maxAbsences?: number;
    } = {}
  ): Promise<any[]> {
    const {
      daysWithoutAccess = 14,
      minPerformance = 6,
      maxAbsences = 10
    } = criteria;

    const query = `
      WITH student_metrics AS (
        SELECT 
          a.id,
          a.nome,
          a.matricula,
          a.turma_id,
          t.nome as turma_nome,
          COALESCE(EXTRACT(EPOCH FROM (NOW() - u.ultimo_login)) / 86400, 999) as dias_sem_acesso,
          COALESCE(AVG(av.nota), 0) as media_desempenho,
          COALESCE(COUNT(f.id), 0) as total_faltas
        FROM alunos a
        LEFT JOIN turmas t ON a.turma_id = t.id
        LEFT JOIN usuarios u ON a.user_id = u.id
        LEFT JOIN avaliacoes av ON a.id = av.aluno_id
        LEFT JOIN faltas f ON a.id = f.aluno_id AND f.data >= NOW() - INTERVAL '30 days'
        WHERE a.escola_id = $1 AND a.status = 'ativo'
        GROUP BY a.id, t.nome, u.ultimo_login
      )
      SELECT 
        *,
        CASE 
          WHEN dias_sem_acesso > $2 THEN 'inactive'
          WHEN media_desempenho < $3 AND media_desempenho > 0 THEN 'low_performance'
          WHEN total_faltas > $4 THEN 'high_absences'
          ELSE 'ok'
        END as attention_type
      FROM student_metrics
      WHERE dias_sem_acesso > $2 
         OR (media_desempenho < $3 AND media_desempenho > 0)
         OR total_faltas > $4
      ORDER BY 
        CASE 
          WHEN dias_sem_acesso > $2 THEN 1
          WHEN media_desempenho < $3 THEN 2
          WHEN total_faltas > $4 THEN 3
        END,
        dias_sem_acesso DESC
    `;

    return this.raw(query, [escolaId, daysWithoutAccess, minPerformance, maxAbsences]);
  }

  /**
   * Get student performance summary
   */
  public async getPerformanceSummary(
    studentId: number,
    periodMonths: number = 6
  ): Promise<any> {
    const query = `
      WITH monthly_performance AS (
        SELECT 
          DATE_TRUNC('month', av.data_avaliacao) as mes,
          AVG(av.nota) as media_nota,
          COUNT(av.id) as total_avaliacoes,
          STRING_AGG(DISTINCT av.disciplina, ', ') as disciplinas
        FROM avaliacoes av
        WHERE av.aluno_id = $1 
          AND av.data_avaliacao >= NOW() - INTERVAL '${periodMonths} months'
        GROUP BY DATE_TRUNC('month', av.data_avaliacao)
      ),
      attendance_summary AS (
        SELECT 
          COUNT(CASE WHEN tipo = 'presenca' THEN 1 END) as presencas,
          COUNT(CASE WHEN tipo = 'falta' THEN 1 END) as faltas,
          COUNT(CASE WHEN tipo = 'falta_justificada' THEN 1 END) as faltas_justificadas
        FROM frequencia
        WHERE aluno_id = $1 
          AND data >= NOW() - INTERVAL '${periodMonths} months'
      )
      SELECT 
        mp.*,
        a.presencas,
        a.faltas,
        a.faltas_justificadas,
        CASE 
          WHEN a.presencas + a.faltas > 0 
          THEN (a.presencas::float / (a.presencas + a.faltas) * 100)
          ELSE 100
        END as frequencia_percentual
      FROM monthly_performance mp
      CROSS JOIN attendance_summary a
      ORDER BY mp.mes DESC
    `;

    const monthlyData = await this.raw(query, [studentId]);

    // Get overall summary
    const summaryQuery = `
      SELECT 
        AVG(nota) as media_geral,
        MAX(nota) as melhor_nota,
        MIN(nota) as pior_nota,
        COUNT(DISTINCT disciplina) as total_disciplinas
      FROM avaliacoes
      WHERE aluno_id = $1 
        AND data_avaliacao >= NOW() - INTERVAL '${periodMonths} months'
    `;

    const summary = await this.raw(summaryQuery, [studentId]);

    return {
      monthly: monthlyData,
      overall: summary[0]
    };
  }

  /**
   * Bulk create students from import
   */
  public async bulkCreateStudents(
    students: StudentInsert[],
    importOptions: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
    } = {}
  ): Promise<{
    created: Student[];
    updated: Student[];
    skipped: Array<{ matricula: string; reason: string }>;
  }> {
    const result = {
      created: [] as Student[],
      updated: [] as Student[],
      skipped: [] as Array<{ matricula: string; reason: string }>
    };

    for (const studentData of students) {
      try {
        const existing = await this.findByMatricula(
          studentData.matricula,
          studentData.escolaId
        );

        if (existing) {
          if (importOptions.updateExisting) {
            const updated = await this.update(existing.id, studentData);
            if (updated) {
              result.updated.push(updated);
            }
          } else if (importOptions.skipDuplicates) {
            result.skipped.push({
              matricula: studentData.matricula,
              reason: 'Duplicate registration number'
            });
          } else {
            throw new Error('Duplicate registration number');
          }
        } else {
          const created = await this.createStudent(studentData);
          result.created.push(created);
        }
      } catch (error) {
        result.skipped.push({
          matricula: studentData.matricula,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Update student status
   */
  public async updateStatus(
    studentId: number,
    status: 'ativo' | 'inativo' | 'transferido' | 'formado',
    motivo?: string
  ): Promise<Student | null> {
    const student = await this.update(studentId, {
      status,
      motivoInativacao: motivo,
      dataInativacao: status !== 'ativo' ? new Date() : null
    });

    if (student && status !== 'ativo') {
      // Log status change
      await this.raw(`
        INSERT INTO historico_status_aluno (
          aluno_id, status_anterior, status_novo, motivo, data_mudanca
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [studentId, student.status, status, motivo]);
    }

    return student;
  }

  /**
   * Check class availability
   */
  private async checkClassAvailability(turmaId: number): Promise<boolean> {
    const query = `
      SELECT 
        t.max_alunos,
        COUNT(a.id) as current_students
      FROM turmas t
      LEFT JOIN alunos a ON t.id = a.turma_id AND a.status = 'ativo'
      WHERE t.id = $1
      GROUP BY t.id
    `;

    const result = await this.raw<any>(query, [turmaId]);
    
    if (result.length === 0) {
      return false;
    }

    const { max_alunos, current_students } = result[0];
    return parseInt(current_students) < max_alunos;
  }
}
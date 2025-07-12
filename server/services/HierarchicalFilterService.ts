/**
 * SISTEMA DE FILTROS HIERÁRQUICOS - IAPRENDER
 * 
 * Serviço responsável por aplicar filtros automáticos baseados na hierarquia
 * de usuários do sistema educacional brasileiro:
 * 
 * Admin > Gestor > Diretor > Professor > Aluno
 * 
 * Baseado na implementação Python original
 */

import { db } from '../db';
import { users, empresas, escolas, contratos, alunos, professores, diretores, gestores } from '../../shared/schema';
import { eq, and, or, sql, inArray } from 'drizzle-orm';

export interface HierarchicalUser {
  id: number;
  email: string;
  tipoUsuario: string;
  empresaId: number | null;
  escolaId: number | null;
  cognitoSub: string;
  grupos: string[];
}

export interface FilterOptions {
  empresaId?: number | null;
  escolaId?: number | null;
  tipoUsuario?: string[];
  status?: string[];
  dataInicio?: Date;
  dataFim?: Date;
  search?: string;
}

export class HierarchicalFilterService {
  private userEmpresaId: number | null;
  private userGrupos: string[];
  private userTipo: string;
  private userId: number;
  private userEscolaId: number | null;

  constructor(user: HierarchicalUser) {
    this.userId = user.id;
    this.userEmpresaId = user.empresaId;
    this.userEscolaId = user.escolaId;
    this.userGrupos = user.grupos || [];
    this.userTipo = user.tipoUsuario;
  }

  /**
   * 🔍 APLICAR FILTROS HIERÁRQUICOS PARA USUÁRIOS
   * Retorna query base com filtros automáticos baseados no tipo de usuário
   */
  public applyUserFilters(baseQuery: any, options: FilterOptions = {}) {
    let query = baseQuery;

    // Aplicar filtros hierárquicos baseados no tipo de usuário
    switch (this.userTipo.toLowerCase()) {
      case 'admin':
        // Admin vê tudo - apenas aplicar filtros opcionais
        break;
        
      case 'gestor':
        // Gestor vê apenas sua empresa
        if (this.userEmpresaId) {
          query = query.where(eq(users.empresaId, this.userEmpresaId));
        }
        break;
        
      case 'diretor':
        // Diretor vê apenas sua escola/empresa
        const diretorFilters = [];
        if (this.userEmpresaId) {
          diretorFilters.push(eq(users.empresaId, this.userEmpresaId));
        }
        if (this.userEscolaId) {
          diretorFilters.push(eq(users.escolaId, this.userEscolaId));
        }
        if (diretorFilters.length > 0) {
          query = query.where(and(...diretorFilters));
        }
        break;
        
      case 'professor':
        // Professor vê apenas alunos de suas turmas/escola
        if (this.userEscolaId) {
          query = query.where(
            and(
              eq(users.escolaId, this.userEscolaId),
              eq(users.tipoUsuario, 'aluno')
            )
          );
        }
        break;
        
      case 'aluno':
        // Aluno vê apenas próprios dados
        query = query.where(eq(users.id, this.userId));
        break;
    }

    // Aplicar filtros opcionais
    if (options.empresaId !== undefined) {
      query = query.where(eq(users.empresaId, options.empresaId));
    }

    if (options.escolaId !== undefined) {
      query = query.where(eq(users.escolaId, options.escolaId));
    }

    if (options.tipoUsuario && options.tipoUsuario.length > 0) {
      query = query.where(inArray(users.tipoUsuario, options.tipoUsuario));
    }

    if (options.status && options.status.length > 0) {
      query = query.where(inArray(users.status, options.status));
    }

    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      query = query.where(
        or(
          sql`LOWER(${users.nome}) LIKE ${searchTerm}`,
          sql`LOWER(${users.email}) LIKE ${searchTerm}`
        )
      );
    }

    if (options.dataInicio) {
      query = query.where(sql`${users.criadoEm} >= ${options.dataInicio}`);
    }

    if (options.dataFim) {
      query = query.where(sql`${users.criadoEm} <= ${options.dataFim}`);
    }

    return query;
  }

  /**
   * 🏫 APLICAR FILTROS HIERÁRQUICOS PARA ESCOLAS
   */
  public applySchoolFilters(baseQuery: any, options: FilterOptions = {}) {
    let query = baseQuery;

    switch (this.userTipo.toLowerCase()) {
      case 'admin':
        // Admin vê todas as escolas
        break;
        
      case 'gestor':
        // Gestor vê escolas de sua empresa
        if (this.userEmpresaId) {
          query = query.where(eq(escolas.empresaId, this.userEmpresaId));
        }
        break;
        
      case 'diretor':
        // Diretor vê apenas sua escola
        if (this.userEscolaId) {
          query = query.where(eq(escolas.id, this.userEscolaId));
        }
        break;
        
      case 'professor':
      case 'aluno':
        // Professor/Aluno vê apenas sua escola
        if (this.userEscolaId) {
          query = query.where(eq(escolas.id, this.userEscolaId));
        }
        break;
    }

    // Aplicar filtros opcionais
    if (options.empresaId !== undefined) {
      query = query.where(eq(escolas.empresaId, options.empresaId));
    }

    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      query = query.where(
        or(
          sql`LOWER(${escolas.nome}) LIKE ${searchTerm}`,
          sql`LOWER(${escolas.codigoInep}) LIKE ${searchTerm}`
        )
      );
    }

    return query;
  }

  /**
   * 🎓 APLICAR FILTROS HIERÁRQUICOS PARA ALUNOS
   */
  public applyStudentFilters(baseQuery: any, options: FilterOptions = {}) {
    let query = baseQuery;

    switch (this.userTipo.toLowerCase()) {
      case 'admin':
        // Admin vê todos os alunos
        break;
        
      case 'gestor':
        // Gestor vê alunos de sua empresa
        if (this.userEmpresaId) {
          query = query.where(eq(alunos.empresaId, this.userEmpresaId));
        }
        break;
        
      case 'diretor':
        // Diretor vê alunos de sua escola
        if (this.userEscolaId) {
          query = query.where(eq(alunos.escolaId, this.userEscolaId));
        }
        break;
        
      case 'professor':
        // Professor vê alunos de sua escola
        if (this.userEscolaId) {
          query = query.where(eq(alunos.escolaId, this.userEscolaId));
        }
        break;
        
      case 'aluno':
        // Aluno vê apenas próprios dados
        query = query.where(eq(alunos.usrId, this.userId));
        break;
    }

    // Aplicar filtros opcionais
    if (options.empresaId !== undefined) {
      query = query.where(eq(alunos.empresaId, options.empresaId));
    }

    if (options.escolaId !== undefined) {
      query = query.where(eq(alunos.escolaId, options.escolaId));
    }

    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      query = query.where(
        or(
          sql`LOWER(${alunos.nome}) LIKE ${searchTerm}`,
          sql`LOWER(${alunos.matricula}) LIKE ${searchTerm}`,
          sql`LOWER(${alunos.nomeResponsavel}) LIKE ${searchTerm}`
        )
      );
    }

    return query;
  }

  /**
   * 👩‍🏫 APLICAR FILTROS HIERÁRQUICOS PARA PROFESSORES
   */
  public applyTeacherFilters(baseQuery: any, options: FilterOptions = {}) {
    let query = baseQuery;

    switch (this.userTipo.toLowerCase()) {
      case 'admin':
        // Admin vê todos os professores
        break;
        
      case 'gestor':
        // Gestor vê professores de sua empresa
        if (this.userEmpresaId) {
          query = query.where(eq(professores.empresaId, this.userEmpresaId));
        }
        break;
        
      case 'diretor':
        // Diretor vê professores de sua escola
        if (this.userEscolaId) {
          query = query.where(eq(professores.escolaId, this.userEscolaId));
        }
        break;
        
      case 'professor':
        // Professor vê apenas próprios dados
        query = query.where(eq(professores.usrId, this.userId));
        break;
        
      case 'aluno':
        // Aluno vê professores de sua escola
        if (this.userEscolaId) {
          query = query.where(eq(professores.escolaId, this.userEscolaId));
        }
        break;
    }

    // Aplicar filtros opcionais
    if (options.empresaId !== undefined) {
      query = query.where(eq(professores.empresaId, options.empresaId));
    }

    if (options.escolaId !== undefined) {
      query = query.where(eq(professores.escolaId, options.escolaId));
    }

    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      query = query.where(
        or(
          sql`LOWER(${professores.nome}) LIKE ${searchTerm}`,
          sql`LOWER(${professores.disciplinas}) LIKE ${searchTerm}`,
          sql`LOWER(${professores.formacao}) LIKE ${searchTerm}`
        )
      );
    }

    return query;
  }

  /**
   * 🏛️ APLICAR FILTROS HIERÁRQUICOS PARA EMPRESAS
   */
  public applyCompanyFilters(baseQuery: any, options: FilterOptions = {}) {
    let query = baseQuery;

    switch (this.userTipo.toLowerCase()) {
      case 'admin':
        // Admin vê todas as empresas
        break;
        
      case 'gestor':
        // Gestor vê apenas sua empresa
        if (this.userEmpresaId) {
          query = query.where(eq(empresas.id, this.userEmpresaId));
        }
        break;
        
      case 'diretor':
      case 'professor':
      case 'aluno':
        // Outros tipos veem apenas sua empresa
        if (this.userEmpresaId) {
          query = query.where(eq(empresas.id, this.userEmpresaId));
        }
        break;
    }

    // Aplicar filtros opcionais
    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      query = query.where(
        or(
          sql`LOWER(${empresas.nome}) LIKE ${searchTerm}`,
          sql`LOWER(${empresas.razaoSocial}) LIKE ${searchTerm}`,
          sql`LOWER(${empresas.cnpj}) LIKE ${searchTerm}`
        )
      );
    }

    return query;
  }

  /**
   * 📋 APLICAR FILTROS HIERÁRQUICOS PARA CONTRATOS
   */
  public applyContractFilters(baseQuery: any, options: FilterOptions = {}) {
    let query = baseQuery;

    switch (this.userTipo.toLowerCase()) {
      case 'admin':
        // Admin vê todos os contratos
        break;
        
      case 'gestor':
        // Gestor vê contratos de sua empresa
        if (this.userEmpresaId) {
          query = query.where(eq(contratos.empresaId, this.userEmpresaId));
        }
        break;
        
      case 'diretor':
      case 'professor':
      case 'aluno':
        // Outros tipos veem contratos de sua empresa
        if (this.userEmpresaId) {
          query = query.where(eq(contratos.empresaId, this.userEmpresaId));
        }
        break;
    }

    // Aplicar filtros opcionais
    if (options.empresaId !== undefined) {
      query = query.where(eq(contratos.empresaId, options.empresaId));
    }

    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      query = query.where(
        or(
          sql`LOWER(${contratos.numero}) LIKE ${searchTerm}`,
          sql`LOWER(${contratos.objeto}) LIKE ${searchTerm}`
        )
      );
    }

    return query;
  }

  /**
   * ✅ VERIFICAR SE USUÁRIO TEM PERMISSÃO PARA ACESSAR RECURSO
   */
  public hasPermissionToAccess(resourceType: string, resourceId: number): boolean {
    // Admins têm acesso total
    if (this.userTipo.toLowerCase() === 'admin') {
      return true;
    }

    // Implementar lógica específica por tipo de recurso
    switch (resourceType.toLowerCase()) {
      case 'usuario':
        return this.canAccessUser(resourceId);
      case 'escola':
        return this.canAccessSchool(resourceId);
      case 'aluno':
        return this.canAccessStudent(resourceId);
      case 'professor':
        return this.canAccessTeacher(resourceId);
      case 'empresa':
        return this.canAccessCompany(resourceId);
      case 'contrato':
        return this.canAccessContract(resourceId);
      default:
        return false;
    }
  }

  /**
   * 👤 VERIFICAR ACESSO A USUÁRIO ESPECÍFICO
   */
  private canAccessUser(userId: number): boolean {
    if (this.userId === userId) {
      return true; // Próprio usuário
    }

    switch (this.userTipo.toLowerCase()) {
      case 'gestor':
        // TODO: Verificar se usuário pertence à mesma empresa
        return true;
      case 'diretor':
        // TODO: Verificar se usuário pertence à mesma escola
        return true;
      case 'professor':
        // TODO: Verificar se é aluno da mesma escola
        return false;
      case 'aluno':
        return false; // Aluno não acessa outros usuários
      default:
        return false;
    }
  }

  /**
   * 🏫 VERIFICAR ACESSO A ESCOLA ESPECÍFICA
   */
  private canAccessSchool(schoolId: number): boolean {
    if (this.userEscolaId === schoolId) {
      return true; // Própria escola
    }

    switch (this.userTipo.toLowerCase()) {
      case 'gestor':
        // TODO: Verificar se escola pertence à mesma empresa
        return true;
      default:
        return false;
    }
  }

  /**
   * 🎓 VERIFICAR ACESSO A ALUNO ESPECÍFICO
   */
  private canAccessStudent(studentId: number): boolean {
    switch (this.userTipo.toLowerCase()) {
      case 'gestor':
      case 'diretor':
      case 'professor':
        // TODO: Verificar hierarquia específica
        return true;
      case 'aluno':
        // TODO: Verificar se é o próprio aluno
        return false;
      default:
        return false;
    }
  }

  /**
   * 👩‍🏫 VERIFICAR ACESSO A PROFESSOR ESPECÍFICO
   */
  private canAccessTeacher(teacherId: number): boolean {
    switch (this.userTipo.toLowerCase()) {
      case 'gestor':
      case 'diretor':
        // TODO: Verificar hierarquia específica
        return true;
      case 'professor':
        // TODO: Verificar se é o próprio professor
        return false;
      default:
        return false;
    }
  }

  /**
   * 🏛️ VERIFICAR ACESSO A EMPRESA ESPECÍFICA
   */
  private canAccessCompany(companyId: number): boolean {
    return this.userEmpresaId === companyId;
  }

  /**
   * 📋 VERIFICAR ACESSO A CONTRATO ESPECÍFICO
   */
  private canAccessContract(contractId: number): boolean {
    switch (this.userTipo.toLowerCase()) {
      case 'gestor':
        // TODO: Verificar se contrato pertence à mesma empresa
        return true;
      default:
        return false;
    }
  }

  /**
   * 🔍 RETORNA DADOS FILTRADOS POR EMPRESA COM FILTROS ADICIONAIS
   * Equivalente ao get_filtered_data() Python
   */
  public async getFilteredData(tableName: string, additionalFilters?: Record<string, any>): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      let query: any;
      
      // Selecionar tabela baseada no nome
      switch (tableName.toLowerCase()) {
        case 'usuarios':
          query = db.select().from(users).where(eq(users.empresaId, this.userEmpresaId));
          break;
        case 'empresas':
          query = db.select().from(empresas).where(eq(empresas.id, this.userEmpresaId));
          break;
        case 'escolas':
          query = db.select().from(escolas).where(eq(escolas.empresaId, this.userEmpresaId));
          break;
        case 'contratos':
          query = db.select().from(contratos).where(eq(contratos.empresaId, this.userEmpresaId));
          break;
        case 'alunos':
          query = db.select().from(alunos).where(eq(alunos.empresaId, this.userEmpresaId));
          break;
        case 'professores':
          query = db.select().from(professores).where(eq(professores.empresaId, this.userEmpresaId));
          break;
        case 'diretores':
          query = db.select().from(diretores).where(eq(diretores.empresaId, this.userEmpresaId));
          break;
        case 'gestores':
          query = db.select().from(gestores).where(eq(gestores.empresaId, this.userEmpresaId));
          break;
        default:
          throw new Error(`Tabela não suportada: ${tableName}`);
      }

      // Aplicar filtros adicionais
      if (additionalFilters) {
        const filterConditions = Object.entries(additionalFilters).map(([key, value]) => {
          // Usar sql para filtros dinâmicos
          return sql`${sql.identifier(key)} = ${value}`;
        });
        
        if (filterConditions.length > 0) {
          query = query.where(and(...filterConditions));
        }
      }

      return await query;
      
    } catch (error) {
      console.error(`Erro ao obter dados filtrados da tabela ${tableName}:`, error);
      return [];
    }
  }

  /**
   * 👥 RETORNA USUÁRIOS FILTRADOS POR EMPRESA E ROLE
   * Equivalente ao get_usuarios_by_role() Python
   */
  public async getUsuariosByRole(role?: string): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      let query = db
        .select({
          id: users.id,
          cognitoSub: users.cognitoSub,
          email: users.email,
          nome: users.nome,
          tipoUsuario: users.tipoUsuario,
          empresaId: users.empresaId,
          status: users.status,
          criadoEm: users.criadoEm,
          empresaNome: empresas.nome
        })
        .from(users)
        .innerJoin(empresas, eq(users.empresaId, empresas.id))
        .where(eq(users.empresaId, this.userEmpresaId));

      // Filtrar por role se especificado
      if (role) {
        query = query.where(eq(users.tipoUsuario, role));
      }

      return await query;
      
    } catch (error) {
      console.error('Erro ao obter usuários por role:', error);
      return [];
    }
  }

  /**
   * 🏛️ RETORNA GESTORES DA EMPRESA
   * Equivalente ao get_gestores() Python
   */
  public async getGestores(): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      return await db
        .select({
          id: gestores.id,
          usuarioId: gestores.usrId,
          empresaId: gestores.empresaId,
          nome: users.nome,
          email: users.email,
          cargo: gestores.cargo,
          dataAdmissao: gestores.dataAdmissao,
          status: gestores.status,
          empresaNome: empresas.nome
        })
        .from(gestores)
        .innerJoin(users, eq(gestores.usrId, users.id))
        .innerJoin(empresas, eq(gestores.empresaId, empresas.id))
        .where(eq(gestores.empresaId, this.userEmpresaId));
        
    } catch (error) {
      console.error('Erro ao obter gestores:', error);
      return [];
    }
  }

  /**
   * 🏫 RETORNA DIRETORES DA EMPRESA
   * Equivalente ao get_diretores() Python
   */
  public async getDiretores(): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      return await db
        .select({
          id: diretores.id,
          usuarioId: diretores.usrId,
          escolaId: diretores.escolaId,
          empresaId: diretores.empresaId,
          nome: users.nome,
          email: users.email,
          cargo: diretores.cargo,
          dataInicio: diretores.dataInicio,
          status: diretores.status,
          empresaNome: empresas.nome
        })
        .from(diretores)
        .innerJoin(users, eq(diretores.usrId, users.id))
        .innerJoin(empresas, eq(diretores.empresaId, empresas.id))
        .where(eq(diretores.empresaId, this.userEmpresaId));
        
    } catch (error) {
      console.error('Erro ao obter diretores:', error);
      return [];
    }
  }

  /**
   * 👩‍🏫 RETORNA PROFESSORES DA EMPRESA
   * Equivalente ao get_professores() Python
   */
  public async getProfessores(): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      return await db
        .select({
          id: professores.id,
          usuarioId: professores.usrId,
          escolaId: professores.escolaId,
          empresaId: professores.empresaId,
          nome: users.nome,
          email: users.email,
          disciplinas: professores.disciplinas,
          formacao: professores.formacao,
          dataAdmissao: professores.dataAdmissao,
          status: professores.status,
          empresaNome: empresas.nome
        })
        .from(professores)
        .innerJoin(users, eq(professores.usrId, users.id))
        .innerJoin(empresas, eq(professores.empresaId, empresas.id))
        .where(eq(professores.empresaId, this.userEmpresaId));
        
    } catch (error) {
      console.error('Erro ao obter professores:', error);
      return [];
    }
  }

  /**
   * 🎓 RETORNA ALUNOS DA EMPRESA
   * Equivalente ao get_alunos() Python
   */
  public async getAlunos(): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      return await db
        .select({
          id: alunos.id,
          usuarioId: alunos.usrId,
          escolaId: alunos.escolaId,
          empresaId: alunos.empresaId,
          matricula: alunos.matricula,
          nome: users.nome,
          email: users.email,
          turma: alunos.turma,
          serie: alunos.serie,
          turno: alunos.turno,
          nomeResponsavel: alunos.nomeResponsavel,
          contatoResponsavel: alunos.contatoResponsavel,
          dataMatricula: alunos.dataMatricula,
          status: alunos.status,
          empresaNome: empresas.nome
        })
        .from(alunos)
        .innerJoin(users, eq(alunos.usrId, users.id))
        .innerJoin(empresas, eq(alunos.empresaId, empresas.id))
        .where(eq(alunos.empresaId, this.userEmpresaId));
        
    } catch (error) {
      console.error('Erro ao obter alunos:', error);
      return [];
    }
  }

  /**
   * 📋 RETORNA CONTRATOS DA EMPRESA
   * Equivalente ao get_contratos() Python
   */
  public async getContratos(): Promise<any[]> {
    return await this.getFilteredData('contratos');
  }

  /**
   * ✅ VERIFICA SE USUÁRIO PODE ACESSAR DETERMINADOS DADOS
   * Equivalente ao can_access_data() Python
   */
  public canAccessData(requiredRole?: string): boolean {
    if (!requiredRole) {
      return true;
    }
    
    return this.userGrupos.includes(requiredRole);
  }

  /**
   * 📊 OBTER ESTATÍSTICAS BASEADAS NA HIERARQUIA
   */
  public async getHierarchicalStats(): Promise<any> {
    const stats: any = {
      type: this.userTipo,
      scope: 'restricted'
    };

    try {
      switch (this.userTipo.toLowerCase()) {
        case 'admin':
          stats.scope = 'global';
          stats.usuarios = await db.select({ count: sql<number>`count(*)` }).from(users);
          stats.empresas = await db.select({ count: sql<number>`count(*)` }).from(empresas);
          stats.escolas = await db.select({ count: sql<number>`count(*)` }).from(escolas);
          break;
          
        case 'gestor':
          if (this.userEmpresaId) {
            stats.scope = 'company';
            stats.empresaId = this.userEmpresaId;
            stats.usuarios = await db.select({ count: sql<number>`count(*)` })
              .from(users)
              .where(eq(users.empresaId, this.userEmpresaId));
            stats.escolas = await db.select({ count: sql<number>`count(*)` })
              .from(escolas)
              .where(eq(escolas.empresaId, this.userEmpresaId));
          }
          break;
          
        case 'diretor':
          if (this.userEscolaId) {
            stats.scope = 'school';
            stats.escolaId = this.userEscolaId;
            stats.alunos = await db.select({ count: sql<number>`count(*)` })
              .from(alunos)
              .where(eq(alunos.escolaId, this.userEscolaId));
            stats.professores = await db.select({ count: sql<number>`count(*)` })
              .from(professores)
              .where(eq(professores.escolaId, this.userEscolaId));
          }
          break;
          
        case 'professor':
          if (this.userEscolaId) {
            stats.scope = 'classroom';
            stats.escolaId = this.userEscolaId;
            stats.alunos = await db.select({ count: sql<number>`count(*)` })
              .from(alunos)
              .where(eq(alunos.escolaId, this.userEscolaId));
          }
          break;
          
        case 'aluno':
          stats.scope = 'personal';
          stats.userId = this.userId;
          break;
      }
      
    } catch (error) {
      console.error('Erro ao obter estatísticas hierárquicas:', error);
      stats.error = 'Erro ao carregar estatísticas';
    }

    return stats;
  }

  /**
   * 🔍 OBTER LISTA DE EMPRESAS ACESSÍVEIS
   */
  public async getAccessibleCompanies(): Promise<any[]> {
    const query = db.select().from(empresas);
    const filteredQuery = this.applyCompanyFilters(query);
    return await filteredQuery;
  }

  /**
   * 🏫 OBTER LISTA DE ESCOLAS ACESSÍVEIS
   */
  public async getAccessibleSchools(): Promise<any[]> {
    const query = db.select().from(escolas);
    const filteredQuery = this.applySchoolFilters(query);
    return await filteredQuery;
  }

  /**
   * 📋 OBTER LISTA DE CONTRATOS ACESSÍVEIS
   */
  public async getAccessibleContracts(): Promise<any[]> {
    const query = db.select().from(contratos);
    const filteredQuery = this.applyContractFilters(query);
    return await filteredQuery;
  }
}

export default HierarchicalFilterService;
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

export class HierarchicalFilterService {
  private userEmpresaId: number | null;
  private userGrupos: string[];

  constructor(userEmpresaId: number | null, userGrupos: string[]) {
    this.userEmpresaId = userEmpresaId;
    this.userGrupos = userGrupos;
  }

  /**
   * 🔍 RETORNA DADOS FILTRADOS POR EMPRESA COM FILTROS ADICIONAIS
   * Equivalente ao get_filtered_data() Python:
   * 
   * def get_filtered_data(self, table_name, additional_filters=None):
   *     base_query = f"SELECT * FROM {table_name} WHERE empresa_id = %s"
   *     params = [self.user_empresa_id]
   *     
   *     if additional_filters:
   *         for filter_key, filter_value in additional_filters.items():
   *             base_query += f" AND {filter_key} = %s"
   *             params.append(filter_value)
   *     
   *     return self.db.execute_query(base_query, params)
   */
  public async getFilteredData(tableName: string, additionalFilters?: Record<string, any>): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      let query: any;
      
      // Selecionar tabela baseada no nome e aplicar filtro base por empresa_id
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

      // Aplicar filtros adicionais (equivalente ao loop Python)
      if (additionalFilters) {
        const filterConditions = [];
        
        for (const [key, value] of Object.entries(additionalFilters)) {
          // Usar sql para filtros dinâmicos (equivalente ao f" AND {filter_key} = %s")
          filterConditions.push(sql`${sql.identifier(key)} = ${value}`);
        }
        
        if (filterConditions.length > 0) {
          query = query.where(and(...filterConditions));
        }
      }

      console.log(`🔍 Executando query filtrada na tabela: ${tableName} (empresa_id: ${this.userEmpresaId})`);
      return await query;
      
    } catch (error) {
      console.error(`❌ Erro ao obter dados filtrados da tabela ${tableName}:`, error);
      return [];
    }
  }

  /**
   * 👥 RETORNA USUÁRIOS FILTRADOS POR EMPRESA E ROLE
   * Equivalente ao get_usuarios_by_role() Python:
   * 
   * def get_usuarios_by_role(self, role=None):
   *     query = """
   *     SELECT u.*, e.nome as empresa_nome
   *     FROM usuarios u
   *     JOIN empresas e ON u.empresa_id = e.id
   *     WHERE u.empresa_id = %s
   *     """
   *     params = [self.user_empresa_id]
   *     
   *     if role:
   *         query += " AND u.tipo_usuario = %s"
   *         params.append(role)
   *     
   *     return self.db.execute_query(query, params)
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

      // Filtrar por role se especificado (equivalente ao AND u.tipo_usuario = %s)
      if (role) {
        query = query.where(eq(users.tipoUsuario, role));
      }

      console.log(`👥 Buscando usuários por role: ${role || 'todos'} (empresa_id: ${this.userEmpresaId})`);
      return await query;
      
    } catch (error) {
      console.error('❌ Erro ao obter usuários por role:', error);
      return [];
    }
  }

  /**
   * 🏛️ RETORNA GESTORES DA EMPRESA
   * Equivalente ao get_gestores() Python:
   * 
   * def get_gestores(self):
   *     query = """
   *     SELECT g.*, u.nome, u.email, e.nome as empresa_nome
   *     FROM gestores g
   *     JOIN usuarios u ON g.usuario_id = u.id
   *     JOIN empresas e ON g.empresa_id = e.id
   *     WHERE g.empresa_id = %s
   *     """
   *     return self.db.execute_query(query, [self.user_empresa_id])
   */
  public async getGestores(): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      console.log(`🏛️ Buscando gestores (empresa_id: ${this.userEmpresaId})`);
      
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
      console.error('❌ Erro ao obter gestores:', error);
      return [];
    }
  }

  /**
   * 🏫 RETORNA DIRETORES DA EMPRESA
   * Equivalente ao get_diretores() Python:
   * 
   * def get_diretores(self):
   *     query = """
   *     SELECT d.*, u.nome, u.email, e.nome as empresa_nome
   *     FROM diretores d
   *     JOIN usuarios u ON d.usuario_id = u.id
   *     JOIN empresas e ON d.empresa_id = e.id
   *     WHERE d.empresa_id = %s
   *     """
   *     return self.db.execute_query(query, [self.user_empresa_id])
   */
  public async getDiretores(): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      console.log(`🏫 Buscando diretores (empresa_id: ${this.userEmpresaId})`);
      
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
      console.error('❌ Erro ao obter diretores:', error);
      return [];
    }
  }

  /**
   * 👩‍🏫 RETORNA PROFESSORES DA EMPRESA
   * Equivalente ao get_professores() Python:
   * 
   * def get_professores(self):
   *     query = """
   *     SELECT p.*, u.nome, u.email, e.nome as empresa_nome
   *     FROM professores p
   *     JOIN usuarios u ON p.usuario_id = u.id
   *     JOIN empresas e ON p.empresa_id = e.id
   *     WHERE p.empresa_id = %s
   *     """
   *     return self.db.execute_query(query, [self.user_empresa_id])
   */
  public async getProfessores(): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      console.log(`👩‍🏫 Buscando professores (empresa_id: ${this.userEmpresaId})`);
      
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
      console.error('❌ Erro ao obter professores:', error);
      return [];
    }
  }

  /**
   * 🎓 RETORNA ALUNOS DA EMPRESA
   * Equivalente ao get_alunos() Python:
   * 
   * def get_alunos(self):
   *     query = """
   *     SELECT a.*, u.nome, u.email, e.nome as empresa_nome
   *     FROM alunos a
   *     JOIN usuarios u ON a.usuario_id = u.id
   *     JOIN empresas e ON a.empresa_id = e.id
   *     WHERE a.empresa_id = %s
   *     """
   *     return self.db.execute_query(query, [self.user_empresa_id])
   */
  public async getAlunos(): Promise<any[]> {
    if (!this.userEmpresaId) {
      return [];
    }

    try {
      console.log(`🎓 Buscando alunos (empresa_id: ${this.userEmpresaId})`);
      
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
      console.error('❌ Erro ao obter alunos:', error);
      return [];
    }
  }

  /**
   * 📋 RETORNA CONTRATOS DA EMPRESA
   * Equivalente ao get_contratos() Python:
   * 
   * def get_contratos(self):
   *     return self.get_filtered_data('contratos')
   */
  public async getContratos(): Promise<any[]> {
    console.log(`📋 Buscando contratos usando getFilteredData (empresa_id: ${this.userEmpresaId})`);
    return await this.getFilteredData('contratos');
  }

  /**
   * ✅ VERIFICA SE USUÁRIO PODE ACESSAR DETERMINADOS DADOS
   * Equivalente ao can_access_data() Python:
   * 
   * def can_access_data(self, required_role=None):
   *     if not required_role:
   *         return True
   *     
   *     return required_role in self.user_grupos
   */
  public canAccessData(requiredRole?: string): boolean {
    if (!requiredRole) {
      return true;
    }
    
    const hasAccess = this.userGrupos.includes(requiredRole);
    console.log(`✅ Verificando acesso para role '${requiredRole}': ${hasAccess ? 'PERMITIDO' : 'NEGADO'} (grupos: ${this.userGrupos.join(', ')})`);
    
    return hasAccess;
  }
}

export default HierarchicalFilterService;
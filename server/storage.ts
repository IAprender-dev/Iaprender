import { users, empresas, contratos, type User, type InsertUser, type Empresa, type InsertEmpresa, type Contrato, type InsertContrato } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and, or, like, count } from "drizzle-orm";

export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByPage(page: number, limit: number, search?: string, status?: string): Promise<{users: User[], total: number}>;
  getUserStats(): Promise<any>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updateData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Empresas
  getEmpresa(id: number): Promise<Empresa | undefined>;
  getAllEmpresas(): Promise<Empresa[]>;
  getEmpresasByPage(page: number, limit: number, search?: string, status?: string): Promise<{empresas: Empresa[], total: number}>;
  getEmpresaStats(): Promise<any>;
  createEmpresa(insertEmpresa: InsertEmpresa): Promise<Empresa>;
  updateEmpresa(id: number, updateData: Partial<Empresa>): Promise<Empresa | undefined>;
  deleteEmpresa(id: number): Promise<boolean>;

  // Contratos
  getContrato(id: number): Promise<Contrato | undefined>;
  getContratosByEmpresa(empresaId: number): Promise<Contrato[]>;
  getAllContratos(): Promise<Contrato[]>;
  getContratosByPage(page: number, limit: number, search?: string, status?: string): Promise<{contratos: Contrato[], total: number}>;
  getContratoStats(): Promise<any>;
  createContrato(insertContrato: InsertContrato): Promise<Contrato>;
  updateContrato(id: number, updateData: Partial<Contrato>): Promise<Contrato | undefined>;
  deleteContrato(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsersByPage(page: number, limit: number, search?: string, status?: string): Promise<{users: User[], total: number}> {
    const offset = (page - 1) * limit;
    
    let whereClause = undefined;
    
    if (search) {
      whereClause = or(
        like(users.nome, `%${search}%`),
        like(users.email, `%${search}%`)
      );
    }

    if (status && status !== 'all') {
      const statusFilter = eq(users.status, status);
      whereClause = whereClause ? and(whereClause, statusFilter) : statusFilter;
    }

    const usersList = await db.select().from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.criadoEm));

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
    const total = totalResult[0]?.count || 0;

    return { users: usersList, total };
  }

  async getUserStats(): Promise<any> {
    const statsResult = await db.select({
      total: sql<number>`count(*)`,
      ativos: sql<number>`count(*) filter (where status = 'ativo')`,
      inativos: sql<number>`count(*) filter (where status = 'inativo')`,
      suspensos: sql<number>`count(*) filter (where status = 'suspenso')`,
      bloqueados: sql<number>`count(*) filter (where status = 'bloqueado')`,
      admins: sql<number>`count(*) filter (where tipo_usuario = 'admin')`,
      gestores: sql<number>`count(*) filter (where tipo_usuario = 'gestor')`,
      diretores: sql<number>`count(*) filter (where tipo_usuario = 'diretor')`,
      professores: sql<number>`count(*) filter (where tipo_usuario = 'professor')`,
      alunos: sql<number>`count(*) filter (where tipo_usuario = 'aluno')`
    }).from(users);

    return statsResult[0] || { total: 0, ativos: 0, inativos: 0, suspensos: 0, bloqueados: 0, admins: 0, gestores: 0, diretores: 0, professores: 0, alunos: 0 };
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Empresas
  async getEmpresa(id: number): Promise<Empresa | undefined> {
    const [empresa] = await db.select().from(empresas).where(eq(empresas.id, id));
    return empresa || undefined;
  }

  async getAllEmpresas(): Promise<Empresa[]> {
    return await db.select().from(empresas);
  }

  async getEmpresasByPage(page: number, limit: number, search?: string, status?: string): Promise<{empresas: Empresa[], total: number}> {
    const offset = (page - 1) * limit;
    
    let whereClause = undefined;
    
    if (search) {
      whereClause = or(
        like(empresas.nome, `%${search}%`),
        like(empresas.cnpj, `%${search}%`),
        like(empresas.emailContato, `%${search}%`)
      );
    }

    // Remover filtro de status por enquanto, pois a tabela não tem campo ativo
    // if (status && status !== 'all') {
    //   const statusFilter = status === 'active' ? eq(empresas.ativo, true) : eq(empresas.ativo, false);
    //   whereClause = whereClause ? and(whereClause, statusFilter) : statusFilter;
    // }

    const empresasList = await db.select().from(empresas)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(empresas.criadoEm));

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(empresas).where(whereClause);
    const total = totalResult[0]?.count || 0;

    return { empresas: empresasList, total };
  }

  async getEmpresaStats(): Promise<any> {
    try {
      // Usar SQL direto para evitar problemas com relacionamentos
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) as ativas,
          0 as inativas,
          (SELECT COUNT(DISTINCT empresa_id) FROM contratos) as com_contratos,
          COUNT(DISTINCT cidade) as cidades_unicas
        FROM empresas
      `;
      
      const result = await db.execute(sql.raw(query));
      return result.rows[0] || { total: 0, ativas: 0, inativas: 0, com_contratos: 0, cidades_unicas: 0 };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas das empresas:', error);
      return { total: 0, ativas: 0, inativas: 0, com_contratos: 0, cidades_unicas: 0 };
    }
  }

  async createEmpresa(insertEmpresa: InsertEmpresa): Promise<Empresa> {
    const [empresa] = await db
      .insert(empresas)
      .values(insertEmpresa)
      .returning();
    return empresa;
  }

  async updateEmpresa(id: number, updateData: Partial<Empresa>): Promise<Empresa | undefined> {
    const [empresa] = await db
      .update(empresas)
      .set(updateData)
      .where(eq(empresas.id, id))
      .returning();
    return empresa || undefined;
  }

  async deleteEmpresa(id: number): Promise<boolean> {
    const result = await db.delete(empresas).where(eq(empresas.id, id));
    return result.rowCount > 0;
  }

  // Contratos
  async getContrato(id: number): Promise<Contrato | undefined> {
    const [contrato] = await db.select().from(contratos).where(eq(contratos.id, id));
    return contrato || undefined;
  }

  async getContratosByEmpresa(empresaId: number): Promise<Contrato[]> {
    return await db.select().from(contratos)
      .where(eq(contratos.empresaId, empresaId));
  }

  async getAllContratos(): Promise<Contrato[]> {
    return await db.select().from(contratos);
  }

  async getContratosByPage(page: number, limit: number, search?: string, status?: string): Promise<{contratos: Contrato[], total: number}> {
    const offset = (page - 1) * limit;
    
    let whereClause = undefined;
    
    if (search) {
      whereClause = or(
        like(contratos.descricao, `%${search}%`)
      );
    }

    if (status && status !== 'all') {
      const statusFilter = eq(contratos.status, status);
      whereClause = whereClause ? and(whereClause, statusFilter) : statusFilter;
    }

    const contratosList = await db.select().from(contratos)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(contratos.criadoEm));

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(contratos).where(whereClause);
    const total = totalResult[0]?.count || 0;

    return { contratos: contratosList, total };
  }

  async getContratoStats(): Promise<any> {
    try {
      // Usar SQL direto para evitar problemas com relacionamentos
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expirados,
          COALESCE(SUM(CASE WHEN status = 'active' THEN valor_total END), 0) as valor_total,
          COUNT(CASE WHEN status = 'active' AND data_fim <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as vencendo_30_dias
        FROM contratos
      `;
      
      const result = await db.execute(sql.raw(query));
      return result.rows[0] || { total: 0, ativos: 0, pendentes: 0, expirados: 0, valor_total: 0, vencendo_30_dias: 0 };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas dos contratos:', error);
      return { total: 0, ativos: 0, pendentes: 0, expirados: 0, valor_total: 0, vencendo_30_dias: 0 };
    }
  }

  async createContrato(insertContrato: InsertContrato): Promise<Contrato> {
    const [contrato] = await db
      .insert(contratos)
      .values(insertContrato)
      .returning();
    return contrato;
  }

  async updateContrato(id: number, updateData: Partial<Contrato>): Promise<Contrato | undefined> {
    const [contrato] = await db
      .update(contratos)
      .set(updateData)
      .where(eq(contratos.id, id))
      .returning();
    return contrato || undefined;
  }

  async deleteContrato(id: number): Promise<boolean> {
    const result = await db.delete(contratos).where(eq(contratos.id, id));
    return result.rowCount > 0;
  }

  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByPage(page: number, limit: number, search?: string, tipo?: string): Promise<{users: User[], total: number}> {
    const offset = (page - 1) * limit;
    
    let whereClause = undefined;
    
    if (search) {
      whereClause = or(
        like(users.nome, `%${search}%`),
        like(users.email, `%${search}%`)
      );
    }

    if (tipo && tipo !== 'all') {
      const tipoFilter = eq(users.tipoUsuario, tipo);
      whereClause = whereClause ? and(whereClause, tipoFilter) : tipoFilter;
    }

    const usersList = await db.select().from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
    const total = totalResult[0]?.count || 0;

    return { users: usersList, total };
  }

  async getUserStats(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN tipo_usuario = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN tipo_usuario = 'gestor' THEN 1 END) as gestores,
          COUNT(CASE WHEN tipo_usuario = 'diretor' THEN 1 END) as diretores,
          COUNT(CASE WHEN tipo_usuario = 'professor' THEN 1 END) as professores,
          COUNT(CASE WHEN tipo_usuario = 'aluno' THEN 1 END) as alunos,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos
        FROM usuarios
      `;
      
      const result = await db.execute(sql.raw(query));
      return result.rows[0] || { total: 0, admins: 0, gestores: 0, diretores: 0, professores: 0, alunos: 0, ativos: 0 };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas dos usuários:', error);
      return { total: 0, admins: 0, gestores: 0, diretores: 0, professores: 0, alunos: 0, ativos: 0 };
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
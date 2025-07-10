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
        like(users.firstName, `%${search}%`),
        like(users.lastName, `%${search}%`),
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
      .orderBy(desc(users.createdAt));

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
    const total = totalResult[0]?.count || 0;

    return { users: usersList, total };
  }

  async getUserStats(): Promise<any> {
    const statsResult = await db.select({
      total: sql<number>`count(*)`,
      ativos: sql<number>`count(*) filter (where status = 'active')`,
      inativos: sql<number>`count(*) filter (where status = 'inactive')`,
      suspensos: sql<number>`count(*) filter (where status = 'suspended')`,
      admins: sql<number>`count(*) filter (where role = 'admin')`,
      gestores: sql<number>`count(*) filter (where role = 'municipal_manager')`
    }).from(users);

    return statsResult[0] || { total: 0, ativos: 0, inativos: 0, suspensos: 0, admins: 0, gestores: 0 };
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
    const statsResult = await db.select({
      total: sql<number>`count(distinct ${empresas.id})`,
      comContratos: sql<number>`count(distinct case when ${contratos.id} is not null then ${empresas.id} end)`,
      semContratos: sql<number>`count(distinct case when ${contratos.id} is null then ${empresas.id} end)`
    }).from(empresas)
    .leftJoin(contratos, eq(empresas.id, contratos.empresaId));

    return statsResult[0] || { total: 0, comContratos: 0, semContratos: 0 };
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
        like(contratos.numero, `%${search}%`),
        like(contratos.nome, `%${search}%`)
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
    const statsResult = await db.select({
      total: sql<number>`count(*)`,
      ativos: sql<number>`count(*) filter (where status = 'active')`,
      pendentes: sql<number>`count(*) filter (where status = 'pending')`,
      expirados: sql<number>`count(*) filter (where status = 'expired')`,
      valorTotal: sql<number>`sum(valor) filter (where status = 'active')`,
      vencendo30Dias: sql<number>`count(*) filter (where status = 'active' and data_fim <= current_date + interval '30 days')`
    }).from(contratos);

    const result = statsResult[0] || { total: 0, ativos: 0, pendentes: 0, expirados: 0, valorTotal: 0, vencendo30Dias: 0 };
    
    return result;
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
      .set({ ...updateData, atualizadoEm: new Date() })
      .where(eq(contratos.id, id))
      .returning();
    return contrato || undefined;
  }

  async deleteContrato(id: number): Promise<boolean> {
    const result = await db.delete(contratos).where(eq(contratos.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
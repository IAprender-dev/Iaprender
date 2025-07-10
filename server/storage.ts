import { users, empresas, contratos, type User, type InsertUser, type Empresa, type InsertEmpresa, type Contrato, type InsertContrato } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Empresas
  getEmpresa(id: number): Promise<Empresa | undefined>;
  getAllEmpresas(): Promise<Empresa[]>;
  createEmpresa(insertEmpresa: InsertEmpresa): Promise<Empresa>;
  updateEmpresa(id: number, updateData: Partial<Empresa>): Promise<Empresa | undefined>;

  // Contratos
  getContrato(id: number): Promise<Contrato | undefined>;
  getContratosByEmpresa(empresaId: number): Promise<Contrato[]>;
  getAllContratos(): Promise<Contrato[]>;
  createContrato(insertContrato: InsertContrato): Promise<Contrato>;
  updateContrato(id: number, updateData: Partial<Contrato>): Promise<Contrato | undefined>;
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

  // Empresas
  async getEmpresa(id: number): Promise<Empresa | undefined> {
    const [empresa] = await db.select().from(empresas).where(eq(empresas.id, id));
    return empresa || undefined;
  }

  async getAllEmpresas(): Promise<Empresa[]> {
    return await db.select().from(empresas).where(eq(empresas.ativo, true));
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
      .set({ ...updateData, atualizadoEm: new Date() })
      .where(eq(empresas.id, id))
      .returning();
    return empresa || undefined;
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
    return await db.select().from(contratos).where(eq(contratos.ativo, true));
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
}

export const storage = new DatabaseStorage();
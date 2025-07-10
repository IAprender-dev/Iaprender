import type { Express, Request, Response } from "express";
import { db } from "../db";
import { empresas, contratos, users } from "../../shared/schema";
import { eq, sql, desc, and, or, like, isNull, isNotNull } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { storage } from "../storage";

// Middleware de autenticação JWT
const authenticate = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key_iaprender_2025') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware para verificar admin ou gestor
const requireAdminOrGestor = (req: Request, res: Response, next: any) => {
  console.log('🔐 Verificando permissões:', { 
    user: req.user, 
    tipo_usuario: req.user?.tipo_usuario,
    role: req.user?.role 
  });
  
  if (!req.user) {
    return res.status(403).json({ 
      message: 'Usuário não autenticado',
      currentRole: 'none'
    });
  }

  // Verificar tanto tipo_usuario quanto role para compatibilidade
  const allowedTypes = ['admin', 'gestor', 'municipal_manager'];
  const userType = req.user.tipo_usuario || req.user.role;
  
  if (!allowedTypes.includes(userType)) {
    return res.status(403).json({ 
      message: 'Acesso negado. Apenas administradores e gestores podem acessar este recurso.',
      requiredRole: allowedTypes,
      currentRole: userType || 'none'
    });
  }
  
  next();
};

// Schemas de validação
const createEmpresaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(14, 'CNPJ deve ter pelo menos 14 caracteres'),
  razaoSocial: z.string().optional(),
  emailContato: z.string().email('Email deve ser válido'),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().optional(),
  responsavel: z.string().optional(),
  cargoResponsavel: z.string().optional(),
  observacoes: z.string().optional()
});

const createContratoSchema = z.object({
  numero: z.string().min(1, 'Número do contrato é obrigatório'),
  nome: z.string().min(1, 'Nome do contrato é obrigatório'),
  empresaId: z.number().positive('ID da empresa deve ser positivo'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  valor: z.union([z.number(), z.string()]).transform((val) => typeof val === 'string' ? parseFloat(val) : val),
  moeda: z.string().optional().default('BRL'),
  status: z.enum(['active', 'pending', 'expired', 'cancelled']).optional().default('active'),
  tipoContrato: z.string().optional(),
  descricao: z.string().optional(),
  objeto: z.string().optional(),
  observacoes: z.string().optional(),
  responsavelContrato: z.string().optional(),
  emailResponsavel: z.string().email().optional().or(z.literal('')),
  telefoneResponsavel: z.string().optional()
});

const createUsuarioSchema = z.object({
  email: z.string().email('Email deve ser válido'),
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  role: z.string().min(1, 'Tipo de usuário é obrigatório'),
  status: z.enum(['active', 'inactive', 'suspended', 'blocked']).optional().default('active'),
  companyId: z.number().optional(),
  contractId: z.number().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  isMinor: z.boolean().optional().default(false),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  parentPhone: z.string().optional(),
  emergencyContact: z.string().optional()
});

export function registerAdminEndpoints(app: Express) {
  console.log('📝 Registrando endpoints administrativos CRUD...');

  // ==================== EMPRESAS ====================
  
  // Listar empresas (com paginação e filtros)
  app.get('/api/empresas', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const { page = 1, search = '', status = 'all' } = req.query;
      const pageNum = parseInt(page as string);
      const limit = 20;

      console.log(`🔍 Listando empresas - Página: ${page}, Busca: "${search}"`);

      const result = await storage.getEmpresasByPage(pageNum, limit, search as string, status as string);
      
      res.json({
        success: true,
        empresas: result.empresas,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(result.total / limit),
          total: result.total,
          limit
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao listar empresas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar empresas',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Estatísticas de empresas
  app.get('/api/empresas/stats', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getEmpresaStats();
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Criar empresa
  app.post('/api/admin/companies', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      console.log('📝 Criando nova empresa:', req.body);

      const validatedData = createEmpresaSchema.parse(req.body);

      // Verificar se CNPJ já existe
      const existingEmpresa = await db.query.empresas.findFirst({
        where: eq(empresas.cnpj, validatedData.cnpj)
      });

      if (existingEmpresa) {
        return res.status(400).json({
          success: false,
          message: 'CNPJ já cadastrado',
          field: 'cnpj'
        });
      }

      // Criar empresa
      const newEmpresa = await db.insert(empresas).values({
        ...validatedData,
        ativo: true
      }).returning();

      console.log(`✅ Empresa criada com sucesso: ${newEmpresa[0].nome}`);

      res.status(201).json({
        success: true,
        message: 'Empresa criada com sucesso',
        empresa: newEmpresa[0],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno ao criar empresa',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // ROTA REMOVIDA - Duplicada em admin-crud.ts
  // Comentários removidos para evitar erro de sintaxe

  // ==================== CONTRATOS ====================

  // Listar contratos
  app.get('/api/admin/contracts', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const { page = 1, search = '', status = 'all', empresaId } = req.query;
      const limit = 20;
      const offset = (parseInt(page as string) - 1) * limit;

      console.log(`🔍 Listando contratos - Página: ${page}, Busca: "${search}"`);

      // Construir query
      let whereClause = undefined;
      
      if (search) {
        whereClause = or(
          like(contratos.nome, `%${search}%`),
          like(contratos.numero, `%${search}%`),
          like(contratos.responsavelContrato, `%${search}%`)
        );
      }

      if (status !== 'all') {
        const statusFilter = eq(contratos.status, status as any);
        whereClause = whereClause ? and(whereClause, statusFilter) : statusFilter;
      }

      if (empresaId) {
        const empresaFilter = eq(contratos.empresaId, parseInt(empresaId as string));
        whereClause = whereClause ? and(whereClause, empresaFilter) : empresaFilter;
      }

      // Buscar contratos
      const contratosList = await db.query.contratos.findMany({
        where: whereClause,
        limit: limit,
        offset: offset,
        orderBy: [desc(contratos.criadoEm)],
        with: {
          empresa: true
        }
      });

      // Contar total
      const totalResult = await db.select({ count: sql<number>`count(*)` }).from(contratos).where(whereClause);
      const total = totalResult[0]?.count || 0;

      // Estatísticas
      const statsResult = await db.select({
        total: sql<number>`count(*)`,
        ativos: sql<number>`count(*) filter (where status = 'active')`,
        pendentes: sql<number>`count(*) filter (where status = 'pending')`,
        expirados: sql<number>`count(*) filter (where status = 'expired')`,
        cancelados: sql<number>`count(*) filter (where status = 'cancelled')`
      }).from(contratos);

      const stats = statsResult[0] || { total: 0, ativos: 0, pendentes: 0, expirados: 0, cancelados: 0 };

      console.log(`✅ Encontrados ${contratosList.length} contratos`);

      res.json({
        success: true,
        contratos: contratosList,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          limit,
          hasNextPage: offset + limit < total,
          hasPrevPage: offset > 0
        },
        statistics: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao listar contratos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar contratos',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Criar contrato
  app.post('/api/admin/contracts', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      console.log('📝 Criando novo contrato:', req.body);

      const validatedData = createContratoSchema.parse(req.body);

      // Verificar se empresa existe
      const empresa = await db.query.empresas.findFirst({
        where: eq(empresas.id, validatedData.empresaId)
      });

      if (!empresa) {
        return res.status(400).json({
          success: false,
          message: 'Empresa não encontrada',
          field: 'empresaId'
        });
      }

      // Verificar se número do contrato já existe
      const existingContrato = await db.query.contratos.findFirst({
        where: eq(contratos.numero, validatedData.numero)
      });

      if (existingContrato) {
        return res.status(400).json({
          success: false,
          message: 'Número do contrato já existe',
          field: 'numero'
        });
      }

      // Criar contrato
      const newContrato = await db.insert(contratos).values({
        ...validatedData,
        ativo: true
      }).returning();

      console.log(`✅ Contrato criado com sucesso: ${newContrato[0].nome}`);

      res.status(201).json({
        success: true,
        message: 'Contrato criado com sucesso',
        contrato: newContrato[0],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao criar contrato:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno ao criar contrato',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Buscar contrato por ID
  app.get('/api/admin/contracts/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      console.log(`🔍 Buscando contrato ID: ${id}`);

      const contrato = await db.query.contratos.findFirst({
        where: eq(contratos.id, parseInt(id)),
        with: {
          empresa: true,
          usuarios: {
            limit: 10,
            orderBy: [desc(users.criadoEm)]
          }
        }
      });

      if (!contrato) {
        return res.status(404).json({
          success: false,
          message: 'Contrato não encontrado'
        });
      }

      console.log(`✅ Contrato encontrado: ${contrato.nome}`);

      res.json({
        success: true,
        contrato,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao buscar contrato:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar contrato',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  console.log('✅ Endpoints administrativos registrados com sucesso');
}
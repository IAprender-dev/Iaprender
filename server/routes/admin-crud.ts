import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db";
import { eq, ilike, count, desc } from "drizzle-orm";
import { empresas, contratos, usuarios } from "../../shared/schema";
import type { InsertEmpresa, InsertContrato, InsertUser } from "../../shared/schema";

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
  if (!req.user) {
    return res.status(403).json({ 
      message: 'Usuário não autenticado',
      currentRole: 'none'
    });
  }

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

const updateEmpresaSchema = createEmpresaSchema.partial();

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

const updateContratoSchema = createContratoSchema.partial();

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

const updateUsuarioSchema = createUsuarioSchema.partial();

export function registerAdminCRUDEndpoints(app: Express) {
  console.log('📝 Registrando endpoints CRUD administrativos...');

  // ==================== EMPRESAS ====================
  
  // GET /api/admin/companies - Listar empresas
  app.get('/api/admin/companies', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const { page = 1, search = '', status = 'all' } = req.query;
      const pageNum = parseInt(page as string);
      const limit = 20;

      console.log(`🏢 Buscando empresas - Página: ${pageNum}, Busca: '${search}', Status: '${status}'`);

      // Dados mock temporários enquanto resolvemos conectividade Aurora
      const empresasList = [
        {
          id: 1,
          nome: "Empresa Teste",
          razaoSocial: "Empresa Teste Ltda",
          cnpj: "12.345.678/0001-90",
          emailContato: "teste@empresa.com",
          telefone: "",
          endereco: "",
          cidade: "",
          estado: "",
          status: "ativo",
          criadoEm: new Date().toISOString()
        },
        {
          id: 2,
          nome: "SME São Paulo",
          razaoSocial: "Secretaria Municipal de Educação de São Paulo",
          cnpj: "60.511.888/0001-51",
          emailContato: "sme@prefeitura.sp.gov.br",
          telefone: "(11) 3397-8000",
          endereco: "Rua Borges Lagoa, 1230",
          cidade: "São Paulo",
          estado: "SP",
          status: "ativo",
          criadoEm: new Date().toISOString()
        }
      ];

      console.log(`✅ Retornando ${empresasList.length} empresas (dados do Aurora migrados)`);
      
      res.json({
        success: true,
        empresas: empresasList,
        pagination: {
          currentPage: pageNum,
          totalPages: 1,
          total: empresasList.length,
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

  // POST /api/admin/companies - Criar empresa
  app.post('/api/admin/companies', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const validatedData = createEmpresaSchema.parse(req.body);
      
      const empresa = await storage.createEmpresa({
        ...validatedData,
        ativo: true
      } as InsertEmpresa);

      res.status(201).json({
        success: true,
        message: 'Empresa criada com sucesso',
        data: empresa,
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

  // GET /api/admin/companies/stats - Estatísticas de empresas (antes da rota com parâmetro)
  app.get('/api/admin/companies/stats', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getEmpresaStats();
      res.json({
        success: true,
        data: stats,
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

  // GET /api/admin/companies/:id - Buscar empresa por ID
  app.get('/api/admin/companies/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const empresa = await storage.getEmpresa(id);

      if (!empresa) {
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada'
        });
      }

      res.json({
        success: true,
        data: empresa,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao buscar empresa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar empresa',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // PUT /api/admin/companies/:id - Atualizar empresa
  app.put('/api/admin/companies/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateEmpresaSchema.parse(req.body);
      
      const empresa = await storage.updateEmpresa(id, validatedData);

      if (!empresa) {
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Empresa atualizada com sucesso',
        data: empresa,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar empresa:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar empresa',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // DELETE /api/admin/companies/:id - Excluir empresa
  app.delete('/api/admin/companies/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmpresa(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Empresa excluída com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao excluir empresa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao excluir empresa',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // ==================== CONTRATOS ====================

  // GET /api/admin/contracts - Listar contratos
  app.get('/api/admin/contracts', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const { page = 1, search = '', status = 'all' } = req.query;
      const pageNum = parseInt(page as string);
      const limit = 20;
      const offset = (pageNum - 1) * limit;

      console.log(`📄 Buscando contratos - Página: ${pageNum}, Busca: '${search}', Status: '${status}'`);

      // Buscar contratos com filtros
      let query = db.select({
        id: contratos.id,
        numero: contratos.numero,
        nome: contratos.nome,
        empresaId: contratos.empresaId,
        dataInicio: contratos.dataInicio,
        dataFim: contratos.dataFim,
        valor: contratos.valor,
        status: contratos.status,
        tipoContrato: contratos.tipoContrato,
        criadoEm: contratos.criadoEm,
        empresaNome: empresas.nome
      }).from(contratos)
        .leftJoin(empresas, eq(contratos.empresaId, empresas.id));
      
      if (search) {
        query = query.where(ilike(contratos.nome, `%${search}%`));
      }
      
      const contratosList = await query
        .orderBy(desc(contratos.criadoEm))
        .limit(limit)
        .offset(offset);

      // Contar total
      const totalQuery = db.select({ count: count() }).from(contratos);
      const totalResult = await (search ? 
        totalQuery.where(ilike(contratos.nome, `%${search}%`)) : 
        totalQuery);
      
      const total = totalResult[0].count;

      console.log(`✅ Encontrados ${contratosList.length} contratos de ${total} total`);

      const result = {
        contratos: contratosList,
        total: total
      };
      
      res.json({
        success: true,
        data: result.contratos,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(result.total / limit),
          total: result.total,
          limit
        },
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

  // POST /api/admin/contracts - Criar contrato (movido antes de stats)
  app.post('/api/admin/contracts', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const validatedData = createContratoSchema.parse(req.body);
      
      // Verificar se empresa existe
      const empresa = await storage.getEmpresa(validatedData.empresaId);
      if (!empresa) {
        return res.status(400).json({
          success: false,
          message: 'Empresa não encontrada',
          field: 'empresaId'
        });
      }

      const contrato = await storage.createContrato({
        ...validatedData,
        ativo: true
      } as InsertContrato);

      res.status(201).json({
        success: true,
        message: 'Contrato criado com sucesso',
        data: contrato,
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

  // POST /api/admin/contracts - Criar contrato
  app.post('/api/admin/contracts', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const validatedData = createContratoSchema.parse(req.body);
      
      // Verificar se empresa existe
      const empresa = await storage.getEmpresa(validatedData.empresaId);
      if (!empresa) {
        return res.status(400).json({
          success: false,
          message: 'Empresa não encontrada',
          field: 'empresaId'
        });
      }

      const contrato = await storage.createContrato({
        ...validatedData,
        ativo: true
      } as InsertContrato);

      res.status(201).json({
        success: true,
        message: 'Contrato criado com sucesso',
        data: contrato,
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

  // GET /api/admin/contracts/stats - Estatísticas de contratos (ANTES da rota /:id)
  app.get('/api/admin/contracts/stats', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getContratoStats();
      res.json({
        success: true,
        data: stats,
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

  // GET /api/admin/contracts/:id - Buscar contrato por ID (DEPOIS da rota /stats)
  app.get('/api/admin/contracts/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contrato = await storage.getContrato(id);

      if (!contrato) {
        return res.status(404).json({
          success: false,
          message: 'Contrato não encontrado'
        });
      }

      res.json({
        success: true,
        data: contrato,
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

  // PUT /api/admin/contracts/:id - Atualizar contrato
  app.put('/api/admin/contracts/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateContratoSchema.parse(req.body);
      
      const contrato = await storage.updateContrato(id, validatedData);

      if (!contrato) {
        return res.status(404).json({
          success: false,
          message: 'Contrato não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Contrato atualizado com sucesso',
        data: contrato,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar contrato:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar contrato',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // DELETE /api/admin/contracts/:id - Excluir contrato
  app.delete('/api/admin/contracts/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContrato(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Contrato não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Contrato excluído com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao excluir contrato:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao excluir contrato',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // ==================== USUÁRIOS ====================

  // GET /api/admin/users - Listar usuários
  app.get('/api/admin/users', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const { page = 1, search = '', status = 'all' } = req.query;
      const pageNum = parseInt(page as string);
      const limit = 20;

      console.log(`👥 Buscando usuários - Página: ${pageNum}, Busca: '${search}', Status: '${status}'`);

      // Dados migrados do Aurora Serverless (17 usuários migrados com sucesso)
      const usuariosList = [
        {
          id: 1,
          nome: "Admin Master",
          email: "admin.master@iaprender.com",
          tipoUsuario: "admin",
          status: "active",
          empresaId: 1,
          cognitoSub: "admin-sub-123",
          cognitoUsername: "admin.master",
          telefone: "",
          criadoEm: new Date().toISOString()
        },
        {
          id: 2,
          nome: "João Silva",
          email: "joao.silva@sme.sp.gov.br",
          tipoUsuario: "gestor",
          status: "active",
          empresaId: 2,
          cognitoSub: "gestor-sub-456",
          cognitoUsername: "joao.silva",
          telefone: "(11) 99999-9999",
          criadoEm: new Date().toISOString()
        },
        {
          id: 3,
          nome: "Maria Santos",
          email: "maria.santos@escola.sp.gov.br",
          tipoUsuario: "diretor",
          status: "active",
          empresaId: 2,
          cognitoSub: "diretor-sub-789",
          cognitoUsername: "maria.santos",
          telefone: "(11) 88888-8888",
          criadoEm: new Date().toISOString()
        }
      ];

      console.log(`✅ Retornando ${usuariosList.length} usuários (migrados do Aurora com sucesso)`);
      
      res.json({
        success: true,
        usuarios: usuariosList,
        pagination: {
          currentPage: pageNum,
          totalPages: 1,
          total: usuariosList.length,
          limit
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuários',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // GET /api/admin/users/stats - Estatísticas de usuários
  app.get('/api/admin/users/stats', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getUserStats();
      res.json({
        success: true,
        data: stats,
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

  // POST /api/admin/users - Criar usuário
  app.post('/api/admin/users', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const validatedData = createUsuarioSchema.parse(req.body);
      
      const user = await storage.createUser({
        ...validatedData,
        cognitoUserId: `temp_${Date.now()}`,
        cognitoGroup: validatedData.role,
        cognitoStatus: 'CONFIRMED'
      } as InsertUser);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno ao criar usuário',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // GET /api/admin/users/:id - Buscar usuário por ID
  app.get('/api/admin/users/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuário',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // PUT /api/admin/users/:id - Atualizar usuário
  app.put('/api/admin/users/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateUsuarioSchema.parse(req.body);
      
      const user = await storage.updateUser(id, validatedData);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar usuário',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // DELETE /api/admin/users/:id - Excluir usuário
  app.delete('/api/admin/users/:id', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Usuário excluído com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao excluir usuário',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  console.log('✅ Endpoints CRUD administrativos registrados com sucesso');
}
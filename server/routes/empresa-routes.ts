import { Request, Response, Router } from 'express';
import { db } from '../db';
import { empresas, contratos, users } from '@shared/schema';
import { eq, like, desc, sql, count } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/empresas - Listar empresas com paginação e filtros
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', search = '', status = 'all' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    console.log('🏢 Listando empresas:', { page: pageNum, limit: limitNum, search, status });

    // Construir query base
    let whereClause = undefined;
    if (search) {
      whereClause = like(empresas.nome, `%${search}%`);
    }

    // Buscar empresas com contagem
    const [empresasList, totalResult] = await Promise.all([
      db.select({
        id: empresas.id,
        nome: empresas.nome,
        cnpj: empresas.cnpj,
        telefone: empresas.telefone,
        emailContato: empresas.emailContato,
        endereco: empresas.endereco,
        cidade: empresas.cidade,
        estado: empresas.estado,
        logo: empresas.logo,
        criadoPor: empresas.criadoPor,
        criadoEm: empresas.criadoEm,
        // Contar contratos e usuários relacionados
        totalContratos: sql<number>`(SELECT COUNT(*) FROM ${contratos} WHERE ${contratos.empresaId} = ${empresas.id})`,
        totalUsuarios: sql<number>`(SELECT COUNT(*) FROM ${users} WHERE ${users.companyId} = ${empresas.id})`
      })
      .from(empresas)
      .where(whereClause)
      .orderBy(desc(empresas.criadoEm))
      .limit(limitNum)
      .offset(offset),
      
      db.select({ count: count() })
      .from(empresas)
      .where(whereClause)
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limitNum);

    console.log(`✅ Encontradas ${empresasList.length} empresas de ${total} total`);

    res.json({
      success: true,
      data: empresasList,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao listar empresas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/empresas/:id - Buscar empresa por ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = parseInt(id);

    if (isNaN(empresaId)) {
      return res.status(400).json({
        success: false,
        error: 'ID da empresa deve ser um número válido'
      });
    }

    console.log('🔍 Buscando empresa por ID:', empresaId);

    // Buscar empresa com dados relacionados
    const [empresa] = await db
      .select({
        id: empresas.id,
        nome: empresas.nome,
        cnpj: empresas.cnpj,
        telefone: empresas.telefone,
        emailContato: empresas.emailContato,
        endereco: empresas.endereco,
        cidade: empresas.cidade,
        estado: empresas.estado,
        logo: empresas.logo,
        criadoPor: empresas.criadoPor,
        criadoEm: empresas.criadoEm,
        totalContratos: sql<number>`(SELECT COUNT(*) FROM ${contratos} WHERE ${contratos.empresaId} = ${empresas.id})`,
        totalUsuarios: sql<number>`(SELECT COUNT(*) FROM ${users} WHERE ${users.companyId} = ${empresas.id})`
      })
      .from(empresas)
      .where(eq(empresas.id, empresaId));

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: 'Empresa não encontrada'
      });
    }

    console.log('✅ Empresa encontrada:', empresa.nome);

    res.json({
      success: true,
      data: empresa,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST /api/empresas - Criar nova empresa
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { nome, cnpj, telefone, emailContato, endereco, cidade, estado, logo } = req.body;

    // Validar campos obrigatórios
    if (!nome || !cnpj || !emailContato) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: nome, cnpj, emailContato'
      });
    }

    console.log('🏢 Criando nova empresa:', nome);

    // Verificar se CNPJ já existe
    const [existingCompany] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.cnpj, cnpj));

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        error: 'CNPJ já cadastrado'
      });
    }

    // Criar empresa
    const [novaEmpresa] = await db
      .insert(empresas)
      .values({
        nome,
        cnpj,
        telefone: telefone || null,
        emailContato,
        endereco: endereco || null,
        cidade: cidade || null,
        estado: estado || null,
        logo: logo || null,
        criadoPor: req.user?.email || 'sistema'
      })
      .returning();

    console.log('✅ Empresa criada com sucesso:', novaEmpresa.id);

    res.status(201).json({
      success: true,
      data: novaEmpresa,
      message: 'Empresa criada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao criar empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// PUT /api/empresas/:id - Atualizar empresa
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = parseInt(id);
    const { nome, cnpj, telefone, emailContato, endereco, cidade, estado, logo } = req.body;

    if (isNaN(empresaId)) {
      return res.status(400).json({
        success: false,
        error: 'ID da empresa deve ser um número válido'
      });
    }

    console.log('📝 Atualizando empresa:', empresaId);

    // Verificar se empresa existe
    const [empresaExistente] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.id, empresaId));

    if (!empresaExistente) {
      return res.status(404).json({
        success: false,
        error: 'Empresa não encontrada'
      });
    }

    // Verificar se CNPJ já existe em outra empresa
    if (cnpj && cnpj !== empresaExistente.cnpj) {
      const [existingCompany] = await db
        .select()
        .from(empresas)
        .where(eq(empresas.cnpj, cnpj));

      if (existingCompany) {
        return res.status(409).json({
          success: false,
          error: 'CNPJ já cadastrado em outra empresa'
        });
      }
    }

    // Atualizar empresa
    const [empresaAtualizada] = await db
      .update(empresas)
      .set({
        nome: nome || empresaExistente.nome,
        cnpj: cnpj || empresaExistente.cnpj,
        telefone: telefone !== undefined ? telefone : empresaExistente.telefone,
        emailContato: emailContato || empresaExistente.emailContato,
        endereco: endereco !== undefined ? endereco : empresaExistente.endereco,
        cidade: cidade !== undefined ? cidade : empresaExistente.cidade,
        estado: estado !== undefined ? estado : empresaExistente.estado,
        logo: logo !== undefined ? logo : empresaExistente.logo
      })
      .where(eq(empresas.id, empresaId))
      .returning();

    console.log('✅ Empresa atualizada com sucesso');

    res.json({
      success: true,
      data: empresaAtualizada,
      message: 'Empresa atualizada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE /api/empresas/:id - Deletar empresa
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = parseInt(id);

    if (isNaN(empresaId)) {
      return res.status(400).json({
        success: false,
        error: 'ID da empresa deve ser um número válido'
      });
    }

    console.log('🗑️ Deletando empresa:', empresaId);

    // Verificar se empresa tem contratos ou usuários vinculados
    const [contratosCount] = await db
      .select({ count: count() })
      .from(contratos)
      .where(eq(contratos.empresaId, empresaId));

    const [usuariosCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.companyId, empresaId));

    if (contratosCount.count > 0 || usuariosCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: `Não é possível deletar empresa. Existem ${contratosCount.count} contratos e ${usuariosCount.count} usuários vinculados.`
      });
    }

    // Deletar empresa
    const [empresaDeletada] = await db
      .delete(empresas)
      .where(eq(empresas.id, empresaId))
      .returning();

    if (!empresaDeletada) {
      return res.status(404).json({
        success: false,
        error: 'Empresa não encontrada'
      });
    }

    console.log('✅ Empresa deletada com sucesso');

    res.json({
      success: true,
      message: 'Empresa deletada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao deletar empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
import { Express, Request, Response } from 'express';
import { db } from '../db';
import { municipalManagers, municipalSchools, municipalPolicies, users } from '../../shared/schema';
import { eq, and, count, sum } from 'drizzle-orm';

export function registerMunicipalRoutes(app: Express) {
  
  // Middleware de autenticação para gestores municipais
  const authenticateMunicipal = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.session.user.role !== 'municipal_manager') {
      return res.status(403).json({ message: "Forbidden - Municipal Manager access required" });
    }
    
    next();
  };

  // GET /api/municipal/stats - Estatísticas do município
  app.get('/api/municipal/stats', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Buscar o gestor municipal
      const [manager] = await db
        .select()
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Estatísticas das escolas
      const schoolStats = await db
        .select({
          totalSchools: count(),
          totalAllocated: sum(municipalSchools.allocatedLicenses),
          totalUsed: sum(municipalSchools.usedLicenses),
        })
        .from(municipalSchools)
        .where(eq(municipalSchools.municipalManagerId, manager.id));

      // Contagem de escolas ativas
      const [activeSchoolsCount] = await db
        .select({ count: count() })
        .from(municipalSchools)
        .where(and(
          eq(municipalSchools.municipalManagerId, manager.id),
          eq(municipalSchools.status, 'active')
        ));

      // Estatísticas de usuários (seria calculado baseado nos usuários das escolas)
      const stats = {
        totalSchools: schoolStats[0]?.totalSchools || 0,
        activeSchools: activeSchoolsCount?.count || 0,
        totalLicenses: manager.totalLicenses,
        usedLicenses: manager.usedLicenses,
        totalUsers: 1623, // Mock para demonstração
        activeUsers: 1456, // Mock para demonstração
        monthlyTokenUsage: 847350, // Mock para demonstração
        tokenLimit: 1200000, // Mock para demonstração
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching municipal stats:', error);
      res.status(500).json({ error: 'Failed to fetch municipal stats' });
    }
  });

  // GET /api/municipal/schools - Listar escolas do município
  app.get('/api/municipal/schools', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Buscar o gestor municipal
      const [manager] = await db
        .select()
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Buscar todas as escolas do município
      const schools = await db
        .select()
        .from(municipalSchools)
        .where(eq(municipalSchools.municipalManagerId, manager.id));

      res.json(schools);
    } catch (error) {
      console.error('Error fetching schools:', error);
      res.status(500).json({ error: 'Failed to fetch schools' });
    }
  });

  // POST /api/municipal/schools - Cadastrar nova escola
  app.post('/api/municipal/schools', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const { 
        schoolName, 
        schoolCode, 
        inepCode, 
        address, 
        principalName, 
        principalEmail, 
        phone, 
        allocatedLicenses 
      } = req.body;

      // Buscar o gestor municipal
      const [manager] = await db
        .select()
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Verificar se há licenças disponíveis
      if (allocatedLicenses > (manager.totalLicenses - manager.usedLicenses)) {
        return res.status(400).json({ 
          message: "Insufficient licenses available" 
        });
      }

      // Criar nova escola
      const [newSchool] = await db
        .insert(municipalSchools)
        .values({
          municipalManagerId: manager.id,
          schoolName,
          schoolCode,
          inepCode,
          address,
          principalName,
          principalEmail,
          phone,
          allocatedLicenses,
          usedLicenses: 0,
          status: 'active',
        })
        .returning();

      // Atualizar licenças usadas pelo gestor municipal
      await db
        .update(municipalManagers)
        .set({ 
          usedLicenses: manager.usedLicenses + allocatedLicenses,
          updatedAt: new Date()
        })
        .where(eq(municipalManagers.id, manager.id));

      res.status(201).json(newSchool);
    } catch (error) {
      console.error('Error creating school:', error);
      res.status(500).json({ error: 'Failed to create school' });
    }
  });

  // PATCH /api/municipal/schools/:id - Atualizar escola
  app.patch('/api/municipal/schools/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const schoolId = parseInt(req.params.id);
      const updates = req.body;

      // Buscar o gestor municipal
      const [manager] = await db
        .select()
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Verificar se a escola pertence ao gestor
      const [school] = await db
        .select()
        .from(municipalSchools)
        .where(and(
          eq(municipalSchools.id, schoolId),
          eq(municipalSchools.municipalManagerId, manager.id)
        ));

      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      // Atualizar escola
      const [updatedSchool] = await db
        .update(municipalSchools)
        .set({ 
          ...updates, 
          updatedAt: new Date() 
        })
        .where(eq(municipalSchools.id, schoolId))
        .returning();

      res.json(updatedSchool);
    } catch (error) {
      console.error('Error updating school:', error);
      res.status(500).json({ error: 'Failed to update school' });
    }
  });

  // POST /api/municipal/schools/transfer-licenses - Transferir licenças entre escolas
  app.post('/api/municipal/schools/transfer-licenses', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const { sourceSchoolId, targetSchoolId, licenseCount } = req.body;

      // Buscar o gestor municipal
      const [manager] = await db
        .select()
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Buscar escolas de origem e destino
      const [sourceSchool] = await db
        .select()
        .from(municipalSchools)
        .where(and(
          eq(municipalSchools.id, sourceSchoolId),
          eq(municipalSchools.municipalManagerId, manager.id)
        ));

      const [targetSchool] = await db
        .select()
        .from(municipalSchools)
        .where(and(
          eq(municipalSchools.id, targetSchoolId),
          eq(municipalSchools.municipalManagerId, manager.id)
        ));

      if (!sourceSchool || !targetSchool) {
        return res.status(404).json({ message: "Schools not found" });
      }

      // Verificar se a escola de origem tem licenças suficientes disponíveis
      const availableLicenses = sourceSchool.allocatedLicenses - sourceSchool.usedLicenses;
      if (licenseCount > availableLicenses) {
        return res.status(400).json({ 
          message: "Insufficient licenses available in source school" 
        });
      }

      // Transferir licenças
      await db
        .update(municipalSchools)
        .set({ 
          allocatedLicenses: sourceSchool.allocatedLicenses - licenseCount,
          updatedAt: new Date()
        })
        .where(eq(municipalSchools.id, sourceSchoolId));

      await db
        .update(municipalSchools)
        .set({ 
          allocatedLicenses: targetSchool.allocatedLicenses + licenseCount,
          updatedAt: new Date()
        })
        .where(eq(municipalSchools.id, targetSchoolId));

      res.json({ 
        message: "Licenses transferred successfully",
        transfer: {
          from: sourceSchool.schoolName,
          to: targetSchool.schoolName,
          count: licenseCount
        }
      });
    } catch (error) {
      console.error('Error transferring licenses:', error);
      res.status(500).json({ error: 'Failed to transfer licenses' });
    }
  });

  // GET /api/municipal/policies - Listar políticas municipais
  app.get('/api/municipal/policies', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Buscar o gestor municipal
      const [manager] = await db
        .select()
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Buscar todas as políticas do município
      const policies = await db
        .select()
        .from(municipalPolicies)
        .where(eq(municipalPolicies.municipalManagerId, manager.id));

      res.json(policies);
    } catch (error) {
      console.error('Error fetching policies:', error);
      res.status(500).json({ error: 'Failed to fetch policies' });
    }
  });

  // POST /api/municipal/policies - Criar nova política
  app.post('/api/municipal/policies', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const { policyType, policyName, policyValue, description } = req.body;

      // Buscar o gestor municipal
      const [manager] = await db
        .select()
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Criar nova política
      const [newPolicy] = await db
        .insert(municipalPolicies)
        .values({
          municipalManagerId: manager.id,
          policyType,
          policyName,
          policyValue,
          description,
          isActive: true,
        })
        .returning();

      res.status(201).json(newPolicy);
    } catch (error) {
      console.error('Error creating policy:', error);
      res.status(500).json({ error: 'Failed to create policy' });
    }
  });

  // PATCH /api/municipal/policies/:id - Atualizar política
  app.patch('/api/municipal/policies/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const policyId = parseInt(req.params.id);
      const updates = req.body;

      // Buscar o gestor municipal
      const [manager] = await db
        .select()
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Verificar se a política pertence ao gestor
      const [policy] = await db
        .select()
        .from(municipalPolicies)
        .where(and(
          eq(municipalPolicies.id, policyId),
          eq(municipalPolicies.municipalManagerId, manager.id)
        ));

      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }

      // Atualizar política
      const [updatedPolicy] = await db
        .update(municipalPolicies)
        .set({ 
          ...updates, 
          updatedAt: new Date() 
        })
        .where(eq(municipalPolicies.id, policyId))
        .returning();

      res.json(updatedPolicy);
    } catch (error) {
      console.error('Error updating policy:', error);
      res.status(500).json({ error: 'Failed to update policy' });
    }
  });

  // GET /api/municipal/security-incidents - Incidentes de segurança (mock)
  app.get('/api/municipal/security-incidents', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      // Mock data para demonstração
      const incidents = [
        {
          id: 1,
          title: "Tentativa de acesso não autorizado",
          severity: "high",
          status: "investigating",
          affectedSchool: "EMEF Prof. João Silva",
          createdAt: "2025-06-30",
        },
        {
          id: 2,
          title: "Uso excessivo de tokens detectado",
          severity: "medium",
          status: "resolved",
          affectedSchool: "EMEI Pequenos Grandes",
          createdAt: "2025-06-29",
        },
      ];

      res.json(incidents);
    } catch (error) {
      console.error('Error fetching security incidents:', error);
      res.status(500).json({ error: 'Failed to fetch security incidents' });
    }
  });

  // GET /api/municipal/manager-info - Informações do gestor municipal
  app.get('/api/municipal/manager-info', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Buscar o gestor municipal com informações do usuário
      const [manager] = await db
        .select({
          id: municipalManagers.id,
          municipalityName: municipalManagers.municipalityName,
          municipalityCode: municipalManagers.municipalityCode,
          cnpj: municipalManagers.cnpj,
          address: municipalManagers.address,
          phone: municipalManagers.phone,
          totalLicenses: municipalManagers.totalLicenses,
          usedLicenses: municipalManagers.usedLicenses,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(municipalManagers)
        .innerJoin(users, eq(municipalManagers.userId, users.id))
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      res.json(manager);
    } catch (error) {
      console.error('Error fetching manager info:', error);
      res.status(500).json({ error: 'Failed to fetch manager info' });
    }
  });
}
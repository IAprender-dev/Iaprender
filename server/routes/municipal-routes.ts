import { Express, Request, Response } from 'express';
import { db } from '../db';
import { municipalManagers, municipalSchools, municipalPolicies, users, companies, contracts } from '../../shared/schema';
import { eq, and, count, sum, isNull, or } from 'drizzle-orm';
import { CognitoService } from '../utils/cognito-service';

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
        .select({
          id: municipalManagers.id,
          companyId: municipalManagers.companyId,
        })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      console.log('🔍 [STATS] Gestor municipal ID:', manager.id, ', Company ID:', manager.companyId);

      // Estatísticas das escolas da empresa
      const [schoolCounts] = await db
        .select({
          totalSchools: count(),
          totalStudents: sum(municipalSchools.numberOfStudents),
          totalTeachers: sum(municipalSchools.numberOfTeachers),
          totalClassrooms: sum(municipalSchools.numberOfClassrooms),
        })
        .from(municipalSchools)
        .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
        .where(eq(contracts.companyId, manager.companyId));

      // Contagem de escolas ativas
      const [activeSchoolsCount] = await db
        .select({ count: count() })
        .from(municipalSchools)
        .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
        .where(and(
          eq(contracts.companyId, manager.companyId),
          eq(municipalSchools.isActive, true)
        ));

      console.log('🔍 [STATS] Dados encontrados:', {
        totalSchools: schoolCounts?.totalSchools || 0,
        activeSchools: activeSchoolsCount?.count || 0,
        totalStudents: schoolCounts?.totalStudents || 0,
        totalTeachers: schoolCounts?.totalTeachers || 0
      });

      const stats = {
        totalSchools: schoolCounts?.totalSchools || 0,
        activeSchools: activeSchoolsCount?.count || 0,
        totalStudents: schoolCounts?.totalStudents || 0,
        totalTeachers: schoolCounts?.totalTeachers || 0,
        totalClassrooms: schoolCounts?.totalClassrooms || 0,
      };

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching municipal stats:', error);
      res.status(500).json({ error: 'Failed to fetch municipal stats' });
    }
  });

  // GET /api/municipal/schools/stats - Estatísticas específicas de escolas
  app.get('/api/municipal/schools/stats', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Buscar o gestor municipal
      const [manager] = await db
        .select({
          id: municipalManagers.id,
          companyId: municipalManagers.companyId,
        })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Estatísticas detalhadas das escolas
      const [schoolStats] = await db
        .select({
          totalSchools: count(),
          totalStudents: sum(municipalSchools.numberOfStudents),
          totalTeachers: sum(municipalSchools.numberOfTeachers),
          totalClassrooms: sum(municipalSchools.numberOfClassrooms),
        })
        .from(municipalSchools)
        .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
        .where(eq(contracts.companyId, manager.companyId));

      const [activeSchools] = await db
        .select({ count: count() })
        .from(municipalSchools)
        .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
        .where(and(
          eq(contracts.companyId, manager.companyId),
          eq(municipalSchools.isActive, true)
        ));

      const stats = {
        totalSchools: schoolStats?.totalSchools || 0,
        activeSchools: activeSchools?.count || 0,
        totalStudents: schoolStats?.totalStudents || 0,
        totalTeachers: schoolStats?.totalTeachers || 0,
        totalClassrooms: schoolStats?.totalClassrooms || 0,
      };

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching school stats:', error);
      res.status(500).json({ error: 'Failed to fetch school stats' });
    }
  });

  // GET /api/municipal/schools - Listar escolas do município
  app.get('/api/municipal/schools', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Buscar o gestor municipal
      const [manager] = await db
        .select({
          id: municipalManagers.id,
          companyId: municipalManagers.companyId,
        })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      console.log('🔍 [SCHOOLS] Gestor municipal ID:', manager.id, ', Company ID:', manager.companyId);

      // Buscar escolas da empresa com informações de contrato e diretor
      const schoolsData = await db
        .select({
          id: municipalSchools.id,
          name: municipalSchools.name,
          inep: municipalSchools.inep,
          cnpj: municipalSchools.cnpj,
          address: municipalSchools.address,
          neighborhood: municipalSchools.neighborhood,
          city: municipalSchools.city,
          state: municipalSchools.state,
          zipCode: municipalSchools.zipCode,
          phone: municipalSchools.phone,
          email: municipalSchools.email,
          foundationDate: municipalSchools.foundationDate,
          numberOfClassrooms: municipalSchools.numberOfClassrooms,
          numberOfStudents: municipalSchools.numberOfStudents,
          numberOfTeachers: municipalSchools.numberOfTeachers,
          zone: municipalSchools.zone,
          type: municipalSchools.type,
          status: municipalSchools.status,
          isActive: municipalSchools.isActive,
          createdAt: municipalSchools.createdAt,
          contractId: municipalSchools.contractId,
          contractName: contracts.name,
          contractStatus: contracts.status,
          companyName: companies.name,
          directorName: users.firstName,
          directorLastName: users.lastName,
          directorEmail: users.email,
        })
        .from(municipalSchools)
        .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
        .innerJoin(companies, eq(contracts.companyId, companies.id))
        .leftJoin(users, eq(municipalSchools.directorUserId, users.id))
        .where(eq(companies.id, manager.companyId));

      console.log('🔍 [SCHOOLS] Escolas encontradas:', schoolsData.length);

      // Formatar dados para frontend
      const formattedSchools = schoolsData.map(school => ({
        id: school.id,
        name: school.name,
        inep: school.inep,
        cnpj: school.cnpj,
        address: school.address,
        neighborhood: school.neighborhood,
        city: school.city,
        state: school.state,
        zipCode: school.zipCode,
        phone: school.phone,
        email: school.email,
        foundationDate: school.foundationDate,
        numberOfClassrooms: school.numberOfClassrooms,
        numberOfStudents: school.numberOfStudents,
        numberOfTeachers: school.numberOfTeachers,
        zone: school.zone,
        type: school.type,
        status: school.status,
        isActive: school.isActive,
        createdAt: school.createdAt,
        contractName: school.contractName,
        contractStatus: school.contractStatus,
        companyName: school.companyName,
        directorName: school.directorName ? `${school.directorName} ${school.directorLastName}` : null,
        directorEmail: school.directorEmail,
      }));

      res.json({ schools: formattedSchools });
    } catch (error) {
      console.error('Error fetching schools:', error);
      res.status(500).json({ error: 'Failed to fetch schools' });
    }
  });

  // POST /api/municipal/schools - Cadastrar nova escola com designação de diretor
  app.post('/api/municipal/schools', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const { 
        name,
        inep,
        cnpj,
        contractId,
        address,
        neighborhood,
        city,
        state,
        zipCode,
        phone,
        email,
        foundationDate,
        numberOfClassrooms,
        numberOfStudents,
        numberOfTeachers,
        zone,
        type,
        directorOption,
        existingDirectorId,
        directorData
      } = req.body;

      console.log('🔧 [SCHOOL_CREATE] Iniciando criação de escola:', { name, contractId, directorOption });

      // Buscar o gestor municipal
      const [manager] = await db
        .select({
          id: municipalManagers.id,
          companyId: municipalManagers.companyId,
        })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      console.log('🔧 [SCHOOL_CREATE] Gestor encontrado:', manager);

      // Validar contrato
      const [contract] = await db
        .select()
        .from(contracts)
        .where(and(
          eq(contracts.id, parseInt(contractId)),
          eq(contracts.companyId, manager.companyId)
        ));

      if (!contract) {
        return res.status(400).json({ message: "Invalid contract for this company" });
      }

      console.log('🔧 [SCHOOL_CREATE] Contrato validado:', contract.name);

      let directorUserId = null;
      let directorResult = null;

      // Processar designação do diretor
      if (directorOption === 'create' && directorData?.firstName && directorData?.lastName && directorData?.email) {
        console.log('🔧 [SCHOOL_CREATE] Criando novo diretor:', directorData);
        
        try {
          // Criar diretor no AWS Cognito
          const cognitoService = new CognitoService();
          const cognitoResult = await cognitoService.createUser({
            email: directorData.email,
            temporaryPassword: 'TempPass123!',
            group: 'Diretores',
            firstName: directorData.firstName,
            lastName: directorData.lastName,
            companyId: manager.companyId.toString(),
            contractId: contractId.toString()
          });

          console.log('🔧 [SCHOOL_CREATE] Diretor criado no Cognito:', cognitoResult.username);

          // Criar usuário local
          const [newDirector] = await db
            .insert(users)
            .values({
              firstName: directorData.firstName,
              lastName: directorData.lastName,
              email: directorData.email,
              role: 'diretor',
              cognitoUserId: cognitoResult.username,
              cognitoGroup: 'Diretores',
              cognitoStatus: 'CONFIRMED',
              companyId: manager.companyId,
              contractId: parseInt(contractId),
            })
            .returning();

          directorUserId = newDirector.id;
          directorResult = {
            type: 'created',
            director: newDirector,
            cognitoUsername: cognitoResult.username
          };

          console.log('🔧 [SCHOOL_CREATE] Diretor criado localmente:', newDirector.id);
        } catch (error) {
          console.error('❌ [SCHOOL_CREATE] Erro ao criar diretor:', error);
          return res.status(500).json({ 
            message: "Failed to create director", 
            error: error.message 
          });
        }
      } else if (directorOption === 'existing' && existingDirectorId) {
        console.log('🔧 [SCHOOL_CREATE] Vinculando diretor existente:', existingDirectorId);
        
        // Verificar se diretor existe e pertence à empresa
        const [existingDirector] = await db
          .select()
          .from(users)
          .where(and(
            eq(users.id, parseInt(existingDirectorId)),
            eq(users.companyId, manager.companyId),
            eq(users.role, 'diretor')
          ));

        if (!existingDirector) {
          return res.status(400).json({ message: "Invalid director selection" });
        }

        // Atualizar contrato do diretor se necessário
        if (existingDirector.contractId !== parseInt(contractId)) {
          await db
            .update(users)
            .set({ 
              contractId: parseInt(contractId),
              updatedAt: new Date()
            })
            .where(eq(users.id, parseInt(existingDirectorId)));

          console.log('🔧 [SCHOOL_CREATE] Contrato do diretor atualizado para:', contractId);
        }

        directorUserId = parseInt(existingDirectorId);
        directorResult = {
          type: 'linked',
          director: existingDirector
        };

        console.log('🔧 [SCHOOL_CREATE] Diretor existente vinculado:', directorUserId);
      }

      // Criar nova escola
      const [newSchool] = await db
        .insert(municipalSchools)
        .values({
          name,
          inep: inep || null,
          cnpj: cnpj || null,
          contractId: parseInt(contractId),
          address,
          neighborhood: neighborhood || null,
          city,
          state,
          zipCode: zipCode || null,
          phone: phone || null,
          email: email || null,
          foundationDate: foundationDate ? new Date(foundationDate) : null,
          numberOfClassrooms: parseInt(numberOfClassrooms) || 0,
          numberOfStudents: parseInt(numberOfStudents) || 0,
          numberOfTeachers: parseInt(numberOfTeachers) || 0,
          zone: zone || 'urban',
          type: type || 'municipal',
          directorUserId,
          status: 'active',
          isActive: true,
        })
        .returning();

      console.log('🔧 [SCHOOL_CREATE] Escola criada com sucesso:', newSchool.id);

      res.status(201).json({
        school: newSchool,
        director: directorResult,
        message: `Escola "${newSchool.name}" criada com sucesso!`
      });
    } catch (error) {
      console.error('❌ [SCHOOL_CREATE] Erro geral:', error);
      res.status(500).json({ 
        error: 'Failed to create school',
        details: error.message 
      });
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

  // GET /api/municipal/available-directors - Buscar diretores disponíveis
  app.get('/api/municipal/available-directors', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Buscar o gestor municipal para identificar a empresa
      const [manager] = await db
        .select({
          id: municipalManagers.id,
          companyId: municipalManagers.companyId,
        })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      console.log('🔍 [DIRECTORS] Gestor municipal ID:', manager.id, ', Company ID:', manager.companyId);

      // Buscar diretores da mesma empresa (disponíveis e já alocados)
      const directorsData = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          companyId: users.companyId,
          contractId: users.contractId,
        })
        .from(users)
        .where(and(
          eq(users.companyId, manager.companyId),
          eq(users.role, 'diretor')
        ));

      console.log('🔍 [DIRECTORS] Diretores encontrados:', directorsData.length);

      // Buscar informações de escola atual para cada diretor
      const directorsWithSchoolInfo = await Promise.all(
        directorsData.map(async (director) => {
          let currentSchool = null;
          
          // Verificar se diretor tem escola atual
          const [school] = await db
            .select({ name: municipalSchools.name })
            .from(municipalSchools)
            .where(eq(municipalSchools.directorUserId, director.id));
            
          if (school) {
            currentSchool = school.name;
          }

          return {
            ...director,
            currentSchool,
            isAvailable: !currentSchool
          };
        })
      );

      console.log('🔍 [DIRECTORS] Diretores com info de escola:', directorsWithSchoolInfo);

      res.json({
        directors: directorsWithSchoolInfo,
        total: directorsWithSchoolInfo.length,
        available: directorsWithSchoolInfo.filter(d => d.isAvailable).length
      });
    } catch (error) {
      console.error('Error fetching available directors:', error);
      res.status(500).json({ error: 'Failed to fetch available directors' });
    }
  });

  // GET /api/municipal/contracts/available - Buscar contratos disponíveis
  app.get('/api/municipal/contracts/available', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Buscar o gestor municipal
      const [manager] = await db
        .select({
          id: municipalManagers.id,
          companyId: municipalManagers.companyId,
        })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      console.log('🔍 [CONTRACTS] Gestor municipal ID:', manager.id, ', Company ID:', manager.companyId);

      // Buscar contratos da empresa do gestor municipal
      const contractsData = await db
        .select({
          id: contracts.id,
          name: contracts.name,
          description: contracts.description,
          status: contracts.status,
          maxUsers: contracts.maxUsers,
          startDate: contracts.startDate,
          endDate: contracts.endDate,
          companyId: contracts.companyId,
        })
        .from(contracts)
        .where(and(
          eq(contracts.companyId, manager.companyId),
          eq(contracts.status, 'active')
        ));

      console.log('🔍 [CONTRACTS] Contratos encontrados:', contractsData.length);

      // Contar quantas escolas usam cada contrato
      const contractsWithUsage = await Promise.all(
        contractsData.map(async (contract) => {
          const [usage] = await db
            .select({ count: count() })
            .from(municipalSchools)
            .where(eq(municipalSchools.contractId, contract.id));

          return {
            ...contract,
            usedBySchools: usage?.count?.toString() || '0'
          };
        })
      );

      console.log('🔍 [CONTRACTS] Contratos detalhes:', contractsWithUsage);

      res.json({
        contracts: contractsWithUsage
      });
    } catch (error) {
      console.error('Error fetching available contracts:', error);
      res.status(500).json({ error: 'Failed to fetch available contracts' });
    }
  });
}
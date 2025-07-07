import { Express, Request, Response } from 'express';
import { db } from '../db';
import { municipalManagers, municipalSchools, municipalPolicies, users, companies, contracts } from '../../shared/schema';
import { eq, and, count, sum, isNull, or, inArray } from 'drizzle-orm';
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

  // Helper function to get user's company info
  const getUserCompanyInfo = async (userId: number) => {
    const [user] = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        contractId: users.contractId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user || !user.companyId) {
      throw new Error("User company not found or not associated with a company");
    }
    
    return user;
  };

  // GET /api/municipal/stats - Estatísticas do município
  app.get('/api/municipal/stats', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Buscar informações da empresa do usuário
      const userCompany = await getUserCompanyInfo(userId);
      
      // Buscar o gestor municipal (se existir)
      const [manager] = await db
        .select({
          id: municipalManagers.id,
          municipalityName: municipalManagers.municipalityName,
          totalLicenses: municipalManagers.totalLicenses,
          usedLicenses: municipalManagers.usedLicenses,
        })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));

      console.log('🔍 [STATS] User company ID:', userCompany.companyId, ', Manager found:', !!manager);

      // Estatísticas das escolas relacionadas aos contratos da empresa
      let schoolCounts;
      let activeSchoolsCount;

      if (manager) {
        // Se tem municipal manager, usar o método antigo
        [schoolCounts] = await db
          .select({
            totalSchools: count(),
            totalStudents: sum(municipalSchools.numberOfStudents),
            totalTeachers: sum(municipalSchools.numberOfTeachers),
            totalClassrooms: sum(municipalSchools.numberOfClassrooms),
          })
          .from(municipalSchools)
          .where(eq(municipalSchools.municipalManagerId, manager.id));

        [activeSchoolsCount] = await db
          .select({ count: count() })
          .from(municipalSchools)
          .where(and(
            eq(municipalSchools.municipalManagerId, manager.id),
            eq(municipalSchools.status, 'active')
          ));
      } else {
        // Se não tem municipal manager, buscar por contratos da empresa
        [schoolCounts] = await db
          .select({
            totalSchools: count(),
            totalStudents: sum(municipalSchools.numberOfStudents),
            totalTeachers: sum(municipalSchools.numberOfTeachers),
            totalClassrooms: sum(municipalSchools.numberOfClassrooms),
          })
          .from(municipalSchools)
          .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
          .where(eq(contracts.companyId, userCompany.companyId));

        [activeSchoolsCount] = await db
          .select({ count: count() })
          .from(municipalSchools)
          .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
          .where(and(
            eq(contracts.companyId, userCompany.companyId),
            eq(municipalSchools.isActive, true)
          ));
      }

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
        totalLicenses: manager?.totalLicenses || 0,
        usedLicenses: manager?.usedLicenses || 0,
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
      
      // Buscar o gestor municipal (usando estrutura atual)
      const [manager] = await db
        .select({
          id: municipalManagers.id,
          municipalityName: municipalManagers.municipalityName,
        })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Estatísticas detalhadas das escolas (usando campos disponíveis)
      const [schoolStats] = await db
        .select({
          totalSchools: count(),
          totalStudents: sum(municipalSchools.numberOfStudents),
          totalTeachers: sum(municipalSchools.numberOfTeachers),
          totalClassrooms: sum(municipalSchools.numberOfClassrooms),
        })
        .from(municipalSchools)
        .where(eq(municipalSchools.municipalManagerId, manager.id));

      const [activeSchools] = await db
        .select({ count: count() })
        .from(municipalSchools)
        .where(and(
          eq(municipalSchools.municipalManagerId, manager.id),
          eq(municipalSchools.status, 'active')
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
      
      // Buscar o gestor municipal (usando estrutura atual)
      const [manager] = await db
        .select({
          id: municipalManagers.id,
          municipalityName: municipalManagers.municipalityName,
        })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      console.log('🔍 [SCHOOLS] Gestor municipal ID:', manager.id, ', Municipality:', manager.municipalityName);

      // Buscar escolas do gestor usando apenas campos básicos
      const schoolsData = await db
        .select()
        .from(municipalSchools)
        .where(eq(municipalSchools.municipalManagerId, manager.id));

      console.log('🔍 [SCHOOLS] Escolas encontradas:', schoolsData.length);

      // Para cada escola, buscar informações adicionais (contrato e diretor)
      const schoolsWithDetails = await Promise.all(
        schoolsData.map(async (school) => {
          let contractInfo = null;
          let directorInfo = null;

          // Buscar contrato se existir contract_id
          if (school.contractId) {
            try {
              const [contract] = await db
                .select({ 
                  name: contracts.name, 
                  description: contracts.description,
                  status: contracts.status 
                })
                .from(contracts)
                .where(eq(contracts.id, school.contractId));
              contractInfo = contract;
            } catch (err) {
              console.log('Contract not found for school:', school.id);
            }
          }

          // Buscar diretor se existir director_user_id
          if (school.directorUserId) {
            try {
              const [director] = await db
                .select({ 
                  firstName: users.firstName, 
                  lastName: users.lastName, 
                  email: users.email 
                })
                .from(users)
                .where(eq(users.id, school.directorUserId));
              directorInfo = director;
            } catch (err) {
              console.log('Director not found for school:', school.id);
            }
          }

          return {
            id: school.id,
            // Unificar campos com fallback para campos antigos
            name: school.name || school.schoolName,
            inep: school.inep || school.inepCode,
            cnpj: school.cnpj,
            address: school.address,
            neighborhood: school.neighborhood,
            city: school.city,
            state: school.state,
            zipCode: school.zipCode,
            phone: school.phone,
            email: school.email || school.principalEmail,
            foundationDate: school.foundationDate,
            numberOfClassrooms: school.numberOfClassrooms,
            numberOfStudents: school.numberOfStudents,
            numberOfTeachers: school.numberOfTeachers,
            zone: school.zone,
            type: school.type,
            status: school.status,
            isActive: school.isActive,
            createdAt: school.createdAt,
            // Campos antigos como fallback
            schoolCode: school.schoolCode,
            principalName: school.principalName,
            principalEmail: school.principalEmail,
            allocatedLicenses: school.allocatedLicenses,
            usedLicenses: school.usedLicenses,
            // Informações do contrato
            contractId: school.contractId,
            contractName: contractInfo?.name,
            contractDescription: contractInfo?.description,
            contractStatus: contractInfo?.status,
            // Informações do diretor
            directorUserId: school.directorUserId,
            directorName: directorInfo ? `${directorInfo.firstName} ${directorInfo.lastName}` : school.principalName,
            directorEmail: directorInfo?.email || school.principalEmail,
          };
        })
      );

      res.json({ schools: schoolsWithDetails });
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
      
      // Buscar informações da empresa do usuário
      const userCompany = await getUserCompanyInfo(userId);
      console.log('🔍 [DIRECTORS] User company ID:', userCompany.companyId);

      // Buscar diretores da mesma empresa
      const directorsData = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          companyId: users.companyId,
          contractId: users.contractId,
        })
        .from(users)
        .where(and(
          eq(users.role, 'school_director'),
          eq(users.companyId, userCompany.companyId)
        ));

      console.log('🔍 [DIRECTORS] Query SQL para diretores:', {
        role: 'school_director',
        companyId: userCompany.companyId,
        encontrados: directorsData.length
      });
      
      console.log('🔍 [DIRECTORS] Lista completa de diretores:', directorsData);

      console.log('🔍 [DIRECTORS] Diretores encontrados na empresa:', directorsData.length);

      // Buscar informações de escola atual para cada diretor
      const directorsWithSchoolInfo = await Promise.all(
        directorsData.map(async (director) => {
          let currentSchool = null;
          
          try {
            // Verificar se diretor tem escola atual (usando campo antigo primeiro)
            const [schoolOld] = await db
              .select({ name: municipalSchools.schoolName })
              .from(municipalSchools)
              .where(eq(municipalSchools.principalEmail, director.email));
              
            if (schoolOld) {
              currentSchool = schoolOld.name;
            } else {
              // Tentar com campo novo se existir
              const [schoolNew] = await db
                .select({ name: municipalSchools.name })
                .from(municipalSchools)
                .where(eq(municipalSchools.directorUserId, director.id));
                
              if (schoolNew) {
                currentSchool = schoolNew.name;
              }
            }
          } catch (err) {
            // Ignorar erros de campos inexistentes
            currentSchool = null;
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
      
      // Buscar informações da empresa do usuário
      const userCompany = await getUserCompanyInfo(userId);
      console.log('🔍 [CONTRACTS] User company ID:', userCompany.companyId);

      // Buscar contratos da empresa do usuário que estão ativos
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
          eq(contracts.companyId, userCompany.companyId),
          eq(contracts.status, 'active')
        ));

      console.log('🔍 [CONTRACTS] Contratos encontrados para empresa:', contractsData.length);

      // Para cada contrato, contar escolas que o utilizam
      const contractsWithUsage = await Promise.all(
        contractsData.map(async (contract) => {
          let usageCount = 0;
          try {
            const [usage] = await db
              .select({ count: count() })
              .from(municipalSchools)
              .where(eq(municipalSchools.contractId, contract.id));
            usageCount = usage?.count || 0;
          } catch (err) {
            usageCount = 0;
          }

          return {
            ...contract,
            usedBySchools: usageCount.toString(),
            description: contract.description || `Contrato para ${contract.name}`
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

  // GET /api/municipal/company/info - Informações da empresa do usuário logado
  app.get('/api/municipal/company/info', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const userCompany = await getUserCompanyInfo(userId);
      
      const [company] = await db
        .select({
          id: companies.id,
          name: companies.name,
          email: companies.email,
          phone: companies.phone,
          address: companies.address,
          cnpj: companies.cnpj,
          status: companies.status,
        })
        .from(companies)
        .where(eq(companies.id, userCompany.companyId));

      res.json({ 
        success: true, 
        company,
        user: {
          id: userCompany.id,
          email: userCompany.email,
          firstName: userCompany.firstName,
          lastName: userCompany.lastName,
          companyId: userCompany.companyId
        }
      });
    } catch (error) {
      console.error('Error fetching company info:', error);
      res.status(500).json({ error: 'Failed to fetch company information' });
    }
  });

  // GET /api/municipal/contracts/filtered - Contratos da empresa do usuário logado
  app.get('/api/municipal/contracts/filtered', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const userCompany = await getUserCompanyInfo(userId);
      
      const contractsList = await db
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
        .where(eq(contracts.companyId, userCompany.companyId));

      console.log(`🔍 [CONTRACTS] Empresa ${userCompany.companyId}: ${contractsList.length} contratos encontrados`);

      res.json({ success: true, contracts: contractsList });
    } catch (error) {
      console.error('Error fetching contracts:', error);
      res.status(500).json({ error: 'Failed to fetch contracts' });
    }
  });

  // GET /api/municipal/directors/filtered - Diretores da empresa do usuário logado
  app.get('/api/municipal/directors/filtered', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const userCompany = await getUserCompanyInfo(userId);
      
      const directorsList = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          companyId: users.companyId,
          contractId: users.contractId,
          status: users.status,
        })
        .from(users)
        .where(and(
          eq(users.companyId, userCompany.companyId),
          eq(users.role, 'school_director')
        ));

      // Buscar informações dos contratos para cada diretor
      const contractIds = directorsList
        .map(d => d.contractId)
        .filter(id => id !== null) as number[];

      let contractsInfo: any[] = [];
      if (contractIds.length > 0) {
        contractsInfo = await db
          .select({
            id: contracts.id,
            name: contracts.name,
          })
          .from(contracts)
          .where(inArray(contracts.id, contractIds));
      }

      const directorsWithContracts = directorsList.map(director => ({
        ...director,
        contractName: director.contractId 
          ? contractsInfo.find(c => c.id === director.contractId)?.name || null
          : null,
      }));

      console.log(`🔍 [DIRECTORS] Empresa ${userCompany.companyId}: ${directorsWithContracts.length} diretores encontrados`);

      res.json({ success: true, directors: directorsWithContracts });
    } catch (error) {
      console.error('Error fetching directors:', error);
      res.status(500).json({ error: 'Failed to fetch directors' });
    }
  });

  // GET /api/municipal/schools/filtered - Escolas da empresa do usuário logado
  app.get('/api/municipal/schools/filtered', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const userCompany = await getUserCompanyInfo(userId);
      
      const schoolsList = await db
        .select({
          id: municipalSchools.id,
          name: municipalSchools.name,
          inep: municipalSchools.inep,
          cnpj: municipalSchools.cnpj,
          address: municipalSchools.address,
          city: municipalSchools.city,
          state: municipalSchools.state,
          numberOfStudents: municipalSchools.numberOfStudents,
          numberOfTeachers: municipalSchools.numberOfTeachers,
          status: municipalSchools.status,
          contractId: municipalSchools.contractId,
          directorId: municipalSchools.directorId,
          createdAt: municipalSchools.createdAt,
        })
        .from(municipalSchools)
        .where(eq(municipalSchools.companyId, userCompany.companyId));

      // Buscar informações dos contratos e diretores
      const contractIds = [...new Set(schoolsList.map(s => s.contractId).filter(id => id !== null))] as number[];
      const directorIds = [...new Set(schoolsList.map(s => s.directorUserId).filter(id => id !== null))] as number[];

      let contractsInfo: any[] = [];
      let directorsInfo: any[] = [];

      if (contractIds.length > 0) {
        contractsInfo = await db
          .select({
            id: contracts.id,
            name: contracts.name,
            status: contracts.status,
          })
          .from(contracts)
          .where(inArray(contracts.id, contractIds));
      }

      if (directorIds.length > 0) {
        directorsInfo = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(inArray(users.id, directorIds));
      }

      const schoolsWithDetails = schoolsList.map(school => ({
        ...school,
        isActive: school.status === 'active',
        contractName: school.contractId 
          ? contractsInfo.find(c => c.id === school.contractId)?.name || 'Contrato não encontrado'
          : 'Sem contrato',
        contractStatus: school.contractId 
          ? contractsInfo.find(c => c.id === school.contractId)?.status || 'unknown'
          : 'none',
        directorName: school.directorUserId 
          ? `${directorsInfo.find(d => d.id === school.directorUserId)?.firstName || ''} ${directorsInfo.find(d => d.id === school.directorUserId)?.lastName || ''}`.trim() || 'Diretor não encontrado'
          : null,
        directorEmail: school.directorUserId 
          ? directorsInfo.find(d => d.id === school.directorUserId)?.email || null
          : null,
      }));

      console.log(`🔍 [SCHOOLS] Empresa ${userCompany.companyId}: ${schoolsWithDetails.length} escolas encontradas`);

      res.json({ success: true, schools: schoolsWithDetails });
    } catch (error) {
      console.error('Error fetching schools:', error);
      res.status(500).json({ error: 'Failed to fetch schools' });
    }
  });

  // POST /api/municipal/schools/create - Criar nova escola
  app.post('/api/municipal/schools/create', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const userCompany = await getUserCompanyInfo(userId);
      
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
        existingDirectorId,
      } = req.body;

      console.log('🔧 [CREATE-SCHOOL] Dados recebidos:', { name, contractId, existingDirectorId, companyId: userCompany.companyId });

      // Validar campos obrigatórios
      if (!name || !contractId || !address) {
        return res.status(400).json({ error: 'Name, contract, and address are required' });
      }

      // Verificar se o contrato pertence à empresa do usuário
      const [contract] = await db
        .select({ id: contracts.id })
        .from(contracts)
        .where(and(
          eq(contracts.id, contractId),
          eq(contracts.companyId, userCompany.companyId)
        ));

      if (!contract) {
        return res.status(400).json({ error: 'Contract not found or does not belong to your company' });
      }

      // Se diretor foi especificado, verificar se pertence à empresa
      if (existingDirectorId) {
        const [director] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(
            eq(users.id, existingDirectorId),
            eq(users.companyId, userCompany.companyId),
            eq(users.role, 'school_director')
          ));

        if (!director) {
          return res.status(400).json({ error: 'Director not found or does not belong to your company' });
        }
      }

      // Buscar municipalManagerId do usuário logado
      const [municipalManager] = await db
        .select({ id: municipalManagers.id })
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));

      if (!municipalManager) {
        return res.status(400).json({ error: 'Municipal manager not found for current user' });
      }

      // Criar a escola
      const [newSchool] = await db
        .insert(municipalSchools)
        .values({
          name,
          inep: inep || null,
          cnpj: cnpj || null,
          municipalManagerId: municipalManager.id,
          contractId,
          address,
          neighborhood: neighborhood || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          phone: phone || null,
          email: email || null,
          foundationDate: foundationDate ? new Date(foundationDate) : null,
          numberOfClassrooms: numberOfClassrooms || 0,
          numberOfStudents: numberOfStudents || 0,
          numberOfTeachers: numberOfTeachers || 0,
          zone: zone || 'urbana',
          type: type || 'municipal',
          status: 'active',
          directorUserId: existingDirectorId || null,
        })
        .returning();

      console.log('✅ [CREATE-SCHOOL] Escola criada:', newSchool.id, 'para empresa:', userCompany.companyId);

      res.json({ success: true, school: newSchool });
    } catch (error) {
      console.error('❌ [CREATE-SCHOOL] Erro ao criar escola:', error);
      res.status(500).json({ error: 'Failed to create school' });
    }
  });

}
import { Express, Request, Response } from 'express';
import { db } from '../db';
import { municipalManagers, municipalSchools, municipalPolicies, users, companies, contracts, schools } from '../../shared/schema';
import { eq, count, sum, isNull, or, inArray, isNotNull, and } from 'drizzle-orm';
import { performanceMonitor, performanceMiddleware } from '../utils/performance-monitor';
import { CognitoService } from '../utils/cognito-service';
import { CacheManager } from '../utils/cache-manager';

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

  // FUNÇÃO CENTRAL: Obter empresa do usuário logado (OTIMIZADA)
  async function getUserCompany(userId: number): Promise<number | null> {
    try {
      // Cache para evitar consultas repetidas
      const cacheKey = `user-company-${userId}`;
      const cached = CacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await db
        .select({ companyId: users.companyId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const companyId = result[0]?.companyId;
      
      if (!companyId) {
        console.log(`⚠️ User ${userId} sem empresa vinculada`);
        return null;
      }
      
      // Cache por 5 minutos
      CacheManager.set(cacheKey, companyId, 300);
      console.log(`✅ User ${userId} vinculado à empresa ${companyId}`);
      return companyId;
    } catch (error) {
      console.error(`❌ Erro ao buscar empresa do usuário ${userId}:`, error);
      return null;
    }
  }

  // Helper function to get user's company info
  const getUserCompanyInfo = async (userId: number) => {
    const [user] = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        contractId: users.contractId,
        email: users.email,
        firstName: users.first_name,
        lastName: users.last_name,
      })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user || !user.companyId) {
      throw new Error("User company not found or not associated with a company");
    }
    
    return user;
  };

  // GET /api/municipal/stats - Estatísticas do município (OTIMIZADO)
  app.get('/api/municipal/stats', authenticateMunicipal, performanceMiddleware('/api/municipal/stats'), async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Cache para estatísticas (30 segundos)
      const cacheKey = `municipal-stats-${userId}`;
      const cached = CacheManager.get(cacheKey);
      if (cached) {
        return res.json({ success: true, stats: cached });
      }
      
      // 1. Obter empresa do usuário logado
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        const emptyStats = { totalContracts: 0, totalSchools: 0, activeSchools: 0, totalStudents: 0, totalTeachers: 0, totalClassrooms: 0 };
        return res.json({ success: true, stats: emptyStats });
      }
      
      // 2. Buscar estatísticas APENAS da empresa do usuário (QUERY ÚNICA OTIMIZADA)
      const statsQuery = await db
        .select({
          totalContracts: count(contracts.id),
          totalSchools: count(municipalSchools.id),
          activeSchools: count(municipalSchools.id),
          totalStudents: sum(municipalSchools.numberOfStudents),
          totalTeachers: sum(municipalSchools.numberOfTeachers),
          totalClassrooms: sum(municipalSchools.numberOfClassrooms),
        })
        .from(contracts)
        .leftJoin(municipalSchools, eq(municipalSchools.contractId, contracts.id))
        .where(eq(contracts.companyId, userCompanyId));
      
      const stats = {
        totalContracts: Number(statsQuery[0]?.totalContracts || 0),
        totalSchools: Number(statsQuery[0]?.totalSchools || 0),
        activeSchools: Number(statsQuery[0]?.activeSchools || 0),
        totalStudents: Number(statsQuery[0]?.totalStudents || 0),
        totalTeachers: Number(statsQuery[0]?.totalTeachers || 0),
        totalClassrooms: Number(statsQuery[0]?.totalClassrooms || 0)
      };
      
      // Cache por 30 segundos
      CacheManager.set(cacheKey, stats, 30);
      
      console.log(`✅ [STATS] User ${userId} empresa ${userCompanyId}:`, stats);
      return res.json({ success: true, stats });
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
        .where(eq(municipalSchools.municipalManagerId, manager.id));

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
                  firstName: users.first_name, 
                  lastName: users.last_name, 
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
        .where(eq(contracts.id, parseInt(contractId)));

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
              first_name: directorData.firstName,
              last_name: directorData.lastName,
              email: directorData.email,
              role: 'school_director',
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
          .where(eq(users.id, parseInt(existingDirectorId)));

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
        .where(eq(
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
        .where(eq(
          eq(municipalSchools.id, sourceSchoolId),
          eq(municipalSchools.municipalManagerId, manager.id)
        ));

      const [targetSchool] = await db
        .select()
        .from(municipalSchools)
        .where(eq(
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
        .where(eq(
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
          firstName: users.first_name,
          lastName: users.last_name,
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
          firstName: users.first_name,
          lastName: users.last_name,
          email: users.email,
          role: users.role,
          companyId: users.companyId,
          contractId: users.contractId,
        })
        .from(users)
        .where(eq(
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
        .where(eq(
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

  // GET /api/municipal/contracts/filtered - Contratos filtrados por empresa do usuário (OTIMIZADO)
  app.get('/api/municipal/contracts/filtered', authenticateMunicipal, performanceMiddleware('/api/municipal/contracts/filtered'), async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Cache para contratos
      const cacheKey = `contracts-filtered-${userId}`;
      const cached = CacheManager.get(cacheKey);
      if (cached) {
        return res.json({ success: true, contracts: cached });
      }
      
      // 1. Obter empresa do usuário logado
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.json({ success: true, contracts: [] });
      }
      
      // 2. Buscar APENAS contratos da empresa do usuário com JOIN para empresas
      const contractsList = await db
        .select({
          id: contracts.id,
          name: contracts.name,
          description: contracts.description,
          status: contracts.status,
          startDate: contracts.startDate,
          endDate: contracts.endDate,
          companyId: contracts.companyId,
          companyName: companies.name,
          createdAt: contracts.createdAt,
          updatedAt: contracts.updatedAt,
        })
        .from(contracts)
        .innerJoin(companies, eq(contracts.companyId, companies.id))
        .where(eq(contracts.companyId, userCompanyId))
        .limit(50);

      // Cache por 60 segundos
      CacheManager.set(cacheKey, contractsList, 60);
      
      console.log(`🔍 [CONTRACTS] User ${userId} empresa ${userCompanyId}: ${contractsList.length} contratos`);
      res.json({ success: true, contracts: contractsList });
    } catch (error) {
      console.error('Error fetching contracts:', error);
      res.json({ success: true, contracts: [] });
    }
  });

  // GET /api/municipal/directors/filtered - Diretores filtrados por empresa do usuário
  app.get('/api/municipal/directors/filtered', authenticateMunicipal, performanceMiddleware('directors-filtered'), async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Cache para diretores
      const cacheKey = `directors-filtered-${userId}`;
      const cached = CacheManager.get(cacheKey);
      if (cached) {
        return res.json({ success: true, directors: cached });
      }
      
      // 1. Obter empresa do usuário logado
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.json({ success: true, directors: [] });
      }
      
      // 2. Buscar APENAS diretores da mesma empresa
      const directorsList = await db
        .select()
        .from(users)
        .where(eq(
          eq(users.company_id, userCompanyId),
          eq(users.cognito_group, 'Diretores')
        ))
        .limit(30);

      // Buscar informações dos contratos separadamente
      const contractIds = directorsList
        .map(director => director.contract_id)
        .filter(id => id !== null);

      let contractsData = [];
      if (contractIds.length > 0) {
        contractsData = await db
          .select()
          .from(contracts)
          .where(inArray(contracts.id, contractIds));
      }

      // Combinar dados
      const formattedDirectors = directorsList.map(director => {
        const contract = contractsData.find(c => c.id === director.contract_id);
        return {
          id: director.id,
          firstName: director.first_name,
          lastName: director.last_name,
          email: director.email,
          companyId: director.company_id,
          contractId: director.contract_id,
          contractName: contract?.name || null,
          contractStatus: contract?.status || null
        };
      });

      // Cache por 60 segundos
      CacheManager.set(cacheKey, formattedDirectors, 60);

      console.log(`🔍 [DIRECTORS] User ${userId} empresa ${userCompanyId}: ${formattedDirectors.length} diretores`);
      res.json({ success: true, directors: formattedDirectors });
    } catch (error) {
      console.error('Error fetching directors:', error);
      res.json({ success: true, directors: [] });
    }
  });

  // GET /api/municipal/schools/filtered - Escolas filtradas por empresa do usuário
  app.get('/api/municipal/schools/filtered', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // 1. Obter empresa do usuário logado
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.json({ success: true, schools: [] });
      }
      
      // Cache para escolas
      const cacheKey = `schools-filtered-${userId}`;
      const cached = CacheManager.get(cacheKey);
      if (cached) {
        return res.json({ success: true, schools: cached });
      }
      
      // 2. Buscar escolas da empresa do usuário através de consulta simples
      const schoolsRaw = await db
        .select()
        .from(schools)
        .limit(30);

      // 3. Filtrar escolas por contratos da empresa
      const companyContracts = await db
        .select()
        .from(contracts)
        .where(eq(contracts.company_id, userCompanyId));

      const contractIds = companyContracts.map(c => c.id);
      const filteredSchools = schoolsRaw.filter(school => 
        contractIds.includes(school.contract_id)
      );

      // 4. Buscar informações dos diretores para as escolas filtradas
      const directorIds = filteredSchools
        .map(school => school.director_id)
        .filter(id => id !== null);

      let directorsData = [];
      if (directorIds.length > 0) {
        directorsData = await db
          .select()
          .from(users)
          .where(inArray(users.id, directorIds));
      }

      // 5. Combinar dados
      const schoolsWithContracts = filteredSchools.map(school => {
        const contract = companyContracts.find(c => c.id === school.contract_id);
        const director = directorsData.find(d => d.id === school.director_id);
        
        return {
          id: school.id,
          name: school.name,
          inep: school.inep,
          cnpj: school.cnpj,
          address: school.address,
          city: school.city,
          state: school.state,
          numberOfStudents: school.number_of_students,
          numberOfTeachers: school.number_of_teachers,
          numberOfClassrooms: school.number_of_classrooms,
          status: school.status,
          contractId: school.contract_id,
          directorId: school.director_id,
          contractName: contract?.name || null,
          directorFirstName: director?.first_name || null,
          directorLastName: director?.last_name || null,
          directorEmail: director?.email || null
        };
      });

      // Cache por 60 segundos
      CacheManager.set(cacheKey, schoolsWithContracts, 60);

      console.log(`🔍 [SCHOOLS] User ${userId} empresa ${userCompanyId}: ${schoolsWithContracts.length} escolas`);
      res.json({ success: true, schools: schoolsWithContracts });
    } catch (error) {
      console.error('Error fetching schools:', error);
      res.json({ success: true, schools: [] });
    }
  });

  // PATCH /api/municipal/schools/:id - Editar escola existente
  app.patch('/api/municipal/schools/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.id);
      const userId = req.session.user!.id;
      
      // Verificar se usuário tem acesso à empresa
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.status(403).json({ error: 'Usuário sem empresa vinculada' });
      }

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

      console.log('🔧 [UPDATE-SCHOOL] Dados recebidos:', { schoolId, name, contractId, existingDirectorId });

      // Verificar se a escola pertence à empresa do usuário
      const schoolCheck = await db
        .select({ contractId: schools.contract_id })
        .from(schools)
        .innerJoin(contracts, eq(schools.contract_id, contracts.id))
        .where(eq(
          eq(schools.id, schoolId),
          eq(contracts.company_id, userCompanyId)
        ))
        .limit(1);

      if (!schoolCheck.length) {
        return res.status(404).json({ error: 'Escola não encontrada ou acesso negado' });
      }

      // Atualizar dados da escola
      const updateData: any = {
        name: name,
        inep: inep,
        cnpj: cnpj,
        address: address,
        city: city,
        state: state,
        number_of_students: numberOfStudents,
        number_of_teachers: numberOfTeachers,
        number_of_classrooms: numberOfClassrooms,
        updated_at: new Date(),
      };

      // Adicionar campos opcionais se fornecidos
      if (contractId && contractId !== 'none') updateData.contract_id = parseInt(contractId);
      if (existingDirectorId && existingDirectorId !== 'none') updateData.director_id = parseInt(existingDirectorId);

      await db
        .update(schools)
        .set(updateData)
        .where(eq(schools.id, schoolId));

      console.log('✅ [UPDATE-SCHOOL] Escola atualizada:', schoolId);
      
      // Invalidar caches relacionados
      CacheManager.invalidateUserCache(userId);
      if (userCompanyId) {
        CacheManager.invalidateCompanyCache(userCompanyId);
      }
      
      res.json({ success: true, message: 'Escola atualizada com sucesso' });
    } catch (error) {
      console.error('Error updating school:', error);
      res.status(500).json({ error: 'Erro ao atualizar escola' });
    }
  });

  // PATCH /api/municipal/directors/:id - Editar diretor existente
  app.patch('/api/municipal/directors/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const directorId = parseInt(req.params.id);
      const userId = req.session.user!.id;
      
      // Verificar se usuário tem acesso à empresa
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.status(403).json({ error: 'Usuário sem empresa vinculada' });
      }

      const { firstName, lastName, email, contractId } = req.body;

      console.log('🔧 [UPDATE-DIRECTOR] Dados recebidos:', { directorId, firstName, lastName, email, contractId });

      // Verificar se o diretor pertence à mesma empresa do usuário
      const directorCheck = await db
        .select({ companyId: users.companyId })
        .from(users)
        .where(eq(
          eq(users.id, directorId),
          eq(users.companyId, userCompanyId),
          eq(users.role, 'school_director')
        ))
        .limit(1);

      if (!directorCheck.length) {
        return res.status(404).json({ error: 'Diretor não encontrado ou acesso negado' });
      }

      // Atualizar dados do diretor
      const updateData: any = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        updatedAt: new Date(),
      };

      // Adicionar contractId se fornecido
      if (contractId && contractId !== 'none') {
        updateData.contractId = parseInt(contractId);
      } else {
        updateData.contractId = null;
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, directorId));

      console.log('✅ [UPDATE-DIRECTOR] Diretor atualizado:', directorId);
      res.json({ success: true, message: 'Diretor atualizado com sucesso' });
    } catch (error) {
      console.error('Error updating director:', error);
      res.status(500).json({ error: 'Erro ao atualizar diretor' });
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
        .where(eq(
          eq(contracts.id, contractId),
          eq(contracts.company_id, userCompany.companyId)
        ));

      if (!contract) {
        return res.status(400).json({ error: 'Contract not found or does not belong to your company' });
      }

      // Se diretor foi especificado, verificar se pertence à empresa
      if (existingDirectorId) {
        const [director] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(
            eq(users.id, existingDirectorId),
            eq(users.company_id, userCompany.companyId),
            eq(users.cognito_group, 'Diretores')
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

      // Criar a escola na tabela schools padrão do sistema
      const [newSchool] = await db
        .insert(schools)
        .values({
          name,
          inep: inep || null,
          cnpj: cnpj || null,
          company_id: userCompany.companyId,
          contract_id: contractId,
          address,
          city: city || null,
          state: state || null,
          number_of_students: numberOfStudents || 0,
          number_of_teachers: numberOfTeachers || 0,
          number_of_classrooms: numberOfClassrooms || 0,
          status: 'active',
          is_active: true,
          director_id: existingDirectorId || null,
        })
        .returning();

      console.log('✅ [CREATE-SCHOOL] Escola criada:', newSchool.id, 'para empresa:', userCompany.companyId);

      // Invalidar caches relacionados
      CacheManager.invalidateUserCache(userId);
      CacheManager.invalidateCompanyCache(userCompany.companyId);

      res.json({ success: true, school: newSchool });
    } catch (error) {
      console.error('❌ [CREATE-SCHOOL] Erro ao criar escola:', error);
      res.status(500).json({ error: 'Failed to create school' });
    }
  });

  // PATCH /api/municipal/schools/:id - Editar escola
  app.patch('/api/municipal/schools/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const schoolId = parseInt(req.params.id);
      const updateData = req.body;

      console.log('🔧 [SCHOOL_EDIT] Iniciando edição de escola:', { schoolId, updateData });

      // Buscar informações da empresa do usuário
      const userCompany = await getUserCompanyInfo(userId);

      // Verificar se a escola pertence à empresa do gestor
      const [existingSchool] = await db
        .select()
        .from(municipalSchools)
        .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
        .where(eq(
          eq(municipalSchools.id, schoolId),
          eq(contracts.companyId, userCompany.companyId)
        ));

      if (!existingSchool) {
        return res.status(404).json({ message: "School not found or not accessible" });
      }

      // Validar contrato se fornecido
      if (updateData.contractId) {
        const [contract] = await db
          .select()
          .from(contracts)
          .where(eq(
            eq(contracts.id, parseInt(updateData.contractId)),
            eq(contracts.companyId, userCompany.companyId)
          ));

        if (!contract) {
          return res.status(400).json({ message: "Invalid contract for this company" });
        }
      }

      // Preparar dados para atualização
      const updateFields: any = {
        updatedAt: new Date()
      };

      // Mapear campos recebidos para campos do banco
      if (updateData.name !== undefined) updateFields.schoolName = updateData.name;
      if (updateData.inep !== undefined) updateFields.inepCode = updateData.inep;
      if (updateData.cnpj !== undefined) updateFields.cnpj = updateData.cnpj;
      if (updateData.contractId !== undefined) updateFields.contractId = parseInt(updateData.contractId);
      if (updateData.address !== undefined) updateFields.address = updateData.address;
      if (updateData.neighborhood !== undefined) updateFields.neighborhood = updateData.neighborhood;
      if (updateData.city !== undefined) updateFields.city = updateData.city;
      if (updateData.state !== undefined) updateFields.state = updateData.state;
      if (updateData.zipCode !== undefined) updateFields.zipCode = updateData.zipCode;
      if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
      if (updateData.email !== undefined) updateFields.email = updateData.email;
      if (updateData.foundationDate !== undefined) updateFields.foundationDate = updateData.foundationDate ? new Date(updateData.foundationDate) : null;
      if (updateData.numberOfClassrooms !== undefined) updateFields.numberOfClassrooms = updateData.numberOfClassrooms;
      if (updateData.numberOfStudents !== undefined) updateFields.numberOfStudents = updateData.numberOfStudents;
      if (updateData.numberOfTeachers !== undefined) updateFields.numberOfTeachers = updateData.numberOfTeachers;
      if (updateData.zone !== undefined) updateFields.zone = updateData.zone;
      if (updateData.type !== undefined) updateFields.type = updateData.type;
      if (updateData.existingDirectorId !== undefined) updateFields.directorUserId = updateData.existingDirectorId ? parseInt(updateData.existingDirectorId) : null;

      // Atualizar no banco de dados
      const [updatedSchool] = await db
        .update(municipalSchools)
        .set(updateFields)
        .where(eq(municipalSchools.id, schoolId))
        .returning();

      console.log('✅ [SCHOOL_EDIT] Escola atualizada:', updatedSchool.id);

      // Invalidar caches relacionados
      CacheManager.invalidateUserCache(userId);
      CacheManager.invalidateCompanyCache(userCompany.companyId);

      res.json({ 
        success: true,
        message: "School updated successfully",
        school: updatedSchool
      });

    } catch (error) {
      console.error('❌ [SCHOOL_EDIT] Erro ao atualizar escola:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update school", 
        error: error.message 
      });
    }
  });

  // PATCH /api/municipal/directors/:id - Editar dados do diretor
  app.patch('/api/municipal/directors/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const directorId = parseInt(req.params.id);
      const { firstName, lastName, email, contractId } = req.body;

      const userId = req.session.user!.id;
      console.log(`🔍 [EDIT-DIRECTOR] Editando diretor ID: ${directorId} para usuário: ${userId}`);

      // Validação dos dados obrigatórios
      if (!firstName || !lastName || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nome, sobrenome e email são obrigatórios'
        });
      }

      // Buscar o gestor municipal para verificar a empresa
      const [manager] = await db
        .select()
        .from(municipalManagers)
        .where(eq(municipalManagers.userId, userId));
        
      if (!manager) {
        return res.status(404).json({ message: "Municipal manager not found" });
      }

      // Verificar se o diretor existe e pertence à empresa do usuário
      const [existingDirector] = await db.select()
        .from(users)
        .where(eq(
          eq(users.id, directorId),
          eq(users.companyId, manager.companyId),
          eq(users.role, 'school_director')
        ));

      if (!existingDirector) {
        return res.status(404).json({
          success: false,
          message: 'Diretor não encontrado ou sem permissão para editar'
        });
      }

      // Verificar se o email já está em uso por outro usuário
      if (email !== existingDirector.email) {
        const [emailExists] = await db.select()
          .from(users)
          .where(eq(
            eq(users.email, email),
            ne(users.id, directorId)
          ));

        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Este email já está sendo usado por outro usuário'
          });
        }
      }

      // Verificar se o contrato existe e pertence à empresa (se fornecido)
      if (contractId) {
        const [contractExists] = await db.select()
          .from(contracts)
          .where(eq(
            eq(contracts.id, contractId),
            eq(contracts.companyId, manager.companyId)
          ));

        if (!contractExists) {
          return res.status(400).json({
            success: false,
            message: 'Contrato não encontrado ou não pertence à sua empresa'
          });
        }
      }

      // Atualizar dados do diretor
      const [updatedDirector] = await db.update(users)
        .set({
          first_name: firstName,
          last_name: lastName,
          email,
          contractId: contractId ? contractId : null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, directorId))
        .returning();

      console.log(`✅ [EDIT-DIRECTOR] Diretor atualizado: ${firstName} ${lastName} (${email})`);

      // Invalidar cache relacionado
      CacheManager.invalidateUserCache(userId);
      CacheManager.invalidateUserCache(directorId);

      res.status(200).json({
        success: true,
        message: 'Diretor atualizado com sucesso',
        director: updatedDirector
      });

    } catch (error) {
      console.error('❌ [EDIT-DIRECTOR] Erro:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // DELETE /api/municipal/schools/:id - Deletar escola (OTIMIZADA)
  app.delete('/api/municipal/schools/:id', authenticateMunicipal, performanceMiddleware('/api/municipal/schools/:id'), async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const userCompanyId = await getUserCompany(userId);
      const schoolId = parseInt(req.params.id);
      
      if (!userCompanyId) {
        return res.status(403).json({ error: 'User not associated with any company' });
      }

      // Verificar se a escola pertence à empresa do usuário
      const [existingSchool] = await db
        .select()
        .from(municipalSchools)
        .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
        .where(
          eq(
            eq(municipalSchools.id, schoolId),
            eq(contracts.companyId, userCompanyId)
          )
        );

      if (!existingSchool) {
        return res.status(404).json({ error: 'School not found or access denied' });
      }

      // Deletar escola
      await db
        .delete(municipalSchools)
        .where(eq(municipalSchools.id, schoolId));

      // Invalidar caches relacionados
      CacheManager.invalidateUserCache(userId);
      CacheManager.invalidateCompanyCache(userCompanyId);

      console.log(`✅ [DELETE-SCHOOL] Escola ${schoolId} deletada por usuário ${userId}`);
      res.json({ success: true, message: 'School deleted successfully' });
    } catch (error) {
      console.error('Error deleting school:', error);
      res.status(500).json({ error: 'Failed to delete school' });
    }
  });

  // DELETE /api/municipal/contracts/:id - Deletar contrato (OTIMIZADA)
  app.delete('/api/municipal/contracts/:id', authenticateMunicipal, performanceMiddleware('/api/municipal/contracts/:id'), async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const userCompanyId = await getUserCompany(userId);
      const contractId = parseInt(req.params.id);
      
      if (!userCompanyId) {
        return res.status(403).json({ error: 'User not associated with any company' });
      }

      // Verificar se o contrato pertence à empresa do usuário
      const [existingContract] = await db
        .select()
        .from(contracts)
        .where(
          eq(
            eq(contracts.id, contractId),
            eq(contracts.companyId, userCompanyId)
          )
        );

      if (!existingContract) {
        return res.status(404).json({ error: 'Contract not found or access denied' });
      }

      // Verificar se há escolas vinculadas ao contrato
      const [schoolsCount] = await db
        .select({ count: count() })
        .from(municipalSchools)
        .where(eq(municipalSchools.contractId, contractId));

      if (schoolsCount.count > 0) {
        return res.status(409).json({ error: 'Cannot delete contract with associated schools' });
      }

      // Deletar contrato
      await db
        .delete(contracts)
        .where(eq(contracts.id, contractId));

      // Invalidar caches relacionados
      CacheManager.invalidateUserCache(userId);
      CacheManager.invalidateCompanyCache(userCompanyId);

      console.log(`✅ [DELETE-CONTRACT] Contrato ${contractId} deletado por usuário ${userId}`);
      res.json({ success: true, message: 'Contract deleted successfully' });
    } catch (error) {
      console.error('Error deleting contract:', error);
      res.status(500).json({ error: 'Failed to delete contract' });
    }
  });

  // POST /api/municipal/directors - Criar novo diretor (OTIMIZADA)
  app.post('/api/municipal/directors', authenticateMunicipal, performanceMiddleware('/api/municipal/directors'), async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const userCompanyId = await getUserCompany(userId);
      
      if (!userCompanyId) {
        return res.status(403).json({ error: 'User not associated with any company' });
      }

      const { firstName, lastName, email, contractId, tempPassword } = req.body;

      // Validar dados obrigatórios
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required' });
      }

      // Verificar se email já existe
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Hash da senha temporária
      const hashedPassword = await bcrypt.hash(tempPassword || 'TempPass123!', 10);

      // Criar diretor
      const [newDirector] = await db
        .insert(users)
        .values({
          first_name: firstName,
          last_name: lastName,
          email,
          password: hashedPassword,
          role: 'school_director',
          companyId: userCompanyId,
          contractId: contractId || null,
          cognitoGroup: 'Diretores',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returning();

      // Invalidar caches relacionados
      CacheManager.invalidateUserCache(userId);
      CacheManager.invalidateCompanyCache(userCompanyId);

      console.log(`✅ [CREATE-DIRECTOR] Diretor ${firstName} ${lastName} criado por usuário ${userId}`);
      res.status(201).json({ success: true, director: newDirector });
    } catch (error) {
      console.error('Error creating director:', error);
      res.status(500).json({ error: 'Failed to create director' });
    }
  });

  // GET /api/municipal/cache/stats - Estatísticas do cache
  app.get('/api/municipal/cache/stats', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const stats = CacheManager.getStats();
      res.json({ success: true, cache: stats });
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      res.status(500).json({ error: 'Failed to fetch cache stats' });
    }
  });

  // DELETE /api/municipal/cache/clear - Limpar cache
  app.delete('/api/municipal/cache/clear', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Limpar apenas cache do usuário logado
      CacheManager.invalidateUserCache(userId);
      
      console.log(`✅ [CACHE-CLEAR] Cache do usuário ${userId} limpo`);
      res.json({ success: true, message: 'User cache cleared successfully' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // PATCH /api/municipal/contracts/:id - Editar contrato
  app.patch('/api/municipal/contracts/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const contractId = parseInt(req.params.id);
      const updateData = req.body;

      console.log('🔧 [CONTRACT_EDIT] Editing contract:', contractId, 'Data:', updateData);

      // Verificar se o usuário tem acesso ao contrato através da empresa
      const userCompany = await getUserCompany(userId);
      if (!userCompany) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      // Validar se o contrato pertence à empresa do usuário
      const [existingContract] = await db
        .select()
        .from(contracts)
        .where(eq(
          eq(contracts.id, contractId),
          eq(contracts.companyId, userCompany.companyId)
        ));

      if (!existingContract) {
        return res.status(404).json({ success: false, message: 'Contrato não encontrado' });
      }

      // Atualizar o contrato
      const [updatedContract] = await db
        .update(contracts)
        .set({
          name: updateData.name || existingContract.name,
          status: updateData.status || existingContract.status,
          totalLicenses: updateData.totalLicenses || existingContract.totalLicenses,
          maxTeachers: updateData.maxTeachers || existingContract.maxTeachers,
          startDate: updateData.startDate || existingContract.startDate,
          endDate: updateData.endDate || existingContract.endDate,
          value: updateData.value || existingContract.value,
          description: updateData.description || existingContract.description,
        })
        .where(eq(contracts.id, contractId))
        .returning();

      // Invalidar caches
      CacheManager.invalidateUserCache(userId);
      CacheManager.invalidateCompanyCache(userCompany.companyId);

      console.log('✅ [CONTRACT_EDIT] Contrato atualizado:', updatedContract.id);

      res.json({
        success: true,
        message: 'Contrato atualizado com sucesso',
        contract: updatedContract
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      res.status(500).json({ success: false, error: 'Erro ao atualizar contrato' });
    }
  });

  // PATCH /api/municipal/directors/:id - Editar diretor
  app.patch('/api/municipal/directors/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const directorId = parseInt(req.params.id);
      const updateData = req.body;

      console.log('🔧 [DIRECTOR_EDIT] Editing director:', directorId, 'Data:', updateData);

      // Verificar acesso através da empresa
      const userCompany = await getUserCompany(userId);
      if (!userCompany) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      // Validar se o diretor pertence à mesma empresa
      const [existingDirector] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, directorId),
          eq(users.companyId, userCompany.companyId),
          eq(users.role, 'school_director')
        ));

      if (!existingDirector) {
        return res.status(404).json({ success: false, message: 'Diretor não encontrado' });
      }

      // Atualizar dados do diretor
      const [updatedDirector] = await db
        .update(users)
        .set({
          first_name: updateData.firstName || existingDirector.first_name,
          last_name: updateData.lastName || existingDirector.last_name,
          email: updateData.email || existingDirector.email,
          contractId: updateData.contractId || existingDirector.contractId,
        })
        .where(eq(users.id, directorId))
        .returning();

      // Invalidar caches
      CacheManager.invalidateUserCache(userId);
      CacheManager.invalidateCompanyCache(userCompany.companyId);

      console.log('✅ [DIRECTOR_EDIT] Diretor atualizado:', updatedDirector.id);

      res.json({
        success: true,
        message: 'Diretor atualizado com sucesso',
        director: updatedDirector
      });
    } catch (error) {
      console.error('Error updating director:', error);
      res.status(500).json({ success: false, error: 'Erro ao atualizar diretor' });
    }
  });

  // GET /api/municipal/contracts/:id - Buscar contrato específico
  app.get('/api/municipal/contracts/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const contractId = parseInt(req.params.id);

      const userCompany = await getUserCompany(userId);
      if (!userCompany) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const [contract] = await db
        .select()
        .from(contracts)
        .where(and(
          eq(contracts.id, contractId),
          eq(contracts.companyId, userCompany.companyId)
        ));

      if (!contract) {
        return res.status(404).json({ success: false, message: 'Contrato não encontrado' });
      }

      res.json({ success: true, contract });
    } catch (error) {
      console.error('Error fetching contract:', error);
      res.status(500).json({ success: false, error: 'Erro ao buscar contrato' });
    }
  });

  // GET /api/municipal/directors/:id - Buscar diretor específico
  app.get('/api/municipal/directors/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const directorId = parseInt(req.params.id);

      const userCompany = await getUserCompany(userId);
      if (!userCompany) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const [director] = await db
        .select({
          id: users.id,
          firstName: users.first_name,
          lastName: users.last_name,
          email: users.email,
          role: users.role,
          companyId: users.companyId,
          contractId: users.contractId,
          contractName: contracts.name,
          contractStatus: contracts.status,
          cognitoGroup: users.cognitoGroup,
          createdAt: users.created_at
        })
        .from(users)
        .leftJoin(contracts, eq(users.contractId, contracts.id))
        .where(and(
          eq(users.id, directorId),
          eq(users.companyId, userCompany.companyId),
          eq(users.role, 'school_director')
        ));

      if (!director) {
        return res.status(404).json({ success: false, message: 'Diretor não encontrado' });
      }

      res.json({ success: true, director });
    } catch (error) {
      console.error('Error fetching director:', error);
      res.status(500).json({ success: false, error: 'Erro ao buscar diretor' });
    }
  });

}
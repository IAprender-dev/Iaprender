import { Express, Request, Response } from 'express';
import { db } from '../db';
import { users, companies, contracts, municipalSchools } from '../../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { CognitoService } from '../utils/cognito-service';
import { CacheManager } from '../utils/cache-manager';

export function registerSchoolsMunicipalRoutes(app: Express) {
  
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

  // Função para obter empresa do usuário
  async function getUserCompany(userId: number): Promise<number | null> {
    try {
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
      
      CacheManager.set(cacheKey, companyId, 300);
      console.log(`✅ User ${userId} vinculado à empresa ${companyId}`);
      return companyId;
    } catch (error) {
      console.error('Erro ao buscar empresa do usuário:', error);
      return null;
    }
  }

  // GET /api/municipal/schools/filtered - Buscar escolas filtradas por empresa
  app.get('/api/municipal/schools/filtered', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user.id;
      console.log(`🔍 [SCHOOLS] Iniciando busca para user ${userId}`);

      // Obter empresa do usuário
      const companyId = await getUserCompany(userId);
      if (!companyId) {
        return res.json({ success: true, schools: [] });
      }

      // Buscar contratos da empresa
      const userContracts = await db
        .select({ id: contracts.id })
        .from(contracts)
        .where(eq(contracts.companyId, companyId));

      if (userContracts.length === 0) {
        return res.json({ success: true, schools: [] });
      }

      const contractIds = userContracts.map(c => c.id);

      // Buscar escolas dos contratos
      const schoolsData = await db
        .select()
        .from(municipalSchools)
        .where(inArray(municipalSchools.contractId, contractIds));

      // Processar escolas com informações adicionais
      const schoolsWithDetails = await Promise.all(
        schoolsData.map(async (school) => {
          let contractInfo = null;
          let directorInfo = null;

          // Buscar informações do contrato
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

          // Buscar informações do diretor
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
            name: school.name || school.schoolName,
            inep: school.inep || school.inepCode,
            cnpj: school.cnpj,
            address: school.address,
            city: school.city,
            state: school.state,
            numberOfStudents: school.numberOfStudents || 0,
            numberOfTeachers: school.numberOfTeachers || 0,
            numberOfClassrooms: school.numberOfClassrooms || 0,
            status: school.status,
            isActive: school.isActive,
            createdAt: school.createdAt,
            contractId: school.contractId,
            contractName: contractInfo?.name || 'Sem contrato',
            contractStatus: contractInfo?.status || 'unknown',
            companyName: 'Empresa Municipal', // Placeholder
            directorName: directorInfo ? `${directorInfo.firstName} ${directorInfo.lastName}` : null,
            directorEmail: directorInfo?.email || null,
          };
        })
      );

      console.log(`🔍 [SCHOOLS] User ${userId} empresa ${companyId}: ${schoolsWithDetails.length} escolas`);
      res.json({ success: true, schools: schoolsWithDetails });
    } catch (error) {
      console.error('Error fetching schools:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch schools' });
    }
  });

  // GET /api/municipal/directors/filtered - Buscar diretores filtrados por empresa
  app.get('/api/municipal/directors/filtered', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user.id;
      console.log(`🔍 [DIRECTORS] Iniciando busca para user ${userId}`);

      // Obter empresa do usuário
      const companyId = await getUserCompany(userId);
      if (!companyId) {
        return res.json({ success: true, directors: [] });
      }

      // Buscar diretores da empresa (grupo Diretores)
      const directorsData = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.companyId, companyId),
            eq(users.cognitoGroup, 'Diretores')
          )
        );

      // Processar diretores com informações adicionais
      const directorsWithDetails = await Promise.all(
        directorsData.map(async (director) => {
          let contractInfo = null;
          let companyInfo = null;

          // Buscar informações do contrato se existir
          if (director.contractId) {
            try {
              const [contract] = await db
                .select({ 
                  name: contracts.name, 
                  description: contracts.description,
                  status: contracts.status 
                })
                .from(contracts)
                .where(eq(contracts.id, director.contractId));
              contractInfo = contract;
            } catch (err) {
              console.log('Contract not found for director:', director.id);
            }
          }

          // Buscar informações da empresa
          if (director.companyId) {
            try {
              const [company] = await db
                .select({ 
                  name: companies.name
                })
                .from(companies)
                .where(eq(companies.id, director.companyId));
              companyInfo = company;
            } catch (err) {
              console.log('Company not found for director:', director.id);
            }
          }

          return {
            id: director.id,
            email: director.email,
            firstName: director.first_name || '',
            lastName: director.last_name || '',
            phone: director.phone,
            cognitoGroup: director.cognitoGroup || 'Diretores',
            companyId: director.companyId,
            contractId: director.contractId,
            companyName: companyInfo?.name || 'Empresa Municipal',
            contractName: contractInfo?.name || null,
            createdAt: director.createdAt,
          };
        })
      );

      console.log(`🔍 [DIRECTORS] User ${userId} empresa ${companyId}: ${directorsWithDetails.length} diretores`);
      res.json({ success: true, directors: directorsWithDetails });
    } catch (error) {
      console.error('Error fetching directors:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch directors' });
    }
  });

  // POST /api/municipal/schools - Criar nova escola
  app.post('/api/municipal/schools', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user.id;
      const {
        name,
        inep,
        cnpj,
        address,
        city,
        state,
        numberOfStudents,
        numberOfTeachers,
        numberOfClassrooms,
        contractId
      } = req.body;

      // Validar dados obrigatórios
      if (!name || !contractId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nome da escola e contrato são obrigatórios' 
        });
      }

      // Verificar se o contrato pertence à empresa do usuário
      const companyId = await getUserCompany(userId);
      if (!companyId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Usuário sem empresa vinculada' 
        });
      }

      const [contract] = await db
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.id, contractId),
            eq(contracts.companyId, companyId)
          )
        );

      if (!contract) {
        return res.status(403).json({ 
          success: false, 
          error: 'Contrato não encontrado ou não autorizado' 
        });
      }

      // Criar escola
      const [newSchool] = await db
        .insert(municipalSchools)
        .values({
          name,
          inep,
          cnpj,
          address,
          city,
          state,
          numberOfStudents: numberOfStudents || 0,
          numberOfTeachers: numberOfTeachers || 0,
          numberOfClassrooms: numberOfClassrooms || 0,
          contractId,
          status: 'active',
          isActive: true,
          createdAt: new Date(),
        })
        .returning();

      console.log(`✅ [SCHOOL CREATED] User ${userId} criou escola: ${newSchool.name}`);
      res.json({ success: true, school: newSchool });
    } catch (error) {
      console.error('Error creating school:', error);
      res.status(500).json({ success: false, error: 'Failed to create school' });
    }
  });

  // POST /api/municipal/directors - Criar novo diretor
  app.post('/api/municipal/directors', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user.id;
      const {
        email,
        firstName,
        lastName,
        phone,
        contractId,
        password
      } = req.body;

      // Validar dados obrigatórios
      if (!email || !firstName || !lastName || !contractId || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Todos os campos obrigatórios devem ser preenchidos' 
        });
      }

      // Verificar se o contrato pertence à empresa do usuário
      const companyId = await getUserCompany(userId);
      if (!companyId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Usuário sem empresa vinculada' 
        });
      }

      const [contract] = await db
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.id, contractId),
            eq(contracts.companyId, companyId)
          )
        );

      if (!contract) {
        return res.status(403).json({ 
          success: false, 
          error: 'Contrato não encontrado ou não autorizado' 
        });
      }

      // Verificar se email já existe
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email já cadastrado no sistema' 
        });
      }

      try {
        // Criar usuário no AWS Cognito
        const cognitoService = new CognitoService();
        const cognitoUser = await cognitoService.createUser({
          email,
          temporaryPassword: password,
          firstName,
          lastName,
          groups: ['Diretores'],
          customAttributes: {
            company_id: companyId.toString(),
            contract_id: contractId.toString(),
          }
        });

        // Criar usuário local
        const [newDirector] = await db
          .insert(users)
          .values({
            username: email.split('@')[0],
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            role: 'school_director',
            cognitoUserId: cognitoUser.username,
            cognitoGroup: 'Diretores',
            companyId,
            contractId,
            createdAt: new Date(),
          })
          .returning();

        console.log(`✅ [DIRECTOR CREATED] User ${userId} criou diretor: ${newDirector.email}`);
        res.json({ 
          success: true, 
          director: newDirector,
          cognitoUsername: cognitoUser.username 
        });
      } catch (cognitoError: any) {
        console.error('Error creating director in Cognito:', cognitoError);
        res.status(500).json({ 
          success: false, 
          error: 'Erro ao criar diretor no sistema de autenticação: ' + cognitoError.message 
        });
      }
    } catch (error) {
      console.error('Error creating director:', error);
      res.status(500).json({ success: false, error: 'Failed to create director' });
    }
  });
}
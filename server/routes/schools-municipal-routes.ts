import { Express, Request, Response } from 'express';
import { db } from '../db';
// All table imports removed - will be reimplemented with new hierarchical structure
import { eq, inArray, and } from 'drizzle-orm';
import { CognitoService } from '../utils/cognito-service';
import { CacheManager } from '../utils/cache-manager';
import bcrypt from 'bcryptjs';

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
        .where(inArray(municipalSchools.contract_id, contractIds));

      // Processar escolas com informações adicionais
      const schoolsWithDetails = await Promise.all(
        schoolsData.map(async (school) => {
          let contractInfo = null;
          let directorInfo = null;

          // Buscar informações do contrato
          if (school.contract_id) {
            try {
              const [contract] = await db
                .select({ 
                  name: contracts.name, 
                  description: contracts.description,
                  status: contracts.status 
                })
                .from(contracts)
                .where(eq(contracts.id, school.contract_id));
              contractInfo = contract;
            } catch (err) {
              console.log('Contract not found for school:', school.id);
            }
          }

          // Buscar informações do diretor
          if (school.director_user_id) {
            try {
              const [director] = await db
                .select({ 
                  firstName: users.first_name, 
                  lastName: users.last_name, 
                  email: users.email 
                })
                .from(users)
                .where(eq(users.id, school.director_user_id));
              directorInfo = director;
            } catch (err) {
              console.log('Director not found for school:', school.id);
            }
          }

          return {
            id: school.id,
            name: school.name || school.school_name,
            inep: school.inep || school.inep_code,
            cnpj: school.cnpj,
            address: school.address,
            city: school.city,
            state: school.state,
            numberOfStudents: school.number_of_students || 0,
            numberOfTeachers: school.number_of_teachers || 0,
            numberOfClassrooms: school.number_of_classrooms || 0,
            status: school.status,
            isActive: school.is_active,
            createdAt: school.created_at,
            contractId: school.contract_id,
            contractName: contractInfo?.name || 'Sem contrato',
            contractStatus: contractInfo?.status || 'unknown',
            companyName: 'Empresa Municipal',
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

      // Buscar diretores da empresa
      const directorsData = await db
        .select()
        .from(users)
        .where(eq(users.companyId, companyId));

      // Filtrar apenas diretores
      const directorsFiltered = directorsData.filter(user => 
        user.cognitoGroup === 'Diretores' || user.role === 'school_director'
      );

      // Processar diretores com informações adicionais
      const directorsWithDetails = await Promise.all(
        directorsFiltered.map(async (director) => {
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
        .where(eq(contracts.id, contractId));

      if (!contract || contract.companyId !== companyId) {
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
          number_of_students: numberOfStudents || 0,
          number_of_teachers: numberOfTeachers || 0,
          number_of_classrooms: numberOfClassrooms || 0,
          contract_id: contractId,
          status: 'active',
          is_active: true,
          created_at: new Date(),
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
          error: 'Email, nome, sobrenome, contrato e senha são obrigatórios' 
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
        .where(eq(contracts.id, contractId));

      if (!contract || contract.companyId !== companyId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Contrato não encontrado ou não autorizado' 
        });
      }

      // Verificar se já existe usuário com esse email
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Já existe um usuário com este email' 
        });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário no banco local
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          role: 'school_director',
          companyId: companyId,
          contractId: contractId,
          cognitoGroup: 'Diretores',
          hashedPassword,
          createdAt: new Date(),
        })
        .returning();

      console.log(`✅ [DIRECTOR CREATED] User ${userId} criou diretor: ${newUser.email}`);
      res.json({ success: true, director: newUser });
    } catch (error) {
      console.error('Error creating director:', error);
      res.status(500).json({ success: false, error: 'Failed to create director' });
    }
  });

  // PATCH /api/municipal/schools/:id - Editar escola
  app.patch('/api/municipal/schools/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user.id;
      const schoolId = parseInt(req.params.id);
      const updateData = req.body;

      // Verificar se a escola pertence à empresa do usuário
      const companyId = await getUserCompany(userId);
      if (!companyId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Usuário sem empresa vinculada' 
        });
      }

      // Buscar escola e verificar permissão
      const [existingSchool] = await db
        .select()
        .from(municipalSchools)
        .where(eq(municipalSchools.id, schoolId));

      if (!existingSchool) {
        return res.status(404).json({ 
          success: false, 
          error: 'Escola não encontrada' 
        });
      }

      // Verificar se a escola pertence a um contrato da empresa do usuário
      if (existingSchool.contract_id) {
        const [contract] = await db
          .select()
          .from(contracts)
          .where(eq(contracts.id, existingSchool.contract_id));

        if (!contract || contract.companyId !== companyId) {
          return res.status(403).json({ 
            success: false, 
            error: 'Não autorizado a editar esta escola' 
          });
        }
      }

      // Preparar dados para atualização
      const fieldsToUpdate: any = {};
      
      if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name;
      if (updateData.inep !== undefined) fieldsToUpdate.inep = updateData.inep;
      if (updateData.cnpj !== undefined) fieldsToUpdate.cnpj = updateData.cnpj;
      if (updateData.address !== undefined) fieldsToUpdate.address = updateData.address;
      if (updateData.city !== undefined) fieldsToUpdate.city = updateData.city;
      if (updateData.state !== undefined) fieldsToUpdate.state = updateData.state;
      if (updateData.numberOfStudents !== undefined) fieldsToUpdate.number_of_students = updateData.numberOfStudents;
      if (updateData.numberOfTeachers !== undefined) fieldsToUpdate.number_of_teachers = updateData.numberOfTeachers;
      if (updateData.numberOfClassrooms !== undefined) fieldsToUpdate.number_of_classrooms = updateData.numberOfClassrooms;
      if (updateData.directorUserId !== undefined) fieldsToUpdate.director_user_id = updateData.directorUserId;
      if (updateData.isActive !== undefined) fieldsToUpdate.is_active = updateData.isActive;
      
      fieldsToUpdate.updated_at = new Date();

      // Atualizar escola
      const [updatedSchool] = await db
        .update(municipalSchools)
        .set(fieldsToUpdate)
        .where(eq(municipalSchools.id, schoolId))
        .returning();

      console.log(`✅ [SCHOOL UPDATED] User ${userId} atualizou escola: ${updatedSchool.name}`);
      res.json({ success: true, school: updatedSchool });
    } catch (error) {
      console.error('Error updating school:', error);
      res.status(500).json({ success: false, error: 'Failed to update school' });
    }
  });

  // PATCH /api/municipal/directors/:id - Editar diretor
  app.patch('/api/municipal/directors/:id', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user.id;
      const directorId = parseInt(req.params.id);
      const updateData = req.body;

      // Verificar se o diretor pertence à empresa do usuário
      const companyId = await getUserCompany(userId);
      if (!companyId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Usuário sem empresa vinculada' 
        });
      }

      // Buscar diretor e verificar permissão
      const [existingDirector] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, directorId),
          eq(users.companyId, companyId),
          eq(users.role, 'school_director')
        ));

      if (!existingDirector) {
        return res.status(404).json({ 
          success: false, 
          error: 'Diretor não encontrado ou não autorizado' 
        });
      }

      // Preparar dados para atualização
      const fieldsToUpdate: any = {};
      
      if (updateData.firstName !== undefined) fieldsToUpdate.first_name = updateData.firstName;
      if (updateData.lastName !== undefined) fieldsToUpdate.last_name = updateData.lastName;
      if (updateData.phone !== undefined) fieldsToUpdate.phone = updateData.phone;
      if (updateData.contractId !== undefined) fieldsToUpdate.contractId = updateData.contractId;
      
      fieldsToUpdate.updatedAt = new Date();

      // Atualizar diretor
      const [updatedDirector] = await db
        .update(users)
        .set(fieldsToUpdate)
        .where(eq(users.id, directorId))
        .returning();

      console.log(`✅ [DIRECTOR UPDATED] User ${userId} atualizou diretor: ${updatedDirector.email}`);
      res.json({ success: true, director: updatedDirector });
    } catch (error) {
      console.error('Error updating director:', error);
      res.status(500).json({ success: false, error: 'Failed to update director' });
    }
  });

}
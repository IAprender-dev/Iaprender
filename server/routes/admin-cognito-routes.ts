import type { Express, Request, Response } from "express";
// AWS SDK imports serão implementados quando as credenciais estiverem configuradas
// import { CognitoIdentityProviderClient, AdminListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Interface para usuários AWS Cognito com dados locais
interface CognitoUser {
  cognitoId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  enabled: boolean;
  createdDate: string;
  lastModifiedDate: string;
  groups: string[];
  localData?: {
    id: number;
    role: string;
    lastLoginAt?: string;
    firstLogin: boolean;
    contractId?: number;
  } | null;
  contractInfo?: {
    contractId: number;
    contractNumber: string;
    contractName: string;
    companyId: number;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
  } | null;
}

interface UserStatistics {
  total: number;
  active: number;
  pending: number;
  inactive: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Cliente AWS Cognito será inicializado quando as credenciais estiverem nas secrets
// const cognitoClient = new CognitoIdentityProviderClient({ ... });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// Middleware de autenticação JWT
const authenticate = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key_iaprender_2025') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware para verificar tipo de usuário
const requireAdminOrGestor = (req: Request, res: Response, next: any) => {
  if (!req.user || !['admin', 'gestor'].includes(req.user.tipo_usuario)) {
    return res.status(403).json({ 
      message: 'Acesso negado. Apenas administradores e gestores podem acessar este recurso.',
      requiredRole: ['admin', 'gestor'],
      currentRole: req.user?.tipo_usuario || 'none'
    });
  }
  next();
};

export function registerAdminCognitoRoutes(app: Express) {
  console.log('📝 Registrando rotas administrativas do AWS Cognito...');

  // Listar usuários AWS Cognito
  app.get('/api/admin/users/list', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const { page = 1, search = '', status = 'all', activeTab = 'todos' } = req.query;
      const limit = 20;
      const currentPage = parseInt(page as string);

      console.log(`🔍 Listando usuários AWS Cognito - Página: ${currentPage}, Busca: "${search}", Status: "${status}"`);

      // Placeholder para integração com AWS Cognito - requer credenciais configuradas
      console.log(`🔄 Simulando busca de usuários AWS Cognito...`);
      
      // Mock de usuários para demonstração (será substituído pela integração real)
      let cognitoUsers = [
        {
          Username: 'admin-001',
          UserStatus: 'CONFIRMED',
          Enabled: true,
          UserCreateDate: new Date(),
          UserLastModifiedDate: new Date(),
          Attributes: [
            { Name: 'email', Value: 'admin@iaprender.com.br' },
            { Name: 'given_name', Value: 'Administrador' },
            { Name: 'family_name', Value: 'Sistema' }
          ]
        },
        {
          Username: 'gestor-001',
          UserStatus: 'CONFIRMED',
          Enabled: true,
          UserCreateDate: new Date(),
          UserLastModifiedDate: new Date(),
          Attributes: [
            { Name: 'email', Value: 'gestor@prefeitura.gov.br' },
            { Name: 'given_name', Value: 'João' },
            { Name: 'family_name', Value: 'Silva' }
          ]
        }
      ];

      console.log(`📊 Encontrados ${cognitoUsers.length} usuários no AWS Cognito`);

      // Mapear dados dos usuários
      const mappedUsers: CognitoUser[] = await Promise.all(
        cognitoUsers.map(async (user) => {
          // Mock de grupos baseado no tipo de usuário (será substituído pela integração real)
          let groups: string[] = [];
          if (user.Username?.includes('admin')) {
            groups = ['Admin'];
          } else if (user.Username?.includes('gestor')) {
            groups = ['Gestores'];
          } else if (user.Username?.includes('diretor')) {
            groups = ['Diretores'];
          } else if (user.Username?.includes('professor')) {
            groups = ['Professores'];
          } else if (user.Username?.includes('aluno')) {
            groups = ['Alunos'];
          }

          // Extrair dados dos atributos
          const attributes = user.Attributes || [];
          const email = attributes.find(attr => attr.Name === 'email')?.Value || '';
          const firstName = attributes.find(attr => attr.Name === 'given_name')?.Value || '';
          const lastName = attributes.find(attr => attr.Name === 'family_name')?.Value || '';

          // Buscar dados locais se existirem
          let localData = null;
          try {
            const localUser = await db.query.users.findFirst({
              where: eq(users.cognitoSub, user.Username!)
            });
            
            if (localUser) {
              localData = {
                id: localUser.id,
                role: localUser.role || 'student',
                lastLoginAt: localUser.ultimoLoginEm?.toISOString(),
                firstLogin: localUser.primeiroLogin || true,
                contractId: localUser.contratoId || undefined
              };
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao buscar dados locais do usuário ${user.Username}:`, error);
          }

          return {
            cognitoId: user.Username!,
            email,
            firstName,
            lastName,
            status: user.UserStatus!,
            enabled: user.Enabled || false,
            createdDate: user.UserCreateDate?.toISOString() || '',
            lastModifiedDate: user.UserLastModifiedDate?.toISOString() || '',
            groups,
            localData,
            contractInfo: null // Implementar busca de contrato se necessário
          };
        })
      );

      // Aplicar filtros
      let filteredUsers = mappedUsers;

      // Filtrar por busca (email ou nome)
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(searchTerm) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm)
        );
      }

      // Filtrar por status
      if (status !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === status);
      }

      // Calcular estatísticas
      const statistics: UserStatistics = {
        total: mappedUsers.length,
        active: mappedUsers.filter(u => u.status === 'CONFIRMED' && u.enabled).length,
        pending: mappedUsers.filter(u => u.status === 'FORCE_CHANGE_PASSWORD').length,
        inactive: mappedUsers.filter(u => !u.enabled || u.status === 'UNCONFIRMED').length
      };

      // Paginação
      const totalUsers = filteredUsers.length;
      const totalPages = Math.ceil(totalUsers / limit);
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      const pagination: PaginationInfo = {
        currentPage,
        totalPages,
        totalUsers,
        limit,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      };

      console.log(`✅ Retornando ${paginatedUsers.length} usuários da página ${currentPage}/${totalPages}`);

      res.json({
        success: true,
        users: paginatedUsers,
        statistics,
        pagination,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao listar usuários AWS Cognito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar usuários do AWS Cognito',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Buscar detalhes de um usuário específico
  app.get('/api/admin/users/:cognitoId/details', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const { cognitoId } = req.params;

      console.log(`🔍 Buscando detalhes do usuário: ${cognitoId}`);

      // Mock de resposta do usuário (será substituído pela integração real)
      const userResponse = {
        UserStatus: 'CONFIRMED',
        Enabled: true,
        UserCreateDate: new Date(),
        UserLastModifiedDate: new Date(),
        UserAttributes: [
          { Name: 'email', Value: `${cognitoId}@exemplo.com` },
          { Name: 'given_name', Value: 'Usuario' },
          { Name: 'family_name', Value: 'Teste' }
        ]
      };

      // Mock de grupos
      const groups = cognitoId.includes('admin') ? ['Admin'] : 
                    cognitoId.includes('gestor') ? ['Gestores'] : ['Alunos'];

      // Buscar dados locais
      let localData = null;
      try {
        const localUser = await db.query.users.findFirst({
          where: eq(users.cognitoSub, cognitoId)
        });
        
        if (localUser) {
          localData = {
            id: localUser.id,
            role: localUser.role || 'student',
            lastLoginAt: localUser.ultimoLoginEm?.toISOString(),
            firstLogin: localUser.primeiroLogin || true,
            contractId: localUser.contratoId || undefined
          };
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar dados locais:`, error);
      }

      const attributes = userResponse.UserAttributes || [];
      const userDetails = {
        cognitoId,
        email: attributes.find(attr => attr.Name === 'email')?.Value || '',
        firstName: attributes.find(attr => attr.Name === 'given_name')?.Value || '',
        lastName: attributes.find(attr => attr.Name === 'family_name')?.Value || '',
        status: userResponse.UserStatus,
        enabled: userResponse.Enabled,
        createdDate: userResponse.UserCreateDate?.toISOString(),
        lastModifiedDate: userResponse.UserLastModifiedDate?.toISOString(),
        groups,
        localData
      };

      console.log(`✅ Detalhes do usuário ${cognitoId} carregados com sucesso`);

      res.json({
        success: true,
        user: userDetails,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Erro ao buscar detalhes do usuário ${req.params.cognitoId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar detalhes do usuário',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Listar grupos disponíveis
  app.get('/api/admin/cognito/groups', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      console.log('🔍 Listando grupos AWS Cognito disponíveis...');

      // Mock de grupos (será substituído pela integração real)
      const groups = [
        {
          GroupName: 'Admin',
          Description: 'Administradores do sistema',
          Precedence: 1,
          CreationDate: new Date(),
          LastModifiedDate: new Date()
        },
        {
          GroupName: 'Gestores',
          Description: 'Gestores municipais',
          Precedence: 2,
          CreationDate: new Date(),
          LastModifiedDate: new Date()
        },
        {
          GroupName: 'Diretores',
          Description: 'Diretores escolares',
          Precedence: 3,
          CreationDate: new Date(),
          LastModifiedDate: new Date()
        },
        {
          GroupName: 'Professores',
          Description: 'Professores',
          Precedence: 4,
          CreationDate: new Date(),
          LastModifiedDate: new Date()
        },
        {
          GroupName: 'Alunos',
          Description: 'Estudantes',
          Precedence: 5,
          CreationDate: new Date(),
          LastModifiedDate: new Date()
        }
      ];

      console.log(`✅ Encontrados ${groups.length} grupos no AWS Cognito`);

      res.json({
        success: true,
        groups: groups.map(group => ({
          name: group.GroupName,
          description: group.Description,
          precedence: group.Precedence,
          creationDate: group.CreationDate?.toISOString(),
          lastModifiedDate: group.LastModifiedDate?.toISOString()
        })),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao listar grupos AWS Cognito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar grupos do AWS Cognito',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Status dos grupos (estatísticas)
  app.get('/api/admin/cognito/groups/status', authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      console.log('📊 Calculando estatísticas dos grupos AWS Cognito...');

      // Mock de usuários para estatísticas (será substituído pela integração real)
      const allUsers = [
        { Username: 'admin-001' },
        { Username: 'gestor-001' },
        { Username: 'gestor-002' },
        { Username: 'diretor-001' },
        { Username: 'diretor-002' },
        { Username: 'professor-001' },
        { Username: 'professor-002' },
        { Username: 'professor-003' },
        { Username: 'aluno-001' },
        { Username: 'aluno-002' }
      ];

      // Contar usuários por grupo
      const groupStats: { [key: string]: number } = {
        'Admin': 0,
        'Gestores': 0,
        'Diretores': 0,
        'Professores': 0,
        'Alunos': 0,
        'SemGrupo': 0
      };

      // Mock de contagem de grupos (será substituído pela integração real)
      for (const user of allUsers) {
        if (user.Username?.includes('admin')) {
          groupStats['Admin']++;
        } else if (user.Username?.includes('gestor')) {
          groupStats['Gestores']++;
        } else if (user.Username?.includes('diretor')) {
          groupStats['Diretores']++;
        } else if (user.Username?.includes('professor')) {
          groupStats['Professores']++;
        } else if (user.Username?.includes('aluno')) {
          groupStats['Alunos']++;
        } else {
          groupStats['SemGrupo']++;
        }
      }

      console.log('✅ Estatísticas dos grupos calculadas:', groupStats);

      res.json({
        success: true,
        groupStats,
        totalUsers: allUsers.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas dos grupos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular estatísticas dos grupos',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  console.log('✅ Rotas administrativas do AWS Cognito registradas com sucesso');
}
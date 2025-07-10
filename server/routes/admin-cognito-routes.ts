import type { Express, Request, Response } from "express";
import { 
  CognitoIdentityProviderClient, 
  ListUsersCommand,
  AdminGetUserCommand, 
  AdminCreateUserCommand, 
  AdminSetUserPasswordCommand, 
  AdminAddUserToGroupCommand, 
  AdminRemoveUserFromGroupCommand, 
  ListGroupsCommand, 
  AdminListGroupsForUserCommand 
} from "@aws-sdk/client-cognito-identity-provider";
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

// Cliente AWS Cognito com credenciais das secrets
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

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

      // Buscar usuários reais do AWS Cognito com fallback
      console.log(`🔄 Buscando usuários reais do AWS Cognito...`);
      
      let cognitoUsers: any[] = [];
      let isUsingFallback = false;
      
      try {
        const command = new ListUsersCommand({
          UserPoolId: USER_POOL_ID,
          Limit: 60, // AWS permite máximo 60 por requisição
        });

        const cognitoResponse = await cognitoClient.send(command);
        cognitoUsers = cognitoResponse.Users || [];
        console.log(`📊 Encontrados ${cognitoUsers.length} usuários reais no AWS Cognito`);
      } catch (error: any) {
        console.warn(`⚠️ Erro ao acessar AWS Cognito (possivelmente permissões), usando dados de fallback...`);
        isUsingFallback = true;
        
        // Fallback: buscar usuários locais do banco de dados
        const localUsers = await db.select().from(users);
        cognitoUsers = localUsers.map(user => ({
          Username: user.cognitoUserId || `local-${user.id}`,
          UserStatus: 'CONFIRMED',
          Enabled: true,
          UserCreateDate: user.createdAt,
          UserLastModifiedDate: user.updatedAt,
          Attributes: [
            { Name: 'email', Value: user.email },
            { Name: 'given_name', Value: user.firstName || 'Nome' },
            { Name: 'family_name', Value: user.lastName || 'Sobrenome' }
          ]
        }));
        
        console.log(`📊 Usando fallback: encontrados ${cognitoUsers.length} usuários locais`);
      }

      // Mapear dados dos usuários
      const mappedUsers: CognitoUser[] = await Promise.all(
        cognitoUsers.map(async (user) => {
          // Buscar grupos reais do usuário ou usar fallback
          let groups: string[] = [];
          
          if (!isUsingFallback) {
            try {
              const groupsCommand = new AdminListGroupsForUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: user.Username!
              });
              const groupsResponse = await cognitoClient.send(groupsCommand);
              groups = groupsResponse.Groups?.map(g => g.GroupName!) || [];
            } catch (error) {
              console.warn(`⚠️ Erro ao buscar grupos do usuário ${user.Username}:`, error);
            }
          } else {
            // Fallback: determinar grupo baseado no role local
            const localUser = await db.query.users.findFirst({
              where: eq(users.cognitoUserId, user.Username!)
            });
            
            if (localUser?.role) {
              const roleToGroup: { [key: string]: string } = {
                'admin': 'Admin',
                'municipal_manager': 'Gestores',
                'school_director': 'Diretores',
                'teacher': 'Professores',
                'student': 'Alunos'
              };
              groups = [roleToGroup[localUser.role] || 'Alunos'];
            }
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
              where: eq(users.cognitoUserId, user.Username!)
            });
            
            if (localUser) {
              localData = {
                id: localUser.id,
                role: localUser.role || 'student',
                lastLoginAt: localUser.lastLoginAt?.toISOString(),
                firstLogin: localUser.firstLogin || true,
                contractId: localUser.contractId || undefined
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
        message: isUsingFallback ? "Dados carregados do banco local (AWS Cognito indisponível)" : "Usuários listados com sucesso",
        users: paginatedUsers,
        statistics,
        pagination,
        fallbackMode: isUsingFallback,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Erro ao listar usuários AWS Cognito:', error);
      
      // Se é erro de permissão AWS, usar fallback com dados locais
      if (error.name === 'AccessDeniedException' || error.message?.includes('not authorized')) {
        console.log('🔄 Tentando fallback com dados locais...');
        
        try {
          const localUsers = await db.select().from(users);
          const fallbackUsers = localUsers.map(user => ({
            cognitoId: user.cognitoUserId || `local-${user.id}`,
            email: user.email,
            firstName: user.firstName || 'Nome',
            lastName: user.lastName || 'Sobrenome',
            status: 'CONFIRMED',
            enabled: true,
            createdDate: user.createdAt?.toISOString() || new Date().toISOString(),
            lastModifiedDate: user.updatedAt?.toISOString() || new Date().toISOString(),
            groups: [user.role === 'admin' ? 'Admin' : user.role === 'municipal_manager' ? 'Gestores' : 'Alunos'],
            localData: {
              id: user.id,
              role: user.role || 'student',
              lastLoginAt: user.lastLoginAt?.toISOString(),
              firstLogin: user.firstLogin || true,
              contractId: user.contractId || undefined
            },
            contractInfo: null
          }));

          const statistics = {
            total: fallbackUsers.length,
            active: fallbackUsers.filter(u => u.enabled).length,
            pending: 0,
            inactive: fallbackUsers.filter(u => !u.enabled).length
          };

          const pagination = {
            currentPage: 1,
            totalPages: 1,
            totalUsers: fallbackUsers.length,
            limit: 60,
            hasNextPage: false,
            hasPrevPage: false
          };

          return res.json({
            success: true,
            message: 'Dados carregados do banco local (AWS Cognito sem permissões)',
            users: fallbackUsers,
            statistics,
            pagination,
            fallbackMode: true,
            timestamp: new Date().toISOString()
          });
        } catch (dbError) {
          console.error('❌ Erro no fallback com banco local:', dbError);
        }
      }
      
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

      // Buscar usuário real do AWS Cognito
      const command = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoId
      });

      const userResponse = await cognitoClient.send(command);

      // Buscar grupos reais
      const groupsCommand = new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoId
      });

      const groupsResponse = await cognitoClient.send(groupsCommand);
      const groups = groupsResponse.Groups?.map(g => g.GroupName!) || [];

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

      // Buscar grupos reais do AWS Cognito
      const command = new ListGroupsCommand({
        UserPoolId: USER_POOL_ID
      });

      const response = await cognitoClient.send(command);
      const groups = response.Groups || [];

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

      // Buscar todos os usuários reais
      const usersCommand = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Limit: 60
      });

      const usersResponse = await cognitoClient.send(usersCommand);
      const allUsers = usersResponse.Users || [];

      // Contar usuários por grupo
      const groupStats: { [key: string]: number } = {
        'Admin': 0,
        'Gestores': 0,
        'Diretores': 0,
        'Professores': 0,
        'Alunos': 0,
        'SemGrupo': 0
      };

      // Contar usuários reais por grupo
      for (const user of allUsers) {
        try {
          const groupsCommand = new AdminListGroupsForUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: user.Username!
          });

          const groupsResponse = await cognitoClient.send(groupsCommand);
          const userGroups = groupsResponse.Groups?.map(g => g.GroupName!) || [];

          if (userGroups.length === 0) {
            groupStats['SemGrupo']++;
          } else {
            userGroups.forEach(groupName => {
              if (groupStats[groupName] !== undefined) {
                groupStats[groupName]++;
              }
            });
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar grupos do usuário ${user.Username}:`, error);
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
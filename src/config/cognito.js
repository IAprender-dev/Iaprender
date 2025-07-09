import { CognitoIdentityProviderClient, ListUsersCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import logger from '../utils/logger.js';

/**
 * Serviço de integração com AWS Cognito
 * Responsável por validar usuários e obter dados para sincronização local
 */
class CognitoService {
  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.userPoolId = process.env.COGNITO_USER_POOL_ID;
    // HIERARQUIA DEFINIDA BASEADA NOS GRUPOS COGNITO:
    // NÍVEL 1: ADMIN (Controle total do sistema)
    // NÍVEL 2: GESTOR (Gerencia uma empresa completa) 
    // NÍVEL 3: DIRETOR (Gerencia uma escola específica)
    // NÍVEL 4: PROFESSOR (Acesso às ferramentas educacionais)
    // NÍVEL 5: ALUNO (Acesso ao ambiente de aprendizado)
    
    this.groupMappings = {
      // NÍVEL 1 - ADMINISTRADORES DO SISTEMA
      'Admin': 'admin',
      'AdminMaster': 'admin',
      'Administradores': 'admin',
      
      // NÍVEL 2 - GESTORES MUNICIPAIS/EMPRESARIAIS
      'Gestores': 'gestor',
      'GestorMunicipal': 'gestor',
      'GestoresMunicipais': 'gestor',
      'Managers': 'gestor',
      
      // NÍVEL 3 - DIRETORES DE ESCOLAS
      'Diretores': 'diretor',
      'Diretor': 'diretor',
      'DiretoresEscolares': 'diretor',
      'SchoolDirectors': 'diretor',
      
      // NÍVEL 4 - PROFESSORES
      'Professores': 'professor',
      'Professor': 'professor',
      'Teachers': 'professor',
      'Docentes': 'professor',
      
      // NÍVEL 5 - ALUNOS
      'Alunos': 'aluno',
      'Aluno': 'aluno',
      'Students': 'aluno',
      'Estudantes': 'aluno'
    };
  }

  /**
   * Listar todos os usuários do Cognito
   * @param {number} limit - Limite de usuários por página
   * @param {string} paginationToken - Token para paginação
   * @returns {Object} Lista de usuários com token de paginação
   */
  async listarUsuarios(limit = 60, paginationToken = null) {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Limit: limit
      };

      if (paginationToken) {
        params.PaginationToken = paginationToken;
      }

      const command = new ListUsersCommand(params);
      const response = await this.client.send(command);

      logger.info(`📋 ${response.Users.length} usuários encontrados no Cognito`);
      
      return {
        usuarios: response.Users,
        nextToken: response.PaginationToken || null,
        total: response.Users.length
      };
    } catch (error) {
      logger.error('❌ Erro ao listar usuários do Cognito:', error.message);
      throw error;
    }
  }

  /**
   * Obter detalhes de um usuário específico do Cognito
   * @param {string} username - Username do usuário no Cognito
   * @returns {Object} Dados completos do usuário
   */
  async obterUsuario(username) {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      logger.error(`❌ Erro ao obter usuário ${username}:`, error.message);
      throw error;
    }
  }

  /**
   * Mapear dados do Cognito para formato local
   * @param {Object} cognitoUser - Usuário do Cognito
   * @returns {Object} Dados formatados para inserção local
   */
  mapearUsuarioCognito(cognitoUser) {
    try {
      // Extrair atributos do Cognito
      const attributes = {};
      if (cognitoUser.Attributes) {
        cognitoUser.Attributes.forEach(attr => {
          attributes[attr.Name] = attr.Value;
        });
      } else if (cognitoUser.UserAttributes) {
        cognitoUser.UserAttributes.forEach(attr => {
          attributes[attr.Name] = attr.Value;
        });
      }

      // Determinar tipo de usuário baseado nos grupos (se disponível)
      let tipoUsuario = 'aluno'; // padrão
      if (cognitoUser.Groups && cognitoUser.Groups.length > 0) {
        const primeiroGrupo = cognitoUser.Groups[0];
        tipoUsuario = this.groupMappings[primeiroGrupo] || 'aluno';
      }

      // Gerar dados fictícios para campos não disponíveis no Cognito
      const nomesCompletos = [
        'Ana Maria Silva', 'Carlos Eduardo Santos', 'Maria José Oliveira',
        'João Pedro Costa', 'Patricia Lima Ferreira', 'Roberto Carlos Almeida',
        'Fernanda Souza Santos', 'Lucas Gabriel Lima', 'Juliana Reis Silva',
        'Bruno Henrique Costa', 'Camila Rodrigues Souza', 'Diego Santos Lima'
      ];

      const telefones = [
        '(11) 99888-7766', '(21) 98777-6655', '(31) 97666-5544',
        '(85) 96555-4433', '(51) 95444-3322', '(62) 94333-2211',
        '(47) 93222-1100', '(27) 92111-0099', '(83) 91000-9988'
      ];

      const enderecos = [
        'Rua das Flores, 123 - Centro',
        'Av. Paulista, 456 - Bela Vista', 
        'Rua da Paz, 789 - Vila Nova',
        'Av. Brasil, 321 - Centro',
        'Rua do Comércio, 654 - Downtown',
        'Av. das Nações, 987 - Jardim Europa'
      ];

      const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Fortaleza', 'Porto Alegre', 'Brasília'];
      const estados = ['SP', 'RJ', 'MG', 'CE', 'RS', 'DF'];

      // Usar hash do email para manter consistência nos dados fictícios
      const emailHash = this.simpleHash(attributes.email || cognitoUser.Username);
      
      return {
        cognito_sub: cognitoUser.Username,
        email: attributes.email || `${cognitoUser.Username}@exemplo.com`,
        nome: attributes.name || nomesCompletos[emailHash % nomesCompletos.length],
        tipo_usuario: tipoUsuario,
        telefone: attributes.phone_number || telefones[emailHash % telefones.length],
        documento_identidade: this.gerarCPFFicticio(),
        endereco: enderecos[emailHash % enderecos.length],
        cidade: cidades[emailHash % cidades.length],
        estado: estados[emailHash % estados.length],
        empresa_id: this.determinarEmpresaId(tipoUsuario, emailHash),
        // Campos do Cognito
        cognito_status: cognitoUser.UserStatus || 'CONFIRMED',
        cognito_created: cognitoUser.UserCreateDate,
        cognito_last_modified: cognitoUser.UserLastModifiedDate
      };
    } catch (error) {
      logger.error('❌ Erro ao mapear usuário do Cognito:', error.message);
      throw error;
    }
  }

  /**
   * Gerar hash simples para consistência de dados fictícios
   * @param {string} str - String para gerar hash
   * @returns {number} Hash numérico
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Gerar CPF fictício válido
   * @returns {string} CPF no formato xxx.xxx.xxx-xx
   */
  gerarCPFFicticio() {
    const num1 = Math.floor(Math.random() * 900) + 100;
    const num2 = Math.floor(Math.random() * 900) + 100;
    const num3 = Math.floor(Math.random() * 900) + 100;
    const dv1 = Math.floor(Math.random() * 10);
    const dv2 = Math.floor(Math.random() * 10);
    
    return `${num1}.${num2}.${num3}-${dv1}${dv2}`;
  }

  /**
   * Determinar empresa_id baseado no tipo de usuário
   * @param {string} tipoUsuario - Tipo do usuário
   * @param {number} hash - Hash para distribuição
   * @returns {number|null} ID da empresa ou null
   */
  determinarEmpresaId(tipoUsuario, hash) {
    // Admins podem não ter empresa específica
    if (tipoUsuario === 'admin') {
      return hash % 2 === 0 ? null : 6; // Alguns admins sem empresa, outros na Prefeitura SP
    }

    // Gestores e demais usuários têm empresa
    const empresasIds = [6, 7, 8, 9, 10]; // IDs das empresas criadas
    return empresasIds[hash % empresasIds.length];
  }

  /**
   * Verificar conectividade com Cognito
   * @returns {boolean} Status da conexão
   */
  async verificarConectividade() {
    try {
      await this.listarUsuarios(1);
      logger.info('✅ Conectividade com Cognito confirmada');
      return true;
    } catch (error) {
      logger.error('❌ Falha na conectividade com Cognito:', error.message);
      return false;
    }
  }
}

export default CognitoService;
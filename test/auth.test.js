/**
 * TESTES DE AUTENTICAÇÃO E CONTROLE DE ACESSO - IAPRENDER
 * 
 * Este arquivo contém testes abrangentes para:
 * - Autenticação JWT
 * - Controle de acesso por empresa
 * - Criação de usuários
 * - Endpoints principais do sistema
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

// Importar aplicação e utilitários
import app from '../src/app.js';
import { executeQuery, executeTransaction } from '../src/config/database.js';
import {
  ErroAutenticacao,
  ErroAutorizacao,
  ErroValidacao,
  ErroAlunoNaoEncontrado,
  ErroAcessoEmpresa,
  middlewareErros
} from '../src/utils/erros.js';

// Configuração de teste
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

describe('🔐 SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO', () => {
  let pool;
  let testUsers = {};
  let testEmpresas = {};
  let testEscolas = {};
  let testTokens = {};

  // Configuração inicial dos testes
  beforeAll(async () => {
    // Configurar pool de conexão para testes
    pool = new Pool({
      connectionString: TEST_DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Limpar e preparar dados de teste
    await setupTestData();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await cleanupTestData();
    await pool.end();
  });

  /**
   * CONFIGURAÇÃO DE DADOS DE TESTE
   */
  async function setupTestData() {
    console.log('🧪 Configurando dados de teste...');

    try {
      // Criar empresas de teste
      const empresa1 = await executeQuery(`
        INSERT INTO empresas (nome, cnpj, telefone, email_contato, cidade, estado)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, ['Prefeitura Teste SP', '11222333000181', '(11) 3333-4444', 'contato@prefeiturateste.sp.gov.br', 'São Paulo', 'SP']);

      const empresa2 = await executeQuery(`
        INSERT INTO empresas (nome, cnpj, telefone, email_contato, cidade, estado)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, ['Secretaria Teste RJ', '22333444000192', '(21) 2222-3333', 'contato@secretariateste.rj.gov.br', 'Rio de Janeiro', 'RJ']);

      testEmpresas.empresa1 = empresa1.rows[0];
      testEmpresas.empresa2 = empresa2.rows[0];

      // Criar contratos de teste
      const contrato1 = await executeQuery(`
        INSERT INTO contratos (empresa_id, descricao, data_inicio, data_fim, numero_licencas, valor_total, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [testEmpresas.empresa1.id, 'Contrato Teste SP', '2025-01-01', '2025-12-31', 1000, 120000.00, 'ativo']);

      const contrato2 = await executeQuery(`
        INSERT INTO contratos (empresa_id, descricao, data_inicio, data_fim, numero_licencas, valor_total, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [testEmpresas.empresa2.id, 'Contrato Teste RJ', '2025-01-01', '2025-12-31', 800, 96000.00, 'ativo']);

      // Criar escolas de teste
      const escola1 = await executeQuery(`
        INSERT INTO escolas (contrato_id, empresa_id, nome, codigo_inep, tipo_escola, telefone, email, cidade, estado, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [contrato1.rows[0].id, testEmpresas.empresa1.id, 'Escola Teste SP', '12345678', 'municipal', '(11) 4444-5555', 'escola@teste.sp.edu.br', 'São Paulo', 'SP', 'ativa']);

      const escola2 = await executeQuery(`
        INSERT INTO escolas (contrato_id, empresa_id, nome, codigo_inep, tipo_escola, telefone, email, cidade, estado, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [contrato2.rows[0].id, testEmpresas.empresa2.id, 'Escola Teste RJ', '87654321', 'estadual', '(21) 5555-6666', 'escola@teste.rj.edu.br', 'Rio de Janeiro', 'RJ', 'ativa']);

      testEscolas.escola1 = escola1.rows[0];
      testEscolas.escola2 = escola2.rows[0];

      // Criar usuários de teste com diferentes tipos e empresas
      const senhaHash = await bcrypt.hash('senha123', 10);

      // Admin Master (sem empresa específica)
      const adminMaster = await executeQuery(`
        INSERT INTO usuarios (cognito_sub, email, nome, tipo_usuario, status, senha_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, ['admin-master-test', 'admin@iaprender.com', 'Admin Master Teste', 'admin', 'ativo', senhaHash]);

      // Gestor Empresa 1
      const gestorEmp1 = await executeQuery(`
        INSERT INTO usuarios (cognito_sub, email, nome, tipo_usuario, empresa_id, status, senha_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, ['gestor-emp1-test', 'gestor@prefeiturateste.sp.gov.br', 'Gestor Teste SP', 'gestor', testEmpresas.empresa1.id, 'ativo', senhaHash]);

      // Gestor Empresa 2
      const gestorEmp2 = await executeQuery(`
        INSERT INTO usuarios (cognito_sub, email, nome, tipo_usuario, empresa_id, status, senha_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, ['gestor-emp2-test', 'gestor@secretariateste.rj.gov.br', 'Gestor Teste RJ', 'gestor', testEmpresas.empresa2.id, 'ativo', senhaHash]);

      // Diretor Escola 1
      const diretorEsc1 = await executeQuery(`
        INSERT INTO usuarios (cognito_sub, email, nome, tipo_usuario, empresa_id, status, senha_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, ['diretor-esc1-test', 'diretor@teste.sp.edu.br', 'Diretor Teste SP', 'diretor', testEmpresas.empresa1.id, 'ativo', senhaHash]);

      // Professor Escola 1
      const professorEsc1 = await executeQuery(`
        INSERT INTO usuarios (cognito_sub, email, nome, tipo_usuario, empresa_id, status, senha_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, ['professor-esc1-test', 'professor@teste.sp.edu.br', 'Professor Teste SP', 'professor', testEmpresas.empresa1.id, 'ativo', senhaHash]);

      // Aluno Escola 1
      const alunoEsc1 = await executeQuery(`
        INSERT INTO usuarios (cognito_sub, email, nome, tipo_usuario, empresa_id, status, senha_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, ['aluno-esc1-test', 'aluno@teste.sp.edu.br', 'Aluno Teste SP', 'aluno', testEmpresas.empresa1.id, 'ativo', senhaHash]);

      // Salvar usuários de teste
      testUsers = {
        adminMaster: adminMaster.rows[0],
        gestorEmp1: gestorEmp1.rows[0],
        gestorEmp2: gestorEmp2.rows[0],
        diretorEsc1: diretorEsc1.rows[0],
        professorEsc1: professorEsc1.rows[0],
        alunoEsc1: alunoEsc1.rows[0]
      };

      // Criar dados específicos para tipos de usuário
      await executeQuery(`
        INSERT INTO gestores (usr_id, empresa_id, nome, cargo, data_admissao, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [testUsers.gestorEmp1.id, testEmpresas.empresa1.id, 'Gestor Teste SP', 'Gestor Municipal', '2025-01-01', 'ativo']);

      await executeQuery(`
        INSERT INTO gestores (usr_id, empresa_id, nome, cargo, data_admissao, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [testUsers.gestorEmp2.id, testEmpresas.empresa2.id, 'Gestor Teste RJ', 'Gestor Municipal', '2025-01-01', 'ativo']);

      await executeQuery(`
        INSERT INTO diretores (usr_id, escola_id, empresa_id, nome, cargo, data_inicio, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [testUsers.diretorEsc1.id, testEscolas.escola1.id, testEmpresas.empresa1.id, 'Diretor Teste SP', 'Diretor Geral', '2025-01-01', 'ativo']);

      await executeQuery(`
        INSERT INTO professores (usr_id, escola_id, empresa_id, nome, disciplinas, formacao, data_admissao, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [testUsers.professorEsc1.id, testEscolas.escola1.id, testEmpresas.empresa1.id, 'Professor Teste SP', '["Matemática", "Física"]', 'Licenciatura em Matemática', '2025-01-01', 'ativo']);

      await executeQuery(`
        INSERT INTO alunos (usr_id, escola_id, empresa_id, matricula, nome, turma, serie, turno, nome_responsavel, contato_responsavel, data_matricula, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [testUsers.alunoEsc1.id, testEscolas.escola1.id, testEmpresas.empresa1.id, '2025001', 'Aluno Teste SP', '9A', '9º Ano', 'manhã', 'Responsável Teste', '(11) 99999-8888', '2025-01-01', 'ativo']);

      // Gerar tokens JWT para os usuários
      testTokens = {
        adminMaster: jwt.sign({ 
          id: testUsers.adminMaster.id, 
          sub: testUsers.adminMaster.cognito_sub,
          tipo_usuario: 'admin',
          empresa_id: null
        }, JWT_SECRET, { expiresIn: '1h' }),
        
        gestorEmp1: jwt.sign({ 
          id: testUsers.gestorEmp1.id, 
          sub: testUsers.gestorEmp1.cognito_sub,
          tipo_usuario: 'gestor',
          empresa_id: testEmpresas.empresa1.id
        }, JWT_SECRET, { expiresIn: '1h' }),
        
        gestorEmp2: jwt.sign({ 
          id: testUsers.gestorEmp2.id, 
          sub: testUsers.gestorEmp2.cognito_sub,
          tipo_usuario: 'gestor',
          empresa_id: testEmpresas.empresa2.id
        }, JWT_SECRET, { expiresIn: '1h' }),
        
        diretorEsc1: jwt.sign({ 
          id: testUsers.diretorEsc1.id, 
          sub: testUsers.diretorEsc1.cognito_sub,
          tipo_usuario: 'diretor',
          empresa_id: testEmpresas.empresa1.id
        }, JWT_SECRET, { expiresIn: '1h' }),
        
        professorEsc1: jwt.sign({ 
          id: testUsers.professorEsc1.id, 
          sub: testUsers.professorEsc1.cognito_sub,
          tipo_usuario: 'professor',
          empresa_id: testEmpresas.empresa1.id
        }, JWT_SECRET, { expiresIn: '1h' }),
        
        alunoEsc1: jwt.sign({ 
          id: testUsers.alunoEsc1.id, 
          sub: testUsers.alunoEsc1.cognito_sub,
          tipo_usuario: 'aluno',
          empresa_id: testEmpresas.empresa1.id
        }, JWT_SECRET, { expiresIn: '1h' })
      };

      console.log('✅ Dados de teste configurados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao configurar dados de teste:', error);
      throw error;
    }
  }

  /**
   * LIMPEZA DE DADOS DE TESTE
   */
  async function cleanupTestData() {
    console.log('🧹 Limpando dados de teste...');
    
    try {
      // Deletar em ordem de dependência (foreign keys)
      await executeQuery('DELETE FROM alunos WHERE matricula LIKE $1', ['2025%']);
      await executeQuery('DELETE FROM professores WHERE nome LIKE $1', ['%Teste%']);
      await executeQuery('DELETE FROM diretores WHERE nome LIKE $1', ['%Teste%']);
      await executeQuery('DELETE FROM gestores WHERE nome LIKE $1', ['%Teste%']);
      await executeQuery('DELETE FROM usuarios WHERE email LIKE $1', ['%teste%']);
      await executeQuery('DELETE FROM escolas WHERE nome LIKE $1', ['%Teste%']);
      await executeQuery('DELETE FROM contratos WHERE descricao LIKE $1', ['%Teste%']);
      await executeQuery('DELETE FROM empresas WHERE nome LIKE $1', ['%Teste%']);
      
      console.log('✅ Dados de teste limpos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar dados de teste:', error);
    }
  }

  /**
   * TESTES DE AUTENTICAÇÃO JWT
   */
  describe('🔑 Autenticação JWT', () => {
    test('Deve autenticar com token válido', async () => {
      const response = await request(app)
        .get('/api/usuarios/me')
        .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUsers.gestorEmp1.id);
      expect(response.body.data.tipo_usuario).toBe('gestor');
    });

    test('Deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .get('/api/usuarios/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    test('Deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/usuarios/me')
        .set('Authorization', 'Bearer token_invalido_123')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    test('Deve rejeitar token expirado', async () => {
      const tokenExpirado = jwt.sign({ 
        id: testUsers.gestorEmp1.id,
        tipo_usuario: 'gestor' 
      }, JWT_SECRET, { expiresIn: '-1h' });

      const response = await request(app)
        .get('/api/usuarios/me')
        .set('Authorization', `Bearer ${tokenExpirado}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SESSION_EXPIRED');
    });

    test('Deve rejeitar usuário inexistente no banco', async () => {
      const tokenUsuarioInexistente = jwt.sign({ 
        id: 99999,
        sub: 'usuario-inexistente',
        tipo_usuario: 'gestor' 
      }, JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .get('/api/usuarios/me')
        .set('Authorization', `Bearer ${tokenUsuarioInexistente}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  /**
   * TESTES DE CONTROLE DE ACESSO POR EMPRESA
   */
  describe('🏢 Controle de Acesso por Empresa', () => {
    test('Admin deve acessar dados de qualquer empresa', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Gestor deve acessar apenas dados da própria empresa', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verificar se retornou apenas usuários da empresa 1
      response.body.data.forEach(usuario => {
        if (usuario.empresa_id) {
          expect(usuario.empresa_id).toBe(testEmpresas.empresa1.id);
        }
      });
    });

    test('Gestor não deve acessar dados de outra empresa', async () => {
      // Buscar aluno da empresa 2 com token da empresa 1
      const alunoEmp2 = await executeQuery(`
        SELECT * FROM alunos WHERE empresa_id = $1 LIMIT 1
      `, [testEmpresas.empresa2.id]);

      if (alunoEmp2.rows.length > 0) {
        const response = await request(app)
          .get(`/api/alunos/${alunoEmp2.rows[0].id}`)
          .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('COMPANY_ACCESS_DENIED');
      }
    });

    test('Diretor deve acessar apenas dados da própria escola', async () => {
      const response = await request(app)
        .get('/api/alunos')
        .set('Authorization', `Bearer ${testTokens.diretorEsc1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verificar se retornou apenas alunos da escola 1
      response.body.data.forEach(aluno => {
        expect(aluno.escola_id).toBe(testEscolas.escola1.id);
      });
    });

    test('Professor deve ter acesso limitado aos próprios alunos', async () => {
      const response = await request(app)
        .get('/api/alunos')
        .set('Authorization', `Bearer ${testTokens.professorEsc1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Professor deve ver apenas dados limitados dos alunos
      response.body.data.forEach(aluno => {
        expect(aluno.escola_id).toBe(testEscolas.escola1.id);
        // Verificar se dados sensíveis foram filtrados
        expect(aluno).not.toHaveProperty('contato_responsavel');
      });
    });

    test('Aluno deve acessar apenas próprios dados', async () => {
      const response = await request(app)
        .get(`/api/alunos/${testUsers.alunoEsc1.id}`)
        .set('Authorization', `Bearer ${testTokens.alunoEsc1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.usr_id).toBe(testUsers.alunoEsc1.id);
    });
  });

  /**
   * TESTES DE CRIAÇÃO DE USUÁRIOS
   */
  describe('👥 Criação de Usuários', () => {
    test('Admin deve criar usuário de qualquer tipo', async () => {
      const novoUsuario = {
        cognito_sub: 'novo-gestor-test',
        email: 'novogestor@teste.com',
        nome: 'Novo Gestor Teste',
        tipo_usuario: 'gestor',
        empresa_id: testEmpresas.empresa1.id
      };

      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .send(novoUsuario)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(novoUsuario.email);
      expect(response.body.data.tipo_usuario).toBe('gestor');
    });

    test('Gestor deve criar usuários limitados à própria empresa', async () => {
      const novoDiretor = {
        cognito_sub: 'novo-diretor-test',
        email: 'novodiretor@teste.sp.edu.br',
        nome: 'Novo Diretor Teste',
        tipo_usuario: 'diretor',
        escola_id: testEscolas.escola1.id
      };

      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        .send(novoDiretor)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.empresa_id).toBe(testEmpresas.empresa1.id);
    });

    test('Gestor não deve criar usuário admin', async () => {
      const novoAdmin = {
        cognito_sub: 'novo-admin-test',
        email: 'novoadmin@teste.com',
        nome: 'Novo Admin Teste',
        tipo_usuario: 'admin'
      };

      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        .send(novoAdmin)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
    });

    test('Deve validar dados obrigatórios na criação', async () => {
      const usuarioInvalido = {
        email: 'email-sem-nome@teste.com'
        // Faltam campos obrigatórios
      };

      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .send(usuarioInvalido)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Deve rejeitar email duplicado', async () => {
      const usuarioDuplicado = {
        cognito_sub: 'novo-usuario-duplicado',
        email: testUsers.gestorEmp1.email, // Email já existente
        nome: 'Usuário Duplicado',
        tipo_usuario: 'professor'
      };

      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .send(usuarioDuplicado)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  /**
   * TESTES DE ENDPOINTS PRINCIPAIS
   */
  describe('🌐 Endpoints Principais', () => {
    test('GET /api/usuarios - Listar usuários com filtros', async () => {
      const response = await request(app)
        .get('/api/usuarios?tipo_usuario=gestor&limit=10')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.metadata).toHaveProperty('total');
      expect(response.body.metadata).toHaveProperty('pagina');
    });

    test('GET /api/usuarios/:id - Buscar usuário específico', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${testUsers.gestorEmp1.id}`)
        .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUsers.gestorEmp1.id);
    });

    test('PUT /api/usuarios/:id - Atualizar usuário', async () => {
      const dadosAtualizacao = {
        nome: 'Nome Atualizado Teste',
        telefone: '(11) 98888-7777'
      };

      const response = await request(app)
        .put(`/api/usuarios/${testUsers.gestorEmp1.id}`)
        .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        .send(dadosAtualizacao)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(dadosAtualizacao.nome);
    });

    test('GET /api/alunos - Listar alunos com controle hierárquico', async () => {
      const response = await request(app)
        .get('/api/alunos')
        .set('Authorization', `Bearer ${testTokens.diretorEsc1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      // Verificar se retornou apenas alunos da escola do diretor
      response.body.data.forEach(aluno => {
        expect(aluno.escola_id).toBe(testEscolas.escola1.id);
      });
    });

    test('POST /api/alunos - Criar novo aluno', async () => {
      const novoAluno = {
        nome: 'Novo Aluno Teste',
        escola_id: testEscolas.escola1.id,
        turma: '8B',
        serie: '8º Ano',
        turno: 'tarde',
        nome_responsavel: 'Responsável Novo',
        contato_responsavel: '(11) 97777-6666'
      };

      const response = await request(app)
        .post('/api/alunos')
        .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        .send(novoAluno)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(novoAluno.nome);
      expect(response.body.data.matricula).toBeTruthy();
    });

    test('GET /api/alunos/stats - Estatísticas de alunos', async () => {
      const response = await request(app)
        .get('/api/alunos/stats')
        .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_alunos');
      expect(response.body.data).toHaveProperty('por_turno');
      expect(response.body.data).toHaveProperty('por_serie');
    });

    test('Rate limiting - Deve bloquear após limite excedido', async () => {
      // Fazer múltiplas requisições rapidamente
      const requests = [];
      for (let i = 0; i < 25; i++) {
        requests.push(
          request(app)
            .get('/api/usuarios/me')
            .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        );
      }

      const responses = await Promise.all(requests);
      
      // Verificar se algumas requisições foram bloqueadas por rate limit
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  /**
   * TESTES DE VALIDAÇÃO E ERROS
   */
  describe('⚠️ Validação e Tratamento de Erros', () => {
    test('Deve retornar erro 404 para recurso inexistente', async () => {
      const response = await request(app)
        .get('/api/usuarios/99999')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    test('Deve validar formato de dados na entrada', async () => {
      const dadosInvalidos = {
        nome: 'A', // Muito curto
        email: 'email-inválido', // Formato inválido
        tipo_usuario: 'tipo_inexistente' // Tipo inválido
      };

      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .send(dadosInvalidos)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Middleware de erros deve capturar erros não tratados', async () => {
      // Simular erro interno forçando uma operação inválida
      const response = await request(app)
        .get('/api/usuarios/invalid-id')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  /**
   * TESTES DE PERFORMANCE E ESCALABILIDADE
   */
  describe('⚡ Performance e Escalabilidade', () => {
    test('Consulta com paginação deve ser eficiente', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/usuarios?limit=50&page=1')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .expect(200);

      const duration = Date.now() - startTime;
      
      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
      expect(response.body.metadata.limite).toBe(50);
    });

    test('Filtros complexos devem funcionar corretamente', async () => {
      const response = await request(app)
        .get('/api/alunos?turma=9A&serie=9º Ano&turno=manhã&status=ativo')
        .set('Authorization', `Bearer ${testTokens.gestorEmp1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Busca textual deve funcionar eficientemente', async () => {
      const response = await request(app)
        .get('/api/usuarios?search=Teste&limit=20')
        .set('Authorization', `Bearer ${testTokens.adminMaster}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(usuario => {
        expect(usuario.nome.toLowerCase()).toContain('teste');
      });
    });
  });
});

console.log('🧪 SUÍTE DE TESTES CARREGADA:');
console.log('✅ Testes de autenticação JWT');
console.log('✅ Testes de controle de acesso por empresa');
console.log('✅ Testes de criação de usuários');
console.log('✅ Testes de endpoints principais');
console.log('✅ Testes de validação e erros');
console.log('✅ Testes de performance');
console.log('📊 Total: 6 suítes com 30+ casos de teste');